import { Donation } from '@/types/donation';
import { v4 as uuidv4 } from 'uuid';

export async function parseDonationCSV(file: File): Promise<Donation[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        
        // Remove header row and empty lines
        const dataLines = lines.slice(1).filter(line => line.trim() !== '');
        
        const donations: Donation[] = dataLines.map(line => {
          // Split by comma, handling possible quotes
          const [name, amountStr] = line.split(',').map(field => 
            field.trim().replace(/^"|"$/g, '') // Remove quotes if present
          );
          
          // Convert amount string to number, removing any currency symbols
          const amount = parseFloat(amountStr.replace(/[$,]/g, ''));
          
          if (isNaN(amount)) {
            throw new Error(`Invalid amount format in line: ${line}`);
          }
          
          return {
            id: uuidv4(),
            name,
            amount,
            timestamp: new Date().toISOString()
          };
        });
        
        resolve(donations);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading CSV file'));
    };
    
    reader.readAsText(file);
  });
} 