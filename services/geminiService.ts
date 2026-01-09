import { GoogleGenAI, Type } from "@google/genai";
import { BacktestResult, CandleData, AnalysisResponse, BacktestSettings } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMarketData = async (data: CandleData[]): Promise<AnalysisResponse> => {
  try {
    const recentData = data.slice(-20); // Analyze last 20 candles
    const prompt = `Analyze this market data (OHLCV). Identify the trend, key support/resistance levels, and overall sentiment.
    Data context: Bitcoin/USD Hourly.
    Data: ${JSON.stringify(recentData)}
    
    Return a JSON object with this schema:
    {
      "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
      "score": number (0-100, where 100 is max bullish),
      "summary": "Short concise paragraph analysis",
      "keyLevels": { "support": [numbers], "resistance": [numbers] }
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, enum: ["BULLISH", "BEARISH", "NEUTRAL"] },
            score: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            keyLevels: {
              type: Type.OBJECT,
              properties: {
                support: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                resistance: { type: Type.ARRAY, items: { type: Type.NUMBER } }
              }
            }
          }
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return {
      sentiment: "NEUTRAL",
      score: 50,
      summary: "AI Service currently unavailable. Using standard technical analysis fallback.",
      keyLevels: { support: [], resistance: [] }
    };
  }
};

export const generateStrategyAndBacktest = async (
  userPrompt: string, 
  marketData: CandleData[],
  settings: BacktestSettings
): Promise<BacktestResult> => {
  try {
    const recentSnapshot = marketData.slice(-10); // Give it a snapshot of current conditions
    const prompt = `
      You are an expert Quant Trader.
      User Request: "${userPrompt}"
      
      Backtest Configuration:
      - Initial Capital: $${settings.initialCapital}
      - Risk Per Trade: ${settings.riskPerTrade}%
      - Slippage: ${settings.slippage}%

      Current Market Context (Last 10 candles): ${JSON.stringify(recentSnapshot)}

      Task:
      1. Create a trading strategy based on the user's request.
      2. Simulate a backtest on the implied historical data (assume a 30-day period based on typical volatility of the provided snapshot) using the provided configuration.
      3. Generate a Python-like pseudocode for the strategy.

      Return JSON matching this schema:
      {
        "strategyName": string,
        "description": string,
        "totalReturn": string (e.g. "+15.4%"),
        "winRate": string (e.g. "65%"),
        "maxDrawdown": string (e.g. "-4.2%"),
        "sharpeRatio": string (e.g. "1.8"),
        "tradesExecuted": number,
        "pseudoCode": string,
        "equityCurve": Array of { time: string, value: number } (Simulate a curve starting at ${settings.initialCapital})
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strategyName: { type: Type.STRING },
            description: { type: Type.STRING },
            totalReturn: { type: Type.STRING },
            winRate: { type: Type.STRING },
            maxDrawdown: { type: Type.STRING },
            sharpeRatio: { type: Type.STRING },
            tradesExecuted: { type: Type.NUMBER },
            pseudoCode: { type: Type.STRING },
            equityCurve: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  value: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Strategy generation error:", error);
    throw new Error("Failed to generate strategy");
  }
};

export const generateBatchStrategies = async (
  count: number,
  userHint: string,
  marketData: CandleData[],
  settings: BacktestSettings,
  riskProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' = 'MODERATE'
): Promise<BacktestResult[]> => {
  try {
    const recentSnapshot = marketData.slice(-10);
    const prompt = `
      You are an expert Quant Trader.
      Task: Generate ${count} DISTINCT trading strategies to compete against each other.
      Risk Profile: ${riskProfile}
      ${userHint ? `User Focus/Theme: "${userHint}"` : 'Theme: Diverse Market Approaches'}
      
      Requirements:
      1. Vary the logic significantly${userHint ? ' within the requested theme' : ' (e.g., Strategy 1: Trend Following, Strategy 2: Mean Reversion, Strategy 3: Breakout)'}.
      2. Adhere to the ${riskProfile} risk profile:
         ${riskProfile === 'CONSERVATIVE' ? '- Prioritize capital preservation. Use tight stop-losses, lower leverage, and high-probability setups. Avoid high volatility.' : ''}
         ${riskProfile === 'MODERATE' ? '- Balance risk and reward. Use standard risk management ratios (e.g. 1:2).' : ''}
         ${riskProfile === 'AGGRESSIVE' ? '- Prioritize growth. Accept higher drawdowns for potentially higher returns. Allow for more frequent trading or volatile setups.' : ''}
      3. Simulate a 30-day backtest for EACH strategy based on the volatility of the provided market snapshot.
      4. Ensure the results are realistic.

      Backtest Config: Capital $${settings.initialCapital}, Risk ${settings.riskPerTrade}%, Slippage ${settings.slippage}%.
      Market Context: ${JSON.stringify(recentSnapshot)}

      Return a JSON ARRAY where each item matches this schema:
      {
        "strategyName": string,
        "description": string,
        "totalReturn": string (e.g. "+15.4%"),
        "winRate": string (e.g. "65%"),
        "maxDrawdown": string (e.g. "-4.2%"),
        "sharpeRatio": string (e.g. "1.8"),
        "tradesExecuted": number,
        "pseudoCode": string,
        "equityCurve": Array of { time: string, value: number } (Simulate a curve starting at ${settings.initialCapital})
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              strategyName: { type: Type.STRING },
              description: { type: Type.STRING },
              totalReturn: { type: Type.STRING },
              winRate: { type: Type.STRING },
              maxDrawdown: { type: Type.STRING },
              sharpeRatio: { type: Type.STRING },
              tradesExecuted: { type: Type.NUMBER },
              pseudoCode: { type: Type.STRING },
              equityCurve: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING },
                    value: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Batch strategy generation error:", error);
    throw new Error("Failed to generate strategies");
  }
};