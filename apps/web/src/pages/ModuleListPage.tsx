import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { moduleApi, courseApi } from '../utils/api';
import { FiPlus, FiSearch, FiFilter, FiFileText, FiClock, FiTag } from 'react-icons/fi';

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
      <div className="card p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Modules</h1>
            {selectedCourse && currentCourse && (
              <p className="text-gray-400 text-lg">
                Filtered by: <span className="text-cyan-400 font-semibold">{currentCourse.name}</span>
              </p>
            )}
          </div>
          {/* Only show New Module button if no course selected OR user is OWNER/ADMIN */}
          {(!selectedCourse || canCreateModules) && (
            <Link
              to={selectedCourse ? `/modules/new?courseId=${selectedCourse}` : "/modules/new"}
              className="btn-primary flex items-center space-x-2"
            >
              <FiPlus className="w-5 h-5" />
              <span>New Module</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search modules..."
              className="w-full pl-12"
            />
          </div>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full"
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
            className="w-full"
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
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading modules...</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="p-16 text-center">
            <FiFilter className="w-16 h-16 mx-auto mb-4 text-gray-600 animate-float" />
            <p className="text-gray-400 text-lg mb-4">No modules found.</p>
            <p className="text-gray-500 text-sm">Try adjusting your filters or create a new module.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {modules.map((module: any, index: number) => (
              <Link
                key={module.id}
                to={`/modules/${module.id}`}
                className="block p-6 hover:bg-white/5 transition-all duration-300 group animate-fadeIn"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${getTypeColor(module.type)} shadow-lg`}>
                        {module.type}
                      </span>
                      <h3 className="text-xl font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {module.title}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                      <span className="flex items-center space-x-1">
                        <FiFileText className="w-4 h-4" />
                        <span>by {module.author.name}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FiClock className="w-4 h-4" />
                        <span>Updated {formatDate(module.updatedAt)}</span>
                      </span>
                    </div>
                    {module.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {module.tags.map((tag: any) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-1 text-xs glass rounded-lg border border-white/10 text-gray-300"
                          >
                            <FiTag className="w-3 h-3 mr-1" />
                            {tag.tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col items-end space-y-2">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30">
                      v{module.versions[0]?.versionNumber || 1}
                    </span>
                    <div className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </div>
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
