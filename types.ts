export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma7?: number;
  ma25?: number;
}

export interface BacktestSettings {
  initialCapital: number;
  riskPerTrade: number;
  slippage: number;
}

export interface BacktestResult {
  strategyName: string;
  description: string;
  totalReturn: string;
  winRate: string;
  maxDrawdown: string;
  sharpeRatio: string;
  tradesExecuted: number;
  pseudoCode: string;
  equityCurve: { time: string; value: number }[];
}

export interface BotAlertSettings {
  pnlDropThreshold: number;
  maxDowntimeMinutes: number;
  notifyOnTradeFailure: boolean;
}

export interface ActiveAlert {
  id: string;
  type: 'PNL' | 'DOWNTIME' | 'FAILURE';
  message: string;
  severity: 'WARNING' | 'CRITICAL';
  timestamp: string;
}

export interface BotHistoryEntry {
  id: string;
  timestamp: string;
  type: 'TRADE' | 'STATUS_CHANGE' | 'ALERT' | 'INFO';
  title: string;
  description: string;
  profit?: number;
}

export interface TradingBot {
  id: string;
  name: string;
  status: 'RUNNING' | 'PAUSED' | 'STOPPED';
  pnl: number;
  pnlPercent: number;
  uptime: string;
  trades: number;
  lastTrade: string;
  alertSettings: BotAlertSettings;
  activeAlerts: ActiveAlert[];
  targetPnl?: number;
  strategyCode?: string;
  history: BotHistoryEntry[];
}

export enum TabView {
  DASHBOARD = 'DASHBOARD',
  STRATEGY = 'STRATEGY',
  BOTS = 'BOTS',
  DATA = 'DATA',
  SETTINGS = 'SETTINGS'
}

export interface AnalysisResponse {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number;
  summary: string;
  keyLevels: {
    support: number[];
    resistance: number[];
  };
}