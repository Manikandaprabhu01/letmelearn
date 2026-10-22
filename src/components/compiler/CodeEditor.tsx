import { useRef, type KeyboardEvent, type UIEvent } from "react";

/**
 * A plain textarea with a line-number gutter — no editor library, so the page
 * stays small and the keyboard behaviour is predictable. Tab indents, and
 * Cmd/Ctrl+Enter runs.
 */
export function CodeEditor({
  value,
  onChange,
  onRun,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  onRun: () => void;
  label: string;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const lineCount = Math.max(value.split("\n").length, 12);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      onRun();
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const field = event.currentTarget;
      const { selectionStart, selectionEnd } = field;
      const next = value.slice(0, selectionStart) + "  " + value.slice(selectionEnd);
      onChange(next);
      requestAnimationFrame(() => {
        field.selectionStart = field.selectionEnd = selectionStart + 2;
      });
    }
  };

  const onScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    if (gutter.current) gutter.current.scrollTop = event.currentTarget.scrollTop;
  };

  return (
    <div className="flex overflow-hidden rounded-lg border border-border bg-inset focus-within:border-accent">
      <div
        ref={gutter}
        aria-hidden
        className="max-h-[60vh] min-h-[22rem] shrink-0 select-none overflow-hidden border-r border-border bg-raised/50 px-2 py-3 text-right font-mono text-[12.5px] leading-6 text-faint"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={textarea}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        onScroll={onScroll}
        aria-label={label}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className="max-h-[60vh] min-h-[22rem] w-full resize-y bg-transparent px-3 py-3 font-mono text-[12.5px] leading-6 text-fg outline-none placeholder:text-faint"
      />
    </div>
  );
}
