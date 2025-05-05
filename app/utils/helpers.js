// Currency formatting (convert from paise to rupees with 2 decimal places)
export const formatCurrency = (paise) => {
  if (!paise && paise !== 0) return '₹0.00';
  
  const rupees = paise / 100;
  // Use formatNumber for Indian style formatting
  return `₹${formatNumber(rupees, 2)}`;
};

// Convert rupees to paise for storage (to avoid floating point issues)
export const toPaise = (rupees) => {
  if (!rupees && rupees !== 0) return 0;
  return Math.round(parseFloat(rupees) * 100);
};

// Format percentage
export const formatPercentage = (value) => {
  if (!value && value !== 0) return '0.00%';
  return `${value.toFixed(2)}%`;
};

// Format date as DD-MM-YYYY
export const formatDate = (date) => {
  if (!date) return '';
  
  try {
    let d;
    
    // Check if it's a Firestore Timestamp (has toDate method)
    if (date && typeof date.toDate === 'function') {
      d = date.toDate();
    } 
    // Check if it's already a Date object
    else if (date instanceof Date) {
      d = date;
    } 
    // Otherwise try to parse it as a string or number
    else {
      d = new Date(date);
    }
    
    // Verify we have a valid date
    if (isNaN(d.getTime())) {
      console.warn('Invalid date value:', date);
      return '';
    }
    
    // Get day, month, year
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = d.getFullYear();
    
    // Return in DD-MM-YYYY format
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// Parse date from DD-MM-YYYY format to a Date object
export const parseDateString = (dateString) => {
  if (!dateString) return new Date();
  
  try {
    // Split the DD-MM-YYYY string
    const [day, month, year] = dateString.split('-').map(num => parseInt(num, 10));
    
    // Create a new Date (month is 0-indexed so subtract 1)
    return new Date(year, month - 1, day);
  } catch (error) {
    console.error('Error parsing date string:', error);
    return new Date();
  }
};

// Format number with commas (Indian format)
export const formatNumber = (num, decimals = 2) => {
  if (!num && num !== 0) return '0';
  
  // Convert to string with the specified number of decimal places
  const parts = parseFloat(num).toFixed(decimals).split('.');
  
  // Format the integer part with commas (Indian style: 12,34,567)
  let intPart = parts[0];
  const lastThree = intPart.length > 3 ? intPart.slice(-3) : intPart;
  const otherNumbers = intPart.length > 3 ? intPart.slice(0, -3) : '';
  const formattedOtherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  
  parts[0] = otherNumbers ? formattedOtherNumbers + ',' + lastThree : lastThree;
  
  // Combine and return the formatted number
  return parts.join('.');
};

// Calculate gain/loss
export const calculateGainLoss = (currentValue, investedAmount) => {
  const current = parseInt(currentValue) || 0;
  const invested = parseInt(investedAmount) || 0;
  
  if (invested === 0) return 0;
  
  const gainLoss = ((current - invested) / invested) * 100;
  return gainLoss;
};

// Determine color based on gain/loss
export const getGainLossColor = (value) => {
  if (value > 0) return '#4CAF50'; // Green for positive
  if (value < 0) return '#F44336'; // Red for negative
  return '#757575'; // Gray for neutral
};