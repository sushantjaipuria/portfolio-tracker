import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants for AsyncStorage keys
const LAST_DATA_UPDATE_KEY = 'last_mutual_fund_data_update';
const DATA_VERSION_KEY = 'mutual_fund_data_version';
const CURRENT_DATA_VERSION = '1'; // Increment this when data structure changes

// Collection names in Firestore
const COLLECTIONS = {
  MUTUAL_FUND_DATA: 'mutualFundData',
  FUND_HOUSES: 'fundHouses'
};

// Field names in Firestore documents
const FIELDS = {
  FUND_HOUSE_NAME: 'name'
};

// File paths for local data cache in the app's persistent storage
const fundHousesJsonPath = FileSystem.documentDirectory + 'fundHouses.json';
const schemeNamesJsonPath = FileSystem.documentDirectory + 'schemeNames.json';

/**
 * Checks if it's time to update the data (Sunday at 10AM IST)
 * @returns {boolean} True if it's time to update the data
 */
export const isTimeToUpdateData = () => {
  const now = new Date();
  const indianTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
  
  // Check if it's Sunday (0) and time is between 10AM and 11AM IST
  return (
    indianTime.getUTCDay() === 0 && // Sunday
    indianTime.getUTCHours() >= 4 && // 10AM IST = 4:30 UTC
    indianTime.getUTCHours() < 5 // Before 11AM IST = 5:30 UTC
  );
};

/**
 * Checks if the data should be updated based on last update time
 * @returns {Promise<boolean>} True if data should be updated
 */
export const shouldUpdateData = async () => {
  try {
    // Check when the data was last updated
    const lastUpdateStr = await AsyncStorage.getItem(LAST_DATA_UPDATE_KEY);
    if (!lastUpdateStr) {
      console.log('No last update record found, update needed');
      return true;
    }
    
    const lastUpdate = new Date(lastUpdateStr);
    const now = new Date();
    
    // Check if it's been at least a week since the last update
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    if (now.getTime() - lastUpdate.getTime() >= weekInMs) {
      console.log('Data is over a week old, update needed');
      return isTimeToUpdateData();
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if data should be updated:', error);
    return false;
  }
};

/**
 * Fetches all fund houses from Firestore and updates the local file
 * @returns {Promise<string[]>} Array of fund house names
 */
export const updateFundHouses = async () => {
  console.log('Updating fund houses from Firestore...');
  try {
    // Fetch all fund houses from Firestore
    const snapshot = await getDocs(collection(db, COLLECTIONS.FUND_HOUSES));
    console.log('Fund houses snapshot:', snapshot.size, 'documents found');
    
    // Extract fund house names
    const fundHouses = snapshot.docs.map(doc => {
      const data = doc.data();
      if (!data[FIELDS.FUND_HOUSE_NAME]) {
        console.warn(`Fund house document ${doc.id} has no name field`);
        return doc.id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
      return data[FIELDS.FUND_HOUSE_NAME];
    }).sort();
    
    // Write the data to the local file
    await FileSystem.writeAsStringAsync(
      fundHousesJsonPath,
      JSON.stringify(fundHouses, null, 2)
    );
    
    console.log(`Updated ${fundHouses.length} fund houses in local data`);
    return fundHouses;
  } catch (error) {
    console.error('Error updating fund houses:', error);
    throw error;
  }
};

/**
 * Fetches schemes for all fund houses and updates the local file
 * @param {string[]} fundHouses - Array of fund house names
 * @returns {Promise<void>}
 */
export const updateSchemeNames = async (fundHouses) => {
  console.log('Updating scheme names from Firestore...');
  
  try {
    // Initialize empty object to store all schemes by fund house
    const allSchemes = {};
    
    // Get schemes for each fund house
    for (const fundHouse of fundHouses) {
      console.log(`Fetching schemes for ${fundHouse}...`);
      
      // Query schemes for this fund house
      const schemeQuery = query(
        collection(db, COLLECTIONS.MUTUAL_FUND_DATA),
        where('fundHouse', '==', fundHouse)
      );
      
      const snapshot = await getDocs(schemeQuery);
      
      // Extract schemes from the snapshot
      const schemes = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          schemeName: data.schemeName,
          schemeCode: data.schemeCode,
          isin: data.isin
        };
      });
      
      allSchemes[fundHouse] = schemes;
      console.log(`Found ${schemes.length} schemes for ${fundHouse}`);
    }
    
    // Write the data to the local file
    await FileSystem.writeAsStringAsync(
      schemeNamesJsonPath,
      JSON.stringify(allSchemes, null, 2)
    );
    
    console.log('Updated all scheme names in local data');
  } catch (error) {
    console.error('Error updating scheme names:', error);
    throw error;
  }
};

/**
 * Updates both fund houses and scheme names data from Firestore
 * @returns {Promise<void>}
 */
export const updateAllData = async () => {
  try {
    console.log('Starting complete data update from Firestore...');
    
    // Update fund houses first
    const fundHouses = await updateFundHouses();
    
    // Then update scheme names for all fund houses
    await updateSchemeNames(fundHouses);
    
    // Update the last update time and version
    await AsyncStorage.setItem(LAST_DATA_UPDATE_KEY, new Date().toISOString());
    await AsyncStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
    
    console.log('Data update completed successfully');
  } catch (error) {
    console.error('Error updating data:', error);
  }
};

/**
 * Checks and updates the data if needed
 * Should be called on app startup
 */
export const checkAndUpdateData = async () => {
  try {
    if (await shouldUpdateData()) {
      console.log('Data update is needed and it is the scheduled time, updating...');
      await updateAllData();
    } else {
      console.log('Data update not needed or not the scheduled time');
    }
  } catch (error) {
    console.error('Error checking and updating data:', error);
  }
};
