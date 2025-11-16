import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../utils/api';
import { FiArrowLeft, FiAward, FiShield, FiUsers } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export function CourseMembersPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['course-members', courseId],
    queryFn: () => courseApi.members(courseId!),
    enabled: !!courseId,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      courseApi.updateMemberRole(courseId!, memberId, role),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['course-members', courseId] });
      setChangingRole(null);
      toast.success(response.data.message || 'Role updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to update role');
      setChangingRole(null);
    },
  });

  const handleRoleChange = (memberId: string, newRole: string) => {
    setChangingRole(memberId);
    updateRoleMutation.mutate({ memberId, role: newRole });
  };

  const members = membersData?.data?.members || [];
  const currentUserRole = membersData?.data?.currentUserRole;

  const canManageRoles = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/courses')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Members</h1>
            <p className="text-gray-600 mt-1">
              Manage member roles and permissions
            </p>
          </div>
        </div>
      </div>

      {/* Your Role */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Your Role:</strong>{' '}
          {currentUserRole === 'OWNER' && (
            <span className="inline-flex items-center">
              <FiAward className="w-4 h-4 mr-1" />
              Owner
            </span>
          )}
          {currentUserRole === 'ADMIN' && (
            <span className="inline-flex items-center">
              <FiShield className="w-4 h-4 mr-1" />
              Admin
            </span>
          )}
          {currentUserRole === 'MEMBER' && (
            <span className="inline-flex items-center">
              <FiUsers className="w-4 h-4 mr-1" />
              Member
            </span>
          )}
        </p>
        {!canManageRoles && (
          <p className="text-xs text-blue-700 mt-2">
            Only owners and admins can manage member roles.
          </p>
        )}
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            All Members ({members.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {members.map((member: any) => (
            <div
              key={member.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {member.user.name}
                  </p>
                  <p className="text-xs text-gray-500">{member.user.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Role Badge/Selector */}
                {member.role === 'OWNER' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    <FiAward className="w-4 h-4 mr-1" />
                    Owner
                  </span>
                ) : canManageRoles ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    disabled={changingRole === member.id}
                    className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </select>
                ) : (
                  <>
                    {member.role === 'ADMIN' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        <FiShield className="w-4 h-4 mr-1" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        <FiUsers className="w-4 h-4 mr-1" />
                        Member
                      </span>
                    )}
                  </>
                )}

                {changingRole === member.id && (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Info */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Role Permissions
        </h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <FiAward className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Owner</p>
              <p className="text-sm text-gray-600">
                Full control: Create modules, manage all members, share course ID, delete course
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <FiShield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Admin</p>
              <p className="text-sm text-gray-600">
                Create modules, manage members (except other admins), share course ID
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <FiUsers className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Member</p>
              <p className="text-sm text-gray-600">
                View modules and compiled textbooks only
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

