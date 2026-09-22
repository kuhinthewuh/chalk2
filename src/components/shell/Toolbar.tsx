import React, { useState } from 'react';
import { useTutorStore } from '../../lib/store/useTutorStore';
import { TutorMode } from '../../lib/contracts/tutor';
import { Undo, Redo, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { speechSynthesizer } from '../../lib/voice/speechSynthesis';

const MODES: { value: TutorMode; label: string }[] = [
  { value: 'hint', label: 'Teach Me' },
  { value: 'check', label: 'Check' },
  { value: 'solve', label: 'Solve' },
  { value: 'physics', label: 'Visualize' },
];

interface ToolbarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onRewind?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onUndo, onRedo, onRewind }) => {
  const { mode, setMode } = useTutorStore();
  const [isMuted, setIsMuted] = useState(speechSynthesizer.getMuted());

  const toggleMute = () => {
    const newState = !isMuted;
    speechSynthesizer.setMuted(newState);
    setIsMuted(newState);
  };

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-neutral-200">
      <div className="flex bg-neutral-100 rounded-full p-1 border border-neutral-200">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              mode === m.value
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/50'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      
      <div className="w-px h-6 bg-neutral-200 mx-1" />

      <div className="flex gap-1">
        <button onClick={onUndo} className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors" title="Undo">
          <Undo size={18} />
        </button>
        <button onClick={onRedo} className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors" title="Redo">
          <Redo size={18} />
        </button>
        <button onClick={onRewind} className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors" title="Rewind">
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="w-px h-6 bg-neutral-200 mx-1" />

      <button onClick={toggleMute} className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors" title={isMuted ? "Unmute" : "Mute"}>
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
};
