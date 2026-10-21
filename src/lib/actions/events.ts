'use server';

import { getCurrentAuth } from '@/lib/auth/session';
import { createCoupleDal } from '@/lib/dal';
import { createEventSchema, updateEventSchema } from '@/lib/validations';
import { broadcastToCouple } from '@/lib/realtime/bus';
import { revalidatePath } from 'next/cache';

export async function createEventAction(formData: unknown) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = createEventSchema.safeParse(formData);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Invalid event data';
    return { success: false, error: errorMsg };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const newEvent = await dal.events.create({
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      startAt: parsed.data.startAt,
      endAt: parsed.data.endAt || undefined,
      isAllDay: parsed.data.isAllDay,
      location: parsed.data.location || undefined,
      color: parsed.data.color,
    });

    const eventWithCreator = {
      ...newEvent,
      creatorName: auth.user.displayName,
    };

    // Realtime broadcast to partner
    broadcastToCouple(auth.couple.coupleId, {
      type: 'calendar:event_created',
      payload: eventWithCreator,
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true, data: eventWithCreator };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create event' };
  }
}

export async function updateEventAction(formData: unknown) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = updateEventSchema.safeParse(formData);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Invalid event update data';
    return { success: false, error: errorMsg };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const { id, ...data } = parsed.data;
    const updated = await dal.events.update(id, data);

    const updatedWithCreator = {
      ...updated,
      creatorName: auth.user.displayName,
    };

    // Realtime broadcast to partner
    broadcastToCouple(auth.couple.coupleId, {
      type: 'calendar:event_updated',
      payload: updatedWithCreator,
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true, data: updatedWithCreator };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update event' };
  }
}

export async function deleteEventAction(id: string) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!id) return { success: false, error: 'Event ID required' };

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    await dal.events.delete(id);

    // Realtime broadcast to partner
    broadcastToCouple(auth.couple.coupleId, {
      type: 'calendar:event_deleted',
      payload: { id },
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete event' };
  }
}
