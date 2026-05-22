import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileVideo, X, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';

const VideoUploader = ({ onUpload, uploading, progress }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      const selected = acceptedFiles[0];
      setFile(selected);
      // Auto-fill title from filename
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ""));
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    if (description) formData.append('description', description);

    onUpload(formData, () => {
      setFile(null);
      setTitle('');
      setDescription('');
    });
  };

  const removeFile = () => {
    setFile(null);
    setTitle('');
  };

  return (
    <div className="bg-slate-900/40 rounded-2xl p-6 md:p-8 border border-white/5">
      {!file ? (
        <div 
          {...getRootProps()} 
          className={`
            border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[320px]
            ${isDragActive ? 'border-indigo-500 bg-indigo-500/5 scale-[1.02]' : 'border-slate-700 hover:border-indigo-400/50 hover:bg-slate-800/50'}
            ${isDragReject ? 'border-red-500 bg-red-500/5' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 ${isDragActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
            <UploadCloud size={40} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {isDragActive ? 'Drop your video here' : 'Drag & drop a video'}
          </h3>
          <p className="text-slate-400 mb-6 max-w-sm">
            MP4, MOV, AVI or MKV formats supported. Maximum file size 100MB.
          </p>
          <Button type="button" variant="secondary" className="shadow-sm">Select File</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-card p-5 flex items-center gap-4 bg-indigo-500/5 border-indigo-500/20">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <FileVideo size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            {!uploading && (
              <button 
                type="button" 
                onClick={removeFile}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Video Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={uploading}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm disabled:opacity-50"
              placeholder="E.g., Product Demo 2024"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Description <span className="text-slate-500 font-normal">(Optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={uploading}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm resize-none disabled:opacity-50"
              placeholder="Add details about this video..."
            />
          </div>

          {uploading ? (
            <div className="space-y-3 glass-card p-6 bg-slate-900/50">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-indigo-400 animate-pulse">Uploading to secure vault...</span>
                <span className="text-white font-bold">{progress}%</span>
              </div>
              <ProgressBar progress={progress} height="h-2.5" colorClass="bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            </div>
          ) : (
            <div className="pt-2">
              <Button type="submit" fullWidth size="lg" icon={UploadCloud}>
                Upload & Process Video
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default VideoUploader;
