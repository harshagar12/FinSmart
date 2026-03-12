import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Clock, Gauge, BookOpen, ArrowRight, ChevronLeft, ChevronRight, Lightbulb, Wrench, Brain, MessageSquare, TrendingUp, Calculator as CalculatorIcon, LayoutDashboard } from 'lucide-react';

const MODULES = [
  {
    id: 'chat',
    step: 1,
    title: 'AI Chatbot',
    tagline: 'Your Financial Assistant',
    description:
      'Ask anything about investing, markets, or money. Get clear, human-style explanations before you place a single trade.',
  },
  {
    id: 'simulator',
    step: 2,
    title: 'Simulator',
    tagline: 'Practice Without Risk',
    description:
      'Use paper money to practice buying and selling. Build confidence with virtual trades before you go live.',
  },
  {
    id: 'calculator',
    step: 3,
    title: 'Calculator',
    tagline: 'Plan Your Wealth',
    description:
      'See how small monthly investments can grow over time. Adjust returns, duration, and amount to design your plan.',
  },
  {
    id: 'dictionary',
    step: 4,
    title: 'Dictionary',
    tagline: 'Decode Jargon',
    description:
      'Look up confusing terms like CAGR, drawdown, or ETF and get simple definitions with real-world context.',
  },
  {
    id: 'market',
    step: 5,
    title: 'Live Market',
    tagline: 'Read the Screen',
    description:
      'Explore real-time prices, trends, and watchlists. Learn how candles, volume, and volatility fit together.',
  },
];

const MODULE_META = {
  chat: { icon: MessageSquare, cta: 'Open AI Chat', helper: 'Ask, learn, and clarify concepts in real time.' },
  simulator: { icon: TrendingUp, cta: 'Open Simulator', helper: 'Practice execution with zero real capital.' },
  calculator: { icon: CalculatorIcon, cta: 'Open Calculator', helper: 'Model outcomes and plan contribution ranges.' },
  dictionary: { icon: BookOpen, cta: 'Open Dictionary', helper: 'Decode financial language in plain English.' },
  market: { icon: LayoutDashboard, cta: 'Open Live Market', helper: 'Track live moves and read market context.' },
};

const HERO_STATS = [
  {
    label: 'Modules',
    value: '5',
    detail: 'From first question to first trade',
    icon: BookOpen,
  },
  {
    label: 'Total Time',
    value: '~20 min',
    detail: 'Short, focused walkthroughs',
    icon: Clock,
  },
  {
    label: 'Level',
    value: 'Beginner',
    detail: 'No prior experience needed',
    icon: Gauge,
  },
];

