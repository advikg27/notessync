import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi, moduleApi } from '../utils/api';
import { FiBook, FiFileText, FiPlus, FiTrendingUp } from 'react-icons/fi';
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
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to Textbook Compiler</h1>
        <p className="text-blue-100 mb-6">
          Create modular academic content and compile it into beautiful textbooks
        </p>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowCreateCourse(true)}
            className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50"
          >
            <FiPlus className="w-5 h-5" />
            <span>New Course</span>
          </button>
          <Link
            to="/modules/new"
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-400"
          >
            <FiPlus className="w-5 h-5" />
            <span>New Module</span>
          </Link>
          <Link
            to="/builder"
            className="flex items-center space-x-2 bg-blue-700 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-600"
          >
            <FiBook className="w-5 h-5" />
            <span>Build Textbook</span>
          </Link>
        </div>
      </div>

      {/* Create Course Modal */}
      {showCreateCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create New Course</h2>
            <form onSubmit={handleCreateCourse}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Name
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Calculus I"
                  autoFocus
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={createCourseMutation.isPending}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateCourse(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Courses</p>
              <p className="text-3xl font-bold text-gray-900">{courses.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FiBook className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Your Modules</p>
              <p className="text-3xl font-bold text-gray-900">{recentModules.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FiFileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activity</p>
              <p className="text-3xl font-bold text-gray-900">
                {recentModules.filter((m: any) => {
                  const updatedAt = new Date(m.updatedAt);
                  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                  return updatedAt > dayAgo;
                }).length}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Modules */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Modules</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentModules.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <FiFileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No modules yet. Create your first module to get started!</p>
            </div>
          ) : (
            recentModules.map((module: any) => (
              <Link
                key={module.id}
                to={`/modules/${module.id}`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(module.type)}`}>
                        {module.type}
                      </span>
                      <h3 className="text-lg font-medium text-gray-900">{module.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      by {module.author.name} • Updated {formatDate(module.updatedAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Courses */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Your Courses</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {courses.length === 0 ? (
            <div className="col-span-3 py-8 text-center text-gray-500">
              <FiBook className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No courses yet.</p>
            </div>
          ) : (
            courses.map((course: any) => (
              <div
                key={course.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                <h3 className="font-medium text-gray-900 mb-2">{course.name}</h3>
                <p className="text-sm text-gray-600">
                  {course._count.modules} modules • {course._count.memberships} members
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    definition: 'bg-green-100 text-green-800',
    example: 'bg-orange-100 text-orange-800',
    explanation: 'bg-purple-100 text-purple-800',
    diagram: 'bg-pink-100 text-pink-800',
    proof: 'bg-red-100 text-red-800',
    problem: 'bg-cyan-100 text-cyan-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
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

