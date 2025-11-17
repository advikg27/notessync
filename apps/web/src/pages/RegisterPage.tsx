import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi, api } from '../utils/api';
import { clearAllUserData } from '../utils/clearUserData';
import { FiZap, FiMail, FiArrowLeft, FiUser, FiLock, FiCheck, FiArrowRight } from 'react-icons/fi';

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-block relative mb-4 animate-float">
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-40"></div>
            <FiZap className="relative w-20 h-20 text-blue-500 glow-blue" />
          </div>
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
            {step === 'register' ? 'Create Account' : 'Verify Email'}
          </h1>
          <p className="text-gray-400 text-lg">
            {step === 'register' 
              ? 'Join NoteSync and start collaborating'
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

          {step === 'register' ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiUser className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiLock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12"
                      placeholder="Min 6 characters"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
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
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span>{loading ? 'Creating account...' : 'Sign Up'}</span>
                  {!loading && <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                </button>
              </form>

              <div className="divider-glow my-6"></div>

              <p className="text-center text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <form onSubmit={handleVerify} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    className="w-full text-center text-3xl tracking-[0.5em] font-mono"
                    placeholder="000000"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    autoFocus
                    required
                  />
                  <p className="text-sm text-gray-400 mt-3 text-center">
                    Sent to: <strong className="text-white">{email}</strong>
                  </p>
                  {verificationCode && (
                    <div className="mt-3 p-3 glass rounded-xl border border-blue-500/30">
                      <p className="text-sm text-blue-300 text-center">
                        Dev mode code: <strong className="text-blue-200">{verificationCode}</strong>
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 group"
                >
                  <span>{loading ? 'Verifying...' : 'Verify Email'}</span>
                  {!loading && <FiCheck className="w-5 h-5" />}
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                </button>
              </form>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleResendCode}
                  disabled={loading}
                  className="w-full btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <FiMail className="w-4 h-4" />
                  <span>Resend verification code</span>
                </button>
                <button
                  onClick={handleSkipVerification}
                  className="w-full text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Skip for now (you can verify later)
                </button>
              </div>

              <div className="divider-glow my-6"></div>

              <p className="text-center text-sm">
                <button
                  onClick={() => setStep('register')}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center space-x-1"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  <span>Back to registration</span>
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
