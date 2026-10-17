"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Loader2, RotateCcw } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { aurumIntro } from "@/lib/aurum";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "gmw_chat_history";

const SAMPLE_QUESTIONS = [
  { fa: "الان طلا رو بخرم یا صبر کنم؟", en: "Should I buy gold now or wait?" },
  { fa: "چرا طلا امروز بالا رفت؟", en: "Why did gold go up today?" },
  { fa: "تأثیر نشست فدرال روی طلا چیه؟", en: "What's the impact of the Fed meeting on gold?" },
  { fa: "بهترین نقطه ورود برای طلا چقدره؟", en: "What's the best entry for gold right now?" },
];

export function ChatPanel() {
  const { t, lang } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Intro message if empty
  useEffect(() => {
    if (messages.length === 0) {
      const intro = aurumIntro(lang);
      setMessages([{ role: "assistant", content: intro }]);
    }
  }, [lang, messages.length]);

  // Persist chat history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    } catch {
      // ignore
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/chat?lang=${lang}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      const reply = data.response || "Sorry, I couldn't respond.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      toast.error("Failed to send message");
      setMessages([...newMessages, {
        role: "assistant",
        content: lang === "fa" ? "متأسفم، الان نمی‌تونم پاسخ بدم. دوباره امتحان کن." : "Sorry, I can't respond right now.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([{ role: "assistant", content: aurumIntro(lang) }]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const aurumName = lang === "fa" ? "آروم" : "Aurum";

  return (
    <Card className="relative overflow-hidden flex flex-col" style={{ minHeight: "500px" }}>
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-rose-500/5 pointer-events-none" />
      <CardHeader className="relative border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-rose-600 text-white text-xl">
              🪙
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-1.5">
                {aurumName}
                <span className="text-xs text-muted-foreground font-normal">
                  {lang === "fa" ? "استراتژیست طلا" : "Gold Strategist"}
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                {lang === "fa" ? "هوش مصنوعی با داده‌های زنده بازار" : "AI powered by live market data"}
              </CardDescription>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={clearChat} className="h-7 text-xs">
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative flex-1 flex flex-col p-0">
        {/* Chat messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scroll p-3 space-y-3 max-h-[400px]">
          {messages.map((m, i) => (
            <ChatBubble key={i} message={m} aurumName={aurumName} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{aurumName} {lang === "fa" ? "در حال فکر کردن..." : "is thinking..."}</span>
            </div>
          )}
        </div>

        {/* Sample questions (only when chat is short) */}
        {messages.length <= 2 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            {SAMPLE_QUESTIONS.map((q, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => sendMessage(lang === "fa" ? q.fa : q.en)}
                className="text-[11px] h-7"
                disabled={loading}
              >
                {lang === "fa" ? q.fa : q.en}
              </Button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-border p-2 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lang === "fa" ? "سوالت رو بپرس از آروم..." : "Ask Aurum anything..."}
            disabled={loading}
            className="text-sm"
            dir={lang === "fa" ? "rtl" : "ltr"}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ChatBubble({ message, aurumName }: { message: ChatMessage; aurumName: string }) {
  const isUser = message.role === "user";
  const { lang } = useApp();

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-sm mr-2 mt-1">
          🪙
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
          isUser
            ? "bg-gradient-to-br from-amber-500 to-rose-600 text-white"
            : "bg-muted/40 text-foreground"
        }`}
        dir={lang === "fa" && !isUser ? "rtl" : "ltr"}
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {message.content}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs ml-2 mt-1">
          🙂
        </div>
      )}
    </div>
  );
}
