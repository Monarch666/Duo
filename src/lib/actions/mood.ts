'use server';

import { getCurrentAuth } from '@/lib/auth/session';
import { createCoupleDal } from '@/lib/dal';
import { updatePartnerMoodSchema } from '@/lib/validations';
import { broadcastToCouple } from '@/lib/realtime/bus';
import { revalidatePath } from 'next/cache';

export async function updatePartnerMoodAction(formData: unknown) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = updatePartnerMoodSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid mood' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const updated = await dal.partnerMoods.update({
      emoji: parsed.data.emoji,
      label: parsed.data.label,
      note: parsed.data.note,
    });

    broadcastToCouple(auth.couple.coupleId, {
      type: 'partner_mood:updated',
      payload: updated,
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update mood' };
  }
}
