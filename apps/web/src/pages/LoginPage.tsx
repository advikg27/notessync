import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../utils/api';
import { clearQueryCache } from '../utils/clearUserData';
import { FiZap, FiMail, FiLock, FiArrowRight } from 'react-icons/fi';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      
      // Clear any previous user's cached data before logging in
      console.log('🔄 Logging in - clearing previous cache');
      clearQueryCache();
      
      setAuth(response.data.user, response.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
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
            Welcome Back
          </h1>
          <p className="text-gray-400 text-lg">
            Sign in to continue to NoteSync
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-strong rounded-2xl p-8 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-fadeIn">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              {!loading && <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            </button>
          </form>

          <div className="divider-glow my-6"></div>

          <p className="text-center text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <div className="glass p-4 rounded-xl text-center">
            <div className="text-2xl mb-1">⚡</div>
            <p className="text-xs text-gray-400">Fast</p>
          </div>
          <div className="glass p-4 rounded-xl text-center">
            <div className="text-2xl mb-1">🔒</div>
            <p className="text-xs text-gray-400">Secure</p>
          </div>
          <div className="glass p-4 rounded-xl text-center">
            <div className="text-2xl mb-1">🎨</div>
            <p className="text-xs text-gray-400">Beautiful</p>
          </div>
        </div>
      </div>
    </div>
  );
}
