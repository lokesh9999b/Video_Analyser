/**
 * Layout — wraps authenticated pages with Navbar + Sidebar.
 */
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 min-h-[calc(100vh-65px)] overflow-auto relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
