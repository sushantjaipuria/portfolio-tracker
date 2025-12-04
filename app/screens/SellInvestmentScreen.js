import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
    Button,
    Divider,
    HelperText,
    Text,
    TextInput,
    useTheme
} from 'react-native-paper';
import InvestmentSummaryCard from '../components/InvestmentSummaryCard';
import LoadingScreen from '../components/LoadingScreen';
import { useApp } from '../context/AppContext';
import { INVESTMENT_TYPES } from '../models';
import { formatCurrency, formatDate, toPaise } from '../utils/helpers';
import { getOriginalInvestments } from '../utils/investmentMerger';
import { globalStyles } from '../utils/theme';

const SellInvestmentScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { refreshPortfolio, investments } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [originalInvestments, setOriginalInvestments] = useState([]);
  
  // Get original investments if this is a merged investment
  useEffect(() => {
    if (investment && investments.length) {
      const originals = getOriginalInvestments(investment, investments);
      setOriginalInvestments(originals);
    }
  }, [investment, investments]);
  
  // Get the investment from route params
  const investment = route.params?.investment;
  
  if (!investment) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>No investment selected</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16 }}
        >
          Go Back
        </Button>
      </View>
    );
  }
  
  // Form state
  const [soldUnits, setSoldUnits] = useState('');
  const [soldShares, setSoldShares] = useState('');
  const [soldPrice, setSoldPrice] = useState('');
  const [soldNAV, setSoldNAV] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [saleDate, setSaleDate] = useState('');
  
  // Error state
  const [errors, setErrors] = useState({});
  
  // We don't pre-populate form values anymore as per requirements
  // The form should start empty and user can fill in values manually
  
  // Calculate total amount
  useEffect(() => {
    if (investment.type === INVESTMENT_TYPES.MUTUAL_FUND || investment.type === INVESTMENT_TYPES.SIP) {
      if (soldUnits && soldNAV) {
        const amount = parseFloat(soldUnits) * parseFloat(soldNAV);
        setTotalAmount(amount.toFixed(2));
      }
    } else if (investment.type === INVESTMENT_TYPES.EQUITY) {
      if (soldShares && soldPrice) {
        const amount = parseInt(soldShares) * parseFloat(soldPrice);
        setTotalAmount(amount.toFixed(2));
      }
    }
  }, [investment.type, soldUnits, soldNAV, soldShares, soldPrice]);
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (investment.type === INVESTMENT_TYPES.MUTUAL_FUND || investment.type === INVESTMENT_TYPES.SIP) {
      if (!soldUnits) newErrors.soldUnits = 'Units are required';
      if (parseFloat(soldUnits) <= 0) newErrors.soldUnits = 'Units must be greater than 0';
      
      // Calculate total remaining units across all original investments
      const totalRemainingUnits = originalInvestments.length > 0 ?
        originalInvestments.reduce((total, inv) => {
          const remaining = inv.remainingUnits !== undefined ? inv.remainingUnits : inv.units;
          return total + parseFloat(remaining || 0);
        }, 0) :
        (investment.remainingUnits !== undefined ? investment.remainingUnits : investment.units);
      
      if (parseFloat(soldUnits) > totalRemainingUnits) 
        newErrors.soldUnits = `Cannot sell more than ${totalRemainingUnits} total remaining units`;
      
      if (!soldNAV) newErrors.soldNAV = 'NAV is required';
      if (parseFloat(soldNAV) <= 0) newErrors.soldNAV = 'NAV must be greater than 0';
    } else if (investment.type === INVESTMENT_TYPES.EQUITY) {
      if (!soldShares) newErrors.soldShares = 'Shares are required';
      if (parseInt(soldShares) <= 0) newErrors.soldShares = 'Shares must be greater than 0';
      
      // Calculate total remaining shares across all original investments
      const totalRemainingShares = originalInvestments.length > 0 ?
        originalInvestments.reduce((total, inv) => {
          const remaining = inv.remainingShares !== undefined ? inv.remainingShares : inv.shares;
          return total + parseInt(remaining || 0);
        }, 0) :
        (investment.remainingShares !== undefined ? investment.remainingShares : investment.shares);
      
      if (parseInt(soldShares) > totalRemainingShares) 
        newErrors.soldShares = `Cannot sell more than ${totalRemainingShares} total remaining shares`;
      
      if (!soldPrice) newErrors.soldPrice = 'Price is required';
      if (parseFloat(soldPrice) <= 0) newErrors.soldPrice = 'Price must be greater than 0';
    }
    
    if (!saleDate) newErrors.saleDate = 'Sale date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fix the errors in the form');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // For FIFO, we're going to sell from the oldest transactions first
      // Prepare the sell data
      let sellData = {};
      
      if (investment.type === INVESTMENT_TYPES.MUTUAL_FUND || investment.type === INVESTMENT_TYPES.SIP) {
        sellData = {
          totalUnits: parseFloat(soldUnits),
          salePrice: toPaise(soldNAV),
          saleDate: new Date(saleDate),
          isMutualFund: true,
          investmentType: investment.type,
          fundHouse: investment.fundHouse,
          schemeName: investment.schemeName,
          owner: investment.owner
        };
      } else if (investment.type === INVESTMENT_TYPES.EQUITY) {
        sellData = {
          totalShares: parseInt(soldShares),
          salePrice: toPaise(soldPrice),
          saleDate: new Date(saleDate),
          isMutualFund: false,
          investmentType: investment.type,
          ticker: investment.ticker,
          owner: investment.owner
        };
      }
      
      // Use the spillover function to handle FIFO properly
      const { sellInvestmentWithSpillover } = require('../services/investmentService');
      await sellInvestmentWithSpillover(sellData);
      await refreshPortfolio();
      
      Alert.alert(
        'Success',
        'Investment sold successfully',
        [{ 
          text: 'OK', 
          onPress: () => {
            // Navigate back and ensure data is fresh
            navigation.goBack();
            // Trigger a refresh on the previous screen
            if (navigation.canGoBack()) {
              navigation.getParent()?.setParams({ refreshTimestamp: Date.now() });
            }
          }
        }]
      );
    } catch (error) {
      console.error('Error selling investment:', error);
      Alert.alert('Error', `Failed to sell investment: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render active holdings summary
  const renderActiveHoldingsSummary = () => {
    // For non-merged investments, just use the investment directly
    // For merged investments with multiple originals, create a summary
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Active Holdings (FIFO Order)</Text>
        <View style={styles.holdingSummaryContainer}>
          {originalInvestments.length > 0 ? (
            // Show all original investments in FIFO order
            originalInvestments
              .sort((a, b) => {
                // Sort by purchase date (oldest first for FIFO)
                const dateA = a.purchaseDate && typeof a.purchaseDate.toDate === 'function' ? 
                  a.purchaseDate.toDate() : new Date(a.purchaseDate);
                const dateB = b.purchaseDate && typeof b.purchaseDate.toDate === 'function' ? 
                  b.purchaseDate.toDate() : new Date(b.purchaseDate);
                return dateA - dateB;
              })
              .map((inv, index) => {
                // Only show active investments with remaining units/shares
                const remainingUnits = inv.remainingUnits !== undefined ? inv.remainingUnits : inv.units;
                const remainingShares = inv.remainingShares !== undefined ? inv.remainingShares : inv.shares;
                
                if ((inv.type === INVESTMENT_TYPES.EQUITY && remainingShares <= 0) ||
                    ((inv.type === INVESTMENT_TYPES.MUTUAL_FUND || inv.type === INVESTMENT_TYPES.SIP) && remainingUnits <= 0)) {
                  return null; // Skip fully sold investments
                }
                
                return (
                  <View key={inv.id} style={styles.holdingItem}>
                    <Text style={styles.holdingTitle}>
                      Holding {index + 1} - {formatDate(inv.purchaseDate)}
                    </Text>
                    
                    {inv.type === INVESTMENT_TYPES.EQUITY ? (
                      <>
                        <View style={styles.holdingRow}>
                          <Text style={styles.holdingLabel}>Remaining Shares:</Text>
                          <Text style={styles.holdingValue}>{remainingShares}</Text>
                        </View>
                        <View style={styles.holdingRow}>
                          <Text style={styles.holdingLabel}>Purchase Price:</Text>
                          <Text style={styles.holdingValue}>{formatCurrency(inv.purchasePrice)}</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.holdingRow}>
                          <Text style={styles.holdingLabel}>Remaining Units:</Text>
                          <Text style={styles.holdingValue}>{remainingUnits}</Text>
                        </View>
                        <View style={styles.holdingRow}>
                          <Text style={styles.holdingLabel}>Purchase NAV:</Text>
                          <Text style={styles.holdingValue}>{formatCurrency(inv.purchaseNAV)}</Text>
                        </View>
                      </>
                    )}
                    
                    <View style={styles.holdingRow}>
                      <Text style={styles.holdingLabel}>Invested Amount:</Text>
                      <Text style={styles.holdingValue}>{formatCurrency(inv.investedAmount)}</Text>
                    </View>
                  </View>
                );
              })
          ) : (
            // Show single investment summary
            <View style={styles.holdingItem}>
              {investment.type === INVESTMENT_TYPES.EQUITY ? (
                <>
                  <View style={styles.holdingRow}>
                    <Text style={styles.holdingLabel}>Remaining Shares:</Text>
                    <Text style={styles.holdingValue}>
                      {investment.remainingShares !== undefined ? investment.remainingShares : investment.shares}
                    </Text>
                  </View>
                  <View style={styles.holdingRow}>
                    <Text style={styles.holdingLabel}>Purchase Price:</Text>
                    <Text style={styles.holdingValue}>{formatCurrency(investment.purchasePrice)}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.holdingRow}>
                    <Text style={styles.holdingLabel}>Remaining Units:</Text>
                    <Text style={styles.holdingValue}>
                      {investment.remainingUnits !== undefined ? investment.remainingUnits : investment.units}
                    </Text>
                  </View>
                  <View style={styles.holdingRow}>
                    <Text style={styles.holdingLabel}>Purchase NAV:</Text>
                    <Text style={styles.holdingValue}>{formatCurrency(investment.purchaseNAV)}</Text>
                  </View>
                </>
              )}
              
              <View style={styles.holdingRow}>
                <Text style={styles.holdingLabel}>Purchase Date:</Text>
                <Text style={styles.holdingValue}>{formatDate(investment.purchaseDate)}</Text>
              </View>
              
              <View style={styles.holdingRow}>
                <Text style={styles.holdingLabel}>Invested Amount:</Text>
                <Text style={styles.holdingValue}>{formatCurrency(investment.investedAmount)}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      ...globalStyles.container,
      backgroundColor: theme.colors.background,
    },
    header: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 16,
      color: theme.colors.text,
    },
    subHeader: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: theme.colors.text,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.text,
    },
    input: {
      backgroundColor: theme.colors.surface,
      marginBottom: 16,
    },
    infoText: {
      marginBottom: 8,
      fontSize: 14,
      color: theme.colors.text,
    },
    infoValue: {
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    button: {
      marginTop: 24,
      marginBottom: 40,
    },
    totalAmount: {
      fontSize: 18,
      marginTop: 8,
      marginBottom: 16,
      color: theme.colors.text,
    },
    totalValue: {
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    divider: {
      marginVertical: 16,
    },
    // Styles for the holdings summary
    holdingSummaryContainer: {
      marginTop: 8,
    },
    holdingItem: {
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
    },
    holdingTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.text,
    },
    holdingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    holdingLabel: {
      fontSize: 13,
      color: theme.colors.text,
    },
    holdingValue: {
      fontSize: 13,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    // Legacy styles - kept for backward compatibility
    transactionItem: {
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 8,
    },
    selectedTransaction: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    transactionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 4,
      color: theme.colors.text,
    },
    transactionDetails: {
      fontSize: 12,
      color: theme.colors.text,
    },
  });
  
  if (isLoading) {
    return <LoadingScreen message="Processing sale..." />;
  }
  
  // Render Investment Summary Card
  const renderInvestmentSummary = () => {
    // Get remaining units/shares
    const remainingUnits = investment.remainingUnits !== undefined ? 
      investment.remainingUnits : investment.units;
    const remainingShares = investment.remainingShares !== undefined ? 
      investment.remainingShares : investment.shares;
    
    // Calculate current value
    let currentValue = 0;
    
    if (investment.type === INVESTMENT_TYPES.MUTUAL_FUND || investment.type === INVESTMENT_TYPES.SIP) {
      currentValue = remainingUnits * (investment.currentNAV / 100);
      
      return (
        <InvestmentSummaryCard
          schemeName={`${investment.fundHouse} - ${investment.schemeName}`}
          currentValue={currentValue * 100} // Convert back to paise for formatCurrency
          totalUnits={investment.units}
          remainingUnits={remainingUnits}
          currentNAV={investment.currentNAV}
          type={investment.type}
        />
      );
    } else {
      currentValue = remainingShares * (investment.currentPrice / 100);
      
      return (
        <InvestmentSummaryCard
          schemeName={investment.ticker}
          currentValue={currentValue * 100} // Convert back to paise for formatCurrency
          totalShares={investment.shares}
          remainingShares={remainingShares}
          currentPrice={investment.currentPrice}
          type={investment.type}
        />
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Sell Investment</Text>
      
      <View style={styles.section}>
        <Text style={styles.subHeader}>Sale Details</Text>
        
        <TextInput
          label="Sale Date (YYYY-MM-DD)"
          value={saleDate}
          onChangeText={setSaleDate}
          style={styles.input}
          mode="outlined"
          error={!!errors.saleDate}
        />
        {errors.saleDate && <HelperText type="error">{errors.saleDate}</HelperText>}
        
        {(investment.type === INVESTMENT_TYPES.MUTUAL_FUND || investment.type === INVESTMENT_TYPES.SIP) && (
          <>
            <TextInput
              label="Units to Sell"
              value={soldUnits}
              onChangeText={setSoldUnits}
              style={styles.input}
              mode="outlined"
              keyboardType="decimal-pad"
              error={!!errors.soldUnits}
            />
            {errors.soldUnits && <HelperText type="error">{errors.soldUnits}</HelperText>}
            
            <TextInput
              label="Selling NAV (₹)"
              value={soldNAV}
              onChangeText={setSoldNAV}
              style={styles.input}
              mode="outlined"
              keyboardType="decimal-pad"
              error={!!errors.soldNAV}
            />
            {errors.soldNAV && <HelperText type="error">{errors.soldNAV}</HelperText>}
          </>
        )}
        
        {investment.type === INVESTMENT_TYPES.EQUITY && (
          <>
            <TextInput
              label="Shares to Sell"
              value={soldShares}
              onChangeText={setSoldShares}
              style={styles.input}
              mode="outlined"
              keyboardType="number-pad"
              error={!!errors.soldShares}
            />
            {errors.soldShares && <HelperText type="error">{errors.soldShares}</HelperText>}
            
            <TextInput
              label="Selling Price (₹)"
              value={soldPrice}
              onChangeText={setSoldPrice}
              style={styles.input}
              mode="outlined"
              keyboardType="decimal-pad"
              error={!!errors.soldPrice}
            />
            {errors.soldPrice && <HelperText type="error">{errors.soldPrice}</HelperText>}
          </>
        )}
        
        <Text style={styles.totalAmount}>
          Total Sale Amount: <Text style={styles.totalValue}>₹{totalAmount}</Text>
        </Text>
        
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          buttonColor={theme.colors.primary}
        >
          Confirm Sale
        </Button>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Investment Summary</Text>
        {/* Investment Summary Card */}
        {renderInvestmentSummary()}
      </View>
      
      {/* Active Holdings Summary - FIFO order */}
      {renderActiveHoldingsSummary()}
      
    </ScrollView>
  );
};

export default SellInvestmentScreen; 