// Real-time market data from Yahoo Finance (free, no API key needed)
// Supports: gold (XAU/USD), crude oil (WTI/USD), DXY, Treasury yields, indices

export interface PriceQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  currency: string;
  exchangeName: string;
  fetchedAt: string;
}

export interface OHLC {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const YAHOO_SYMBOLS: Record<string, string> = {
  "XAU/USD": "XAUUSD=X",     // Gold spot (more reliable than GC=F futures)
  "WTI/USD": "CLUSD=X",      // WTI Crude oil spot
  "DXY": "DX-Y.NYB",        // US Dollar Index
  "US10Y": "^TNX",          // 10-Year Treasury Yield
  "US2Y": "^IRX",           // 13-week Treasury Yield
  "SP500": "^GSPC",         // S&P 500
  "NASDAQ": "^IXIC",        // Nasdaq Composite
  "VIX": "^VIX",            // Volatility Index
  "BTC/USD": "BTC-USD",     // Bitcoin
  "ETH/USD": "ETH-USD",     // Ethereum
};

// Alternative symbols to try if primary fails
const ALT_SYMBOLS: Record<string, string[]> = {
  "XAU/USD": ["GC=F", "XAUUSD=X", "GOLD"],
  "WTI/USD": ["CL=F", "CLUSD=X", "OIL"],
  "DXY": ["DX-Y.NYB", "DX=F", "UUP"],
  "US10Y": ["^TNX", "TNX", "10YRYLD"],
};

const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function fetchQuote(symbol: string): Promise<PriceQuote | null> {
  // Try primary symbol + all alternative symbols
  const symbolsToTry = [YAHOO_SYMBOLS[symbol] || symbol, ...(ALT_SYMBOLS[symbol] || [])];
  const uniqueSymbols = [...new Set(symbolsToTry)]; // deduplicate

  for (const ySymbol of uniqueSymbols) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySymbol)}?interval=1d&range=1d`;
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
          },
          signal: AbortSignal.timeout(8000),
        });

        if (res.status === 429 || res.status === 401 || res.status === 404) {
          break; // try next symbol
        }

        if (!res.ok) {
          if (attempt < 1) {
            await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
            continue;
          }
          break;
        }

        const data = await res.json();
        const result = data?.chart?.result?.[0];
        if (!result || !result.meta?.regularMarketPrice) {
          break; // no data, try next symbol
        }

        const meta = result.meta;
        const quote: PriceQuote = {
          symbol,
          price: meta.regularMarketPrice,
          change: meta.regularMarketPrice - (meta.chartPreviousClose || meta.previousClose || 0),
          changePercent: meta.regularMarketChangePercent || 0,
          previousClose: meta.chartPreviousClose || meta.previousClose || 0,
          dayHigh: meta.regularMarketDayHigh || meta.regularMarketPrice,
          dayLow: meta.regularMarketDayLow || meta.regularMarketPrice,
          currency: meta.currency || "USD",
          exchangeName: meta.exchangeName || "",
          fetchedAt: new Date().toISOString(),
        };

        return quote;
      } catch (err) {
        if (attempt < 1) {
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
          continue;
        }
        // try next symbol
      }
    }
  }

  return null;
}

export async function fetchQuotes(symbols: string[]): Promise<Record<string, PriceQuote | null>> {
  const out: Record<string, PriceQuote | null> = {};

  // Try parallel first
  const settled = await Promise.allSettled(
    symbols.map(async (s) => {
      const q = await fetchQuote(s);
      return [s, q] as const;
    })
  );

  for (let i = 0; i < settled.length; i++) {
    const r = settled[i];
    const symbol = symbols[i];
    if (r.status === "fulfilled") {
      out[r.value[0]] = r.value[1];
    }
  }

  // Retry failed/missing symbols sequentially with backoff
  const missing = symbols.filter((s) => out[s] === undefined || out[s] === null);
  if (missing.length > 0) {
    for (const symbol of missing) {
      try {
        await new Promise((res) => setTimeout(res, 500));
        const q = await fetchQuote(symbol);
        out[symbol] = q;
      } catch {
        out[symbol] = null;
      }
    }
  }

  return out;
}

export async function fetchOHLC(symbol: string, range: "1d" | "5d" | "1mo" | "3mo" = "1mo", interval: "15m" | "1h" | "1d" = "1h"): Promise<OHLC[]> {
  const ySymbol = YAHOO_SYMBOLS[symbol] || symbol;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySymbol)}?interval=${interval}&range=${range}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp || [];
    const quote = result.indicators?.quote?.[0];
    if (!quote) return [];

    const out: OHLC[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quote.open?.[i] == null || quote.close?.[i] == null) continue;
      out.push({
        timestamp: timestamps[i] * 1000,
        open: quote.open[i],
        high: quote.high[i],
        low: quote.low[i],
        close: quote.close[i],
        volume: quote.volume?.[i] || 0,
      });
    }
    return out;
  } catch (err) {
    console.error(`[fetchOHLC ${symbol}] error:`, err);
    return [];
  }
}
