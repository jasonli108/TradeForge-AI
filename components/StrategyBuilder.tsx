import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { BacktestResult, CandleData, BacktestSettings } from '../types';
import { generateStrategyAndBacktest, generateBatchStrategies } from '../services/geminiService';
import { Loader2, Play, Code, TrendingUp, AlertTriangle, Rocket, Settings2, Sparkles, Trophy, Target, ArrowRight, Shield, Zap } from 'lucide-react';

interface StrategyBuilderProps {
  marketData: CandleData[];
  onDeploy: (strategyName: string, description: string, code: string) => void;
}

const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ marketData, onDeploy }) => {
  const [mode, setMode] = useState<'SINGLE' | 'BATCH'>('SINGLE');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Single Result State
  const [result, setResult] = useState<BacktestResult | null>(null);
  
  // Batch Results State
  const [batchResults, setBatchResults] = useState<BacktestResult[]>([]);
  const [batchCount, setBatchCount] = useState(3);
  const [riskProfile, setRiskProfile] = useState<'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE'>('MODERATE');

  const [showSettings, setShowSettings] = useState(true);
  const [settings, setSettings] = useState<BacktestSettings>({
    initialCapital: 10000,
    riskPerTrade: 1,
    slippage: 0.1
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (mode === 'SINGLE') {
        if (!prompt.trim()) return;
        const data = await generateStrategyAndBacktest(prompt, marketData, settings);
        setResult(data);
      } else {
        const data = await generateBatchStrategies(batchCount, prompt, marketData, settings, riskProfile);
        // Sort by Total Return (descending)
        const sortedData = data.sort((a, b) => {
            const valA = parseFloat(a.totalReturn.replace('%', '').replace('+', ''));
            const valB = parseFloat(b.totalReturn.replace('%', '').replace('+', ''));
            return valB - valA;
        });
        setBatchResults(sortedData);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate strategy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'text-yellow-400';
    if (index === 1) return 'text-gray-300';
    if (index === 2) return 'text-orange-400';
    return 'text-gray-500';
  };

  const renderSingleResult = (res: BacktestResult, isCompact = false) => (
    <div className={`flex-1 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg overflow-hidden flex flex-col min-h-0 animate-in fade-in duration-500 ${isCompact ? 'border-l-4 border-l-blue-500' : ''}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white">{res.strategyName}</h3>
          <p className="text-gray-400 mt-1 max-w-2xl text-sm">{res.description}</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-center p-3 bg-gray-900 rounded-lg min-w-[100px] border border-gray-700">
              <div className="text-xs text-gray-500 uppercase">Total Return</div>
              <div className={`text-xl font-bold ${res.totalReturn.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                {res.totalReturn}
              </div>
            </div>
            
            <button 
            onClick={() => onDeploy(res.strategyName, res.description, res.pseudoCode)}
            className="ml-2 h-full px-5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold flex flex-col items-center justify-center gap-1 shadow-lg shadow-purple-900/30 transition-all border border-purple-500 group"
            >
              <Rocket size={20} className="group-hover:-translate-y-0.5 transition-transform" />
              <span className="text-xs uppercase">Deploy</span>
            </button>
        </div>
      </div>

      <div className="flex justify-between gap-4 mb-6">
            <div className="flex gap-4">
              <div className="text-center p-2 bg-gray-900 rounded-lg min-w-[100px] border border-gray-700">
                  <div className="text-xs text-gray-500 uppercase">Win Rate</div>
                  <div className="text-lg font-bold text-blue-400">{res.winRate}</div>
              </div>
              <div className="text-center p-2 bg-gray-900 rounded-lg min-w-[100px] border border-gray-700">
                  <div className="text-xs text-gray-500 uppercase">Drawdown</div>
                  <div className="text-lg font-bold text-orange-400">{res.maxDrawdown}</div>
              </div>
              <div className="text-center p-2 bg-gray-900 rounded-lg min-w-[100px] border border-gray-700">
                  <div className="text-xs text-gray-500 uppercase">Sharpe</div>
                  <div className="text-lg font-bold text-gray-300">{res.sharpeRatio}</div>
              </div>
            </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Equity Curve */}
        <div className="flex-[2] bg-gray-900 rounded-lg p-4 border border-gray-700 flex flex-col">
          <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
            <TrendingUp size={16} /> Performance Curve
          </h4>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={res.equityCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} width={60} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Code Snippet */}
        <div className="flex-1 bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-hidden flex flex-col">
            <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
            <Code size={16} /> Generated Logic
          </h4>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <pre className="text-xs font-mono text-green-300 leading-relaxed whitespace-pre-wrap">
              {res.pseudoCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* Input Section */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <Sparkles className="text-purple-400" size={24} />
               Strategy Lab
             </h2>
             
             {/* Mode Toggle */}
             <div className="bg-gray-900 p-1 rounded-lg border border-gray-700 flex items-center">
                <button 
                  onClick={() => setMode('SINGLE')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mode === 'SINGLE' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  Composer
                </button>
                <button 
                  onClick={() => setMode('BATCH')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${mode === 'BATCH' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  Auto-Optimizer <span className="bg-purple-400/20 px-1 rounded text-[9px] uppercase">New</span>
                </button>
             </div>
          </div>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ${showSettings ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
          >
            <Settings2 size={14} />
            Backtest Config
          </button>
        </div>

        {/* Configuration Panel */}
        {showSettings && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 animate-in slide-in-from-top-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Initial Capital ($)</label>
              <input 
                type="number" 
                value={settings.initialCapital}
                onChange={(e) => setSettings({...settings, initialCapital: parseFloat(e.target.value) || 0})}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                placeholder="10000"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Risk per Trade (%)</label>
              <input 
                type="number" 
                value={settings.riskPerTrade}
                onChange={(e) => setSettings({...settings, riskPerTrade: parseFloat(e.target.value) || 0})}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                placeholder="1"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Slippage (%)</label>
              <input 
                type="number" 
                value={settings.slippage}
                onChange={(e) => setSettings({...settings, slippage: parseFloat(e.target.value) || 0})}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                placeholder="0.1"
                step="0.01"
              />
            </div>
          </div>
        )}

        <div className="relative">
          {mode === 'BATCH' && (
             <div className="absolute top-4 right-4 z-10 flex flex-col md:flex-row items-end md:items-center gap-3">
               
               {/* Risk Profile Selector */}
               <div className="flex items-center gap-2 bg-gray-800 p-1.5 rounded-lg border border-gray-700">
                  <span className="text-xs text-gray-400 font-medium pl-1 flex items-center gap-1">
                    {riskProfile === 'CONSERVATIVE' && <Shield size={10} className="text-green-400" />}
                    {riskProfile === 'MODERATE' && <Target size={10} className="text-blue-400" />}
                    {riskProfile === 'AGGRESSIVE' && <Zap size={10} className="text-orange-400" />}
                    Profile:
                  </span>
                  <select 
                    value={riskProfile}
                    onChange={(e) => setRiskProfile(e.target.value as any)}
                    className="bg-gray-700 text-white text-xs font-bold py-0.5 px-2 rounded border-none focus:ring-0 cursor-pointer outline-none hover:bg-gray-600 transition-colors"
                  >
                    <option value="CONSERVATIVE">Conservative</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="AGGRESSIVE">Aggressive</option>
                  </select>
               </div>

               <div className="flex items-center gap-2 bg-gray-800 p-1.5 rounded-lg border border-gray-700">
                 <span className="text-xs text-gray-400 font-medium pl-1">Count:</span>
                 {[3, 5].map(num => (
                    <button 
                      key={num} 
                      onClick={() => setBatchCount(num)}
                      className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${batchCount === num ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                    >
                      {num}
                    </button>
                  ))}
               </div>
             </div>
          )}
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={mode === 'SINGLE' 
              ? "Describe your strategy in plain English (e.g., 'Buy when price crosses above 200 SMA and RSI is below 30...')"
              : "Describe the theme for these strategies (e.g., 'Low risk mean reversion', 'Aggressive breakout'). Leave empty for diverse random strategies."
            }
            className={`w-full h-32 bg-gray-900 text-gray-100 p-4 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none font-mono text-sm ${mode === 'BATCH' ? 'border-purple-500/50 focus:border-purple-500 focus:ring-purple-500' : ''}`}
          />

          <button
            onClick={handleGenerate}
            disabled={loading || (mode === 'SINGLE' && !prompt.trim())}
            className={`absolute bottom-4 right-4 px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
              loading 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : mode === 'SINGLE'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : mode === 'SINGLE' ? <Play size={18} fill="currentColor" /> : <Sparkles size={18} />}
            {loading ? 'Simulating...' : mode === 'SINGLE' ? 'Run Backtest' : 'Optimize & Compare'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {mode === 'SINGLE' && result && renderSingleResult(result)}
      
      {mode === 'BATCH' && batchResults.length > 0 && (
         <div className="flex-1 overflow-hidden flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Leaderboard */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-5">
               <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                 <Trophy className="text-yellow-400" size={20} /> Optimization Leaderboard
               </h3>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="text-xs text-gray-500 uppercase border-b border-gray-700">
                       <th className="py-3 px-4 font-semibold">Rank</th>
                       <th className="py-3 px-4 font-semibold">Strategy Name</th>
                       <th className="py-3 px-4 font-semibold text-right">Total Return</th>
                       <th className="py-3 px-4 font-semibold text-right">Win Rate</th>
                       <th className="py-3 px-4 font-semibold text-right">Sharpe</th>
                       <th className="py-3 px-4 font-semibold text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody>
                     {batchResults.map((res, idx) => (
                       <tr key={idx} className={`group hover:bg-gray-750 transition-colors border-b border-gray-700/50 last:border-0 ${idx === 0 ? 'bg-yellow-500/5' : ''}`}>
                         <td className="py-3 px-4">
                           <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>
                             {idx + 1}
                           </div>
                         </td>
                         <td className="py-3 px-4">
                           <div className="font-bold text-white">{res.strategyName}</div>
                           <div className="text-xs text-gray-500 truncate max-w-[200px]">{res.description}</div>
                         </td>
                         <td className={`py-3 px-4 text-right font-mono font-bold ${res.totalReturn.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                           {res.totalReturn}
                         </td>
                         <td className="py-3 px-4 text-right font-mono text-blue-400">{res.winRate}</td>
                         <td className="py-3 px-4 text-right font-mono text-gray-300">{res.sharpeRatio}</td>
                         <td className="py-3 px-4 text-right">
                            <button 
                              onClick={() => onDeploy(res.strategyName, res.description, res.pseudoCode)}
                              className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded text-xs font-bold transition-all border border-blue-600/20 hover:border-blue-600"
                            >
                              Deploy
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>

            {/* Detailed Top Performer View */}
            <div className="flex items-center gap-2 text-gray-400 text-sm mt-2 mb-1">
               <ArrowRight size={16} /> Detail View: Top Performer
            </div>
            {renderSingleResult(batchResults[0], true)}
         </div>
      )}

      {!result && batchResults.length === 0 && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-800 rounded-xl">
           <AlertTriangle size={48} className="mb-4 opacity-50" />
           <p>Enter a strategy or run the optimizer to see results.</p>
        </div>
      )}
    </div>
  );
};

export default StrategyBuilder;