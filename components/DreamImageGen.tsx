import React, { useState } from 'react';
import { Image as ImageIcon, Loader2, Download, Maximize2 } from 'lucide-react';
import { ImageResolution } from '../types';
import { generateDreamImage } from '../services/geminiService';

interface DreamImageGenProps {
  prompt: string;
}

const DreamImageGen: React.FC<DreamImageGenProps> = ({ prompt }) => {
  const [resolution, setResolution] = useState<ImageResolution>('1K');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check for API Key permission for this model
      // gemini-3-pro-image-preview requires a user-selected key
      const win = window as any;
      if (win.aistudio) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await win.aistudio.openSelectKey();
        }
      }

      const url = await generateDreamImage(prompt, resolution);
      setImageUrl(url);
    } catch (err: any) {
      console.error(err);
      let errorMessage = "生成失败，请重试。";
      
      const errString = err.toString();
      // Catch 403 or Permission Denied or "Requested entity was not found" (often key related)
      if (errString.includes("Requested entity was not found") || errString.includes("permission denied") || errString.includes("403")) {
         errorMessage = "需要配置付费 API 密钥权限。";
         
         // Automatically prompt to select key again if permission failed
         const win = window as any;
         if (win.aistudio) {
           try {
             await win.aistudio.openSelectKey();
             errorMessage = "API 密钥已更新，请再次点击生成。";
           } catch (e) {
             // user cancelled or failed
           }
         }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header / Controls */}
      <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-indigo-300">
          <ImageIcon className="w-5 h-5" />
          <span className="font-medium">梦境可视化</span>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
            {(['1K', '2K', '4K'] as ImageResolution[]).map((res) => (
              <button
                key={res}
                onClick={() => setResolution(res)}
                disabled={loading}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  resolution === res
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Maximize2 className="w-4 h-4" />}
            {imageUrl ? '重新生成' : '生成'}
          </button>
        </div>
      </div>

      {/* Image Area */}
      <div className="relative aspect-video w-full bg-black/40 flex items-center justify-center min-h-[300px]">
        {loading ? (
          <div className="text-center space-y-3">
             <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
             <p className="text-indigo-300 text-sm animate-pulse">正在生成 {resolution} 图像...</p>
             <p className="text-slate-500 text-xs">可能需要几十秒，请耐心等待</p>
          </div>
        ) : imageUrl ? (
          <div className="group relative w-full h-full">
            <img 
              src={imageUrl} 
              alt="Dream visualization" 
              className="w-full h-full object-contain animate-in fade-in duration-700"
            />
             <a 
              href={imageUrl} 
              download={`dream-journal-${Date.now()}.png`}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
              title="下载图片"
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
        ) : (
          <div className="text-center p-8 max-w-md">
            <p className="text-slate-400 mb-2">准备生成图像</p>
            <p className="text-slate-500 text-xs italic opacity-75">"{prompt}"</p>
            {error && <p className="mt-2 text-xs text-slate-500">提示: 高清图像生成模型 (gemini-3-pro-image-preview) 需要绑定付费项目的 API 密钥</p>}
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
             <div className="text-center">
                <p className="text-red-400 mb-2">{error}</p>
                <button 
                  onClick={handleGenerate}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-xs text-white rounded-md transition-colors"
                >
                  重试
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DreamImageGen;