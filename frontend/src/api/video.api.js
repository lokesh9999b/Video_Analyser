import API from './axios';

export const uploadVideo = (formData, onUploadProgress) =>
  API.post('/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });

export const getVideos = (params) => API.get('/videos', { params });
export const getVideo = (id) => API.get(`/videos/${id}`);
export const deleteVideo = (id) => API.delete(`/videos/${id}`);
export const getVideoStats = () => API.get('/videos/stats');

// Streaming URL builder (used in <video> src)
export const getStreamUrl = (id) => {
  const token = localStorage.getItem('pulse_token');
  return `/api/videos/${id}/stream?token=${token}`;
};
