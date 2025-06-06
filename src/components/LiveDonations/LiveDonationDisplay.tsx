'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Donation, 
  DonationGoal, 
  DONATION_STORAGE_KEY, 
  DonationQueue, 
  LogoConfig, 
  LOGO_STORAGE_KEY,
  ThemeConfig,
  THEME_STORAGE_KEY,
  GOAL_STORAGE_KEY
} from '@/types/donation';
import Image from 'next/image';

interface Props {
  initialGoal: DonationGoal;
}

interface DisplayDonation extends Donation {
  isNew: boolean;
}

const GRID_SIZE = 12; // 3x4 grid

const defaultTheme: ThemeConfig = {
  primaryColor: '#4B0082',    // Deep royal purple
  secondaryColor: '#2E0854',  // Darker purple
  accentColor: '#E056FD',     // Bright pink/purple
  textColor: '#FFFFFF'        // Pure white
};

export default function LiveDonationDisplay({ initialGoal }: Props) {
  const [goal, setGoal] = useState<DonationGoal>(initialGoal);
  const [latestDonation, setLatestDonation] = useState<DisplayDonation | null>(null);
  const [displayDonations, setDisplayDonations] = useState<DisplayDonation[]>([]);
  const [queue, setQueue] = useState<DonationQueue | null>(null);
  const [logoConfig, setLogoConfig] = useState<LogoConfig | null>(null);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(defaultTheme);
  const processedIds = useRef(new Set<string>());
  const processingInterval = useRef<NodeJS.Timeout | null>(null);

  // Load configurations
  useEffect(() => {
    const storedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
    if (storedLogo) {
      setLogoConfig(JSON.parse(storedLogo));
    }

    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme) {
      setThemeConfig(JSON.parse(storedTheme));
    }
  }, []);

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

  // Process new donations
  const processNextDonation = useCallback(() => {
    if (!queue) {
      console.log('No queue available');
      return;
    }

    if (queue.currentIndex >= queue.donations.length) {
      console.log('Queue completed');
      if (processingInterval.current) {
        clearInterval(processingInterval.current);
      }
      return;
    }

    const newDonation = queue.donations[queue.currentIndex];
    
    // Check if we've already processed this donation
    if (processedIds.current.has(newDonation.id)) {
      console.log('Donation already processed:', newDonation.id);
      return;
    }

    console.log('Processing new donation:', newDonation);
    processedIds.current.add(newDonation.id);
    
    // Update latest donation banner
    setLatestDonation({
      ...newDonation,
      isNew: true
    });

    // Add to display donations after banner display
    setTimeout(() => {
      setDisplayDonations(prev => {
        const newDonations = [
          { ...newDonation, isNew: false },
          ...prev.slice(0, GRID_SIZE - 1) // Keep only the first 11 donations to make room for the new one
        ];
        return newDonations;
      });

      setLatestDonation(null);
    }, 1500); // Show in banner for 1.5 seconds

    // Update queue and goal
    const updatedQueue = {
      ...queue,
      currentIndex: queue.currentIndex + 1
    };
    setQueue(updatedQueue);
    localStorage.setItem(DONATION_STORAGE_KEY, JSON.stringify(updatedQueue));

    setGoal(prev => {
      const newTotal = prev.current + newDonation.amount;
      console.log('Updating goal:', prev.current, '+', newDonation.amount, '=', newTotal);
      return {
        ...prev,
        current: newTotal
      };
    });
  }, [queue]);

  // Load queue and start processing if active
  useEffect(() => {
    console.log('Loading queue from storage');
    const loadQueue = () => {
      const storedQueue = localStorage.getItem(DONATION_STORAGE_KEY);
      if (storedQueue) {
        const parsedQueue = JSON.parse(storedQueue) as DonationQueue;
        console.log('Found queue:', parsedQueue);
        
        // Only start processing if queue is active and we haven't started yet
        if (parsedQueue.isActive && !processingInterval.current) {
          console.log('Queue is active, starting processing');
          setQueue(parsedQueue);
          
          // Process first donation after 2 seconds
          setTimeout(() => {
            processNextDonation();
            // Start interval for subsequent donations with 4 second interval
            processingInterval.current = setInterval(processNextDonation, 4000);
          }, 2000);
        } else if (!parsedQueue.isActive && processingInterval.current) {
          // Stop processing if queue is deactivated
          console.log('Queue is inactive, stopping processing');
          clearInterval(processingInterval.current);
          processingInterval.current = null;
        }
      }
    };

    loadQueue();
    const checkInterval = setInterval(loadQueue, 1000);

    return () => {
      clearInterval(checkInterval);
      if (processingInterval.current) {
        clearInterval(processingInterval.current);
        processingInterval.current = null;
      }
    };
  }, [processNextDonation]);

  const progressPercentage = (goal.current / goal.target) * 100;

  return (
    <div 
      className="min-h-screen w-full p-8"
      style={{
        background: `linear-gradient(135deg, ${themeConfig.primaryColor}, ${themeConfig.secondaryColor})`,
        backgroundAttachment: 'fixed',
        boxShadow: 'inset 0 0 150px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Top section with total and latest donation */}
      <div className="w-full max-w-7xl mx-auto mb-16 pt-12">
        <motion.div 
          className="text-center mb-12"
          animate={{ scale: [1, 1.01, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <div className="relative h-[10rem]">
            <motion.div
              className="absolute w-full flex justify-center"
              key={goal.current}
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
            >
              <motion.span
                className="text-[9.5rem] font-bold inline-block"
                style={{ 
                  color: themeConfig.textColor,
                  letterSpacing: '-0.02em',
                  textShadow: '0 0 50px rgba(224, 86, 253, 0.3), 0 0 100px rgba(224, 86, 253, 0.1)'
                }}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                ${goal.current.toLocaleString()}
              </motion.span>
            </motion.div>
          </div>
          <div 
            className="flex items-center justify-center gap-2 mt-12"
          >
            <span 
              className="text-3xl font-medium"
              style={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                textShadow: '0 0 20px rgba(224, 86, 253, 0.2)'
              }}
            >
              raised toward our
            </span>
            <span 
              className="text-3xl font-semibold"
              style={{ 
                color: 'rgba(255, 255, 255, 0.95)',
                textShadow: '0 0 20px rgba(224, 86, 253, 0.2)'
              }}
            >
              ${goal.target.toLocaleString()}
            </span>
            <span 
              className="text-3xl font-medium"
              style={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                textShadow: '0 0 20px rgba(224, 86, 253, 0.2)'
              }}
            >
              goal
            </span>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="relative w-full h-5 mb-16">
          <div 
            className="absolute inset-0 rounded-full overflow-hidden" 
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          >
            <motion.div 
              className="h-full relative overflow-hidden"
              style={{
                width: `${progressPercentage}%`,
                background: `linear-gradient(90deg, ${themeConfig.accentColor}, ${themeConfig.primaryColor})`,
                boxShadow: '0 0 30px rgba(224, 86, 253, 0.4)'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8 }}
            >
              {/* Shine effect */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                  transform: 'skewX(-20deg)',
                  animation: 'shine 3s infinite',
                  width: '200%',
                  left: '-50%'
                }}
              />
            </motion.div>
          </div>
        </div>

        {/* Latest Donation Banner */}
        <div className="relative h-24 mb-8">
          <AnimatePresence mode="wait">
            {latestDonation && (
              <motion.div
                key={latestDonation.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  transition: {
                    duration: 0.4,
                    type: "spring",
                    bounce: 0.35
                  }
                }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="absolute inset-0 rounded-2xl p-8 flex items-center justify-between"
                style={{
                  background: 'linear-gradient(110deg, rgba(224, 86, 253, 0.15), rgba(255, 255, 255, 0.05))',
                  backdropFilter: 'blur(12px)',
                  boxShadow: 'inset 0 2px rgba(255, 255, 255, 0.1), 0 15px 30px rgba(0, 0, 0, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Celebration effects */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  initial={{ opacity: 0.5, scale: 0.95 }}
                  animate={{ 
                    opacity: 0,
                    scale: 1.1,
                    transition: { duration: 1 }
                  }}
                  style={{
                    border: `2px solid ${themeConfig.accentColor}`,
                    boxShadow: `0 0 30px ${themeConfig.accentColor}`
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  initial={{ opacity: 0.3, scale: 0.98 }}
                  animate={{ 
                    opacity: 0,
                    scale: 1.05,
                    transition: { duration: 0.8, delay: 0.2 }
                  }}
                  style={{
                    border: `2px solid ${themeConfig.accentColor}`,
                    boxShadow: `0 0 20px ${themeConfig.accentColor}`
                  }}
                />

                {/* Sparkle effects */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 rounded-full"
                      initial={{ 
                        opacity: 0,
                        scale: 0,
                        x: '50%',
                        y: '50%'
                      }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                        x: ['50%', `${50 + (i - 1) * 30}%`],
                        y: ['50%', `${30 + i * 20}%`],
                        transition: { 
                          duration: 0.8,
                          delay: i * 0.2,
                          repeat: 1,
                          repeatDelay: 0.2
                        }
                      }}
                      style={{
                        background: themeConfig.accentColor,
                        boxShadow: `0 0 10px ${themeConfig.accentColor}`
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-5 relative">
                  <motion.div 
                    className="w-3 h-3 rounded-full" 
                    animate={{
                      scale: [1, 1.2, 1],
                      transition: {
                        duration: 0.6,
                        repeat: 1,
                        repeatDelay: 0.2
                      }
                    }}
                    style={{ 
                      backgroundColor: themeConfig.accentColor,
                      boxShadow: '0 0 10px rgba(224, 86, 253, 0.5)'
                    }} 
                  />
                  <motion.span 
                    className="text-5xl font-semibold tracking-tight"
                    animate={{
                      color: [themeConfig.textColor, themeConfig.accentColor, themeConfig.textColor],
                    }}
                    transition={{
                      duration: 0.6,
                      delay: 0.3
                    }}
                    style={{ color: themeConfig.textColor }}
                  >
                    {latestDonation.name}
                  </motion.span>
                </div>
                <motion.span 
                  className="text-5xl font-bold"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: {
                      duration: 0.4,
                      delay: 0.2
                    }
                  }}
                  style={{ color: themeConfig.accentColor }}
                >
                  ${latestDonation.amount.toLocaleString()}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Grid of Donations */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {displayDonations.map((donation, index) => (
            <motion.div
              key={donation.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05
              }}
              className="rounded-xl p-6 relative group"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                backdropFilter: 'blur(12px)',
                boxShadow: 'inset 0 2px rgba(255, 255, 255, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden'
              }}
            >
              {/* Card shine effect */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{
                  background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                  transform: 'translateX(-100%)',
                  animation: 'cardShine 2s infinite',
                  pointerEvents: 'none'
                }}
              />
              <div 
                className="text-xl mb-3 truncate font-medium" 
                style={{ color: themeConfig.textColor }}
              >
                {donation.name}
              </div>
              <div className="flex items-center justify-between">
                <div 
                  className="text-2xl font-bold" 
                  style={{ color: themeConfig.accentColor }}
                >
                  ${donation.amount.toLocaleString()}
                </div>
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ 
                    backgroundColor: themeConfig.accentColor,
                    boxShadow: '0 0 8px rgba(224, 86, 253, 0.4)'
                  }} 
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Logo at bottom */}
      {logoConfig && (
        <div className="flex justify-center mt-12 mb-4">
          <div className="relative" style={{ width: logoConfig.width, height: logoConfig.height }}>
            <Image
              src={logoConfig.url}
              alt="Event Logo"
              fill
              style={{ objectFit: 'contain' }}
              className="opacity-50 hover:opacity-70 transition-opacity duration-300"
            />
          </div>
        </div>
      )}

      {/* Debug info */}
      <div 
        className="fixed bottom-4 right-4 text-sm opacity-30" 
        style={{ color: themeConfig.textColor }}
      >
        Queue Active: {queue?.isActive ? 'Yes' : 'No'} | 
        Donations: {displayDonations.length}
      </div>

      {/* Add keyframe animations */}
      <style jsx global>{`
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(150%) skewX(-20deg); }
        }
        
        @keyframes cardShine {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(200%) rotate(45deg); }
        }
      `}</style>
    </div>
  );
} 