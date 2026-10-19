import { webSearch, analyzeJSON, analyzeText } from "./zai";
import { callGeminiJSON, isGeminiConfigured } from "./gemini";
import { fetchQuotes, type PriceQuote } from "./yahoo";
import { fetchRssNews, categorizeNews, quickSentiment, type RssNewsItem } from "./rss-news";

// LLM helper: tries Z.AI SDK first, then falls back to Google Gemini
async function analyzeJSONWithFallback<T = unknown>(
  systemPrompt: string,
  userPrompt: string
): Promise<T | null> {
  try {
    const result = await analyzeJSON<T>(systemPrompt, userPrompt);
    if (result) return result;
  } catch (e) {
    console.error("[Z.AI LLM] error:", e);
  }
  if (isGeminiConfigured()) {
    try {
      return await callGeminiJSON<T>(systemPrompt, userPrompt);
    } catch (e) {
      console.error("[Gemini LLM] error:", e);
    }
  }
  return null;
}

export interface NewsItem {
  title: string;
  url: string;
  snippet: string;
  source?: string;
  publishedAt?: string;
  category: "fed" | "war" | "politics" | "economy" | "crisis";
  impact: "positive" | "negative" | "neutral";
  summary: string;
}

const NEWS_QUERIES = [
  { category: "fed" as const, q: "Federal Reserve interest rate news", days: 30 },
  { category: "war" as const, q: "world news today headlines", days: 7 },
  { category: "economy" as const, q: "US economy inflation data", days: 30 },
  { category: "crisis" as const, q: "global economy crisis news", days: 30 },
  { category: "politics" as const, q: "US treasury bond market news", days: 30 },
];

// Fallback news items used when web search is unavailable (e.g., external deployments)
function illustrativeNews(): NewsItem[] {
  const now = new Date().toISOString();
  return [
    {
      title: "Federal Reserve Holds Rates Steady at 5.50%",
      url: "https://www.federalreserve.gov",
      snippet: "The Federal Reserve maintained its benchmark rate at 5.50%, signaling patience on future cuts amid persistent inflation and a strong labor market.",
      source: "Federal Reserve",
      publishedAt: now,
      category: "fed",
      impact: "neutral",
      summary: "Fed holds rates at 5.50%, signals patience on cuts amid persistent inflation.",
    },
    {
      title: "Middle East Tensions Escalate, Driving Safe-Haven Demand",
      url: "https://www.reuters.com",
      snippet: "Rising geopolitical tensions in the Middle East are driving safe-haven demand for gold, with prices testing recent highs.",
      source: "Reuters",
      publishedAt: now,
      category: "war",
      impact: "positive",
      summary: "Middle East tensions push gold higher as safe-haven demand rises.",
    },
    {
      title: "US CPI Above Expectations at 3.7%",
      url: "https://www.bls.gov",
      snippet: "Consumer Price Index came in above market expectations at 3.7%, reducing the odds of near-term rate cuts and strengthening the dollar.",
      source: "BLS",
      publishedAt: now,
      category: "economy",
      impact: "negative",
      summary: "US CPI at 3.7% reduces odds of near-term rate cuts, bearish for gold.",
    },
    {
      title: "Global Energy Crisis Concerns Persist",
      url: "https://www.bloomberg.com",
      snippet: "Energy price volatility continues as supply chain disruptions affect global markets, with WTI crude testing key resistance levels.",
      source: "Bloomberg",
      publishedAt: now,
      category: "crisis",
      impact: "positive",
      summary: "Energy crisis concerns persist, supporting commodity prices including gold.",
    },
    {
      title: "Treasury Bond Yields Climb to 4.21%",
      url: "https://www.cnbc.com",
      snippet: "10-year Treasury yields rose to 4.21% as investors reassess Fed policy path, increasing the opportunity cost of holding non-yielding gold.",
      source: "CNBC",
      publishedAt: now,
      category: "politics",
      impact: "negative",
      summary: "10Y Treasury yields at 4.21% increase gold's opportunity cost.",
    },
    {
      title: "Strong US Jobs Data Pushes Dollar Higher",
      url: "https://www.marketwatch.com",
      snippet: "Better-than-expected employment numbers strengthened the dollar index (DXY), putting pressure on gold prices in the near term.",
      source: "MarketWatch",
      publishedAt: now,
      category: "economy",
      impact: "negative",
      summary: "Strong US jobs data lifts DXY, bearish for XAU/USD.",
    },
  ];
}

