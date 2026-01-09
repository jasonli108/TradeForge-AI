import { CandleData, TradingBot, BotHistoryEntry } from './types';

// Generate some realistic looking random walk financial data
const generateMockData = (count: number): CandleData[] => {
  const data: CandleData[] = [];
  let price = 45000;
  const now = new Date();
  
  for (let i = count; i > 0; i--) {
    const time = new Date(now.getTime() - i * 3600 * 1000).toISOString(); // Hourly candles
    const volatility = price * 0.02; // 2% volatility
    const change = (Math.random() - 0.5) * volatility;
    
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 1000) + 500;

    price = close;

    data.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });
  }

  // Calculate Simple Moving Averages
  return data.map((candle, index, array) => {
    const getMA = (period: number) => {
      if (index < period - 1) return undefined;
      const slice = array.slice(index - period + 1, index + 1);
      const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
      return parseFloat((sum / period).toFixed(2));
    };

    return {
      ...candle,
      ma7: getMA(7),
      ma25: getMA(25),
    };
  });
};

export const MOCK_MARKET_DATA = generateMockData(100);

export const TIME_RANGES = ['1H', '4H', '1D', '1W', '1M'];
export const INDICATORS = ['RSI', 'MACD', 'Bollinger Bands', 'Volume Profile'];

const SAMPLE_CODE = `
def on_tick(candle, indicators):
    # Sample Strategy Logic
    if indicators['rsi'] < 30 and candle['close'] > indicators['ma200']:
        return Order(side='BUY', amount=1.0)
    elif indicators['rsi'] > 70:
        return Order(side='SELL', amount=1.0)
    return None
`;

const generateMockHistory = (count: number): BotHistoryEntry[] => {
  const history: BotHistoryEntry[] = [];
  const now = new Date();
  const types: BotHistoryEntry['type'][] = ['TRADE', 'TRADE', 'TRADE', 'INFO', 'STATUS_CHANGE'];
  
  for(let i=0; i<count; i++) {
    const time = new Date(now.getTime() - i * 1000 * 60 * 45).toISOString(); // Every 45 mins approx
    const type = types[Math.floor(Math.random() * types.length)];
    let entry: BotHistoryEntry = {
      id: `h-${i}`,
      timestamp: time,
      type: type,
      title: '',
      description: ''
    };

    if (type === 'TRADE') {
      const isBuy = Math.random() > 0.5;
      const pnl = isBuy ? 0 : (Math.random() * 100 - 40); // Random PnL on sells
      entry.title = isBuy ? 'Executed BUY Order' : 'Executed SELL Order';
      entry.description = isBuy ? 'Bought 0.5 units @ $45,200' : 'Sold 0.5 units @ $46,100';
      if (!isBuy) entry.profit = parseFloat(pnl.toFixed(2));
    } else if (type === 'STATUS_CHANGE') {
      entry.title = 'Status Update';
      entry.description = Math.random() > 0.5 ? 'Bot resumed from pause' : 'Optimization cycle complete';
    } else {
      entry.title = 'System Log';
      entry.description = 'Synced with exchange API successfully.';
    }
    history.push(entry);
  }
  return history;
};

