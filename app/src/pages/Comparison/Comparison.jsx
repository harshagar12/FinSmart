import React, { useState } from 'react';
import { Scale, TrendingUp, Wallet, Clock, Sparkles, Loader2, IndianRupee, PieChart as PieChartIcon, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';
import { apiUrl } from '../../lib/api';

export default function Comparison() {
  const [amount, setAmount] = useState(100000);
  const [period, setPeriod] = useState(5);
  const [periodType, setPeriodType] = useState('years');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCompare = async () => {
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch(apiUrl('/api/compare-strategy'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, period, periodType })
      });

      if (!response.ok) throw new Error('Failed to fetch comparison data');
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error(error);
      setResults({ error: "Failed to generate AI strategy. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-12 pb-20">
      
      {/* Header / Hero Style */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] border border-emerald-50 shadow-xl shadow-emerald-900/5 overflow-hidden p-8 lg:p-12 relative"
      >
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
           <Scale size={320} className="text-primary" />
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
              <div className="w-16 h-16 bg-linear-to-br from-primary to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <Scale size={36} fill="currentColor" />
              </div>
              <div>
                <h1 className="text-slate-900 font-black text-3xl tracking-tight leading-none">Fin<span className="text-primary">Compare</span></h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Smarter Decisions</p>
              </div>
            </motion.div>
            
            <div className="space-y-4">
              
                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Strategy <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-emerald-600">Comparison Engine</span>
              </h2>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6 max-w-md"
            >
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                Input your capital and timeline. Our AI will analyze the math across all major Indian market strategies and recommend the absolute best path for your parameters.
              </p>
            </motion.div>
          </div>

          {/* Right Side: Inputs */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col justify-center lg:border-l-2 border-emerald-50 lg:pl-12"
          >
            <div className="bg-slate-50/50 p-6 lg:p-8 rounded-3xl border border-slate-100/60 space-y-6">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                    <Wallet size={16} className="text-primary"/>
                    Total Investment 
                  </label>
                  <div className="flex items-center bg-white border border-slate-200 shadow-sm rounded-xl px-3 py-1.5 w-2/5">
                    <span className="text-primary font-black text-sm pr-1">₹</span>
                    <input 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="bg-transparent border-none text-slate-900 font-black text-right w-full outline-none focus:ring-0 text-base"
                    />
                  </div>
                </div>
                <input 
                  type="range" 
                  min="5000" 
                  max="10000000" 
                  step="5000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary" 
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center gap-4">
                  <label className="text-sm font-bold text-slate-600 flex items-center gap-2 shrink-0">
                    <Clock size={16} className="text-primary"/>
                    Time Horizon
                  </label>
                  <div className="flex items-center gap-2 w-1/2">
                    <div className="flex items-center bg-white border border-slate-200 shadow-sm rounded-xl px-3 py-1.5 flex-1 w-full">
                      <input 
                        type="number"
                        min="1"
                        value={period}
                        onChange={(e) => setPeriod(Number(e.target.value))}
                        className="bg-transparent border-none text-slate-900 font-black text-right w-full outline-none focus:ring-0 text-base"
                      />
                    </div>
                    <select
                      value={periodType}
                      onChange={(e) => setPeriodType(e.target.value)}
                      className="bg-white border border-slate-200 shadow-sm rounded-xl px-2 py-1.5 text-slate-600 font-bold text-sm outline-none w-20 shrink-0"
                    >
                      <option value="years">Yrs</option>
                      <option value="months">Mos</option>
                    </select>
                  </div>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max={periodType === 'years' ? 50 : 600} 
                  step="1"
                  value={period}
                  onChange={(e) => setPeriod(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary" 
                />
              </div>

              <button 
                onClick={handleCompare}
                disabled={isLoading}
                className="w-full mt-4 bg-slate-900 text-white font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} className="text-primary" />}
                {isLoading ? 'Analyzing Strategies...' : 'Generate AI Strategy'}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {results && !results.error && (
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
             className="space-y-8"
          >
             {/* Top: Numbers Comparison */}
             <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                  <TrendingUp size={320} className="text-primary" />
                </div>
                
                <div className="space-y-10 relative z-10 w-full mb-8">
                   <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-6">
                     <div>
                       <p className="text-primary text-sm font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                         <PieChartIcon size={16} /> Market Benchmarks Applied
                       </p>
                       <h3 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Strategy Returns Breakdown</h3>
                     </div>
                     <div className="text-right">
                        <p className="text-slate-400 font-bold text-sm mb-1 uppercase tracking-widest">Total Invested Amount</p>
                        <h4 className="text-3xl font-black text-slate-900">{formatCurrency(results.comparisons.amountInvested)}</h4>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                      {/* Row 1: SIP + PPF */}
                      <div className="space-y-3">
                         <div className="flex justify-between items-end">
                            <span className="text-slate-600 font-bold text-lg">Monthly SIP (Eq @ {results.comparisons.rates.sip}%)</span>
                            <span className="text-3xl font-black text-slate-900">{formatCurrency(results.comparisons.sipValue)}</span>
                         </div>
                         <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${Math.min(100, (results.comparisons.sipValue / Math.max(results.comparisons.sipValue, results.comparisons.lumpsumValue, results.comparisons.ppfValue, results.comparisons.rdValue, results.comparisons.fdValue)) * 100)}%` }}></div>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <div className="flex justify-between items-end">
                            <span className="text-slate-600 font-bold text-lg">PPF (Yearly @ {results.comparisons.rates.ppf}%)</span>
                            <span className="text-3xl font-black text-slate-900">{formatCurrency(results.comparisons.ppfValue)}</span>
                         </div>
                         <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div className="bg-purple-500 h-3 rounded-full" style={{ width: `${Math.min(100, (results.comparisons.ppfValue / Math.max(results.comparisons.sipValue, results.comparisons.lumpsumValue, results.comparisons.ppfValue, results.comparisons.rdValue, results.comparisons.fdValue)) * 100)}%` }}></div>
                         </div>
                      </div>

                      {/* Row 2: FD + RD */}
                      <div className="space-y-3">
                         <div className="flex justify-between items-end">
                            <span className="text-slate-600 font-bold text-lg">Safe Haven (FD @ {results.comparisons.rates.fd}%)</span>
                            <span className="text-3xl font-black text-slate-900">{formatCurrency(results.comparisons.fdValue)}</span>
                         </div>
                         <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div className="bg-slate-400 h-3 rounded-full" style={{ width: `${Math.min(100, (results.comparisons.fdValue / Math.max(results.comparisons.sipValue, results.comparisons.lumpsumValue, results.comparisons.ppfValue, results.comparisons.rdValue, results.comparisons.fdValue)) * 100)}%` }}></div>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <div className="flex justify-between items-end">
                            <span className="text-slate-600 font-bold text-lg">Recurring Deposit (RD @ {results.comparisons.rates.rd}%)</span>
                            <span className="text-3xl font-black text-slate-900">{formatCurrency(results.comparisons.rdValue)}</span>
                         </div>
                         <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div className="bg-amber-500 h-3 rounded-full" style={{ width: `${Math.min(100, (results.comparisons.rdValue / Math.max(results.comparisons.sipValue, results.comparisons.lumpsumValue, results.comparisons.ppfValue, results.comparisons.rdValue, results.comparisons.fdValue)) * 100)}%` }}></div>
                         </div>
                      </div>

                      {/* Row 3: Lumpsum full width */}
                      <div className="space-y-3 md:col-span-2">
                         <div className="flex justify-between items-end">
                            <span className="text-slate-600 font-bold text-lg">Lumpsum (Eq @ {results.comparisons.rates.lumpsum}%)</span>
                            <span className="text-3xl font-black text-slate-900">{formatCurrency(results.comparisons.lumpsumValue)}</span>
                         </div>
                         <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${Math.min(100, (results.comparisons.lumpsumValue / Math.max(results.comparisons.sipValue, results.comparisons.lumpsumValue, results.comparisons.ppfValue, results.comparisons.rdValue, results.comparisons.fdValue)) * 100)}%` }}></div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

            {/* Bottom: AI Recommendation */}
             <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] border border-emerald-50 shadow-xl shadow-emerald-900/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-linear-to-b from-primary to-emerald-400 rounded-l-full" />
                
                <div className="space-y-8 relative z-10 pl-2">
                   <div className="flex items-center gap-4 border-b border-emerald-50 pb-6">
                     <div className="bg-emerald-50 p-3.5 rounded-2xl text-primary shadow-inner shadow-emerald-500/10">
                       <Zap size={28} fill="currentColor" />
                     </div>
                     <div>
                       <h3 className="text-3xl font-black text-slate-900 tracking-tight">AI Strategy Verdict</h3>
                       <p className="text-slate-500 font-medium mt-1">Personalized guidance based on your parameters.</p>
                     </div>
                   </div>
                   
                   <div className="text-slate-700 font-medium leading-relaxed text-base space-y-4 [&>h1]:font-black [&>h1]:text-2xl [&>h1]:text-slate-900 [&>h2]:font-bold [&>h2]:text-xl [&>h2]:text-slate-900 [&>h3]:font-bold [&>h3]:text-lg [&>h3]:text-slate-800 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:space-y-3 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:space-y-3 [&>li]:pl-2 [&>strong]:text-primary [&>strong]:font-black [&>p]:leading-loose [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-slate-600">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {results.aiRecommendation}
                      </ReactMarkdown>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
