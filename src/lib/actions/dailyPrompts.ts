'use server';

import { getCurrentAuth } from '@/lib/auth/session';
import { createCoupleDal } from '@/lib/dal';
import { createDailyPromptSchema, answerDailyPromptSchema } from '@/lib/validations';
import { broadcastToCouple } from '@/lib/realtime/bus';
import { revalidatePath } from 'next/cache';

export async function createDailyPromptAction(formData: unknown) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = createDailyPromptSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid prompt' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const prompt = await dal.dailyPrompts.create(parsed.data.promptText);

    broadcastToCouple(auth.couple.coupleId, {
      type: 'daily_prompt:created',
      payload: prompt,
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true, data: prompt };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create daily prompt' };
  }
}

export async function answerDailyPromptAction(formData: unknown) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = answerDailyPromptSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid answer' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const answer = await dal.dailyPrompts.answer({
      promptId: parsed.data.promptId,
      answer: parsed.data.answer,
    });

    broadcastToCouple(auth.couple.coupleId, {
      type: 'daily_prompt:answered',
      payload: answer,
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true, data: answer };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit reflection' };
  }
}