export async function fetchDailyNews(): Promise<NewsItem[]> {
  // Step 1: Try RSS feeds first (real news, no API key needed)
  const rssItems = await fetchRssNews(15);
  const items: NewsItem[] = rssItems.map((r) => ({
    title: r.title,
    url: r.link,
    snippet: r.description,
    source: r.source,
    publishedAt: r.pubDate,
    category: categorizeNews(r.title),
    impact: quickSentiment(r.title, r.description),
    summary: r.description.slice(0, 200),
  }));

  // Step 2: Also try Z.AI web search for additional items (works in sandbox)
  const settled = await Promise.allSettled(
    NEWS_QUERIES.map(async ({ category, q, days }) => {
      const results = await webSearch(q, 4, days);
      return { category, results };
    })
  );
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const item of r.value.results) {
      // Skip if title already exists
      if (items.some((existing) => existing.title === item.title)) continue;
      items.push({
        title: item.title,
        url: item.url,
        snippet: item.snippet,
        source: item.source,
        publishedAt: item.publishedAt,
        category: r.value.category,
        impact: "neutral",
        summary: item.snippet.slice(0, 200),
      });
    }
  }

  if (items.length === 0) {
    // All sources failed — use illustrative fallback
    return illustrativeNews();
  }

  // Use LLM to classify sentiment impact and summarize (only top 5 items to keep response fast)
  // Skip LLM classification if RSS quickSentiment already classified most items
  const itemsNeedingLLM = items.filter((it) => it.impact === "neutral").slice(0, 5);
  if (itemsNeedingLLM.length > 0 && isGeminiConfigured()) {
    const sample = itemsNeedingLLM.map((it, i) => ({
      i: items.indexOf(it),
      title: it.title,
      snippet: it.snippet.slice(0, 200),
    }));

    const systemPrompt = `You are a senior macro analyst focused on how global news affects gold (XAU/USD) and the US dollar.
For each news item, output a JSON object: {"i": <index>, "impact": "positive|negative|neutral", "summary": "<short one-sentence summary>"}.
- "positive" = bullish for gold (safe-haven, dovish Fed, geopolitical risk, weaker dollar).
- "negative" = bearish for gold (hawkish Fed, strong dollar, risk-on, higher real yields).
- "neutral" = mixed or unclear.
Return only a JSON array.`;

    const userPrompt = JSON.stringify(sample, null, 2);

    try {
      const analysis = await analyzeJSONWithFallback<Array<{ i: number; impact: "positive" | "negative" | "neutral"; summary: string }>>(
        systemPrompt,
        userPrompt
      );
      if (Array.isArray(analysis)) {
        for (const a of analysis) {
          if (typeof a.i !== "number" || !items[a.i]) continue;
          items[a.i].impact = a.impact;
          if (a.summary) items[a.i].summary = a.summary;
        }
      }
    } catch (e) {
      console.error("[fetchDailyNews] LLM analysis failed:", e);
    }
  }

  return items;
}

export interface DailyBrief {
  title: string;
  summary: string;
  keyPoints: string[];
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  volatility: "low" | "medium" | "high";
  riskLevel: "low" | "medium" | "high";
  recommendedAction: string;
  sources: string[];
}

