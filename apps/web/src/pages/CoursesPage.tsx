import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { courseApi } from '../utils/api';
import { FiPlus, FiBook, FiUsers, FiFileText, FiCopy, FiCheck, FiShield, FiAward } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

// Role badge component
function RoleBadge({ role }: { role: string }) {
  if (role === 'OWNER') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        <FiAward className="w-3 h-3 mr-1" />
        Owner
      </span>
    );
  }
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <FiShield className="w-3 h-3 mr-1" />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600 mt-1">
            Manage your courses and create collaborative textbooks
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowJoinCourse(true)}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            <FiUsers className="w-5 h-5" />
            <span>Join Course</span>
          </button>
          <button
            onClick={() => setShowCreateCourse(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <FiPlus className="w-5 h-5" />
            <span>New Course</span>
          </button>
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
                  placeholder="e.g., Calculus I - Fall 2024"
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

      {/* Join Course Modal */}
      {showJoinCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-2">Join a Course</h2>
            <p className="text-gray-600 text-sm mb-4">
              Enter the course ID provided by your instructor or classmate
            </p>
            <form onSubmit={handleJoinCourse}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course ID
                </label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="clxxxxxxxxxxxxxx"
                  autoFocus
                  required
                />
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-800">
                    <strong>💡 Tip:</strong> Course IDs look like "clxxxxxxxxxxxxxx" (starts with "cl"). 
                    Ask your instructor or check the course card's copy button.
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={joinMutation.isPending}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
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
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
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
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FiBook className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Courses Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first course to start building collaborative textbooks
          </p>
          <button
            onClick={() => setShowCreateCourse(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
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
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-900">{course.name}</h3>
                    <RoleBadge role={course.userRole} />
                  </div>
                  <p className="text-sm text-gray-600">
                    Created by {course.owner.name}
                  </p>
                </div>
                {(course.userRole === 'OWNER' || course.userRole === 'ADMIN') && (
                  <button
                    onClick={() => handleCopyCourseId(course.id)}
                    className={`p-2 transition-colors ${
                      copiedId === course.id 
                        ? 'text-green-600' 
                        : 'text-gray-400 hover:text-gray-600'
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

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FiFileText className="w-4 h-4 mr-2" />
                  <span>{course._count?.modules || 0} modules</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FiUsers className="w-4 h-4 mr-2" />
                  <span>{course._count?.memberships || 0} members</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Link
                    to={`/modules?courseId=${course.id}`}
                    className="flex-1 text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    View Modules
                  </Link>
                  <Link
                    to={`/builder?courseId=${course.id}`}
                    className="flex-1 text-center bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 text-sm"
                  >
                    Build Textbook
                  </Link>
                </div>
                {(course.userRole === 'OWNER' || course.userRole === 'ADMIN') && (
                  <Link
                    to={`/courses/${course.id}/members`}
                    className="w-full text-center bg-purple-50 text-purple-700 px-4 py-2 rounded-md hover:bg-purple-100 text-sm border border-purple-200 flex items-center justify-center space-x-1"
                  >
                    <FiUsers className="w-4 h-4" />
                    <span>Manage Members</span>
                  </Link>
                )}
              </div>

              {(course.userRole === 'OWNER' || course.userRole === 'ADMIN') && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">
                    <strong>Share this ID with students:</strong>
                  </p>
                  <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                    <code className="flex-1 text-xs font-mono text-gray-700 overflow-x-auto">
                      {course.id}
                    </code>
                    <button
                      onClick={() => handleCopyCourseId(course.id)}
                      className={`px-2 py-1 text-xs rounded transition-colors flex items-center space-x-1 ${
                        copiedId === course.id
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
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
          ))}
        </div>
      )}
    </div>
  );
}

