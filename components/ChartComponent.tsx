import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { CandleData } from '../types';

interface ChartComponentProps {
  data: CandleData[];
  keyLevels?: { support: number[]; resistance: number[] };
}

const ChartComponent: React.FC<ChartComponentProps> = ({ data, keyLevels }) => {
  // Formatters
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatPrice = (value: number) => `$${value.toLocaleString()}`;

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload as CandleData;
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded shadow-xl text-xs font-mono">
          <p className="text-gray-400 mb-2">{new Date(label).toLocaleString()}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-gray-400">Open:</span>
            <span className="text-right text-white">{d.open}</span>
            <span className="text-gray-400">High:</span>
            <span className="text-right text-green-400">{d.high}</span>
            <span className="text-gray-400">Low:</span>
            <span className="text-right text-red-400">{d.low}</span>
            <span className="text-gray-400">Close:</span>
            <span className="text-right text-white">{d.close}</span>
            <span className="text-gray-400">Vol:</span>
            <span className="text-right text-blue-400">{d.volume}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full bg-gray-950 rounded-lg p-2 relative">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
         <div className="bg-gray-800/50 backdrop-blur px-2 py-1 rounded text-xs text-gray-300">
           BTC/USD
         </div>
         <div className="bg-gray-800/50 backdrop-blur px-2 py-1 rounded text-xs text-green-400 flex items-center">
           ● Live
         </div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          
          <XAxis 
            dataKey="time" 
            tickFormatter={formatXAxis} 
            stroke="#4b5563" 
            tick={{ fill: '#6b7280', fontSize: 10 }}
            minTickGap={50}
          />
          
          <YAxis 
            yAxisId="right"
            orientation="right" 
            domain={['auto', 'auto']}
            tickFormatter={formatPrice}
            stroke="#4b5563"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            width={60}
          />

          <YAxis
             yAxisId="left"
             orientation="left"
             show={false} // Hidden volume axis
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Volume Bars */}
          <Bar dataKey="volume" yAxisId="left" barSize={4} fill="#1f2937" opacity={0.5}>
            {data.map((entry, index) => (
               <Cell key={`cell-${index}`} fill={entry.close > entry.open ? '#10b981' : '#ef4444'} opacity={0.3} />
            ))}
          </Bar>

          {/* Main Price Line */}
          <Area 
            type="monotone" 
            dataKey="close" 
            yAxisId="right"
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorClose)" 
            strokeWidth={2}
          />

          {/* Moving Averages */}
          <Line 
            type="monotone" 
            dataKey="ma7" 
            yAxisId="right" 
            stroke="#fbbf24" 
            strokeWidth={1} 
            dot={false} 
            strokeOpacity={0.7}
          />
           <Line 
            type="monotone" 
            dataKey="ma25" 
            yAxisId="right" 
            stroke="#8b5cf6" 
            strokeWidth={1} 
            dot={false} 
            strokeOpacity={0.7}
          />

          {/* AI Generated Levels */}
          {keyLevels?.support.map((level, i) => (
             <ReferenceLine key={`sup-${i}`} y={level} yAxisId="right" stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: 'Sup', fill: '#10b981', fontSize: 10}} />
          ))}
           {keyLevels?.resistance.map((level, i) => (
             <ReferenceLine key={`res-${i}`} y={level} yAxisId="right" stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Res', fill: '#ef4444', fontSize: 10}} />
          ))}

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartComponent;