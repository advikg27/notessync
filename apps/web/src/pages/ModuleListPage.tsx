import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { moduleApi, courseApi } from '../utils/api';
import { FiPlus, FiSearch, FiFilter } from 'react-icons/fi';

const MODULE_TYPES = ['definition', 'example', 'explanation', 'diagram', 'proof', 'problem'];

export function ModuleListPage() {
  const [searchParams] = useSearchParams();
  const courseIdFromUrl = searchParams.get('courseId');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(courseIdFromUrl || '');
  const [selectedType, setSelectedType] = useState('');
  
  // Update selected course when URL changes
  useEffect(() => {
    if (courseIdFromUrl) {
      setSelectedCourse(courseIdFromUrl);
    }
  }, [courseIdFromUrl]);

  // Fetch courses
  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseApi.list(),
  });

  // Fetch modules with filters
  const { data: modulesData, isLoading } = useQuery({
    queryKey: ['modules', searchQuery, selectedCourse, selectedType],
    queryFn: () =>
      moduleApi.list({
        search: searchQuery || undefined,
        courseId: selectedCourse || undefined,
        type: selectedType || undefined,
      }),
  });

  const courses = coursesData?.data?.courses || [];
  const modules = modulesData?.data?.modules || [];
  
  // Find current course and check user's role
  const currentCourse = courses.find((c: any) => c.id === selectedCourse);
  const userRole = currentCourse?.userRole;
  const canCreateModules = userRole === 'OWNER' || userRole === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modules</h1>
          {selectedCourse && currentCourse && (
            <p className="text-gray-600 mt-1">
              Filtered by: {currentCourse.name}
            </p>
          )}
        </div>
        {/* Only show New Module button if no course selected OR user is OWNER/ADMIN */}
        {(!selectedCourse || canCreateModules) && (
          <Link
            to={selectedCourse ? `/modules/new?courseId=${selectedCourse}` : "/modules/new"}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <FiPlus className="w-5 h-5" />
            <span>New Module</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search modules..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Courses</option>
            {courses.map((course: any) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {MODULE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Module List */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : modules.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FiFilter className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No modules found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {modules.map((module: any) => (
              <Link
                key={module.id}
                to={`/modules/${module.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(module.type)}`}>
                        {module.type}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      by {module.author.name} • Updated {formatDate(module.updatedAt)}
                    </p>
                    {module.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {module.tags.map((tag: any) => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {tag.tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      v{module.versions[0]?.versionNumber || 1}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
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

