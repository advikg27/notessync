# Email Authentication & Verification Guide

## 🎉 New Features Implemented

### 1. Email Verification on Registration
- When users register, they receive a 6-digit verification code via email
- Users must enter this code to verify their email address
- Code expires in 10 minutes
- Users can resend the code if needed

### 2. Password Reset (Forgot Password)
- Users can request a password reset by entering their email
- They receive a 6-digit reset code via email
- Users enter the code along with their new password
- Code expires in 10 minutes
- Secure process that doesn't reveal if email exists in system

### 3. Password Change (Settings)
- Logged-in users can change their password from the Settings page
- Must provide current password for verification
- New password must be at least 6 characters

### 4. Enhanced Email Validation
- Email format validation (must be valid email)
- Domain validation (must have real domain like gmail.com)
- Prevents fake/invalid emails

### 5. Complete Data Isolation Between Users
- All localStorage is cleared on logout
- All sessionStorage is cleared on logout
- React Query cache is cleared on logout
- No data leakage between user sessions

---

## 📧 Email Service Configuration

### Development Mode (Current Setup)
- Uses **Ethereal Email** (fake SMTP for testing)
- Emails are NOT actually sent to real inboxes
- Verification codes are displayed in:
  - Console logs (check terminal)
  - API response (in development only)
  - Frontend UI (in development only)

### Production Setup (Future)
To use real email in production, update `/apps/api/src/modules/email/service.ts`:

```typescript
// For Gmail
transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,      // your-email@gmail.com
    pass: process.env.EMAIL_PASSWORD,   // App Password from Google
  },
});
```

Then add to `.env`:
```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
NODE_ENV=production
```

**Note:** For Gmail, you need to create an "App Password" (not your regular password):
1. Go to Google Account Settings
2. Security → 2-Step Verification
3. App Passwords → Generate new password
4. Use that password in `EMAIL_PASSWORD`

---

## 🔐 New API Endpoints

### 1. Register (Modified)
**POST** `/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com", "emailVerified": false },
  "token": "jwt-token",
  "message": "Registration successful! Please check your email for verification code.",
  "verificationCode": "123456"  // Only in development
}
```

### 2. Verify Email
**POST** `/auth/verify-email`
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

Response:
```json
{
  "message": "Email verified successfully"
}
```

### 3. Resend Verification Code
**POST** `/auth/resend-verification`
```json
{
  "email": "john@example.com"
}
```

Response:
```json
{
  "message": "Verification code sent",
  "verificationCode": "123456"  // Only in development
}
```

### 4. Forgot Password (Request Reset)
**POST** `/auth/forgot-password`
```json
{
  "email": "john@example.com"
}
```

Response:
```json
{
  "message": "If that email exists, a reset code has been sent",
  "resetCode": "123456"  // Only in development
}
```

### 5. Reset Password (With Code)
**POST** `/auth/reset-password`
```json
{
  "email": "john@example.com",
  "code": "123456",
  "newPassword": "newpassword123"
}
```

Response:
```json
{
  "message": "Password reset successfully"
}
```

### 6. Change Password (Authenticated)
**POST** `/auth/change-password`
```
Headers: Authorization: Bearer <jwt-token>
```
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

Response:
```json
{
  "message": "Password changed successfully"
}
```

---

## 🎨 New Frontend Pages

### 1. Register Page (Enhanced)
- **Path:** `/register`
- Two-step process:
  1. Enter name, email, password
  2. Enter verification code sent to email
- Can resend code if not received
- Can skip verification (access app but email not verified)

### 2. Forgot Password Page (New)
- **Path:** `/forgot-password`
- Two-step process:
  1. Enter email address
  2. Enter reset code + new password
- Link available on login page

### 3. Settings Page (Enhanced)
- **Path:** `/settings`
- Change password form
- Requires current password for security
- Link in user menu (header)

---

## 🗄️ Database Schema Updates

New fields added to `User` model:

```prisma
model User {
  id                    String    @id @default(cuid())
  name                  String
  email                 String    @unique
  passwordHash          String
  emailVerified         Boolean   @default(false)      // NEW
  verificationCode      String?                        // NEW
  verificationExpiry    DateTime?                      // NEW
  resetCode             String?                        // NEW
  resetCodeExpiry       DateTime?                      // NEW
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // ... relations
}
```