export default function LearningPark({ onNavigate }) {
  const [activeModule, setActiveModule] = useState(null);
  const pageRef = useRef(null);

  const resetScrollPosition = () => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }

    const doReset = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

      const mainScrollContainer = pageRef.current?.closest('main');
      if (mainScrollContainer) {
        mainScrollContainer.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }

      let node = pageRef.current;
      while (node && node.parentElement) {
        node = node.parentElement;
        const styles = window.getComputedStyle(node);
        const canScroll = /(auto|scroll)/.test(styles.overflowY) && node.scrollHeight > node.clientHeight;
        if (canScroll) {
          node.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }
      }
    };

    doReset();
    requestAnimationFrame(() => {
      requestAnimationFrame(doReset);
    });
  };

  const goToModule = (moduleId) => {
    setActiveModule(moduleId);
    resetScrollPosition();
  };

  const handleStart = () => {
    goToModule('chat');
  };

  const handleOpenModule = (id) => {
    goToModule(id);
  };

  const handleBackToOverview = () => {
    setActiveModule(null);
    resetScrollPosition();
  };

  const handleOpenTool = (target) => {
    if (onNavigate && target) onNavigate(target);
  };

  const currentIdx = activeModule ? MODULES.findIndex((m) => m.id === activeModule) : -1;
  const activeModuleData = activeModule ? MODULES.find((m) => m.id === activeModule) : null;
  const prevModule = currentIdx > 0 ? MODULES[currentIdx - 1] : null;
  const nextModule = currentIdx >= 0 && currentIdx < MODULES.length - 1 ? MODULES[currentIdx + 1] : null;

  useEffect(() => {
    resetScrollPosition();
  }, [activeModule]);

  return (
    <div ref={pageRef} className="p-4 lg:p-8 max-w-6xl mx-auto space-y-10 lg:space-y-16">
      {!activeModule ? (
        <>
          <section className="bg-white rounded-[2.5rem] border border-emerald-50 shadow-xl shadow-emerald-900/5 overflow-hidden relative">
            <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-sky-200/25 blur-3xl pointer-events-none" />
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,0.9fr] gap-0">
              <div className="p-8 lg:p-12 space-y-8 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Sparkles size={12} />
                  Learning Park
                </div>

                <div className="space-y-4">
                  <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                    A guided path to confident investing
                  </h2>
                  <p className="text-slate-500 font-medium leading-relaxed max-w-xl">
                    Learn every FinSmart tool step-by-step. Start with the AI chatbot, practice in the simulator,
                    and finish by reading live markets like a pro.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
                  {HERO_STATS.map((stat) => (
                    <HeroStatCard
                      key={stat.label}
                      label={stat.label}
                      value={stat.value}
                      detail={stat.detail}
                      icon={stat.icon}
                    />
                  ))}
                </div>

                <button
                  onClick={handleStart}
                  className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.25em] shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:shadow-xl hover:scale-[1.01] active:scale-95 transition-all"
                >
                  Start Learning
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="bg-slate-50/70 border-t lg:border-t-0 lg:border-l border-emerald-100 p-8 lg:p-10 flex items-center relative z-10">
                <div className="w-full space-y-6">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-emerald-100 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Roadmap overview
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
                      Follow the modules in sequence, or jump to a specific tool. Each step clarifies purpose,
                      workflow, and best practices.
                    </p>
                  </div>

                  <ol className="space-y-2.5 text-sm">
                    {MODULES.map((m) => (
                      <OverviewStep key={m.id} module={m} />
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">The Learning Path</h2>
            </div>

            <div className="relative max-w-3xl mx-auto">
              <div className="space-y-6">
                {MODULES.map((m) => (
                  <RoadmapCard key={m.id} module={m} onClick={() => handleOpenModule(m.id)} />
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="space-y-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleBackToOverview}
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-500 hover:text-slate-800"
                >
                  <ChevronLeft size={14} />
                  Back to roadmap
                </button>

                {activeModuleData && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-100 bg-emerald-50 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">
                    Step {activeModuleData.step}
                    <span className="text-slate-400">{activeModuleData.title}</span>
                  </span>
                )}
              </div>

              <ModulePager
                prev={prevModule}
                next={nextModule}
                onGo={goToModule}
              />
            </div>
          </div>
          {activeModule === 'chat' && (
            <ChatbotWalkthrough
              onOpenTool={() => handleOpenTool('chat')}
            />
          )}
          {activeModule === 'simulator' && (
            <SimulatorWalkthrough
              onOpenTool={() => handleOpenTool('simulator')}
            />
          )}
          {activeModule === 'calculator' && (
            <CalculatorWalkthrough
              onOpenTool={() => handleOpenTool('calculator')}
            />
          )}
          {activeModule === 'dictionary' && (
            <DictionaryWalkthrough
              onOpenTool={() => handleOpenTool('dictionary')}
            />
          )}
          {activeModule === 'market' && (
            <LiveMarketWalkthrough
              onOpenTool={() => handleOpenTool('market')}
            />
          )}

          <BottomModuleNav
            prev={prevModule}
            next={nextModule}
            onGo={goToModule}
            onBack={handleBackToOverview}
          />
        </section>
      )}
    </div>
  );
}

function SectionContainer({ title, badge, children }) {
  return (
    <section className="bg-white rounded-4xl border border-emerald-50 shadow-sm p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-emerald-50 text-lg">
          {badge}
        </span>
        <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ChatbotWalkthrough({ onOpenTool }) {
  return (
    <div className="space-y-8">
      <WalkthroughHero
        moduleId="chat"
        title="AI Chatbot"
        description="Your personal financial assistant for investing, markets, and money decisions through natural conversation."
        onOpenTool={onOpenTool}
      />

      <SectionContainer
        title="What It Does"
        badge={<Lightbulb size={16} className="text-emerald-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <FeatureCard
            title="Conversational Learning"
            body="Ask questions in plain English and get clear, jargon-free explanations about any financial topic — from SIPs to stock markets."
          />
          <FeatureCard
            title="Instant Answers"
            body="Skip endless Googling. Get instant, focused responses about concepts, market terms, and strategies."
          />
          <FeatureCard
            title="Suggested Questions"
            body='Tap pre-built question chips like "How do I start a SIP?" to kick off your learning journey.'
          />
          <FeatureCard
            title="Chat History"
            body="Previous conversations stay in the UI so you can revisit important answers anytime."
          />
        </div>
      </SectionContainer>

      <SectionContainer
        title="How It Works"
        badge={<Wrench size={18} strokeWidth={2.3} className="text-emerald-600" />}
      >
        <StepsList
          steps={[
            {
              title: 'Open the Chatbot',
              body: 'From the main navigation, choose AI Chat. The assistant greets you and is ready to help.',
            },
            {
              title: 'Type or Tap a Question',
              body: 'Type your own question or tap one of the suggested question chips such as “What is a bear market?” or “Explain mutual funds”.',
            },
            {
              title: 'Read the AI Response',
              body: 'Watch the typing indicator, then read a detailed, easy-to-understand answer returned in a chat bubble.',
            },
            {
              title: 'Continue the Conversation',
              body: 'Ask follow-ups to go deeper. The chat maintains context so your conversation feels natural.',
            },
          ]}
        />
      </SectionContainer>

      <SectionContainer
        title="Key Concepts"
        badge={<Brain size={18} strokeWidth={2.3} className="text-emerald-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <ConceptCard
            title="Chat bubbles"
            body="Your messages appear on one side, AI responses on the other, making learning feel like a familiar messaging app."
          />
          <ConceptCard
            title="Typing indicator"
            body="A subtle indicator shows when the AI is composing a response, just like chatting with a human."
          />
          <ConceptCard
            title="Suggestion chips"
            body="Pre-written questions at the bottom help beginners who aren’t sure what to ask first."
          />
          <ConceptCard
            title="Chat sessions"
            body="Each conversation is saved with its own context so you can revisit explanations later."
          />
        </div>
        <ProTip>
          Start with the suggested questions to build foundations, then ask your own specific questions as you gain
          confidence.
        </ProTip>
      </SectionContainer>
    </div>
  );
}

function SimulatorWalkthrough({ onOpenTool }) {
  return (
    <div className="space-y-8">
      <WalkthroughHero
        moduleId="simulator"
        title="Trading Simulator"
        description="Practice buying and selling with virtual capital to build confidence, discipline, and repeatable execution habits."
        onOpenTool={onOpenTool}
      />

      <SectionContainer
        title="What It Does"
        badge={<Lightbulb size={18} strokeWidth={2.3} className="text-emerald-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <FeatureCard
            title="Virtual Balance"
            body="Start with a virtual balance (for example $10,000). Your balance updates in real time as you trade."
          />
          <FeatureCard
            title="Buy & Sell Buttons"
            body="Execute simulated trades in a single click using clear green (Buy) and red (Sell) actions."
          />
          <FeatureCard
            title="Trade History"
            body="A table logs each trade with asset, type, entry price, exit price, quantity, and profit/loss."
          />
          <FeatureCard
            title="Portfolio Chart"
            body="A donut chart breaks down your simulated portfolio by asset, including cash."
          />
        </div>
      </SectionContainer>

      <SectionContainer
        title="How It Works"
        badge={<Wrench size={18} strokeWidth={2.3} className="text-emerald-600" />}
      >
        <StepsList
          steps={[
            {
              title: 'Check Your Balance',
              body: 'Use the top summary to see your virtual balance, total P/L, number of trades, and win rate.',
            },
            {
              title: 'Select an Asset',
              body: 'Choose from available assets (e.g., BTC, ETH, NIFTY, Gold). Current price is displayed next to each asset.',
            },
            {
              title: 'Set Quantity & Execute',
              body: 'Enter how many units you want to trade. The order value updates automatically. Click Buy or Sell to place the trade.',
            },
            {
              title: 'Review Your Trades',
              body: 'Scan the history table to see how each trade performed, with profits highlighted in green and losses in red.',
            },
            {
              title: 'Monitor Your Portfolio',
              body: 'Use the portfolio chart to see your allocation and how your simulated account evolves over time.',
            },
          ]}
        />
      </SectionContainer>

      <SectionContainer
        title="Key Concepts"
        badge={<Brain size={18} strokeWidth={2.3} className="text-emerald-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <ConceptCard
            title="Paper Trading"
            body="Simulated trading that mirrors market conditions without risking real capital."
          />
          <ConceptCard
            title="Profit & Loss (P/L)"
            body="The difference between your entry and exit price multiplied by quantity — positive is profit, negative is loss."
          />
          <ConceptCard
            title="Win Rate"
            body="The percentage of trades that close profitable. A lower win rate can still be profitable if winners are much larger than losers."
          />
          <ConceptCard
            title="Position Sizing"
            body="Controlling how much of your balance you risk per trade, typically 2–5% to protect your capital."
          />
        </div>
        <ProTip>
          Treat virtual money as if it were real. The discipline you build in the simulator directly carries over to
          live markets.
        </ProTip>
      </SectionContainer>
    </div>
  );
}

function CalculatorWalkthrough({ onOpenTool }) {
  return (
    <div className="space-y-8">
      <WalkthroughHero
        moduleId="calculator"
        title="Investment Calculator"
        description="Model your growth with compounding and scenario comparisons so every contribution has a clear long-term purpose."
        onOpenTool={onOpenTool}
      />

      <SectionContainer
        title="What It Does"
        badge={<Lightbulb size={18} strokeWidth={2.3} className="text-emerald-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <FeatureCard
            title="Interactive Sliders"
            body="Control monthly investment, expected return rate, and time period and see results update instantly."
          />
          <FeatureCard
            title="Visual Pie Chart"
            body="A donut chart shows the split between total invested amount and estimated returns."
          />
          <FeatureCard
            title="Presets"
            body="Quick-select options like SIP, FD, or Lump Sum pre-fill sensible defaults so you can compare scenarios quickly."
          />
          <FeatureCard
            title="Maturity Display"
            body="A bold headline number displays your expected maturity amount for the chosen inputs."
          />
        </div>
      </SectionContainer>

      <SectionContainer
        title="How It Works"
        badge={<Wrench size={18} strokeWidth={2.3} className="text-emerald-600" />}
      >
        <StepsList
          steps={[
            {
              title: 'Choose a Preset (Optional)',
              body: 'Select SIP, FD, or Lump Sum to auto-fill typical values such as monthly amount, rate, and duration.',
            },
            {
              title: 'Adjust the Sliders',
              body: 'Fine-tune monthly amount, expected return (e.g. 1%–30%), and investment duration (e.g. 1–30 years).',
            },
            {
              title: 'Read the Results',
              body: 'The right panel updates live with maturity value and a donut chart of invested vs. returns.',
            },
            {
              title: 'Compare Scenarios',
              body: 'Switch presets or change sliders to see how higher returns or longer durations impact your final wealth.',
            },
          ]}
        />
      </SectionContainer>

      <SectionContainer
        title="Key Concepts"
        badge={<Brain size={18} strokeWidth={2.3} className="text-emerald-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <ConceptCard
            title="Compound Interest"
            body="Returns earn additional returns over time, creating a snowball effect on long time horizons."
          />
          <ConceptCard
            title="Rupee Cost Averaging"
            body="Investing a fixed monthly amount smooths out volatility by buying more units when prices are low."
          />
          <ConceptCard
            title="Time in the Market"
            body="Double the time horizon and compounding can more than double your maturity value."
          />
          <ConceptCard
            title="Invested vs. Returns"
            body="The green portion of the pie is your contributions; the blue slice is what the market earned for you."
          />
        </div>
        <ProTip>
          Try small changes to the duration slider — you&apos;ll see how powerful extra years of compounding really are.
        </ProTip>
      </SectionContainer>
    </div>
  );
}

function DictionaryWalkthrough({ onOpenTool }) {
  return (
    <div className="space-y-8">
      <WalkthroughHero
        moduleId="dictionary"
        title="Financial Dictionary"
        description="A practical glossary that helps you search, browse, and internalize financial terms with real-world relevance."
        onOpenTool={onOpenTool}
      />

      <SectionContainer
        title="What It Does"
        badge={<Lightbulb size={18} strokeWidth={2.3} className="text-emerald-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <FeatureCard
            title="Smart Search"
            body="Type any keyword in the search bar and instantly filter matching terms and descriptions."
          />
          <FeatureCard
            title="A–Z Browsing"
            body="Browse by letter to quickly jump to all terms starting with a specific character."
          />
          <FeatureCard
            title="Expandable Cards"
            body="Tap a term card to expand from a short summary into a full explanation with context."
          />
          <FeatureCard
            title="Category Tags"
            body="Each term can be associated with ideas like Market, Risk, Returns, Funds, or Strategy."
          />
        </div>
      </SectionContainer>

      <SectionContainer
        title="How It Works"
        badge={<Wrench size={18} strokeWidth={2.3} className="text-emerald-600" />}
      >
        <StepsList
          steps={[
            {
              title: 'Search or Browse',
              body: 'Use the search bar to find a specific concept (e.g., CAGR) or scroll/browse alphabetically.',
            },
            {
              title: 'Scan Term Cards',
              body: 'Cards show the term name, category, and a one-line summary to help you skim quickly.',
            },
            {
              title: 'Expand a Card',
              body: 'Click to view the full definition and a more detailed explanation of how the concept works.',
            },
            {
              title: 'Connect Ideas',
              body: 'Move between related terms (like Volatility, Risk, and Drawdown) to strengthen your mental model.',
            },
          ]}
        />
      </SectionContainer>

      <SectionContainer
        title="Featured Concepts"
        badge={<Brain size={18} strokeWidth={2.3} className="text-emerald-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <ConceptCard
            title="Volatility"
            body="How much a price moves up and down. Higher volatility means bigger swings in value."
          />
          <ConceptCard
            title="CAGR"
            body="Compound Annual Growth Rate — a single annualized rate that summarizes growth over multiple years."
          />
          <ConceptCard
            title="Expense Ratio"
            body="The annual fee charged by many funds. Even small differences add up significantly over decades."
          />
          <ConceptCard
            title="Liquidity"
            body="How quickly you can convert an investment into cash without major price impact."
          />
        </div>
        <ProTip>
          When you see a new term in the app, look it up immediately. Understanding the language removes fear from the
          investing process.
        </ProTip>
      </SectionContainer>
    </div>
  );
}

function LiveMarketWalkthrough({ onOpenTool }) {
  return (
    <div className="space-y-8">
      <WalkthroughHero
        moduleId="market"
        title="Live Market"
        description="Track real-time market data, read candlestick behavior, and monitor your favorite assets from one dashboard."
        onOpenTool={onOpenTool}
      />

      <SectionContainer
        title="What It Does"
        badge={<Lightbulb size={18} strokeWidth={2.3} className="text-emerald-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <FeatureCard
            title="Candlestick Chart"
            body="The main chart shows price movements using candlesticks — the standard view for active traders."
          />
          <FeatureCard
            title="Watchlist"
            body="A list of key assets (indices, crypto, stocks, commodities) with live price and percentage change."
          />
          <FeatureCard
            title="Time-Range Tabs"
            body="Switch between short-term and long-term views (e.g. 1H, 1D, 1W, 1M) to understand both noise and trend."
          />
          <FeatureCard
            title="Market Stats"
            body="Supporting cards show Open, High, Low, and Volume so you have full context for the current session."
          />
        </div>
      </SectionContainer>

      <SectionContainer
        title="How It Works"
        badge={<Wrench size={18} strokeWidth={2.3} className="text-emerald-600" />}
      >
        <StepsList
          steps={[
            {
              title: 'Select an Asset',
              body: 'Choose an item from the watchlist (such as an index, stock, or crypto pair). The chart and stats update instantly.',
            },
            {
              title: 'Read the Candlestick Chart',
              body: 'Each candle shows open, high, low, and close. Green candles mean price rose; red candles mean price fell.',
            },
            {
              title: 'Switch Time Ranges',
              body: 'Use the time filters to zoom in to intraday moves or out to multi-week trends.',
            },
            {
              title: 'Monitor the Watchlist',
              body: 'Green percentage changes signal gainers; red signal losers. Quickly scan for which assets are moving.',
            },
            {
              title: 'Check Volume',
              body: 'Volume bars help confirm whether a move is strong (high volume) or weak (low volume).',
            },
          ]}
        />
      </SectionContainer>

      <SectionContainer
        title="Key Concepts"
        badge={<Brain size={18} strokeWidth={2.3} className="text-emerald-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <ConceptCard
            title="Candlestick Anatomy"
            body="Bodies show the open-to-close range; wicks show extremes. Colour tells you if the session ended up or down."
          />
          <ConceptCard
            title="Moving Average"
            body="A smoothed line of recent prices. Being above or below this line is one way to judge trend direction."
          />
          <ConceptCard
            title="Volume"
            body="The number of units traded. High volume with a strong price move suggests conviction from market participants."
          />
          <ConceptCard
            title="Price Change %"
            body="Shows how much an asset has moved over the selected period, useful for spotting outliers and leaders."
          />
        </div>
        <ProTip>
          Always zoom out to a higher time frame before acting on a short‑term move; the bigger trend matters more than
          any single candle.
        </ProTip>
      </SectionContainer>
    </div>
  );
}

function FeatureCard({ title, body }) {
  return (
    <div className="h-full rounded-2xl border border-emerald-50 bg-emerald-50/35 px-4 py-4 lg:px-5 lg:py-5 flex flex-col gap-2 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <p className="text-xs lg:text-sm text-slate-500 font-medium leading-relaxed">{body}</p>
    </div>
  );
}

function StepsList({ steps }) {
  return (
    <div className="space-y-4">
      {steps.map((step, idx) => (
        <div
          key={step.title}
          className="flex gap-4 rounded-2xl border border-emerald-50 bg-slate-50/70 px-4 py-4 lg:px-5 lg:py-5"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-2xl bg-white shadow-sm text-xs font-black text-primary">
            {idx + 1}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">{step.title}</h3>
            <p className="text-xs lg:text-sm text-slate-500 font-medium leading-relaxed">{step.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConceptCard({ title, body }) {
  return (
    <div className="h-full rounded-2xl border border-emerald-50 bg-slate-50/80 px-4 py-4 lg:px-5 lg:py-5 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs lg:text-sm text-slate-500 font-medium leading-relaxed">{body}</p>
    </div>
  );
}

function ProTip({ children }) {
  return (
    <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-4 lg:px-5 lg:py-5 text-xs lg:text-sm text-slate-700 font-medium leading-relaxed shadow-sm">
      <span className="font-black text-amber-700 mr-1 uppercase tracking-wide">Guidance:</span>
      {children}
    </div>
  );
}

function ModulePager({ prev, next, onGo }) {
  if (!prev && !next) return null;

  return (
    <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
      {prev && (
        <button
          onClick={() => onGo(prev.id)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
        >
          <ChevronLeft size={14} />
          <span className="font-semibold">{prev.title}</span>
        </button>
      )}
      {next && (
        <button
          onClick={() => onGo(next.id)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
        >
          <span className="font-semibold">{next.title}</span>
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function BottomModuleNav({ prev, next, onGo, onBack }) {
  if (!prev && !next) return null;

  return (
    <div className="pt-1 flex items-center justify-between gap-3">
      {prev ? (
        <button
          onClick={() => onGo(prev.id)}
          className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-500 text-xs font-black uppercase tracking-[0.18em] hover:text-slate-800 transition-colors"
        >
          <ChevronLeft size={14} />
          Previous
        </button>
      ) : (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-500 text-xs font-black uppercase tracking-[0.18em] hover:text-slate-800 transition-colors"
        >
          <ChevronLeft size={14} />
          Back to roadmap
        </button>
      )}

      {next ? (
        <button
          onClick={() => onGo(next.id)}
          className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-primary text-xs font-black uppercase tracking-[0.18em] hover:text-emerald-700 transition-colors"
        >
          Next
          <ChevronRight size={14} />
        </button>
      ) : (
        <span className="w-24" />
      )}
    </div>
  );
}

function RoadmapCard({ module, onClick }) {
  const Icon = MODULE_META[module.id]?.icon || BookOpen;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-emerald-50 rounded-3xl px-6 py-5 shadow-sm hover:shadow-xl hover:border-emerald-200 hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex items-center justify-between gap-4 mb-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
          <span className="inline-flex items-center justify-center size-7 rounded-xl bg-emerald-50 text-emerald-700">
            <Icon size={14} />
          </span>
          Step {module.step}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Open guide
        </span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{module.title}</h3>
      <p className="text-xs font-semibold text-emerald-700 mb-2">{module.tagline}</p>
      <p className="text-sm text-slate-500 font-medium leading-relaxed">{module.description}</p>
    </button>
  );
}

function WalkthroughHero({ moduleId, title, description, onOpenTool }) {
  const meta = MODULE_META[moduleId] || {};
  const Icon = meta.icon || BookOpen;

  return (
    <div className="bg-white rounded-4xl border border-emerald-50 shadow-sm p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[1.3fr,0.9fr] gap-6 lg:gap-8 items-start">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-3 mb-1">
          <span className="inline-flex items-center justify-center size-10 rounded-2xl bg-emerald-50 text-primary">
            <Icon size={20} strokeWidth={2.2} />
          </span>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
        </div>
        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">{description}</p>
        <button
          onClick={onOpenTool}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-primary hover:text-emerald-700"
        >
          {meta.cta || 'Open Module'}
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 px-5 py-5 space-y-3">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">Module focus</p>
        <p className="text-sm text-slate-700 font-semibold leading-relaxed">{meta.helper}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="px-2.5 py-1 rounded-full bg-white border border-emerald-100 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Structured walkthrough
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white border border-emerald-100 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Beginner friendly
          </span>
        </div>
      </div>
    </div>
  );
}

function HeroStatCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3.5 shadow-sm">
      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em]">
        <span className="inline-flex items-center justify-center size-6 rounded-lg bg-emerald-50 text-primary">
          <Icon size={13} strokeWidth={2.2} />
        </span>
        {label}
      </div>
      <p className="text-xl font-black text-slate-900 mt-2">{value}</p>
      <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">{detail}</p>
    </div>
  );
}

function OverviewStep({ module }) {
  return (
    <li className="group grid grid-cols-[auto,1fr] items-start gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm hover:border-emerald-200 transition-all">
      <span className="mt-0.5 inline-flex items-center justify-center size-7 rounded-lg border border-emerald-200 bg-emerald-50 text-[11px] font-black text-emerald-700">
        {module.step}
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.18em]">{module.tagline}</p>
        <p className="text-[15px] font-bold text-slate-800 leading-tight mt-0.5">{module.title}</p>
      </div>
    </li>
  );
}



