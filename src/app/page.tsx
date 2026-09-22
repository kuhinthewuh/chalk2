"use client";

import React, { useRef, useEffect } from 'react';
import { useTutorStore } from '../lib/store/useTutorStore';
import { Toolbar } from '../components/shell/Toolbar';
import { VoiceOrb } from '../components/voice/VoiceOrb';
import { StatusPill } from '../components/shell/StatusPill';
import { speechSynthesizer } from '../lib/voice/speechSynthesis';
import { TutorMode, CanvasAction, TutorResponse, PhysicsSceneSpec } from '../lib/contracts/tutor';

// Mocks for Codex-owned components that aren't merged yet
const TutorCanvas = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    exportCanvasImage: async () => 'data:image/png;base64,mock',
    applyCanvasActions: async (actions: CanvasAction[]) => {
      console.log('Mock apply actions:', actions);
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    captureSnapshot: () => console.log('Mock capture snapshot'),
    rewind: () => console.log('Mock rewind'),
    forward: () => console.log('Mock forward'),
  }));
  return <div className="w-full h-full bg-white flex items-center justify-center text-neutral-300">TutorCanvas (Mock)</div>;
});
TutorCanvas.displayName = 'TutorCanvas';

const ProjectileVisualization: React.FC<{ spec: PhysicsSceneSpec }> = ({ spec }) => {
  return (
    <div className="absolute inset-x-8 bottom-24 top-24 bg-neutral-900/95 backdrop-blur-xl rounded-3xl border border-neutral-700 shadow-2xl flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95">
      <div className="p-4 border-b border-neutral-700 flex justify-between items-center bg-neutral-800/50">
        <h3 className="font-medium">Physics Visualization</h3>
        <button onClick={() => useTutorStore.getState().setPhysicsOpen(false)} className="text-neutral-400 hover:text-white px-3 py-1 rounded bg-neutral-800">Close</button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <pre className="text-sm text-neutral-400">{JSON.stringify(spec, null, 2)}</pre>
      </div>
    </div>
  );
};

export default function Home() {
  const canvasRef = useRef<any>(null);
  const { 
    mode, 
    status, 
    setStatus, 
    conversationSummary, 
    setConversationSummary,
    setLastResponse,
    physicsOpen,
    setPhysicsOpen,
    setErrorMessage,
    lastResponse
  } = useTutorStore();

  const askTutor = async (userText: string, overrideMode?: TutorMode) => {
    if (!canvasRef.current) {
      setErrorMessage("Canvas is not ready.");
      return;
    }

    try {
      setStatus('Thinking');
      const image = await canvasRef.current.exportCanvasImage();
      
      const requestMode = overrideMode ?? mode;
      
      // Temporary mock fetch to simulate /api/tutor since Claude's PR isn't merged
      const mockResponse: TutorResponse = {
        recognizedContent: "Mock math",
        spokenResponse: requestMode === 'physics' ? "Here is the projectile visualization." : `I can help you ${requestMode} this.`,
        confidence: 0.9,
        canvasActions: requestMode === 'physics' ? [] : [
          { type: 'write', text: 'Step 1', at: { x: 0.5, y: 0.5 } }
        ],
        ...(requestMode === 'physics' ? {
          physicsScene: {
            kind: 'projectile',
            initialSpeed: 20,
            launchAngleDeg: 45,
            gravity: 9.81,
            showTrajectory: true,
            showVelocityVector: true,
            showGravityVector: true
          }
        } : {})
      };
      
      // Simulate network delay
      await new Promise(r => setTimeout(r, 1500));
      const data = mockResponse;

      if (data.confidence < 0.55) {
        setErrorMessage("I couldn't read that clearly. Can you rewrite it?");
        speechSynthesizer.speak("I couldn't read that clearly. Can you rewrite it?");
        setStatus('Ready');
        return;
      }

      setLastResponse(data);
      setStatus('Writing');

      if (data.physicsScene) {
        setPhysicsOpen(true);
      }

      // Start speaking when visual action begins
      speechSynthesizer.speak(data.spokenResponse);

      // Apply drawing actions if any
      if (data.canvasActions && data.canvasActions.length > 0) {
        await canvasRef.current.applyCanvasActions(data.canvasActions);
      }

      // Update basic context
      setConversationSummary((conversationSummary + " " + userText).slice(-200));
      setStatus('Ready');
    } catch (err) {
      console.error(err);
      setErrorMessage("Couldn't read that. Try again.");
      setStatus('Ready');
    }
  };

  const handleVoiceSubmit = (text: string) => {
    let overrideMode = mode;
    const lowerText = text.toLowerCase();
    
    // Simple heuristic for explain override if not in visualize
    if (mode !== 'physics' && (lowerText.includes('why') || lowerText.includes('explain'))) {
      overrideMode = 'explain';
    }

    askTutor(text, overrideMode);
  };

  return (
    <main className="relative w-full h-full bg-[#fcfcfc] overflow-hidden flex flex-col font-sans">
      <div className="absolute top-6 left-6 z-10 font-handwriting text-2xl font-bold text-neutral-800 tracking-tight">
        Tutor<span className="text-blue-500">AI</span>
      </div>

      <div className="absolute inset-0 z-0">
        <TutorCanvas ref={canvasRef} />
      </div>

      <Toolbar />
      <StatusPill />
      <VoiceOrb onTextSubmit={handleVoiceSubmit} />

      {physicsOpen && lastResponse?.physicsScene && (
        <ProjectileVisualization spec={lastResponse.physicsScene} />
      )}
    </main>
  );
}
