import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { env } from "@/lib/env.server";

/**
 * Compiles and runs a snippet in a language the browser cannot host — today
 * only Java — by proxying a public compiler service (Compiler Explorer).
 *
 * A proxy rather than a direct browser call so the upstream is configurable,
 * CORS is not in play, and the endpoint can be gated: sign-in is required and
 * each user gets a small per-minute budget, so this never becomes an open
 * code-execution service running on someone else's infrastructure.
 *
 * Nothing is stored. The snippet is forwarded, the output comes back.
 *
 * Point CODE_RUNNER_BASE_URL at a self-hosted Compiler Explorer to keep
 * snippets inside your own infrastructure.
 */

const BASE_URL = (env("CODE_RUNNER_BASE_URL") ?? "https://godbolt.org").replace(/\/+$/, "");
const JAVA_COMPILER = env("CODE_RUNNER_JAVA_COMPILER") ?? "java2501";

const MAX_SOURCE_CHARS = 50_000;
const MAX_STDIN_CHARS = 4_000;
const RUNS_PER_MINUTE = 20;
const UPSTREAM_TIMEOUT_MS = 30_000;

const SUPPORTED: Record<string, { compilerId: string; lang: string }> = {
  java: { compilerId: JAVA_COMPILER, lang: "java" },
};

/** Compiler Explorer returns text in chunks: [{ text: "line" }, …]. */
type TextLine = { text?: string };
const joinLines = (lines?: TextLine[]) =>
  (lines ?? [])
    .map((line) => line.text ?? "")
    .join("\n")
    .trim();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

/**
 * Best-effort per-user throttle. In memory, so it is per server instance and
 * resets on deploy — enough to stop an accidental loop, not a security control.
 */
const recentRuns = new Map<string, number[]>();

function overBudget(userId: string): boolean {
  const now = Date.now();
  const window = (recentRuns.get(userId) ?? []).filter((at) => now - at < 60_000);
  window.push(now);
  recentRuns.set(userId, window);
  if (recentRuns.size > 5_000) recentRuns.clear(); // crude bound on memory
  return window.length > RUNS_PER_MINUTE;
}

/**
 * The upstream compiles one file called `<source>`, so a top-level `public`
 * type fails with "should be declared in a file named …". Learners write
 * `public class Main` everywhere, so drop the modifier instead of rejecting it;
 * package-private changes nothing for a single-file program.
 */
function dropTopLevelPublic(source: string): string {
  return source.replace(
    /^public\s+(?=(?:final\s+|abstract\s+|sealed\s+)*(?:class|interface|enum|record)\b)/gm,
    "",
  );
}

export const Route = createFileRoute("/api/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
          return json({ error: "Sign in to run code." }, 401);
        }

        let payload: { language?: unknown; source?: unknown; stdin?: unknown };
        try {
          payload = (await request.json()) as typeof payload;
        } catch {
          return json({ error: "Expected a JSON body." }, 400);
        }

        const language = typeof payload.language === "string" ? payload.language : "";
        const source = typeof payload.source === "string" ? payload.source : "";
        const stdin = typeof payload.stdin === "string" ? payload.stdin : "";
        const target = SUPPORTED[language];

        if (!target) {
          return json({ error: `${language || "That language"} is not run on the server.` }, 400);
        }
        if (!source.trim()) {
          return json({ error: "There is no code to run." }, 400);
        }
        if (source.length > MAX_SOURCE_CHARS || stdin.length > MAX_STDIN_CHARS) {
          return json({ error: "That snippet is too large to run here." }, 413);
        }
        if (overBudget(session.user.id)) {
          return json(
            { error: `Rate limit: ${RUNS_PER_MINUTE} runs a minute. Try again shortly.` },
            429,
          );
        }

        try {
          const response = await fetch(`${BASE_URL}/api/compiler/${target.compilerId}/compile`, {
            method: "POST",
            headers: { "content-type": "application/json", accept: "application/json" },
            body: JSON.stringify({
              source: dropTopLevelPublic(source),
              lang: target.lang,
              allowStoreCodeDebug: false,
              options: {
                userArguments: "",
                executeParameters: { args: [], stdin },
                compilerOptions: { executorRequest: true, skipAsm: true },
                filters: { execute: true },
              },
            }),
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
          });

          if (response.status === 429) {
            return json(
              { error: "The compiler service is busy right now. Try again in a moment." },
              429,
            );
          }
          if (!response.ok) {
            return json({ error: `The compiler service returned ${response.status}.` }, 502);
          }

          const result = (await response.json()) as {
            code?: number;
            didExecute?: boolean;
            execTime?: number | string;
            stdout?: TextLine[];
            stderr?: TextLine[];
            buildResult?: { stdout?: TextLine[]; stderr?: TextLine[]; code?: number };
          };

          const buildErrors = joinLines(result.buildResult?.stderr);
          const compileFailed = result.didExecute === false;
          const programErrors = joinLines(result.stderr);

          return json({
            stdout: joinLines(result.stdout),
            stderr: [buildErrors, programErrors].filter(Boolean).join("\n"),
            code: result.code ?? 0,
            signal: null,
            compileFailed,
          });
        } catch (error) {
          const timedOut = error instanceof Error && error.name === "TimeoutError";
          return json(
            {
              error: timedOut
                ? "The compiler service took too long to answer."
                : "Could not reach the compiler service.",
            },
            502,
          );
        }
      },
    },
  },
});
