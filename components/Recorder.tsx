import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface RecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  isProcessing: boolean;
}

const Recorder: React.FC<RecorderProps> = ({ onRecordingComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      // Setup Recorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' }); // Use webm for broad browser support
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(blob);
        
        // Cleanup visualizer
        if (audioContextRef.current) audioContextRef.current.close();
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Timer
      setDuration(0);
      timerRef.current = window.setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

      drawVisualizer();

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("无法访问麦克风，请确保已授予权限。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#0f172a'; // Match bg
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / dataArray.length) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i] / 2;
        
        // Gradient or simple color
        ctx.fillStyle = `rgb(${barHeight + 100}, 50, 200)`;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-pulse">
        <Loader2 className="w-16 h-16 text-indigo-400 animate-spin" />
        <p className="text-xl font-light text-slate-300">正在解读您的梦境...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-8 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-2xl">
      <div className="w-full h-32 mb-6 bg-slate-900 rounded-lg overflow-hidden relative">
        <canvas ref={canvasRef} width="400" height="128" className="w-full h-full" />
        {!isRecording && duration === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
            音频可视化就绪
          </div>
        )}
      </div>

      <div className="text-4xl font-mono text-slate-200 mb-8 font-light">
        {formatTime(duration)}
      </div>

      {!isRecording ? (
        <button
          onClick={startRecording}
          className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:shadow-[0_0_30px_rgba(239,68,68,0.7)]"
        >
          <Mic className="w-8 h-8 text-white" />
          <span className="absolute -bottom-8 text-sm text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">录音</span>
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-slate-700 hover:bg-slate-600 transition-all border-2 border-slate-500"
        >
          <Square className="w-8 h-8 text-white fill-current" />
          <span className="absolute -bottom-8 text-sm text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">停止</span>
        </button>
      )}
      
      <p className="mt-8 text-center text-slate-400 text-sm max-w-xs">
        在记忆犹新时详细描述你的梦境，剩下的交给我们。
      </p>
    </div>
  );
};

export default Recorder;