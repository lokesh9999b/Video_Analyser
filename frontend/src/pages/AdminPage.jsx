import React, { useEffect, useState } from 'react';
import { Loader2, UserMinus } from 'lucide-react';
import { getUsers, updateUserRole, deleteUser } from '../api/admin.api';
import toast from 'react-hot-toast';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await getUsers({ limit: 50 });
      setUsers(res.data.data.users);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the organisation? This cannot be undone.`)) return;
    
    setActionLoading(userId);
    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u._id !== userId));
      toast.success('User removed successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove user');
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">User Management</h1>
        <p className="text-slate-400">Manage access, roles, and permissions for all users in your organization.</p>
      </div>

      <div className="glass-card overflow-hidden shadow-2xl">
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
              {users.map(user => {
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
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        disabled={isLoading}
                        className={`bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer shadow-sm
                          ${user.role === 'admin' ? 'text-red-400 bg-red-500/5 border-red-500/20' : user.role === 'editor' ? 'text-blue-400 bg-blue-500/5 border-blue-500/20' : 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20'}
                        `}
                      >
                        <option value="viewer" className="text-slate-300 bg-slate-900">Viewer (Read-only)</option>
                        <option value="editor" className="text-slate-300 bg-slate-900">Editor (Upload/Manage)</option>
                        <option value="admin" className="text-slate-300 bg-slate-900">Admin (Full Access)</option>
                      </select>
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
              No users found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
