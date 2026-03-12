import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Bitcoin, BarChart3, Activity, Coins } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

const portfolioData = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 5000 },
  { name: 'Thu', value: 4500 },
  { name: 'Fri', value: 6000 },
  { name: 'Sat', value: 5500 },
  { name: 'Sun', value: 7000 },
];

// Initial static placeholder or empty
const initialWatchlist = [];

const ITEMS_PER_PAGE = 10;

export default function LiveMarket() {
  const [selectedCategory, setSelectedCategory] = useState('Stocks');
  const [watchlist, setWatchlist] = useState([]);
  const [topAssets, setTopAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTop, setIsLoadingTop] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeframe, setTimeframe] = useState('24h');

  React.useEffect(() => {
    const fetchTopAssets = async () => {
      setIsLoadingTop(true);
      try {
        const categoriesToFetch = ['stocks', 'indices', 'metals', 'crypto'];
        const responses = await Promise.all(
          categoriesToFetch.map(cat => fetch(`/api/market-data/${cat}`).then(res => res.json()))
        );
        
        const topFour = responses.map(res => {
          if (res.data && res.data.length > 0) {
            const item = res.data[0];
            return {
              label: item.label,
              value: new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: item.currency || 'USD' 
              }).format(item.price || 0),
              change_pct_1h: item.change_pct_1h,
              change_pct_24h: item.change_pct_24h || 0,
              change_pct_7d: item.change_pct_7d,
              sparkline: item.sparkline || []
            };
          }
          return null;
        }).filter(Boolean);
        
        setTopAssets(topFour);
      } catch (error) {
        console.error("Failed to fetch top assets:", error);
      } finally {
        setIsLoadingTop(false);
      }
    };

    fetchTopAssets();
  }, []);

  React.useEffect(() => {
    setCurrentPage(1);
    setWatchlist([]);
    const fetchMarketData = async () => {
      setIsLoading(true);
      try {
        const cat = selectedCategory.toLowerCase();
        const response = await fetch(`/api/market-data/${cat}`);
        const result = await response.json();
        
        if (result.data) {
          const formatted = result.data.map(item => ({
            name: item.label,
            symbol: item.symbol.replace(/^\^/, ''),
            price: new Intl.NumberFormat('en-US', { 
              style: 'currency', 
              currency: item.currency || 'USD' 
            }).format(item.price || 0),
            change_pct_1h: item.change_pct_1h,
            change_pct_24h: item.change_pct_24h || 0,
            change_pct_7d: item.change_pct_7d,
            mcap: item.exchange || 'N/A',
            sparkline: item.sparkline || []
          }));
          setWatchlist(formatted);
        }
      } catch (error) {
        console.error("Failed to fetch market data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketData();
  }, [selectedCategory]);

  const categories = [
    { id: 'Stocks', icon: BarChart3 },
    { id: 'Indices', icon: Activity },
    { id: 'Metals', icon: Coins },
    { id: 'Crypto', icon: Bitcoin },
  ];

  const totalPages = Math.ceil(watchlist.length / ITEMS_PER_PAGE);
  const paginatedWatchlist = watchlist.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Market Stats Cards */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#10b77f] rounded-full" />
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Top Assets</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoadingTop ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-center py-6">
            <div className="animate-spin size-8 border-4 border-[#10b77f] border-t-transparent rounded-full" />
          </div>
        ) : (
          topAssets.map((stat, idx) => {
            const timeVal = stat[`change_pct_${timeframe}`];
            const isUp = (timeVal || 0) >= 0;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">{stat.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {timeVal == null ? 'N/A' : `${timeVal > 0 ? '+' : ''}${timeVal}%`}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
                <div className="h-12 mt-4 opacity-50">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stat.sparkline.length > 0 ? stat.sparkline.map((v, i) => ({ name: i, value: v })) : portfolioData}>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={isUp ? '#10b77f' : '#ef4444'} 
                        fill={isUp ? '#10b77f20' : '#ef444420'} 
                        strokeWidth={2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>

      {/* Watchlist Table */}
      <div className="bg-white rounded-3xl border border-emerald-50 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">Live Market Watchlist</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200",
                  selectedCategory === cat.id
                    ? 'bg-[#10b77f] text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <cat.icon size={18} />
                {cat.id}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                <th className="px-8 py-4 text-center">Asset</th>
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
                    <TrendingUp size={10} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </button>
                </th>
                <th className="px-8 py-4 text-right">Market Cap</th>
                <th className="px-8 py-4 text-center">Trend</th>
                <th className="px-8 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedWatchlist.map((asset) => (
                <tr key={asset.symbol} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-12">
                      <div className="w-24 px-2 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-600 group-hover:bg-white transition-colors shrink-0">
                        <span className="truncate">{asset.symbol}</span>
                      </div>
                      <div className="min-w-[150px]">
                        <p className="text-sm font-bold text-slate-900 truncate">{asset.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right text-sm font-black text-slate-900">{asset.price}</td>
                  <td className="px-8 py-5 text-right">
                    {(() => {
                      const val = asset[`change_pct_${timeframe}`];
                      if (val == null) return <span className="text-[10px] font-bold text-slate-300">N/A</span>;
                      return (
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-lg",
                          val >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        )}>
                          {val > 0 ? '+' : ''}{val}%
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-8 py-5 text-right text-sm font-medium text-slate-500">{asset.mcap}</td>
                  <td className="px-8 py-5 w-48">
                    <div className="h-16">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={asset.sparkline.length > 0 ? asset.sparkline.map((v, i) => ({ name: i, value: v })) : portfolioData}>
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={(asset[`change_pct_${timeframe}`] || 0) >= 0 ? '#10b77f' : '#ef4444'} 
                            fill={(asset[`change_pct_${timeframe}`] || 0) >= 0 ? '#10b77f10' : '#ef444410'} 
                            strokeWidth={2} 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button className="px-4 py-2 bg-emerald-50 text-[#10b77f] text-xs font-bold rounded-xl hover:bg-[#10b77f] hover:text-white transition-all">
                      Trade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="p-6 bg-slate-50/30 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing {Math.min(watchlist.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} - {Math.min(watchlist.length, currentPage * ITEMS_PER_PAGE)} of {watchlist.length} assets
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
            >
              <TrendingDown size={16} className="rotate-90" />
            </button>
            {(() => {
              let start = Math.max(1, currentPage - 1);
              let end = Math.min(totalPages, start + 2);
              if (end - start < 2) start = Math.max(1, end - 2);
              
              const pages = [];
              for (let i = start; i <= end; i++) pages.push(i);
              
              return pages.map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={cn(
                    "size-8 rounded-xl text-xs font-black transition-all shadow-sm",
                    currentPage === p 
                      ? "bg-[#10b77f] text-white shadow-emerald-500/20" 
                      : "bg-white border border-slate-100 text-slate-400 hover:bg-slate-50"
                  )}
                >
                  {p}
                </button>
              ));
            })()}
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
            >
              <TrendingUp size={16} className="-rotate-90" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
