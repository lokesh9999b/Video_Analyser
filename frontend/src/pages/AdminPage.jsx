import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, UserMinus, CheckCircle2, XCircle, Clock, Users, ChevronDown } from 'lucide-react';
import {
  getUsers, updateUserRole, deleteUser,
  getPendingUsers, approveUser, rejectUser,
} from '../api/admin.api';
import toast from 'react-hot-toast';

// ─── Approve Modal ──────────────────────────────────────────
const ApproveModal = ({ user, onApprove, onClose }) => {
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(user._id, role);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
        <h3 className="text-lg font-bold text-white mb-1">Approve Join Request</h3>
        <p className="text-sm text-slate-400 mb-5">
          Assign a role for <span className="text-white font-semibold">{user.name}</span> ({user.email})
        </p>

        <div className="space-y-3 mb-6">
          {[
            { value: 'viewer', label: 'Viewer', desc: 'Read-only access — can watch videos', color: 'emerald' },
            { value: 'editor', label: 'Editor', desc: 'Can upload and manage videos', color: 'blue' },
            { value: 'admin', label: 'Admin', desc: 'Full access + user management', color: 'red' },
          ].map(({ value, label, desc, color }) => (
            <button
              key={value}
              type="button"
              id={`approve-role-${value}`}
              onClick={() => setRole(value)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                role === value
                  ? `border-${color}-500/50 bg-${color}-500/10`
                  : 'border-white/5 bg-slate-800/50 hover:border-white/10'
              }`}
            >
              <p className={`text-sm font-semibold ${role === value ? `text-${color}-400` : 'text-white'}`}>{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            id="approve-confirm-btn"
            type="button"
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Admin Page ─────────────────────────────────────────
const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('users');

  // Approved users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Pending users state
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  // Modal state
  const [approveTarget, setApproveTarget] = useState(null);

  // ─── Fetch Data ────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getUsers({ limit: 50 });
      setUsers(res.data.data.users);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchPendingUsers = useCallback(async () => {
    try {
      const res = await getPendingUsers();
      setPendingUsers(res.data.data.users);
    } catch {
      toast.error('Failed to load pending requests');
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
  }, [fetchUsers, fetchPendingUsers]);

  // ─── Approved User Actions ─────────────────────────────────

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Remove ${name} from the organisation? This cannot be undone.`)) return;
    setActionLoading(userId);
    try {
      await deleteUser(userId);
      setUsers(users.filter((u) => u._id !== userId));
      toast.success('User removed successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove user');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Pending Approval Actions ──────────────────────────────

  const handleApprove = async (userId, role) => {
    try {
      const res = await approveUser(userId, role);
      setPendingUsers(pendingUsers.filter((u) => u._id !== userId));
      // Add the newly approved user to the users list
      if (res.data.data?.user) {
        setUsers((prev) => [res.data.data.user, ...prev]);
      }
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve user');
      throw err;
    }
  };

  const handleReject = async (userId, name) => {
    if (!window.confirm(`Reject ${name}'s request? This will permanently delete their account.`)) return;
    setActionLoading(userId);
    try {
      await rejectUser(userId);
      setPendingUsers(pendingUsers.filter((u) => u._id !== userId));
      toast.success(`${name}'s request has been rejected`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Role Badge ────────────────────────────────────────────
  const roleBadgeClass = (role) => {
    if (role === 'admin') return 'text-red-400 bg-red-500/5 border-red-500/20';
    if (role === 'editor') return 'text-blue-400 bg-blue-500/5 border-blue-500/20';
    return 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20';
  };

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">User Management</h1>
        <p className="text-slate-400">Manage access, roles, and approval requests for your organisation.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-white/5 rounded-xl w-fit">
        <button
          id="tab-users"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'users'
              ? 'bg-white/10 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users size={15} />
          Users
          <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-slate-700 text-xs text-slate-300">
            {users.length}
          </span>
        </button>

        <button
          id="tab-pending"
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'pending'
              ? 'bg-white/10 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock size={15} />
          Pending Approvals
          {pendingUsers.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-bold animate-pulse">
              {pendingUsers.length}
            </span>
          )}
        </button>
      </div>

      {/* ─── Users Tab ─────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="glass-card overflow-hidden shadow-2xl">
          {usersLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 border-b border-white/5 uppercase text-[11px] font-bold tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-center">Videos</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-slate-900/30">
                  {users.map((user) => {
                    const isLoading = actionLoading === user._id;
                    return (
                      <tr key={user._id} className="hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/30 to-cyan-500/20 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{user.name}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="relative inline-block">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user._id, e.target.value)}
                              disabled={isLoading}
                              className={`bg-slate-900 border rounded-lg pl-3 pr-7 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer shadow-sm ${roleBadgeClass(user.role)}`}
                            >
                              <option value="viewer" className="text-slate-300 bg-slate-900">Viewer</option>
                              <option value="editor" className="text-slate-300 bg-slate-900">Editor</option>
                              <option value="admin" className="text-slate-300 bg-slate-900">Admin</option>
                            </select>
                            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                          </div>
                        </td>

                        <td className="px-6 py-5 text-center">
                          <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-slate-800/80 border border-white/5 text-xs font-bold text-slate-300 shadow-inner">
                            {user.videoCount || 0}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-5 text-right">
                          {isLoading ? (
                            <Loader2 size={18} className="animate-spin text-indigo-400 inline-block" />
                          ) : (
                            <button
                              onClick={() => handleDelete(user._id, user.name)}
                              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="Remove User"
                            >
                              <UserMinus size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {users.length === 0 && (
                <div className="p-12 text-center text-slate-400 font-medium">
                  No approved users found.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Pending Tab ───────────────────────────────────── */}
      {activeTab === 'pending' && (
        <div className="glass-card overflow-hidden shadow-2xl">
          {pendingLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <p className="text-white font-semibold mb-1">All caught up!</p>
              <p className="text-slate-400 text-sm">No pending join requests at the moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 border-b border-white/5 uppercase text-[11px] font-bold tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Applicant</th>
                    <th className="px-6 py-4">Organisation</th>
                    <th className="px-6 py-4">Requested</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-slate-900/30">
                  {pendingUsers.map((user) => {
                    const isLoading = actionLoading === user._id;
                    return (
                      <tr key={user._id} className="hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-400">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{user.name}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-white/5 text-xs text-slate-300 capitalize">
                            {user.organisation}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                            {isLoading ? (
                              <Loader2 size={18} className="animate-spin text-indigo-400" />
                            ) : (
                              <>
                                <button
                                  id={`approve-btn-${user._id}`}
                                  onClick={() => setApproveTarget(user)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold transition-colors"
                                >
                                  <CheckCircle2 size={13} />
                                  Approve
                                </button>
                                <button
                                  id={`reject-btn-${user._id}`}
                                  onClick={() => handleReject(user._id, user.name)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors"
                                >
                                  <XCircle size={13} />
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Approve Modal */}
      {approveTarget && (
        <ApproveModal
          user={approveTarget}
          onApprove={handleApprove}
          onClose={() => setApproveTarget(null)}
        />
      )}
    </div>
  );
};

export default AdminPage;
