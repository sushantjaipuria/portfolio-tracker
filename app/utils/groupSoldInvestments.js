import { INVESTMENT_TYPES } from '../models';

/**
 * Groups sold/inactive investments by scheme name and aggregates their sales data
 * @param {Array} inactiveInvestments - Array of inactive investments
 * @param {string} selectedType - Type of investment to filter (MUTUAL_FUND, SIP, EQUITY)
 * @return {Array} Array of grouped sold schemes with aggregated data
 */
export const groupSoldInvestments = (inactiveInvestments, selectedType) => {
  if (!inactiveInvestments || !inactiveInvestments.length) return [];
  
  // Filter by selected type
  const typeFilteredInvestments = inactiveInvestments.filter(
    investment => investment.type === selectedType
  );
  
  if (!typeFilteredInvestments.length) return [];
  
  // Create a map to group investments
  const groupedMap = new Map();
  
  typeFilteredInvestments.forEach(investment => {
    // Create a unique key based on investment type
    let groupKey;
    if (investment.type === INVESTMENT_TYPES.EQUITY) {
      groupKey = investment.ticker;
    } else {
      // For MUTUAL_FUND and SIP
      groupKey = `${investment.fundHouse}_${investment.schemeName}`;
    }
    
    if (!groupedMap.has(groupKey)) {
      // Initialize new group
      groupedMap.set(groupKey, {
        id: `sold_group_${groupKey}`,
        type: investment.type,
        schemeName: investment.type === INVESTMENT_TYPES.EQUITY ? 
          investment.ticker : investment.schemeName,
        fundHouse: investment.type === INVESTMENT_TYPES.EQUITY ? 
          null : investment.fundHouse,
        ticker: investment.type === INVESTMENT_TYPES.EQUITY ? 
          investment.ticker : null,
        totalUnitsSold: 0,
        totalSharesSold: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        salesHistory: [],
        originalInvestments: []
      });
    }
    
    const group = groupedMap.get(groupKey);
    
    // Add this investment to the group
    group.originalInvestments.push(investment);
    
    // Process sales history
    if (investment.salesHistory && investment.salesHistory.length > 0) {
      investment.salesHistory.forEach(sale => {
        // Convert Firestore timestamp to Date if needed
        let saleDate = sale.saleDate;
        if (saleDate && typeof saleDate.toDate === 'function') {
          saleDate = saleDate.toDate();
        } else if (!(saleDate instanceof Date)) {
          saleDate = new Date(saleDate);
        }
        
        // Add sale to group's sales history
        const saleEntry = {
          date: saleDate,
          units: investment.type === INVESTMENT_TYPES.EQUITY ? sale.shares : sale.units,
          salePrice: sale.salePrice,
          profit: sale.profit || 0,
          investmentId: investment.id
        };
        
        group.salesHistory.push(saleEntry);
        
        // Update totals
        if (investment.type === INVESTMENT_TYPES.EQUITY) {
          group.totalSharesSold += sale.shares || 0;
        } else {
          group.totalUnitsSold += sale.units || 0;
        }
        group.totalGainLoss += sale.profit || 0;
      });
    } else {
      // Handle case where investment is inactive but has no salesHistory
      // This happens when the entire investment was sold in one transaction
      // We can infer the sale details from the investment's sold* fields
      if (investment.soldDate) {
        let saleDate = investment.soldDate;
        if (saleDate && typeof saleDate.toDate === 'function') {
          saleDate = saleDate.toDate();
        } else if (!(saleDate instanceof Date)) {
          saleDate = new Date(saleDate);
        }
        
        const saleEntry = {
          date: saleDate,
          units: investment.type === INVESTMENT_TYPES.EQUITY ? 
            investment.soldShares || investment.shares : 
            investment.soldUnits || investment.units,
          salePrice: investment.type === INVESTMENT_TYPES.EQUITY ? 
            investment.soldPrice : investment.soldNAV,
          profit: 0, // Will be calculated below
          investmentId: investment.id
        };
        
        // Calculate profit for this sale
        if (investment.type === INVESTMENT_TYPES.EQUITY) {
          const saleValue = saleEntry.units * saleEntry.salePrice;
          const costBasis = investment.investedAmount;
          saleEntry.profit = saleValue - costBasis;
          group.totalSharesSold += saleEntry.units;
        } else {
          const saleValue = saleEntry.units * saleEntry.salePrice;
          const costBasis = investment.investedAmount;
          saleEntry.profit = saleValue - costBasis;
          group.totalUnitsSold += saleEntry.units;
        }
        
        group.salesHistory.push(saleEntry);
        group.totalGainLoss += saleEntry.profit;
      }
    }
  });
  
  // Convert map to array and finalize calculations
  const groupedSchemes = Array.from(groupedMap.values()).map(group => {
    // Sort sales history by date (most recent first)
    group.salesHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate total invested amount for percentage calculation
    const totalInvestedAmount = group.originalInvestments.reduce(
      (sum, inv) => sum + (parseInt(inv.investedAmount) || 0), 0
    );
    
    // Calculate percentage gain/loss
    if (totalInvestedAmount > 0) {
      const totalSaleValue = totalInvestedAmount + group.totalGainLoss;
      group.totalGainLossPercentage = (group.totalGainLoss / totalInvestedAmount) * 100;
    }
    
    return group;
  });
  
  // Sort groups by scheme name
  return groupedSchemes.sort((a, b) => a.schemeName.localeCompare(b.schemeName));
};

/**
 * Get the display name for a grouped sold scheme
 * @param {Object} groupedScheme - Grouped sold scheme object
 * @return {string} Display name
 */
export const getGroupedSchemeDisplayName = (groupedScheme) => {
  if (groupedScheme.type === INVESTMENT_TYPES.EQUITY) {
    return groupedScheme.ticker;
  } else {
    return `${groupedScheme.fundHouse} - ${groupedScheme.schemeName}`;
  }
};

/**
 * Format sale date for display
 * @param {Date} date - Sale date
 * @return {string} Formatted date string
 */
export const formatSaleDate = (date) => {
  if (!date) return '';
  
  const saleDate = date instanceof Date ? date : new Date(date);
  
  return saleDate.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};