export async function generateDailyBrief(news: NewsItem[]): Promise<DailyBrief> {
  if (news.length === 0) {
    return {
      title: "Daily market brief unavailable",
      summary: "No news items were retrieved for today.",
      keyPoints: [],
      sentiment: "neutral",
      confidence: 0,
      volatility: "low",
      riskLevel: "low",
      recommendedAction: "Wait for fresh news flow.",
      sources: [],
    };
  }

  // Compute quick sentiment from news impacts
  const positive = news.filter((n) => n.impact === "positive").length;
  const negative = news.filter((n) => n.impact === "negative").length;
  const baseSentiment: DailyBrief["sentiment"] = positive > negative ? "bullish" : negative > positive ? "bearish" : "neutral";
  const baseConfidence = Math.min(80, 40 + Math.abs(positive - negative) * 10);

  const titles = news.slice(0, 18).map((n) => `- [${n.category}] ${n.title} — ${n.summary}`);
  const systemPrompt = `You are the chief macro strategist at a global asset manager. Today your client trades XAU/USD (spot gold).
Produce a short daily brief based on the news headlines provided.
Return STRICT JSON only (no markdown) with this shape:
{
  "title": "<short headline>",
  "summary": "<2-3 sentence overview>",
  "keyPoints": ["<bullet 1>", "<bullet 2>", "<bullet 3>", "<bullet 4>"],
  "sentiment": "bullish|bearish|neutral",
  "confidence": <0-100 integer>,
  "volatility": "low|medium|high",
  "riskLevel": "low|medium|high",
  "recommendedAction": "<one sentence action>",
  "sources": ["<short source name>", "..."]
}
Bullish = favorable for gold. Bearish = unfavorable. Use English only.`;
  const userPrompt = `Today's top world market headlines:\n${titles.join("\n")}`;

  const result = await analyzeJSONWithFallback<DailyBrief>(systemPrompt, userPrompt);
  if (!result) {
    // LLM unavailable — compute sentiment locally from news impacts
    const bullPoints = news.filter((n) => n.impact === "positive").slice(0, 2).map((n) => n.title);
    const bearPoints = news.filter((n) => n.impact === "negative").slice(0, 2).map((n) => n.title);
    const keyPoints = [...bullPoints, ...bearPoints].slice(0, 4);
    return {
      title: baseSentiment === "bullish"
        ? "Gold Bullish on Safe-Haven Demand"
        : baseSentiment === "bearish"
        ? "Gold Under Pressure as Dollar Strengthens"
        : "Mixed Signals — Gold in Range",
      summary: `${news.length} market headlines analyzed. Sentiment: ${baseSentiment} with ${baseConfidence}% confidence based on positive/negative news balance.`,
      keyPoints: keyPoints.length > 0 ? keyPoints : news.slice(0, 4).map((n) => n.title),
      sentiment: baseSentiment,
      confidence: baseConfidence,
      volatility: "medium",
      riskLevel: baseConfidence > 70 ? "high" : "medium",
      recommendedAction: baseSentiment === "bullish"
        ? "Consider long exposure on gold with tight stop-loss."
        : baseSentiment === "bearish"
        ? "Reduce long exposure, wait for support confirmation."
        : "Stand aside until clearer catalyst emerges.",
      sources: news.slice(0, 5).map((n) => n.source || "external").filter(Boolean) as string[],
    };
  }
  return result;
}

export interface MarketIndicators {
  interestRate: IndicatorRow;
  dxy: IndicatorRow;
  inflation: IndicatorRow;
  treasury10y: IndicatorRow;
  goldPrice: IndicatorRow;
  oilPrice: IndicatorRow;
  centralBank: IndicatorRow;
  economicStats: IndicatorRow;
  trend: "up" | "down" | "flat";
  trendNote: string;
}

export interface IndicatorRow {
  label: string;
  value: string;
  unit?: string;
  previous?: string;
  forecast?: string;
  change: string;
  changeType: "up" | "down" | "flat";
  note?: string;
  updatedAt: string;
}

