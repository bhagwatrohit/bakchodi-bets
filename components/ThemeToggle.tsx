"use client";

import { useCallback, useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Mode = "dark" | "light" | "system";
const NEXT: Record<Mode, Mode> = { dark: "light", light: "system", system: "dark" };

function prefersLight() {
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

function applyMode(mode: Mode) {
  const light = mode === "light" || (mode === "system" && prefersLight());
  document.documentElement.classList.toggle("light", light);
}

/** Cycles dark → light → system; persists to localStorage. */
export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    const stored = (localStorage.getItem("bb-theme") as Mode | null) ?? "system";
    setMode(stored);
  }, []);

  // When following the system, re-apply on OS light/dark changes.
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => applyMode("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const cycle = useCallback(() => {
    setMode((cur) => {
      const next = NEXT[cur];
      try {
        localStorage.setItem("bb-theme", next);
      } catch {
        /* ignore */
      }
      applyMode(next);
      return next;
    });
  }, []);

  const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
  const label = `Theme: ${mode} — click to change`;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className ?? ""}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
