// Investment types
export const INVESTMENT_TYPES = {
  MUTUAL_FUND: 'Mutual Fund',
  SIP: 'SIP',
  EQUITY: 'Equity'
};

// Investment status
export const INVESTMENT_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive'
};

// SIP frequency
export const SIP_FREQUENCY = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly'
};

// Data models
export const MutualFund = {
  id: '',
  owner: '', // Portfolio owner identifier (e.g., 'SJ', 'SKJ')
  type: INVESTMENT_TYPES.MUTUAL_FUND,
  fundHouse: '',
  schemeName: '',
  schemeCode: '',
  isin: '',
  units: 0,
  remainingUnits: 0, // New field - initialized to same as units on creation
  purchaseNAV: 0,
  currentNAV: 0,
  investedAmount: 0, // Stored as paise (e.g., ₹100.50 = 10050)
  currentValue: 0,   // Calculated: units * currentNAV
  status: INVESTMENT_STATUS.ACTIVE,
  purchaseDate: new Date(),
  soldDate: null,
  soldUnits: 0,
  soldNAV: 0,
  navHistory: [], // Format: { date: Date, value: number }
  salesHistory: [], // New field - Format: [{ units, salePrice, saleDate, profit }]
};

export const SIP = {
  id: '',
  owner: '', // Portfolio owner identifier (e.g., 'SJ', 'SKJ')
  type: INVESTMENT_TYPES.SIP,
  fundHouse: '',
  schemeName: '',
  schemeCode: '',
  isin: '',
  units: 0,
  remainingUnits: 0, // New field - initialized to same as units on creation
  purchaseNAV: 0,
  currentNAV: 0,
  investedAmount: 0, // Stored as paise
  amountPerPeriod: 0, // Stored as paise
  frequency: SIP_FREQUENCY.MONTHLY,
  currentValue: 0,   // Calculated: units * currentNAV
  status: INVESTMENT_STATUS.ACTIVE,
  startDate: new Date(),
  endDate: null,
  soldDate: null,
  soldUnits: 0,
  soldNAV: 0,
  navHistory: [], // Format: { date: Date, value: number }
  salesHistory: [], // New field - Format: [{ units, salePrice, saleDate, profit }]
};

export const Equity = {
  id: '',
  owner: '', // Portfolio owner identifier (e.g., 'SJ', 'SKJ')
  type: INVESTMENT_TYPES.EQUITY,
  ticker: '',
  shares: 0,
  remainingShares: 0, // New field - initialized to same as shares on creation
  purchasePrice: 0, // Stored as paise
  currentPrice: 0,  // Stored as paise
  investedAmount: 0, // Stored as paise
  currentValue: 0,   // Calculated: shares * currentPrice
  status: INVESTMENT_STATUS.ACTIVE,
  purchaseDate: new Date(),
  soldDate: null,
  soldShares: 0,
  soldPrice: 0,
  priceHistory: [], // Format: { date: Date, value: number }
  salesHistory: [], // New field - Format: [{ shares, salePrice, saleDate, profit }]
}; 