import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function MarkDone({ id }: { id: string }) {
  const done = useProgress((s) => Boolean(s.done[id]));
  const toggle = useProgress((s) => s.toggle);
  return (
    <Button
      variant={done ? "secondary" : "outline"}
      size="sm"
      onClick={() => toggle(id)}
      className={cn(done && "text-ok")}
    >
      <Check className="size-3.5" />
      {done ? "Studied" : "Mark studied"}
    </Button>
  );
}
