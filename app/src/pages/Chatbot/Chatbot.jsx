import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, Bot, User, CheckCircle2, TrendingUp, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { 
      id: '1', 
      role: 'assistant', 
      content: "Hello! I'm your FinSmart advisor. I can help you with portfolio analysis, tax optimization, and the latest market trends. How can I assist your financial goals today?", 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (text = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (text === input) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages.map(m => ({ role: m.role, content: m.content })) })
      });
      
      const data = await response.json();
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "I'm sorry, I couldn't process that request.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error while connecting to the advisor. Please ensure the backend is running and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    { label: 'Stock Market Basics', icon: TrendingUp },
    { label: 'Tax Saving Tips', icon: Sparkles },
    { label: 'Investment Risks', icon: ShieldAlert },
    { label: 'SIP vs Lumpsum', icon: TrendingUp },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-6 bg-[#10b77f] rounded-full" />
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Advisor</h2>
      </div>

      {/* Suggestions */}
      {!isLoading && messages.length <= 1 && (
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
          {suggestions.map((s) => (
            <button 
              key={s.label}
              onClick={() => handleSend(s.label)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-emerald-50 text-sm font-bold text-slate-600 shadow-sm hover:border-[#10b77f] hover:text-[#10b77f] transition-all hover:scale-105"
            >
              <s.icon size={16} />
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Chat History */}
      <div className="flex-1 space-y-8 px-2 pb-8">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-start gap-4",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "size-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                msg.role === 'assistant' ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-[#10b77f] border border-emerald-100"
              )}>
                {msg.role === 'assistant' ? <Bot size={22} /> : <User size={22} />}
              </div>

              <div className={cn(
                "flex flex-col gap-2 max-w-[80%]",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {msg.role === 'assistant' ? 'FinSmart Advisor' : 'You'}
                </span>
                <div className={cn(
                  "p-5 rounded-3xl shadow-sm border text-sm leading-relaxed",
                  msg.role === 'assistant' 
                    ? "bg-white border-emerald-50 text-slate-800 rounded-tl-none whitespace-pre-wrap" 
                    : "bg-[#10b77f] border-emerald-600 text-white rounded-tr-none shadow-emerald-500/20"
                )}>
                  {msg.role === 'assistant' ? (
                    <div className="space-y-4 [&>h1]:font-black [&>h1]:text-xl [&>h1]:text-slate-900 [&>h2]:font-bold [&>h2]:text-lg [&>h2]:text-slate-900 [&>h3]:font-bold [&>h3]:text-md [&>h3]:text-slate-800 [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:ml-5 [&>ol]:space-y-1 [&>li]:pl-1 [&>strong]:text-[#10b77f] [&>strong]:font-black [&>p]:leading-relaxed [&>a]:text-blue-500 [&>a]:underline">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  {msg.timestamp}
                  {msg.role === 'user' && <CheckCircle2 size={12} className="text-[#10b77f]" />}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 text-slate-400"
          >
            <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center">
              <Bot size={22} className="animate-pulse" />
            </div>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </motion.div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 pt-4 bg-[#f6f8f7]">
        <div className="relative flex items-center gap-2 bg-white p-2 rounded-3xl shadow-xl shadow-emerald-900/5 border border-emerald-50 focus-within:border-[#10b77f] transition-all">
          <button className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-colors">
            <Paperclip size={20} />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your financial query here..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 text-slate-800 placeholder:text-slate-400 font-medium"
          />
          <button className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-colors">
            <Mic size={20} />
          </button>
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-[#10b77f] text-white rounded-2xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="mt-4 text-center text-[10px] text-slate-400 font-bold leading-relaxed">
          FinSmart can make mistakes. Consider consulting a professional financial advisor for critical decisions.
        </p>
      </div>
    </div>
  );
}