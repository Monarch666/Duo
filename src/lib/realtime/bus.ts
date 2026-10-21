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
    | 'partner_mood:updated';
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

/**
 * Broadcast an event to all connected partners in a couple space.
 * Also caches the event in memory for the 5-second polling fallback!
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
}

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
