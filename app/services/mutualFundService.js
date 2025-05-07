import { 
  collection, 
  getDocs, 
  query, 
  where, 
  limit 
} from 'firebase/firestore';
import { db } from '../utils/firebase';

const COLLECTIONS = {
  MUTUAL_FUND_DATA: 'mutualFundData',
  FUND_HOUSES: 'fundHouses'
};

// Field names in our Firestore documents
const FIELDS = {
  FUND_HOUSE_NAME: 'name'
};

// Cache for fund house data - stores retrieved data to avoid repeated Firestore reads
let fundHouseCache = null;

/**
 * Get a list of all fund houses from the dedicated fundHouses collection
 * 
 * Purpose: This function fetches fund house names from the dedicated collection.
 * It uses a cache to avoid repeated database calls within a session.
 */
export const getAllFundHouses = async () => {
  console.log('Getting all fund houses...');
  try {
    // Return cached data if available
    if (fundHouseCache) {
      return fundHouseCache;
    }
    
    // Get all documents from the fundHouses collection
    const snapshot = await getDocs(collection(db, COLLECTIONS.FUND_HOUSES));
    console.log('Fund houses snapshot:', snapshot.size, 'documents found');
    
    // Extract fund house names from each document
    const fundHouses = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Fund house document:', doc.id, 'data:', data);
      // Check for the name field in the document
      if (!data[FIELDS.FUND_HOUSE_NAME]) {
        console.warn(`Fund house document ${doc.id} has no name field:`, data);
        // Return document ID as fallback if structured correctly (e.g., 'hdfc_mutual_fund' → 'HDFC Mutual Fund')
        return doc.id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
      return data[FIELDS.FUND_HOUSE_NAME];
    });
    
    // Sort alphabetically
    const result = fundHouses.sort();
    
    // Cache the result for future use
    fundHouseCache = result;
    
    console.log('Returning fund houses:', result);
    return result;
  } catch (error) {
    console.error('Error getting fund houses:', error);
    return [];
  }
};

/**
 * Search for fund houses matching a search term
 * 
 * Purpose: This function provides auto-suggestion capability for fund houses
 * by filtering names that contain the search text.
 */
export const searchFundHouses = async (searchText) => {
  console.log('Searching fund houses for:', searchText);
  try {
    if (!searchText || searchText.trim() === '') {
      return [];
    }
    
    // Get all fund houses (from cache if available)
    const allFundHouses = await getAllFundHouses();
    
    // Filter fund houses that include the search text (case insensitive)
    const searchLower = searchText.toLowerCase();
    console.log('Search text lowercase:', searchLower);
    console.log('All fund houses:', allFundHouses);
    const matches = allFundHouses.filter(fundHouse => {
      if (!fundHouse) {
        console.log('Warning: Undefined fund house name found');
        return false;
      }
      const match = fundHouse.toLowerCase().includes(searchLower);
      console.log(`Fund house: "${fundHouse}", matches: ${match}`);
      return match;
    });
    
    // Return up to 10 matches
    const result = matches.slice(0, 10);
    console.log('Returning matches:', result);
    return result;
  } catch (error) {
    console.error('Error searching fund houses:', error);
    return [];
  }
};

/**
 * Search for scheme names based on fund house
 * 
 * Purpose: This function fetches scheme names for a specific fund house
 * that match the search text, enabling the second-level auto-suggestion.
 */
export const searchSchemeNames = async (fundHouse, searchText) => {
  try {
    if (!fundHouse || !searchText || searchText.trim() === '') {
      return [];
    }
    
    // Create query to filter by fund house and limit results
    let schemeQuery;
    
    if (searchText.length < 3) {
      // If fewer than 3 characters, just filter by fund house and limit results
      schemeQuery = query(
        collection(db, COLLECTIONS.MUTUAL_FUND_DATA),
        where('fundHouse', '==', fundHouse),
        limit(10)
      );
    } else {
      // If 3+ characters, we still need to query all matching fund house records
      // because Firestore doesn't support substring queries directly
      schemeQuery = query(
        collection(db, COLLECTIONS.MUTUAL_FUND_DATA),
        where('fundHouse', '==', fundHouse)
      );
    }
    
    // Execute the query
    const snapshot = await getDocs(schemeQuery);
    
    // Filter results client-side if search text is provided
    const searchLower = searchText.toLowerCase();
    const schemes = snapshot.docs
      .map(doc => doc.data().schemeName)
      .filter(schemeName => schemeName.toLowerCase().includes(searchLower));
    
    // Return up to 10 unique scheme names
    return [...new Set(schemes)].slice(0, 10);
  } catch (error) {
    console.error('Error searching scheme names:', error);
    return [];
  }
};