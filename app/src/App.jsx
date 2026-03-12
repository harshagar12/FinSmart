import React, { useState } from 'react';
import { Home, LayoutDashboard, Calculator, MessageSquare, BookOpen, TrendingUp, Zap, GraduationCap, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { AuthProvider } from './context/AuthContext';

// Pages
import HomeView from './pages/Home';
import LiveMarket from './pages/LiveMarket/LiveMarket';
import CalculatorView from './pages/Calculator/Calculator';
import Chatbot from './pages/Chatbot/Chatbot';
import Simulator from './pages/Simulator';
import Dictionary from './pages/Dictionary/Dictionary';
import LearningPark from './pages/LearningPark';

export default function App() {
  const [currentView, setCurrentView] = useState('home');

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'learning', label: 'Learning Park', icon: GraduationCap },
    { id: 'market', label: 'Live Market', icon: LayoutDashboard },
    { id: 'simulator', label: 'Simulator', icon: TrendingUp },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'dictionary', label: 'Dictionary', icon: BookOpen },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'home': return <HomeView onNavigate={setCurrentView} />;
      case 'learning': return <LearningPark onNavigate={setCurrentView} />;
      case 'market': return <LiveMarket />;
      case 'calculator': return <CalculatorView />;
      case 'chat': return <Chatbot />;
      case 'simulator': return <Simulator onNavigate={setCurrentView} />;
      case 'dictionary': return <Dictionary />;
      default: return <HomeView onNavigate={setCurrentView} />;
    }
  };

  return (
    <AuthProvider>
      <div className="flex flex-col h-screen bg-[#f6f8f7] text-slate-900 font-sans overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-emerald-50 px-4 lg:px-12 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('home')}>
            <div className="w-11 h-11 bg-gradient-to-br from-[#10b77f] to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform duration-200">
              <Zap size={26} fill="currentColor" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-slate-900 font-black text-xl tracking-tight leading-none">Fin<span className="text-[#10b77f]">Smart</span></h1>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] mt-1">Smart Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all duration-200 group relative",
                    currentView === item.id 
                      ? "text-[#10b77f] font-bold" 
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  <item.icon size={18} className={cn(
                    "transition-colors",
                    currentView === item.id ? "text-[#10b77f]" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  <span className="text-sm">{item.label}</span>
                  {currentView === item.id && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute inset-0 bg-emerald-50 rounded-2xl -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </nav>

            {/* Mobile Nav */}
            <div className="md:hidden flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={cn(
                    "p-2.5 rounded-xl transition-all",
                    currentView === item.id ? "bg-emerald-50 text-[#10b77f]" : "text-slate-400"
                  )}
                >
                  <item.icon size={20} />
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </AuthProvider>
  );
}
