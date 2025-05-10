import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fundHousesData from '../data/fundHouses.json';
import schemeNamesData from '../data/schemeNames.json';
import { checkAndUpdateData } from './dataUpdateScheduler';

// File paths for local data cache
const fundHousesJsonPath = FileSystem.documentDirectory + 'fundHouses.json';
const schemeNamesJsonPath = FileSystem.documentDirectory + 'schemeNames.json';

// Keys for AsyncStorage
const CACHED_DATA_INITIALIZED_KEY = 'mutual_fund_cache_initialized';

/**
 * Initializes the local data cache from bundled data files
 * @returns {Promise<void>}
 */
export const initializeDataCache = async () => {
  try {
    // Check if data is already initialized
    const initialized = await AsyncStorage.getItem(CACHED_DATA_INITIALIZED_KEY);
    if (initialized === 'true') {
      console.log('Data cache already initialized');
      return;
    }
    
    console.log('Initializing data cache from bundled data...');
    
    // Write fund houses data to cache
    await FileSystem.writeAsStringAsync(
      fundHousesJsonPath,
      JSON.stringify(fundHousesData)
    );
    console.log('Fund houses data written to cache');
    
    // Write scheme names data to cache
    await FileSystem.writeAsStringAsync(
      schemeNamesJsonPath,
      JSON.stringify(schemeNamesData)
    );
    console.log('Scheme names data written to cache');
    
    // Mark as initialized
    await AsyncStorage.setItem(CACHED_DATA_INITIALIZED_KEY, 'true');
    console.log('Data cache initialization complete');
  } catch (error) {
    console.error('Error initializing data cache:', error);
  }
};

/**
 * Gets fund houses from the cache
 * @returns {Promise<Array>} Array of fund house names
 */
export const getCachedFundHouses = async () => {
  try {
    const fileExists = await FileSystem.getInfoAsync(fundHousesJsonPath);
    
    if (fileExists.exists) {
      const content = await FileSystem.readAsStringAsync(fundHousesJsonPath);
      return JSON.parse(content);
    } else {
      console.log('No cached fund houses found, using bundled data');
      return fundHousesData;
    }
  } catch (error) {
    console.error('Error reading cached fund houses:', error);
    return fundHousesData;
  }
};

/**
 * Gets scheme names from the cache
 * @returns {Promise<Object>} Object with fund houses as keys and arrays of schemes as values
 */
export const getCachedSchemeNames = async () => {
  try {
    const fileExists = await FileSystem.getInfoAsync(schemeNamesJsonPath);
    
    if (fileExists.exists) {
      const content = await FileSystem.readAsStringAsync(schemeNamesJsonPath);
      return JSON.parse(content);
    } else {
      console.log('No cached scheme names found, using bundled data');
      return schemeNamesData;
    }
  } catch (error) {
    console.error('Error reading cached scheme names:', error);
    return schemeNamesData;
  }
};

/**
 * Initialize the data cache and check for updates
 * Should be called on app startup
 */
export const initializeAndUpdateData = async () => {
  try {
    // Initialize cache from bundled data if needed
    await initializeDataCache();
    
    // Check for updates (will only happen on Sundays at 10AM IST)
    await checkAndUpdateData();
  } catch (error) {
    console.error('Error in initializeAndUpdateData:', error);
  }
};
