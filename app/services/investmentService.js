import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { INVESTMENT_TYPES, INVESTMENT_STATUS } from '../models';

const COLLECTIONS = {
  INVESTMENTS: 'investments'
};

// Create a new investment
export const addInvestment = async (investment) => {
  try {
    const investmentData = {
      ...investment,
      // Initialize remaining units/shares to match total
      remainingUnits: investment.type === INVESTMENT_TYPES.EQUITY ? undefined : investment.units,
      remainingShares: investment.type === INVESTMENT_TYPES.EQUITY ? investment.shares : undefined,
      salesHistory: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.INVESTMENTS), investmentData);
    return { id: docRef.id, ...investmentData };
  } catch (error) {
    console.error('Error adding investment:', error);
    throw error;
  }
};

// Get all investments
export const getAllInvestments = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.INVESTMENTS));
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Remove the empty id field from the document data to avoid overriding the Firestore ID
      const { id: _, ...restData } = data;
      // Return the object with the Firestore document ID
      return {
        id: doc.id,
        ...restData
      };
    });
  } catch (error) {
    console.error('Error getting investments:', error);
    throw error;
  }
};

// Get active investments by type
export const getInvestmentsByType = async (type, status = INVESTMENT_STATUS.ACTIVE) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.INVESTMENTS),
      where('type', '==', type),
      where('status', '==', status)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Remove the empty id field from the document data
      const { id: _, ...restData } = data;
      // Use the Firestore document ID instead
      return {
        id: doc.id,
        ...restData
      };
    });
  } catch (error) {
    console.error(`Error getting ${type} investments:`, error);
    throw error;
  }
};

// Get all sold/inactive investments
export const getSoldInvestments = async () => {
  try {
    const q = query(
      collection(db, COLLECTIONS.INVESTMENTS),
      where('status', '==', INVESTMENT_STATUS.INACTIVE)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Remove the empty id field from the document data
      const { id: _, ...restData } = data;
      // Use the Firestore document ID instead
      return {
        id: doc.id,
        ...restData
      };
    });
  } catch (error) {
    console.error('Error getting sold investments:', error);
    throw error;
  }
};

// Update an investment
export const updateInvestment = async (id, updates) => {
  try {
    const investmentRef = doc(db, COLLECTIONS.INVESTMENTS, id);
    await updateDoc(investmentRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating investment:', error);
    throw error;
  }
};

// Mark investment as sold with FIFO implementation
export const sellInvestment = async (id, sellData) => {
  try {
    // Get current investment document
    const investmentRef = doc(db, COLLECTIONS.INVESTMENTS, id);
    const investmentSnap = await getDoc(investmentRef);
    
    if (!investmentSnap.exists()) {
      throw new Error('Investment not found');
    }
    
    const investment = investmentSnap.data();
    
    // Determine sale details based on investment type
    let soldUnits, soldPrice, profit, remainingAfterSale;
    const isMutualFund = 
      investment.type === INVESTMENT_TYPES.MUTUAL_FUND || 
      investment.type === INVESTMENT_TYPES.SIP;
    
    if (isMutualFund) {
      soldUnits = parseFloat(sellData.soldUnits);
      soldPrice = parseInt(sellData.soldNAV); // In paise
      
      // Validate against remaining units
      const remainingUnits = investment.remainingUnits !== undefined ? 
        investment.remainingUnits : investment.units;
      
      if (soldUnits > remainingUnits) {
        throw new Error(`Cannot sell more than remaining ${remainingUnits} units`);
      }
      
      // Calculate profit/loss in paise
      const costBasis = (soldUnits / investment.units) * investment.investedAmount;
      const saleValue = soldUnits * soldPrice;
      profit = saleValue - costBasis;
      
      // Calculate remaining units after this sale
      remainingAfterSale = parseFloat((remainingUnits - soldUnits).toFixed(3));
    } else {
      // Equity investment
      soldUnits = parseInt(sellData.soldShares);
      soldPrice = parseInt(sellData.soldPrice); // In paise
      
      // Validate against remaining shares
      const remainingShares = investment.remainingShares !== undefined ? 
        investment.remainingShares : investment.shares;
        
      if (soldUnits > remainingShares) {
        throw new Error(`Cannot sell more than remaining ${remainingShares} shares`);
      }
      
      // Calculate profit/loss in paise
      const costBasis = (soldUnits / investment.shares) * investment.investedAmount;
      const saleValue = soldUnits * soldPrice;
      profit = saleValue - costBasis;
      
      // Calculate remaining shares after this sale
      remainingAfterSale = remainingShares - soldUnits;
    }
    
    // Create sale history entry
    const saleEntry = isMutualFund ? {
      units: soldUnits,
      salePrice: soldPrice,
      saleDate: new Date(sellData.soldDate),
      profit: profit
    } : {
      shares: soldUnits, // soldUnits is actually soldShares for equity
      salePrice: soldPrice,
      saleDate: new Date(sellData.soldDate),
      profit: profit
    };
    
    // Update the investment document
    const updates = {
      // Add to sales history array
      salesHistory: arrayUnion(saleEntry),
      // Update remaining units/shares
      ...(isMutualFund ? { remainingUnits: remainingAfterSale } : { remainingShares: remainingAfterSale }),
      // Set status to INACTIVE only if fully sold
      status: remainingAfterSale <= 0 ? INVESTMENT_STATUS.INACTIVE : INVESTMENT_STATUS.ACTIVE,
      updatedAt: serverTimestamp()
    };
    
    // If completely sold, set soldDate
    if (remainingAfterSale <= 0) {
      updates.soldDate = new Date(sellData.soldDate);
    }
    
    await updateDoc(investmentRef, updates);
    return true;
  } catch (error) {
    console.error('Error selling investment:', error);
    throw error;
  }
};

// Delete an investment (generally not recommended, better to mark as inactive)
export const deleteInvestment = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.INVESTMENTS, id));
    return true;
  } catch (error) {
    console.error('Error deleting investment:', error);
    throw error;
  }
};

