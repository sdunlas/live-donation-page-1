// List of mock names for random generation
const names = [
  'Bruce Banner', 'Tony Stark', 'Steve Rogers', 'Betty Carter',
  'Natasha Romanoff', 'Peter Parker', 'Carol Danvers', 'Stephen Strange',
  'Wanda Maximoff', 'Scott Lang', 'Hope van Dyne', 'T\'Challa',
  'Shuri', 'Sam Wilson', 'Bucky Barnes', 'Clint Barton'
];

// Generate a random donation amount between min and max
export const getRandomAmount = (min: number = 5, max: number = 5000): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Get a random name from the list
export const getRandomName = (): string => {
  return names[Math.floor(Math.random() * names.length)];
};

// Generate a random donation
export const generateRandomDonation = () => ({
  id: Math.random().toString(36).substr(2, 9),
  name: getRandomName(),
  amount: getRandomAmount(),
  timestamp: new Date()
}); 