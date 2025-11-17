import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { FiZap, FiMail, FiLock, FiArrowLeft, FiCheck } from 'react-icons/fi';

export function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccess('Reset code sent to your email! Check your inbox.');
      setStep('code');
      
      // In development, show the code
      if (response.data.resetCode) {
        setSuccess(`Reset code sent! (Dev mode: ${response.data.resetCode})`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        email,
        code,
        newPassword,
      });
      
      setSuccess('Password reset successfully! You can now login.');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-block relative mb-4 animate-float">
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-40"></div>
            <FiZap className="relative w-20 h-20 text-blue-500 glow-blue" />
          </div>
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-gray-400 text-lg">
            {step === 'email' 
              ? 'Enter your email to receive a reset code'
              : 'Enter the code sent to your email'
            }
          </p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-8 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-fadeIn">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 animate-fadeIn">
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full text-center text-3xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                />
                <p className="text-sm text-gray-400 mt-2 text-center">
                  Check your email for the 6-digit code
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12"
                    placeholder="New password (min 6 chars)"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiCheck className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="btn-secondary flex-1 flex items-center justify-center space-x-2"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}

          <div className="divider-glow my-6"></div>

          <div className="text-center space-y-2">
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold block transition-colors">
              Remember your password? Sign in
            </Link>
            <Link to="/register" className="text-gray-400 hover:text-white text-sm block transition-colors">
              Don't have an account? Sign up
            </Link>
          </div>

          <div className="mt-6 p-4 glass rounded-xl border border-blue-500/30">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> The reset code expires in 10 minutes. 
              {process.env.NODE_ENV === 'development' && ' In development, the code is shown in the success message.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
