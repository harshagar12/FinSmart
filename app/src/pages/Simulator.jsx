import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet, TrendingUp, TrendingDown, Plus, Share2, ArrowLeft, Search,
  ChevronLeft, ChevronRight, PieChart as PieChartIcon, DollarSign,
  X, ArrowUpRight, BarChart3, Globe, Loader2, LogOut, Download,
  ChevronDown, Mail, Calendar, Shield
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const INITIAL_CASH = 100000;
const ITEMS_PER_PAGE_MARKET = 10;
const ITEMS_PER_PAGE_HOLDINGS = 3;
const ITEMS_PER_PAGE_HISTORY = 1;
const COLORS = ['#10b77f', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const fmt = (n, d = 2) =>
  n == null ? '–' : Number(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

/* ─── Canvas-drawn downloadable cards (no html2canvas dependency) ─── */
const downloadAssetCard = (holding) => {
  const W = 800, H = 440, R = 40, S = 2;
  const canvas = document.createElement('canvas');
  canvas.width = W * S; canvas.height = H * S;
  const ctx = canvas.getContext('2d');
  ctx.scale(S, S);

  // Rounded clip
  const round = (x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); };

  // Green gradient background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#10b981'); grad.addColorStop(1, '#047857');
  round(0, 0, W, H, R); ctx.fillStyle = grad; ctx.fill();

  // Avatar circle
  ctx.beginPath(); ctx.arc(64, 72, 28, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px system-ui';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText((holding.symbol || '?')[0], 64, 72);

  // Name & label
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px system-ui';
  ctx.fillText(holding.name || holding.symbol, 108, 50);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '500 12px system-ui';
  ctx.fillText('TRADING PERFORMANCE', 108, 80);

  // Holdings badge (top right)
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '500 11px system-ui';
  ctx.fillText('HOLDING', W - 40, 50);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui';
  ctx.fillText(`${holding.quantity} ${holding.symbol}`, W - 40, 68);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, 130); ctx.lineTo(W - 40, 130); ctx.stroke();

  // Price
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '500 12px system-ui';
  ctx.fillText('MARKET PRICE', 40, 160);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 42px system-ui';
  const price = holding.currentPrice;
  ctx.fillText(`$${fmt(price, price < 1 ? 4 : 2)}`, 40, 190);

  // Profit
  const profit = (holding.currentPrice - holding.avgPrice) * holding.quantity;
  const pct = holding.avgPrice > 0 ? ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100 : 0;
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '500 12px system-ui';
  ctx.fillText('TOTAL PROFIT', W - 40, 160);
  ctx.fillStyle = profit < 0 ? '#fca5a5' : '#fff'; ctx.font = 'bold 42px system-ui';
  ctx.fillText(`${profit >= 0 ? '+' : ''}$${fmt(Math.abs(profit))}`, W - 40, 190);
  ctx.fillStyle = profit < 0 ? '#fca5a5' : 'rgba(255,255,255,0.7)'; ctx.font = 'bold 16px system-ui';
  ctx.fillText(`${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`, W - 40, 248);

  // Bottom footer
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, H - 72); ctx.lineTo(W - 40, H - 72); ctx.stroke();
  ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = 'bold 14px system-ui';
  ctx.fillText('FinSmart Simulator', 76, H - 48);
  ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '500 11px system-ui';
  ctx.fillText('VERIFIED TRADE', W - 40, H - 44);

  // Download
  const link = document.createElement('a');
  link.download = `finsmart-${(holding.symbol || 'trade').toLowerCase()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

const downloadPortfolioCard = ({ totalValue, totalProfitLoss, profitLossPercentage, cash, holdings }) => {
  const W = 800, H = 520, R = 40, S = 2;
  const canvas = document.createElement('canvas');
  canvas.width = W * S; canvas.height = H * S;
  const ctx = canvas.getContext('2d');
  ctx.scale(S, S);

  const round = (x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); };

  // Dark background
  round(0, 0, W, H, R); ctx.fillStyle = '#0f172a'; ctx.fill();
  // Subtle accent glow
  const glow = ctx.createRadialGradient(W, 0, 0, W, 0, W * 0.6);
  glow.addColorStop(0, 'rgba(16,183,127,0.15)'); glow.addColorStop(1, 'transparent');
  round(0, 0, W, H, R); ctx.fillStyle = glow; ctx.fill();

  // Total Net Worth label
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.font = '600 12px system-ui';
  ctx.fillText('TOTAL NET WORTH', 48, 56);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 56px system-ui';
  ctx.fillText(`$${fmt(totalValue)}`, 48, 82);

  // P&L row
  const plColor = totalProfitLoss >= 0 ? '#34d399' : '#f87171';
  ctx.fillStyle = plColor; ctx.font = 'bold 18px system-ui';
  ctx.fillText(`${totalProfitLoss >= 0 ? '▲ +' : '▼ '}$${fmt(Math.abs(totalProfitLoss))}  (${profitLossPercentage.toFixed(2)}%)`, 48, 160);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(48, 210); ctx.lineTo(W - 48, 210); ctx.stroke();

  // Two info boxes
  const box = (x, y, w, h, label, value) => {
    round(x, y, w, h, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.font = '600 10px system-ui';
    ctx.fillText(label, x + 16, y + 14);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px system-ui';
    ctx.fillText(value, x + 16, y + 34);
  };
  const bw = (W - 48 * 2 - 16) / 2;
  box(48, 228, bw, 84, 'HOLDINGS', `${holdings.length} Assets`);
  box(48 + bw + 16, 228, bw, 84, 'CASH BALANCE', `$${fmt(cash)}`);

  // Top assets
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.font = '600 10px system-ui';
  ctx.fillText('TOP ASSETS', 48, 336);
  let ax = 48;
  holdings.slice(0, 5).forEach(h => {
    const label = h.symbol || '?';
    ctx.font = 'bold 11px system-ui';
    const tw = ctx.measureText(label).width + 24;
    round(ax, 356, tw, 30, 8);
    ctx.fillStyle = 'rgba(16,183,127,0.12)'; ctx.fill();
    ctx.strokeStyle = 'rgba(16,183,127,0.3)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#34d399'; ctx.textAlign = 'left';
    ctx.fillText(label, ax + 12, 364);
    ax += tw + 10;
  });

  // Footer
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(48, H - 72); ctx.lineTo(W - 48, H - 72); ctx.stroke();
  ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = 'bold 14px system-ui';
  ctx.fillText('FinSmart Simulator', 76, H - 46);
  ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.font = '600 11px system-ui';
  ctx.fillText('PAPER TRADING', W - 48, H - 42);

  const link = document.createElement('a');
  link.download = 'finsmart-portfolio.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
};

/* ─── Pagination ─── */
const Pagination = ({ current, total, onPageChange }) => {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button disabled={current === 1} onClick={() => onPageChange(current - 1)}
        className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-colors">
        <ChevronLeft size={16} />
      </button>
      {(() => {
        let start = Math.max(1, current - 1);
        let end = Math.min(total, start + 2);
        if (end - start < 2) start = Math.max(1, end - 2);
        
        const pages = [];
        for (let i = start; i <= end; i++) pages.push(i);
        
        return pages.map(p => (
          <button key={p} onClick={() => onPageChange(p)}
            className={cn("size-8 rounded-xl text-xs font-black transition-all",
              current === p ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white border border-slate-100 text-slate-400 hover:bg-slate-50")}>
            {p}
          </button>
        ));
      })()}
      <button disabled={current === total} onClick={() => onPageChange(current + 1)}
        className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-colors">
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

/* ─── User Profile Dropdown ─── */
const ProfileDropdown = ({ user, logout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initials = (user?.email || 'U').slice(0, 2).toUpperCase();

  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
    : 'Today';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group"
      >
        <div className="size-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
          {initials}
        </div>
        <ChevronDown size={14} className={cn("text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 overflow-hidden z-50"
          >
            {/* Profile card header */}
            <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-black text-white text-lg shadow-lg">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="font-black text-base leading-tight truncate">{user?.email?.split('@')[0]}</div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1">
                    <Shield size={9} /> Sandbox Trader
                  </div>
                </div>
              </div>
            </div>

            {/* Info rows */}
            <div className="p-3 space-y-0.5">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50">
                <Mail size={14} className="text-slate-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</div>
                  <div className="text-xs font-bold text-slate-700 truncate">{user?.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50">
                <Wallet size={14} className="text-slate-400 flex-shrink-0" />
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cash Balance</div>
                  <div className="text-xs font-bold text-emerald-600">${fmt(user?.wallet_balance)}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50">
                <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Member Since</div>
                  <div className="text-xs font-bold text-slate-700">{memberSince}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50">
                <DollarSign size={14} className="text-slate-400 flex-shrink-0" />
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Starting Capital</div>
                  <div className="text-xs font-bold text-slate-700">$100,000.00</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 mt-2">
                <button
                  onClick={() => { logout(); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-500 transition-colors text-xs font-black uppercase tracking-widest"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Share Asset Modal ─── */
const ShareAssetModal = ({ holding, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  if (!holding) return null;
  const profit = (holding.currentPrice - holding.avgPrice) * holding.quantity;
  const profitPct = holding.avgPrice > 0 ? ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100 : 0;

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      downloadAssetCard(holding);
      setDownloading(false);
    }, 100);
  };

  return createPortal(
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[9998] bg-slate-900/60 backdrop-blur-sm" />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="pointer-events-auto relative w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Share Performance</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Preview card */}
          <div className="p-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[2rem] text-white space-y-8 shadow-xl shadow-emerald-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-white text-lg">
                  {(holding.symbol || '?')[0]}
                </div>
                <div>
                  <div className="font-black text-lg leading-none">{holding.name}</div>
                  <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Trading Performance</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Holding</div>
                <div className="font-bold text-sm">{holding.quantity} {holding.symbol}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest block">Market Price</span>
                <span className="text-2xl font-black">${fmt(holding.currentPrice, holding.currentPrice < 1 ? 4 : 2)}</span>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest block">Total Profit</span>
                <div className={cn("flex items-center justify-end gap-1 text-2xl font-black", profit < 0 && "text-red-200")}>
                  {profit >= 0 ? <ArrowUpRight size={24} /> : <TrendingDown size={24} />}
                  ${fmt(Math.abs(profit))}
                </div>
                <div className="text-xs opacity-70 font-bold">{profitPct >= 0 ? '+' : ''}{profitPct.toFixed(2)}%</div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-6 bg-white rounded-lg flex items-center justify-center">
                  <TrendingUp size={14} className="text-emerald-600" />
                </div>
                <span className="text-xs font-black tracking-tight">FinSmart Simulator</span>
              </div>
              <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Verified Trade</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={onClose}
              className="flex items-center justify-center gap-2 py-4 bg-slate-100 rounded-2xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">
              Close
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center justify-center gap-2 py-4 bg-emerald-500 rounded-2xl font-bold text-white hover:bg-emerald-600 transition-colors disabled:opacity-50">
              {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {downloading ? 'Saving…' : 'Download Card'}
            </button>
          </div>
        </div>
      </motion.div>
      </div>
    </>,
    document.body
  );
};

/* ─── Share Portfolio Modal ─── */
const SharePortfolioModal = ({ onClose, holdings, totalValue, totalProfitLoss, profitLossPercentage, cash }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      downloadPortfolioCard({ totalValue, totalProfitLoss, profitLossPercentage, cash, holdings });
      setDownloading(false);
    }, 100);
  };

  return createPortal(
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[9998] bg-slate-900/60 backdrop-blur-sm" />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="pointer-events-auto relative w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-6 space-y-6 overflow-y-auto max-h-[90vh]">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Portfolio Summary</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Downloadable dark card */}
          <div
            className="p-8 bg-slate-900 rounded-[2rem] text-white space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Globe size={120} className="text-emerald-500" />
            </div>

            <div className="space-y-1 relative z-10">
              <span className="text-[10px] font-bold opacity-40 uppercase tracking-[0.3em]">Total Net Worth</span>
              <div className="text-4xl font-black tracking-tighter">${fmt(totalValue)}</div>
              <div className={cn("inline-flex items-center gap-1 text-xs font-bold", totalProfitLoss >= 0 ? "text-emerald-400" : "text-red-400")}>
                {totalProfitLoss >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {totalProfitLoss >= 0 ? '+' : ''}${fmt(totalProfitLoss)} ({profitLossPercentage.toFixed(2)}%)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 relative z-10">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest block mb-1">Holdings</span>
                <span className="text-lg font-black">{holdings.length} Assets</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest block mb-1">Cash Balance</span>
                <span className="text-lg font-black">${fmt(cash)}</span>
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest block">Top Assets</span>
              <div className="flex flex-wrap gap-2">
                {holdings.slice(0, 5).map(h => (
                  <div key={h.symbol} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    {h.symbol}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="size-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <TrendingUp size={14} className="text-white" />
                </div>
                <span className="text-xs font-black tracking-tight">FinSmart Simulator</span>
              </div>
              <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Paper Trading</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={onClose}
              className="flex items-center justify-center gap-2 py-4 bg-slate-100 rounded-2xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">
              Close
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center justify-center gap-2 py-4 bg-slate-900 rounded-2xl font-bold text-white hover:bg-slate-800 transition-colors disabled:opacity-50">
              {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {downloading ? 'Saving…' : 'Download Card'}
            </button>
          </div>
        </div>
      </motion.div>
      </div>
    </>,
    document.body
  );
};

/* ═══════════════════════════════════════════════════════════════ */
export default function Simulator({ onNavigate }) {
  const { user, token, login, register, logout, updateBalance } = useAuth();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [marketAssets, setMarketAssets] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [history, setHistory] = useState([]);
  const [portfolioHistory, setPortfolioHistory] = useState([{ time: '09:00', value: INITIAL_CASH }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [buyAmount, setBuyAmount] = useState({});
  const [sellAmount, setSellAmount] = useState({});
  const [showShareModal, setShowShareModal] = useState(null);
  const [showPortfolioShare, setShowPortfolioShare] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [marketPage, setMarketPage] = useState(1);
  const [holdingsPage, setHoldingsPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [timeframe, setTimeframe] = useState('24h'); // '1h', '24h', or '7d'

  // Load portfolio performance history from backend DB on login
  useEffect(() => {
    if (user && token) {
      fetchMarket(); fetchPortfolio(); fetchHistory(); fetchSnapshots();
    }
  }, [user, token]);

  const fetchMarket = async () => {
    setIsLoading(true);
    try {
      const [stocksRes, cryptoRes] = await Promise.all([
        fetch('/api/market-data/stocks'), fetch('/api/market-data/crypto')
      ]);
      const stocks = await stocksRes.json();
      const cryptos = await cryptoRes.json();
      setMarketAssets([
        ...(stocks.data || []).map(s => ({ 
          ...s, id: s.symbol, name: s.label || s.name, price: s.price || 0, 
          change: s.change_pct_24h || 0,
          change_pct_1h: s.change_pct_1h,
          change_pct_24h: s.change_pct_24h || 0,
          change_pct_7d: s.change_pct_7d,
          type: 'stock' 
        })),
        ...(cryptos.data || []).map(i => ({ 
          ...i, id: i.symbol, name: i.label || i.name, price: i.price || 0, 
          change: i.change_pct_24h || 0,
          change_pct_1h: i.change_pct_1h,
          change_pct_24h: i.change_pct_24h || 0,
          change_pct_7d: i.change_pct_7d,
          type: 'crypto' 
        }))
      ]);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('/api/simulator/portfolio', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setHoldings(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/simulator/history', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setHistory(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchSnapshots = async () => {
    try {
      const res = await fetch('/api/simulator/snapshots', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPortfolioHistory(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true); setAuthError('');
    try { isLoginMode ? await login(email, password) : await register(email, password); }
    catch (err) { setAuthError(err.message || 'Authentication failed'); }
    finally { setAuthLoading(false); }
  };

  const liveHoldings = useMemo(() => holdings.map(h => {
    const m = marketAssets.find(a => a.id === h.assetId);
    return { ...h, currentPrice: m ? m.price : h.avgPrice };
  }), [holdings, marketAssets]);

  const portfolioValue = useMemo(() => liveHoldings.reduce((acc, h) => acc + h.quantity * h.currentPrice, 0), [liveHoldings]);
  const cash = user?.wallet_balance || 0;
  const totalValue = cash + portfolioValue;
  const totalProfitLoss = totalValue - INITIAL_CASH;
  const profitLossPercentage = (totalProfitLoss / INITIAL_CASH) * 100;

  const allocationData = useMemo(() => {
    const data = liveHoldings.map(h => ({ name: h.symbol, fullName: h.name || h.symbol, value: h.quantity * h.currentPrice }));
    if (cash > 0) data.push({ name: 'Cash', fullName: 'Cash (Uninvested)', value: cash });
    return data;
  }, [liveHoldings, cash]);

  const filteredMarket = useMemo(() => marketAssets.filter(item => {
    const ms = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.symbol || '').toLowerCase().includes(searchQuery.toLowerCase());
    return ms && (selectedType === 'all' || item.type === selectedType);
  }), [marketAssets, searchQuery, selectedType]);

  const paginatedMarket = useMemo(() => { const s = (marketPage - 1) * ITEMS_PER_PAGE_MARKET; return filteredMarket.slice(s, s + ITEMS_PER_PAGE_MARKET); }, [filteredMarket, marketPage]);
  const totalMarketPages = Math.ceil(filteredMarket.length / ITEMS_PER_PAGE_MARKET);

  const paginatedHoldings = useMemo(() => { const s = (holdingsPage - 1) * ITEMS_PER_PAGE_HOLDINGS; return liveHoldings.slice(s, s + ITEMS_PER_PAGE_HOLDINGS); }, [liveHoldings, holdingsPage]);
  const totalHoldingsPages = Math.ceil(liveHoldings.length / ITEMS_PER_PAGE_HOLDINGS);

  const paginatedHistory = useMemo(() => { const s = (historyPage - 1) * ITEMS_PER_PAGE_HISTORY; return history.slice(s, s + ITEMS_PER_PAGE_HISTORY); }, [history, historyPage]);
  const totalHistoryPages = Math.ceil(history.length / ITEMS_PER_PAGE_HISTORY);

  const showNotif = (msg, isError = false) => {
    setNotification({ msg, isError });
    setTimeout(() => setNotification(null), 3000);
  };

  const snapPortfolio = async (newCash, holdingsAdjust = 0) => {
    const value = newCash + portfolioValue + holdingsAdjust;
    // Optimistically update chart immediately
    const entry = { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), value };
    setPortfolioHistory(prev => [...prev, entry]);
    // Persist to backend DB (survives browser close)
    try {
      await fetch('/api/simulator/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value })
      });
    } catch (e) { console.error('Snapshot save failed', e); }
  };

  const handleBuy = async (asset) => {
    const qty = parseFloat(buyAmount[asset.id] || '0');
    if (qty <= 0) return;
    try {
      const res = await fetch('/api/simulator/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ asset_id: asset.id, symbol: asset.symbol, name: asset.name, type: asset.type, qty, current_price: asset.price })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Buy failed');
      updateBalance(data.new_balance);
      setBuyAmount(p => ({ ...p, [asset.id]: '' }));
      // After buying: cash decreased, holdings increased by qty*price → net total unchanged
      snapPortfolio(data.new_balance, qty * asset.price);
      showNotif(`Bought ${qty} ${asset.symbol}`);
      fetchPortfolio(); fetchHistory();
    } catch (err) { showNotif(err.message, true); }
  };

  const handleSell = async (holding) => {
    const qty = parseFloat(sellAmount[holding.assetId] || '0');
    if (qty <= 0) return;
    try {
      const res = await fetch('/api/simulator/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ asset_id: holding.assetId, symbol: holding.symbol, name: holding.name, type: holding.type, qty, current_price: holding.currentPrice })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Sell failed');
      updateBalance(data.new_balance);
      setSellAmount(p => ({ ...p, [holding.assetId]: '' }));
      // After selling: cash increased, holdings decreased by qty*price → net total unchanged (profit already embedded)
      snapPortfolio(data.new_balance, -(qty * holding.currentPrice));
      showNotif(`Sold ${qty} ${holding.symbol}`);
      fetchPortfolio(); fetchHistory();
    } catch (err) { showNotif(err.message, true); }
  };

  /* ── LOGIN ── */
  if (!user) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 max-w-md w-full rounded-[2rem] shadow-xl border border-emerald-50 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-[#10b77f] rounded-2xl mx-auto flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-500/30">
              <TrendingUp size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">FinSmart Sandbox</h2>
            <p className="text-sm font-medium text-slate-500">Practice strategies with $100,000 of simulated paper money across live global assets.</p>
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-50 px-5 py-4 rounded-xl border border-slate-100 text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:border-[#10b77f] focus:ring-2 focus:ring-emerald-50 transition-all" required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-50 px-5 py-4 rounded-xl border border-slate-100 text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:border-[#10b77f] focus:ring-2 focus:ring-emerald-50 transition-all" required />
            {authError && <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-lg">{authError}</p>}
            <button type="submit" disabled={authLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl transition-all disabled:opacity-50">
              {authLoading ? <Loader2 size={20} className="animate-spin mx-auto" /> : (isLoginMode ? 'Login to Simulator' : 'Create Free Account')}
            </button>
          </form>
          <p className="text-center text-sm font-bold text-slate-500 cursor-pointer hover:text-[#10b77f] transition-colors"
            onClick={() => setIsLoginMode(!isLoginMode)}>
            {isLoginMode ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </p>
        </motion.div>
      </div>
    );
  }

  /* ── DASHBOARD ── */
  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-8">

      <AnimatePresence>
        {showShareModal && <ShareAssetModal holding={showShareModal} onClose={() => setShowShareModal(null)} />}
        {showPortfolioShare && (
          <SharePortfolioModal
            onClose={() => setShowPortfolioShare(false)}
            holdings={liveHoldings}
            totalValue={totalValue}
            totalProfitLoss={totalProfitLoss}
            profitLossPercentage={profitLossPercentage}
            cash={cash}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 text-white text-sm font-bold rounded-2xl shadow-2xl ${notification.isError ? 'bg-red-500' : 'bg-slate-900'}`}>
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => onNavigate('home')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Trading Simulator</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Paper Trading</p>
        </div>
        <ProfileDropdown user={user} logout={logout} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cash Available', value: cash, Icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Portfolio Value', value: portfolioValue, Icon: PieChartIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Total Amount', value: totalValue, Icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          {
            label: 'Total Profit/Loss', value: totalProfitLoss,
            Icon: totalProfitLoss >= 0 ? TrendingUp : TrendingDown,
            color: totalProfitLoss >= 0 ? 'text-emerald-600' : 'text-red-600',
            bg: totalProfitLoss >= 0 ? 'bg-emerald-50' : 'bg-red-50',
            suffix: ` (${profitLossPercentage.toFixed(2)}%)`
          },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
              <div className={cn('p-2 rounded-xl', stat.bg)}><stat.Icon size={16} className={stat.color} /></div>
            </div>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-2xl font-black text-slate-900">${fmt(stat.value)}</span>
              {stat.suffix && <span className={cn('text-xs font-bold', stat.color)}>{stat.suffix}</span>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Market */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Market Assets {isLoading && <Loader2 size={16} className="animate-spin text-slate-400" />}
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search assets..." value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setMarketPage(1); }}
                  className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-48" />
              </div>
              <select value={selectedType} onChange={e => { setSelectedType(e.target.value); setMarketPage(1); }}
                className="px-3 py-2 bg-slate-100 border-none rounded-xl text-sm font-bold text-slate-600 outline-none cursor-pointer">
                <option value="all">All</option>
                <option value="crypto">Crypto</option>
                <option value="stock">Stocks</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                    <th className="px-8 py-4">Asset</th>
                    <th className="px-8 py-4 text-right">Price</th>
                    <th className="px-8 py-4 text-right">
                      <button
                        onClick={() => {
                          const next = timeframe === '1h' ? '24h' : timeframe === '24h' ? '7d' : '1h';
                          setTimeframe(next);
                        }}
                        className="inline-flex items-center gap-1.5 hover:text-emerald-500 transition-colors group"
                      >
                        <span className="border-b border-dotted border-slate-300 group-hover:border-emerald-500">
                          {timeframe.toUpperCase()} Change
                        </span>
                        <div className="size-4 rounded-md bg-slate-100 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                          <TrendingUp size={10} className="text-slate-400 group-hover:text-emerald-500" />
                        </div>
                      </button>
                    </th>
                    <th className="px-8 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedMarket.map(asset => (
                    <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 text-xs flex-shrink-0">
                            {(asset.symbol || '?')[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate max-w-[120px]" title={asset.name}>{asset.name}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{asset.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-700 text-right">
                        ${fmt(asset.price, asset.price < 1 ? 4 : 2)}
                      </td>
                      <td className="px-8 py-5 text-right">
                        {(() => {
                          const val = asset[`change_pct_${timeframe}`];
                          if (val == null) return <span className="text-[10px] font-bold text-slate-300">N/A</span>;
                          return (
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-1 rounded-lg",
                              val >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            )}>
                              {val >= 0 ? '+' : ''}{val.toFixed(2)}%
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <input type="number" placeholder="Qty" min="0" step="any"
                            value={buyAmount[asset.id] || ''}
                            onChange={e => setBuyAmount(p => ({ ...p, [asset.id]: e.target.value }))}
                            className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-emerald-500 text-center" />
                          <button onClick={() => handleBuy(asset)}
                            className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                            <Plus size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedMarket.length === 0 && !isLoading && (
                    <tr><td colSpan={4} className="text-center py-12 text-slate-400 font-bold text-sm">No assets found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination current={marketPage} total={totalMarketPages} onPageChange={setMarketPage} />
        </div>

        {/* Holdings + History */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Holdings</h2>
              {liveHoldings.length > 0 && (
                <button onClick={() => setShowPortfolioShare(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors">
                  <Share2 size={12} /> Share Portfolio
                </button>
              )}
            </div>
            <div className="space-y-4">
              {liveHoldings.length === 0 ? (
                <div className="p-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center space-y-3">
                  <div className="size-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <Wallet size={24} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">No assets held yet</p>
                </div>
              ) : (
                <>
                  {paginatedHoldings.map(holding => {
                    const profit = (holding.currentPrice - holding.avgPrice) * holding.quantity;
                    const profitPct = holding.avgPrice > 0 ? ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100 : 0;
                    return (
                      <motion.div layout key={holding.assetId}
                        className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 text-xs flex-shrink-0">
                              {(holding.symbol || '?')[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate max-w-[80px]" title={holding.name}>{holding.name}</div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{holding.quantity} {holding.symbol}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <input type="number" placeholder="Qty" min="0" step="any"
                              value={sellAmount[holding.assetId] || ''}
                              onChange={e => setSellAmount(p => ({ ...p, [holding.assetId]: e.target.value }))}
                              className="w-14 px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-red-500 text-center" />
                            <button onClick={() => handleSell(holding)}
                              className="px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase hover:bg-red-100 transition-colors">
                              Sell
                            </button>
                            <button onClick={() => setShowShareModal(holding)}
                              className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="Share this holding">
                              <Share2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                          <div>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Avg. Price</span>
                            <span className="text-sm font-bold text-slate-700">${fmt(holding.avgPrice, 4)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Profit/Loss</span>
                            <span className={cn("text-sm font-bold", profit >= 0 ? "text-emerald-600" : "text-red-600")}>
                              {profit >= 0 ? '+' : ''}${fmt(profit)} ({profitPct.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <Pagination current={holdingsPage} total={totalHoldingsPages} onPageChange={setHoldingsPage} />
                </>
              )}
            </div>
          </div>

          {/* Trade History */}
          <div className="space-y-6 pt-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Trade History</h2>
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="p-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                  <p className="text-sm font-bold text-slate-400">No trade history yet</p>
                </div>
              ) : (
                <>
                  {paginatedHistory.map((item, idx) => (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key={item.id || idx}
                      className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("size-10 rounded-xl flex items-center justify-center font-black text-xs",
                            item.type === 'buy' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                            {(item.symbol || '?')[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{item.name || item.symbol}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {(item.type || 'sold').toUpperCase()} {item.quantity} {item.symbol}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.date}</div>
                          <div className="text-sm font-black text-slate-900">
                            ${fmt((item.quantity || 0) * (item.salePrice || item.avgPurchasePrice || 0))}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50">
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Price</span>
                          <span className="text-sm font-bold text-slate-700">${fmt(item.salePrice || item.avgPurchasePrice, 4)}</span>
                        </div>
                        <div className="text-right">
                          {item.type === 'sell' ? (
                            (() => {
                              // Use backend-computed profit (accurate to full precision)
                              // Fall back to formula for pre-fix records without avg_cost stored
                              const profit = item.profit != null
                                ? item.profit
                                : (Number(item.salePrice) - Number(item.avgPurchasePrice || 0)) * Number(item.quantity);
                              const isGain = profit >= 0;
                              const decimals = Math.abs(profit) < 0.01 ? 4 : 2;
                              return (
                                <>
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Realised P&amp;L</span>
                                  <span className={cn('text-sm font-bold', isGain ? 'text-emerald-600' : 'text-red-600')}>
                                    {isGain ? '+' : ''}${fmt(profit, decimals)}
                                  </span>
                                </>
                              );
                            })()
                          ) : (
                            <>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Total Cost</span>
                              <span className="text-sm font-bold text-slate-700">
                                ${fmt((Number(item.quantity) || 0) * (Number(item.avgPurchasePrice) || 0), 2)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <Pagination current={historyPage} total={totalHistoryPages} onPageChange={setHistoryPage} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CHARTS at bottom ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-8 border-t border-slate-100">
        <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Portfolio Performance</h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              <BarChart3 size={12} /> Live View
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioHistory}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b77f" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b77f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis hide domain={['dataMin - 2000', 'dataMax + 2000']} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                  formatter={(value) => [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Portfolio Value']}
                />
                <Area type="monotone" dataKey="value" stroke="#10b77f" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Allocation</h2>
          {allocationData.length > 0 ? (
            <>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocationData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {allocationData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0];
                        const index = allocationData.findIndex(a => a.name === d.name);
                        return (
                          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 text-left" style={{ minWidth: 160 }}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="size-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="text-xs font-black text-slate-900 truncate">{d.payload.fullName}</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{d.name}</div>
                            <div className="text-sm font-black text-slate-700">${Number(d.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {allocationData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {entry.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-xs font-bold text-slate-300">Start trading to see your chart</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
