import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  useTheme, 
  HelperText,
  Divider
} from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { sellInvestment } from '../services/investmentService';
import { getOriginalInvestments } from '../utils/investmentMerger';
import { INVESTMENT_TYPES, INVESTMENT_STATUS } from '../models';
import { toPaise, formatCurrency, formatDate } from '../utils/helpers';
import { globalStyles } from '../utils/theme';
import LoadingScreen from '../components/LoadingScreen';

const SellInvestmentScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { refreshPortfolio, investments } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [originalInvestments, setOriginalInvestments] = useState([]);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState(null);
  
  // Get original investments if this is a merged investment
  useEffect(() => {
    if (investment && investments.length) {
      const originals = getOriginalInvestments(investment, investments);
      setOriginalInvestments(originals);
      
      // If only one investment, select it automatically
      if (originals.length === 1) {
        setSelectedInvestmentId(originals[0].id);
      }
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
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Error state
  const [errors, setErrors] = useState({});
  
  // Pre-populate values based on selected investment
  useEffect(() => {
    // If multiple original investments, use the selected one if available
    const investmentToUse = 
      originalInvestments.length > 1 && selectedInvestmentId
        ? originalInvestments.find(inv => inv.id === selectedInvestmentId) || investment
        : investment;
    
    if (investmentToUse.type === INVESTMENT_TYPES.MUTUAL_FUND || investmentToUse.type === INVESTMENT_TYPES.SIP) {
      setSoldUnits(investmentToUse.units.toString());
      setSoldNAV(((investmentToUse.currentNAV || 0) / 100).toFixed(2));
    } else if (investmentToUse.type === INVESTMENT_TYPES.EQUITY) {
      setSoldShares(investmentToUse.shares.toString());
      setSoldPrice(((investmentToUse.currentPrice || 0) / 100).toFixed(2));
    }
  }, [investment, selectedInvestmentId, originalInvestments]);
  
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
      if (parseFloat(soldUnits) > investment.units) newErrors.soldUnits = `Cannot sell more than ${investment.units} units`;
      
      if (!soldNAV) newErrors.soldNAV = 'NAV is required';
      if (parseFloat(soldNAV) <= 0) newErrors.soldNAV = 'NAV must be greater than 0';
    } else if (investment.type === INVESTMENT_TYPES.EQUITY) {
      if (!soldShares) newErrors.soldShares = 'Shares are required';
      if (parseInt(soldShares) <= 0) newErrors.soldShares = 'Shares must be greater than 0';
      if (parseInt(soldShares) > investment.shares) newErrors.soldShares = `Cannot sell more than ${investment.shares} shares`;
      
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
    
    // If merged investment, we need to sell the selected original investment
    const investmentToSell = 
      originalInvestments.length > 1 && selectedInvestmentId
        ? originalInvestments.find(inv => inv.id === selectedInvestmentId)
        : investment;
    
    if (!investmentToSell) {
      Alert.alert('Error', 'Please select a transaction to sell');
      return;
    }
    
    try {
      setIsLoading(true);
      
      let sellData = {};
      
      if (investmentToSell.type === INVESTMENT_TYPES.MUTUAL_FUND || investmentToSell.type === INVESTMENT_TYPES.SIP) {
        sellData = {
          soldUnits: parseFloat(soldUnits),
          soldNAV: toPaise(soldNAV),
          soldDate: new Date(saleDate),
        };
      } else if (investmentToSell.type === INVESTMENT_TYPES.EQUITY) {
        sellData = {
          soldShares: parseInt(soldShares),
          soldPrice: toPaise(soldPrice),
          soldDate: new Date(saleDate),
        };
      }
      
      await sellInvestment(investmentToSell.id, sellData);
      await refreshPortfolio();
      
      Alert.alert(
        'Success',
        'Investment sold successfully',
        [{ text: 'OK', onPress: () => navigation.navigate('Portfolio') }]
      );
    } catch (error) {
      console.error('Error selling investment:', error);
      Alert.alert('Error', 'Failed to sell investment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render transaction selection section for merged investments
  const renderTransactionSelection = () => {
    if (originalInvestments.length <= 1) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Transaction to Sell</Text>
        {originalInvestments.map((inv, index) => (
          <TouchableOpacity 
            key={inv.id}
            style={[
              styles.transactionItem,
              selectedInvestmentId === inv.id && styles.selectedTransaction
            ]}
            onPress={() => {
              setSelectedInvestmentId(inv.id);
            }}
          >
            <Text style={styles.transactionTitle}>
              Transaction {index + 1} - {formatDate(inv.purchaseDate)}
            </Text>
            
            {inv.type === INVESTMENT_TYPES.EQUITY ? (
              <Text style={styles.transactionDetails}>
                {inv.shares} shares at {formatCurrency(inv.purchasePrice)}
              </Text>
            ) : (
              <Text style={styles.transactionDetails}>
                {inv.units} units at {formatCurrency(inv.purchaseNAV)}
              </Text>
            )}
            
            <Text style={styles.transactionDetails}>
              Amount: {formatCurrency(inv.investedAmount)}
            </Text>
          </TouchableOpacity>
        ))}
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
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Sell Investment</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Investment Details</Text>
        
        {/* Transaction Selection - only for merged investments */}
        {renderTransactionSelection()}
        <Text style={styles.infoText}>
          Type: <Text style={styles.infoValue}>{investment.type}</Text>
        </Text>
        
        {investment.type === INVESTMENT_TYPES.MUTUAL_FUND || investment.type === INVESTMENT_TYPES.SIP ? (
          <>
            <Text style={styles.infoText}>
              Fund: <Text style={styles.infoValue}>{investment.fundHouse} - {investment.schemeName}</Text>
            </Text>
            <Text style={styles.infoText}>
              Current Units: <Text style={styles.infoValue}>{investment.units}</Text>
            </Text>
            <Text style={styles.infoText}>
              Current NAV: <Text style={styles.infoValue}>
                {formatCurrency(investment.currentNAV)}
              </Text>
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.infoText}>
              Ticker: <Text style={styles.infoValue}>{investment.ticker}</Text>
            </Text>
            <Text style={styles.infoText}>
              Current Shares: <Text style={styles.infoValue}>{investment.shares}</Text>
            </Text>
            <Text style={styles.infoText}>
              Current Price: <Text style={styles.infoValue}>
                {formatCurrency(investment.currentPrice)}
              </Text>
            </Text>
          </>
        )}
        
        <Text style={styles.infoText}>
          Invested Amount: <Text style={styles.infoValue}>
            {formatCurrency(investment.investedAmount)}
          </Text>
        </Text>
      </View>
      
      <Divider style={styles.divider} />
      
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
      </View>
      
      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.button}
        buttonColor={theme.colors.primary}
      >
        Confirm Sale
      </Button>
    </ScrollView>
  );
};

export default SellInvestmentScreen; 