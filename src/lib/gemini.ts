// Google Gemini API client (free tier: 15 req/min, 1500 req/day)
// Get your free API key at: https://aistudio.google.com/app/apikey
// Set as GEMINI_API_KEY env var on Vercel

const GEMINI_MODEL = "gemini-flash-lite-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  options: { temperature?: number; maxOutputTokens?: number } = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set");
  }

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      maxOutputTokens: options.maxOutputTokens ?? 1024,
      topP: 0.95,
    },
  };

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || "";
}

export async function callGeminiJSON<T = unknown>(
  systemPrompt: string,
  userPrompt: string
): Promise<T | null> {
  try {
    const text = await callGemini(systemPrompt, userPrompt, { temperature: 0.2, maxOutputTokens: 2048 });
    if (!text) return null;
    // Find JSON in response
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    try {
      return JSON.parse(jsonMatch[0]) as T;
    } catch {
      // Try to clean up common issues
      const cleaned = jsonMatch[0]
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      try {
        return JSON.parse(cleaned) as T;
      } catch {
        return null;
      }
    }
  } catch (err) {
    console.error("[callGeminiJSON] error:", err);
    return null;
  }
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
