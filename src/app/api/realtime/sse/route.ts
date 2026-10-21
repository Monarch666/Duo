import { NextRequest } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/session';
import { getEventBus, CoupleRealtimeEvent } from '@/lib/realtime/bus';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await getCurrentAuth();

  if (!auth || !auth.couple) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const coupleId = auth.couple.coupleId;
  const bus = getEventBus();
  const encoder = new TextEncoder();

  let keepAliveTimer: NodeJS.Timeout;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Initial connection payload
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ coupleId, status: 'ok' })}\n\n`)
      );

      // 2. Realtime listener for this couple space
      const eventHandler = (event: CoupleRealtimeEvent) => {
        try {
          const chunk = `event: message\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Stream might be closed
        }
      };

      bus.on(`couple:${coupleId}`, eventHandler);

      // 3. Heartbeat keepalive every 15 seconds to prevent browser/proxy timeouts
      keepAliveTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));
        } catch {
          clearInterval(keepAliveTimer);
        }
      }, 15000);

      // 4. Cleanup when client disconnects
      req.signal.addEventListener('abort', () => {
        clearInterval(keepAliveTimer);
        bus.off(`couple:${coupleId}`, eventHandler);
      });
    },

    cancel() {
      clearInterval(keepAliveTimer);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
