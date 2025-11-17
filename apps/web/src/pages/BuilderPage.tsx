import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { moduleApi, compilerApi, courseApi } from '../utils/api';
import { FiPlus, FiTrash2, FiDownload, FiArrowUp, FiArrowDown, FiZap, FiPackage } from 'react-icons/fi';

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
      <div className="card p-8 radial-glow">
        <div className="flex items-center space-x-3 mb-2">
          <FiZap className="w-10 h-10 text-blue-500 glow-blue animate-pulse-glow" />
          <h1 className="text-4xl font-bold text-white">Textbook Builder</h1>
        </div>
        <p className="text-gray-400 text-lg">
          Select and arrange modules to compile into a beautiful textbook
        </p>
      </div>

      {/* Configuration */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <FiPackage className="w-6 h-6 text-cyan-400" />
          <span>Configuration</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Textbook Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
              placeholder="Enter textbook title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              disabled={!!courseIdFromUrl}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Output Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'html' | 'pdf')}
              className="w-full"
            >
              <option value="pdf">PDF</option>
              <option value="html">HTML</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Modules */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <h2 className="text-xl font-bold text-white">Available Modules</h2>
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto">
            {!selectedCourse ? (
              <div className="text-center py-12">
                <FiPackage className="w-16 h-16 mx-auto mb-4 text-gray-600 animate-float" />
                <p className="text-gray-400">Select a course to see available modules</p>
              </div>
            ) : modules.length === 0 ? (
              <div className="text-center py-12">
                <FiPackage className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">No modules found in this course</p>
              </div>
            ) : (
              <div className="space-y-2">
                {modules.map((module: any) => (
                  <div
                    key={module.id}
                    className="glass p-4 rounded-xl flex items-center justify-between group hover:border-blue-500/30 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${getTypeColor(module.type)}`}>
                          {module.type}
                        </span>
                        <span className="font-medium text-white">{module.title}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddModule(module.id)}
                      disabled={selectedModules.includes(module.id)}
                      className="btn-primary text-sm py-2 px-4 disabled:opacity-30 disabled:cursor-not-allowed flex items-center space-x-1"
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
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <h2 className="text-xl font-bold text-white">
              Selected Modules ({selectedModules.length})
            </h2>
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto">
            {selectedModules.length === 0 ? (
              <div className="text-center py-12">
                <FiPackage className="w-16 h-16 mx-auto mb-4 text-gray-600 animate-float" />
                <p className="text-gray-400">No modules selected.</p>
                <p className="text-gray-500 text-sm mt-2">Add modules from the left panel.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedModules.map((moduleId, index) => {
                  const module = getModuleById(moduleId);
                  if (!module) return null;

                  return (
                    <div
                      key={moduleId}
                      className="glass-strong p-4 rounded-xl flex items-center justify-between border border-blue-500/20"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold text-cyan-400 min-w-[2rem]">
                            {index + 1}.
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${getTypeColor(module.type)}`}>
                            {module.type}
                          </span>
                          <span className="font-medium text-white">{module.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-4">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                          title="Move up"
                        >
                          <FiArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === selectedModules.length - 1}
                          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                          title="Move down"
                        >
                          <FiArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveModule(moduleId)}
                          className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                          title="Remove"
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
          className="btn-primary text-lg py-4 px-10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 group"
        >
          <FiDownload className="w-6 h-6 group-hover:animate-bounce" />
          <span>
            {compileMutation.isPending
              ? 'Compiling...'
              : `Compile to ${format.toUpperCase()}`}
          </span>
          {compileMutation.isPending && (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
        </button>
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
