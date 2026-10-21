import { getCurrentAuth } from '@/lib/auth/session';
import { createCoupleDal } from '@/lib/dal';
import { redirect } from 'next/navigation';
import { getISOWeekAndYear } from '@/lib/utils/date';
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

  const { year: currentYear, weekNumber: currentWeek } = getISOWeekAndYear();

  const [
    coupleInfo,
    events,
    lists,
    checkin,
    memories,
    preferences,
    loveNotes,
    dailyPrompt,
    partnerMoods,
  ] = await Promise.all([
    dal.couple.getDetails(),
    dal.events.getAll(),
    dal.lists.getAll(),
    dal.checkins.getOrCreateWeek(currentYear, currentWeek, {
      promptOne: 'What was your favorite moment together this week?',
      promptTwo: 'What is one thing I can do to make you feel extra loved next week?',
    }),
    dal.memories.getAll(),
    dal.preferences.getAll(),
    dal.loveNotes.getAll(),
    dal.dailyPrompts.getLatest(),
    dal.partnerMoods.getAll(),
  ]);

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
