import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { moduleApi, courseApi } from '../utils/api';
import { useDraftStore } from '../store/draftStore';
import ReactMarkdown from 'react-markdown';
import { FiSave, FiEye, FiCode, FiClock } from 'react-icons/fi';

const MODULE_TYPES = ['definition', 'example', 'explanation', 'diagram', 'proof', 'problem'];

export function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Module' : 'New Module'}
            </h1>
            <div className="flex items-center space-x-3">
              {lastSaved && (
                <span className="flex items-center text-sm text-gray-500">
                  <FiClock className="w-4 h-4 mr-1" />
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {showPreview ? <FiCode className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                <span>{showPreview ? 'Editor' : 'Preview'}</span>
              </button>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Definition of Derivative"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course *
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={!!courseIdFromUrl} // Disable if coming from a specific course
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
              Tags
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a tag..."
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content * (Markdown)
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Use @module:ID to reference other modules
            </p>
            {showPreview ? (
              <div className="border border-gray-300 rounded-md p-4 min-h-[400px] prose max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={20}
                placeholder="Write your content in Markdown..."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

