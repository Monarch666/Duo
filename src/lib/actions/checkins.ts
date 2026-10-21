'use server';

import { getCurrentAuth } from '@/lib/auth/session';
import { createCoupleDal } from '@/lib/dal';
import { submitCheckinSchema } from '@/lib/validations';
import { broadcastToCouple } from '@/lib/realtime/bus';
import { revalidatePath } from 'next/cache';

export async function submitCheckinAction(formData: unknown) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = submitCheckinSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid reflection data' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const res = await dal.checkins.submitAnswers(parsed.data.checkinId, {
      mood: parsed.data.mood,
      answerOne: parsed.data.answerOne,
      answerTwo: parsed.data.answerTwo,
    });

    // Realtime notification: if both finished, broadcast reveal event, else broadcast submit event
    if (res.revealedNow) {
      const fullCheckin = await dal.checkins.getCheckinDetails(parsed.data.checkinId);
      broadcastToCouple(auth.couple.coupleId, {
        type: 'checkin:revealed',
        payload: fullCheckin,
        actorUserId: auth.user.id,
      });
    } else {
      broadcastToCouple(auth.couple.coupleId, {
        type: 'checkin:submitted',
        payload: { checkinId: parsed.data.checkinId, submittedUserId: auth.user.id },
        actorUserId: auth.user.id,
      });
    }

    revalidatePath('/');
    return { success: true, revealedNow: res.revealedNow };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit check-in' };
  }
}

export async function getCheckinDetailsAction(checkinId: string) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const details = await dal.checkins.getCheckinDetails(checkinId);
    return { success: true, data: details };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch check-in' };
  }
}

export async function getCheckinHistoryAction() {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const history = await dal.checkins.getHistory();
    return { success: true, data: history };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch history' };
  }
}
