import { getCachedFundHouses, getCachedSchemeNames } from '../utils/dataLoader';

// Local runtime cache to optimize performance
let fundHouseCache = null;
let schemeNamesCache = null;

/**
 * Get all fund houses from the local data
 * 
 * @returns {Array} Array of fund house names
 */
export const getLocalFundHouses = async () => {
  // Return cached data if available
  if (fundHouseCache) {
    return fundHouseCache;
  }
  
  // Get data from the cache
  const fundHouses = await getCachedFundHouses();
  
  // Cache the result in memory for future use
  fundHouseCache = fundHouses;
  
  console.log('Local fund houses loaded:', fundHouses.length);
  return fundHouses;
};

/**
 * Search for fund houses matching a search term in local data
 * 
 * @param {string} searchText - The text to search for
 * @returns {Array} Array of matching fund house names
 */
export const searchLocalFundHouses = async (searchText) => {
  if (!searchText || searchText.trim() === '') {
    return [];
  }
  
  // Get all fund houses from local data
  const allFundHouses = await getLocalFundHouses();
  
  // Filter fund houses that include the search text (case insensitive)
  const searchLower = searchText.toLowerCase();
  const matches = allFundHouses.filter(fundHouse => {
    if (!fundHouse) {
      return false;
    }
    return fundHouse.toLowerCase().includes(searchLower);
  });
  
  console.log(`Local fund house search for "${searchText}" found ${matches.length} matches`);
  
  // Return up to 10 matches
  return matches.slice(0, 10);
};

/**
 * Search for scheme names based on fund house in local data
 * 
 * @param {string} fundHouse - The fund house to search within
 * @param {string} searchText - The text to search for
 * @returns {Array} Array of matching scheme objects
 */
export const searchLocalSchemeNames = async (fundHouse, searchText) => {
  if (!fundHouse || !searchText || searchText.trim() === '') {
    return [];
  }
  
  // Load scheme names data if not already cached
  if (!schemeNamesCache) {
    schemeNamesCache = await getCachedSchemeNames();
  }
  
  // Check if we have schemes for this fund house in our data
  if (!schemeNamesCache[fundHouse]) {
    console.log(`No local schemes found for fund house: ${fundHouse}`);
    return [];
  }
  
  // Get schemes for this fund house
  const schemes = schemeNamesCache[fundHouse];
  
  // Filter schemes that match the search text
  const searchLower = searchText.toLowerCase();
  const matchingSchemes = schemes.filter(scheme => 
    scheme.schemeName.toLowerCase().includes(searchLower)
  );
  
  console.log(`Local scheme search for "${searchText}" in "${fundHouse}" found ${matchingSchemes.length} matches`);
  
  // Return up to 10 unique schemes
  const schemeMap = new Map();
  matchingSchemes.forEach(scheme => {
    if (!schemeMap.has(scheme.schemeName)) {
      schemeMap.set(scheme.schemeName, scheme);
    }
  });
  
  return Array.from(schemeMap.values()).slice(0, 10);
};

/**
 * Utility function to check if a fund house exists in the local data
 * 
 * @param {string} fundHouse - The fund house name to check
 * @returns {boolean} True if the fund house exists in local data
 */
export const hasFundHouseInLocalData = async (fundHouse) => {
  if (!fundHouse) return false;
  const allFundHouses = await getLocalFundHouses();
  return allFundHouses.some(fh => fh.toLowerCase() === fundHouse.toLowerCase());
};

/**
 * Utility function to check if a scheme name exists in the local data for a specific fund house
 * 
 * @param {string} fundHouse - The fund house name to check within
 * @param {string} searchText - The scheme name text to look for
 * @returns {boolean} True if the scheme exists in local data
 */
export const hasSchemeInLocalData = async (fundHouse, searchText) => {
  if (!fundHouse || !searchText) return false;
  
  // Load scheme names data if not already cached
  if (!schemeNamesCache) {
    schemeNamesCache = await getCachedSchemeNames();
  }
  
  // Check if we have this fund house in our data
  if (!schemeNamesCache[fundHouse]) {
    return false;
  }
  
  // Check if the search text matches any scheme names
  const searchLower = searchText.toLowerCase();
  return schemeNamesCache[fundHouse].some(scheme => 
    scheme.schemeName.toLowerCase().includes(searchLower)
  );
};
