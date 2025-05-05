// Currency formatting (convert from paise to rupees with 2 decimal places)
export const formatCurrency = (paise) => {
  if (!paise && paise !== 0) return '₹0.00';
  
  const rupees = paise / 100;
  return `₹${rupees.toFixed(2)}`;
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

// Format date
export const formatDate = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// Format number with commas (Indian format)
export const formatNumber = (num, decimals = 2) => {
  if (!num && num !== 0) return '0';
  
  // Convert to string with the specified number of decimal places
  const parts = parseFloat(num).toFixed(decimals).split('.');
  
  // Format the integer part with commas (Indian style)
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
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