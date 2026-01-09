import React, { useState, useMemo } from 'react';
import { CandleData } from '../types';
import { Download, Calendar, FileText, Table as TableIcon, Filter } from 'lucide-react';

interface DataExplorerProps {
  data: CandleData[];
}

const DataExplorer: React.FC<DataExplorerProps> = ({ data }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState<'CSV' | 'JSON'>('CSV');

  // Filter Logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const itemDate = new Date(item.time);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && itemDate < start) return false;
      // Set end date to end of day to include the full selected day
      if (end) {
        const eod = new Date(end);
        eod.setHours(23, 59, 59, 999);
        if (itemDate > eod) return false;
      }
      return true;
    });
  }, [data, startDate, endDate]);

  const handleDownload = () => {
    let content = '';
    let mimeType = '';
    let extension = '';

    if (format === 'JSON') {
      content = JSON.stringify(filteredData, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else {
      // CSV Header
      const headers = ['Time', 'Open', 'High', 'Low', 'Close', 'Volume', 'MA7', 'MA25'].join(',');
      // CSV Rows
      const rows = filteredData.map(row => 
        `${row.time},${row.open},${row.high},${row.low},${row.close},${row.volume},${row.ma7 || ''},${row.ma25 || ''}`
      ).join('\n');
      content = `${headers}\n${rows}`;
      mimeType = 'text/csv';
      extension = 'csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradeforge_data_${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TableIcon className="text-blue-400" size={24} />
              Historical Market Data
            </h2>
            <p className="text-gray-400 text-sm mt-1">View and export OHLCV market data for analysis.</p>
          </div>
          
          <button 
            onClick={handleDownload}
            disabled={filteredData.length === 0}
            className={`px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
              filteredData.length === 0
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20'
            }`}
          >
            <Download size={18} />
            Export Data
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
           <div className="relative">
             <label className="block text-xs text-gray-500 font-semibold mb-1">Start Date</label>
             <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-blue-500 [&::-webkit-calendar-picker-indicator]:invert"
                />
             </div>
           </div>
           
           <div className="relative">
             <label className="block text-xs text-gray-500 font-semibold mb-1">End Date</label>
             <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-blue-500 [&::-webkit-calendar-picker-indicator]:invert"
                />
             </div>
           </div>

           <div>
              <label className="block text-xs text-gray-500 font-semibold mb-1">Export Format</label>
              <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                <button 
                  onClick={() => setFormat('CSV')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs font-medium transition-colors ${format === 'CSV' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <FileText size={12} /> CSV
                </button>
                <button 
                  onClick={() => setFormat('JSON')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs font-medium transition-colors ${format === 'JSON' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                   <span className="font-mono text-[10px]">{`{ }`}</span> JSON
                </button>
              </div>
           </div>
           
           <div className="flex flex-col justify-end">
             <div className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 flex justify-between items-center">
                <span className="text-xs text-gray-400">Records Found</span>
                <span className="text-sm font-bold text-white">{filteredData.length}</span>
             </div>
           </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden flex flex-col">
         {filteredData.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
             <Filter size={48} className="mb-4 opacity-20" />
             <p>No data found for the selected range.</p>
           </div>
         ) : (
           <div className="flex-1 overflow-auto custom-scrollbar">
             <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-gray-900 sticky top-0 z-10">
                 <tr>
                   <th className="px-6 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Time</th>
                   <th className="px-6 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider text-right">Open</th>
                   <th className="px-6 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider text-right">High</th>
                   <th className="px-6 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider text-right">Low</th>
                   <th className="px-6 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider text-right">Close</th>
                   <th className="px-6 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider text-right">Volume</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-700/50">
                 {filteredData.map((row, index) => (
                   <tr key={index} className="hover:bg-gray-750 transition-colors">
                     <td className="px-6 py-3 text-gray-300 font-mono text-xs">
                       {new Date(row.time).toLocaleString()}
                     </td>
                     <td className="px-6 py-3 text-gray-300 font-mono text-right">${row.open.toFixed(2)}</td>
                     <td className="px-6 py-3 text-green-400 font-mono text-right">${row.high.toFixed(2)}</td>
                     <td className="px-6 py-3 text-red-400 font-mono text-right">${row.low.toFixed(2)}</td>
                     <td className="px-6 py-3 text-white font-mono font-bold text-right">${row.close.toFixed(2)}</td>
                     <td className="px-6 py-3 text-blue-400 font-mono text-right">{row.volume.toLocaleString()}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         )}
      </div>
    </div>
  );
};

export default DataExplorer;