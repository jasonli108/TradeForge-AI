import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChartComponent from './components/ChartComponent';
import StrategyBuilder from './components/StrategyBuilder';
import BotDashboard from './components/BotDashboard';
import DataExplorer from './components/DataExplorer';
import { TabView, AnalysisResponse, TradingBot } from './types';
import { MOCK_MARKET_DATA, TIME_RANGES, INDICATORS, MOCK_BOTS } from './constants';
import { analyzeMarketData } from './services/geminiService';
import { Bell, Search, RefreshCw, Activity, ArrowUpRight, ArrowDownRight, TrendingUp, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.DASHBOARD);
  const [timeRange, setTimeRange] = useState('1H');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bots, setBots] = useState<TradingBot[]>(MOCK_BOTS);

  // Simulate Initial Load of Analysis
  useEffect(() => {
    refreshAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulate Real-time Bot Activity
  useEffect(() => {
    const interval = setInterval(() => {
      setBots(currentBots => 
        currentBots.map(bot => {
          if (bot.status === 'RUNNING') {
            // Simulate random market move (Volatility)
            const volatility = Math.random() * 8; 
            const direction = Math.random() > 0.45 ? 1 : -1; // Slight positive bias
            const change = volatility * direction;
            
            const newPnl = bot.pnl + change;
            // Calculate percent based on implied capital (e.g. $10,000 start)
            const newPercent = (newPnl / 10000) * 100;
            
            // Random trade execution (5% chance per tick)
            const hasNewTrade = Math.random() > 0.95;

            // Update last trade text logic
            let lastTradeTime = bot.lastTrade;
            if (hasNewTrade) {
              lastTradeTime = 'Just now';
            } else if (Math.random() > 0.9) {
               // Occasionally age the timestamp
               if (lastTradeTime === 'Just now') lastTradeTime = '1m ago';
               else if (lastTradeTime === '1m ago') lastTradeTime = '2m ago';
            }

            return {
              ...bot,
              pnl: Number(newPnl.toFixed(2)),
              pnlPercent: Number(newPercent.toFixed(2)),
              trades: hasNewTrade ? bot.trades + 1 : bot.trades,
              lastTrade: lastTradeTime
            };
          }
          return bot;
        })
      );
    }, 1500); // Update every 1.5 seconds

    return () => clearInterval(interval);
  }, []);

  const refreshAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeMarketData(MOCK_MARKET_DATA);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeployBot = (strategyName: string, description: string, code: string) => {
    const newBot: TradingBot = {
      id: Date.now().toString(),
      name: strategyName,
      status: 'RUNNING',
      pnl: 0,
      pnlPercent: 0,
      uptime: '0m',
      trades: 0,
      lastTrade: 'Waiting for signal...',
      alertSettings: {
        pnlDropThreshold: 5,
        maxDowntimeMinutes: 60,
        notifyOnTradeFailure: true
      },
      activeAlerts: [],
      targetPnl: 5000, // Default target PnL
      strategyCode: code,
      history: []
    };
    setBots([newBot, ...bots]);
    setActiveTab(TabView.BOTS);
  };

  const handleToggleBot = (id: string) => {
    setBots(bots.map(bot => {
      if (bot.id === id) {
        return { ...bot, status: bot.status === 'RUNNING' ? 'PAUSED' : 'RUNNING' };
      }
      return bot;
    }));
  };

  const handleDeleteBot = (id: string) => {
    setBots(bots.filter(b => b.id !== id));
  };

  const handleUpdateBot = (id: string, updates: Partial<TradingBot>) => {
    setBots(bots.map(bot => bot.id === id ? { ...bot, ...updates } : bot));
  };

  const getLastPrice = () => MOCK_MARKET_DATA[MOCK_MARKET_DATA.length - 1].close;
  const getChange = () => {
    const last = MOCK_MARKET_DATA[MOCK_MARKET_DATA.length - 1];
    const prev = MOCK_MARKET_DATA[MOCK_MARKET_DATA.length - 2];
    const change = last.close - prev.close;
    const percent = (change / prev.close) * 100;
    return { value: change, percent: percent };
  };
  
  const changeData = getChange();

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-gray-800 bg-gray-950/50 backdrop-blur flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4 w-1/3">
             <div className="relative w-full max-w-md hidden md:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
               <input 
                type="text" 
                placeholder="Search symbol, strategy, or indicator..."
                className="w-full bg-gray-900 border border-gray-800 rounded-full py-1.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none transition-colors"
               />
             </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
               <div className="text-right hidden sm:block">
                 <div className="text-xs text-gray-400">Bitcoin</div>
                 <div className="text-sm font-bold font-mono text-white">$46,230.50</div>
               </div>
               <div className={`flex items-center gap-1 text-sm font-medium ${changeData.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {changeData.value >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {Math.abs(changeData.percent).toFixed(2)}%
               </div>
            </div>
            
            <div className="h-6 w-px bg-gray-800 mx-2" />
            
            <button className="relative p-2 text-gray-400 hover:text-white transition">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-gray-950"></span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 scroll-smooth">
          
          {activeTab === TabView.DASHBOARD && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
              
              {/* Left Column: Chart & Controls */}
              <div className="lg:col-span-8 flex flex-col gap-4 min-h-[500px]">
                {/* Chart Toolbar */}
                <div className="flex flex-wrap items-center justify-between bg-gray-900 p-2 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-1">
                    {TIME_RANGES.map(range => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          timeRange === range 
                            ? 'bg-blue-600 text-white shadow' 
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 border-l border-gray-800 pl-4 ml-2">
                     <span className="text-xs text-gray-500 uppercase font-semibold">Indicators:</span>
                     {INDICATORS.map(ind => (
                       <button key={ind} className="px-2 py-1 text-xs text-gray-400 hover:text-blue-400 transition">
                         {ind}
                       </button>
                     ))}
                  </div>
                </div>

                {/* Chart Area */}
                <div className="flex-1 min-h-0 bg-gray-900 rounded-xl border border-gray-800 p-1 shadow-2xl relative">
                  <ChartComponent 
                    data={MOCK_MARKET_DATA} 
                    keyLevels={analysis?.keyLevels} 
                  />
                  {isAnalyzing && (
                    <div className="absolute top-2 right-2">
                       <RefreshCw className="animate-spin text-blue-500" size={16} />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: AI Analysis & Stats */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* AI Insight Card */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 shadow-lg relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                     <Activity size={100} />
                   </div>
                   <div className="flex items-center justify-between mb-4 relative z-10">
                     <h3 className="font-bold text-lg flex items-center gap-2">
                       <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">Gemini Insight</span>
                     </h3>
                     <button onClick={refreshAnalysis} className="p-1 hover:bg-gray-800 rounded text-gray-400">
                       <RefreshCw size={14} className={isAnalyzing ? 'animate-spin' : ''} />
                     </button>
                   </div>
                   
                   <div className="relative z-10">
                     <div className="flex items-center justify-between mb-4">
                       <span className="text-gray-400 text-sm">Sentiment</span>
                       <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                         analysis?.sentiment === 'BULLISH' ? 'bg-green-500/20 text-green-400' :
                         analysis?.sentiment === 'BEARISH' ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-300'
                       }`}>
                         {analysis?.sentiment || 'ANALYZING...'}
                       </span>
                     </div>
                     
                     <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Bearish</span>
                          <span>Bullish</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-500 via-gray-500 to-green-500 transition-all duration-1000"
                            style={{ width: '100%', transform: `scaleX(${analysis ? analysis.score / 100 : 0.5})`, transformOrigin: 'left' }} // Simplified gauge
                          />
                          {/* Better gauge visual */}
                          <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white]" style={{ left: `${analysis ? analysis.score : 50}%`, transition: 'left 1s ease-out' }} />
                        </div>
                     </div>

                     <p className="text-sm text-gray-300 leading-relaxed border-t border-gray-800 pt-3 mt-2">
                       {analysis?.summary || "Initializing market scan..."}
                     </p>
                   </div>
                </div>

                {/* Key Levels List */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 shadow-lg flex-1">
                  <h3 className="font-bold text-gray-200 mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-500"/> Key Levels
                  </h3>
                  <div className="space-y-3">
                     <div>
                       <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Resistance</div>
                       <div className="flex flex-wrap gap-2">
                         {analysis?.keyLevels.resistance.map((l, i) => (
                           <span key={i} className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-sm font-mono">
                             {l}
                           </span>
                         )) || <span className="text-gray-600 text-xs italic">Scanning...</span>}
                       </div>
                     </div>
                     <div className="border-t border-gray-800 my-2"></div>
                     <div>
                       <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Support</div>
                       <div className="flex flex-wrap gap-2">
                         {analysis?.keyLevels.support.map((l, i) => (
                           <span key={i} className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md text-sm font-mono">
                             {l}
                           </span>
                         )) || <span className="text-gray-600 text-xs italic">Scanning...</span>}
                       </div>
                     </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === TabView.STRATEGY && (
             <div className="h-full">
               <StrategyBuilder 
                 marketData={MOCK_MARKET_DATA} 
                 onDeploy={handleDeployBot}
               />
             </div>
          )}
          
          {activeTab === TabView.BOTS && (
             <div className="h-full">
               <BotDashboard 
                 bots={bots} 
                 onToggleStatus={handleToggleBot}
                 onDelete={handleDeleteBot}
                 onUpdateBot={handleUpdateBot}
               />
             </div>
          )}

          {activeTab === TabView.DATA && (
             <div className="h-full">
               <DataExplorer data={MOCK_MARKET_DATA} />
             </div>
          )}

          {/* Placeholder for other tabs */}
          {activeTab === TabView.SETTINGS && (
            <div className="flex items-center justify-center h-full text-gray-500 flex-col gap-4">
               <Settings size={48} className="opacity-20" />
               <p>Module under development.</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default App;