import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp
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

// Mark investment as sold
export const sellInvestment = async (id, sellData) => {
  try {
    const investmentRef = doc(db, COLLECTIONS.INVESTMENTS, id);
    await updateDoc(investmentRef, {
      ...sellData,
      status: INVESTMENT_STATUS.INACTIVE,
      soldDate: new Date(),
      updatedAt: serverTimestamp()
    });
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

// Calculate portfolio summary
export const calculatePortfolioSummary = (investments) => {
  const summary = {
    totalInvested: 0,
    totalCurrentValue: 0,
    percentageGain: 0,
    byType: {
      [INVESTMENT_TYPES.MUTUAL_FUND]: {
        totalInvested: 0,
        totalCurrentValue: 0,
        percentageGain: 0
      },
      [INVESTMENT_TYPES.SIP]: {
        totalInvested: 0,
        totalCurrentValue: 0,
        percentageGain: 0
      },
      [INVESTMENT_TYPES.EQUITY]: {
        totalInvested: 0,
        totalCurrentValue: 0,
        percentageGain: 0
      }
    }
  };

  // Calculate totals
  investments.forEach(investment => {
    const type = investment.type;
    const invested = parseInt(investment.investedAmount) || 0;
    
    // Calculate current value depending on investment type
    let currentValue = 0;
    if (type === INVESTMENT_TYPES.MUTUAL_FUND || type === INVESTMENT_TYPES.SIP) {
      currentValue = (parseFloat(investment.units) || 0) * (parseFloat(investment.currentNAV) || 0);
    } else if (type === INVESTMENT_TYPES.EQUITY) {
      currentValue = (parseInt(investment.shares) || 0) * (parseInt(investment.currentPrice) || 0);
    }
    
    // Update summary
    summary.totalInvested += invested;
    summary.totalCurrentValue += currentValue;
    
    // Update type-specific summary
    if (summary.byType[type]) {
      summary.byType[type].totalInvested += invested;
      summary.byType[type].totalCurrentValue += currentValue;
    }
  });

  // Calculate percentage gains
  if (summary.totalInvested > 0) {
    summary.percentageGain = ((summary.totalCurrentValue - summary.totalInvested) / summary.totalInvested) * 100;
  }

  Object.keys(summary.byType).forEach(type => {
    if (summary.byType[type].totalInvested > 0) {
      summary.byType[type].percentageGain = 
        ((summary.byType[type].totalCurrentValue - summary.byType[type].totalInvested) / 
          summary.byType[type].totalInvested) * 100;
    }
  });

  return summary;
}; 