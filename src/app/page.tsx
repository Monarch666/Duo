import { getCurrentAuth } from '@/lib/auth/session';
import { createCoupleDal } from '@/lib/dal';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function HomePage() {
  const auth = await getCurrentAuth();

  if (!auth) {
    redirect('/login');
  }

  if (!auth.couple || auth.couple.status !== 'paired') {
    redirect('/pair');
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  const coupleInfo = await dal.couple.getDetails();
  const events = await dal.events.getAll();
  const lists = await dal.lists.getAll();
  const checkin = await dal.checkins.getOrCreateWeek(2026, 42, {
    promptOne: 'What was your favorite moment together this week?',
    promptTwo: 'What is one thing I can do to make you feel extra loved next week?',
  });
  const memories = await dal.memories.getAll();
  const preferences = await dal.preferences.getAll();
  const loveNotes = await dal.loveNotes.getAll();
  const dailyPrompt = await dal.dailyPrompts.getLatest();
  const partnerMoods = await dal.partnerMoods.getAll();

  return (
    <DashboardClient
      user={auth.user}
      coupleInfo={coupleInfo}
      initialEvents={events}
      initialLists={lists}
      initialCheckin={checkin}
      initialMemories={memories}
      initialPreferences={preferences}
      initialLoveNotes={loveNotes}
      initialDailyPrompt={dailyPrompt}
      initialPartnerMoods={partnerMoods}
    />
  );
}