// Add function to handle spillover sales (selling across multiple investments)
export const sellInvestmentWithSpillover = async (sellData) => {
  try {
    // Get all active investments of the target type sorted by purchase date (oldest first)
    const investmentType = sellData.investmentType;
    let q = query(
      collection(db, COLLECTIONS.INVESTMENTS),
      where('type', '==', investmentType),
      where('status', '==', INVESTMENT_STATUS.ACTIVE)
    );
    
    if (sellData.fundHouse && sellData.schemeName) {
      // For mutual funds/SIPs, add criteria for fund house and scheme
      q = query(q, 
        where('fundHouse', '==', sellData.fundHouse),
        where('schemeName', '==', sellData.schemeName)
      );
    } else if (sellData.ticker) {
      // For equities, add criteria for ticker
      q = query(q, where('ticker', '==', sellData.ticker));
    }
    
    const snapshot = await getDocs(q);
    const investments = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => a.purchaseDate.toDate() - b.purchaseDate.toDate()); // FIFO order
    
    // Track remaining units to sell
    let remainingToSell = sellData.isMutualFund ? 
      parseFloat(sellData.totalUnits) : 
      parseInt(sellData.totalShares);
    
    // Process each investment until all units are sold
    for (const investment of investments) {
      if (remainingToSell <= 0) break;
      
      // Determine how many units/shares can be sold from this investment
      const availableInThisInvestment = sellData.isMutualFund ? 
        (investment.remainingUnits !== undefined ? investment.remainingUnits : investment.units) : 
        (investment.remainingShares !== undefined ? investment.remainingShares : investment.shares);
      
      if (availableInThisInvestment <= 0) continue;
      
      // Calculate units to sell from this investment
      const unitsFromThisInvestment = Math.min(remainingToSell, availableInThisInvestment);
      
      // Prepare sale data for this specific investment
      const thisInvestmentSaleData = {
        ...(sellData.isMutualFund ? 
          { soldUnits: unitsFromThisInvestment, soldNAV: sellData.salePrice } : 
          { soldShares: unitsFromThisInvestment, soldPrice: sellData.salePrice }),
        soldDate: sellData.saleDate
      };
      
      // Sell from this investment
      await sellInvestment(investment.id, thisInvestmentSaleData);
      
      // Update remaining to sell
      remainingToSell -= unitsFromThisInvestment;
    }
    
    if (remainingToSell > 0) {
      throw new Error(`Could not sell all requested units/shares. ${remainingToSell} remaining.`);
    }
    
    return true;
  } catch (error) {
    console.error('Error in spillover sale:', error);
    throw error;
  }
};

