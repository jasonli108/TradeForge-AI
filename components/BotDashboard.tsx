import React, { useState, useMemo } from 'react';
import { TradingBot, BotAlertSettings } from '../types';
import { Play, Pause, Trash2, TrendingUp, Activity, Clock, Bot, Filter, ArrowUpDown, Bell, AlertTriangle, X, Check, AlertOctagon, Pencil, Square, Target, Settings, Search, FileCode, History } from 'lucide-react';

interface BotDashboardProps {
  bots: TradingBot[];
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateBot: (id: string, updates: Partial<TradingBot>) => void;
}

const BotDashboard: React.FC<BotDashboardProps> = ({ bots, onToggleStatus, onDelete, onUpdateBot }) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RUNNING' | 'PAUSED' | 'STOPPED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'NAME' | 'PNL' | 'UPTIME'>('PNL');
  
  // Local state for editing alerts (using strings for number inputs to allow '-' and empty states)
  const [alertForm, setAlertForm] = useState<{
    id: string;
    pnlDropThreshold: string;
    maxDowntimeMinutes: string;
    notifyOnTradeFailure: boolean;
    targetPnl: string;
  } | null>(null);

  // Local state for viewing history
  const [historyBotId, setHistoryBotId] = useState<string | null>(null);

  // Local state for renaming
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  // Calculate aggregate stats
  const totalPnL = bots.reduce((acc, bot) => acc + bot.pnl, 0);
  const activeCount = bots.filter(b => b.status === 'RUNNING').length;
  
  const allActiveAlerts = useMemo(() => {
    return bots.flatMap(b => b.activeAlerts.map(a => ({...a, botName: b.name})));
  }, [bots]);

  // Derive the currently selected bot for history view
  const historyBot = useMemo(() => {
    return bots.find(b => b.id === historyBotId) || null;
  }, [bots, historyBotId]);

  const handleEditAlerts = (bot: TradingBot) => {
    setAlertForm({
      id: bot.id,
      pnlDropThreshold: bot.alertSettings.pnlDropThreshold.toString(),
      maxDowntimeMinutes: bot.alertSettings.maxDowntimeMinutes.toString(),
      notifyOnTradeFailure: bot.alertSettings.notifyOnTradeFailure,
      targetPnl: bot.targetPnl ? bot.targetPnl.toString() : '5000'
    });
  };

  const handleSaveAlerts = () => {
    if (alertForm) {
      const settings: BotAlertSettings = {
        pnlDropThreshold: parseFloat(alertForm.pnlDropThreshold) || 0,
        maxDowntimeMinutes: parseFloat(alertForm.maxDowntimeMinutes) || 0,
        notifyOnTradeFailure: alertForm.notifyOnTradeFailure
      };
      
      onUpdateBot(alertForm.id, { 
        alertSettings: settings,
        targetPnl: parseFloat(alertForm.targetPnl) || 0
      });
      setAlertForm(null);
    }
  };

  const handleStartRename = (bot: TradingBot) => {
    setEditingNameId(bot.id);
    setTempName(bot.name);
  };

  const handleSaveName = () => {
    if (editingNameId && tempName.trim()) {
      onUpdateBot(editingNameId, { name: tempName.trim() });
      setEditingNameId(null);
    }
  };

  const handleCancelRename = () => {
    setEditingNameId(null);
    setTempName('');
  };

  const handleExportCode = (bot: TradingBot) => {
    if (!bot.strategyCode) {
        return;
    }
    // Use text/x-python for better system recognition
    const blob = new Blob([bot.strategyCode], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Sanitize filename: replace non-alphanumeric chars with underscore, lowercase
    a.download = `${bot.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Process bots (Filter & Sort)
  const processedBots = useMemo(() => {
    let result = [...bots];

    // Filter by Status
    if (statusFilter !== 'ALL') {
      result = result.filter(b => b.status === statusFilter);
    }

    // Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.name.toLowerCase().includes(q) || 
        b.id.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'NAME') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'PNL') {
        return b.pnl - a.pnl; // Descending PnL
      }
      if (sortBy === 'UPTIME') {
        // Parse "Xd Yh" or "Xm" etc. Simplified parser for "Xd Yh" format
        const getHours = (str: string) => {
           // Handle simple "1m" case
           if (str.includes('m') && !str.includes('h') && !str.includes('d')) return 0.01; 
           
           const dMatch = str.match(/(\d+)d/);
           const hMatch = str.match(/(\d+)h/);
           const d = dMatch ? parseInt(dMatch[1]) : 0;
           const h = hMatch ? parseInt(hMatch[1]) : 0;
           return d * 24 + h;
        };
        return getHours(b.uptime) - getHours(a.uptime); // Descending Uptime
      }
      return 0;
    });

    return result;
  }, [bots, statusFilter, sortBy, searchQuery]);

  return (
    <div className="flex flex-col h-full gap-6 relative">
      
      {/* History Modal Overlay */}
      {historyBot && (
        <div className="absolute inset-0 z-50 flex justify-end bg-gray-950/80 backdrop-blur-sm animate-in fade-in">
           <div className="w-full md:w-2/3 lg:w-1/2 bg-gray-900 h-full border-l border-gray-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900">
                <div>
                   <h2 className="text-xl font-bold text-white flex items-center gap-2">
                     <History className="text-blue-400" /> Activity Log
                   </h2>
                   <p className="text-gray-400 text-sm mt-1">{historyBot.name}</p>
                </div>
                <button onClick={() => setHistoryBotId(null)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                 {historyBot.history && historyBot.history.length > 0 ? (
                    <div className="relative border-l border-gray-700 ml-3 space-y-8">
                      {historyBot.history.map((entry) => (
                        <div key={entry.id} className="relative pl-8">
                           {/* Timeline Dot */}
                           <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${
                             entry.type === 'TRADE' ? 'bg-green-500' :
                             entry.type === 'ALERT' ? 'bg-red-500' :
                             entry.type === 'STATUS_CHANGE' ? 'bg-yellow-500' : 'bg-blue-500'
                           }`} />
                           
                           <div className="flex flex-col gap-1">
                             <div className="flex items-center justify-between">
                               <span className={`text-sm font-bold ${
                                 entry.type === 'TRADE' ? 'text-green-400' :
                                 entry.type === 'ALERT' ? 'text-red-400' : 'text-gray-200'
                               }`}>
                                 {entry.title}
                               </span>
                               <span className="text-xs text-gray-500 font-mono">
                                 {new Date(entry.timestamp).toLocaleString()}
                               </span>
                             </div>
                             <p className="text-gray-400 text-sm leading-relaxed">{entry.description}</p>
                             
                             {entry.profit !== undefined && (
                               <div className={`mt-2 inline-flex items-center px-2 py-1 rounded text-xs font-bold border ${
                                 entry.profit >= 0 
                                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                               }`}>
                                 {entry.profit >= 0 ? '+' : ''}${entry.profit.toFixed(2)}
                               </div>
                             )}
                           </div>
                        </div>
                      ))}
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                       <Clock size={48} className="mb-4 opacity-20" />
                       <p>No history available for this bot.</p>
                    </div>
                 )}
              </div>
              
              <div className="p-4 border-t border-gray-800 bg-gray-900 text-center">
                 <button onClick={() => setHistoryBotId(null)} className="text-sm text-gray-400 hover:text-white">Close Log</button>
              </div>
           </div>
        </div>
      )}

      {/* Alert Banner */}
      {allActiveAlerts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
           <AlertOctagon className="text-red-500 shrink-0 mt-0.5" size={20} />
           <div className="flex-1">
             <h4 className="text-red-400 font-bold text-sm mb-1">Attention Required ({allActiveAlerts.length})</h4>
             <ul className="text-xs text-gray-300 space-y-1">
               {allActiveAlerts.map(alert => (
                 <li key={alert.id} className="flex gap-2">
                   <span className="font-semibold text-white">{alert.botName}:</span>
                   <span>{alert.message}</span>
                   <span className="text-gray-500 text-[10px] ml-auto">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                 </li>
               ))}
             </ul>
           </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-xs uppercase font-bold mb-1">Active Bots</div>
              <div className="text-2xl font-bold text-white flex items-center gap-2">
                 {activeCount} <span className="text-gray-500 text-sm font-normal">/ {bots.length}</span>
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
               <Activity size={24} />
            </div>
         </div>
         <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg flex items-center justify-between">
            <div>
               <div className="text-gray-400 text-xs uppercase font-bold mb-1">Total PnL</div>
               <div className={`text-2xl font-bold flex items-center gap-2 ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${totalPnL.toLocaleString()}
               </div>
            </div>
            <div className={`p-3 rounded-lg ${totalPnL >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
               <TrendingUp size={24} />
            </div>
         </div>
         <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg flex items-center justify-between">
            <div>
               <div className="text-gray-400 text-xs uppercase font-bold mb-1">System Status</div>
               <div className="text-2xl font-bold text-green-400 flex items-center gap-2">
                  Operational
               </div>
            </div>
            <div className="relative flex items-center justify-center p-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-20"></span>
                 <Bot size={24} className="text-green-400 relative z-10" />
            </div>
         </div>
      </div>

      {/* Bot List Container */}
      <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 p-6 overflow-y-auto custom-scrollbar flex flex-col">
         
         <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Bot size={24} className="text-blue-400" />
              Deployed Strategies
            </h3>

            <div className="flex flex-wrap items-center gap-3">
               
               {/* Search Input */}
               <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-400 transition-colors" size={14} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search bots..."
                    className="bg-gray-800 text-gray-300 text-xs font-medium border border-gray-700 rounded-lg py-1.5 pl-9 pr-3 focus:outline-none focus:border-blue-500 w-32 md:w-48 transition-all focus:w-56"
                  />
               </div>

               {/* Filter Group */}
               <div className="flex items-center bg-gray-800 rounded-lg p-1 border border-gray-700">
                  {(['ALL', 'RUNNING', 'PAUSED', 'STOPPED'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        statusFilter === status 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </button>
                  ))}
               </div>

               <div className="h-6 w-px bg-gray-700 mx-1 hidden md:block"></div>

               {/* Sort Dropdown */}
               <div className="relative flex items-center">
                  <ArrowUpDown size={14} className="absolute left-3 text-gray-500" />
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-gray-800 text-gray-300 text-xs font-medium border border-gray-700 rounded-lg py-1.5 pl-8 pr-3 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer hover:bg-gray-750"
                  >
                    <option value="PNL">Sort by PnL</option>
                    <option value="NAME">Sort by Name</option>
                    <option value="UPTIME">Sort by Uptime</option>
                  </select>
               </div>
            </div>
         </div>
         
         {processedBots.length === 0 ? (
           <div className="flex flex-col items-center justify-center flex-1 text-gray-500 min-h-[300px]">
             <Filter size={48} className="mb-4 opacity-20" />
             <p className="text-lg">No bots found</p>
             <p className="text-sm">Try adjusting your filters or deploy a new strategy.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
             {processedBots.map(bot => (
               <div key={bot.id} className={`relative bg-gray-800 rounded-lg p-5 border flex flex-col justify-between transition-all shadow-md group animate-in fade-in duration-300 overflow-hidden ${bot.activeAlerts.length > 0 ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-gray-700 hover:border-gray-600'}`}>
                  
                  {/* Active Alert Indicator */}
                  {bot.activeAlerts.length > 0 && (
                    <div className="absolute top-0 right-0 p-2">
                       <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    </div>
                  )}

                  {/* Settings Overlay */}
                  {alertForm?.id === bot.id && (
                     <div className="absolute inset-0 z-20 bg-gray-850 p-5 flex flex-col gap-4 animate-in slide-in-from-bottom-5">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                          <h5 className="font-bold text-white flex items-center gap-2">
                            <Bell size={16} className="text-blue-400" /> Bot Settings
                          </h5>
                          <button onClick={() => setAlertForm(null)} className="text-gray-400 hover:text-white">
                            <X size={18} />
                          </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                            {/* Performance Section */}
                            <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                                <h6 className="text-xs font-bold text-gray-300 uppercase mb-3 flex items-center gap-2">
                                    <TrendingUp size={12} className="text-blue-400" /> Performance & Risk
                                </h6>
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-xs text-gray-400 block mb-1">Profit Target Goal ($)</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={alertForm.targetPnl}
                                            onChange={(e) => setAlertForm({...alertForm, targetPnl: e.target.value})}
                                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-green-500 focus:outline-none transition-colors"
                                            placeholder="5000"
                                        />
                                        <Target size={14} className="absolute right-3 top-2.5 text-gray-500" />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-xs text-gray-400 block mb-1">Trigger alert if PnL drops below:</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={alertForm.pnlDropThreshold}
                                            onChange={(e) => setAlertForm({...alertForm, pnlDropThreshold: e.target.value})}
                                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 pl-3 pr-8 text-sm text-white focus:border-red-500 focus:outline-none transition-colors"
                                            placeholder="-5"
                                        />
                                        <span className="absolute right-3 top-2 text-gray-500 text-xs font-bold">%</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1.5 flex justify-between">
                                        <span>Current PnL: <span className={bot.pnlPercent >= 0 ? "text-green-400" : "text-red-400"}>{bot.pnlPercent}%</span></span>
                                        <span>Limit: {alertForm.pnlDropThreshold}%</span>
                                    </p>
                                  </div>
                                </div>
                            </div>

                            {/* System Section */}
                            <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                                <h6 className="text-xs font-bold text-gray-300 uppercase mb-3 flex items-center gap-2">
                                    <Activity size={12} className="text-purple-400" /> System Health
                                </h6>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Max Downtime Threshold</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={alertForm.maxDowntimeMinutes}
                                                onChange={(e) => setAlertForm({...alertForm, maxDowntimeMinutes: e.target.value})}
                                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                            />
                                            <span className="absolute right-3 top-2 text-gray-500 text-xs">min</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm text-gray-300">Notify on Trade Failure</span>
                                        <button 
                                            onClick={() => setAlertForm({...alertForm, notifyOnTradeFailure: !alertForm.notifyOnTradeFailure})}
                                            className={`w-10 h-5 rounded-full relative transition-colors ${alertForm.notifyOnTradeFailure ? 'bg-blue-600' : 'bg-gray-700'}`}
                                        >
                                            <span className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${alertForm.notifyOnTradeFailure ? 'translate-x-5' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-gray-700">
                           <button onClick={handleSaveAlerts} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                             <Check size={16} /> Save Config
                           </button>
                        </div>
                     </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                     <div className="flex-1 mr-4">
                       <div className="flex items-center gap-3 mb-1">
                          {/* Visual Status Indicator */}
                          <div className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
                              bot.status === 'RUNNING' ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 
                              bot.status === 'PAUSED' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.1)]' : 
                              'bg-gray-700/50 border-gray-600 text-gray-400'
                          }`}>
                              {bot.status === 'RUNNING' && <Play size={16} fill="currentColor" className="ml-0.5" />}
                              {bot.status === 'PAUSED' && <Pause size={16} fill="currentColor" />}
                              {bot.status === 'STOPPED' && <Square size={14} fill="currentColor" />}
                          </div>

                          {editingNameId === bot.id ? (
                              <div className="flex-1 flex items-center gap-2 animate-in fade-in">
                                <input
                                    type="text"
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    className="bg-gray-900 border border-blue-500 rounded px-2 py-1 text-lg font-bold text-white w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveName();
                                        if (e.key === 'Escape') handleCancelRename();
                                    }}
                                />
                                <button onClick={handleSaveName} className="p-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-md transition-colors"><Check size={16} /></button>
                                <button onClick={handleCancelRename} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"><X size={16} /></button>
                              </div>
                          ) : (
                              <div className="group/name flex items-center gap-2 overflow-hidden">
                                <h4 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors truncate" title={bot.name}>{bot.name}</h4>
                                <button 
                                  onClick={() => handleStartRename(bot)}
                                  className="opacity-0 group-hover/name:opacity-100 p-1 text-gray-500 hover:text-blue-400 hover:bg-gray-700 rounded transition-all flex-shrink-0"
                                  title="Rename Bot"
                                >
                                    <Pencil size={12} />
                                </button>
                              </div>
                          )}
                       </div>
                       
                       <div className="flex items-center gap-2 mt-1 pl-11">
                         <span className={`px-2 py-0.5 rounded text-xs font-bold border flex items-center gap-1 ${
                           bot.status === 'RUNNING' 
                             ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                             : bot.status === 'PAUSED' 
                               ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                               : 'bg-red-500/10 text-red-400 border-red-500/20'
                         }`}>
                           <span className={`w-1.5 h-1.5 rounded-full ${
                             bot.status === 'RUNNING' ? 'bg-green-400 animate-pulse' : 
                             bot.status === 'PAUSED' ? 'bg-yellow-400' : 'bg-red-400'
                           }`}></span>
                           {bot.status}
                         </span>
                         <span className="text-xs text-gray-500 flex items-center gap-1 bg-gray-900 px-2 py-0.5 rounded">
                           <Clock size={10} /> {bot.uptime}
                         </span>
                       </div>
                     </div>
                     <div className="text-right">
                        <div className={`font-mono font-bold text-lg ${bot.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {bot.pnl >= 0 ? '+' : ''}{bot.pnl.toLocaleString()}
                        </div>
                        <div className={`text-xs ${bot.pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {bot.pnlPercent >= 0 ? '+' : ''}{bot.pnlPercent}%
                        </div>
                     </div>
                  </div>

                  {/* PnL Progress Bar */}
                  {bot.targetPnl && bot.targetPnl > 0 && (
                    <div className="mb-4">
                       <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{Math.min(100, Math.max(0, (bot.pnl / bot.targetPnl) * 100)).toFixed(1)}% of ${bot.targetPnl}</span>
                       </div>
                       <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${bot.pnl >= bot.targetPnl ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(100, Math.max(0, (bot.pnl / bot.targetPnl) * 100))}%` }}
                          />
                       </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 border-t border-gray-700 pt-4 mt-auto">
                     <div className="text-xs text-gray-400">
                        Total Trades: <span className="text-white font-mono ml-1">{bot.trades}</span>
                     </div>
                     <div className="h-3 w-px bg-gray-700"></div>
                     <div className="text-xs text-gray-400">
                        Last Trade: <span className="text-white ml-1">{bot.lastTrade}</span>
                     </div>
                     
                     <div className="ml-auto flex gap-2">
                        <button 
                          onClick={() => setHistoryBotId(bot.id)}
                          className="p-2 rounded-lg bg-gray-700/30 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                          title="View History Log"
                        >
                           <History size={18} />
                        </button>
                        <button 
                          onClick={() => handleExportCode(bot)}
                          disabled={!bot.strategyCode}
                          className={`p-2 rounded-lg border transition-colors ${
                             !bot.strategyCode 
                             ? 'bg-gray-800/50 border-gray-800 text-gray-600 cursor-not-allowed' 
                             : 'bg-gray-700/30 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                          title={bot.strategyCode ? "Export Strategy Code" : "No code available"}
                        >
                           <FileCode size={18} />
                        </button>
                         <button 
                          onClick={() => setAlertForm({
                              id: bot.id,
                              pnlDropThreshold: bot.alertSettings.pnlDropThreshold.toString(),
                              maxDowntimeMinutes: bot.alertSettings.maxDowntimeMinutes.toString(),
                              notifyOnTradeFailure: bot.alertSettings.notifyOnTradeFailure,
                              targetPnl: bot.targetPnl ? bot.targetPnl.toString() : '5000'
                          })}
                          className={`p-2 rounded-lg transition-colors border ${
                             bot.activeAlerts.length > 0
                             ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                             : 'bg-gray-700/30 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                          title="Configure Settings"
                        >
                          <Settings size={18} />
                        </button>
                        <button 
                          onClick={() => onToggleStatus(bot.id)}
                          className={`p-2 rounded-lg transition-colors border ${
                            bot.status === 'RUNNING' 
                              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20' 
                              : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                          }`}
                          title={bot.status === 'RUNNING' ? 'Pause Bot' : 'Start Bot'}
                        >
                          {bot.status === 'RUNNING' ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <button 
                          onClick={() => onDelete(bot.id)}
                          className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Delete Bot"
                        >
                           <Trash2 size={18} />
                        </button>
                     </div>
                  </div>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
};

export default BotDashboard;