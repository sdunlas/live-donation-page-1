'use client';

import { useState, useEffect } from 'react';
import { 
  Donation, 
  DONATION_STORAGE_KEY, 
  DonationQueue, 
  LOGO_STORAGE_KEY, 
  LogoConfig,
  THEME_STORAGE_KEY,
  ThemeConfig,
  GOAL_STORAGE_KEY,
  DonationGoal
} from '@/types/donation';
import { parseDonationCSV } from '@/utils/csvParser';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

// Predefined color schemes that work well together
const colorSchemes = [
  {
    name: 'Royal Purple',
    primaryColor: '#4B0082', // Deeper indigo purple
    secondaryColor: '#2D004F', // Darker purple
    accentColor: '#FF69B4', // Bright pink
    textColor: '#FFF' // Pure white for better contrast
  },
  {
    name: 'Ocean Blue',
    primaryColor: '#1e40af',
    secondaryColor: '#1e3a8a',
    accentColor: '#60a5fa',
    textColor: '#fff'
  },
  {
    name: 'Forest Green',
    primaryColor: '#064e3b',
    secondaryColor: '#065f46',
    accentColor: '#34d399',
    textColor: '#fff'
  },
  {
    name: 'Sunset Orange',
    primaryColor: '#7c2d12',
    secondaryColor: '#9a3412',
    accentColor: '#fb923c',
    textColor: '#fff'
  },
  {
    name: 'Night Sky',
    primaryColor: '#1e293b',
    secondaryColor: '#0f172a',
    accentColor: '#38bdf8',
    textColor: '#fff'
  },
  {
    name: 'Light Theme',
    primaryColor: '#f3e8ff',
    secondaryColor: '#e9d5ff',
    accentColor: '#9333ea',
    textColor: '#4c1d95'
  }
];

const defaultTheme = colorSchemes[0]; // Royal Purple is default

