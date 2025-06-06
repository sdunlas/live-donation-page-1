'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Donation, DonationGoal, DONATION_STORAGE_KEY, DonationQueue, GOAL_STORAGE_KEY } from '@/types/donation';
import DonationProgressBar from './DonationProgressBar';
import DonationBubble from './DonationBubble';
import Image from 'next/image';

interface Props {
  initialGoal: DonationGoal;
}

interface DisplayDonation extends Donation {
  isNew: boolean;
}

const MAX_VISIBLE_DONATIONS = 5; // Maximum number of donations visible at once
const NEW_DONATION_HIGHLIGHT = 3000; // How long to highlight new donations (ms)
const DONATION_INTERVAL = 5000; // Time between new donations (ms)

export default function DonationDisplay({ initialGoal }: Props) {
  const [goal, setGoal] = useState<DonationGoal>(initialGoal);
  const [displayedDonations, setDisplayedDonations] = useState<DisplayDonation[]>([]);
  const [queue, setQueue] = useState<DonationQueue | null>(null);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Listen for goal changes
  useEffect(() => {
    const checkGoal = () => {
      const storedGoal = localStorage.getItem(GOAL_STORAGE_KEY);
      if (storedGoal) {
        const parsedGoal = JSON.parse(storedGoal) as DonationGoal;
        setGoal(prev => ({
          ...prev,
          target: parsedGoal.target
        }));
      }
    };

    // Check for goal changes every second
    const interval = setInterval(checkGoal, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load queue from localStorage
  useEffect(() => {
    const storedQueue = localStorage.getItem(DONATION_STORAGE_KEY);
    if (storedQueue) {
      const parsedQueue = JSON.parse(storedQueue) as DonationQueue;
      setQueue(parsedQueue);

      // Calculate initial total from donations up to current index
      const initialTotal = parsedQueue.donations
        .slice(0, parsedQueue.currentIndex)
        .reduce((sum, d) => sum + d.amount, 0);

      setTotalProcessed(parsedQueue.currentIndex);
      setGoal(prev => ({
        ...prev,
        current: initialTotal
      }));
    }
  }, []);

  const showNextDonation = useCallback(() => {
    if (!queue?.isActive || !queue.donations || isPaused) return;

    const startIdx = queue.currentIndex;
    if (startIdx >= queue.donations.length) {
      // Queue complete, stop processing
      const updatedQueue = { ...queue, isActive: false };
      setQueue(updatedQueue);
      localStorage.setItem(DONATION_STORAGE_KEY, JSON.stringify(updatedQueue));
      return;
    }

    // Show next donation
    const newDonation: DisplayDonation = {
      ...queue.donations[startIdx],
      timestamp: new Date().toISOString(),
      isNew: true
    };

    // Update total and displayed donations
    setGoal(prev => ({
      ...prev,
      current: Math.min(prev.current + newDonation.amount, goal.target)
    }));

    setDisplayedDonations(prev => {
      const now = new Date().getTime();
      return prev.filter(d => now - new Date(d.timestamp).getTime() < 8000);
    });
    
    setTotalProcessed(startIdx + 1);

    // Update queue index
    const updatedQueue = { ...queue, currentIndex: startIdx + 1 };
    setQueue(updatedQueue);
    localStorage.setItem(DONATION_STORAGE_KEY, JSON.stringify(updatedQueue));

    // Remove new status after highlight duration
    setTimeout(() => {
      setDisplayedDonations(prev => 
        prev.map(d => d.id === newDonation.id ? { ...d, isNew: false } : d)
      );
    }, NEW_DONATION_HIGHLIGHT);
  }, [queue, goal.target, isPaused]);

  // Process queue
  useEffect(() => {
    if (!queue?.isActive) return;

    // Show initial donation
    const initialDelay = setTimeout(() => {
      showNextDonation();
      
      // Set up interval for showing more donations
      const interval = setInterval(() => {
        showNextDonation();
      }, DONATION_INTERVAL);

      return () => clearInterval(interval);
    }, 1000);

    return () => clearTimeout(initialDelay);
  }, [queue?.isActive, showNextDonation]);

  // Clean up old donations
  useEffect(() => {
    const cleanup = setInterval(() => {
      setDisplayedDonations(prev => {
        const now = new Date().getTime();
        return prev.filter(d => now - new Date(d.timestamp).getTime() < 8000); // Match animation duration
      });
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto p-12 min-h-screen flex flex-col">
      <div className="h-36"></div> {/* Increased top spacing */}
      <div className="relative mb-24">
        <motion.div 
          className="text-[10rem] font-bold text-center mb-8 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 text-transparent bg-clip-text leading-none"
          key={goal.current}
          initial={{ scale: 1 }}
          animate={{ 
            scale: [1, 1.02, 1],
            transition: { duration: 0.5, repeat: Infinity, repeatDelay: 3 }
          }}
        >
          ${goal.current.toLocaleString()}
        </motion.div>
        <div className="text-purple-500 text-3xl text-center mb-12">
          raised of ${goal.target.toLocaleString()} goal
        </div>
        <DonationProgressBar current={goal.current} target={goal.target} />
      </div>
      
      <div className="relative flex-grow">
        <AnimatePresence>
          {displayedDonations.map((donation, index) => (
            <DonationBubble
              key={donation.id}
              donation={donation}
              isNew={donation.isNew}
              position={index}
              total={displayedDonations.length}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Logo at the bottom */}
      <div className="flex justify-center mt-auto pb-12">
        <Image
          src="/images/fluid-events-logo-full-white.png"
          alt="Fluid Events Logo"
          width={160}
          height={40}
          className="opacity-40 hover:opacity-80 transition-opacity duration-300"
          priority={false}
        />
      </div>
    </div>
  );
} 