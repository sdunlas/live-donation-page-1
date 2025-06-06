'use client';

import { useEffect, useState } from 'react';
import LiveDonationDisplay from '@/components/LiveDonations/LiveDonationDisplay';
import { DonationGoal, GOAL_STORAGE_KEY } from '@/types/donation';

// Default goal if none is set
const defaultGoal: DonationGoal = {
  target: 0,
  current: 0
};

export default function LivePage() {
  const [goal, setGoal] = useState<DonationGoal>(defaultGoal);

  useEffect(() => {
    const storedGoal = localStorage.getItem(GOAL_STORAGE_KEY);
    if (storedGoal) {
      setGoal(JSON.parse(storedGoal));
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,0,240,0.1),rgba(0,0,0,0))]" />
      <LiveDonationDisplay initialGoal={goal} />
    </main>
  );
} 