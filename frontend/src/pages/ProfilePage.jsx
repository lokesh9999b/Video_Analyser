import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Building, Shield, Key, Calendar } from 'lucide-react';
import Badge from '../components/ui/Badge';

const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-slate-400">View your account details and access level.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Core Info */}
        <div className="col-span-1 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 text-center shadow-xl">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-indigo-500/20 mb-4">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
            <p className="text-sm text-slate-400 mb-4">{user.email}</p>
            
            <Badge 
              variant={
                user.role === 'admin' ? 'danger' : 
                user.role === 'editor' ? 'primary' : 'success'
              } 
              className="uppercase tracking-wider px-3 py-1"
            >
              {user.role} Role
            </Badge>
          </div>

          <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Shield size={18} className="text-indigo-400" />
              <h3 className="font-semibold text-white">Security Status</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Your account is secured with standard password authentication.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md w-max">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Session
            </div>
          </div>
        </div>

        {/* Right Column - Detailed Info */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <User size={20} className="text-indigo-400" /> Personal Details
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Full Name
                  </label>
                  <div className="flex items-center gap-3 bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 overflow-hidden">
                    <User size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-200 truncate" title={user.name}>{user.name}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Email Address
                  </label>
                  <div className="flex items-center gap-3 bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 overflow-hidden">
                    <Mail size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-200 truncate" title={user.email}>{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Workspace / Organization
                  </label>
                  <div className="flex items-center gap-3 bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 overflow-hidden">
                    <Building size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-200 capitalize truncate" title={user.organisation}>{user.organisation}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Account ID
                  </label>
                  <div className="flex items-center gap-3 bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 overflow-hidden">
                    <Key size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-200 font-mono text-sm truncate" title={user._id}>{user._id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl">
             <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-400" /> Account History
            </h3>
            <p className="text-sm text-slate-400">
              Account created on: <span className="text-slate-200 font-medium">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