export const MOCK_BOTS: TradingBot[] = [
  {
    id: '1',
    name: 'MACD Trend Follower - BTC',
    status: 'RUNNING',
    pnl: 1250.50,
    pnlPercent: 12.5,
    uptime: '4d 12h',
    trades: 24,
    lastTrade: '2h ago',
    alertSettings: {
      pnlDropThreshold: 5,
      maxDowntimeMinutes: 60,
      notifyOnTradeFailure: true
    },
    activeAlerts: [],
    targetPnl: 5000,
    strategyCode: `class MACDStrategy:
    def next(self, close, macd, signal):
        if macd > signal and self.position == 0:
            self.buy()
        elif macd < signal and self.position > 0:
            self.sell()
`,
    history: generateMockHistory(15)
  },
  {
    id: '2',
    name: 'RSI Mean Reversion - ETH',
    status: 'PAUSED',
    pnl: -45.20,
    pnlPercent: -0.8,
    uptime: '1d 4h',
    trades: 5,
    lastTrade: '1d ago',
    alertSettings: {
      pnlDropThreshold: 10,
      maxDowntimeMinutes: 30,
      notifyOnTradeFailure: true
    },
    activeAlerts: [
      {
        id: 'a1',
        type: 'DOWNTIME',
        message: 'Bot unresponsive for 45 mins',
        severity: 'WARNING',
        timestamp: new Date().toISOString()
      }
    ],
    targetPnl: 2000,
    strategyCode: `class RSIStrategy:
    def next(self, rsi):
        if rsi < 30:
            self.buy(size=0.1)
        elif rsi > 70:
            self.close_position()
`,
    history: generateMockHistory(5)
  },
  {
    id: '3',
    name: 'Bollinger Breakout - SOL',
    status: 'RUNNING',
    pnl: 3420.80,
    pnlPercent: 28.4,
    uptime: '7d 2h',
    trades: 45,
    lastTrade: '15m ago',
    alertSettings: {
      pnlDropThreshold: 8,
      maxDowntimeMinutes: 45,
      notifyOnTradeFailure: false
    },
    activeAlerts: [],
    targetPnl: 10000,
    strategyCode: SAMPLE_CODE,
    history: generateMockHistory(20)
  },
  {
    id: '4',
    name: 'VWAP Scalper - BTC',
    status: 'STOPPED',
    pnl: -120.50,
    pnlPercent: -2.1,
    uptime: '12h 30m',
    trades: 8,
    lastTrade: '5h ago',
    alertSettings: {
      pnlDropThreshold: 3,
      maxDowntimeMinutes: 15,
      notifyOnTradeFailure: true
    },
    activeAlerts: [
        {
        id: 'a2',
        type: 'FAILURE',
        message: 'API Rate Limit Exceeded',
        severity: 'CRITICAL',
        timestamp: new Date().toISOString()
      }
    ],
    targetPnl: 1000,
    strategyCode: SAMPLE_CODE,
    history: generateMockHistory(8)
  },
  {
    id: '5',
    name: 'Grid Trader - DOGE',
    status: 'RUNNING',
    pnl: 150.25,
    pnlPercent: 1.5,
    uptime: '3d 8h',
    trades: 112,
    lastTrade: '1m ago',
    alertSettings: {
      pnlDropThreshold: 15,
      maxDowntimeMinutes: 120,
      notifyOnTradeFailure: true
    },
    activeAlerts: [],
    targetPnl: 3000,
    strategyCode: SAMPLE_CODE,
    history: generateMockHistory(30)
  },
   {
    id: '6',
    name: 'Ichimoku Cloud - LINK',
    status: 'PAUSED',
    pnl: 12.00,
    pnlPercent: 0.2,
    uptime: '5h 10m',
    trades: 2,
    lastTrade: '3h ago',
    alertSettings: {
      pnlDropThreshold: 5,
      maxDowntimeMinutes: 60,
      notifyOnTradeFailure: true
    },
    activeAlerts: [],
    targetPnl: 1500,
    strategyCode: SAMPLE_CODE,
    history: generateMockHistory(4)
  },
  {
    id: '7',
    name: 'DeepQ Learning Agent - BTC',
    status: 'RUNNING',
    pnl: 5600.75,
    pnlPercent: 28.0,
    uptime: '15d 4h',
    trades: 892,
    lastTrade: '30s ago',
    alertSettings: {
      pnlDropThreshold: 15,
      maxDowntimeMinutes: 30,
      notifyOnTradeFailure: true
    },
    activeAlerts: [],
    targetPnl: 10000,
    strategyCode: `# Reinforced Learning Agent
import torch
import torch.nn as nn

class QNetwork(nn.Module):
    def __init__(self, state_size, action_size):
        super(QNetwork, self).__init__()
        self.fc1 = nn.Linear(state_size, 64)
        self.fc2 = nn.Linear(64, 64)
        self.fc3 = nn.Linear(64, action_size)

    def forward(self, state):
        x = torch.relu(self.fc1(state))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)
`,
    history: generateMockHistory(40)
  },
  {
    id: '8',
    name: 'Sentiment Transformer - ETH',
    status: 'PAUSED',
    pnl: 890.00,
    pnlPercent: 8.9,
    uptime: '3d 12h',
    trades: 45,
    lastTrade: '4h ago',
    alertSettings: {
      pnlDropThreshold: 5,
      maxDowntimeMinutes: 120,
      notifyOnTradeFailure: false
    },
    activeAlerts: [],
    targetPnl: 5000,
    strategyCode: SAMPLE_CODE,
    history: generateMockHistory(12)
  },
  {
    id: '9',
    name: 'Arbitrage Hunter - MATIC',
    status: 'RUNNING',
    pnl: 120.40,
    pnlPercent: 1.2,
    uptime: '6h 15m',
    trades: 14,
    lastTrade: '2m ago',
    alertSettings: {
      pnlDropThreshold: 2,
      maxDowntimeMinutes: 10,
      notifyOnTradeFailure: true
    },
    activeAlerts: [],
    targetPnl: 1000,
    strategyCode: SAMPLE_CODE,
    history: generateMockHistory(10)
  },
  {
    id: '10',
    name: 'Whale Watcher AI - XRP',
    status: 'STOPPED',
    pnl: -50.25,
    pnlPercent: -1.0,
    uptime: '1d 0h',
    trades: 3,
    lastTrade: '1d ago',
    alertSettings: {
      pnlDropThreshold: 5,
      maxDowntimeMinutes: 60,
      notifyOnTradeFailure: true
    },
    activeAlerts: [{
        id: 'a3',
        type: 'PNL',
        message: 'Drawdown limit reached',
        severity: 'WARNING',
        timestamp: new Date().toISOString()
    }],
    targetPnl: 2500,
    strategyCode: SAMPLE_CODE,
    history: generateMockHistory(5)
  }
];