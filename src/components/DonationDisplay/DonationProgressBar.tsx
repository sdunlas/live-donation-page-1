'use client';

import { motion } from 'framer-motion';

interface Props {
  current: number;
  target: number;
}

export default function DonationProgressBar({ current, target }: Props) {
  const progress = Math.min((current / target) * 100, 100);

  return (
    <div className="relative w-full h-6 bg-purple-100 rounded-full overflow-hidden">
      <motion.div
        className="absolute h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600"
        style={{
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s linear infinite'
        }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      <div className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-shine" />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">
        {progress.toFixed(1)}%
      </div>
    </div>
  );
}

export const shimmerAnimation = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes shine {
    from { transform: translateX(-100%); }
    to { transform: translateX(100%); }
  }
`; 