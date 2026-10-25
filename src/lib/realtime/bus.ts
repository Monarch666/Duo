import EventEmitter from 'events';

export interface CoupleRealtimeEvent {
  type:
    | 'calendar:event_created'
    | 'calendar:event_updated'
    | 'calendar:event_deleted'
    | 'list:created'
    | 'list:deleted'
    | 'list:item_added'
    | 'list:item_toggled'
    | 'list:item_deleted'
    | 'checkin:submitted'
    | 'checkin:revealed'
    | 'memory:created'
    | 'preference:updated'
    | 'love_note:created'
    | 'love_note:tapped'
    | 'love_note:reply_added'
    | 'love_note:deleted'
    | 'daily_prompt:created'
    | 'daily_prompt:answered'
    | 'partner_mood:updated'
    | 'cycle:updated'
    | 'cycle:comfort_signal'
    | 'cycle:deleted';
  payload: any;
  actorUserId?: string;
  timestamp: string;
}

// Global EventEmitter singleton to persist across Next.js reloads
declare global {
  // eslint-disable-next-line no-var
  var __duoEventBus: EventEmitter | undefined;
  // eslint-disable-next-line no-var
  var __duoRecentEvents: Map<string, CoupleRealtimeEvent[]> | undefined;
}

export function getEventBus(): EventEmitter {
  if (!global.__duoEventBus) {
    global.__duoEventBus = new EventEmitter();
    global.__duoEventBus.setMaxListeners(100);
  }
  return global.__duoEventBus;
}

export function getRecentEventsStore(): Map<string, CoupleRealtimeEvent[]> {
  if (!global.__duoRecentEvents) {
    global.__duoRecentEvents = new Map();
  }
  return global.__duoRecentEvents;
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseServerClient: SupabaseClient | null = null;
function getSupabaseRealtimeServer(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseKey) return null;
  if (!supabaseServerClient) {
    supabaseServerClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }
  return supabaseServerClient;
}

/**
 * Broadcast an event to all connected partners in a couple space.
 * 1. Emits to active SSE stream listeners
 * 2. Caches the event in memory for the 5-second polling fallback
 * 3. Broadcasts through Supabase Realtime Channels for distributed/multi-region scale
 */
export function broadcastToCouple(
  coupleId: string,
  event: Omit<CoupleRealtimeEvent, 'timestamp'>
) {
  const fullEvent: CoupleRealtimeEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // 1. Emit to active SSE stream listeners
  const bus = getEventBus();
  bus.emit(`couple:${coupleId}`, fullEvent);

  // 2. Cache in recent events (kept for 60 seconds) for polling fallback
  const store = getRecentEventsStore();
  const current = store.get(coupleId) || [];
  current.push(fullEvent);

  // Keep last 50 events max
  if (current.length > 50) {
    current.shift();
  }
  store.set(coupleId, current);

  // 3. Broadcast to Supabase Realtime Channel (distributed multi-region edge)
  const supabase = getSupabaseRealtimeServer();
  if (supabase) {
    try {
      const channel = supabase.channel(`couple:${coupleId}`);
      channel
        .send({
          type: 'broadcast',
          event: fullEvent.type,
          payload: fullEvent,
        })
        .catch((err) => {
          console.warn('[Supabase Realtime Broadcast]', err?.message || err);
        });
    } catch (err: any) {
      console.warn('[Supabase Realtime Channel]', err?.message || err);
    }
  }
}

/**
 * AGENTS.md canonical alias for broadcastToCouple
 */
export const publishCoupleEvent = broadcastToCouple;

/**
 * Get recent events for a couple space since a given ISO timestamp (for 5s polling fallback).
 */
export function getRecentEventsSince(
  coupleId: string,
  sinceTimestamp?: string
): CoupleRealtimeEvent[] {
  const store = getRecentEventsStore();
  const events = store.get(coupleId) || [];

  if (!sinceTimestamp) return events.slice(-10);

  const sinceTime = new Date(sinceTimestamp).getTime();
  return events.filter((e) => new Date(e.timestamp).getTime() > sinceTime);
}
