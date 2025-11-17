import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { courseApi } from '../utils/api';
import { FiPlus, FiBook, FiUsers, FiFileText, FiCopy, FiCheck, FiShield, FiAward, FiZap } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

// Role badge component
function RoleBadge({ role }: { role: string }) {
  if (role === 'OWNER') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-500/30 shadow-lg">
        <FiAward className="w-3 h-3 mr-1" />
        Owner
      </span>
    );
  }
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30 shadow-lg">
        <FiShield className="w-3 h-3 mr-1" />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-300 border border-gray-500/30 shadow-lg">
      <FiUsers className="w-3 h-3 mr-1" />
      Member
    </span>
  );
}

export function CoursesPage() {
  const queryClient = useQueryClient();
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showJoinCourse, setShowJoinCourse] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseApi.list(),
  });

  const createCourseMutation = useMutation({
    mutationFn: (data: { name: string }) => courseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setShowCreateCourse(false);
      setCourseName('');
      toast.success('Course created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to create course');
    },
  });

  const joinMutation = useMutation({
    mutationFn: (data: { courseId: string }) => courseApi.join(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setShowJoinCourse(false);
      setCourseCode('');
      const message = response.data?.message || 'Successfully joined course!';
      toast.success(message);
    },
    onError: (err: any) => {
      const error = err.response?.data?.error || 'Failed to join course';
      toast.error(error);
    },
  });

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (courseName.trim()) {
      createCourseMutation.mutate({ name: courseName });
    }
  };

  const handleJoinCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (courseCode.trim()) {
      joinMutation.mutate({ courseId: courseCode.trim() });
    }
  };

  const handleCopyCourseId = (courseId: string) => {
    navigator.clipboard.writeText(courseId);
    setCopiedId(courseId);
    toast.success('Course ID copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const courses = coursesData?.data?.courses || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Courses</h1>
            <p className="text-gray-400 text-lg">
              Manage your courses and create collaborative textbooks
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowJoinCourse(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <FiUsers className="w-5 h-5" />
              <span>Join Course</span>
            </button>
            <button
              onClick={() => setShowCreateCourse(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <FiPlus className="w-5 h-5" />
              <span>New Course</span>
            </button>
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
                  placeholder="e.g., Calculus I - Fall 2024"
                  autoFocus
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={createCourseMutation.isPending}
                  className="btn-primary flex-1 disabled:opacity-50"
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

      {/* Join Course Modal */}
      {showJoinCourse && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 px-4">
          <div className="glass-strong rounded-2xl p-8 w-full max-w-md animate-fadeIn">
            <h2 className="text-3xl font-bold mb-2 text-white">Join a Course</h2>
            <p className="text-gray-400 mb-6">
              Enter the course ID provided by your instructor or classmate
            </p>
            <form onSubmit={handleJoinCourse}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Course ID
                </label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full font-mono"
                  placeholder="clxxxxxxxxxxxxxx"
                  autoFocus
                  required
                />
                <div className="mt-3 p-4 glass rounded-xl border border-blue-500/30">
                  <p className="text-xs text-blue-300">
                    <strong>💡 Tip:</strong> Course IDs look like "clxxxxxxxxxxxxxx" (starts with "cl"). 
                    Ask your instructor or check the course card's copy button.
                  </p>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={joinMutation.isPending}
                  className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center"
                >
                  {joinMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Joining...
                    </>
                  ) : (
                    'Join Course'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinCourse(false);
                    setCourseCode('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course List */}
      {isLoading ? (
        <div className="card p-12 text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Loading courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="inline-block mb-6 animate-float">
            <FiBook className="w-20 h-20 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No Courses Yet</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Create your first course to start building collaborative textbooks
          </p>
          <button
            onClick={() => setShowCreateCourse(true)}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>Create Your First Course</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: any) => (
            <div
              key={course.id}
              className="card p-6 group relative overflow-hidden"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 transition-all duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {course.name}
                      </h3>
                      <RoleBadge role={course.userRole} />
                    </div>
                    <p className="text-sm text-gray-400">
                      Created by {course.owner.name}
                    </p>
                  </div>
                  {(course.userRole === 'OWNER' || course.userRole === 'ADMIN') && (
                    <button
                      onClick={() => handleCopyCourseId(course.id)}
                      className={`p-2 rounded-lg transition-all ${
                        copiedId === course.id 
                          ? 'text-green-400 bg-green-500/10' 
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                      title="Copy Course ID"
                    >
                      {copiedId === course.id ? (
                        <FiCheck className="w-4 h-4" />
                      ) : (
                        <FiCopy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-400">
                    <div className="p-2 rounded-lg bg-blue-500/10 mr-3">
                      <FiFileText className="w-4 h-4 text-blue-400" />
                    </div>
                    <span>{course._count?.modules || 0} modules</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <div className="p-2 rounded-lg bg-cyan-500/10 mr-3">
                      <FiUsers className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span>{course._count?.memberships || 0} members</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="divider-glow my-4"></div>

                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Link
                      to={`/modules?courseId=${course.id}`}
                      className="btn-primary flex-1 text-center text-sm flex items-center justify-center space-x-1"
                    >
                      <FiFileText className="w-4 h-4" />
                      <span>Modules</span>
                    </Link>
                    <Link
                      to={`/builder?courseId=${course.id}`}
                      className="btn-secondary flex-1 text-center text-sm flex items-center justify-center space-x-1"
                    >
                      <FiZap className="w-4 h-4" />
                      <span>Build</span>
                    </Link>
                  </div>
                  {(course.userRole === 'OWNER' || course.userRole === 'ADMIN') && (
                    <Link
                      to={`/courses/${course.id}/members`}
                      className="w-full text-center glass px-4 py-2 rounded-xl text-sm border border-violet-500/30 flex items-center justify-center space-x-2 hover:bg-violet-500/10 transition-all group"
                    >
                      <FiShield className="w-4 h-4 text-violet-400" />
                      <span className="text-violet-300 font-medium">Manage Members</span>
                    </Link>
                  )}
                </div>

                {(course.userRole === 'OWNER' || course.userRole === 'ADMIN') && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-500 mb-2 font-semibold">
                      Share this ID with students:
                    </p>
                    <div className="flex items-center space-x-2 glass rounded-lg p-3">
                      <code className="flex-1 text-xs font-mono text-gray-300 overflow-x-auto">
                        {course.id}
                      </code>
                      <button
                        onClick={() => handleCopyCourseId(course.id)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center space-x-1 font-medium ${
                          copiedId === course.id
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30'
                        }`}
                      >
                        {copiedId === course.id ? (
                          <>
                            <FiCheck className="w-3 h-3" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <FiCopy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
