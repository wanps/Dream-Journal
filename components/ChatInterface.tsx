import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles } from 'lucide-react';
import { ChatMessage, DreamAnalysis } from '../types';
import { createDreamChat } from '../services/geminiService';
import { Chat } from '@google/genai';

interface ChatInterfaceProps {
  dreamData: DreamAnalysis;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ dreamData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session when component mounts
    chatSessionRef.current = createDreamChat(dreamData);
    
    // Add initial greeting
    setMessages([{
      role: 'model',
      text: "我已经分析了您的梦境。您想深入探讨什么？我们可以讨论其中的象征、情绪或原型。"
    }]);
  }, [dreamData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !chatSessionRef.current) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg });
      const responseText = result.text;
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: responseText || "我暂时无法连接到梦境领域。" 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "连接中断，请重试。", 
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        <h3 className="font-serif text-lg text-slate-200">梦境向导</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             {msg.role === 'model' && (
               <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center shrink-0 border border-indigo-500/30">
                 <Bot className="w-5 h-5 text-indigo-400" />
               </div>
             )}
             
             <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
               msg.role === 'user' 
                 ? 'bg-indigo-600 text-white rounded-br-none' 
                 : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
             } ${msg.isError ? 'border-red-500/50 bg-red-900/20' : ''}`}>
               {msg.text}
             </div>

             {msg.role === 'user' && (
               <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                 <User className="w-5 h-5 text-slate-300" />
               </div>
             )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start animate-pulse">
             <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center shrink-0">
                 <Bot className="w-5 h-5 text-indigo-400" />
             </div>
             <div className="bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1">
               <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
               <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
               <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-800/50 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="询问关于梦境的问题..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;