// Calculate portfolio summary
export const calculatePortfolioSummary = (investments) => {
  const summary = {
    totalInvested: 0,
    totalCurrentValue: 0,
    totalRealizedGain: 0, // New field to track realized gains/losses
    percentageGain: 0,
    byType: {
      [INVESTMENT_TYPES.MUTUAL_FUND]: {
        totalInvested: 0,
        totalCurrentValue: 0,
        totalRealizedGain: 0, // New field
        percentageGain: 0
      },
      [INVESTMENT_TYPES.SIP]: {
        totalInvested: 0,
        totalCurrentValue: 0,
        totalRealizedGain: 0, // New field
        percentageGain: 0
      },
      [INVESTMENT_TYPES.EQUITY]: {
        totalInvested: 0,
        totalCurrentValue: 0,
        totalRealizedGain: 0, // New field
        percentageGain: 0
      }
    },
    // Add timeline-based summaries
    byTimeline: {
      beforeApril2025: {
        totalInvested: 0,
        totalCurrentValue: 0,
        totalRealizedGain: 0, // New field
        percentageGain: 0
      },
      afterApril2025: {
        totalInvested: 0,
        totalCurrentValue: 0,
        totalRealizedGain: 0, // New field
        percentageGain: 0
      }
    }
  };

  // Reference date: April 1, 2025
  const april2025 = new Date(2025, 3, 1); // Month is 0-indexed, so 3 = April

  // Calculate totals
  investments.forEach(investment => {
    const type = investment.type;
    const invested = parseInt(investment.investedAmount) || 0;
    
    // Calculate current value depending on investment type and use remaining units/shares
    let currentValue = 0;
    if (type === INVESTMENT_TYPES.MUTUAL_FUND || type === INVESTMENT_TYPES.SIP) {
      const remainingUnits = investment.remainingUnits !== undefined ? 
        investment.remainingUnits : parseFloat(investment.units) || 0;
      currentValue = remainingUnits * (parseFloat(investment.currentNAV) || 0);
    } else if (type === INVESTMENT_TYPES.EQUITY) {
      const remainingShares = investment.remainingShares !== undefined ? 
        investment.remainingShares : parseInt(investment.shares) || 0;
      currentValue = remainingShares * (parseInt(investment.currentPrice) || 0);
    }
    
    // Calculate realized gains from salesHistory
    let realizedGain = 0;
    if (investment.salesHistory && investment.salesHistory.length > 0) {
      realizedGain = investment.salesHistory.reduce((total, sale) => {
        return total + (sale.profit || 0);
      }, 0);
    }
    
    // Update realized gains in summary
    summary.totalRealizedGain += realizedGain;
    if (summary.byType[type]) {
      summary.byType[type].totalRealizedGain += realizedGain;
    }
    
    // Determine purchase date for timeline classification
    let purchaseDate;
    if (type === INVESTMENT_TYPES.SIP) {
      // For SIPs, use startDate as purchase date
      purchaseDate = investment.startDate;
    } else {
      // For other investments, use purchaseDate
      purchaseDate = investment.purchaseDate;
    }
    
    // Convert to JavaScript Date if it's a Firestore timestamp
    if (purchaseDate && typeof purchaseDate.toDate === 'function') {
      purchaseDate = purchaseDate.toDate();
    } else if (!(purchaseDate instanceof Date)) {
      purchaseDate = new Date(purchaseDate);
    }
    
    // Update timeline-based summary with realized gains
    if (purchaseDate < april2025) {
      summary.byTimeline.beforeApril2025.totalRealizedGain += realizedGain;
    } else {
      summary.byTimeline.afterApril2025.totalRealizedGain += realizedGain;
    }
    
    // Only include if there are remaining units/shares or no salesHistory yet (for compatibility)
    if ((currentValue > 0 || !investment.salesHistory) && investment.status === INVESTMENT_STATUS.ACTIVE) {
      // Update summary
      summary.totalInvested += invested;
      summary.totalCurrentValue += currentValue;
      
      // Update type-specific summary
      if (summary.byType[type]) {
        summary.byType[type].totalInvested += invested;
        summary.byType[type].totalCurrentValue += currentValue;
      }
      
      // Update timeline-based summary
      if (purchaseDate < april2025) {
        summary.byTimeline.beforeApril2025.totalInvested += invested;
        summary.byTimeline.beforeApril2025.totalCurrentValue += currentValue;
      } else {
        summary.byTimeline.afterApril2025.totalInvested += invested;
        summary.byTimeline.afterApril2025.totalCurrentValue += currentValue;
      }
    }
  });

  // Calculate percentage gains for overall (includes realized + unrealized)
  if (summary.totalInvested > 0) {
    summary.percentageGain = (((summary.totalCurrentValue + summary.totalRealizedGain) - summary.totalInvested) / summary.totalInvested) * 100;
  }

  // Calculate percentage gains for investment types
  Object.keys(summary.byType).forEach(type => {
    if (summary.byType[type].totalInvested > 0) {
      summary.byType[type].percentageGain = 
        (((summary.byType[type].totalCurrentValue + summary.byType[type].totalRealizedGain) - summary.byType[type].totalInvested) / 
          summary.byType[type].totalInvested) * 100;
    }
  });
  
  // Calculate percentage gains for timeline-based summaries
  if (summary.byTimeline.beforeApril2025.totalInvested > 0) {
    summary.byTimeline.beforeApril2025.percentageGain = 
      (((summary.byTimeline.beforeApril2025.totalCurrentValue + summary.byTimeline.beforeApril2025.totalRealizedGain) - 
        summary.byTimeline.beforeApril2025.totalInvested) / 
        summary.byTimeline.beforeApril2025.totalInvested) * 100;
  }
  
  if (summary.byTimeline.afterApril2025.totalInvested > 0) {
    summary.byTimeline.afterApril2025.percentageGain = 
      (((summary.byTimeline.afterApril2025.totalCurrentValue + summary.byTimeline.afterApril2025.totalRealizedGain) - 
        summary.byTimeline.afterApril2025.totalInvested) / 
        summary.byTimeline.afterApril2025.totalInvested) * 100;
  }

  return summary;
}; 