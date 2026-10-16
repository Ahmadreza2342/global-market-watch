import ZAI from "z-ai-web-dev-sdk";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

export async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedAt?: string;
  source?: string;
}

export async function webSearch(
  query: string,
  num = 8,
  recencyDays = 3
): Promise<WebSearchResult[]> {
  try {
    const zai = await getZAI();
    const raw = (await zai.functions.invoke("web_search", {
      query,
      num,
      recency_days: recencyDays,
    })) as unknown;

    // The SDK can return results in a few shapes; normalize them.
    if (!raw) return [];

    if (Array.isArray(raw)) {
      return raw.map(normalizeResult).filter(Boolean) as WebSearchResult[];
    }

    if (typeof raw === "object" && raw !== null) {
      const r = raw as Record<string, unknown>;
      const arr =
        (r.results as unknown[]) ||
        (r.data as unknown[]) ||
        (r.items as unknown[]) ||
        (r.list as unknown[]);
      if (Array.isArray(arr)) {
        return arr.map(normalizeResult).filter(Boolean) as WebSearchResult[];
      }
    }

    return [];
  } catch (err) {
    console.error("[webSearch] error:", err);
    return [];
  }
}

function normalizeResult(item: unknown): WebSearchResult | null {
  if (!item || typeof item !== "object") return null;
  const r = item as Record<string, unknown>;
  const title = (r.title as string) || (r.name as string) || "";
  const url = (r.url as string) || (r.link as string) || (r.href as string) || "";
  const snippet = (r.snippet as string) || (r.description as string) || (r.content as string) || "";
  const publishedAt =
    (r.publishedAt as string) ||
    (r.date as string) ||
    (r.published_at as string) ||
    (r.time as string);
  const source = (r.source as string) || (r.publisher as string) || undefined;
  if (!title || !url) return null;
  return { title, url, snippet, publishedAt, source };
}

export interface LLMAnalysisResult {
  text: string;
  sentiment?: "bullish" | "bearish" | "neutral";
  confidence?: number;
  keyPoints?: string[];
  sources?: string[];
}

export async function analyzeText(
  systemPrompt: string,
  userPrompt: string,
  options: { temperature?: number; jsonMode?: boolean } = {}
): Promise<string> {
  try {
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      thinking: { type: "disabled" },
      temperature: options.temperature ?? 0.4,
    });
    return completion?.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    console.error("[analyzeText] error:", err);
    return "";
  }
}

export async function analyzeJSON<T = unknown>(
  systemPrompt: string,
  userPrompt: string
): Promise<T | null> {
  const text = await analyzeText(systemPrompt, userPrompt, { temperature: 0.2 });
  if (!text) return null;
  // Extract the first JSON object/array from the response
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}
