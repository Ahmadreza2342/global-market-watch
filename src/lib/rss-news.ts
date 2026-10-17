// Real-time news from RSS feeds (free, no API key needed)
// Sources: Investing.com, CNBC, MarketWatch, Reuters via Investing.com

export interface RssNewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  category: "fed" | "war" | "economy" | "crisis" | "politics";
}

const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const RSS_FEEDS: Array<{ url: string; source: string; category: RssNewsItem["category"] }> = [
  // Investing.com feeds
  { url: "https://www.investing.com/rss/news_25.rss", source: "Investing.com", category: "economy" },
  { url: "https://www.investing.com/rss/news_1.rss", source: "Investing.com", category: "politics" },
  { url: "https://www.investing.com/rss/news_10.rss", source: "Investing.com", category: "economy" },
  { url: "https://www.investing.com/rss/news_11.rss", source: "Investing.com", category: "economy" },
  { url: "https://www.investing.com/rss/news_14.rss", source: "Investing.com", category: "economy" },
  { url: "https://www.investing.com/rss/news_72.rss", source: "Investing.com", category: "economy" }, // Fed
  { url: "https://www.investing.com/rss/news_81.rss", source: "Investing.com", category: "politics" }, // Economic Indicators
  { url: "https://www.investing.com/rss/news_95.rss", source: "Investing.com", category: "economy" }, // Bonds
];

export async function fetchRssNews(maxItems = 20): Promise<RssNewsItem[]> {
  const settled = await Promise.allSettled(
    RSS_FEEDS.map(async ({ url, source, category }) => {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return [];
        const xml = await res.text();
        return parseRss(xml, source, category);
      } catch {
        return [];
      }
    })
  );

  const all: RssNewsItem[] = [];
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    all.push(...r.value);
  }

  // Deduplicate by title
  const seen = new Set<string>();
  const deduped: RssNewsItem[] = [];
  for (const item of all) {
    const key = item.title.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  // Sort by date (newest first)
  deduped.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return deduped.slice(0, maxItems);
}

function parseRss(xml: string, source: string, category: RssNewsItem["category"]): RssNewsItem[] {
  const items: RssNewsItem[] = [];

  // Extract items with regex (simple parser for RSS 2.0)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    // Extract CDATA-aware fields
    const title = extractField(block, "title");
    const link = extractField(block, "link");
    const description = extractField(block, "description");
    const pubDate = extractField(block, "pubDate");

    if (!title || !link) continue;

    // Skip empty/garbage titles
    if (title.length < 10) continue;

    items.push({
      title: stripHtml(title).trim(),
      link: link.trim(),
      description: stripHtml(description).slice(0, 280),
      pubDate: pubDate || new Date().toISOString(),
      source,
      category,
    });
  }

  return items;
}

function extractField(block: string, fieldName: string): string {
  // Try CDATA first
  const cdataRegex = new RegExp(`<${fieldName}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${fieldName}>`, "i");
  const cdataMatch = block.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1];

  // Try plain field
  const plainRegex = new RegExp(`<${fieldName}>([^<]*)</${fieldName}>`, "i");
  const plainMatch = block.match(plainRegex);
  if (plainMatch) return plainMatch[1];

  // Try self-closing link
  if (fieldName === "link") {
    const linkRegex = new RegExp(`<link[^>]*>([^<]*)</link>|<link[^>]*/>`, "i");
    const linkMatch = block.match(linkRegex);
    if (linkMatch) return linkMatch[1] || "";
  }

  return "";
}

function stripHtml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// Categorize news based on title keywords (used as a fallback when category isn't auto-detected)
export function categorizeNews(title: string): RssNewsItem["category"] {
  const t = title.toLowerCase();
  if (t.includes("fed") || t.includes("powell") || t.includes("interest rate") || t.includes("fomc")) {
    return "fed";
  }
  if (t.includes("war") || t.includes("military") || t.includes("geopolitical") || t.includes("conflict")) {
    return "war";
  }
  if (t.includes("inflation") || t.includes("cpi") || t.includes("gdp") || t.includes("jobs") || t.includes("unemployment")) {
    return "economy";
  }
  if (t.includes("crisis") || t.includes("sanction") || t.includes("tension")) {
    return "crisis";
  }
  return "politics";
}

// Simple sentiment analysis on title keywords (fallback when no LLM available)
export function quickSentiment(title: string, body: string): "positive" | "negative" | "neutral" {
  const text = (title + " " + body).toLowerCase();

  const positiveKeywords = [
    "rally", "surge", "soar", "boost", "bullish", "gain", "rise", "jump", "rises", "rallying",
    "all-time high", "record high", "outperform", "recovery", "boom", "strong", "hawkish pause",
    "safe haven", "haven demand", "geopolitical tension", "uncertainty", "weak dollar",
    "dovish", "rate cut", "stimulus", "support", "upside",
  ];

  const negativeKeywords = [
    "drop", "fall", "plunge", "crash", "bearish", "loss", "decline", "weak", "selloff",
    "fear", "panic", "risk-off", "hawkish", "rate hike", "tightening", "recession",
    "crisis", "default", "collapse", "warning", "slump", "tumble", "downward",
    "strong dollar", "risk on", "yields rise", "rates higher",
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const k of positiveKeywords) {
    if (text.includes(k)) positiveCount++;
  }
  for (const k of negativeKeywords) {
    if (text.includes(k)) negativeCount++;
  }

  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}
