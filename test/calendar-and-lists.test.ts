import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { createCoupleDal } from '@/lib/dal';
import { createCoupleSpace, joinCoupleSpace } from '@/lib/auth/pairing';
import { hashPassword } from '@/lib/auth/password';
import { broadcastToCouple, getRecentEventsSince, getEventBus } from '@/lib/realtime/bus';
import crypto from 'crypto';

describe('Phase 2: Calendar, Lists, and Realtime Engine Suite', () => {
  let user1Id: string;
  let user2Id: string;
  let coupleId: string;
  let dalUser1: ReturnType<typeof createCoupleDal>;
  let dalUser2: ReturnType<typeof createCoupleDal>;

  beforeAll(async () => {
    user1Id = crypto.randomUUID();
    user2Id = crypto.randomUUID();
    const passHash = await hashPassword('Secret123!');

    await db.insert(schema.users)
      .values([
        { id: user1Id, email: `phase2_u1_${Date.now()}@test.com`, passwordHash: passHash, displayName: 'Emma' },
        { id: user2Id, email: `phase2_u2_${Date.now()}@test.com`, passwordHash: passHash, displayName: 'Liam' },
      ]);

    const created = await createCoupleSpace(user1Id);
    coupleId = created.coupleId!;
    await joinCoupleSpace(user2Id, created.inviteCode!);

    dalUser1 = createCoupleDal({ userId: user1Id, coupleId });
    dalUser2 = createCoupleDal({ userId: user2Id, coupleId });
  });

  describe('Shared Calendar Operations', () => {
    let createdEventId: string;

    it('creates a calendar event with category, start time, and color', async () => {
      const evt = await dalUser1.events.create({
        title: 'Sunset Beach Picnic',
        category: 'date_night',
        startAt: '2026-07-20T18:30:00Z',
        endAt: '2026-07-20T21:00:00Z',
        location: 'Sunset Beach Cove',
        description: 'Bring strawberries and sparkling cider.',
        color: '#EA4C53',
      });

      expect(evt).toBeDefined();
      expect(evt.title).toBe('Sunset Beach Picnic');
      expect(evt.category).toBe('date_night');
      expect(evt.createdByUserId).toBe(user1Id);
      createdEventId = evt.id;
    });

    it('retrieves events filtered by category and month', async () => {
      const allEvents = await dalUser2.events.getAll();
      expect(allEvents.length).toBeGreaterThanOrEqual(1);

      const dateNights = await dalUser2.events.getAll({ category: 'date_night' });
      expect(dateNights.some((e) => e.id === createdEventId)).toBe(true);

      const trips = await dalUser2.events.getAll({ category: 'trip' });
      expect(trips.some((e) => e.id === createdEventId)).toBe(false);

      const monthEvents = await dalUser2.events.getAll({ month: '2026-07' });
      expect(monthEvents.some((e) => e.id === createdEventId)).toBe(true);
    });

    it('updates an existing event', async () => {
      const updated = await dalUser2.events.update(createdEventId, {
        title: 'Sunset Beach Picnic (Moved to 7pm)',
        startAt: '2026-07-20T19:00:00Z',
      });

      expect(updated.title).toBe('Sunset Beach Picnic (Moved to 7pm)');
    });

    it('deletes an event', async () => {
      await dalUser1.events.delete(createdEventId);
      const fetched = await dalUser2.events.getById(createdEventId);
      expect(fetched).toBeNull();
    });
  });

  describe('Shared Lists & Checkable Items Operations', () => {
    let createdListId: string;
    let itemId1: string;

    it('creates a categorized list', async () => {
      const list = await dalUser1.lists.create({
        title: 'Road Trip Snacks',
        category: 'groceries',
        icon: 'ShoppingBag',
      });

      expect(list).toBeDefined();
      expect(list.title).toBe('Road Trip Snacks');
      expect(list.category).toBe('groceries');
      createdListId = list.id;
    });

    it('adds checkable items to the list', async () => {
      const item1 = await dalUser2.listItems.addItem(createdListId, 'Sea salt caramel popcorn');
      const item2 = await dalUser1.listItems.addItem(createdListId, 'Cold brew cans');

      expect(item1.content).toBe('Sea salt caramel popcorn');
      expect(item1.isCompleted).toBe(false);
      itemId1 = item1.id;

      const listDetails = await dalUser1.lists.getById(createdListId);
      expect(listDetails?.items.length).toBe(2);
    });

    it('toggles completion status and tracks who completed it', async () => {
      const toggled = await dalUser2.listItems.toggleItem(itemId1, true);
      expect(toggled.isCompleted).toBe(true);
      expect(toggled.completedByUserId).toBe(user2Id);
      expect(toggled.completedAt).not.toBeNull();

      // Untoggle
      const untoggled = await dalUser1.listItems.toggleItem(itemId1, false);
      expect(untoggled.isCompleted).toBe(false);
      expect(untoggled.completedByUserId).toBeNull();
    });

    it('deletes list items and whole lists', async () => {
      await dalUser1.listItems.deleteItem(itemId1);
      const listAfterItemDelete = await dalUser2.lists.getById(createdListId);
      expect(listAfterItemDelete?.items.some((i) => i.id === itemId1)).toBe(false);

      await dalUser2.lists.delete(createdListId);
      const listAfterDelete = await dalUser1.lists.getById(createdListId);
      expect(listAfterDelete).toBeNull();
    });
  });

  describe('Realtime Event Bus & Polling Engine', () => {
    it('emits events to SSE listeners and caches them for 5s polling fallback', async () => {
      const bus = getEventBus();
      let listenerReceived = false;

      const testHandler = (data: any) => {
        if (data.payload?.testKey === 'realtime_verified') {
          listenerReceived = true;
        }
      };

      bus.on(`couple:${coupleId}`, testHandler);

      const beforeTimestamp = new Date(Date.now() - 1000).toISOString();

      // Broadcast an event
      broadcastToCouple(coupleId, {
        type: 'list:item_added',
        payload: { testKey: 'realtime_verified', content: 'Strawberries' },
        actorUserId: user1Id,
      });

      expect(listenerReceived).toBe(true);
      bus.off(`couple:${coupleId}`, testHandler);

      // Verify polling engine captures event
      const recentEvents = getRecentEventsSince(coupleId, beforeTimestamp);
      expect(recentEvents.length).toBeGreaterThanOrEqual(1);
      expect(recentEvents.some((e) => e.payload?.testKey === 'realtime_verified')).toBe(true);
    });
  });
});