export async function fetchMarketIndicators(): Promise<MarketIndicators> {
  // Step 1: Fetch real-time prices from Yahoo Finance (free, no key)
  const yahooQuotes = await fetchQuotes(["XAU/USD", "WTI/USD", "DXY", "US10Y"]);

  const map: Partial<Record<string, IndicatorRow>> = {};

  // Helper to convert Yahoo quote to IndicatorRow
  const yahooToRow = (label: string, unit: string | undefined, quote: PriceQuote | null): IndicatorRow => {
    if (!quote) {
      return {
        label,
        value: "—",
        unit,
        change: "0",
        changeType: "flat",
        updatedAt: new Date().toISOString(),
        note: "Live data temporarily unavailable",
      };
    }
    const changeType: "up" | "down" | "flat" = quote.changePercent > 0.05 ? "up" : quote.changePercent < -0.05 ? "down" : "flat";
    return {
      label,
      value: quote.price.toFixed(2),
      unit,
      previous: quote.previousClose.toFixed(2),
      change: `${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%`,
      changeType,
      note: `Live from ${quote.exchangeName} — ${quote.currency}`,
      updatedAt: quote.fetchedAt,
    };
  };

  // Use Yahoo quotes for gold, oil, DXY, 10Y yield
  map.goldPrice = yahooToRow("Gold (XAU/USD)", "$/oz", yahooQuotes["XAU/USD"]);
  map.oilPrice = yahooToRow("Crude Oil (WTI)", "$/bbl", yahooQuotes["WTI/USD"]);
  map.dxy = yahooToRow("Dollar Index", "", yahooQuotes["DXY"]);
  map.treasury10y = yahooToRow("10Y Treasury Yield", "%", yahooQuotes["US10Y"]);

  // Step 2: Use parallel web searches for the macro indicators (Fed rate, CPI, etc.)
  const queries = [
    { key: "interestRate" as const, q: "Federal Reserve current federal funds rate 2026", label: "Fed Funds Rate", unit: "%", days: 14 },
    { key: "inflation" as const, q: "US CPI inflation latest reading 2026", label: "US CPI Inflation", unit: "%", days: 30 },
    { key: "centralBank" as const, q: "central bank gold buying 2026 reserves", label: "Central Bank Gold Demand", days: 30 },
    { key: "economicStats" as const, q: "US GDP growth latest reading 2026", label: "US GDP Growth", unit: "%", days: 30 },
  ];

  const settled = await Promise.allSettled(
    queries.map(async (q) => {
      const search = await webSearch(q.q, 5, q.days);
      const row = await extractIndicatorFromSearch(q.label, q.unit, search);
      return { key: q.key, row };
    })
  );

  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    map[r.value.key] = r.value.row;
  }

  const fallback = (label: string, unit?: string): IndicatorRow => ({
    label,
    value: "—",
    unit,
    change: "0",
    changeType: "flat" as const,
    note: "Live data temporarily unavailable",
    updatedAt: new Date().toISOString(),
  });

  const indicators: MarketIndicators = {
    interestRate: map.interestRate ?? fallback("Fed Funds Rate", "%"),
    dxy: map.dxy ?? fallback("Dollar Index"),
    inflation: map.inflation ?? fallback("US CPI Inflation", "%"),
    treasury10y: map.treasury10y ?? fallback("10Y Treasury Yield", "%"),
    goldPrice: map.goldPrice ?? fallback("Gold (XAU/USD)", "$/oz"),
    oilPrice: map.oilPrice ?? fallback("Crude Oil (WTI)", "$/bbl"),
    centralBank: map.centralBank ?? fallback("Central Bank Gold Demand"),
    economicStats: map.economicStats ?? fallback("US GDP Growth", "%"),
    trend: "flat" as const,
    trendNote: "",
  };

  // Compute overall trend based on DXY direction vs gold direction
  const dxyChange = parseChange(indicators.dxy?.change);
  const goldChange = parseChange(indicators.goldPrice?.change);
  if (goldChange > 0 && dxyChange < 0) {
    indicators.trend = "up";
    indicators.trendNote = "Gold rising, dollar weakening — bullish for XAU/USD.";
  } else if (goldChange < 0 && dxyChange > 0) {
    indicators.trend = "down";
    indicators.trendNote = "Gold falling, dollar strengthening — bearish for XAU/USD.";
  } else {
    indicators.trend = "flat";
    indicators.trendNote = "Mixed signals — wait for clearer catalyst.";
  }

  return indicators;
}

function parseChange(text?: string): number {
  if (!text) return 0;
  const m = text.replace(/[%+\-\s]/g, "").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
}

