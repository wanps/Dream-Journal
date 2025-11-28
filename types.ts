export interface DreamAnalysis {
  transcription: string;
  imagePrompt: string;
  interpretation: {
    title: string;
    summary: string;
    archetypes: string[];
    analysis: string;
  };
}

export type ImageResolution = '1K' | '2K' | '4K';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  ANALYZING = 'ANALYZING',
  VIEWING = 'VIEWING',
}
