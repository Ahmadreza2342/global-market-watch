"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AppProvider, useApp } from "@/components/app-provider";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Footer } from "@/components/footer";
import { DailyBriefCard } from "@/components/daily-brief-card";
import { NewsPanel } from "@/components/news-panel";
import { IndicatorsPanel } from "@/components/indicators-panel";
import { SignalsPanel } from "@/components/signals-panel";
import { CalendarPanel } from "@/components/calendar-panel";
import { SentimentGauge } from "@/components/sentiment-gauge";
import { MiniChartCard } from "@/components/mini-chart-card";
import { DailyBrief, MarketIndicators, NewsItem, TradingSignal, CalendarEvent } from "@/lib/market";

type ViewKey = "dashboard" | "news" | "indicators" | "signals" | "calendar";

interface BriefResponse {
  brief: DailyBrief;
  news: NewsItem[];
  generatedAt: string;
  cached: boolean;
}

interface IndicatorsResponse {
  indicators: MarketIndicators;
  generatedAt: string;
  cached: boolean;
}

interface SignalsResponse {
  signals: TradingSignal[];
  generatedAt: string;
  cached: boolean;
}

interface CalendarResponse {
  events: CalendarEvent[];
  generatedAt: string;
  cached: boolean;
}

function Dashboard() {
  const { t, lang } = useApp();
  const [view, setView] = useState<ViewKey>("dashboard");

  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [indicators, setIndicators] = useState<MarketIndicators | null>(null);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [briefLoading, setBriefLoading] = useState(false);
  const [indLoading, setIndLoading] = useState(false);
  const [sigLoading, setSigLoading] = useState(false);
  const [calLoading, setCalLoading] = useState(false);

  const [briefMeta, setBriefMeta] = useState<{ cached?: boolean; generatedAt?: string }>({});
  const [indMeta, setIndMeta] = useState<{ cached?: boolean; generatedAt?: string }>({});
  const [sigMeta, setSigMeta] = useState<{ cached?: boolean; generatedAt?: string }>({});
  const [calMeta, setCalMeta] = useState<{ cached?: boolean; generatedAt?: string }>({});

  const sectionRef = useRef<HTMLDivElement>(null);

  const fetchBrief = useCallback(async (force = false) => {
    setBriefLoading(true);
    try {
      const r = await fetch(`/api/daily-brief${force ? "?force=1" : ""}`);
      const d: BriefResponse = await r.json();
      setBrief(d.brief);
      setNews(d.news);
      setBriefMeta({ cached: d.cached, generatedAt: d.generatedAt });
    } catch (e) {
      console.error("fetchBrief", e);
    } finally {
      setBriefLoading(false);
    }
  }, []);

  const fetchIndicators = useCallback(async (force = false) => {
    setIndLoading(true);
    try {
      const r = await fetch(`/api/indicators${force ? "?force=1" : ""}`);
      const d: IndicatorsResponse = await r.json();
      setIndicators(d.indicators);
      setIndMeta({ cached: d.cached, generatedAt: d.generatedAt });
    } catch (e) {
      console.error("fetchIndicators", e);
    } finally {
      setIndLoading(false);
    }
  }, []);

  const fetchSignals = useCallback(async (force = false) => {
    setSigLoading(true);
    try {
      const r = await fetch(`/api/signals${force ? "?force=1" : ""}`);
      const d: SignalsResponse = await r.json();
      setSignals(d.signals);
      setSigMeta({ cached: d.cached, generatedAt: d.generatedAt });
    } catch (e) {
      console.error("fetchSignals", e);
    } finally {
      setSigLoading(false);
    }
  }, []);

  const fetchCalendar = useCallback(async (force = false) => {
    setCalLoading(true);
    try {
      const r = await fetch(`/api/calendar${force ? "?force=1" : ""}`);
      const d: CalendarResponse = await r.json();
      setEvents(d.events);
      setCalMeta({ cached: d.cached, generatedAt: d.generatedAt });
    } catch (e) {
      console.error("fetchCalendar", e);
    } finally {
      setCalLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrief();
    fetchIndicators();
    fetchCalendar();
    // Signals depend on brief + indicators, give them a head start
    const t = setTimeout(() => fetchSignals(), 1500);
    return () => clearTimeout(t);
  }, [fetchBrief, fetchIndicators, fetchCalendar, fetchSignals]);

  const scrollToContent = () => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header active={view} onNavigate={(k) => setView(k as ViewKey)} />

      {view === "dashboard" && (
        <>
          <Hero onStart={scrollToContent} />
          <main ref={sectionRef} className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
            {/* Top row: daily brief + sentiment gauge */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <DailyBriefCard
                  brief={brief}
                  loading={briefLoading}
                  cached={briefMeta.cached}
                  generatedAt={briefMeta.generatedAt}
                  onRefresh={() => fetchBrief(true)}
                />
              </div>
              <SentimentGauge
                sentiment={brief?.sentiment ?? "neutral"}
                confidence={brief?.confidence ?? 0}
                volatility={brief?.volatility}
              />
            </div>

            {/* Indicators panel */}
            <IndicatorsPanel
              data={indicators}
              loading={indLoading}
              cached={indMeta.cached}
              generatedAt={indMeta.generatedAt}
              onRefresh={() => fetchIndicators(true)}
            />

            {/* Mini charts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <MiniChartCard
                title={t.indicators.goldPrice}
                description={t.indicators.goldPriceDesc}
                data={[]}
                unit="$"
                color="#f59e0b"
              />
              <MiniChartCard
                title={t.indicators.dxy}
                description={t.indicators.dxyDesc}
                data={[]}
                color="#10b981"
              />
              <MiniChartCard
                title={t.indicators.treasury10y}
                description={t.indicators.treasury10yDesc}
                data={[]}
                unit="%"
                color="#8b5cf6"
              />
            </div>

            {/* Signals + Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SignalsPanel
                signals={signals}
                loading={sigLoading}
                cached={sigMeta.cached}
                generatedAt={sigMeta.generatedAt}
                onRefresh={() => fetchSignals(true)}
              />
              <CalendarPanel
                events={events}
                loading={calLoading}
                cached={calMeta.cached}
                generatedAt={calMeta.generatedAt}
                onRefresh={() => fetchCalendar(true)}
              />
            </div>

            {/* News */}
            <NewsPanel
              news={news}
              loading={briefLoading}
              cached={briefMeta.cached}
              generatedAt={briefMeta.generatedAt}
              onRefresh={() => fetchBrief(true)}
            />
          </main>
        </>
      )}

      {view === "news" && (
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <NewsPanel
            news={news}
            loading={briefLoading}
            cached={briefMeta.cached}
            generatedAt={briefMeta.generatedAt}
            onRefresh={() => fetchBrief(true)}
          />
        </main>
      )}

      {view === "indicators" && (
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
          <IndicatorsPanel
            data={indicators}
            loading={indLoading}
            cached={indMeta.cached}
            generatedAt={indMeta.generatedAt}
            onRefresh={() => fetchIndicators(true)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MiniChartCard
              title={t.indicators.goldPrice}
              description={t.indicators.goldPriceDesc}
              data={[]}
              unit="$"
              color="#f59e0b"
            />
            <MiniChartCard
              title={t.indicators.dxy}
              description={t.indicators.dxyDesc}
              data={[]}
              color="#10b981"
            />
            <MiniChartCard
              title={t.indicators.treasury10y}
              description={t.indicators.treasury10yDesc}
              data={[]}
              unit="%"
              color="#8b5cf6"
            />
          </div>
        </main>
      )}

      {view === "signals" && (
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <SignalsPanel
            signals={signals}
            loading={sigLoading}
            cached={sigMeta.cached}
            generatedAt={sigMeta.generatedAt}
            onRefresh={() => fetchSignals(true)}
          />
        </main>
      )}

      {view === "calendar" && (
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <CalendarPanel
            events={events}
            loading={calLoading}
            cached={calMeta.cached}
            generatedAt={calMeta.generatedAt}
            onRefresh={() => fetchCalendar(true)}
          />
        </main>
      )}

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}
