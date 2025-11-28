import React, { useState } from 'react';
import { Moon, BookOpen, RotateCcw, Quote, BrainCircuit } from 'lucide-react';
import Recorder from './components/Recorder';
import DreamImageGen from './components/DreamImageGen';
import ChatInterface from './components/ChatInterface';
import { DreamAnalysis, AppState } from './types';
import { analyzeDreamAudio } from './services/geminiService';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [dreamData, setDreamData] = useState<DreamAnalysis | null>(null);

  const handleRecordingComplete = async (blob: Blob) => {
    setAppState(AppState.ANALYZING);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Content = base64data.split(',')[1];
        const mimeType = base64data.split(',')[0].match(/:(.*?);/)?.[1] || 'audio/webm';

        const data = await analyzeDreamAudio(base64Content, mimeType);
        setDreamData(data);
        setAppState(AppState.VIEWING);
      };
    } catch (error) {
      console.error("Analysis failed", error);
      setAppState(AppState.IDLE);
      alert("分析梦境失败，请重试。");
    }
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setDreamData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/20 text-slate-200 selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-white/5 bg-slate-950/50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Moon className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="font-serif text-xl font-medium tracking-tight text-slate-100">Oneiric Flow</h1>
          </div>
          {appState === AppState.VIEWING && (
            <button 
              onClick={reset}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              新记录
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        
        {appState === AppState.IDLE || appState === AppState.ANALYZING ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-4 max-w-2xl">
              <h2 className="font-serif text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 pb-2">
                捕捉潜意识
              </h2>
              <p className="text-lg text-slate-400 font-light">
                醒来后立即录下您的梦境。
                我们将为您转录、可视化并解读其中隐藏的含义。
              </p>
            </div>
            
            <div className="w-full max-w-md mt-12">
              <Recorder 
                onRecordingComplete={handleRecordingComplete} 
                isProcessing={appState === AppState.ANALYZING} 
              />
            </div>
          </div>
        ) : dreamData ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-8 duration-700">
            
            {/* Left Column: Dream Content & Image */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Header Analysis */}
              <div className="space-y-2">
                <h2 className="font-serif text-4xl text-white leading-tight">{dreamData.interpretation.title}</h2>
                <div className="flex flex-wrap gap-2 pt-2">
                  {dreamData.interpretation.archetypes.map((arch, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-indigo-950/50 border border-indigo-500/20 text-indigo-300 text-xs font-medium uppercase tracking-wider">
                      {arch}
                    </span>
                  ))}
                </div>
              </div>

              {/* Visualization */}
              <DreamImageGen prompt={dreamData.imagePrompt} />

              {/* Transcription */}
              <div className="bg-slate-900/30 rounded-xl p-6 border border-white/5">
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                  <Quote className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-widest">梦境转录</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-light text-lg">
                  "{dreamData.transcription}"
                </p>
              </div>

            </div>

            {/* Right Column: Analysis & Chat */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* Psychological Analysis */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700 shadow-xl">
                 <div className="flex items-center gap-2 mb-4 text-indigo-400">
                  <BrainCircuit className="w-5 h-5" />
                  <span className="font-serif text-lg text-slate-200">荣格心理学解读</span>
                </div>
                <div className="space-y-4">
                  <p className="text-slate-300 text-sm leading-relaxed opacity-90">
                    <span className="text-slate-500 font-medium uppercase text-xs block mb-1">摘要</span>
                    {dreamData.interpretation.summary}
                  </p>
                  <div className="h-px bg-slate-700/50 my-4" />
                  <p className="text-slate-200 text-base leading-relaxed">
                    {dreamData.interpretation.analysis}
                  </p>
                </div>
              </div>

              {/* Chat Interface */}
              <ChatInterface dreamData={dreamData} />

            </div>
          </div>
        ) : null}

      </main>
    </div>
  );
}