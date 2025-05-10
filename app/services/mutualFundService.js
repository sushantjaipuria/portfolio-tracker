import { 
  searchLocalFundHouses, 
  searchLocalSchemeNames, 
  hasFundHouseInLocalData, 
  hasSchemeInLocalData 
} from './localMutualFundService';



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
    
    // Only use local data for searching fund houses
    const localMatches = await searchLocalFundHouses(searchText);
    console.log(`Found ${localMatches.length} fund houses in local data`);
    
    // Return up to 10 matches from local data only
    const result = localMatches.slice(0, 10);
    console.log('Returning local matches:', result);
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
    
    // Only use local data for searching scheme names
    const localMatches = await searchLocalSchemeNames(fundHouse, searchText);
    console.log(`Found ${localMatches.length} schemes in local data for "${fundHouse}"`);
    
    // Return up to 10 unique schemes from local data only
    const schemeMap = new Map();
    localMatches.forEach(scheme => {
      if (!schemeMap.has(scheme.schemeName)) {
        schemeMap.set(scheme.schemeName, scheme);
      }
    });
    
    return Array.from(schemeMap.values()).slice(0, 10);
  } catch (error) {
    console.error('Error searching scheme names:', error);
    return [];
  }
};