export default function AdminPage() {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [logoConfig, setLogoConfig] = useState<LogoConfig | null>(null);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(defaultTheme);
  const [goalAmount, setGoalAmount] = useState('0');
  const [queueStatus, setQueueStatus] = useState<{
    totalDonations: number;
    processedDonations: number;
    isActive: boolean;
  }>({ totalDonations: 0, processedDonations: 0, isActive: false });

  // Load initial queue status and configurations
  useEffect(() => {
    const loadQueueStatus = () => {
      const storedQueue = localStorage.getItem(DONATION_STORAGE_KEY);
      if (storedQueue) {
        const queue = JSON.parse(storedQueue) as DonationQueue;
        setQueueStatus({
          totalDonations: queue.donations.length,
          processedDonations: queue.currentIndex,
          isActive: queue.isActive
        });
        setIsActive(queue.isActive);
      }
    };

    // Load goal amount
    const storedGoal = localStorage.getItem(GOAL_STORAGE_KEY);
    if (storedGoal) {
      const goal = JSON.parse(storedGoal) as DonationGoal;
      setGoalAmount(goal.target.toString());
    }

    loadQueueStatus();
    const interval = setInterval(loadQueueStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load saved configurations
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

  const handleAddDonation = (e: React.FormEvent) => {
    e.preventDefault();
    
    const donation: Donation = {
      id: uuidv4(),
      name,
      amount: parseFloat(amount),
      timestamp: new Date().toISOString()
    };

    addDonationsToQueue([donation]);
    setName('');
    setAmount('');
  };

  const addDonationsToQueue = (newDonations: Donation[]) => {
    const storedQueue = localStorage.getItem(DONATION_STORAGE_KEY);
    let queue: DonationQueue;
    
    if (storedQueue) {
      queue = JSON.parse(storedQueue);
      queue.donations = [...queue.donations, ...newDonations];
    } else {
      queue = {
        donations: newDonations,
        currentIndex: 0,
        isActive: false
      };
    }
    
    console.log('Updating queue:', queue);
    localStorage.setItem(DONATION_STORAGE_KEY, JSON.stringify(queue));

    // Update status
    setQueueStatus(prev => ({
      ...prev,
      totalDonations: queue.donations.length
    }));

    // Show success message
    setUploadStatus(`Successfully added ${newDonations.length} donation(s) to queue`);
    setTimeout(() => setUploadStatus(''), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadStatus('Uploading...');
      const donations = await parseDonationCSV(file);
      addDonationsToQueue(donations);
      
      // Reset file input
      e.target.value = '';
    } catch (error) {
      setUploadStatus(`Error: ${error instanceof Error ? error.message : 'Failed to parse CSV'}`);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadStatus('Error: Please upload a valid image file (JPEG, PNG, GIF, or WEBP)');
      setTimeout(() => setUploadStatus(''), 5000);
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadStatus('Error: Image size should be less than 2MB');
      setTimeout(() => setUploadStatus(''), 5000);
      return;
    }

    try {
      setUploadStatus('Processing logo...');
      
      // Create a URL for the uploaded file
      const url = URL.createObjectURL(file);
      
      // Create an image element to get dimensions
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });

      // Validate dimensions
      if (img.width < 50 || img.height < 50) {
        setUploadStatus('Error: Image dimensions should be at least 50x50 pixels');
        URL.revokeObjectURL(url);
        setTimeout(() => setUploadStatus(''), 5000);
        return;
      }

      // Calculate dimensions while maintaining aspect ratio
      const targetHeight = 150;
      const width = (img.width * targetHeight) / img.height;
      
      // Save logo config
      const config: LogoConfig = {
        url,
        width: Math.round(width),
        height: targetHeight
      };
      
      localStorage.setItem(LOGO_STORAGE_KEY, JSON.stringify(config));
      setLogoConfig(config);
      setUploadStatus('Logo updated successfully! Refresh the donation page to see changes.');
      
      setTimeout(() => setUploadStatus(''), 5000);
    } catch (error) {
      console.error('Error processing logo:', error);
      setUploadStatus('Error: Failed to process the image. Please try another file.');
      setTimeout(() => setUploadStatus(''), 5000);
    }
  };

  const removeLogo = () => {
    if (logoConfig?.url) {
      URL.revokeObjectURL(logoConfig.url);
    }
    localStorage.removeItem(LOGO_STORAGE_KEY);
    setLogoConfig(null);
    setUploadStatus('Logo removed successfully!');
    setTimeout(() => setUploadStatus(''), 3000);
  };

  const applyColorScheme = (scheme: ThemeConfig) => {
    setThemeConfig(scheme);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(scheme));
    setUploadStatus('Theme updated successfully! Refresh the donation page to see changes.');
    setTimeout(() => setUploadStatus(''), 3000);
  };

  const toggleQueue = () => {
    const storedQueue = localStorage.getItem(DONATION_STORAGE_KEY);
    if (!storedQueue) {
      setUploadStatus('No donations in queue');
      return;
    }

    try {
      const queue: DonationQueue = JSON.parse(storedQueue);
      
      // Toggle active state
      queue.isActive = !queue.isActive;
      
      // If stopping, ensure we save the current progress
      if (!queue.isActive) {
        setUploadStatus('Queue stopped - progress saved');
      } else {
        setUploadStatus('Queue started');
      }

      // Save updated queue
      localStorage.setItem(DONATION_STORAGE_KEY, JSON.stringify(queue));
      
      // Update local state
      setIsActive(queue.isActive);
      setQueueStatus(prev => ({
        ...prev,
        isActive: queue.isActive
      }));
    } catch (error) {
      console.error('Error toggling queue:', error);
      setUploadStatus('Error updating queue status');
    }
  };

  const resetQueue = () => {
    if (!confirm('Are you sure you want to reset the queue? This will clear all donations and stop processing.')) return;
    
    try {
      // Create empty queue
      const emptyQueue: DonationQueue = { 
        donations: [], 
        currentIndex: 0, 
        isActive: false 
      };
      
      // Save to localStorage
      localStorage.setItem(DONATION_STORAGE_KEY, JSON.stringify(emptyQueue));
      
      // Update all local state
      setIsActive(false);
      setUploadStatus('Queue has been reset');
      setQueueStatus({
        totalDonations: 0,
        processedDonations: 0,
        isActive: false
      });

      // Clear any file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => {
        (input as HTMLInputElement).value = '';
      });

      // Force page reload after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error resetting queue:', error);
      setUploadStatus('Error resetting queue');
    }
  };

  const clearAllData = () => {
    if (!confirm('⚠️ WARNING: This will completely clear all data and reset everything. This action cannot be undone. Are you sure?')) return;
    
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Reset all state
      setIsActive(false);
      setName('');
      setAmount('');
      setQueueStatus({
        totalDonations: 0,
        processedDonations: 0,
        isActive: false
      });
      
      // Clear file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => {
        (input as HTMLInputElement).value = '';
      });
      
      // Show success message
      setUploadStatus('All data has been cleared. You can start fresh now.');

      // Force page reload after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error clearing data:', error);
      setUploadStatus('Error clearing data');
    }
  };

  const handleGoalUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    const goal: DonationGoal = {
      target: parseInt(goalAmount),
      current: 0 // This will be updated by the donation display components
    };

    localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(goal));
    setUploadStatus('Donation goal updated successfully! Refresh the donation pages to see changes.');
    setTimeout(() => setUploadStatus(''), 3000);
  };

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {uploadStatus && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
            uploadStatus.includes('Error') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {uploadStatus}
          </div>
        )}

        {/* Admin Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Admin Controls</h2>
            <button
              onClick={clearAllData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <span>🗑️</span>
              Clear All Data
            </button>
          </div>
        </div>

        {/* Queue Status */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Queue Status</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600">Total Donations</div>
              <div className="text-2xl font-bold text-purple-900">{queueStatus.totalDonations}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600">Processed</div>
              <div className="text-2xl font-bold text-purple-900">{queueStatus.processedDonations}</div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={toggleQueue}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                queueStatus.isActive
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {queueStatus.isActive ? 'Stop Queue' : 'Start Queue'}
            </button>
            
            <button
              onClick={resetQueue}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Reset Queue
            </button>
          </div>
        </div>

        {/* CSV Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Donations CSV</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV file (format: name,amount)
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Theme Customization */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Theme Settings</h2>
          
          {/* Predefined Themes */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.name}
                onClick={() => applyColorScheme(scheme)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  themeConfig.primaryColor === scheme.primaryColor
                    ? 'border-blue-500 shadow-lg scale-105'
                    : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className="h-20 rounded-lg mb-2 overflow-hidden">
                  <div 
                    className="w-full h-full"
                    style={{
                      background: `linear-gradient(to bottom right, ${scheme.primaryColor}, ${scheme.secondaryColor})`
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center p-2"
                         style={{
                           background: `linear-gradient(45deg, transparent 0%, ${scheme.accentColor}20 50%, transparent 100%)`
                         }}>
                      <div className="text-sm font-medium" style={{ color: scheme.textColor }}>
                        Preview
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">{scheme.name}</div>
              </button>
            ))}
          </div>

          {/* Custom Theme */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Custom Theme</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <input
                  type="color"
                  value={themeConfig.primaryColor}
                  onChange={(e) => applyColorScheme({
                    ...themeConfig,
                    primaryColor: e.target.value
                  })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <input
                  type="color"
                  value={themeConfig.secondaryColor}
                  onChange={(e) => applyColorScheme({
                    ...themeConfig,
                    secondaryColor: e.target.value
                  })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accent Color
                </label>
                <input
                  type="color"
                  value={themeConfig.accentColor}
                  onChange={(e) => applyColorScheme({
                    ...themeConfig,
                    accentColor: e.target.value
                  })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Color
                </label>
                <input
                  type="color"
                  value={themeConfig.textColor}
                  onChange={(e) => applyColorScheme({
                    ...themeConfig,
                    textColor: e.target.value
                  })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logo Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Logo Settings</h2>
          <div className="space-y-4">
            {logoConfig && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="relative" style={{ width: logoConfig.width, height: logoConfig.height }}>
                  <Image
                    src={logoConfig.url}
                    alt="Current logo"
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <button
                  onClick={removeLogo}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Logo
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleLogoUpload}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <ul className="text-sm text-gray-600 list-disc list-inside">
                  <li>Accepted formats: JPEG, PNG, GIF, WEBP</li>
                  <li>Maximum file size: 2MB</li>
                  <li>Minimum dimensions: 50x50 pixels</li>
                  <li>Recommended size: 200x100 pixels or smaller</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Donation Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Single Donation</h2>
          
          <form onSubmit={handleAddDonation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Donor Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add Donation
            </button>
          </form>
        </div>

        {/* Donation Goal Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Donation Goal Settings</h2>
          
          <form onSubmit={handleGoalUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal Amount ($)
              </label>
              <input
                type="number"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                min="1"
                step="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Update Goal Amount
            </button>
          </form>
        </div>
      </div>
    </main>
  );
} 