'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CoupleRealtimeEvent } from './bus';

export type RealtimeStatus = 'connected' | 'connecting' | 'fallback_polling' | 'disconnected';

interface UseCoupleRealtimeOptions {
  enabled?: boolean;
  onEvent: (event: CoupleRealtimeEvent) => void;
}

export function useCoupleRealtime({ enabled = true, onEvent }: UseCoupleRealtimeOptions) {
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());
  const errorCountRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTimeRef = useRef(lastSyncTime);

  lastSyncTimeRef.current = lastSyncTime;

  const handleEvent = useCallback(
    (event: CoupleRealtimeEvent) => {
      setLastSyncTime(event.timestamp);
      onEvent(event);
    },
    [onEvent]
  );

  useEffect(() => {
    if (!enabled) {
      setStatus('disconnected');
      return;
    }

    let isMounted = true;

    // Start 5s Polling Fallback
    const startPollingFallback = () => {
      if (pollingTimerRef.current) return;
      if (!isMounted) return;

      setStatus('fallback_polling');

      const poll = async () => {
        try {
          const res = await fetch(
            `/api/realtime/poll?since=${encodeURIComponent(lastSyncTimeRef.current)}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.events && Array.isArray(data.events)) {
              for (const evt of data.events) {
                handleEvent(evt);
              }
            }
            if (data.timestamp) {
              setLastSyncTime(data.timestamp);
            }
          }
        } catch {
          // ignore network hiccups
        }
      };

      pollingTimerRef.current = setInterval(poll, 5000);
      poll(); // initial check
    };

    // Stop Polling Fallback
    const stopPollingFallback = () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };

    // Connect via SSE
    const connectSSE = () => {
      try {
        const es = new EventSource('/api/realtime/sse');
        eventSourceRef.current = es;

        es.onopen = () => {
          if (!isMounted) return;
          setStatus('connected');
          errorCountRef.current = 0;
          stopPollingFallback();
        };

        es.onmessage = (e) => {
          if (!isMounted) return;
          try {
            const parsed: CoupleRealtimeEvent = JSON.parse(e.data);
            handleEvent(parsed);
          } catch {
            // non-json or ping
          }
        };

        es.addEventListener('ping', () => {
          // Heartbeat received
        });

        es.onerror = () => {
          if (!isMounted) return;
          errorCountRef.current++;
          es.close();
          eventSourceRef.current = null;

          if (errorCountRef.current >= 2) {
            // Switch to 5-second polling fallback
            startPollingFallback();
          } else {
            // Retry SSE after 3 seconds
            setTimeout(() => {
              if (isMounted) connectSSE();
            }, 3000);
          }
        };
      } catch {
        startPollingFallback();
      }
    };

    connectSSE();

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      stopPollingFallback();
    };
  }, [enabled, handleEvent]);

  return { status, lastSyncTime };
}
