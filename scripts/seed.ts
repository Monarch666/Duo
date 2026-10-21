import fs from 'fs';

if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

import { db } from '../src/lib/db';
import * as schema from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../src/lib/auth/password';
import crypto from 'crypto';

async function seed() {
  console.log('[Seed] Seeding Duo database with demo couple...');

  // Clear existing demo couple and demo users if they exist
  await db.delete(schema.couples).where(eq(schema.couples.inviteCode, 'DUO-LOVE'));

  const existingUsers = await db.select().from(schema.users);
  const demoEmails = ['sarah@example.com', 'alex@example.com'];
  for (const user of existingUsers) {
    if (demoEmails.includes(user.email)) {
      await db.delete(schema.users).where(eq(schema.users.id, user.id));
    }
  }

  const passwordHash = await hashPassword('Password123!');

  const sarahId = crypto.randomUUID();
  const alexId = crypto.randomUUID();
  const coupleId = crypto.randomUUID();

  // 1. Create Demo Users
  await db.insert(schema.users)
    .values([
      {
        id: sarahId,
        email: 'sarah@example.com',
        passwordHash,
        displayName: 'Sarah Chen',
        avatarUrl: null,
      },
      {
        id: alexId,
        email: 'alex@example.com',
        passwordHash,
        displayName: 'Alex Morgan',
        avatarUrl: null,
      },
    ]);

  // 2. Create Paired Couple Space
  const inviteCode = 'DUO-LOVE';
  await db.insert(schema.couples)
    .values({
      id: coupleId,
      inviteCode,
      anniversaryDate: '2023-06-15',
      status: 'paired',
    });

  // 3. Link Members
  await db.insert(schema.coupleMembers)
    .values([
      {
        id: crypto.randomUUID(),
        coupleId,
        userId: sarahId,
        role: 'creator',
      },
      {
        id: crypto.randomUUID(),
        coupleId,
        userId: alexId,
        role: 'partner',
      },
    ]);

  // 4. Seed Events
  const now = new Date();
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7 || 7));
  nextFriday.setHours(19, 30, 0, 0);

  const weekendTrip = new Date(now);
  weekendTrip.setDate(now.getDate() + 14);

  await db.insert(schema.events)
    .values([
      {
        id: crypto.randomUUID(),
        coupleId,
        createdByUserId: sarahId,
        title: 'Candlelight Italian Dinner',
        description: 'Table booked at Osteria Mozza - celebrating Alex’s promotion!',
        category: 'date_night',
        startAt: nextFriday.toISOString().slice(0, 16),
        isAllDay: false,
        location: 'Osteria Mozza, Downtown',
        color: '#EA4C53',
      },
      {
        id: crypto.randomUUID(),
        coupleId,
        createdByUserId: alexId,
        title: 'Weekend Cabin Getaway',
        description: 'Cozy cabin booked with hot tub and fireplace. Bring hiking boots!',
        category: 'trip',
        startAt: weekendTrip.toISOString().slice(0, 10),
        isAllDay: true,
        location: 'Pine Ridge Valley',
        color: '#D97706',
      },
      {
        id: crypto.randomUUID(),
        coupleId,
        createdByUserId: sarahId,
        title: 'Our Anniversary',
        description: 'Celebrating 3 wonderful years together',
        category: 'anniversary',
        startAt: '2026-06-15',
        isAllDay: true,
        location: 'Our favorite rooftop',
        color: '#E11D48',
      },
    ]);

  // 5. Seed Lists & Items
  const dateIdeasListId = crypto.randomUUID();
  const bucketListId = crypto.randomUUID();
  const groceryListId = crypto.randomUUID();

  await db.insert(schema.lists)
    .values([
      {
        id: dateIdeasListId,
        coupleId,
        createdByUserId: sarahId,
        title: 'Dream Date Nights',
        category: 'date_ideas',
        icon: 'Sparkles',
      },
      {
        id: bucketListId,
        coupleId,
        createdByUserId: alexId,
        title: 'Our Life Bucket List',
        category: 'bucket_list',
        icon: 'Compass',
      },
      {
        id: groceryListId,
        coupleId,
        createdByUserId: sarahId,
        title: 'Sunday Brunch Groceries',
        category: 'groceries',
        icon: 'ShoppingBag',
      },
    ]);

  await db.insert(schema.listItems)
    .values([
      {
        id: crypto.randomUUID(),
        listId: dateIdeasListId,
        coupleId,
        createdByUserId: sarahId,
        content: 'Pottery class together like in Ghost',
        isCompleted: true,
        completedAt: new Date(),
        completedByUserId: sarahId,
      },
      {
        id: crypto.randomUUID(),
        listId: dateIdeasListId,
        coupleId,
        createdByUserId: alexId,
        content: 'Stargazing picnic at the botanical garden with mulled wine',
        isCompleted: false,
      },
      {
        id: crypto.randomUUID(),
        listId: bucketListId,
        coupleId,
        createdByUserId: alexId,
        content: 'See the Northern Lights from a glass igloo in Lapland',
        isCompleted: false,
      },
      {
        id: crypto.randomUUID(),
        listId: bucketListId,
        coupleId,
        createdByUserId: sarahId,
        content: 'Adopt a rescue golden retriever pup',
        isCompleted: false,
      },
      {
        id: crypto.randomUUID(),
        listId: groceryListId,
        coupleId,
        createdByUserId: sarahId,
        content: 'Organic sourdough loaf',
        isCompleted: true,
        completedAt: new Date(),
        completedByUserId: alexId,
      },
      {
        id: crypto.randomUUID(),
        listId: groceryListId,
        coupleId,
        createdByUserId: alexId,
        content: 'Pure maple syrup & fresh berries',
        isCompleted: false,
      },
    ]);

  // 6. Seed Weekly Check-in (Current Week, Revealed)
  const currentCheckinId = crypto.randomUUID();
  await db.insert(schema.checkins)
    .values({
      id: currentCheckinId,
      coupleId,
      year: 2026,
      weekNumber: 42,
      promptOne: 'What was your favorite moment of us together this week?',
      promptTwo: 'What is one thing I can do to make you feel extra loved next week?',
      status: 'revealed',
      revealedAt: new Date(),
    });

  await db.insert(schema.checkinAnswers)
    .values([
      {
        id: crypto.randomUUID(),
        checkinId: currentCheckinId,
        coupleId,
        userId: sarahId,
        mood: 5,
        answerOne: 'When you surprised me with iced coffee while I was overwhelmed with work deadlines.',
        answerTwo: 'Let’s take a 30-minute evening walk together without our phones.',
      },
      {
        id: crypto.randomUUID(),
        checkinId: currentCheckinId,
        coupleId,
        userId: alexId,
        mood: 5,
        answerOne: 'Cooking homemade pasta and dancing in the kitchen to vintage jazz.',
        answerTwo: 'Just cuddle up and watch the rain together on Sunday morning.',
      },
    ]);

  // 7. Seed Memories
  await db.insert(schema.memories)
    .values([
      {
        id: crypto.randomUUID(),
        coupleId,
        createdByUserId: alexId,
        title: 'The day we adopted Oliver',
        memoryDate: '2025-11-20',
        note: 'Our little bundle of fur instantly fell asleep in your lap on the drive home. One of the happiest days of my life.',
      },
      {
        id: crypto.randomUUID(),
        coupleId,
        createdByUserId: sarahId,
        title: 'Sunset in Amalfi Coast',
        memoryDate: '2025-07-14',
        note: 'Sitting on the cliffside balcony with limoncello spritz, watching the boats go by and talking about our dreams for the next decade.',
      },
    ]);

  // 8. Seed Partner Preferences
  await db.insert(schema.preferences)
    .values([
      {
        id: crypto.randomUUID(),
        coupleId,
        userId: sarahId,
        category: 'favorite_food',
        title: 'Comfort Food & Sweet Treats',
        content: 'Truffle mushroom risotto; Dark chocolate sea salt cookies; Matcha oat latte with honey.',
      },
      {
        id: crypto.randomUUID(),
        coupleId,
        userId: sarahId,
        category: 'love_language',
        title: 'Top Love Languages',
        content: '1. Quality Time (uninterrupted conversations) \n2. Words of Affirmation',
      },
      {
        id: crypto.randomUUID(),
        coupleId,
        userId: alexId,
        category: 'favorite_food',
        title: 'Favorites & Cravings',
        content: 'Neapolitan Margherita pizza; Iced Americano (black); Pistachio gelato.',
      },
      {
        id: crypto.randomUUID(),
        coupleId,
        userId: alexId,
        category: 'love_language',
        title: 'Top Love Languages',
        content: '1. Physical Touch (holding hands, long hugs) \n2. Acts of Service',
      },
    ]);

  console.log('[Seed] Demo couple seeded successfully in Supabase!');
  console.log('--------------------------------------------------');
  console.log('Partner 1: sarah@example.com / Password123!');
  console.log('Partner 2: alex@example.com  / Password123!');
  console.log(`Couple Code: ${inviteCode}`);
  console.log('--------------------------------------------------');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
