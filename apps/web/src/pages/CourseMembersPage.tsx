import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../utils/api';
import { FiArrowLeft, FiAward, FiShield, FiUsers, FiInfo } from 'react-icons/fi';
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
      <div className="flex items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card p-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate('/courses')}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-white">Course Members</h1>
            <p className="text-gray-400 text-lg mt-1">
              Manage member roles and permissions
            </p>
          </div>
        </div>
      </div>

      {/* Your Role */}
      <div className="glass-strong rounded-2xl p-6 border border-blue-500/30">
        <p className="text-sm text-blue-300 flex items-center space-x-2 mb-2">
          <FiInfo className="w-5 h-5" />
          <span className="font-semibold text-base">Your Role:</span>
        </p>
        <div className="ml-7">
          {currentUserRole === 'OWNER' && (
            <span className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-500/30 font-semibold">
              <FiAward className="w-5 h-5 mr-2" />
              Owner
            </span>
          )}
          {currentUserRole === 'ADMIN' && (
            <span className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30 font-semibold">
              <FiShield className="w-5 h-5 mr-2" />
              Admin
            </span>
          )}
          {currentUserRole === 'MEMBER' && (
            <span className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-300 border border-gray-500/30 font-semibold">
              <FiUsers className="w-5 h-5 mr-2" />
              Member
            </span>
          )}
        </div>
        {!canManageRoles && (
          <p className="text-xs text-blue-400 mt-3 ml-7">
            Only owners and admins can manage member roles.
          </p>
        )}
      </div>

      {/* Members List */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <FiUsers className="w-6 h-6 text-cyan-400" />
            <span>All Members ({members.length})</span>
          </h2>
        </div>
        <div className="divide-y divide-white/5">
          {members.map((member: any, index: number) => (
            <div
              key={member.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-all animate-fadeIn"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-shrink-0">
                  {member.user.profilePicture ? (
                    <img 
                      src={member.user.profilePicture} 
                      alt={member.user.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500/50 shadow-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-cyan-500/50">
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-white">
                    {member.user.name}
                  </p>
                  <p className="text-sm text-gray-400">{member.user.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Role Badge/Selector */}
                {member.role === 'OWNER' ? (
                  <span className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-500/30 font-semibold shadow-lg">
                    <FiAward className="w-4 h-4 mr-2" />
                    Owner
                  </span>
                ) : canManageRoles ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    disabled={changingRole === member.id}
                    className="text-sm glass-strong rounded-lg px-3 py-2 border border-white/20 disabled:opacity-50 font-medium"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </select>
                ) : (
                  <>
                    {member.role === 'ADMIN' ? (
                      <span className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30 font-semibold shadow-lg">
                        <FiShield className="w-4 h-4 mr-2" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-300 border border-gray-500/30 font-semibold shadow-lg">
                        <FiUsers className="w-4 h-4 mr-2" />
                        Member
                      </span>
                    )}
                  </>
                )}

                {changingRole === member.id && (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Info */}
      <div className="card p-6">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <FiShield className="w-6 h-6 text-cyan-400" />
          <span>Role Permissions</span>
        </h3>
        <div className="space-y-4">
          <div className="glass rounded-xl p-4 flex items-start space-x-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
              <FiAward className="w-6 h-6 text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white text-lg mb-1">Owner</p>
              <p className="text-sm text-gray-400">
                Full control: Create modules, manage all members, share course ID, delete course
              </p>
            </div>
          </div>
          <div className="glass rounded-xl p-4 flex items-start space-x-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
              <FiShield className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white text-lg mb-1">Admin</p>
              <p className="text-sm text-gray-400">
                Create modules, manage members (except other admins), share course ID
              </p>
            </div>
          </div>
          <div className="glass rounded-xl p-4 flex items-start space-x-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-gray-500/20 to-slate-500/20">
              <FiUsers className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white text-lg mb-1">Member</p>
              <p className="text-sm text-gray-400">
                View modules and compiled textbooks only
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
