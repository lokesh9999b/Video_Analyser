/**
 * Sidebar — side navigation with active state and role-based links.
 */
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Upload, Library, Shield, Users
} from 'lucide-react';

const Sidebar = () => {
  const { isEditor, isAdmin } = useAuth();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-indigo-500/10 text-white shadow-sm border border-indigo-500/20 ring-1 ring-indigo-500/10'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
    }`;

  const iconClass = ({ isActive }) => 
    `transition-colors duration-200 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`;

  return (
    <aside className="w-64 min-h-[calc(100vh-65px)] bg-slate-900/40 border-r border-white/5 p-4 flex flex-col gap-2 shrink-0 hidden lg:flex backdrop-blur-xl">
      <div className="space-y-1 mt-2">
        <NavLink to="/dashboard" className={linkClass}>
          {({ isActive }) => (
            <>
              <LayoutDashboard size={18} className={iconClass({ isActive })} /> Dashboard
            </>
          )}
        </NavLink>

        {isEditor && (
          <NavLink to="/upload" className={linkClass}>
            {({ isActive }) => (
              <>
                <Upload size={18} className={iconClass({ isActive })} /> Upload Video
              </>
            )}
          </NavLink>
        )}

        <NavLink to="/library" className={linkClass}>
          {({ isActive }) => (
            <>
              <Library size={18} className={iconClass({ isActive })} /> Video Library
            </>
          )}
        </NavLink>
      </div>

      {isAdmin && (
        <>
          <div className="my-3 border-t border-white/5 mx-2" />
          <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Administration
          </p>
          <div className="space-y-1">
            <NavLink to="/admin" className={linkClass}>
              {({ isActive }) => (
                <>
                  <Users size={18} className={iconClass({ isActive })} /> Manage Users
                </>
              )}
            </NavLink>
          </div>
        </>
      )}

      {/* Bottom card */}
      <div className="mt-auto mx-1 p-4 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-white/5 shadow-inner">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <Shield size={16} className="text-indigo-400" />
          </div>
          <span className="text-sm font-semibold text-slate-200">Pulse Pro</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          AI-powered content moderation is currently active for your workspace.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
