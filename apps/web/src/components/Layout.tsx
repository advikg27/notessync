import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { FiBook, FiFileText, FiSettings, FiLogOut, FiHome, FiZap } from 'react-icons/fi';

export function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  const handleLogout = () => {
    // Clear React Query cache
    queryClient.clear();
    
    // Clear auth state and localStorage
    logout();
    
    // Navigate to login
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const NavLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 group ${
          active
            ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30'
            : 'text-gray-300 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon className={`w-4 h-4 ${active ? 'animate-pulse-glow' : ''}`} />
        <span>{label}</span>
        {active && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 w-1 h-1 bg-cyan-400 rounded-full blur-sm"></div>
        )}
        {!active && (
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2 group">
                <div className="relative">
                  <FiZap className="w-8 h-8 text-blue-500 glow-blue group-hover:animate-pulse-glow transition-all" />
                  <div className="absolute inset-0 bg-blue-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                </div>
                <span className="text-xl font-bold text-white tracking-tight">
                  NoteSync
                </span>
              </Link>
              
              <nav className="hidden md:flex space-x-2">
                <NavLink to="/" icon={FiHome} label="Home" />
                <NavLink to="/courses" icon={FiBook} label="Courses" />
                <NavLink to="/modules" icon={FiFileText} label="Modules" />
                <NavLink to="/builder" icon={FiZap} label="Builder" />
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-cyan-500/50 shadow-lg"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm border-2 border-cyan-500/50 shadow-lg">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-300 font-medium">
                  {user?.name}
                </span>
              </div>
              <Link
                to="/settings"
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <FiSettings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-red-400 hover:bg-white/5 transition-all group"
              >
                <FiLogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        <Outlet />
      </main>
    </div>
  );
}

