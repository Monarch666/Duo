import { getCurrentAuth } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const auth = await getCurrentAuth();

  if (!auth) {
    redirect('/login');
  }

  if (!auth.couple) {
    redirect('/pair');
  }

  return (
    <OnboardingClient
      userName={auth.user.displayName}
      isPaired={auth.couple.status === 'paired'}
      existingAnniversary={auth.couple.anniversaryDate}
    />
  );
}
