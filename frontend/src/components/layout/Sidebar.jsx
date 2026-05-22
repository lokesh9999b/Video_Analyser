/**
 * Sidebar — side navigation with active state, role-based links, and collapse toggle.
 */
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Upload, Library, Users, ChevronLeft, ChevronRight, X
} from 'lucide-react';

const Sidebar = ({ open, onToggle, mobileOpen, onMobileClose }) => {
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
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity" 
          onClick={onMobileClose} 
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`
          fixed lg:relative top-[65px] lg:top-0 left-0 z-50 h-[calc(100vh-65px)] lg:h-full 
          bg-slate-900 lg:bg-slate-900/40 border-r border-white/5
          flex flex-col shrink-0 backdrop-blur-xl
          transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden
          ${mobileOpen ? 'translate-x-0 w-64 p-4 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          ${open && !mobileOpen ? 'lg:w-64 lg:p-4' : ''}
          ${!open && !mobileOpen ? 'lg:w-16 lg:p-2' : ''}
          lg:flex
        `}
      >
      {/* Toggle button (Desktop only) / Close button (Mobile only) */}
      <div className={`flex items-center ${open || mobileOpen ? 'justify-end' : 'justify-center'} mb-6`}>
        <button
          onClick={onToggle}
          title={open ? 'Collapse sidebar' : 'Expand sidebar'}
          className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-md shrink-0"
        >
          {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
        
        <button
          onClick={onMobileClose}
          className="flex lg:hidden w-8 h-8 items-center justify-center rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav links */}
      <div className="space-y-1">
        <NavLink to="/dashboard" onClick={onMobileClose} className={linkClass} title={!open && !mobileOpen ? 'Dashboard' : undefined}>
          {({ isActive }) => (
            <>
              <LayoutDashboard size={18} className={iconClass({ isActive })} />
              {(open || mobileOpen) && <span>Dashboard</span>}
            </>
          )}
        </NavLink>

        {isEditor && (
          <NavLink to="/upload" onClick={onMobileClose} className={linkClass} title={!open && !mobileOpen ? 'Upload Video' : undefined}>
            {({ isActive }) => (
              <>
                <Upload size={18} className={iconClass({ isActive })} />
                {(open || mobileOpen) && <span>Upload Video</span>}
              </>
            )}
          </NavLink>
        )}

        <NavLink to="/library" onClick={onMobileClose} className={linkClass} title={!open && !mobileOpen ? 'Video Library' : undefined}>
          {({ isActive }) => (
            <>
              <Library size={18} className={iconClass({ isActive })} />
              {(open || mobileOpen) && <span>Video Library</span>}
            </>
          )}
        </NavLink>
      </div>

      {isAdmin && (
        <>
          <div className="my-3 border-t border-white/5 mx-2" />
          {(open || mobileOpen) && (
            <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Administration
            </p>
          )}
          <div className="space-y-1">
            <NavLink to="/admin" onClick={onMobileClose} className={linkClass} title={!open && !mobileOpen ? 'Manage Users' : undefined}>
              {({ isActive }) => (
                <>
                  <Users size={18} className={iconClass({ isActive })} />
                  {(open || mobileOpen) && <span>Manage Users</span>}
                </>
              )}
            </NavLink>
          </div>
        </>
      )}
    </aside>
    </>
  );
};

export default Sidebar;
