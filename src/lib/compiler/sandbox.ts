import runnerSource from "@/lib/compiler/runner.js?raw";
import type { LanguageId } from "@/lib/compiler/languages";

/**
 * Runs a snippet inside an iframe with `sandbox="allow-scripts"` and no
 * `allow-same-origin`, which gives the code an opaque origin: no cookies, no
 * localStorage, no reading this app's API as the signed-in user. Stopping a
 * runaway program means deleting the iframe, which takes its runtime with it.
 */

export type RunEvent =
  | { type: "ready" }
  | { type: "status"; text: string }
  | { type: "stdout"; text: string }
  | { type: "stderr"; text: string }
  | { type: "table"; title?: string; columns: string[]; rows: string[][] }
  | { type: "done"; ms: number };

export type BrowserJob = {
  language: LanguageId;
  source: string;
  /** SQL only: schema and rows applied before the query. */
  seed?: string;
};

const CDN = {
  // Pinned: Pyodide's wheels must match the runtime exactly.
  pyodideIndex: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
  typescript: "https://cdn.jsdelivr.net/npm/typescript@5/lib/typescript.js",
  sqlJs: "https://cdn.jsdelivr.net/npm/sql.js@1/dist/",
};

/** Silence for this long means the program is hung or waiting on nothing. */
const IDLE_TIMEOUT_MS = 30_000;
/** No run may last longer than this, however chatty it is. */
const HARD_TIMEOUT_MS = 180_000;

type Frame = { element: HTMLIFrameElement; ready: Promise<void> };

/** One frame per language: the Python runtime costs seconds to start, so it is reused. */
const frames = new Map<LanguageId, Frame>();

function createFrame(language: LanguageId): Frame {
  const element = document.createElement("iframe");
  element.setAttribute("sandbox", "allow-scripts");
  element.setAttribute("aria-hidden", "true");
  element.setAttribute("title", `code runner (${language})`);
  element.style.display = "none";
  // The runner is INLINED rather than fetched: a sandboxed frame has an opaque
  // origin, and the Vite dev server refuses requests whose Origin is null, so a
  // <script src> to our own origin fails locally. Inlining also means the frame
  // needs no network access to start.
  element.srcdoc =
    '<!doctype html><meta charset="utf-8"><script>' + runnerSource + "</" + "script>";

  const ready = new Promise<void>((resolve) => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== element.contentWindow) return;
      const data = event.data as { channel?: string; type?: string } | undefined;
      if (data?.channel === "letmelearn-runner" && data.type === "ready") {
        window.removeEventListener("message", onMessage);
        resolve();
      }
    };
    window.addEventListener("message", onMessage);
  });

  document.body.appendChild(element);
  return { element, ready };
}

function getFrame(language: LanguageId): Frame {
  const existing = frames.get(language);
  if (existing?.element.isConnected) return existing;
  const frame = createFrame(language);
  frames.set(language, frame);
  return frame;
}

/** Drop a language's runtime — the Reset button, and how a run is stopped. */
export function resetRuntime(language: LanguageId): void {
  const frame = frames.get(language);
  frame?.element.remove();
  frames.delete(language);
}

export function resetAllRuntimes(): void {
  for (const language of [...frames.keys()]) resetRuntime(language);
}

/**
 * Starts a run and streams events. Resolves when the program finishes, is
 * stopped, or times out; call the returned `stop` to abandon it.
 */
export function runInSandbox(
  job: BrowserJob,
  onEvent: (event: RunEvent) => void,
): { stop: () => void; finished: Promise<void> } {
  let settled = false;
  const timers: { idle?: number; hard?: number } = {};
  let finish: () => void = () => {};
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });

  const frame = getFrame(job.language);

  const cleanup = () => {
    window.removeEventListener("message", onMessage);
    window.clearTimeout(timers.idle);
    window.clearTimeout(timers.hard);
  };

  const settle = () => {
    if (settled) return;
    settled = true;
    cleanup();
    finish();
  };

  const stop = (reason?: string) => {
    if (settled) return;
    if (reason) onEvent({ type: "stderr", text: reason });
    // Removing the frame is the only reliable way to stop a busy loop.
    resetRuntime(job.language);
    onEvent({ type: "done", ms: 0 });
    settle();
  };

  const touchIdleTimer = () => {
    window.clearTimeout(timers.idle);
    timers.idle = window.setTimeout(
      () => stop(`No output for ${IDLE_TIMEOUT_MS / 1000}s — stopped. An endless loop?\n`),
      IDLE_TIMEOUT_MS,
    );
  };

  function onMessage(event: MessageEvent) {
    if (event.source !== frame.element.contentWindow) return;
    const data = event.data as (RunEvent & { channel?: string }) | undefined;
    if (!data || data.channel !== "letmelearn-runner") return;
    if (data.type === "ready") return;
    touchIdleTimer();
    onEvent(data);
    if (data.type === "done") settle();
  }

  window.addEventListener("message", onMessage);
  touchIdleTimer();
  timers.hard = window.setTimeout(
    () => stop(`Stopped after ${HARD_TIMEOUT_MS / 1000}s.\n`),
    HARD_TIMEOUT_MS,
  );

  void frame.ready.then(() => {
    if (settled) return;
    frame.element.contentWindow?.postMessage(
      { channel: "letmelearn-compiler", cdn: CDN, ...job },
      "*",
    );
  });

  return { stop: () => stop(), finished };
}
