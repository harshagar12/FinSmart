import React, { useState } from 'react';
import { Search, Sparkles, BookOpen, Scaling, CheckCircle2, ArrowLeft, TrendingUp, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

const HARDCODED_JARGONS = [
  {
    term: "SIP (Systematic Investment Plan)",
    definition: "A way to invest a fixed amount of money regularly — usually every month — into a mutual fund.",
    analogy: "Like a monthly subscription, but instead of getting a service, your money is steadily growing.",
    example: "If you invest ₹1,000 every month for 12 months, you've put in ₹12,000 total. With good returns, you'd end up with more."
  },
  {
    term: "Mutual Fund",
    definition: "A pool of money collected from many investors and invested together in stocks, bonds, or other assets by a professional manager.",
    analogy: "Like many friends pooling money to buy a large pizza — each person owns a slice proportional to what they contributed.",
    example: "If 1,000 people each invest ₹1,000, the total ₹10,00,000 is invested across many companies. Each investor owns a small share of this big basket."
  },
  {
    term: "Stock / Share",
    definition: "A small piece of ownership in a company. When you buy a stock, you become a part-owner of that company.",
    analogy: "If a company is a pizza, a stock is one slice. The more slices you own, the bigger your ownership.",
    example: "If a company has 100 shares and you buy 10, you own 10% of that company."
  },
  {
    term: "NAV (Net Asset Value)",
    definition: "The price of one unit of a mutual fund. It tells you how much one unit is worth on a given day.",
    analogy: "Like the price tag on a single slice of the mutual fund pizza — it changes every day based on how the investments perform.",
    example: "If a mutual fund's NAV is ₹50 and you invest ₹5,000, you get 100 units of that fund."
  },
  {
    term: "Index Fund",
    definition: "A type of mutual fund or ETF that simply tracks a market index like NIFTY 50 or SENSEX, instead of being actively managed.",
    analogy: "Instead of picking individual players for your team, you just copy the entire national team roster.",
    example: "A NIFTY 50 Index Fund holds shares in all 50 top Indian companies in the same proportion as the index."
  },
  {
    term: "Bull Market",
    definition: "A financial market in which prices are rising or are expected to rise.",
    analogy: "Like a bull thrusting its horns up into the air, prices go up.",
    example: "If the S&P 500 has risen 20% over a few months, we are in a bull market."
  },
  {
    term: "Bear Market",
    definition: "A market condition in which prices of securities are falling, usually by 20% or more.",
    analogy: "Like a bear swiping its paws down, prices go down.",
    example: "The 2008 financial crisis where housing and stock values crashed."
  },
  {
    term: "Compound Interest",
    definition: "Interest calculated on the initial principal, which also includes all of the accumulated interest from previous periods.",
    analogy: "Like a snowball rolling down a hill, gathering more snow and getting larger as it rolls.",
    example: "If you invest ₹10,000 at 10% interest, you earn ₹1,000 the first year. The second year you earn 10% on ₹11,000."
  },
  {
    term: "Liquidity",
    definition: "How quickly and easily an asset can be converted into cash without affecting its market price.",
    analogy: "Cash is like water (highly fluid), while a house is like ice (takes time to melt into cash).",
    example: "Checking accounts have high liquidity; commercial real estate has low liquidity."
  },
  {
    term: "Dividend",
    definition: "A distribution of a portion of a company's earnings, decided by the board of directors, paid to a class of its shareholders.",
    analogy: "Like a fruit tree giving you a few apples every season just for owning the tree.",
    example: "If a company declares a ₹50 dividend and you own 10 shares, you receive ₹500 in cash."
  },
  {
    term: "ETF (Exchange-Traded Fund)",
    definition: "A type of investment fund that tracks an index, sector, or commodity and is traded on a stock exchange like a regular stock.",
    analogy: "Like buying a variety pack of cereal instead of a single box of just one brand.",
    example: "Buying a single share of the NIFTY 50 ETF gives you tiny fractions of the top 50 companies in India."
  },
  {
    term: "Inflation",
    definition: "The rate at which the general level of prices for goods and services is rising and purchasing power is falling.",
    analogy: "A slow leak in a tire; over time, your money gets flatter and buys less.",
    example: "A cup of coffee that cost ₹20 ten years ago might cost ₹80 today due to inflation."
  },
  {
    term: "Diversification",
    definition: "A risk management strategy that mixes a wide variety of investments within a portfolio to reduce risk.",
    analogy: "Don't put all your eggs in one basket.",
    example: "Instead of putting all your money into tech stocks, spreading it across tech, healthcare, real estate, and government bonds."
  },
  {
    term: "Volatility",
    definition: "How much the price of an asset swings up and down over a period of time.",
    analogy: "Like a roller coaster ride — high volatility means steep drops and fast climbs.",
    example: "Cryptocurrencies have high volatility, while government bonds have low volatility."
  },
  {
    term: "Capital Gains",
    definition: "The profit you make when you sell an asset for more than what you paid for it.",
    analogy: "Buying a house cheaply, renovating it, and selling it for more. The difference is your gain.",
    example: "If you buy shares worth ₹10,000 and sell them later for ₹15,000, your capital gain is ₹5,000."
  },
  {
    term: "Portfolio",
    definition: "The complete collection of all investments owned by a person or institution.",
    analogy: "Like a school bag — your portfolio is the bag, and each investment (stocks, bonds, FDs) is a different book inside it.",
    example: "If you own ₹10,000 in stocks, ₹5,000 in mutual funds, and ₹20,000 in FDs, that entire collection is your portfolio."
  },
  {
    term: "Risk",
    definition: "The possibility that an investment's actual return will be different from the expected return, including the chance of losing money.",
    analogy: "Like driving a car — the faster you go (higher risk), the bigger the potential reward of reaching sooner, but also the bigger the chance of an accident.",
    example: "Investing in a startup has high risk — it could 10x your money or go to zero. An FD has very low risk but gives modest returns."
  },
  {
    term: "Return",
    definition: "The gain or loss made on an investment over a period of time, usually expressed as a percentage.",
    analogy: "Like planting a seed — the return is how much fruit the tree gives you compared to what you spent on the seed.",
    example: "If you invested ₹10,000 and it grew to ₹12,000 in a year, your return is 20%."
  },
  {
    term: "PPF (Public Provident Fund)",
    definition: "A long-term savings scheme backed by the Indian government that offers guaranteed returns and tax benefits.",
    analogy: "Like a government-protected piggy bank that you can't touch for 15 years but rewards your patience generously.",
    example: "If you deposit ₹1,50,000 every year into PPF at 7.1% interest for 15 years, you would accumulate around ₹40,68,000."
  },
  {
    term: "Broker",
    definition: "A person or platform that acts as a middleman between a buyer and seller to execute investment transactions.",
    analogy: "Like a real estate agent — they help you buy or sell a property (or in this case, stocks) and charge a small fee for it.",
    example: "Apps like Zerodha and Groww are stock brokers that let you buy and sell shares on the Indian stock market."
  },
  {
    term: "Equity",
    definition: "Ownership in a company represented by shares. Equity investors share in the company's profits and losses.",
    analogy: "Like owning a percentage of a food stall — if the stall does well, you earn more; if it fails, you lose your share.",
    example: "If you own 5% equity in a company worth ₹10,00,000, your stake is worth ₹50,000."
  },
  {
    term: "Debt Fund",
    definition: "A mutual fund that invests in fixed-income instruments like government bonds and corporate bonds, offering relatively stable returns.",
    analogy: "Like lending money to trustworthy borrowers who promise to pay you back with interest — less exciting but more predictable.",
    example: "A debt fund investing in government bonds might give you 6–8% annual returns with very low risk compared to equity funds."
  },
  {
    term: "Market Capitalisation",
    definition: "The total market value of a company's outstanding shares. It tells you how big a company is in the eyes of the market.",
    analogy: "Like the total price tag of an entire company if you were to buy every single share available.",
    example: "If a company has 1,00,00,000 shares and each share costs ₹500, the market cap is ₹500 crore."
  },
  {
    term: "SENSEX",
    definition: "The benchmark stock index of the Bombay Stock Exchange (BSE), tracking the performance of the top 30 companies in India.",
    analogy: "Like a report card for India's top 30 companies — if SENSEX goes up, those companies are generally doing well.",
    example: "When SENSEX crossed 80,000 points in 2024, it meant the combined value of India's top 30 listed companies had grown significantly."
  },
  {
    term: "NIFTY 50",
    definition: "The benchmark stock index of the National Stock Exchange (NSE), tracking the performance of the top 50 companies in India.",
    analogy: "Like a cricket team selection — it picks the top 50 performing companies to represent the overall health of the Indian stock market.",
    example: "If NIFTY 50 rises by 2% in a day, it means the average value of India's top 50 companies has gone up by 2%."
  },
  {
    term: "IPO (Initial Public Offering)",
    definition: "The first time a private company offers its shares to the public on a stock exchange to raise money.",
    analogy: "Like a restaurant that was invite-only suddenly opening its doors to everyone — now anyone can own a piece of it.",
    example: "When Zomato launched its IPO in 2021, the public could buy its shares for the first time at ₹76 per share."
  },
  {
    term: "Interest Rate",
    definition: "The percentage charged on a loan or paid on a deposit over a period of time, usually expressed annually.",
    analogy: "Like a rental fee for using someone else's money — the higher the rate, the more you pay (or earn) for borrowing (or lending).",
    example: "If your savings account pays 4% interest and you have ₹1,00,000 saved, you earn ₹4,000 in a year without doing anything."
  },
  {
    term: "Expense Ratio",
    definition: "The annual fee charged by a mutual fund or ETF to manage your money, expressed as a percentage of your investment.",
    analogy: "Like a small maintenance fee you pay every year to keep your investment vehicle running smoothly.",
    example: "If a mutual fund has an expense ratio of 1% and you have ₹1,00,000 invested, you pay ₹1,000 per year in fees."
  },
  {
    term: "Rebalancing",
    definition: "The process of realigning the proportions of assets in your portfolio to maintain your original desired level of risk.",
    analogy: "Like adjusting the ingredients in a recipe when one ingredient has grown too much — you trim it back to restore the right balance.",
    example: "If your target is 60% stocks and 40% bonds but stocks have grown to 75%, you sell some stocks and buy bonds to get back to 60/40."
  }
];

export default function Dictionary() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleSearch = (term) => {
    if (!term.trim()) return;
    setQuery(term);
    setResult(null);

    // Simulate search in hardcoded list
    const found = HARDCODED_JARGONS.find(j => 
      j.term.toLowerCase().includes(term.toLowerCase())
    );

    if (found) {
      setResult({ type: 'single', ...found });
    } else {
      setResult({ type: 'not_found', term });
    }
  };

  const handleAskAI = async () => {
    if (!query) return;
    setIsAiLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      setResult({
        type: 'single',
        term: query,
        definition: "I encountered an error while processing your request. Please try again later.",
        analogy: "Like a static-filled radio channel.",
        example: "Try refreshing the page or checking your connection."
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">
          <BookOpen size={14} />
          Glossary
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Financial <span className="text-[#10b77f]">Dictionary</span></h1>
        <p className="text-slate-500 font-medium max-w-md">Learn complex financial terms with simple analogies and real-world examples.</p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-2xl mx-auto w-full">
        <div className="relative flex items-center gap-2 bg-white p-2 rounded-3xl shadow-xl shadow-emerald-900/5 border border-emerald-50 focus-within:border-[#10b77f] transition-all">
          <div className="pl-4 text-slate-400">
            <Search size={22} />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
            placeholder="Search keywords (e.g., SIP, Mutual Fund)..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 text-slate-800 placeholder:text-slate-400 font-medium"
          />
          <button 
            onClick={() => handleSearch(query)}
            className="px-6 py-3 bg-white text-[#10b77f] border border-emerald-100 rounded-2xl font-bold hover:bg-emerald-50 transition-all"
          >
            Explain
          </button>
          <button 
            onClick={handleAskAI}
            className="px-6 py-3 bg-[#10b77f] text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2"
          >
            Ask AI
          </button>
        </div>
      </div>

      {/* Results / List */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {isAiLoading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-4"
            >
              <div className="size-16 rounded-3xl bg-emerald-50 flex items-center justify-center">
                <Sparkles size={32} className="text-[#10b77f] animate-pulse" />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">AI is thinking...</p>
            </motion.div>
          ) : result ? (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setResult(null)}
                  className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Library
                </button>
              </div>

              {result.type === 'not_found' ? (
                <div className="p-12 bg-white rounded-[2.5rem] border border-emerald-50 shadow-sm text-center space-y-4">
                  <div className="size-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto">
                    <BookOpen size={32} className="text-slate-200" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Term not in our quick library</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">We couldn't find a local definition for "{result.query || result.term}". Try asking our AI advisor for a detailed explanation.</p>
                </div>
              ) : (
                <div className="bg-white rounded-[2.5rem] border border-emerald-50 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="p-8 lg:p-12 space-y-8">
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black text-slate-900 tracking-tight">{result.term}</h2>
                       <div className="w-12 h-1 bg-[#10b77f] rounded-full" />
                    </div>

                    <div className="space-y-8">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Definition</span>
                        <p className="text-lg text-slate-700 font-medium leading-relaxed">{result.definition}</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-50 flex gap-4 items-start">
                          <div className="size-10 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                            <Scaling size={20} className="text-[#10b77f]" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-[#10b77f] uppercase tracking-widest block mb-1">Analogy</span>
                            <p className="text-sm text-slate-600 leading-relaxed italic">"{result.analogy}"</p>
                          </div>
                        </div>

                        <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-50 flex gap-4 items-start">
                          <div className="size-10 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                            <CheckCircle2 size={20} className="text-blue-500" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">Example</span>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">{result.example}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
              {HARDCODED_JARGONS.map((j, i) => (
                <motion.div
                  whileHover={{ y: -5 }}
                  key={j.term}
                  onClick={() => handleSearch(j.term)}
                  className="p-6 bg-white rounded-3xl border border-emerald-50 shadow-sm cursor-pointer hover:border-[#10b77f] transition-all group"
                >
                  <div className="size-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#10b77f] group-hover:text-white transition-colors text-[#10b77f]">
                    <TrendingUp size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{j.term}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{j.definition}</p>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
