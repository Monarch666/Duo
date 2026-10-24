import { getCurrentAuth } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import PairClient from './PairClient';

export const dynamic = 'force-dynamic';

export default async function PairPage() {
  const auth = await getCurrentAuth();

  if (!auth) {
    redirect('/login');
  }

  // If already paired, go straight to shared dashboard
  if (auth.couple && auth.couple.status === 'paired') {
    redirect('/');
  }

  return (
    <PairClient
      userName={auth.user.displayName}
      currentCouple={auth.couple}
    />
  );
}
