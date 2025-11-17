import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../utils/api';
import { FiLock, FiUser, FiMail, FiCheck, FiAlertCircle, FiSettings, FiTrash2, FiShield, FiCamera, FiUpload, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(data),
    onSuccess: () => {
      setSuccess('Password changed successfully!');
      setError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to change password');
      setSuccess('');
    },
  });

  const uploadProfilePictureMutation = useMutation({
    mutationFn: (data: { image: string }) => authApi.uploadProfilePicture(data),
    onSuccess: (response) => {
      updateUser(response.data.user);
      toast.success('Profile picture uploaded successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to upload profile picture');
    },
  });

  const deleteProfilePictureMutation = useMutation({
    mutationFn: () => authApi.deleteProfilePicture(),
    onSuccess: (response) => {
      updateUser(response.data.user);
      toast.success('Profile picture deleted successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to delete profile picture');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      uploadProfilePictureMutation.mutate({ image: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteProfilePicture = () => {
    if (confirm('Are you sure you want to delete your profile picture?')) {
      deleteProfilePictureMutation.mutate();
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card p-8">
        <div className="flex items-center space-x-3 mb-2">
          <FiSettings className="w-10 h-10 text-blue-500 glow-blue animate-pulse-glow" />
          <h1 className="text-4xl font-bold text-white">Settings</h1>
        </div>
        <p className="text-gray-400 text-lg">Manage your account settings and preferences</p>
      </div>

      {/* Profile Picture */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <FiCamera className="w-6 h-6 text-cyan-400" />
          <span>Profile Picture</span>
        </h2>

        <div className="flex items-center space-x-6">
          <div className="relative group">
            {user?.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt={user.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-500/30 shadow-lg group-hover:border-blue-500/50 transition-all"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-5xl border-4 border-blue-500/30 shadow-lg group-hover:border-blue-500/50 transition-all">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <FiCamera className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={handleUploadClick}
              disabled={uploadProfilePictureMutation.isPending}
              className="btn-primary flex items-center space-x-2 w-full disabled:opacity-50"
            >
              {uploadProfilePictureMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <FiUpload className="w-5 h-5" />
                  <span>Upload New Picture</span>
                </>
              )}
            </button>
            
            {user?.profilePicture && (
              <button
                onClick={handleDeleteProfilePicture}
                disabled={deleteProfilePictureMutation.isPending}
                className="w-full px-6 py-3 rounded-xl border-2 border-red-500/50 text-red-300 font-semibold hover:bg-red-500/10 transition-all flex items-center justify-center space-x-2 group disabled:opacity-50"
              >
                {deleteProfilePictureMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <FiX className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <span>Delete Picture</span>
                  </>
                )}
              </button>
            )}
            
            <p className="text-xs text-gray-400">
              Recommended: Square image, at least 200x200px. Max size: 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <FiUser className="w-6 h-6 text-cyan-400" />
          <span>Profile Information</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name
            </label>
            <div className="glass flex items-center px-4 py-3 rounded-xl">
              <FiUser className="w-5 h-5 text-cyan-400 mr-3" />
              <span className="text-white font-medium">{user?.name}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="glass flex items-center px-4 py-3 rounded-xl">
              <FiMail className="w-5 h-5 text-blue-400 mr-3" />
              <span className="text-white font-medium">{user?.email}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              User ID
            </label>
            <div className="glass px-4 py-3 rounded-xl">
              <code className="text-sm text-gray-300 font-mono">{user?.id}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <FiLock className="w-6 h-6 text-violet-400" />
          <span>Change Password</span>
        </h2>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start animate-fadeIn">
            <FiAlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-start animate-fadeIn">
            <FiCheck className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-green-300">{success}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full"
              placeholder="Enter your current password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full"
              placeholder="Enter new password (min 6 characters)"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full"
              placeholder="Confirm new password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>

        <div className="mt-6 p-4 glass rounded-xl border border-blue-500/30">
          <h3 className="text-sm font-semibold text-blue-300 mb-2 flex items-center space-x-2">
            <FiShield className="w-4 h-4" />
            <span>Password Requirements:</span>
          </h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Minimum 6 characters</li>
            <li>• Must be different from current password</li>
          </ul>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border border-red-500/30 bg-red-500/5">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
          <FiAlertCircle className="w-6 h-6 text-red-400" />
          <span>Danger Zone</span>
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          These actions are irreversible. Please be careful.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all your local drafts? This cannot be undone.')) {
                localStorage.removeItem('draft-storage');
                alert('Local drafts cleared successfully');
              }
            }}
            className="w-full px-6 py-3 rounded-xl border-2 border-red-500/50 text-red-300 font-semibold hover:bg-red-500/10 transition-all flex items-center justify-center space-x-2 group"
          >
            <FiTrash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>Clear All Local Drafts</span>
          </button>
        </div>
      </div>
    </div>
  );
}