---

## 🧪 Testing the Features

### Test Email Verification

1. **Register a new account:**
   - Go to http://localhost:5173/register
   - Fill in the form with a valid email (e.g., test@gmail.com)
   - Click "Sign Up"

2. **Get the verification code:**
   - Check the terminal where the API is running
   - Look for: `📧 Verification email sent: ...`
   - Look for: `Preview URL: ...` (Ethereal preview link)
   - OR look at the green success message (shows code in dev mode)

3. **Verify email:**
   - Enter the 6-digit code
   - Click "Verify Email"
   - Should redirect to home

### Test Password Reset

1. **Request reset:**
   - Go to http://localhost:5173/forgot-password
   - Enter your email
   - Click "Send Reset Code"

2. **Get the reset code:**
   - Check terminal logs
   - Or look at success message (shows code in dev mode)

3. **Reset password:**
   - Enter the 6-digit code
   - Enter new password twice
   - Click "Reset Password"
   - Login with new password

### Test Password Change

1. **Go to settings:**
   - Login to your account
   - Click "Settings" in the header
   
2. **Change password:**
   - Enter current password
   - Enter new password twice
   - Click "Change Password"
   - Logout and login with new password

### Test Data Isolation

1. **Login as User A:**
   - Create some modules/courses
   
2. **Logout:**
   - Click "Logout"
   - Verify localStorage is cleared (check browser DevTools)

3. **Login as User B:**
   - Should NOT see User A's data
   - Should start with clean slate

---

## 🐛 Troubleshooting

### Email not sending in development
- Check terminal logs for "📧 Email service initialized"
- Verification codes are shown in console and success messages
- This is expected - emails don't actually send in dev mode

### "Invalid verification code" error
- Code expires in 10 minutes
- Check if you typed it correctly
- Click "Resend verification code" to get a new one
- In dev mode, look at the success message for the code

### localStorage not clearing
- This is now fixed!
- On logout, ALL localStorage keys are removed
- sessionStorage is also cleared
- React Query cache is cleared

### Can't reset password
- Make sure you're using a valid email format
- Code expires in 10 minutes
- Check terminal logs for the reset code

---

## 📝 Migration Notes

The database schema was updated. Migration already applied:
- `20251116023539_add_email_verification`

All existing users:
- `emailVerified` = `false` by default
- Can still login normally
- Should verify their email when convenient

---

## 🚀 What's Next?

### Optional Enhancements:
1. **Email templates with HTML/CSS** - Make emails prettier
2. **Rate limiting** - Prevent spam/abuse of email sending
3. **Email provider** - Switch to SendGrid, Mailgun, or AWS SES
4. **Social login** - Google, GitHub OAuth
5. **2FA** - Two-factor authentication
6. **Email notifications** - Course invites, module updates, etc.

---

## 📚 Related Files

### Backend
- `/apps/api/src/modules/email/service.ts` - Email sending logic
- `/apps/api/src/routes/auth-extended.ts` - New auth endpoints
- `/apps/api/src/routes/auth.ts` - Updated registration
- `/apps/api/prisma/schema.prisma` - Database schema

### Frontend
- `/apps/web/src/pages/RegisterPage.tsx` - Registration with verification
- `/apps/web/src/pages/ForgotPasswordPage.tsx` - Password reset flow
- `/apps/web/src/pages/SettingsPage.tsx` - Password change
- `/apps/web/src/pages/LoginPage.tsx` - Added forgot password link
- `/apps/web/src/store/authStore.ts` - Enhanced logout clearing

---

## ✅ Summary

You now have a **complete email-based authentication system** with:

- ✅ Email verification on registration
- ✅ Password reset via email
- ✅ Password change (authenticated)
- ✅ Email validation
- ✅ Complete data isolation between users
- ✅ Development-friendly (codes shown in console)
- ✅ Production-ready (just configure real SMTP)

All emails are currently sent to a test SMTP server (Ethereal) so you can test without sending real emails. The verification codes are displayed in the console and in the UI during development.

**Ready to test!** 🎊

