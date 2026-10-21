'use server';

import { getCurrentAuth } from '@/lib/auth/session';
import { createCoupleDal } from '@/lib/dal';
import {
  createListSchema,
  createListItemSchema,
  toggleListItemSchema,
} from '@/lib/validations';
import { broadcastToCouple } from '@/lib/realtime/bus';
import { revalidatePath } from 'next/cache';

export async function createListAction(formData: unknown) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = createListSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid list data' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const newList = await dal.lists.create({
      title: parsed.data.title,
      category: parsed.data.category,
      icon: parsed.data.icon,
    });

    const fullList = {
      ...newList,
      totalItems: 0,
      completedItems: 0,
      items: [],
    };

    broadcastToCouple(auth.couple.coupleId, {
      type: 'list:created',
      payload: fullList,
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true, data: fullList };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create list' };
  }
}

export async function deleteListAction(id: string) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    await dal.lists.delete(id);

    broadcastToCouple(auth.couple.coupleId, {
      type: 'list:deleted',
      payload: { id },
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete list' };
  }
}

export async function addListItemAction(formData: unknown) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = createListItemSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid item data' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const newItem = await dal.listItems.addItem(parsed.data.listId, parsed.data.content);

    broadcastToCouple(auth.couple.coupleId, {
      type: 'list:item_added',
      payload: newItem,
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true, data: newItem };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add item' };
  }
}

export async function toggleListItemAction(formData: unknown) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = toggleListItemSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Invalid toggle data' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const updated = await dal.listItems.toggleItem(
      parsed.data.itemId,
      parsed.data.isCompleted
    );

    broadcastToCouple(auth.couple.coupleId, {
      type: 'list:item_toggled',
      payload: updated,
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to toggle item' };
  }
}

export async function deleteListItemAction(itemId: string) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    await dal.listItems.deleteItem(itemId);

    broadcastToCouple(auth.couple.coupleId, {
      type: 'list:item_deleted',
      payload: { itemId },
      actorUserId: auth.user.id,
    });

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete item' };
  }
}

export async function getListWithItemsAction(listId: string) {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'Unauthorized' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    const list = await dal.lists.getById(listId);
    return { success: true, data: list };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch list' };
  }
}
