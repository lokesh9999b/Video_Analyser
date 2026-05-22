import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Calendar, FileVideo, HardDrive, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';
import { getVideo, deleteVideo } from '../api/video.api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import VideoPlayer from '../components/video/VideoPlayer';
import ProcessingStatus from '../components/video/ProcessingStatus';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const VideoPlayerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { socket } = useSocket();
  
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchVideo = async () => {
    try {
      const res = await getVideo(id);
      setVideo(res.data.data.video);
    } catch (err) {
      toast.error('Failed to load video');
      navigate('/library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideo();
  }, [id]);

  useEffect(() => {
    if (!socket || !video) return;

    socket.on('video:processing', (data) => {
      if (data.videoId === video._id) {
        setVideo(prev => ({
          ...prev,
          status: data.stage,
          processingProgress: data.progress,
        }));
        
        if (['completed', 'failed'].includes(data.stage)) {
          setTimeout(fetchVideo, 1000);
        }
      }
    });

    return () => socket.off('video:processing');
  }, [socket, video?._id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this video? This cannot be undone.')) return;
    
    setDeleting(true);
    try {
      await deleteVideo(id);
      toast.success('Video deleted successfully');
      navigate('/library');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete video');
      setDeleting(false);
    }
  };

  if (loading || !video) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
      </div>
    );
  }

  const isCompleted = video.status === 'completed';
  const isFailed = video.status === 'failed';
  const isProcessing = ['uploading', 'processing', 'analysing'].includes(video.status);
  
  const canDelete = isAdmin || (user.role === 'editor' && video.owner._id === user._id);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white font-medium transition-colors bg-slate-800/50 px-4 py-2 rounded-xl border border-white/5"
        >
          <ArrowLeft size={18} /> Back to Library
        </button>

        {canDelete && (
          <Button variant="danger" size="sm" icon={Trash2} onClick={handleDelete} loading={deleting}>
            Delete Video
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">{video.title}</h1>
          
          <div className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-6">
            <Badge variant={isCompleted ? 'success' : isFailed ? 'danger' : 'info'} className="capitalize">
              {video.status}
            </Badge>
            
            {video.sensitivity !== 'pending' && (
              <Badge variant={video.sensitivity === 'safe' ? 'success' : 'danger'} className="flex items-center gap-1.5">
                {video.sensitivity === 'safe' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                <span className="capitalize">{video.sensitivity} Content</span>
                {video.sensitivityScore != null && <span className="opacity-75">({(video.sensitivityScore * 100).toFixed(1)}%)</span>}
              </Badge>
            )}

            <div className="ml-auto flex items-center gap-5 text-sm text-slate-400 bg-slate-900/50 px-4 py-2 rounded-lg border border-white/5">
              <span className="flex items-center gap-2"><Calendar size={14} className="text-indigo-400" /> {new Date(video.createdAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-2"><HardDrive size={14} className="text-indigo-400" /> {(video.fileSize / (1024*1024)).toFixed(1)} MB</span>
              <span className="flex items-center gap-2"><FileVideo size={14} className="text-indigo-400" /> {video.resolution?.height ? `${video.resolution.width}x${video.resolution.height}` : 'Pending'}</span>
            </div>
          </div>
        </div>

        {/* Player or Status */}
        <div className="mt-8 rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 relative">
          <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay pointer-events-none" />
          {isCompleted ? (
            <VideoPlayer video={video} />
          ) : isProcessing ? (
            <div className="max-w-2xl mx-auto py-16 px-6">
              <ProcessingStatus stage={video.status} progress={video.processingProgress} />
            </div>
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center border-red-500/20 bg-gradient-to-b from-red-900/20 to-black">
              <ShieldAlert size={56} className="text-red-500 mb-5 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
              <h3 className="text-2xl font-bold text-white mb-2">Processing Failed</h3>
              <p className="text-slate-400 max-w-md text-center">There was an error processing this video. You may need to delete it and try uploading again.</p>
            </div>
          )}
        </div>

        {/* Details & Description */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-white">Description</h3>
            <div className="glass-card p-6 min-h-[140px]">
              {video.description ? (
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm md:text-base">{video.description}</p>
              ) : (
                <p className="text-slate-500 italic">No description provided.</p>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Video Details</h3>
            <div className="glass-card p-6 space-y-5">
              <div>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Uploaded By</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-400">
                    {video.owner?.name?.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm text-white font-medium">{video.owner?.name}</p>
                </div>
              </div>
              
              <div>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Original File</p>
                <p className="text-sm text-slate-300 truncate bg-slate-900/50 px-3 py-2 rounded-lg border border-white/5" title={video.originalFilename}>{video.originalFilename}</p>
              </div>
              
              {video.sensitivityDetails && (
                <div>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Analysis Metrics</p>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Frames Analysed:</span>
                      <span className="text-white font-medium">{video.sensitivityDetails.framesAnalysed || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Max Sensitivity Score:</span>
                      <span className="text-white font-medium">{video.sensitivityDetails.maxScore || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerPage;
