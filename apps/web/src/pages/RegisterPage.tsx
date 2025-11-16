import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi, api } from '../utils/api';
import { clearAllUserData } from '../utils/clearUserData';
import { FiBook, FiMail, FiArrowLeft } from 'react-icons/fi';

export function RegisterPage() {
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if email looks like a real domain
    const domain = email.split('@')[1];
    if (!domain || domain.split('.').length < 2) {
      setError('Please enter a valid email with a real domain (e.g., gmail.com)');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.register({ name, email, password });
      
      // Store verification code from dev mode
      if (response.data.verificationCode) {
        setVerificationCode(response.data.verificationCode);
      }
      
      // IMPORTANT: Clear ALL data before setting new auth
      console.log('🧹 New registration - clearing all previous user data');
      clearAllUserData();
      
      // Now set the new user auth
      setAuth(response.data.user, response.data.token);

      // Move to verification step
      setStep('verify');
      setSuccess(response.data.message || 'Registration successful! Check your email for verification code.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/auth/verify-email', {
        email,
        code: userCode,
      });
      
      setSuccess('Email verified successfully! Redirecting...');
      
      // Redirect to home after 1 second
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth/resend-verification', { email });
      
      if (response.data.verificationCode) {
        setVerificationCode(response.data.verificationCode);
      }
      
      setSuccess('Verification code resent! Check your email.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipVerification = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <FiBook className="w-16 h-16 text-blue-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          {step === 'register' ? 'Create Account' : 'Verify Email'}
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {step === 'register' 
            ? 'Join Textbook Compiler and start collaborating'
            : 'Enter the verification code sent to your email'
          }
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {step === 'register' ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min 6 characters"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>

            <p className="text-center text-gray-600 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  autoFocus
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Sent to: <strong>{email}</strong>
                </p>
                {verificationCode && (
                  <p className="text-sm text-blue-600 mt-1">
                    Dev mode code: <strong>{verificationCode}</strong>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            <div className="mt-4 space-y-2">
              <button
                onClick={handleResendCode}
                disabled={loading}
                className="w-full text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                <FiMail className="inline mr-1" />
                Resend verification code
              </button>
              <button
                onClick={handleSkipVerification}
                className="w-full text-sm text-gray-600 hover:text-gray-700"
              >
                Skip for now (you can verify later)
              </button>
            </div>

            <p className="text-center text-gray-600 mt-6 text-sm">
              <button
                onClick={() => setStep('register')}
                className="text-blue-600 hover:text-blue-700"
              >
                <FiArrowLeft className="inline mr-1" />
                Back to registration
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
