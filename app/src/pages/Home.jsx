import React, { useState } from 'react';
import { TrendingUp, Calculator, MessageSquare, BookOpen, ArrowRight, Wallet, DollarSign, PiggyBank, CreditCard, Receipt, Target, Sparkles, Activity as ActivityIcon, Loader2, GraduationCap, Zap, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import { apiUrl } from '../lib/api';

export default function Home({ onNavigate }) {
  const [salary, setSalary] = useState('');
  const [emi, setEmi] = useState('');
  const [savings, setSavings] = useState('');
  const [expenses, setExpenses] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const tools = [
    { id: 'calculator', title: 'Calculator', desc: 'Compute returns & yields', icon: Calculator, color: 'bg-emerald-50 text-emerald-600' },
    { id: 'chat', title: 'AI Chat', desc: 'Ask financial questions', icon: MessageSquare, color: 'bg-blue-50 text-blue-600' },
    { id: 'comparison', title: 'Compare', desc: 'Strategy Analysis', icon: Scale, color: 'bg-teal-50 text-teal-600' },
    { id: 'simulator', title: 'Simulator', desc: 'Trade with paper money', icon: TrendingUp, color: 'bg-indigo-50 text-indigo-600' },
    { id: 'market', title: 'Market Data', desc: 'Live asset tracking', icon: ActivityIcon, color: 'bg-orange-50 text-orange-600' },
    { id: 'learning', title: 'Learning Park', desc: 'Interactive lessons', icon: GraduationCap, color: 'bg-purple-50 text-purple-600' },
    { id: 'dictionary', title: 'Dictionary', desc: 'Financial jargon', icon: BookOpen, color: 'bg-rose-50 text-rose-600' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const s = parseFloat(salary) || 0;
    const em = parseFloat(emi) || 0;
    const sv = parseFloat(savings) || 0;
    const ex = parseFloat(expenses) || 0;

    if (s === 0) {
      setSuggestion("Please enter your salary to get a suggestion.");
      return;
    }

    setIsLoading(true);
    setSuggestion(null);

    try {
      const response = await fetch(apiUrl('/api/affordability'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salary: s, emi: em, savings: sv, expenses: ex })
      });
      const data = await response.json();
      setSuggestion(data.response || "Failed to generate a strategy.");
    } catch (error) {
      console.error(error);
      setSuggestion("I encountered an error connecting to the advisor. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-20">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] border border-emerald-50 shadow-xl shadow-emerald-900/5 overflow-hidden p-8 lg:p-12 relative"
      >
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
           <Zap size={320} className="text-primary" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
          {/* Left Side: Logo and Heading */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="w-16 h-16 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <Zap size={36} fill="currentColor" />
              </div>
              <div>
                <h1 className="text-slate-900 font-black text-3xl tracking-tight leading-none">Fin<span className="text-primary">Smart</span></h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Intelligence</p>
              </div>
            </motion.div>
            
            <div className="space-y-4">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]"
              >
                Your Personal <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-emerald-600">Financial Genius</span>
              </motion.h2>
            </div>
          </div>

          {/* Right Side: Description */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6 max-w-md"
          >
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Navigate the complexities of personal finance with ease. Fin<span className="text-primary font-bold">Smart</span> utilizes advanced AI to demystify investments, assess affordability, and simulate real-time market scenarios.
            </p>
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => document.getElementById('affordability-section')?.scrollIntoView({ behavior: 'smooth' })} 
                 className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all hover:-translate-y-0.5"
               >
                 Get Started
               </button>
               <button 
                 onClick={() => document.getElementById('smart-tools-section')?.scrollIntoView({ behavior: 'smooth' })} 
                 className="bg-emerald-50 text-[#10b77f] px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-all hover:-translate-y-0.5"
               >
                 Explore Tools
               </button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Affordability DNA Section */}
      <section id="affordability-section" className="bg-white rounded-[2.5rem] border border-emerald-50 shadow-xl shadow-emerald-900/5 overflow-hidden scroll-mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left: Input Form */}
          <div className="p-8 lg:p-12 space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-[#10b77f] rounded-full" />
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Affordability DNA</h2>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed max-w-md">
                Understand your financial capacity and discover the trading strategies that align with your lifestyle.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { label: 'Monthly Salary', value: salary, setter: setSalary, icon: Wallet, placeholder: 'e.g. 50000' },
                  { label: 'Existing EMI', value: emi, setter: setEmi, icon: CreditCard, placeholder: 'e.g. 13000' },
                  { label: 'Total Savings', value: savings, setter: setSavings, icon: PiggyBank, placeholder: 'e.g. 12000' },
                  { label: 'Monthly Expenses', value: expenses, setter: setExpenses, icon: Receipt, placeholder: 'e.g. 25000' },
                ].map((field) => (
                  <div key={field.label} className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <field.icon size={16} />
                      <label className="text-xs font-bold uppercase tracking-widest">{field.label}</label>
                    </div>
                    <input 
                      type="number" 
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-lg font-bold text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                ))}
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#10b77f] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Target size={20} />}
                {isLoading ? 'Analyzing...' : 'Analyze My Profile'}
              </button>
            </form>
          </div>

          {/* Right: Result Display */}
          <div className="bg-emerald-50/30 p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden border-l border-emerald-50">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <Sparkles size={240} className="text-[#10b77f]" />
            </div>

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-6 flex flex-col items-center justify-center h-full"
                >
                  <div className="size-24 rounded-[2rem] bg-white shadow-lg shadow-emerald-900/5 border border-emerald-50 flex items-center justify-center mx-auto">
                    <Loader2 size={40} className="text-[#10b77f] animate-spin" />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <h3 className="text-xl font-bold text-slate-700">Analyzing Your DNA</h3>
                    <p className="text-sm text-slate-500 font-medium max-w-[240px] mx-auto leading-relaxed">
                      FinSmart AI is formulating your personalized trading and investment strategy...
                    </p>
                  </div>
                </motion.div>
              ) : suggestion ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8 relative z-10"
                >
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                      <Sparkles size={12} />
                      Your Strategy
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                      Personalized <br />
                      <span className="text-primary">Recommendation</span>
                    </h3>
                  </div>

                  <div className="p-8 bg-white rounded-4xl shadow-xl shadow-emerald-900/5 border border-emerald-50 relative">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#10b77f] rounded-l-full" />
                    <div className="text-slate-600 font-medium leading-relaxed text-sm space-y-3 [&>h1]:font-black [&>h1]:text-lg [&>h1]:text-slate-900 [&>h2]:font-bold [&>h2]:text-base [&>h2]:text-slate-900 [&>h3]:font-bold [&>h3]:text-sm [&>h3]:text-slate-800 [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:ml-5 [&>ol]:space-y-1 [&>li]:pl-1 [&>strong]:text-primary [&>strong]:font-black [&>p]:leading-relaxed [&>p]:mt-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {suggestion}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <button 
                    onClick={() => onNavigate('market')}
                    className="flex items-center gap-3 text-[#10b77f] font-black text-sm uppercase tracking-widest hover:gap-5 transition-all group"
                  >
                    Explore Live Markets
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-6 relative z-10"
                >
                  <div className="size-24 rounded-[2rem] bg-white shadow-lg shadow-emerald-900/5 border border-emerald-50 flex items-center justify-center mx-auto">
                    <TrendingUp size={40} className="text-emerald-100" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-400">Ready for Analysis</h3>
                    <p className="text-sm text-slate-400 font-medium max-w-[240px] mx-auto leading-relaxed">
                      Enter your financial details to receive a tailored trading strategy.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <div id="smart-tools-section" className="space-y-8 scroll-mt-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#10b77f] rounded-full" />
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Smart Tools</h2>
        </div>
        
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool, idx) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              onClick={() => onNavigate(tool.id)}
              className="group p-6 bg-white rounded-3xl border border-emerald-50 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 cursor-pointer"
            >
              <div className={cn("size-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300", tool.color)}>
                <tool.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{tool.title}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{tool.desc}</p>
            </motion.div>
          ))}
        </section>
      </div>

      {/* Footer */}
      <footer className="pt-12 pb-8 border-t border-emerald-50 text-center space-y-6">
        <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-slate-500">
          <a href="#" className="hover:text-[#10b77f] transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[#10b77f] transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-[#10b77f] transition-colors">Contact Us</a>
        </div>
        <p className="text-xs text-slate-400">© 2026 FinSmart. All rights reserved.</p>
      </footer>
    </div>
  );
}
