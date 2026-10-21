'use server';

import { getCurrentAuth } from '@/lib/auth/session';
import { createCoupleDal } from '@/lib/dal';
import { createLoveNoteSchema, replyLoveNoteSchema } from '@/lib/validations';
import { broadcastToCouple } from '@/lib/realtime/bus';
import { revalidatePath } from 'next/cache';

export async function createLoveNoteAction(formData: unknown) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = createLoveNoteSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid love note' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const note = await dal.loveNotes.create({
      title: parsed.data.title,
      content: parsed.data.content,
      signOff: parsed.data.signOff,
      paperStyle: parsed.data.paperStyle,
    });

    broadcastToCouple(auth.couple.coupleId, {
      type: 'love_note:created',
      payload: note,
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true, data: note };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create love note' };
  }
}

export async function tapLoveNoteAction(noteId: string) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const updated = await dal.loveNotes.tap(noteId);

    broadcastToCouple(auth.couple.coupleId, {
      type: 'love_note:tapped',
      payload: updated,
      actorUserId: auth.user.id,
    });

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to tap love note' };
  }
}

export async function replyLoveNoteAction(formData: unknown) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = replyLoveNoteSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid reply' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const reply = await dal.loveNotes.addReply({
      noteId: parsed.data.noteId,
      content: parsed.data.content,
    });

    broadcastToCouple(auth.couple.coupleId, {
      type: 'love_note:reply_added',
      payload: reply,
      actorUserId: auth.user.id,
    });

    return { success: true, data: reply };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add reply' };
  }
}

export async function deleteLoveNoteAction(noteId: string) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    await dal.loveNotes.delete(noteId);

    broadcastToCouple(auth.couple.coupleId, {
      type: 'love_note:deleted',
      payload: { id: noteId },
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete love note' };
  }
}
