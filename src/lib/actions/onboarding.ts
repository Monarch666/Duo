'use server';

import { getCurrentAuth } from '@/lib/auth/session';
import { createCoupleDal } from '@/lib/dal';
import { onboardingSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export interface OnboardingActionResponse {
  success: boolean;
  error?: string;
}

export async function submitOnboardingAction(formData: unknown): Promise<OnboardingActionResponse> {
  const auth = await getCurrentAuth();
  if (!auth) {
    return { success: false, error: 'You must be signed in to set up your sanctuary.' };
  }

  if (!auth.couple) {
    return { success: false, error: 'Please create or join a couple space first.' };
  }

  const parsed = onboardingSchema.safeParse(formData);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || 'Invalid form data';
    return { success: false, error: msg };
  }

  const data = parsed.data;
  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  try {
    // 1. Anniversary Date
    if (data.anniversaryDate) {
      await dal.couple.updateAnniversary(data.anniversaryDate);

      // Create an anniversary event on calendar
      await dal.events.create({
        title: 'Our Anniversary 💕',
        description: 'Celebrating the day our journey began!',
        category: 'anniversary',
        startAt: data.anniversaryDate,
        isAllDay: true,
        color: '#E11D48',
      });
    }

    // 2. First Memory (if meeting place provided)
    if (data.meetPlace) {
      await dal.memories.create({
        title: 'Where Our Story Began',
        memoryDate: data.anniversaryDate || new Date().toISOString().slice(0, 10),
        note: `The place where it all started: ${data.meetPlace}`,
      });
    }

    // 3. Partner Preferences (Love Language & Comfort Food)
    await dal.preferences.upsert({
      category: 'love_language',
      title: 'My Primary Love Language',
      content: data.loveLanguage,
    });

    await dal.preferences.upsert({
      category: 'favorite_food',
      title: 'Comfort Food & Sweet Cravings',
      content: data.comfortFood,
    });

    if (data.comfortCheerUp) {
      await dal.preferences.upsert({
        category: 'custom',
        title: 'How to Comfort Me When Stressed',
        content: data.comfortCheerUp,
      });
    }

    // 4. Shared Lists: Dream Date Nights & Bucket List
    const existingLists = await dal.lists.getAll();
    let dateListId = existingLists.find((l) => l.category === 'date_ideas')?.id;
    if (!dateListId) {
      const created = await dal.lists.create({
        title: 'Dream Date Nights',
        category: 'date_ideas',
        icon: 'Sparkles',
      });
      dateListId = created.id;
    }

    if (dateListId && data.dreamDates.length > 0) {
      for (const item of data.dreamDates) {
        if (item.trim()) {
          await dal.listItems.addItem(dateListId, item.trim());
        }
      }
    }

    let bucketListId = existingLists.find((l) => l.category === 'bucket_list')?.id;
    if (!bucketListId) {
      const created = await dal.lists.create({
        title: 'Our Life Bucket List',
        category: 'bucket_list',
        icon: 'Compass',
      });
      bucketListId = created.id;
    }

    if (bucketListId && data.bucketListDream) {
      await dal.listItems.addItem(bucketListId, data.bucketListDream.trim());
    }

    // 5. Next Planned Date (if provided)
    if (data.nextDateTitle && data.nextDateStartAt) {
      await dal.events.create({
        title: data.nextDateTitle.trim(),
        category: data.nextDateCategory || 'date_night',
        startAt: data.nextDateStartAt,
        color: '#EA4C53',
        description: 'Scheduled during couple onboarding setup.',
      });
    }

    // 6. Secret Welcome Love Note (if provided)
    if (data.welcomeNote && data.welcomeNote.trim()) {
      await dal.loveNotes.create({
        title: 'Welcome to Our Sanctuary',
        content: data.welcomeNote.trim(),
        paperStyle: data.welcomeNoteStyle || 'butter',
        signOff: data.welcomeNoteSignOff?.trim() || 'Forever yours,',
      });
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    console.error('[Onboarding Action Error]', err);
    return { success: false, error: err.message || 'Failed to save setup.' };
  }
}