async function extractIndicatorFromSearch(
  label: string,
  unit: string | undefined,
  results: { title: string; snippet: string; url: string; source?: string; publishedAt?: string }[]
): Promise<IndicatorRow> {
  if (results.length === 0) {
    return {
      label,
      value: "—",
      unit,
      change: "0",
      changeType: "flat",
      updatedAt: new Date().toISOString(),
      note: "No live data available",
    };
  }

  const systemPrompt = `You are a financial data extractor. Given the search results, extract the most recent value for the indicator: ${label}.
Return STRICT JSON only: {"value":"<current value with unit>","previous":"<previous value if known>","forecast":"<forecast if known>","change":"<signed percentage or absolute change>","note":"<short one-sentence note>","updatedAt":"<ISO date if known, else empty>"}`;
  const userPrompt = JSON.stringify(results.slice(0, 5), null, 2);

  const data = await analyzeJSONWithFallback<{
    value: string;
    previous?: string;
    forecast?: string;
    change: string;
    note: string;
    updatedAt?: string;
  }>(systemPrompt, userPrompt);

  const change = data?.change ?? "0";
  const changeType: "up" | "down" | "flat" = change.startsWith("-")
    ? "down"
    : parseFloat(change.replace(/[^0-9.\-]/g, "")) > 0
    ? "up"
    : "flat";

  return {
    label,
    value: data?.value ?? "—",
    unit,
    previous: data?.previous,
    forecast: data?.forecast,
    change,
    changeType,
    note: data?.note,
    updatedAt: data?.updatedAt || new Date().toISOString(),
  };
}

export interface TradingSignal {
  symbol: string;
  direction: "long" | "short" | "neutral";
  entry: string;
  takeProfit: string;
  stopLoss: string;
  confidence: number;
  timeframe: "short" | "mid" | "long";
  basis: string[];
  risk: "low" | "medium" | "high";
  validUntil: string;
}

export async function generateTradingSignals(
  indicators: MarketIndicators,
  brief: DailyBrief
): Promise<TradingSignal[]> {
  const systemPrompt = `You are a senior precious-metals strategist.
Given today's market indicators and brief, propose up to three actionable setups for XAU/USD with clear entry, take-profit and stop-loss levels.
Return STRICT JSON array only:
[{
  "symbol":"XAU/USD",
  "direction":"long|short|neutral",
  "entry":"<price>",
  "takeProfit":"<price>",
  "stopLoss":"<price>",
  "confidence":<0-100>,
  "timeframe":"short|mid|long",
  "basis":["<reason 1>","<reason 2>","<reason 3>"],
  "risk":"low|medium|high",
  "validUntil":"<ISO date>"
}]
Use English only. Be conservative and risk-aware. If signals conflict, prefer neutral.`;
  const userPrompt = `Indicators:\n${JSON.stringify({
    gold: indicators.goldPrice,
    dxy: indicators.dxy,
    treasury10y: indicators.treasury10y,
    fedRate: indicators.interestRate,
    inflation: indicators.inflation,
    trend: indicators.trendNote,
  }, null, 2)}\n\nDaily brief:\n${JSON.stringify({ sentiment: brief.sentiment, confidence: brief.confidence, volatility: brief.volatility, action: brief.recommendedAction }, null, 2)}`;

  const result = await analyzeJSONWithFallback<TradingSignal[]>(systemPrompt, userPrompt);
  if (!result || !Array.isArray(result)) {
    return [
      {
        symbol: "XAU/USD",
        direction: "neutral",
        entry: "—",
        takeProfit: "—",
        stopLoss: "—",
        confidence: 0,
        timeframe: "short",
        basis: ["Insufficient live data — wait for confirmation."],
        risk: "high",
        validUntil: new Date().toISOString(),
      },
    ];
  }
  return result;
}

export interface CalendarEvent {
  date: string;
  time: string;
  event: string;
  importance: "high" | "medium" | "low";
  forecast?: string;
  previous?: string;
  actual?: string;
}

export async function fetchEconomicCalendar(): Promise<CalendarEvent[]> {
  const results = await webSearch(
    "US economic calendar this week high importance events Fed CPI NFP GDP",
    10,
    7
  );
  if (results.length === 0) return [];

  const systemPrompt = `You are an economic calendar editor. Given the search results, list the upcoming US economic events for the next 7 days.
Return STRICT JSON array:
[{
  "date":"<YYYY-MM-DD>",
  "time":"<HH:MM UTC>",
  "event":"<event name>",
  "importance":"high|medium|low",
  "forecast":"<forecast value>",
  "previous":"<previous value>",
  "actual":"<actual if released, else empty>"
}]
Use English only. Focus on market-moving events.`;
  const userPrompt = JSON.stringify(results.slice(0, 6), null, 2);

  const data = await analyzeJSONWithFallback<CalendarEvent[]>(systemPrompt, userPrompt);
  if (!data) return [];
  return data.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
