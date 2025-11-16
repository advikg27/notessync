import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { moduleApi, compilerApi, courseApi } from '../utils/api';
import { FiPlus, FiTrash2, FiDownload, FiArrowUp, FiArrowDown } from 'react-icons/fi';

export function BuilderPage() {
  const [searchParams] = useSearchParams();
  const courseIdFromUrl = searchParams.get('courseId');
  
  const [selectedCourse, setSelectedCourse] = useState(courseIdFromUrl || '');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [title, setTitle] = useState('My Textbook');
  const [format, setFormat] = useState<'html' | 'pdf'>('pdf');
  
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

  // Fetch modules for selected course
  const { data: modulesData } = useQuery({
    queryKey: ['modules', selectedCourse],
    queryFn: () => moduleApi.list({ courseId: selectedCourse }),
    enabled: !!selectedCourse,
  });

  // Compile mutation
  const compileMutation = useMutation({
    mutationFn: (data: any) => compilerApi.compile(data),
    onSuccess: (response) => {
      if (format === 'pdf') {
        // Download PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Open HTML in new window
        const blob = new Blob([response.data], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    },
  });

  const courses = coursesData?.data?.courses || [];
  const modules = modulesData?.data?.modules || [];

  const handleAddModule = (moduleId: string) => {
    if (!selectedModules.includes(moduleId)) {
      setSelectedModules([...selectedModules, moduleId]);
    }
  };

  const handleRemoveModule = (moduleId: string) => {
    setSelectedModules(selectedModules.filter((id) => id !== moduleId));
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newModules = [...selectedModules];
      [newModules[index - 1], newModules[index]] = [newModules[index], newModules[index - 1]];
      setSelectedModules(newModules);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < selectedModules.length - 1) {
      const newModules = [...selectedModules];
      [newModules[index], newModules[index + 1]] = [newModules[index + 1], newModules[index]];
      setSelectedModules(newModules);
    }
  };

  const handleCompile = () => {
    if (selectedModules.length === 0) {
      alert('Please select at least one module');
      return;
    }

    compileMutation.mutate({
      moduleIds: selectedModules,
      format,
      title,
    });
  };

  const getModuleById = (id: string) => modules.find((m: any) => m.id === id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Textbook Builder</h1>
        <p className="text-gray-600">
          Select and arrange modules to compile into a textbook
        </p>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Textbook Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              disabled={!!courseIdFromUrl}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a course</option>
              {courses.map((course: any) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Output Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'html' | 'pdf')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="html">HTML</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Available Modules */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Available Modules</h2>
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto">
            {!selectedCourse ? (
              <p className="text-center text-gray-500 py-8">
                Select a course to see available modules
              </p>
            ) : modules.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No modules found in this course
              </p>
            ) : (
              <div className="space-y-2">
                {modules.map((module: any) => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(module.type)}`}>
                          {module.type}
                        </span>
                        <span className="font-medium text-gray-900">{module.title}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddModule(module.id)}
                      disabled={selectedModules.includes(module.id)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiPlus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Modules */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Selected Modules ({selectedModules.length})
            </h2>
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto">
            {selectedModules.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No modules selected. Add modules from the left panel.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedModules.map((moduleId, index) => {
                  const module = getModuleById(moduleId);
                  if (!module) return null;

                  return (
                    <div
                      key={moduleId}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-blue-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-gray-500">
                            {index + 1}.
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(module.type)}`}>
                            {module.type}
                          </span>
                          <span className="font-medium text-gray-900">{module.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                        >
                          <FiArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === selectedModules.length - 1}
                          className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                        >
                          <FiArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveModule(moduleId)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compile Button */}
      <div className="flex justify-center">
        <button
          onClick={handleCompile}
          disabled={selectedModules.length === 0 || compileMutation.isPending}
          className="flex items-center space-x-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 text-lg font-medium"
        >
          <FiDownload className="w-5 h-5" />
          <span>
            {compileMutation.isPending
              ? 'Compiling...'
              : `Compile to ${format.toUpperCase()}`}
          </span>
        </button>
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

