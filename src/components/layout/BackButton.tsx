import { useCanGoBack, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function parentPath(pathname: string) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/") return "/";
  const idx = clean.lastIndexOf("/");
  return idx <= 0 ? "/" : clean.slice(0, idx);
}

export function BackButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const atHome = pathname === "/";
  const nowhere = atHome && !canGoBack;

  const onBack = () => {
    if (nowhere) return;
    if (canGoBack) {
      router.history.back();
      return;
    }
    router.history.push(parentPath(pathname));
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon" : "sm"}
      onClick={onBack}
      aria-label="Go back"
      aria-disabled={nowhere}
      tabIndex={nowhere ? -1 : 0}
      className={cn(
        "text-fg",
        compact ? "size-10" : "h-10 px-2.5",
        nowhere && "pointer-events-none opacity-50",
      )}
    >
      <ArrowLeft className="size-4" />
      {compact ? <span className="sr-only">Back</span> : <span>Back</span>}
    </Button>
  );
}
