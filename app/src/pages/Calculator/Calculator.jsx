import React, { useState, useEffect } from 'react';
import { Calculator as CalculatorIcon, Info, TrendingUp, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { cn } from '../../lib/utils';

export default function Calculator() {
  const [strategyType, setStrategyType] = useState('SIP (Monthly)');
  const [initialInvestment, setInitialInvestment] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [annualStepUpRate, setAnnualStepUpRate] = useState(10);
  const [duration, setDuration] = useState(25);
  const [expectedReturn, setExpectedReturn] = useState(8.5);
  const [results, setResults] = useState({ wealth: 0, principal: 0, profit: 0 });

  const strategyOptions = [
    "SIP (Monthly)", 
    "Step-Up SIP", 
    "Lumpsum", 
    "Fixed Deposit", 
    "Recurring Deposit", 
    "PPF (Yearly)"
  ];

  useEffect(() => {
    const calculate = () => {
      let wealth = 0;
      let principal = 0;
      const roundRupee = (value) => Math.round((value + Number.EPSILON) * 1) / 1;
      const safeDuration = Math.max(0, Number(duration) || 0);
      const safeYears = Math.floor(safeDuration);
      const safeInitialInvestment = Math.max(0, Number(initialInvestment) || 0);
      const safeMonthlyContribution = Math.max(0, Number(monthlyContribution) || 0);
      const annualRate = Math.max(0, Number(expectedReturn) || 0) / 100;
      const monthlyRate = annualRate / 12;
      const stepUpFactor = 1 + Math.max(0, Number(annualStepUpRate) || 0) / 100;

      if (strategyType === 'Lumpsum' || strategyType === 'Fixed Deposit') {
        principal = safeInitialInvestment;

        if (strategyType === 'Fixed Deposit') {
          const quarterlyRate = annualRate / 4;
          wealth = principal * Math.pow(1 + quarterlyRate, safeDuration * 4);
        } else {
          wealth = principal * Math.pow(1 + annualRate, safeDuration);
        }
      } else if (strategyType === 'PPF (Yearly)') {
        // PPF modeled as yearly contribution at the beginning of each year.
        for (let year = 0; year < safeDuration; year++) {
          principal += safeInitialInvestment;
          wealth = (wealth + safeInitialInvestment) * (1 + annualRate);
        }
      } else if (strategyType === 'Step-Up SIP') {
        // Step-Up SIP formula requested by user.
        const years = safeYears;
        let currentMonthly = safeMonthlyContribution;
        wealth = 0;

        for (let year = 1; year <= years; year++) {
          for (let month = 1; month <= 12; month++) {
            const monthsRemaining = (years - year) * 12 + (12 - month) + 1;
            wealth += currentMonthly * Math.pow(1 + monthlyRate, monthsRemaining);
          }
          currentMonthly *= stepUpFactor;
        }

        principal = 0;
        currentMonthly = safeMonthlyContribution;
        for (let year = 0; year < years; year++) {
          principal += currentMonthly * 12;
          currentMonthly *= stepUpFactor;
        }
      } else if (strategyType === 'Recurring Deposit') {
        // RD formula provided by user:
        // FV = P * ((1 + r/4)^(4t) - 1) / (1 - (1 + r/4)^(-1/3))
        const p = safeMonthlyContribution;
        const r = annualRate;
        const t = safeDuration;
        principal = p * 12 * t;

        if (r === 0) {
          wealth = principal;
        } else {
          const fv = p * ((Math.pow(1 + r / 4, 4 * t) - 1) / (1 - Math.pow(1 + r / 4, -1 / 3)));
          wealth = Number.isFinite(fv) ? fv : principal;
        }
      } else {
        // SIP (Monthly)
        const months = safeDuration * 12;
        principal = safeMonthlyContribution * months;

        for (let month = 1; month <= months; month++) {
          wealth = (wealth + safeMonthlyContribution) * (1 + monthlyRate);
        }
      }

      setResults({
        wealth: roundRupee(wealth),
        principal: roundRupee(principal),
        profit: roundRupee(wealth - principal)
      });
    };

    calculate();
  }, [initialInvestment, monthlyContribution, annualStepUpRate, duration, expectedReturn, strategyType]);

  const chartData = [
    { name: 'Principal', value: results.principal, color: '#94a3b8' },
    { name: 'Profit', value: results.profit, color: '#10b77f' },
  ];

  const formatCurrency = (val) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Investment Calculator</h1>
        </div>
        <p className="text-slate-500 mt-2 text-lg font-medium">Forecast your wealth growth and achieve your financial milestones with precision.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Inputs Section */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-3xl border border-emerald-50 shadow-sm space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <CalculatorIcon className="text-primary" size={24} />
                Strategy Parameters
              </h3>
              
              <div className="relative">
                <select 
                  value={strategyType}
                  onChange={(e) => setStrategyType(e.target.value)}
                  className="w-full bg-slate-50 border border-emerald-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                >
                  {strategyOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <TrendingUp size={16} className="text-slate-400" />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Initial Investment */}
              {(strategyType === 'Lumpsum' || strategyType === 'Fixed Deposit' || strategyType === 'PPF (Yearly)') && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-600">
                      {strategyType === 'PPF (Yearly)' ? 'Yearly Investment' : 'Initial Investment'}
                    </label>
                    <div className="flex items-center bg-emerald-50 rounded-full px-3 py-1">
                      <span className="text-primary font-black text-sm">₹</span>
                      <input 
                        type="number"
                        value={initialInvestment}
                        onChange={(e) => setInitialInvestment(Number(e.target.value))}
                        className="bg-transparent border-none text-primary font-black text-sm w-20 outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="1000" 
                    max="100000" 
                    step="1000"
                    value={initialInvestment}
                    onChange={(e) => setInitialInvestment(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary" 
                  />
                </div>
              )}

              {/* Monthly Contribution */}
              {!(strategyType === 'Lumpsum' || strategyType === 'Fixed Deposit' || strategyType === 'PPF (Yearly)') && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-600">Monthly Contribution</label>
                    <div className="flex items-center bg-emerald-50 rounded-full px-3 py-1">
                      <span className="text-primary font-black text-sm">₹</span>
                      <input 
                        type="number"
                        value={monthlyContribution}
                        onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                        className="bg-transparent border-none text-primary font-black text-sm w-16 outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="5000" 
                    step="50"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary" 
                  />
                </div>
              )}

              {/* Expected Return (moved up for Step-Up SIP) */}
              {strategyType === 'Step-Up SIP' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-600">Expected Annual Return (%)</label>
                    <div className="flex items-center bg-emerald-50 rounded-full px-3 py-1">
                      <input
                        type="number"
                        step="0.1"
                        value={expectedReturn}
                        onChange={(e) => setExpectedReturn(Number(e.target.value))}
                        className="bg-transparent border-none text-primary font-black text-sm w-12 text-right outline-none focus:ring-0"
                      />
                      <span className="text-primary font-black text-sm ml-1">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              )}

              {/* Duration */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-600">Duration (Years)</label>
                  <div className="flex items-center bg-emerald-50 rounded-full px-3 py-1">
                    <input 
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="bg-transparent border-none text-primary font-black text-sm w-10 text-right outline-none focus:ring-0"
                    />
                    <span className="text-primary font-black text-sm ml-1">Yrs</span>
                  </div>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  step="1"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary" 
                />
              </div>

              {/* Annual Step-Up Rate (moved down for Step-Up SIP) */}
              {strategyType === 'Step-Up SIP' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-600">Annual Step-Up Rate (%)</label>
                    <div className="flex items-center bg-emerald-50 rounded-full px-3 py-1">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={annualStepUpRate}
                        onChange={(e) => setAnnualStepUpRate(Number(e.target.value))}
                        className="bg-transparent border-none text-primary font-black text-sm w-12 text-right outline-none focus:ring-0"
                      />
                      <span className="text-primary font-black text-sm ml-1">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="0.5"
                    value={annualStepUpRate}
                    onChange={(e) => setAnnualStepUpRate(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-600">Expected Annual Return (%)</label>
                    <div className="flex items-center bg-emerald-50 rounded-full px-3 py-1">
                      <input
                        type="number"
                        step="0.1"
                        value={expectedReturn}
                        onChange={(e) => setExpectedReturn(Number(e.target.value))}
                        className="bg-transparent border-none text-primary font-black text-sm w-12 text-right outline-none focus:ring-0"
                      />
                      <span className="text-primary font-black text-sm ml-1">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              )}
            </div>

            <button className="w-full mt-10 bg-primary hover:bg-emerald-600 text-white font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20">
              <CalculatorIcon size={20} />
              Calculate Growth
            </button>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-3xl flex gap-4 items-start">
            <Info className="text-primary shrink-0" size={20} />
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Based on historic performance. Taxes and inflation are not factored in these estimates.
            </p>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              key={results.wealth}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-3xl border border-emerald-50 shadow-sm"
            >
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Estimated Wealth</p>
              <h2 className="text-4xl font-black text-slate-900 mt-2">{formatCurrency(results.wealth)}</h2>
              <div className="flex items-center gap-1 text-primary text-sm mt-3 font-bold">
                <TrendingUp size={16} />
                +{formatCurrency(results.profit)} profit
              </div>
            </motion.div>

            <div className="bg-white p-8 rounded-3xl border border-emerald-50 shadow-sm">
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Total Contributions</p>
              <h2 className="text-4xl font-black text-slate-900 mt-2">{formatCurrency(results.principal)}</h2>
              <div className="flex items-center gap-1 text-slate-400 text-sm mt-3 font-bold">
                <IndianRupee size={16} />
                Initial + Monthly
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-3xl border border-emerald-50 shadow-sm flex flex-col md:flex-row items-center gap-12">
            <div className="relative size-64 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Returns</span>
                <span className="text-3xl font-black text-slate-900">
                  {results.wealth > 0 ? Math.round((results.profit / results.wealth) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-8 w-full">
              <h4 className="text-2xl font-black text-slate-900">Growth Distribution</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="size-3 rounded-full bg-slate-400" />
                    <span className="text-slate-600 font-bold">Total Principal</span>
                  </div>
                  <span className="font-black text-slate-900">{formatCurrency(results.principal)}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="size-3 rounded-full bg-primary" />
                    <span className="text-emerald-700 font-bold">Estimated Interest</span>
                  </div>
                  <span className="font-black text-primary">+{formatCurrency(results.profit)}</span>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between px-2">
                  <span className="text-slate-900 font-black text-lg">Projected Total</span>
                  <span className="text-3xl font-black text-slate-900">{formatCurrency(results.wealth)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

