'use server';

import { getCurrentAuth } from '@/lib/auth/session';
import { createCoupleDal } from '@/lib/dal';
import { upsertPreferenceSchema } from '@/lib/validations';
import { broadcastToCouple } from '@/lib/realtime/bus';
import { revalidatePath } from 'next/cache';

export async function upsertPreferenceAction(formData: unknown) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = upsertPreferenceSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid preference data' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const pref = await dal.preferences.upsert({
      id: parsed.data.id,
      category: parsed.data.category,
      title: parsed.data.title,
      content: parsed.data.content,
    });

    const prefWithUser = {
      ...pref,
      userName: auth.user.displayName,
    };

    broadcastToCouple(auth.couple.coupleId, {
      type: 'preference:updated',
      payload: prefWithUser,
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true, data: prefWithUser };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save preference' };
  }
}

export async function deletePreferenceAction(id: string) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    await dal.preferences.delete(id);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete preference' };
  }
}
