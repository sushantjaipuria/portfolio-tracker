/**
 * This is a utility script to import mutual fund data from Firestore to local JSON files
 * Run this script whenever you want to update the bundled data files
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../app/utils/firebase';
import * as FileSystem from 'expo-file-system';
import path from 'path';

// Collection names in Firestore
const COLLECTIONS = {
  MUTUAL_FUND_DATA: 'mutualFundData',
  FUND_HOUSES: 'fundHouses'
};

// Field names in Firestore documents
const FIELDS = {
  FUND_HOUSE_NAME: 'name'
};

// Path to local data files
const DATA_DIR = '../app/data';
const FUND_HOUSES_FILE = path.join(DATA_DIR, 'fundHouses.json');
const SCHEME_NAMES_FILE = path.join(DATA_DIR, 'schemeNames.json');

/**
 * Fetch all fund houses from Firestore
 */
const fetchAllFundHouses = async () => {
  try {
    console.log('Fetching fund houses from Firestore...');
    
    const snapshot = await getDocs(collection(db, COLLECTIONS.FUND_HOUSES));
    
    const fundHouses = snapshot.docs.map(doc => {
      const data = doc.data();
      return data[FIELDS.FUND_HOUSE_NAME] || doc.id;
    });
    
    return fundHouses.sort();
  } catch (error) {
    console.error('Error fetching fund houses:', error);
    throw error;
  }
};

/**
 * Fetch all scheme names for all fund houses from Firestore
 */
const fetchAllSchemeNames = async (fundHouses) => {
  try {
    console.log('Fetching scheme names from Firestore...');
    
    const result = {};
    
    // Process fund houses in batches to avoid overloading Firestore
    const batchSize = 5;
    for (let i = 0; i < fundHouses.length; i += batchSize) {
      const batch = fundHouses.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (fundHouse) => {
        console.log(`Fetching schemes for: ${fundHouse}`);
        
        const schemeQuery = query(
          collection(db, COLLECTIONS.MUTUAL_FUND_DATA),
          where('fundHouse', '==', fundHouse)
        );
        
        const snapshot = await getDocs(schemeQuery);
        
        result[fundHouse] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            schemeName: data.schemeName,
            schemeCode: data.schemeCode || '',
            isin: data.isin || ''
          };
        });
        
        console.log(`Found ${result[fundHouse].length} schemes for ${fundHouse}`);
      }));
      
      console.log(`Processed ${i + batch.length}/${fundHouses.length} fund houses`);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching scheme names:', error);
    throw error;
  }
};

/**
 * Write data to JSON files
 */
const writeToJsonFiles = async (fundHouses, schemeNames) => {
  try {
    console.log('Writing data to JSON files...');
    
    // Write fund houses to file
    await FileSystem.writeAsStringAsync(
      FUND_HOUSES_FILE,
      JSON.stringify(fundHouses, null, 2)
    );
    
    // Write scheme names to file
    await FileSystem.writeAsStringAsync(
      SCHEME_NAMES_FILE,
      JSON.stringify(schemeNames, null, 2)
    );
    
    console.log('Data successfully written to JSON files:');
    console.log(`- Fund houses: ${fundHouses.length}`);
    console.log(`- Fund houses with schemes: ${Object.keys(schemeNames).length}`);
    console.log(`- Total schemes: ${Object.values(schemeNames).reduce((total, schemes) => total + schemes.length, 0)}`);
  } catch (error) {
    console.error('Error writing to JSON files:', error);
    throw error;
  }
};

/**
 * Main function to import data
 */
const importData = async () => {
  try {
    // Fetch fund houses
    const fundHouses = await fetchAllFundHouses();
    console.log(`Fetched ${fundHouses.length} fund houses`);
    
    // Fetch scheme names
    const schemeNames = await fetchAllSchemeNames(fundHouses);
    console.log(`Fetched schemes for ${Object.keys(schemeNames).length} fund houses`);
    
    // Write to JSON files
    await writeToJsonFiles(fundHouses, schemeNames);
    
    console.log('Data import completed successfully!');
  } catch (error) {
    console.error('Error importing data:', error);
  }
};

// Execute the import
importData();
