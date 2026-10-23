import { useState, useEffect, useRef } from "react";
import { Moon, Sun, SunMedium, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

const STORAGE_KEY = "lml:brightness";
const DEFAULT_BRIGHTNESS = 100;

export function DisplayControl({ className }: { className?: string }) {
  const { theme, setTheme, toggle, ready } = useTheme();
  const [brightness, setBrightness] = useState<number>(DEFAULT_BRIGHTNESS);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Restore saved brightness on load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 60 && parsed <= 140) {
          setBrightness(parsed);
          document.documentElement.style.setProperty("--app-brightness", String(parsed / 100));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const updateBrightness = (val: number) => {
    const clamped = Math.max(60, Math.min(140, val));
    setBrightness(clamped);
    document.documentElement.style.setProperty("--app-brightness", String(clamped / 100));
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {
      // ignore
    }
  };

  const resetBrightness = () => {
    updateBrightness(DEFAULT_BRIGHTNESS);
  };

  const currentThemeLabel = ready && theme === "light" ? "Light" : "Dark";

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Single Unified Toggle in Header */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Display Settings (${currentThemeLabel} · ${brightness}%)`}
        title={`Display & Brightness (${currentThemeLabel} · ${brightness}%)`}
        className={className}
      >
        {ready && theme === "light" ? (
          <Sun className="size-4 text-amber-500 transition-transform duration-200 hover:rotate-12" />
        ) : (
          <Moon className="size-4 text-indigo-400 transition-transform duration-200 hover:-rotate-12" />
        )}
      </Button>

      {/* Popover Menu with Switch and Brightness */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-border/80 bg-surface/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-fade-in space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-accent" />
              <span className="text-xs font-semibold text-fg">Display & Appearance</span>
            </div>
            {brightness !== DEFAULT_BRIGHTNESS && (
              <button
                onClick={resetBrightness}
                title="Reset brightness to 100%"
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted hover:text-fg hover:bg-raised transition-colors"
              >
                <RotateCcw className="size-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Theme Switch Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Theme Switch
              </span>
              {/* Interactive Slide Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={theme === "dark"}
                onClick={toggle}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none border border-border/80 ${
                  theme === "dark" ? "bg-accent/80" : "bg-border-strong"
                }`}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                <span
                  className={`pointer-events-none flex size-4.5 items-center justify-center rounded-full bg-surface shadow-md ring-0 transition duration-200 ease-in-out ${
                    theme === "dark" ? "translate-x-5 text-indigo-400" : "translate-x-0 text-amber-500"
                  }`}
                >
                  {theme === "dark" ? <Moon className="size-2.5" /> : <Sun className="size-2.5" />}
                </span>
              </button>
            </div>

            {/* Segmented Mode Selector */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-inset/70 border border-border/50">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                  theme === "dark"
                    ? "bg-accent text-accent-fg font-semibold shadow-sm ring-1 ring-accent/40"
                    : "text-muted hover:text-fg hover:bg-raised/60"
                }`}
              >
                <Moon className="size-3.5" />
                <span>Dark Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                  theme === "light"
                    ? "bg-accent text-accent-fg font-semibold shadow-sm ring-1 ring-accent/40"
                    : "text-muted hover:text-fg hover:bg-raised/60"
                }`}
              >
                <Sun className="size-3.5" />
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          {/* Brightness Adjustment Section */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <SunMedium className="size-3.5 text-accent" />
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Brightness
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-accent">{brightness}%</span>
            </div>

            {/* Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min={60}
                max={140}
                step={5}
                value={brightness}
                onChange={(e) => updateBrightness(parseInt(e.target.value, 10))}
                className="w-full accent-accent cursor-pointer h-1.5 rounded-lg bg-inset appearance-none"
              />
              <div className="flex justify-between text-[10px] text-muted font-mono">
                <span>Dim (60%)</span>
                <span>100%</span>
                <span>Bright (140%)</span>
              </div>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[
                { label: "Dim", val: 75 },
                { label: "Normal", val: 100 },
                { label: "Bright", val: 125 },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => updateBrightness(preset.val)}
                  className={`rounded-lg px-2 py-1 text-xs font-medium transition-all ${
                    brightness === preset.val
                      ? "bg-accent text-accent-fg font-semibold shadow-sm ring-1 ring-accent/40"
                      : "border border-border/60 bg-surface/60 text-muted hover:text-fg hover:bg-raised"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
