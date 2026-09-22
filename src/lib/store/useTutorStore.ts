import { create } from 'zustand';
import { TutorMode, TutorResponse } from '../contracts/tutor';

export type AppStatus = 'Ready' | 'Listening' | 'Thinking' | 'Writing';

interface TutorState {
  mode: TutorMode;
  status: AppStatus;
  lastTranscript: string;
  conversationSummary: string;
  lastResponse?: TutorResponse;
  physicsOpen: boolean;
  errorMessage?: string;
  
  setMode: (mode: TutorMode) => void;
  setStatus: (status: AppStatus) => void;
  setLastTranscript: (transcript: string) => void;
  setConversationSummary: (summary: string) => void;
  setLastResponse: (response: TutorResponse) => void;
  setPhysicsOpen: (open: boolean) => void;
  setErrorMessage: (msg?: string) => void;
}

export const useTutorStore = create<TutorState>((set) => ({
  mode: 'solve',
  status: 'Ready',
  lastTranscript: '',
  conversationSummary: '',
  physicsOpen: false,
  
  setMode: (mode) => set({ mode }),
  setStatus: (status) => set({ status, errorMessage: undefined }),
  setLastTranscript: (lastTranscript) => set({ lastTranscript }),
  setConversationSummary: (conversationSummary) => set({ conversationSummary }),
  setLastResponse: (lastResponse) => set({ lastResponse }),
  setPhysicsOpen: (physicsOpen) => set({ physicsOpen }),
  setErrorMessage: (errorMessage) => set({ errorMessage, status: 'Ready' }),
}));
