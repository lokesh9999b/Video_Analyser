import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, HardDrive, ShieldCheck, ShieldAlert, Video, Activity, Loader2 } from 'lucide-react';
import { getVideoStats, getVideos } from '../api/video.api';
import { useSocket } from '../context/SocketContext';
import VideoCard from '../components/video/VideoCard';
import ProcessingStatus from '../components/video/ProcessingStatus';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const [activeProcessings, setActiveProcessings] = useState({});

  const fetchData = async () => {
    try {
      const [statsRes, videosRes] = await Promise.all([
        getVideoStats(),
        getVideos({ limit: 4 })
      ]);
      setStats(statsRes.data.data.stats);
      setRecentVideos(videosRes.data.data.videos);
      
      const processing = {};
      videosRes.data.data.videos.forEach(v => {
        if (['uploading', 'processing', 'analysing'].includes(v.status)) {
          processing[v._id] = {
            stage: v.status,
            progress: v.processingProgress || 0,
            message: 'Processing...'
          };
        }
      });
      setActiveProcessings(processing);
      
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('video:processing', (data) => {
      setActiveProcessings(prev => {
        if (['completed', 'failed'].includes(data.stage)) {
          setTimeout(() => {
            setActiveProcessings(current => {
              const next = { ...current };
              delete next[data.videoId];
              return next;
            });
            fetchData(); 
          }, 5000);
        }
        
        return {
          ...prev,
          [data.videoId]: data
        };
      });
    });

    return () => {
      socket.off('video:processing');
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Videos', value: stats?.total || 0, icon: Video, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Storage Used', value: `${((stats?.totalStorage || 0) / (1024*1024)).toFixed(1)} MB`, icon: HardDrive, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Safe Content', value: stats?.safe || 0, icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Flagged Content', value: stats?.flagged || 0, icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-400 text-sm">Overview of your workspace video analytics and recent activities.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`glass-card p-6 border ${stat.bg} flex items-center justify-between shadow-lg`}>
              <div>
                <p className="text-sm font-semibold text-slate-400 mb-1 tracking-wide">{stat.label}</p>
                <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
              </div>
              <div className={`w-14 h-14 rounded-2xl bg-slate-900/60 shadow-inner flex items-center justify-center ${stat.color} border border-white/5`}>
                <Icon size={26} strokeWidth={2} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Processing Tasks */}
      {Object.keys(activeProcessings).length > 0 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="text-indigo-400 animate-pulse" size={20} />
            Active Processing Tasks
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {Object.values(activeProcessings).map((task) => (
              <ProcessingStatus 
                key={task.videoId} 
                stage={task.stage} 
                progress={task.progress} 
                message={task.message} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Videos */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Recent Uploads</h2>
          <Link to="/library" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            View All →
          </Link>
        </div>
        
        {recentVideos.length === 0 ? (
          <div className="glass-card p-16 text-center flex flex-col items-center border-dashed border-slate-700/50">
            <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center text-slate-500 mb-5">
              <PlayCircle size={40} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No videos yet</h3>
            <p className="text-slate-400 mb-8 max-w-sm">
              Your workspace is empty. Upload your first video to start processing and analyzing content.
            </p>
            <Link to="/upload" className="inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 px-6 py-3">
              Upload Video
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recentVideos.map(video => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
