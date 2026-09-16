import { Link } from "@tanstack/react-router";
import { Play, RotateCcw, Square, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CodeEditor } from "@/components/compiler/CodeEditor";
import { Button } from "@/components/ui/button";
import { LANGUAGES, SQL_SEED, type LanguageId } from "@/lib/compiler/languages";
import { runOnServer } from "@/lib/compiler/remote";
import { resetRuntime, runInSandbox, type RunEvent } from "@/lib/compiler/sandbox";
import { cn } from "@/lib/utils";

type OutputChunk =
  | { kind: "stdout" | "stderr"; text: string }
  | { kind: "table"; title?: string; columns: string[]; rows: string[][] };

const STORAGE_KEY = "letmelearn-compiler-sources";

const starters = () =>
  Object.fromEntries(LANGUAGES.map((language) => [language.id, language.starter])) as Record<
    LanguageId,
    string
  >;

export function CompilerWorkbench() {
  const [languageId, setLanguageId] = useState<LanguageId>("java");
  const [sources, setSources] = useState<Record<LanguageId, string>>(starters);
  const [chunks, setChunks] = useState<OutputChunk[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [stdin, setStdin] = useState("");
  const stopRef = useRef<(() => void) | null>(null);

  const language = LANGUAGES.find((item) => item.id === languageId) ?? LANGUAGES[0];
  const source = sources[languageId];

  // Restore drafts after mount so the server and first client render agree.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<Record<LanguageId, string>>;
      setSources((current) => {
        const next = { ...current };
        for (const item of LANGUAGES) {
          const draft = parsed[item.id];
          if (typeof draft === "string" && draft.trim()) next[item.id] = draft;
        }
        return next;
      });
    } catch {
      /* unreadable storage — keep the starters */
    }
  }, []);

  const update = useCallback((id: LanguageId, next: string) => {
    setSources((current) => {
      const updated = { ...current, [id]: next };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        /* storage full or blocked — drafts just won't persist */
      }
      return updated;
    });
  }, []);

  const append = useCallback((chunk: OutputChunk) => {
    setChunks((current) => {
      const last = current[current.length - 1];
      // Merge consecutive text of the same stream so output reads as one block.
      if (last && chunk.kind !== "table" && last.kind === chunk.kind) {
        return [...current.slice(0, -1), { kind: chunk.kind, text: last.text + chunk.text }];
      }
      return [...current, chunk];
    });
  }, []);

  const run = useCallback(async () => {
    if (running) return;
    setChunks([]);
    setElapsed(null);
    setStatus(null);
    setRunning(true);
    const startedAt = performance.now();

    if (language.runtime === "browser") {
      const handle = runInSandbox(
        {
          language: language.id,
          source: sources[language.id],
          seed: language.id === "sql" ? SQL_SEED : undefined,
        },
        (event: RunEvent) => {
          if (event.type === "status") setStatus(event.text);
          else if (event.type === "stdout") append({ kind: "stdout", text: event.text });
          else if (event.type === "stderr") append({ kind: "stderr", text: event.text });
          else if (event.type === "table")
            append({ kind: "table", title: event.title, columns: event.columns, rows: event.rows });
        },
      );
      stopRef.current = handle.stop;
      await handle.finished;
    } else {
      const controller = new AbortController();
      stopRef.current = () => controller.abort();
      setStatus("Compiling and running on the runner service…");
      try {
        const result = await runOnServer(
          language.id,
          sources[language.id],
          stdin,
          controller.signal,
        );
        if (result.stdout) append({ kind: "stdout", text: result.stdout });
        if (result.stderr) append({ kind: "stderr", text: result.stderr });
        if (!result.stdout && !result.stderr) {
          append({ kind: "stdout", text: "(no output)\n" });
        }
        if (result.code !== 0) {
          append({
            kind: "stderr",
            text: `\nExited with code ${result.code}${result.compileFailed ? " — compilation failed" : ""}.\n`,
          });
        }
      } catch (error) {
        const aborted = error instanceof DOMException && error.name === "AbortError";
        append({
          kind: "stderr",
          text: aborted ? "Stopped.\n" : `${(error as Error).message}\n`,
        });
      }
    }

    stopRef.current = null;
    setStatus(null);
    setElapsed(Math.round(performance.now() - startedAt));
    setRunning(false);
  }, [append, language, running, sources, stdin]);

  const stop = () => {
    stopRef.current?.();
    stopRef.current = null;
  };

  const resetCode = () => update(languageId, language.starter);

  const clearRuntime = () => {
    resetRuntime(languageId);
    setChunks([]);
    setStatus(null);
    setElapsed(null);
  };

  return (
    <div className="px-5 pb-16 sm:px-8 lg:px-12">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Language">
        {LANGUAGES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === languageId}
            onClick={() => {
              setLanguageId(item.id);
              setChunks([]);
              setStatus(null);
              setElapsed(null);
            }}
            className={cn(
              "inline-flex h-9 items-center rounded-md border px-3.5 text-[13px] transition-colors duration-150",
              item.id === languageId
                ? "border-fg bg-fg text-bg"
                : "border-border text-muted hover:text-fg",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="mt-3 max-w-3xl text-[13px] leading-6 text-muted">
        {language.note}
        {language.reading ? (
          <>
            {" "}
            <Link to={language.reading.path} className="text-accent hover:underline">
              {language.reading.label} →
            </Link>
          </>
        ) : null}
      </p>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section aria-label="Editor">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Button onClick={run} disabled={running} size="sm">
              <Play className="size-3.5" />
              {running ? "Running…" : "Run"}
            </Button>
            {running ? (
              <Button variant="secondary" size="sm" onClick={stop}>
                <Square className="size-3.5" />
                Stop
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={resetCode} disabled={running}>
              <RotateCcw className="size-3.5" />
              Reset code
            </Button>
            {language.runtime === "browser" ? (
              <Button variant="ghost" size="sm" onClick={clearRuntime} disabled={running}>
                <Trash2 className="size-3.5" />
                Reset runtime
              </Button>
            ) : null}
            <span className="ml-auto font-mono text-[11px] text-faint">⌘/Ctrl + Enter</span>
          </div>

          <CodeEditor
            value={source}
            onChange={(next) => update(languageId, next)}
            onRun={run}
            label={`${language.label} editor`}
          />

          {language.runtime === "server" ? (
            <label className="mt-3 block text-xs text-muted">
              Standard input (optional)
              <textarea
                value={stdin}
                onChange={(event) => setStdin(event.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border border-border bg-inset px-3 py-2 font-mono text-[12.5px] text-fg outline-none focus:border-accent"
              />
            </label>
          ) : null}

          {language.id === "sql" ? (
            <details className="mt-3 rounded-lg border border-border bg-surface px-4 py-3">
              <summary className="cursor-pointer text-[13px] text-muted">
                Seed data — recreated before every run
              </summary>
              <pre className="mt-3 overflow-x-auto font-mono text-[11.5px] leading-5 text-faint">
                {SQL_SEED}
              </pre>
            </details>
          ) : null}
        </section>

        <section aria-label="Output" className="min-w-0">
          <div className="mb-2 flex h-9 items-center justify-between">
            <span className="text-[13px] text-muted">Output</span>
            {elapsed !== null ? (
              <span className="font-mono text-[11px] text-faint">{elapsed} ms</span>
            ) : null}
          </div>
          <div className="min-h-[22rem] rounded-lg border border-border bg-inset p-4">
            {status ? (
              <p className="mb-3 flex items-center gap-2 text-[12.5px] text-accent">
                <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                {status}
              </p>
            ) : null}
            {chunks.length === 0 && !status ? (
              <p className="text-[13px] text-faint">
                Nothing yet — press Run.{" "}
                {language.runtime === "browser"
                  ? "The first Python or SQL run downloads its runtime."
                  : "Java compiles on the runner service, which takes a second or two."}
              </p>
            ) : null}
            {chunks.map((chunk, index) =>
              chunk.kind === "table" ? (
                <ResultTable key={index} chunk={chunk} />
              ) : (
                <pre
                  key={index}
                  className={cn(
                    "whitespace-pre-wrap break-words font-mono text-[12.5px] leading-6",
                    chunk.kind === "stderr" ? "text-bad" : "text-fg",
                  )}
                >
                  {chunk.text}
                </pre>
              ),
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ResultTable({
  chunk,
}: {
  chunk: { kind: "table"; title?: string; columns: string[]; rows: string[][] };
}) {
  return (
    <div className="mb-4 last:mb-0">
      {chunk.title ? <div className="mb-1 text-[11px] text-faint">{chunk.title}</div> : null}
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-[12.5px]">
          <thead className="bg-raised text-[11px] uppercase tracking-wider text-faint">
            <tr>
              {chunk.columns.map((column) => (
                <th key={column} className="whitespace-nowrap px-3 py-2 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chunk.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-border">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="whitespace-nowrap px-3 py-2 font-mono text-muted">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-1 font-mono text-[11px] text-faint">{chunk.rows.length} row(s)</div>
    </div>
  );
}
