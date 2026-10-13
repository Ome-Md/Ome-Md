import { Client } from "pg";
import type { NextRequest } from "next/server";
import { scopedStudents } from "./queries";
import type { Profile } from "./types";

type Change = { organizationId: string; studentId: string | null };
type Hub = {
  client: Client;
  listeners: Set<(change: Change) => void>;
  ready: Promise<void>;
};
const root = globalThis as unknown as { academyEventHub?: Hub };
function hub(): Hub {
  if (root.academyEventHub) return root.academyEventHub;
  const client = new Client({ connectionString: process.env.DATABASE_URL }),
    listeners = new Set<(change: Change) => void>();
  const ready = client.connect().then(async () => {
    await client.query("LISTEN academy_changes");
  });
  client.on("notification", (notification) => {
    try {
      const change = JSON.parse(notification.payload ?? "{}") as Change;
      for (const listener of listeners) listener(change);
    } catch {}
  });
  client.on("error", () => {
    root.academyEventHub = undefined;
  });
  root.academyEventHub = { client, listeners, ready };
  return root.academyEventHub;
}
export async function eventStream(user: Profile, request: NextRequest) {
  const connection = hub();
  await connection.ready;
  const scope = new Set(await scopedStudents(user)),
    encoder = new TextEncoder();
  let stop = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (value: string) => {
        if (!closed)
          try {
            controller.enqueue(encoder.encode(value));
          } catch {
            stop();
          }
      };
      const listener = (change: Change) => {
        if (
          change.organizationId === user.organization_id &&
          (!change.studentId || scope.has(change.studentId))
        )
          send('data: {"refresh":true}\n\n');
      };
      const heartbeat = setInterval(() => send(": keepalive\n\n"), 15000);
      stop = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        connection.listeners.delete(listener);
        request.signal.removeEventListener("abort", stop);
        try {
          controller.close();
        } catch {}
      };
      connection.listeners.add(listener);
      request.signal.addEventListener("abort", stop);
      send("retry: 1500\n\n");
    },
    cancel() {
      stop();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "private, no-store",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
