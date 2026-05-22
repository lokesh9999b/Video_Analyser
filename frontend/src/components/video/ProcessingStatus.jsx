import React from 'react';
import { UploadCloud, FileCog, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';

const STAGES = [
  { id: 'uploading', label: 'Uploading', icon: UploadCloud },
  { id: 'processing', label: 'Extracting Meta', icon: FileCog },
  { id: 'analysing', label: 'Safety Analysis', icon: ShieldCheck },
  { id: 'completed', label: 'Ready', icon: CheckCircle2 }
];

const ProcessingStatus = ({ stage, progress, message }) => {
  const currentStageIndex = STAGES.findIndex(s => s.id === stage);
  const isFailed = stage === 'failed';

  return (
    <div className="glass-card p-6 border border-white/5 shadow-xl bg-slate-900/60">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-1">Pipeline Status</h3>
          <p className="text-xs text-slate-400">{message || 'Processing in background...'}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-white">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Main Progress Bar */}
      <ProgressBar 
        progress={progress} 
        colorClass={isFailed ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-600 to-cyan-400'} 
        className="mb-8"
      />

      {/* Stepper */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-indigo-500 -translate-y-1/2 z-0 transition-all duration-500" 
          style={{ width: `${(Math.max(0, currentStageIndex) / (STAGES.length - 1)) * 100}%` }}
        />

        <div className="relative z-10 flex justify-between">
          {STAGES.map((s, idx) => {
            const Icon = s.icon;
            const isCompleted = currentStageIndex > idx || stage === 'completed';
            const isCurrent = currentStageIndex === idx;
            const isError = isFailed && isCurrent;

            return (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ring-4 ring-slate-900/60
                    ${isCompleted ? 'bg-indigo-500 text-white' : 
                      isCurrent ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] scale-110' : 
                      isError ? 'bg-red-500 text-white' : 
                      'bg-slate-800 text-slate-500'}
                  `}
                >
                  {isError ? <AlertCircle size={18} /> : <Icon size={18} className={isCurrent ? 'animate-pulse' : ''} />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider text-center max-w-[60px]
                  ${isCurrent || isCompleted ? 'text-slate-200' : 'text-slate-500'}
                `}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProcessingStatus;
