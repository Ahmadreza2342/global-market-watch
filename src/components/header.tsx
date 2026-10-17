"use client";

import { useApp } from "@/components/app-provider";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Languages, Globe, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { InstallButton } from "@/components/install-button";

interface HeaderProps {
  active: string;
  onNavigate: (key: string) => void;
}

export function Header({ active, onNavigate }: HeaderProps) {
  const { t, lang, setLang, theme, toggleTheme } = useApp();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<{ email: string; name: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user || null));
  }, [authOpen]);

  const navItems = [
    { key: "dashboard", label: t.nav.dashboard },
    { key: "chat", label: t.nav.chat, icon: "🪙" },
    { key: "signals", label: t.nav.signals },
    { key: "performance", label: t.nav.performance },
    { key: "multiTf", label: t.nav.multiTf },
    { key: "traders", label: t.nav.traders },
    { key: "news", label: t.nav.news },
    { key: "indicators", label: t.nav.indicators },
    { key: "calendar", label: t.nav.calendar },
  ];

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand */}
          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-lg">
              <Activity className="h-5 w-5" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-sm font-bold tracking-tight">{t.brand}</span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">{t.tagline}</span>
            </div>
          </button>

          {/* Nav items - hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.key}
                variant={active === item.key ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onNavigate(item.key)}
                className="text-xs lg:text-sm gap-1"
              >
                {"icon" in item && item.icon && <span>{item.icon}</span>}
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLang(lang === "fa" ? "en" : "fa")}
              aria-label="Toggle language"
              title={lang === "fa" ? "Switch to English" : "تغییر به فارسی"}
            >
              <Languages className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === "dark" ? "Light mode" : "حالت تاریک"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline text-xs text-muted-foreground">
                  {user.name || user.email}
                </span>
                <form
                  action="/api/auth/logout"
                  method="post"
                >
                  <input type="hidden" name="redirect" value="/" />
                  <Button type="submit" variant="outline" size="sm" className="text-xs">
                    {t.auth.logout}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => openAuth("login")}>
                  {t.auth.login}
                </Button>
                <Button size="sm" onClick={() => openAuth("register")}>
                  {t.auth.register}
                </Button>
              </div>
            )}
            <InstallButton />
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto">
          {navItems.map((item) => (
            <Button
              key={item.key}
              variant={active === item.key ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onNavigate(item.key)}
              className="text-xs whitespace-nowrap gap-1"
            >
              {"icon" in item && item.icon && <span>{item.icon}</span>}
              {item.label}
            </Button>
          ))}
          {!user && (
            <Button
              variant="default"
              size="sm"
              onClick={() => openAuth("login")}
              className="text-xs whitespace-nowrap"
            >
              {t.auth.login}
            </Button>
          )}
        </nav>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} mode={authMode} onModeChange={setAuthMode} />
    </header>
  );
}
