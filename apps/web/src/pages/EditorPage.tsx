import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleApi, courseApi } from '../utils/api';
import { useDraftStore } from '../store/draftStore';
import ReactMarkdown from 'react-markdown';
import { FiSave, FiEye, FiCode, FiClock, FiEdit3, FiTag, FiPlus, FiX, FiGitBranch, FiRotateCcw, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const MODULE_TYPES = ['definition', 'example', 'explanation', 'diagram', 'proof', 'problem'];

export function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const courseIdFromUrl = searchParams.get('courseId');
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [type, setType] = useState('definition');
  const [courseId, setCourseId] = useState(courseIdFromUrl || '');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);

  const { saveDraft, getDraft, deleteDraft } = useDraftStore();

  // Fetch courses
  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseApi.list(),
  });

  // Ensure courseId is set from URL when component mounts or URL changes
  useEffect(() => {
    if (courseIdFromUrl && !isEditing) {
      setCourseId(courseIdFromUrl);
    }
  }, [courseIdFromUrl, isEditing]);

  // Fetch module if editing
  const { data: moduleData } = useQuery({
    queryKey: ['module', id],
    queryFn: () => moduleApi.get(id!),
    enabled: isEditing,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => moduleApi.create(data),
    onSuccess: () => {
      deleteDraft('new'); // Clear the draft after successful creation
      navigate('/modules');
    },
    onError: (error: any) => {
      console.error('Create module error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to create module';
      alert(errorMsg); // Show error to user
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => moduleApi.update(id!, data),
    onSuccess: () => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['module-versions', id] });
    },
  });

  // Fetch version history
  const { data: versionsData } = useQuery({
    queryKey: ['module-versions', id],
    queryFn: () => moduleApi.versions(id!),
    enabled: isEditing && !!id,
  });

  // Restore version mutation
  const restoreVersionMutation = useMutation({
    mutationFn: (versionNumber: number) => moduleApi.restore(id!, versionNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module', id] });
      queryClient.invalidateQueries({ queryKey: ['module-versions', id] });
      toast.success('Version restored successfully!');
      setShowVersionHistory(false);
      setSelectedVersion(null);
      // Reload the page to show restored content
      window.location.reload();
    },
    onError: () => {
      toast.error('Failed to restore version');
    },
  });

  // Load module data or draft - only run once on mount
  useEffect(() => {
    if (isEditing && moduleData?.data?.module) {
      const module = moduleData.data.module;
      setTitle(module.title);
      setType(module.type);
      setCourseId(module.courseId);
      setContent(module.versions[0]?.contentMarkdown || '');
      setTags(module.tags.map((t: any) => t.tag));
    } else if (!isEditing) {
      // For new modules, try to load draft
      const draft = getDraft('new');
      if (draft && !courseIdFromUrl) {
        // Only load draft if we're NOT coming from a course page
        setTitle(draft.title);
        setType(draft.type);
        setCourseId(draft.courseId);
        setContent(draft.content);
        setTags(draft.tags);
      }
      // If courseIdFromUrl exists, the other useEffect will handle it
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, moduleData]);

  // Auto-save draft
  useEffect(() => {
    if (!isEditing) {
      const timer = setTimeout(() => {
        saveDraft('new', {
          title,
          type,
          courseId,
          content,
          tags,
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [title, type, courseId, content, tags, isEditing, saveDraft]);

  const courses = coursesData?.data?.courses || [];

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = () => {
    console.log('Attempting to save module...', { title, courseId, content: content.substring(0, 50) });
    
    if (!title || !courseId || !content) {
      alert('Please fill in all required fields');
      console.error('Validation failed:', { title, courseId, hasContent: !!content });
      return;
    }

    const data = {
      title,
      type,
      courseId,
      contentMarkdown: content,
      tags,
    };

    console.log('Submitting module data:', data);

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleRestoreVersion = (version: any) => {
    if (confirm(`Are you sure you want to restore version ${version.versionNumber}? This will create a new version with the old content.`)) {
      restoreVersionMutation.mutate(version.versionNumber);
    }
  };

  const handleViewVersion = (version: any) => {
    setSelectedVersion(version);
  };

  const handleCloseVersionView = () => {
    setSelectedVersion(null);
  };

  const versions = versionsData?.data?.versions || [];
  const currentVersion = versions.length > 0 ? versions[0] : null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiEdit3 className="w-8 h-8 text-blue-500 glow-blue animate-pulse-glow" />
              <h1 className="text-3xl font-bold text-white">
                {isEditing ? 'Edit Module' : 'New Module'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              {lastSaved && (
                <span className="flex items-center text-sm text-gray-400 glass px-3 py-2 rounded-lg">
                  <FiClock className="w-4 h-4 mr-2 text-green-400" />
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {isEditing && versions.length > 0 && (
                <button
                  onClick={() => setShowVersionHistory(true)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <FiGitBranch className="w-4 h-4" />
                  <span>History ({versions.length})</span>
                </button>
              )}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="btn-secondary flex items-center space-x-2"
              >
                {showPreview ? <FiCode className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                <span>{showPreview ? 'Editor' : 'Preview'}</span>
              </button>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSave className="w-4 h-4" />
                <span>{isEditing ? 'Update' : 'Create'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
                placeholder="e.g., Definition of Derivative"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type <span className="text-red-400">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full"
              >
                {MODULE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Course <span className="text-red-400">*</span>
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={!!courseIdFromUrl} // Disable if coming from a specific course
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
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
              <FiTag className="w-4 h-4" />
              <span>Tags</span>
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1"
                placeholder="Add a tag..."
              />
              <button
                onClick={handleAddTag}
                className="btn-secondary flex items-center space-x-1 px-4"
              >
                <FiPlus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1.5 glass rounded-lg text-sm text-cyan-300 border border-cyan-500/30"
                >
                  <FiTag className="w-3 h-3 mr-1" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-cyan-400 hover:text-red-400 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content <span className="text-red-400">*</span> (Markdown)
            </label>
            <p className="text-sm text-gray-400 mb-3 glass px-3 py-2 rounded-lg inline-block">
              Use @module:ID to reference other modules
            </p>
            {showPreview ? (
              <div className="glass-strong rounded-xl p-6 min-h-[400px] prose prose-invert max-w-none overflow-auto">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full font-mono text-sm"
                rows={20}
                placeholder="Write your content in Markdown..."
              />
            )}
          </div>
        </div>
      </div>

      {/* Version History Modal */}
      {showVersionHistory && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <FiGitBranch className="w-8 h-8 text-cyan-400 glow-cyan" />
                <h2 className="text-3xl font-bold text-white">Version History</h2>
              </div>
              <button
                onClick={() => {
                  setShowVersionHistory(false);
                  setSelectedVersion(null);
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
              {/* Version List */}
              <div className="flex flex-col overflow-hidden">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <FiClock className="w-5 h-5 text-blue-400" />
                  <span>All Versions ({versions.length})</span>
                </h3>
                <div className="space-y-2 overflow-y-auto flex-1 pr-2">
                  {versions.map((version: any, index: number) => (
                    <div
                      key={version.id}
                      className={`card p-4 cursor-pointer transition-all ${
                        selectedVersion?.id === version.id
                          ? 'border-cyan-500/50 bg-cyan-500/10'
                          : 'hover:border-blue-500/30'
                      }`}
                      onClick={() => handleViewVersion(version)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                            index === 0
                              ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30'
                              : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            v{version.versionNumber}
                          </div>
                          {index === 0 && (
                            <span className="flex items-center space-x-1 text-xs text-green-400">
                              <FiCheck className="w-3 h-3" />
                              <span>Current</span>
                            </span>
                          )}
                        </div>
                        {index !== 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreVersion(version);
                            }}
                            disabled={restoreVersionMutation.isPending}
                            className="btn-secondary text-xs py-1 px-3 flex items-center space-x-1 disabled:opacity-50"
                          >
                            <FiRotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(version.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {version.contentMarkdown.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Version Preview */}
              <div className="flex flex-col overflow-hidden">
                {selectedVersion ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                        <FiEye className="w-5 h-5 text-cyan-400" />
                        <span>Version {selectedVersion.versionNumber} Preview</span>
                      </h3>
                      <button
                        onClick={handleCloseVersionView}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        Close Preview
                      </button>
                    </div>
                    <div className="glass-strong rounded-xl p-6 overflow-y-auto flex-1">
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown>{selectedVersion.contentMarkdown}</ReactMarkdown>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-3">
                      {selectedVersion.versionNumber !== currentVersion?.versionNumber && (
                        <>
                          <button
                            onClick={() => handleRestoreVersion(selectedVersion)}
                            disabled={restoreVersionMutation.isPending}
                            className="btn-primary flex items-center space-x-2 flex-1 disabled:opacity-50"
                          >
                            {restoreVersionMutation.isPending ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Restoring...</span>
                              </>
                            ) : (
                              <>
                                <FiRotateCcw className="w-4 h-4" />
                                <span>Restore This Version</span>
                              </>
                            )}
                          </button>
                          <div className="glass px-4 py-2 rounded-lg border border-yellow-500/30">
                            <p className="text-xs text-yellow-300 flex items-center space-x-2">
                              <FiAlertCircle className="w-4 h-4" />
                              <span>Creates a new version</span>
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center glass rounded-xl">
                    <div className="text-center">
                      <FiGitBranch className="w-16 h-16 mx-auto mb-4 text-gray-600 animate-float" />
                      <p className="text-gray-400">Select a version to preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
