import postgres from 'postgres';
import fs from 'fs';
import { hashPassword } from '../src/lib/auth/password';
import crypto from 'crypto';

let connectionString = process.env.DATABASE_URL;
if (!connectionString && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      connectionString = trimmed.replace('DATABASE_URL=', '').replace(/^["']|["']$/g, '');
      break;
    }
  }
}

if (!connectionString) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

async function seed() {
  console.log('Seeding Supabase PostgreSQL with initial demo couple...');

  // Delete existing demo couple if exists
  await sql`DELETE FROM couples WHERE invite_code = 'DUO-LOVE'`;
  await sql`DELETE FROM users WHERE email IN ('sarah@example.com', 'alex@example.com')`;

  const passwordHash = await hashPassword('Password123!');
  const sarahId = crypto.randomUUID();
  const alexId = crypto.randomUUID();
  const coupleId = crypto.randomUUID();

  // 1. Create Users
  await sql`
    INSERT INTO users (id, email, password_hash, display_name)
    VALUES
      (${sarahId}, 'sarah@example.com', ${passwordHash}, 'Sarah Chen'),
      (${alexId}, 'alex@example.com', ${passwordHash}, 'Alex Morgan')
  `;

  // 2. Create Couple Space
  await sql`
    INSERT INTO couples (id, invite_code, anniversary_date, status)
    VALUES (${coupleId}, 'DUO-LOVE', '2023-06-15', 'paired')
  `;

  // 3. Link Members
  await sql`
    INSERT INTO couple_members (id, couple_id, user_id, role)
    VALUES
      (${crypto.randomUUID()}, ${coupleId}, ${sarahId}, 'creator'),
      (${crypto.randomUUID()}, ${coupleId}, ${alexId}, 'partner')
  `;

  // 4. Seed Events
  const now = new Date();
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7 || 7));
  nextFriday.setHours(19, 30, 0, 0);

  const weekendTrip = new Date(now);
  weekendTrip.setDate(now.getDate() + 14);

  await sql`
    INSERT INTO events (id, couple_id, created_by_user_id, title, description, category, start_at, is_all_day, location, color)
    VALUES
      (${crypto.randomUUID()}, ${coupleId}, ${sarahId}, 'Candlelight Italian Dinner', 'Table booked at Osteria Mozza - celebrating Alex’s promotion!', 'date_night', ${nextFriday.toISOString().slice(0, 16)}, false, 'Osteria Mozza, Downtown', '#EA4C53'),
      (${crypto.randomUUID()}, ${coupleId}, ${alexId}, 'Weekend Cabin Getaway', 'Cozy cabin booked with hot tub and fireplace.', 'trip', ${weekendTrip.toISOString().slice(0, 10)}, true, 'Pine Ridge Valley', '#D97706'),
      (${crypto.randomUUID()}, ${coupleId}, ${sarahId}, 'Our Anniversary', 'Celebrating 3 wonderful years together', 'anniversary', '2026-06-15', true, 'Our favorite rooftop', '#E11D48')
  `;

  // 5. Seed Lists & Items
  const listId = crypto.randomUUID();
  await sql`
    INSERT INTO lists (id, couple_id, created_by_user_id, title, category, icon)
    VALUES (${listId}, ${coupleId}, ${sarahId}, 'Dream Date Nights', 'date_ideas', 'Sparkles')
  `;

  await sql`
    INSERT INTO list_items (id, list_id, couple_id, created_by_user_id, content, is_completed, sort_order)
    VALUES
      (${crypto.randomUUID()}, ${listId}, ${coupleId}, ${sarahId}, 'Stargazing picnic at the botanical garden with mulled wine', true, 1),
      (${crypto.randomUUID()}, ${listId}, ${coupleId}, ${alexId}, 'Pottery class together like in Ghost', true, 2),
      (${crypto.randomUUID()}, ${listId}, ${coupleId}, ${sarahId}, 'Hot springs weekend getaway in Big Sur', false, 3)
  `;

  // 6. Seed Weekly Check-in
  const checkinId = crypto.randomUUID();
  await sql`
    INSERT INTO checkins (id, couple_id, year, week_number, prompt_one, prompt_two, status, revealed_at)
    VALUES (
      ${checkinId},
      ${coupleId},
      2026,
      42,
      'What was your favorite moment of us together this week?',
      'What is one thing I can do to make you feel extra loved next week?',
      'revealed',
      NOW()
    )
  `;

  await sql`
    INSERT INTO checkin_answers (id, checkin_id, couple_id, user_id, mood, answer_one, answer_two)
    VALUES
      (${crypto.randomUUID()}, ${checkinId}, ${coupleId}, ${sarahId}, 5, 'When you surprised me with iced coffee while I was overwhelmed with work.', 'Let’s go for a sunrise walk together on Saturday morning with no phones.'),
      (${crypto.randomUUID()}, ${checkinId}, ${coupleId}, ${alexId}, 5, 'Cooking homemade pasta and dancing in the kitchen to vintage jazz.', 'Just keep making that incredible cinnamon tea before bed.')
  `;

  // 7. Seed Memories
  await sql`
    INSERT INTO memories (id, couple_id, created_by_user_id, title, memory_date, note)
    VALUES
      (${crypto.randomUUID()}, ${coupleId}, ${sarahId}, 'Sunset in Amalfi Coast', '2025-07-14', 'Sitting on the cliffside balcony with limoncello spritz, watching the boats go by.'),
      (${crypto.randomUUID()}, ${coupleId}, ${alexId}, 'The day we adopted Oliver', '2025-11-20', 'Our little bundle of fur instantly fell asleep in your lap on the drive home.')
  `;

  // 8. Seed Preferences
  await sql`
    INSERT INTO preferences (id, couple_id, user_id, category, title, content)
    VALUES
      (${crypto.randomUUID()}, ${coupleId}, ${alexId}, 'coffee_order', 'Daily Coffee Order', 'Oat Milk Flat White, extra hot, half a brown sugar cube.'),
      (${crypto.randomUUID()}, ${coupleId}, ${alexId}, 'love_language', 'Primary Love Language', 'Words of Affirmation & Quality Time.'),
      (${crypto.randomUUID()}, ${coupleId}, ${sarahId}, 'coffee_order', 'Morning Fuel', 'Iced Matcha Latte with almond milk, light ice, 1 pump vanilla.')
  `;

  // 9. Seed Partner Moods
  await sql`
    INSERT INTO partner_moods (id, couple_id, user_id, emoji, label, note)
    VALUES
      (${crypto.randomUUID()}, ${coupleId}, ${sarahId}, '☕', 'Cozy & Focused', 'Sipping coffee, thinking of you'),
      (${crypto.randomUUID()}, ${coupleId}, ${alexId}, '🌸', 'Excited & Dreaming', 'Counting down the days to our date')
  `;

  console.log('Demo couple seeded into Supabase successfully!');
  await sql.end();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
