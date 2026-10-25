'use server';

import { getCurrentAuth } from '@/lib/auth/session';
import { createCoupleDal } from '@/lib/dal';
import { logCycleSchema } from '@/lib/validations';
import { broadcastToCouple } from '@/lib/realtime/bus';
import { revalidatePath } from 'next/cache';

export async function logCycleAction(formData: unknown) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized: Couple space required.' };
  }

  const parsed = logCycleSchema.safeParse(formData);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Invalid cycle details';
    return { success: false, error: errorMsg };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const row = await dal.cycles.logCycle({
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate || undefined,
      periodLength: parsed.data.periodLength,
      cycleLength: parsed.data.cycleLength,
      flow: parsed.data.flow,
      symptoms: parsed.data.symptoms,
      mood: parsed.data.mood,
      comfortRequest: parsed.data.comfortRequest || undefined,
      notes: parsed.data.notes || undefined,
    });

    // Realtime broadcast to partner
    broadcastToCouple(auth.couple.coupleId, {
      type: 'cycle:updated' as any,
      payload: row,
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true, data: row };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to log cycle' };
  }
}

export async function sendComfortSignalAction(cycleId: string, signalText: string) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized: Couple space required.' };
  }

  if (!cycleId || !signalText) {
    return { success: false, error: 'Cycle ID and comfort signal text are required.' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const updated = await dal.cycles.updateComfortRequest(cycleId, signalText);

    // Notify partner in realtime
    broadcastToCouple(auth.couple.coupleId, {
      type: 'cycle:comfort_signal' as any,
      payload: {
        cycleId,
        signalText,
        senderName: auth.user.displayName,
      },
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send comfort signal' };
  }
}

export async function deleteCycleAction(cycleId: string) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    await dal.cycles.delete(cycleId);

    broadcastToCouple(auth.couple.coupleId, {
      type: 'cycle:deleted' as any,
      payload: { cycleId },
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete cycle record' };
  }
}
