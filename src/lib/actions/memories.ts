'use server';

import { getCurrentAuth } from '@/lib/auth/session';
import { createCoupleDal } from '@/lib/dal';
import { createMemorySchema } from '@/lib/validations';
import { broadcastToCouple } from '@/lib/realtime/bus';
import { revalidatePath } from 'next/cache';
import path from 'path';
import fs from 'fs';

export async function createMemoryAction(formData: unknown) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const rawData = formData as any;
  const parsed = createMemorySchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid memory data' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const newMemory = await dal.memories.create({
      title: parsed.data.title,
      memoryDate: parsed.data.memoryDate,
      note: parsed.data.note,
      photoPath: rawData.photoPath || undefined,
    });

    const memoryWithCreator = {
      ...newMemory,
      creatorName: auth.user.displayName,
    };

    broadcastToCouple(auth.couple.coupleId, {
      type: 'memory:created',
      payload: memoryWithCreator,
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true, data: memoryWithCreator };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save memory' };
  }
}

export async function deleteMemoryAction(id: string) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const memory = await dal.memories.getById(id);
    if (memory?.photoPath && !memory.photoPath.startsWith('data:')) {
      // Remove file from disk
      const filePath = path.join(process.cwd(), 'data', 'uploads', path.basename(memory.photoPath));
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // ignore disk errors
        }
      }
    }

    await dal.memories.delete(id);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete memory' };
  }
}
