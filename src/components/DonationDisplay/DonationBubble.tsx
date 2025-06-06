'use client';

import { motion } from 'framer-motion';
import { Donation } from '@/types/donation';

interface Props {
  donation: Donation;
  isNew: boolean;
  position: number;
  total: number;
}

export default function DonationBubble({ donation, isNew, position, total }: Props) {
  // Calculate vertical spacing
  const verticalSpacing = 120 / (total + 1); // Increased spacing between bubbles
  const yPos = verticalSpacing * (position + 1);

  // Calculate horizontal position with controlled randomness
  const xPos = Math.random() * 30 + 35; // 35-65% of screen width for better centering

  const bubbleVariants = {
    initial: {
      opacity: 0,
      scale: 0.8,
      x: '-50%',
      y: '100vh',
    },
    animate: {
      opacity: [0, 1, 1, 0],
      scale: [0.8, 1, 1, 0.8],
      y: [`100vh`, `${yPos}%`, `${yPos}%`, `-20vh`],
      transition: {
        duration: 8,
        times: [0, 0.2, 0.8, 1],
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      className="absolute left-1/2"
      style={{ x: '-50%' }}
      variants={bubbleVariants}
      initial="initial"
      animate="animate"
    >
      <div 
        className={`
          flex items-center gap-6 px-12 py-6 rounded-3xl
          ${isNew 
            ? 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 text-white shadow-2xl shadow-purple-500/30 scale-110' 
            : 'bg-white/95 shadow-lg border border-purple-100 backdrop-blur-sm'
          }
          transition-all duration-500
        `}
      >
        <div className="flex items-center gap-6">
          {isNew && (
            <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
          )}
          <span className="font-medium text-2xl whitespace-nowrap">{donation.name}</span>
          <span className={`
            font-bold text-2xl whitespace-nowrap
            ${isNew ? 'text-white' : 'text-purple-600'}
          `}>
            ${donation.amount.toLocaleString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
} 