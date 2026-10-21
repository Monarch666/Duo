'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CoupleRealtimeEvent } from './bus';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeStatus = 'connected' | 'connecting' | 'fallback_polling' | 'disconnected';

interface UseCoupleRealtimeOptions {
  coupleId?: string;
  enabled?: boolean;
  onEvent: (event: CoupleRealtimeEvent) => void;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let clientSupabase: SupabaseClient | null = null;
function getClientSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!clientSupabase) {
    clientSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
  }
  return clientSupabase;
}

export function useCoupleRealtime({
  coupleId,
  enabled = true,
  onEvent,
}: UseCoupleRealtimeOptions) {
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());
  const errorCountRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const supabaseChannelRef = useRef<RealtimeChannel | null>(null);
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

    // Connect via SSE (Secondary / local dev fallback)
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

    // 1. Try Supabase Realtime Channels first (for distributed multi-region scale)
    const supabase = getClientSupabase();
    if (supabase && coupleId) {
      try {
        const channel = supabase.channel(`couple:${coupleId}`);
        supabaseChannelRef.current = channel;

        channel
          .on('broadcast', { event: '*' }, (message: any) => {
            if (!isMounted) return;
            if (message?.payload) {
              handleEvent(message.payload as CoupleRealtimeEvent);
            }
          })
          .subscribe((subStatus) => {
            if (!isMounted) return;
            if (subStatus === 'SUBSCRIBED') {
              setStatus('connected');
              stopPollingFallback();
            } else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
              console.warn('[Realtime] Supabase Channel error, falling back to SSE:', subStatus);
              connectSSE();
            }
          });
      } catch (err) {
        console.warn('[Realtime] Failed to initialize Supabase channel, falling back to SSE:', err);
        connectSSE();
      }
    } else {
      // Direct SSE connection
      connectSSE();
    }

    return () => {
      isMounted = false;
      if (supabaseChannelRef.current) {
        supabaseChannelRef.current.unsubscribe();
        supabaseChannelRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      stopPollingFallback();
    };
  }, [enabled, coupleId, handleEvent]);

  return { status, lastSyncTime };
}
