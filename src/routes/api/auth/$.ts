import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

/**
 * Mounts Better Auth at `/api/auth/*` — the session endpoint the client polls
 * and the landing point for the broker's OAuth callback. Without it,
 * `/api/auth/get-session` 404s and every session stays pending forever.
 */
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => auth.handler(request),
    },
  },
});
