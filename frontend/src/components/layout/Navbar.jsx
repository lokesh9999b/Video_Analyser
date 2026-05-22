/**
 * Navbar — top navigation bar with user menu, branding, and socket status.
 */
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  LogOut, User, Settings, ChevronDown, Wifi, WifiOff, Film
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { connected } = useSocket();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'editor': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between border-b border-white/5">
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
          <Film size={18} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">Pulse</span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-5">
        {/* Socket status */}
        <div className="flex items-center gap-2 text-xs font-medium bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5">
          {connected ? (
            <>
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-emerald-400">Live</span>
            </>
          ) : (
            <>
              <div className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </div>
              <span className="text-red-400">Offline</span>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-white leading-tight">{user?.name}</p>
              <p className="text-[11px] text-slate-400 leading-tight">{user?.organisation}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-slate-800">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-slate-900 rounded-xl p-1.5 animate-fade-in shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] border border-slate-700 z-50">
              <div className="px-3 py-3 border-b border-white/5 mb-1 bg-slate-800/30 rounded-t-lg">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                <span className={`inline-flex items-center mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getRoleBadgeColor(user?.role)}`}>
                  {user?.role}
                </span>
              </div>

              <div className="p-1">
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Settings size={16} className="text-slate-400" /> Admin Panel
                  </Link>
                )}

                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <User size={16} className="text-slate-400" /> Profile
                </Link>

                <div className="h-px bg-white/5 my-1 mx-2" />

                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors w-full cursor-pointer"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
