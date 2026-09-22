import React, { useState } from 'react';
import { useTutorStore } from '../../lib/store/useTutorStore';
import { speechRecognizer } from '../../lib/voice/speechRecognition';
import { Mic, MicOff, Send } from 'lucide-react';

export const VoiceOrb: React.FC<{ onTextSubmit: (text: string) => void }> = ({ onTextSubmit }) => {
  const { status, setStatus, setLastTranscript } = useTutorStore();
  const [isHovered, setIsHovered] = useState(false);
  const [showFallback, setShowFallback] = useState(!speechRecognizer.isSupported());
  const [textInput, setTextInput] = useState('');

  const isListening = status === 'Listening';
  const isBusy = status === 'Thinking' || status === 'Writing';

  const handleListenClick = () => {
    if (isBusy) return;
    
    if (!speechRecognizer.isSupported()) {
      setShowFallback(true);
      return;
    }

    if (isListening) {
      speechRecognizer.stop();
      setStatus('Ready');
      return;
    }

    setStatus('Listening');
    speechRecognizer.start(
      (transcript) => {
        setLastTranscript(transcript);
        setTextInput(transcript); // Pre-fill in case they want to edit
        setShowFallback(true);
        setStatus('Ready');
      },
      (err) => {
        console.warn("Speech error:", err);
        setStatus('Ready');
        setShowFallback(true);
      },
      () => {
        if (status === 'Listening') {
          setStatus('Ready');
        }
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isBusy) {
      onTextSubmit(textInput.trim());
      setTextInput('');
      setShowFallback(false);
    }
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
      {showFallback && (
        <form 
          onSubmit={handleSubmit}
          className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-neutral-200 animate-in fade-in slide-in-from-bottom-2"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Ask a question..."
            className="bg-transparent border-none outline-none text-neutral-800 min-w-[250px] placeholder:text-neutral-400"
            disabled={isBusy}
            autoFocus
          />
          <button 
            type="submit"
            disabled={!textInput.trim() || isBusy}
            className="p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      )}
      
      <button
        onClick={handleListenClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={isBusy}
        className={`relative flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 ${
          isListening 
            ? 'bg-red-500 scale-110 shadow-red-500/50' 
            : isBusy
            ? 'bg-neutral-300 cursor-not-allowed scale-95'
            : 'bg-neutral-900 hover:bg-neutral-800 hover:scale-105'
        }`}
      >
        {isListening ? (
          <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-40" />
        ) : null}
        
        {isListening ? (
          <MicOff className="text-white relative z-10" size={24} />
        ) : (
          <Mic className="text-white relative z-10" size={24} />
        )}
      </button>
    </div>
  );
};
