import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoUploader from '../components/video/VideoUploader';
import { uploadVideo } from '../api/video.api';
import toast from 'react-hot-toast';

const UploadPage = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleUpload = async (formData, onSuccess) => {
    setUploading(true);
    setProgress(0);
    
    try {
      await uploadVideo(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
      });
      
      toast.success('Video uploaded successfully! Processing started.');
      onSuccess();
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload video');
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pt-4">
      <div>
        <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Upload Video</h1>
        <p className="text-slate-400 text-base">
          Upload a new video to automatically begin the sensitivity analysis, thumbnail generation, and transcoding pipeline.
        </p>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-2 shadow-2xl">
        <VideoUploader 
          onUpload={handleUpload} 
          uploading={uploading} 
          progress={progress} 
        />
      </div>
    </div>
  );
};

export default UploadPage;
