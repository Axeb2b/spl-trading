import type { NextRequest } from "next/server";
import { pruneEvents, readEvents } from "@/lib/realtime/events";
import { getLocalUser } from "@/lib/api-auth";
import { IST_TIME_ZONE } from "@/lib/time/ist";
import { pruneSessions } from "@/lib/sessions";

/**
 * Server-Sent Events — one multiplexed stream per client carries every
 * realtime surface (deposits, withdrawals, notifications, onboarding,
 * overview, admin queue).
 *
 * Transport contract:
 *   Content-Type: text/event-stream
 *   Cache-Control: no-cache, no-transform
 *   X-Accel-Buffering: no
 *
 * The client resumes with `Last-Event-ID` after a reconnect, so no event is
 * missed across a flaky mobile connection.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POLL_INTERVAL_MS = 1000;
const HEARTBEAT_INTERVAL_MS = 25_000;
const MAX_STREAM_MS = 55_000; // recycle the isolate before the Worker CPU budget bites
const PRUNE_INTERVAL_MS = 60_000;

/**
 * Housekeeping without a cron trigger.
 *
 * The deployed worker has no custom entry point, so a `scheduled` handler
 * would mean changing the deploy pipeline. Pruning once per minute per
 * isolate is enough: the tables are indexed and the deletes are bounded.
 */
let lastPruneAt = 0;

function sse(event: string, data: unknown, id?: number): string {
  const lines: string[] = [];
  if (id !== undefined) lines.push(`id: ${id}`);
  lines.push(`event: ${event}`);
  lines.push(`data: ${JSON.stringify(data)}`);
  return `${lines.join("\n")}\n\n`;
}

export async function GET(request: NextRequest) {
  const user = await getLocalUser(request);
  if (!user) {
    return new Response("Authentication required.", { status: 401 });
  }

  const lastEventId = Number(request.headers.get("last-event-id") ?? "0") || 0;
  const encoder = new TextEncoder();
  let closed = false;
  let cursor = lastEventId;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      const now = Date.now();
      if (now - lastPruneAt > PRUNE_INTERVAL_MS) {
        lastPruneAt = now;
        const cutoff = new Date(now - 24 * 60 * 60 * 1000).toISOString();
        void pruneEvents(cutoff).catch(() => undefined);
        void pruneSessions().catch(() => undefined);
      }

      push("retry: 3000\n\n");
      push(
        sse("hello", {
          serverNow: new Date().toISOString(),
          tz: IST_TIME_ZONE,
          userId: user.id,
        }),
      );

      let lastHeartbeat = Date.now();
      const startedAt = Date.now();

      const tick = async () => {
        if (closed) return;
        try {
          const events = await readEvents(user.id, cursor, 20);
          for (const event of events) {
            cursor = event.id;
            const payload =
              typeof event.payload === "object" && event.payload !== null
                ? (event.payload as Record<string, unknown>)
                : {};
            push(
              sse(
                event.type,
                { ...payload, id: event.id, at: event.createdAt },
                event.id,
              ),
            );
          }
          if (Date.now() - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
            lastHeartbeat = Date.now();
            push(sse("heartbeat", { serverNow: new Date().toISOString() }));
          }
        } catch {
          // A transient database error must not kill the stream; the next tick
          // retries and the client keeps its last payload.
        }
        if (Date.now() - startedAt > MAX_STREAM_MS) {
          closed = true;
          try {
            controller.close();
          } catch {
            /* already closed */
          }
          return;
        }
        setTimeout(() => void tick(), POLL_INTERVAL_MS);
      };

      const interval = setInterval(() => {
        if (closed) clearInterval(interval);
      }, 1000);

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });

      void tick();
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
