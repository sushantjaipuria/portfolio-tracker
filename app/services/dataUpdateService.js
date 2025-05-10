import * as FileSystem from 'expo-file-system';
import { initializeAndUpdateData } from '../utils/dataLoader';
import { checkAndUpdateData } from '../utils/dataUpdateScheduler';
import fundHousesData from '../data/fundHouses.json';
import schemeNamesData from '../data/schemeNames.json';

// File paths for local data cache in app's persistent storage
const fundHousesJsonPath = FileSystem.documentDirectory + 'fundHouses.json';
const schemeNamesJsonPath = FileSystem.documentDirectory + 'schemeNames.json';

/**
 * Copies bundled data files to app's document directory for persistence
 * This allows us to read/write them later when updating from Firestore
 */
export const copyBundledDataToDocuments = async () => {
  try {
    console.log('Checking if data needs to be copied to documents directory...');
    
    // Check if fund houses file exists in document directory
    const fundHousesInfo = await FileSystem.getInfoAsync(fundHousesJsonPath);
    
    if (!fundHousesInfo.exists) {
      console.log('Fund houses file not found in documents directory, copying from bundle...');
      
      // Write bundled fund houses to document directory
      await FileSystem.writeAsStringAsync(
        fundHousesJsonPath,
        JSON.stringify(fundHousesData)
      );
      
      console.log('Fund houses data copied successfully');
    }
    
    // Check if scheme names file exists in document directory
    const schemeNamesInfo = await FileSystem.getInfoAsync(schemeNamesJsonPath);
    
    if (!schemeNamesInfo.exists) {
      console.log('Scheme names file not found in documents directory, copying from bundle...');
      
      // Write bundled scheme names to document directory
      await FileSystem.writeAsStringAsync(
        schemeNamesJsonPath,
        JSON.stringify(schemeNamesData)
      );
      
      console.log('Scheme names data copied successfully');
    }
    
    // Initialize data loader
    await initializeAndUpdateData();
    
  } catch (error) {
    console.error('Error copying bundled data to documents directory:', error);
  }
};

/**
 * Schedules weekly data updates
 * This will check if it's Sunday at 10AM IST and update the data if needed
 */
export const scheduleDataUpdates = () => {
  // Check for updates immediately in case we're starting the app at the scheduled time
  checkAndUpdateData();
  
  // Check every hour if it's time to update
  const intervalId = setInterval(() => {
    checkAndUpdateData();
  }, 60 * 60 * 1000); // 1 hour in milliseconds
  
  // Return the interval ID in case we need to clear it
  return intervalId;
};
