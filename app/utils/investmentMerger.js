import { INVESTMENT_TYPES } from '../models';

/**
 * Groups and merges investments with the same ticker/scheme name
 * @param {Array} investments - Raw investments array from Firestore
 * @return {Array} Merged investments array
 */
export const mergeInvestments = (investments) => {
  if (!investments || !investments.length) return [];
  
  // Create maps to group investments by ticker/scheme name
  const equityMap = new Map();
  const mutualFundMap = new Map();
  const sipMap = new Map();
  
  // Group investments
  investments.forEach(investment => {
    const { type, status } = investment;
    
    // Only merge active investments
    if (status !== 'Active') return;
    
    if (type === INVESTMENT_TYPES.EQUITY) {
      const key = investment.ticker;
      if (!equityMap.has(key)) {
        // First time seeing this ticker, initialize with a copy
        equityMap.set(key, {
          ...investment,
          // Add a subInvestments array to store the original investments
          subInvestments: [investment],
          // Mark as merged investment
          id: `merged_${key}`
        });
      } else {
        // Merge with existing investment
        const existing = equityMap.get(key);
        existing.shares += investment.shares;
        existing.investedAmount += investment.investedAmount;
        existing.subInvestments.push(investment);
        
        // Recalculate weighted average purchase price
        const totalCost = existing.subInvestments.reduce(
          (sum, inv) => sum + (inv.shares * inv.purchasePrice), 0
        );
        existing.purchasePrice = totalCost / existing.shares;
      }
    } else if (type === INVESTMENT_TYPES.MUTUAL_FUND || type === INVESTMENT_TYPES.SIP) {
      const map = type === INVESTMENT_TYPES.MUTUAL_FUND ? mutualFundMap : sipMap;
      const key = `${investment.fundHouse}_${investment.schemeName}`;
      
      if (!map.has(key)) {
        // First time seeing this scheme, initialize with a copy
        map.set(key, {
          ...investment,
          subInvestments: [investment],
          id: `merged_${key}`
        });
      } else {
        // Merge with existing investment
        const existing = map.get(key);
        existing.units += investment.units;
        existing.investedAmount += investment.investedAmount;
        existing.subInvestments.push(investment);
        
        // Recalculate weighted average purchase NAV
        const totalCost = existing.subInvestments.reduce(
          (sum, inv) => sum + (inv.units * inv.purchaseNAV), 0
        );
        existing.purchaseNAV = totalCost / existing.units;
      }
    }
  });
  
  // Convert maps back to arrays and combine with inactive investments
  const mergedEquities = Array.from(equityMap.values());
  const mergedMutualFunds = Array.from(mutualFundMap.values());
  const mergedSIPs = Array.from(sipMap.values());
  const inactiveInvestments = investments.filter(inv => inv.status !== 'Active');
  
  // Return all investments
  return [...mergedEquities, ...mergedMutualFunds, ...mergedSIPs, ...inactiveInvestments];
};

/**
 * Get original investments behind a merged investment
 * @param {Object} mergedInvestment - A merged investment
 * @param {Array} allInvestments - All raw investments from Firestore
 * @return {Array} Original investments that make up this merged investment
 */
export const getOriginalInvestments = (mergedInvestment, allInvestments) => {
  // If it's already a regular investment, return it wrapped in an array
  if (!mergedInvestment.id || !mergedInvestment.id.startsWith('merged_')) {
    return [mergedInvestment];
  }
  
  // If we have subInvestments already, return those
  if (mergedInvestment.subInvestments) {
    return mergedInvestment.subInvestments;
  }
  
  // Otherwise, find investments in the allInvestments array
  const { type } = mergedInvestment;
  
  if (type === INVESTMENT_TYPES.EQUITY) {
    return allInvestments.filter(
      inv => inv.type === type && 
            inv.ticker === mergedInvestment.ticker && 
            inv.status === 'Active'
    );
  } else if (type === INVESTMENT_TYPES.MUTUAL_FUND || type === INVESTMENT_TYPES.SIP) {
    return allInvestments.filter(
      inv => inv.type === type && 
            inv.schemeName === mergedInvestment.schemeName && 
            inv.fundHouse === mergedInvestment.fundHouse && 
            inv.status === 'Active'
    );
  }
  
  return [];
};