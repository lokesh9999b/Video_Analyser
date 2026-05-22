import React from 'react';

const ProgressBar = ({ progress, className = '', colorClass = 'bg-indigo-500', height = 'h-2' }) => {
  const normalizedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full bg-slate-800 rounded-full overflow-hidden border border-white/5 ${height} ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ease-out relative ${colorClass}`}
        style={{ width: `${normalizedProgress}%` }}
      >
        {normalizedProgress > 0 && normalizedProgress < 100 && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
