import { useState, useEffect, useRef } from "react";
import { SunMedium, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "lml:brightness";
const DEFAULT_BRIGHTNESS = 100;

export function BrightnessControl({ className }: { className?: string }) {
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

  return (
    <div className="relative inline-block" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Adjust brightness"
        title={`Adjust Brightness (${brightness}%)`}
        className={className}
      >
        <SunMedium className="size-4 text-muted hover:text-fg transition-colors" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-border/80 bg-surface/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-fade-in space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2">
              <SunMedium className="size-4 text-accent" />
              <span className="text-xs font-semibold text-fg">Screen Brightness</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="font-bold text-accent">{brightness}%</span>
              {brightness !== DEFAULT_BRIGHTNESS && (
                <button
                  onClick={resetBrightness}
                  title="Reset to 100%"
                  className="rounded p-1 text-muted hover:text-fg hover:bg-raised transition-colors"
                >
                  <RotateCcw className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="space-y-1.5">
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

          {/* Quick Presets */}
          <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-border/50">
            {[
              { label: "Dim", val: 75 },
              { label: "Normal", val: 100 },
              { label: "Bright", val: 125 },
            ].map((preset) => (
              <button
                key={preset.val}
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
      )}
    </div>
  );
}
