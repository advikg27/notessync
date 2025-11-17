import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi, moduleApi } from '../utils/api';
import { FiBook, FiFileText, FiPlus, FiTrendingUp, FiZap, FiStar, FiClock } from 'react-icons/fi';
import { useState } from 'react';

export function HomePage() {
  const queryClient = useQueryClient();
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [courseName, setCourseName] = useState('');

  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseApi.list(),
  });

  const { data: modulesData } = useQuery({
    queryKey: ['modules', 'recent'],
    queryFn: () => moduleApi.list({ limit: 5 }),
  });

  const createCourseMutation = useMutation({
    mutationFn: (data: { name: string }) => courseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setShowCreateCourse(false);
      setCourseName('');
    },
  });

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (courseName.trim()) {
      createCourseMutation.mutate({ name: courseName });
    }
  };

  const courses = coursesData?.data?.courses || [];
  const recentModules = modulesData?.data?.modules || [];

  return (
    <div className="space-y-8">
      {/* Welcome section with radial glow */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/10 via-transparent to-transparent"></div>
        <div className="card p-12 text-center relative animate-fadeIn radial-glow">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="inline-block mb-4 animate-float">
              <FiZap className="w-16 h-16 text-blue-500 glow-blue" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
              Welcome to NoteSync
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Create modular academic content and compile it into beautiful textbooks with powerful collaboration tools
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setShowCreateCourse(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <FiPlus className="w-5 h-5" />
                <span>New Course</span>
              </button>
              <Link
                to="/modules/new"
                className="btn-secondary flex items-center space-x-2"
              >
                <FiFileText className="w-5 h-5" />
                <span>New Module</span>
              </Link>
              <Link
                to="/builder"
                className="btn-secondary flex items-center space-x-2 group"
              >
                <FiBook className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Build Textbook</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Create Course Modal */}
      {showCreateCourse && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 px-4">
          <div className="glass-strong rounded-2xl p-8 w-full max-w-md animate-fadeIn">
            <h2 className="text-3xl font-bold mb-6 text-white">Create New Course</h2>
            <form onSubmit={handleCreateCourse}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Course Name
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full"
                  placeholder="e.g., Calculus I"
                  autoFocus
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={createCourseMutation.isPending}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateCourse(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats with pulse animation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 animate-pulse-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Courses</p>
              <p className="text-4xl font-bold text-white">{courses.length}</p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-30"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl">
                <FiBook className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 animate-pulse-glow" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Your Modules</p>
              <p className="text-4xl font-bold text-white">{recentModules.length}</p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-30"></div>
              <div className="relative bg-gradient-to-br from-cyan-500 to-cyan-600 p-4 rounded-2xl">
                <FiFileText className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 animate-pulse-glow" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Activity (24h)</p>
              <p className="text-4xl font-bold text-white">
                {recentModules.filter((m: any) => {
                  const updatedAt = new Date(m.updatedAt);
                  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                  return updatedAt > dayAgo;
                }).length}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-violet-500 blur-xl opacity-30"></div>
              <div className="relative bg-gradient-to-br from-violet-500 to-violet-600 p-4 rounded-2xl">
                <FiTrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Glowing divider */}
      <div className="divider-glow"></div>

      {/* Recent Modules */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiStar className="w-5 h-5 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">Recent Modules</h2>
            </div>
            <Link to="/modules" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
              View all →
            </Link>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {recentModules.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FiFileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 mb-4">No modules yet. Create your first module to get started!</p>
              <Link to="/modules/new" className="btn-primary inline-flex items-center space-x-2">
                <FiPlus className="w-4 h-4" />
                <span>Create Module</span>
              </Link>
            </div>
          ) : (
            recentModules.map((module: any) => (
              <Link
                key={module.id}
                to={`/modules/${module.id}`}
                className="block px-6 py-4 hover:bg-white/5 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${getTypeColor(module.type)} shadow-lg`}>
                        {module.type}
                      </span>
                      <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {module.title}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center space-x-1">
                        <FiStar className="w-3 h-3" />
                        <span>{module.author.name}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FiClock className="w-3 h-3" />
                        <span>Updated {formatDate(module.updatedAt)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Courses */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiBook className="w-5 h-5 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Your Courses</h2>
            </div>
            <Link to="/courses" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View all →
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {courses.length === 0 ? (
            <div className="col-span-3 py-12 text-center">
              <FiBook className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 mb-4">No courses yet.</p>
              <button 
                onClick={() => setShowCreateCourse(true)}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <FiPlus className="w-4 h-4" />
                <span>Create Course</span>
              </button>
            </div>
          ) : (
            courses.map((course: any) => (
              <Link
                key={course.id}
                to={`/courses`}
                className="card p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <FiBook className="relative w-10 h-10 text-blue-400" />
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-2 text-lg group-hover:text-blue-400 transition-colors">
                  {course.name}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>{course._count.modules} modules</span>
                  <span>•</span>
                  <span>{course._count.memberships} members</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    definition: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30',
    example: 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border border-orange-500/30',
    explanation: 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-300 border border-purple-500/30',
    diagram: 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-300 border border-pink-500/30',
    proof: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border border-red-500/30',
    problem: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30',
  };
  return colors[type] || 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-300 border border-gray-500/30';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
