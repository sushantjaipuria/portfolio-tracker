import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Button, useTheme, Divider, FAB } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { INVESTMENT_TYPES } from '../models';
import SummaryCard from '../components/SummaryCard';
import InvestmentItem from '../components/InvestmentItem';
import LoadingScreen from '../components/LoadingScreen';
import { formatCurrency } from '../utils/helpers';
import { globalStyles } from '../utils/theme';

const PortfolioScreen = ({ navigation }) => {
  const theme = useTheme();
  const { isLoading, investments, portfolioSummary, refreshPortfolio } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [activeInvestments, setActiveInvestments] = useState([]);
  const [inactiveInvestments, setInactiveInvestments] = useState([]);
  
  // Separate active and inactive investments
  useEffect(() => {
    if (investments) {
      const active = investments.filter(inv => inv.status === 'Active');
      const inactive = investments.filter(inv => inv.status === 'Inactive');
      
      setActiveInvestments(active);
      setInactiveInvestments(inactive);
    }
  }, [investments]);
  
  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshPortfolio();
    setRefreshing(false);
  };
  
  // Navigate to investment detail
  const handleInvestmentPress = (investment) => {
    navigation.navigate('InvestmentDetail', { investment });
  };
  
  // Navigate to add investment
  const handleAddInvestment = () => {
    navigation.navigate('AddInvestment');
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
      marginTop: 16,
      marginBottom: 8,
      color: theme.colors.text,
    },
    section: {
      marginTop: 24,
      marginBottom: 16,
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary,
    },
    sectionHeader: {
      backgroundColor: theme.colors.surface,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 4,
      marginBottom: 8,
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
    return <LoadingScreen message="Loading portfolio..." />;
  }
  
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.header}>Portfolio Overview</Text>
        
        {/* Overall Summary */}
        {portfolioSummary && (
          <SummaryCard
            title="Total Portfolio"
            investedAmount={portfolioSummary.totalInvested}
            currentValue={portfolioSummary.totalCurrentValue}
            percentageGain={portfolioSummary.percentageGain}
          />
        )}
        
        {/* Investment Type Summaries */}
        {portfolioSummary && (
          <View style={styles.section}>
            <Text style={styles.subHeader}>Investment Types</Text>
            
            {/* Mutual Funds Summary */}
            {portfolioSummary.byType[INVESTMENT_TYPES.MUTUAL_FUND].totalInvested > 0 && (
              <SummaryCard
                title="Mutual Funds"
                investedAmount={portfolioSummary.byType[INVESTMENT_TYPES.MUTUAL_FUND].totalInvested}
                currentValue={portfolioSummary.byType[INVESTMENT_TYPES.MUTUAL_FUND].totalCurrentValue}
                percentageGain={portfolioSummary.byType[INVESTMENT_TYPES.MUTUAL_FUND].percentageGain}
              />
            )}
            
            {/* SIPs Summary */}
            {portfolioSummary.byType[INVESTMENT_TYPES.SIP].totalInvested > 0 && (
              <SummaryCard
                title="SIPs"
                investedAmount={portfolioSummary.byType[INVESTMENT_TYPES.SIP].totalInvested}
                currentValue={portfolioSummary.byType[INVESTMENT_TYPES.SIP].totalCurrentValue}
                percentageGain={portfolioSummary.byType[INVESTMENT_TYPES.SIP].percentageGain}
              />
            )}
            
            {/* Equity Summary */}
            {portfolioSummary.byType[INVESTMENT_TYPES.EQUITY].totalInvested > 0 && (
              <SummaryCard
                title="Equity"
                investedAmount={portfolioSummary.byType[INVESTMENT_TYPES.EQUITY].totalInvested}
                currentValue={portfolioSummary.byType[INVESTMENT_TYPES.EQUITY].totalCurrentValue}
                percentageGain={portfolioSummary.byType[INVESTMENT_TYPES.EQUITY].percentageGain}
              />
            )}
          </View>
        )}
        
        {/* Active Investments */}
        {activeInvestments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subHeader}>Active Investments</Text>
            {activeInvestments.map(investment => (
              <InvestmentItem
                key={investment.id}
                investment={investment}
                onPress={handleInvestmentPress}
              />
            ))}
          </View>
        )}
        
        {/* Inactive/Sold Investments */}
        {inactiveInvestments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subHeader}>Sold Investments</Text>
            {inactiveInvestments.map(investment => (
              <InvestmentItem
                key={investment.id}
                investment={investment}
                onPress={handleInvestmentPress}
              />
            ))}
          </View>
        )}
        
        <Text style={styles.disclaimer}>
          Prices are delayed; not investment advice.
        </Text>
      </ScrollView>
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleAddInvestment}
        color="#FFFFFF"
      />
    </View>
  );
};

export default PortfolioScreen; 