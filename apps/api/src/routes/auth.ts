import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../modules/auth/password';
import { prisma } from '../storage/db';
import { sendVerificationEmail, generateVerificationCode } from '../modules/email/service';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (existingUser) {
        return reply.status(409).send({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await hashPassword(body.password);

      // Generate verification code
      const verificationCode = generateVerificationCode();
      const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create user
      const user = await prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          passwordHash,
          verificationCode,
          verificationExpiry,
          emailVerified: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      // Send verification email (async, don't wait)
      sendVerificationEmail(body.email, verificationCode).catch(err => {
        fastify.log.error('Failed to send verification email:', err);
      });

      // Generate token
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
      });

      return reply.status(201).send({
        user,
        token,
        message: 'Registration successful! Please check your email for verification code.',
        // In development, show the code
        ...(process.env.NODE_ENV === 'development' && { verificationCode }),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValid = await verifyPassword(body.password, user.passwordHash);

      if (!isValid) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
      });

      return reply.send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
        },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get current user
  fastify.get('/me', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: (request.user as any).id },
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return reply.send({ user });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Change password
  fastify.post('/change-password', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { currentPassword, newPassword } = request.body as any;

      if (!currentPassword || !newPassword) {
        return reply.status(400).send({ error: 'Current and new password required' });
      }

      if (newPassword.length < 6) {
        return reply.status(400).send({ error: 'New password must be at least 6 characters' });
      }

      const userId = (request.user as any).id;

      // Get user with password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Verify current password
      const isValid = await verifyPassword(currentPassword, user.passwordHash);

      if (!isValid) {
        return reply.status(401).send({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
        },
      });

      return reply.send({ message: 'Password changed successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Upload profile picture
  fastify.post('/profile-picture', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { image } = request.body as any;

      if (!image) {
        return reply.status(400).send({ error: 'Image data required' });
      }

      // Validate base64 image (should start with data:image/)
      if (!image.startsWith('data:image/')) {
        return reply.status(400).send({ error: 'Invalid image format. Must be a base64 encoded image.' });
      }

      // Check size (limit to ~5MB base64)
      if (image.length > 7000000) {
        return reply.status(400).send({ error: 'Image too large. Maximum size is 5MB.' });
      }

      const userId = (request.user as any).id;

      // Update user profile picture
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          profilePicture: image,
        },
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true,
        },
      });

      return reply.send({ 
        message: 'Profile picture uploaded successfully',
        user,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Delete profile picture
  fastify.delete('/profile-picture', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).id;

      // Remove profile picture
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          profilePicture: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true,
        },
      });

      return reply.send({ 
        message: 'Profile picture deleted successfully',
        user,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}

