import React from 'react';
import { useTutorStore } from '../../lib/store/useTutorStore';
import { Loader2 } from 'lucide-react';

export const StatusPill: React.FC = () => {
  const { status, errorMessage } = useTutorStore();

  if (status === 'Ready' && !errorMessage) return null;

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
      {errorMessage ? (
        <span className="text-red-400">{errorMessage}</span>
      ) : (
        <>
          {(status === 'Thinking' || status === 'Writing') && (
            <Loader2 size={16} className="animate-spin text-neutral-400" />
          )}
          {status === 'Listening' && (
            <span className="relative flex h-3 w-3 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
          <span>{status}</span>
        </>
      )}
    </div>
  );
};
