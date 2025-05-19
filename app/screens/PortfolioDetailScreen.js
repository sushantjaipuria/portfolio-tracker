import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Button, Chip, Divider, useTheme, FAB } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { INVESTMENT_TYPES } from '../models';
import SummaryCard from '../components/SummaryCard';
import InvestmentItem from '../components/InvestmentItem';
import LoadingScreen from '../components/LoadingScreen';
import { getInvestmentsByType } from '../services/investmentService';
import { globalStyles } from '../utils/theme';

const PortfolioDetailScreen = ({ navigation }) => {
  const theme = useTheme();
  const { mergedInvestments, portfolioSummary, refreshPortfolio } = useApp();
  const [selectedType, setSelectedType] = useState(INVESTMENT_TYPES.MUTUAL_FUND);
  const [filteredInvestments, setFilteredInvestments] = useState([]);
  const [activeInvestments, setActiveInvestments] = useState([]);
  const [inactiveInvestments, setInactiveInvestments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshPortfolio();
    setRefreshing(false);
  };
  
  // Filter investments by selected type
  useEffect(() => {
    if (mergedInvestments) {
      const filtered = mergedInvestments.filter(inv => inv.type === selectedType);
      const active = filtered.filter(inv => inv.status === 'Active');
      const inactive = filtered.filter(inv => inv.status === 'Inactive');
      
      setFilteredInvestments(filtered);
      setActiveInvestments(active);
      setInactiveInvestments(inactive);
    }
  }, [selectedType, mergedInvestments]);
  
  // Navigate to investment detail
  const handleInvestmentPress = (investment) => {
    navigation.navigate('InvestmentDetail', { investment });
  };
  
  // Navigate to add investment with pre-selected type
  const handleAddInvestment = () => {
    navigation.navigate('AddInvestment', { selectedType });
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
      marginVertical: 16,
      color: theme.colors.text,
    },
    section: {
      marginTop: 16,
      marginBottom: 16,
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
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary,
    },
    disclaimer: {
      fontSize: 12,
      color: theme.colors.text,
      textAlign: 'center',
      marginVertical: 16,
      fontStyle: 'italic',
    },
    noData: {
      textAlign: 'center',
      marginTop: 24,
      fontSize: 16,
      color: theme.colors.placeholder,
    },
  });
  
  if (isLoading) {
    return <LoadingScreen message="Loading investments..." />;
  }
  
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.header}>Portfolio Details</Text>
        
        {/* Type selection chips */}
        <View style={styles.chipContainer}>
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
        
        {/* Type summary */}
        {portfolioSummary && portfolioSummary.byType[selectedType] && (
          <SummaryCard
            title={`${selectedType} Summary`}
            investedAmount={portfolioSummary.byType[selectedType].totalInvested}
            currentValue={portfolioSummary.byType[selectedType].totalCurrentValue}
            percentageGain={portfolioSummary.byType[selectedType].percentageGain}
          />
        )}
        
        {/* Timeline-based Summaries for the selected type */}
        {portfolioSummary && portfolioSummary.byTimeline && activeInvestments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subHeader}>{selectedType} Timeline Analysis</Text>
            
            {/* Filter the investments of current type by date to calculate timeline stats */}
            {(() => {
              // Reference date: April 1, 2025
              const april2025 = new Date(2025, 3, 1);
              
              // Initialize summary objects
              const beforeApril = {
                totalInvested: 0,
                totalCurrentValue: 0,
                percentageGain: 0
              };
              
              const afterApril = {
                totalInvested: 0,
                totalCurrentValue: 0,
                percentageGain: 0
              };
              
              // Calculate totals for the filtered investments
              activeInvestments.forEach(investment => {
                const invested = parseInt(investment.investedAmount) || 0;
                
                // Calculate current value depending on investment type
                let currentValue = 0;
                if (selectedType === INVESTMENT_TYPES.MUTUAL_FUND || selectedType === INVESTMENT_TYPES.SIP) {
                  currentValue = (parseFloat(investment.units) || 0) * (parseFloat(investment.currentNAV) || 0);
                } else if (selectedType === INVESTMENT_TYPES.EQUITY) {
                  currentValue = (parseInt(investment.shares) || 0) * (parseInt(investment.currentPrice) || 0);
                }
                
                // Determine purchase date
                let purchaseDate;
                if (selectedType === INVESTMENT_TYPES.SIP) {
                  purchaseDate = investment.startDate;
                } else {
                  purchaseDate = investment.purchaseDate;
                }
                
                // Convert to JavaScript Date if it's a Firestore timestamp
                if (purchaseDate && typeof purchaseDate.toDate === 'function') {
                  purchaseDate = purchaseDate.toDate();
                } else if (!(purchaseDate instanceof Date)) {
                  purchaseDate = new Date(purchaseDate);
                }
                
                // Update appropriate summary based on date
                if (purchaseDate < april2025) {
                  beforeApril.totalInvested += invested;
                  beforeApril.totalCurrentValue += currentValue;
                } else {
                  afterApril.totalInvested += invested;
                  afterApril.totalCurrentValue += currentValue;
                }
              });
              
              // Calculate percentage gains
              if (beforeApril.totalInvested > 0) {
                beforeApril.percentageGain = ((beforeApril.totalCurrentValue - beforeApril.totalInvested) / beforeApril.totalInvested) * 100;
              }
              
              if (afterApril.totalInvested > 0) {
                afterApril.percentageGain = ((afterApril.totalCurrentValue - afterApril.totalInvested) / afterApril.totalInvested) * 100;
              }
              
              // Render the cards
              return (
                <>
                  {beforeApril.totalInvested > 0 && (
                    <SummaryCard
                      title={`Pre-April 2025 ${selectedType}`}
                      investedAmount={beforeApril.totalInvested}
                      currentValue={beforeApril.totalCurrentValue}
                      percentageGain={beforeApril.percentageGain}
                    />
                  )}
                  
                  {afterApril.totalInvested > 0 && (
                    <SummaryCard
                      title={`Post-April 2025 ${selectedType}`}
                      investedAmount={afterApril.totalInvested}
                      currentValue={afterApril.totalCurrentValue}
                      percentageGain={afterApril.percentageGain}
                    />
                  )}
                </>
              );
            })()} 
          </View>
        )}
        
        {/* Active investments of selected type */}
        {activeInvestments.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.subHeader}>Active {selectedType} Investments</Text>
            {activeInvestments.map(investment => (
              <InvestmentItem
                key={investment.id}
                investment={investment}
                onPress={handleInvestmentPress}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.noData}>No active {selectedType} investments found.</Text>
        )}
        
        {/* Inactive/Sold investments of selected type */}
        {inactiveInvestments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subHeader}>Sold {selectedType} Investments</Text>
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
      
      {/* Second FAB removed as requested */}
    </View>
  );
};

export default PortfolioDetailScreen; 