export interface Donation {
  id: string;
  name: string;
  amount: number;
  timestamp: string;
}

export interface DonationGoal {
  current: number;
  target: number;
}

export interface DonationQueue {
  donations: Donation[];
  currentIndex: number;
  isActive: boolean;
}

// For local storage keys
export const DONATION_STORAGE_KEY = 'donation_queue';
export const LOGO_STORAGE_KEY = 'eventmate_logo';
export const THEME_STORAGE_KEY = 'eventmate_theme';
export const GOAL_STORAGE_KEY = 'eventmate_goal';

export interface LogoConfig {
  url: string;
  width: number;
  height: number;
}

export interface ThemeConfig {
  primaryColor: string;   // Main gradient start color
  secondaryColor: string; // Main gradient end color
  accentColor: string;    // For highlights and important elements
  textColor: string;      // For main text color
} 