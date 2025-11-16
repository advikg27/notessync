import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { hashPassword } from '../modules/auth/password';
import { prisma } from '../storage/db';
import { sendVerificationEmail, sendPasswordResetEmail, generateVerificationCode } from '../modules/email/service';

const requestResetSchema = z.object({
  email: z.string().email(),
});

const verifyResetSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(6),
});

const resendVerificationSchema = z.object({
  email: z.string().email(),
});

export async function authExtendedRoutes(fastify: FastifyInstance) {
  // Request password reset
  fastify.post('/forgot-password', async (request, reply) => {
    try {
      const body = requestResetSchema.parse(request.body);

      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });

      // Always return success (don't reveal if email exists)
      if (!user) {
        return reply.send({ 
          message: 'If that email exists, a reset code has been sent' 
        });
      }

      // Generate reset code
      const resetCode = generateVerificationCode();
      const resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save code to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetCode,
          resetCodeExpiry,
        },
      });

      // Send email
      try {
        await sendPasswordResetEmail(body.email, resetCode);
      } catch (emailError) {
        fastify.log.error('Failed to send reset email:', emailError);
        // Continue anyway - code is saved in database
      }

      return reply.send({ 
        message: 'If that email exists, a reset code has been sent',
        // In development, show the code
        ...(process.env.NODE_ENV === 'development' && { resetCode })
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Reset password with code
  fastify.post('/reset-password', async (request, reply) => {
    try {
      const body = verifyResetSchema.parse(request.body);

      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user || !user.resetCode || !user.resetCodeExpiry) {
        return reply.status(400).send({ error: 'Invalid or expired reset code' });
      }

      // Check if code expired
      if (new Date() > user.resetCodeExpiry) {
        return reply.status(400).send({ error: 'Reset code has expired' });
      }

      // Verify code
      if (user.resetCode !== body.code) {
        return reply.status(400).send({ error: 'Invalid reset code' });
      }

      // Hash new password
      const passwordHash = await hashPassword(body.newPassword);

      // Update password and clear reset code
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetCode: null,
          resetCodeExpiry: null,
        },
      });

      return reply.send({ message: 'Password reset successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Resend verification email
  fastify.post('/resend-verification', async (request, reply) => {
    try {
      const body = resendVerificationSchema.parse(request.body);

      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user) {
        return reply.send({ message: 'If that email exists, a verification code has been sent' });
      }

      if (user.emailVerified) {
        return reply.status(400).send({ error: 'Email is already verified' });
      }

      // Generate new verification code
      const verificationCode = generateVerificationCode();
      const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationCode,
          verificationExpiry,
        },
      });

      // Send email
      try {
        await sendVerificationEmail(body.email, verificationCode);
      } catch (emailError) {
        fastify.log.error('Failed to send verification email:', emailError);
      }

      return reply.send({ 
        message: 'Verification code sent',
        ...(process.env.NODE_ENV === 'development' && { verificationCode })
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Verify email with code
  fastify.post('/verify-email', async (request, reply) => {
    try {
      const { email, code } = request.body as any;

      if (!email || !code) {
        return reply.status(400).send({ error: 'Email and code required' });
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.verificationCode || !user.verificationExpiry) {
        return reply.status(400).send({ error: 'Invalid or expired verification code' });
      }

      // Check if code expired
      if (new Date() > user.verificationExpiry) {
        return reply.status(400).send({ error: 'Verification code has expired' });
      }

      // Verify code
      if (user.verificationCode !== code) {
        return reply.status(400).send({ error: 'Invalid verification code' });
      }

      // Mark email as verified
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationCode: null,
          verificationExpiry: null,
        },
      });

      return reply.send({ message: 'Email verified successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}

