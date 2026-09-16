import type { LanguageId } from "@/lib/compiler/languages";

export type RemoteResult = {
  stdout: string;
  stderr: string;
  code: number;
  signal: string | null;
  compileFailed: boolean;
};

/** Sends a snippet to `/api/run` (sign-in required) and returns its output. */
export async function runOnServer(
  language: LanguageId,
  source: string,
  stdin: string,
  signal?: AbortSignal,
): Promise<RemoteResult> {
  const response = await fetch("/api/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ language, source, stdin }),
    signal,
  });

  const body = (await response.json().catch(() => ({}))) as Partial<RemoteResult> & {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(body.error ?? `The runner returned ${response.status}.`);
  }
  return {
    stdout: body.stdout ?? "",
    stderr: body.stderr ?? "",
    code: body.code ?? 0,
    signal: body.signal ?? null,
    compileFailed: Boolean(body.compileFailed),
  };
}
