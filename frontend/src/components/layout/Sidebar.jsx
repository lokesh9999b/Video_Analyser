/**
 * Sidebar — side navigation with active state, role-based links, and collapse toggle.
 */
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Upload, Library, Users, ChevronLeft, ChevronRight,
} from 'lucide-react';

const Sidebar = ({ open, onToggle }) => {
  const { isEditor, isAdmin } = useAuth();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-indigo-500/10 text-white shadow-sm border border-indigo-500/20 ring-1 ring-indigo-500/10'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
    }`;

  const iconClass = ({ isActive }) =>
    `transition-colors duration-200 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`;

  return (
    <aside
      className={`
        relative min-h-[calc(100vh-65px)] bg-slate-900/40 border-r border-white/5
        flex flex-col shrink-0 hidden lg:flex backdrop-blur-xl
        transition-all duration-300 ease-in-out overflow-hidden
        ${open ? 'w-64 p-4' : 'w-16 p-2'}
      `}
    >
      {/* Toggle button */}
      <div className={`flex items-center ${open ? 'justify-end' : 'justify-center'} mb-6`}>
        <button
          onClick={onToggle}
          title={open ? 'Collapse sidebar' : 'Expand sidebar'}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-md shrink-0"
        >
          {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Nav links */}
      <div className="space-y-1">
        <NavLink to="/dashboard" className={linkClass} title={!open ? 'Dashboard' : undefined}>
          {({ isActive }) => (
            <>
              <LayoutDashboard size={18} className={iconClass({ isActive })} />
              {open && <span>Dashboard</span>}
            </>
          )}
        </NavLink>

        {isEditor && (
          <NavLink to="/upload" className={linkClass} title={!open ? 'Upload Video' : undefined}>
            {({ isActive }) => (
              <>
                <Upload size={18} className={iconClass({ isActive })} />
                {open && <span>Upload Video</span>}
              </>
            )}
          </NavLink>
        )}

        <NavLink to="/library" className={linkClass} title={!open ? 'Video Library' : undefined}>
          {({ isActive }) => (
            <>
              <Library size={18} className={iconClass({ isActive })} />
              {open && <span>Video Library</span>}
            </>
          )}
        </NavLink>
      </div>

      {isAdmin && (
        <>
          <div className="my-3 border-t border-white/5 mx-2" />
          {open && (
            <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Administration
            </p>
          )}
          <div className="space-y-1">
            <NavLink to="/admin" className={linkClass} title={!open ? 'Manage Users' : undefined}>
              {({ isActive }) => (
                <>
                  <Users size={18} className={iconClass({ isActive })} />
                  {open && <span>Manage Users</span>}
                </>
              )}
            </NavLink>
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
