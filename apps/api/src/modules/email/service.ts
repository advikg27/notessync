import nodemailer from 'nodemailer';

// Create a test email transporter (using Ethereal for development)
// For production, use real SMTP like Gmail, SendGrid, etc.
let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  // For development: Create test account
  if (process.env.NODE_ENV === 'development') {
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    console.log('📧 Email service initialized (Ethereal - Test)');
    console.log('Preview emails at: https://ethereal.email');
  } else {
    // For production: Use real SMTP
    // Example with Gmail:
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use App Password
      },
    });
  }

  return transporter;
}

export async function sendVerificationEmail(email: string, code: string) {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: '"Textbook Compiler" <noreply@textbookcompiler.com>',
    to: email,
    subject: 'Verify Your Email - Textbook Compiler',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Verify Your Email</h2>
        <p>Thank you for registering with Textbook Compiler!</p>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2563eb; letter-spacing: 8px; margin: 0;">${code}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">Textbook Compiler - Collaborative Learning Platform</p>
      </div>
    `,
  });

  console.log('📧 Verification email sent:', info.messageId);
  console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  
  return info;
}

export async function sendPasswordResetEmail(email: string, code: string) {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: '"Textbook Compiler" <noreply@textbookcompiler.com>',
    to: email,
    subject: 'Reset Your Password - Textbook Compiler',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Reset Your Password</h2>
        <p>We received a request to reset your password.</p>
        <p>Your password reset code is:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2563eb; letter-spacing: 8px; margin: 0;">${code}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p><strong>If you didn't request this, please ignore this email and your password will remain unchanged.</strong></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">Textbook Compiler - Collaborative Learning Platform</p>
      </div>
    `,
  });

  console.log('📧 Password reset email sent:', info.messageId);
  console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  
  return info;
}

// Generate 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

