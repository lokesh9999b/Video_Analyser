import React, { useEffect, useState, useCallback } from 'react';
import { Search, Filter, Loader2, PlayCircle } from 'lucide-react';
import { getVideos } from '../api/video.api';
import VideoCard from '../components/video/VideoCard';
import Button from '../components/ui/Button';

const LibraryPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    search: '',
    status: '',
    sensitivity: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVideos(filters);
      setVideos(res.data.data.videos);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-8 animate-fade-in flex flex-col min-h-full pb-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Video Library</h1>
          <p className="text-slate-400">Manage and browse all videos uploaded to your workspace.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search videos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full lg:w-64 transition-all shadow-sm"
            />
          </div>

          <select 
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 appearance-none shadow-sm cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>

          <select 
            name="sensitivity"
            value={filters.sensitivity}
            onChange={handleFilterChange}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 appearance-none shadow-sm cursor-pointer"
          >
            <option value="">All Sensitivities</option>
            <option value="safe">Safe</option>
            <option value="flagged">Flagged</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {loading && videos.length === 0 ? (
        <div className="flex-1 flex justify-center items-center min-h-[40vh]">
          <Loader2 className="animate-spin text-indigo-500" size={36} />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex-1 glass-card p-16 text-center flex flex-col items-center justify-center border-dashed border-slate-700/50 min-h-[40vh]">
          <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center text-slate-500 mb-5">
            <Filter size={40} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No videos found</h3>
          <p className="text-slate-400 mb-8 max-w-sm">
            Try adjusting your search or filters to find what you're looking for.
          </p>
          <Button variant="secondary" onClick={() => { setSearchTerm(''); setFilters({ page: 1, search: '', status: '', sensitivity: '' }); }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map(video => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Showing page <span className="text-white font-semibold">{pagination.page}</span> of <span className="text-white font-semibold">{pagination.pages}</span>
              </p>
              <div className="flex items-center gap-3">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  disabled={!pagination.hasPrev}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  disabled={!pagination.hasNext}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LibraryPage;
