// Technical indicator calculations used by the multi-timeframe signal engine.
// All functions are pure and operate on plain number arrays (candle closes).

export function sma(values: number[], period: number): number {
  if (values.length < period) return values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function ema(values: number[], period: number): number {
  if (values.length === 0) return 0;
  const k = 2 / (period + 1);
  let e = values[0];
  for (let i = 1; i < values.length; i++) {
    e = values[i] * k + e * (1 - k);
  }
  return e;
}

export function emaSeries(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const out: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    out.push(values[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}

export function rsi(values: number[], period = 14): number {
  if (values.length < 2) return 50;
  let gains = 0;
  let losses = 0;
  const start = Math.max(1, values.length - period - 1);
  for (let i = start; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
}

export function macd(values: number[], fast = 12, slow = 26, signalPeriod = 9): MACDResult {
  if (values.length < slow + signalPeriod) {
    return { macd: 0, signal: 0, histogram: 0 };
  }
  const fastSeries = emaSeries(values, fast);
  const slowSeries = emaSeries(values, slow);
  const macdSeries = fastSeries.map((f, i) => f - slowSeries[i]);
  const signalSeries = emaSeries(macdSeries.slice(-50), signalPeriod);
  const macdVal = macdSeries[macdSeries.length - 1];
  const signalVal = signalSeries[signalSeries.length - 1];
  return {
    macd: macdVal,
    signal: signalVal,
    histogram: macdVal - signalVal,
  };
}

export interface BollingerResult {
  upper: number;
  middle: number;
  lower: number;
}

export function bollinger(values: number[], period = 20, mult = 2): BollingerResult {
  if (values.length < period) {
    const m = sma(values, values.length);
    return { upper: m, middle: m, lower: m };
  }
  const slice = values.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((acc, v) => acc + (v - middle) ** 2, 0) / period;
  const sd = Math.sqrt(variance);
  return {
    upper: middle + mult * sd,
    middle,
    lower: middle - mult * sd,
  };
}

export function atr(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (closes.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trs.push(tr);
  }
  return sma(trs, Math.min(period, trs.length));
}

// Detect trend direction based on EMA cross and slope
export function detectTrend(values: number[]): { direction: "up" | "down" | "flat"; strength: number } {
  if (values.length < 30) return { direction: "flat", strength: 0 };
  const emaFast = ema(values.slice(-30), 9);
  const emaSlow = ema(values.slice(-30), 21);
  const diff = (emaFast - emaSlow) / emaSlow;
  const direction = diff > 0.0008 ? "up" : diff < -0.0008 ? "down" : "flat";
  return { direction, strength: Math.min(100, Math.abs(diff) * 5000) };
}

export interface IndicatorSnapshot {
  rsi: number;
  macd: MACDResult;
  bollinger: BollingerResult;
  trend: { direction: "up" | "down" | "flat"; strength: number };
  ema9: number;
  ema21: number;
  ema50: number;
  lastPrice: number;
}

export function computeIndicators(closes: number[]): IndicatorSnapshot {
  return {
    rsi: rsi(closes, 14),
    macd: macd(closes),
    bollinger: bollinger(closes, 20, 2),
    trend: detectTrend(closes),
    ema9: ema(closes, 9),
    ema21: ema(closes, 21),
    ema50: ema(closes, 50),
    lastPrice: closes[closes.length - 1] ?? 0,
  };
}

export interface TechnicalScore {
  direction: "long" | "short" | "neutral";
  strength: number; // 0-100
  reasons: string[];
}

// Aggregate indicators into a single technical vote.
export function aggregateTechnical(snap: IndicatorSnapshot): TechnicalScore {
  const reasons: string[] = [];
  let bullScore = 0;
  let bearScore = 0;

  // RSI
  if (snap.rsi < 30) {
    bullScore += 25;
    reasons.push(`RSI=${snap.rsi.toFixed(1)} oversold`);
  } else if (snap.rsi > 70) {
    bearScore += 25;
    reasons.push(`RSI=${snap.rsi.toFixed(1)} overbought`);
  } else if (snap.rsi > 50) {
    bullScore += 8;
  } else if (snap.rsi < 50) {
    bearScore += 8;
  }

  // MACD
  if (snap.macd.histogram > 0 && snap.macd.macd > snap.macd.signal) {
    bullScore += 20;
    reasons.push("MACD bullish cross");
  } else if (snap.macd.histogram < 0 && snap.macd.macd < snap.macd.signal) {
    bearScore += 20;
    reasons.push("MACD bearish cross");
  }

  // EMA cross
  if (snap.ema9 > snap.ema21 && snap.ema21 > snap.ema50) {
    bullScore += 20;
    reasons.push("EMA stack bullish (9>21>50)");
  } else if (snap.ema9 < snap.ema21 && snap.ema21 < snap.ema50) {
    bearScore += 20;
    reasons.push("EMA stack bearish (9<21<50)");
  }

  // Bollinger
  if (snap.lastPrice < snap.bollinger.lower) {
    bullScore += 15;
    reasons.push("Price below lower Bollinger band");
  } else if (snap.lastPrice > snap.bollinger.upper) {
    bearScore += 15;
    reasons.push("Price above upper Bollinger band");
  }

  // Trend
  if (snap.trend.direction === "up") {
    bullScore += 20;
    reasons.push("Uptrend confirmed");
  } else if (snap.trend.direction === "down") {
    bearScore += 20;
    reasons.push("Downtrend confirmed");
  }

  const direction: TechnicalScore["direction"] =
    bullScore > bearScore + 15 ? "long" : bearScore > bullScore + 15 ? "short" : "neutral";
  const strength = Math.min(100, Math.max(bullScore, bearScore));

  return { direction, strength, reasons };
}
