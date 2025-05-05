import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Chip, Divider, useTheme } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { INVESTMENT_TYPES } from '../models';
import InvestmentItem from '../components/InvestmentItem';
import LoadingScreen from '../components/LoadingScreen';
import { getSoldInvestments } from '../services/investmentService';
import { formatCurrency } from '../utils/helpers';
import { globalStyles } from '../utils/theme';

const SoldInvestmentsScreen = ({ navigation }) => {
  const theme = useTheme();
  const { refreshPortfolio } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [soldInvestments, setSoldInvestments] = useState([]);
  const [selectedType, setSelectedType] = useState('All');
  const [filteredInvestments, setFilteredInvestments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch sold investments
  const fetchSoldInvestments = async () => {
    try {
      setIsLoading(true);
      const investments = await getSoldInvestments();
      setSoldInvestments(investments);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching sold investments:', error);
      setIsLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchSoldInvestments();
  }, []);
  
  // Filter investments based on selected type
  useEffect(() => {
    if (selectedType === 'All') {
      setFilteredInvestments(soldInvestments);
    } else {
      setFilteredInvestments(soldInvestments.filter(inv => inv.type === selectedType));
    }
  }, [selectedType, soldInvestments]);
  
  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSoldInvestments();
    await refreshPortfolio();
    setRefreshing(false);
  };
  
  // Navigate to investment detail
  const handleInvestmentPress = (investment) => {
    navigation.navigate('InvestmentDetail', { investment });
  };
  
  // Calculate totals for the sold investments
  const calculateTotals = () => {
    const totals = {
      investedAmount: 0,
      soldAmount: 0,
      profit: 0
    };
    
    filteredInvestments.forEach(inv => {
      totals.investedAmount += inv.investedAmount || 0;
      
      let soldAmount = 0;
      if (inv.type === INVESTMENT_TYPES.MUTUAL_FUND || inv.type === INVESTMENT_TYPES.SIP) {
        soldAmount = (inv.soldUnits || 0) * (inv.soldNAV || 0);
      } else if (inv.type === INVESTMENT_TYPES.EQUITY) {
        soldAmount = (inv.soldShares || 0) * (inv.soldPrice || 0);
      }
      
      totals.soldAmount += soldAmount;
    });
    
    totals.profit = totals.soldAmount - totals.investedAmount;
    return totals;
  };
  
  const totals = calculateTotals();
  
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
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 16,
    },
    chip: {
      marginRight: 8,
      marginBottom: 8,
    },
    summaryCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 20,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.text,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: theme.colors.text,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    profit: {
      color: theme.colors.positive,
    },
    loss: {
      color: theme.colors.negative,
    },
    divider: {
      marginVertical: 8,
    },
    noDataText: {
      textAlign: 'center',
      fontSize: 16,
      marginTop: 40,
      color: theme.colors.placeholder,
    },
    disclaimer: {
      fontSize: 12,
      color: theme.colors.text,
      textAlign: 'center',
      marginVertical: 16,
      fontStyle: 'italic',
    },
  });
  
  if (isLoading) {
    return <LoadingScreen message="Loading sold investments..." />;
  }
  
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.header}>Sold Investments</Text>
      
      {/* Type filters */}
      <View style={styles.chipContainer}>
        <Chip
          selected={selectedType === 'All'}
          onPress={() => setSelectedType('All')}
          style={styles.chip}
          mode={selectedType === 'All' ? 'flat' : 'outlined'}
        >
          All
        </Chip>
        <Chip
          selected={selectedType === INVESTMENT_TYPES.MUTUAL_FUND}
          onPress={() => setSelectedType(INVESTMENT_TYPES.MUTUAL_FUND)}
          style={styles.chip}
          mode={selectedType === INVESTMENT_TYPES.MUTUAL_FUND ? 'flat' : 'outlined'}
        >
          Mutual Funds
        </Chip>
        <Chip
          selected={selectedType === INVESTMENT_TYPES.SIP}
          onPress={() => setSelectedType(INVESTMENT_TYPES.SIP)}
          style={styles.chip}
          mode={selectedType === INVESTMENT_TYPES.SIP ? 'flat' : 'outlined'}
        >
          SIPs
        </Chip>
        <Chip
          selected={selectedType === INVESTMENT_TYPES.EQUITY}
          onPress={() => setSelectedType(INVESTMENT_TYPES.EQUITY)}
          style={styles.chip}
          mode={selectedType === INVESTMENT_TYPES.EQUITY ? 'flat' : 'outlined'}
        >
          Equity
        </Chip>
      </View>
      
      {/* Summary Card */}
      {filteredInvestments.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Sale Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Invested Amount</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totals.investedAmount)}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sold Amount</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totals.soldAmount)}
            </Text>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Profit/Loss</Text>
            <Text style={[
              styles.summaryValue, 
              totals.profit > 0 ? styles.profit : styles.loss
            ]}>
              {formatCurrency(totals.profit)}
            </Text>
          </View>
        </View>
      )}
      
      {/* Sold Investment List */}
      {filteredInvestments.length > 0 ? (
        filteredInvestments.map(investment => (
          <InvestmentItem
            key={investment.id}
            investment={investment}
            onPress={handleInvestmentPress}
          />
        ))
      ) : (
        <Text style={styles.noDataText}>
          No sold investments found.
        </Text>
      )}
      
      <Text style={styles.disclaimer}>
        Prices are delayed; not investment advice.
      </Text>
    </ScrollView>
  );
};

export default SoldInvestmentsScreen; 