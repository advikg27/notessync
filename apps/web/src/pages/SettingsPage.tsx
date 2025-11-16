import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../utils/api';
import { FiLock, FiUser, FiMail, FiCheck, FiAlertCircle } from 'react-icons/fi';

export function SettingsPage() {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings</p>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <FiUser className="w-5 h-5 mr-2" />
          Profile Information
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <FiUser className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-700">{user?.name}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <FiMail className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-700">{user?.email}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <code className="text-xs text-gray-600">{user?.id}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <FiLock className="w-5 h-5 mr-2" />
          Change Password
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
            <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-start">
            <FiCheck className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your current password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password (min 6 characters)"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm new password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {changePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Minimum 6 characters</li>
            <li>• Must be different from current password</li>
          </ul>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Danger Zone</h2>
        <p className="text-gray-600 text-sm mb-4">
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
            className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 font-medium"
          >
            Clear All Local Drafts
          </button>
        </div>
      </div>
    </div>
  );
}

