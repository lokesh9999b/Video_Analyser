import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, Clock, ShieldCheck, ShieldAlert, Activity } from 'lucide-react';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';

const API_BASE = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
  : '';

const VideoCard = ({ video }) => {
  const isCompleted = video.status === 'completed';
  const isFailed = video.status === 'failed';
  const isProcessing = ['uploading', 'processing', 'analysing'].includes(video.status);

  // Construct thumbnail URL based on the backend static route
  const thumbnailUrl = video.thumbnailPath 
    ? `${API_BASE}/thumbnails/thumb_${video._id}.jpg`
    : null;

  return (
    <Link to={`/video/${video._id}`} className="group block animate-fade-in">
      <div className="glass-card overflow-hidden h-full flex flex-col bg-slate-900/40 border border-white/5 hover:border-indigo-500/30 transition-all duration-300">
        
        {/* Thumbnail Area */}
        <div className="aspect-video relative bg-slate-950 overflow-hidden">
          {isCompleted && thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={video.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 border-2 border-indigo-500/20 rounded-full"></div>
                    <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider animate-pulse">{video.status}</span>
                </div>
              ) : isFailed ? (
                <div className="text-red-500 flex flex-col items-center gap-2">
                  <ShieldAlert size={32} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Failed</span>
                </div>
              ) : (
                <PlayCircle size={40} className="text-slate-700" />
              )}
            </div>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
          
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
            {!isCompleted && !isFailed && (
              <Badge variant="info" className="shadow-lg backdrop-blur-md">Processing</Badge>
            )}
            {video.sensitivity === 'safe' && (
              <Badge variant="success" className="shadow-lg backdrop-blur-md"><ShieldCheck size={10} className="mr-1 inline" /> Safe</Badge>
            )}
            {video.sensitivity === 'flagged' && (
              <Badge variant="danger" className="shadow-lg backdrop-blur-md animate-pulse"><ShieldAlert size={10} className="mr-1 inline" /> Flagged</Badge>
            )}
          </div>

          {video.duration && isCompleted && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-semibold rounded backdrop-blur-sm">
              {new Date(video.duration * 1000).toISOString().substr(14, 5)}
            </div>
          )}
          
          {isProcessing && (
            <div className="absolute bottom-0 left-0 right-0">
              <ProgressBar progress={video.processingProgress || 0} height="h-1" colorClass="bg-indigo-500" className="rounded-none border-0" />
            </div>
          )}

          {/* Hover Play Button */}
          {isCompleted && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-12 h-12 rounded-full bg-indigo-600/90 flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.5)] transform scale-90 group-hover:scale-100 transition-transform duration-300">
                <PlayCircle size={24} className="ml-1" />
              </div>
            </div>
          )}
        </div>

        {/* Info Area */}
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1 group-hover:text-indigo-400 transition-colors">{video.title}</h3>
          
          <div className="mt-auto pt-3 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center font-bold text-[10px] text-indigo-400 border border-white/5">
                {video.owner?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="truncate max-w-[100px]">{video.owner?.name}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {new Date(video.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;
