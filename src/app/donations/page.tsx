'use client';

import { useEffect, useState } from 'react';
import DonationDisplay from '@/components/DonationDisplay/DonationDisplay';
import { DonationGoal, GOAL_STORAGE_KEY } from '@/types/donation';

// Default goal if none is set
const defaultGoal: DonationGoal = {
  target: 0,
  current: 0
};

export default function DonationsPage() {
  const [goal, setGoal] = useState<DonationGoal>(defaultGoal);

  useEffect(() => {
    const storedGoal = localStorage.getItem(GOAL_STORAGE_KEY);
    if (storedGoal) {
      setGoal(JSON.parse(storedGoal));
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      <DonationDisplay 
        initialGoal={goal}
      />
    </main>
  );
} 