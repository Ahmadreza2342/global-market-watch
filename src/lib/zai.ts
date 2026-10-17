import ZAI from "z-ai-web-dev-sdk";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

// Ensure .z-ai-config file exists. On Vercel serverless, env vars are used
// because /etc/.z-ai-config is read-only. We write to /tmp/.z-ai-config
// (writable on Vercel) using env vars if provided.
function ensureConfigFile(): void {
  const configPaths = [
    join(process.cwd(), ".z-ai-config"),
    join(process.env.HOME || "/tmp", ".z-ai-config"),
    "/etc/.z-ai-config",
  ];

  // If any existing path has the file, use it as-is
  for (const p of configPaths) {
    try {
      if (existsSync(p)) return;
    } catch {
      // ignore
    }
  }

  // Otherwise, build the config from env vars and write to /tmp
  const baseUrl = process.env.Z_AI_BASE_URL;
  const apiKey = process.env.Z_AI_API_KEY;
  const chatId = process.env.Z_AI_CHAT_ID;
  const token = process.env.Z_AI_TOKEN;
  const userId = process.env.Z_AI_USER_ID;

  if (!baseUrl || !apiKey || !token) return; // no env vars, let SDK fail

  try {
    const tmpDir = "/tmp";
    try {
      mkdirSync(tmpDir, { recursive: true });
    } catch {
      // ignore
    }
    const tmpConfig = join(tmpDir, ".z-ai-config");
    const config = {
      baseUrl,
      apiKey,
      chatId,
      token,
      userId,
    };
    writeFileSync(tmpConfig, JSON.stringify(config), { encoding: "utf-8" });
    // Override HOME so the SDK finds /tmp/.z-ai-config
    process.env.HOME = tmpDir;
  } catch (err) {
    console.error("[zai] Failed to write config from env vars:", err);
  }
}

export async function getZAI() {
  if (!zaiInstance) {
    ensureConfigFile();
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
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}
