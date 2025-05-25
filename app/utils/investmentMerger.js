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
        // First time seeing this ticker, initialize with proper aggregation
        const remainingShares = investment.remainingShares !== undefined ? 
          investment.remainingShares : investment.shares;
        const remainingInvested = investment.remainingShares !== undefined ?
          (remainingShares / investment.shares) * investment.investedAmount :
          investment.investedAmount;
          
        equityMap.set(key, {
          ...investment,
          totalOriginalShares: investment.shares,
          totalRemainingShares: remainingShares,
          totalOriginalInvested: investment.investedAmount,
          totalRemainingInvested: remainingInvested,
          shares: remainingShares, // For display compatibility
          investedAmount: remainingInvested, // For display compatibility
          subInvestments: [investment],
          id: `merged_${key}`
        });
      } else {
        // Add to existing ticker
        const existing = equityMap.get(key);
        const remainingShares = investment.remainingShares !== undefined ? 
          investment.remainingShares : investment.shares;
        const remainingInvested = investment.remainingShares !== undefined ?
          (remainingShares / investment.shares) * investment.investedAmount :
          investment.investedAmount;
          
        // Update totals
        existing.totalOriginalShares += investment.shares;
        existing.totalRemainingShares += remainingShares;
        existing.totalOriginalInvested += investment.investedAmount;
        existing.totalRemainingInvested += remainingInvested;
        
        // Update display values
        existing.shares = existing.totalRemainingShares;
        existing.investedAmount = existing.totalRemainingInvested;
        
        existing.subInvestments.push(investment);
        
        // Recalculate weighted average purchase price using remaining shares
        const totalCost = existing.subInvestments.reduce((sum, inv) => {
          const remShares = inv.remainingShares !== undefined ? inv.remainingShares : inv.shares;
          return sum + (remShares * inv.purchasePrice);
        }, 0);
        existing.purchasePrice = existing.totalRemainingShares > 0 ? 
          totalCost / existing.totalRemainingShares : existing.purchasePrice;
      }
    } else if (type === INVESTMENT_TYPES.MUTUAL_FUND || type === INVESTMENT_TYPES.SIP) {
      const map = type === INVESTMENT_TYPES.MUTUAL_FUND ? mutualFundMap : sipMap;
      const key = `${investment.fundHouse}_${investment.schemeName}`;
      
      if (!map.has(key)) {
        // First time seeing this scheme, initialize with proper aggregation
        const remainingUnits = investment.remainingUnits !== undefined ? 
          investment.remainingUnits : investment.units;
        const remainingInvested = investment.remainingUnits !== undefined ?
          (remainingUnits / investment.units) * investment.investedAmount :
          investment.investedAmount;
          
        map.set(key, {
          ...investment,
          totalOriginalUnits: investment.units,
          totalRemainingUnits: remainingUnits,
          totalOriginalInvested: investment.investedAmount,
          totalRemainingInvested: remainingInvested,
          units: remainingUnits, // For display compatibility
          investedAmount: remainingInvested, // For display compatibility
          subInvestments: [investment],
          id: `merged_${key}`
        });
      } else {
        // Add to existing scheme
        const existing = map.get(key);
        const remainingUnits = investment.remainingUnits !== undefined ? 
          investment.remainingUnits : investment.units;
        const remainingInvested = investment.remainingUnits !== undefined ?
          (remainingUnits / investment.units) * investment.investedAmount :
          investment.investedAmount;
          
        // Update totals
        existing.totalOriginalUnits += investment.units;
        existing.totalRemainingUnits += remainingUnits;
        existing.totalOriginalInvested += investment.investedAmount;
        existing.totalRemainingInvested += remainingInvested;
        
        // Update display values
        existing.units = existing.totalRemainingUnits;
        existing.investedAmount = existing.totalRemainingInvested;
        
        existing.subInvestments.push(investment);
        
        // Recalculate weighted average purchase NAV using remaining units
        const totalCost = existing.subInvestments.reduce((sum, inv) => {
          const remUnits = inv.remainingUnits !== undefined ? inv.remainingUnits : inv.units;
          return sum + (remUnits * inv.purchaseNAV);
        }, 0);
        existing.purchaseNAV = existing.totalRemainingUnits > 0 ? 
          totalCost / existing.totalRemainingUnits : existing.purchaseNAV;
      }
    }
  });
  
  // Add realized gains calculation to merged investments
  const addRealizedGains = (mergedInvestment) => {
    let totalRealizedGain = 0;
    if (mergedInvestment.subInvestments) {
      mergedInvestment.subInvestments.forEach(inv => {
        if (inv.salesHistory && inv.salesHistory.length > 0) {
          totalRealizedGain += inv.salesHistory.reduce((sum, sale) => sum + (sale.profit || 0), 0);
        }
      });
    }
    mergedInvestment.totalRealizedGain = totalRealizedGain;
    return mergedInvestment;
  };
  
  // Convert maps back to arrays and add realized gains
  const mergedEquities = Array.from(equityMap.values()).map(addRealizedGains);
  const mergedMutualFunds = Array.from(mutualFundMap.values()).map(addRealizedGains);
  const mergedSIPs = Array.from(sipMap.values()).map(addRealizedGains);
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