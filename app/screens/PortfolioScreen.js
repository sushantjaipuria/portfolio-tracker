import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { FAB, Portal, Text, useTheme } from 'react-native-paper';
import InvestmentItem from '../components/InvestmentItem';
import LoadingScreen from '../components/LoadingScreen';
import SummaryCard from '../components/SummaryCard';
import { useApp } from '../context/AppContext';
import { INVESTMENT_TYPES } from '../models';
import { globalStyles } from '../utils/theme';

const PortfolioScreen = ({ navigation }) => {
  const theme = useTheme();
  const { isLoading, investments, portfolioSummary, refreshPortfolio } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [activeInvestments, setActiveInvestments] = useState([]);
  const [inactiveInvestments, setInactiveInvestments] = useState([]);
  const [fabOpen, setFabOpen] = useState(false);
  
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
  
  // Navigate to sell investment
  const handleSellInvestment = () => {
    navigation.navigate('PortfolioDetailTab');
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
      backgroundColor: theme.colors.primary,
      position: 'absolute',
      bottom: 30, // Position from bottom of screen
      right: 16,
      transform: [{ scale: 0.85 }], // Making it about 15% smaller
    },
    fabActionItem: {
      marginBottom: 65, // Add space between action items
      marginRight: 15, // Align with the FAB button
    },
    fabActionLabel: {
      backgroundColor: 'transparent', // Remove white background
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
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
            realizedGain={portfolioSummary.totalRealizedGain}
            unrealizedGain={portfolioSummary.totalUnrealizedGain} // NEW
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
                realizedGain={portfolioSummary.byType[INVESTMENT_TYPES.MUTUAL_FUND].totalRealizedGain}
                unrealizedGain={portfolioSummary.byType[INVESTMENT_TYPES.MUTUAL_FUND].totalUnrealizedGain} // NEW
                percentageGain={portfolioSummary.byType[INVESTMENT_TYPES.MUTUAL_FUND].percentageGain}
              />
            )}
            
            {/* SIPs Summary */}
            {portfolioSummary.byType[INVESTMENT_TYPES.SIP].totalInvested > 0 && (
              <SummaryCard
                title="SIPs"
                investedAmount={portfolioSummary.byType[INVESTMENT_TYPES.SIP].totalInvested}
                currentValue={portfolioSummary.byType[INVESTMENT_TYPES.SIP].totalCurrentValue}
                realizedGain={portfolioSummary.byType[INVESTMENT_TYPES.SIP].totalRealizedGain}
                unrealizedGain={portfolioSummary.byType[INVESTMENT_TYPES.SIP].totalUnrealizedGain} // NEW
                percentageGain={portfolioSummary.byType[INVESTMENT_TYPES.SIP].percentageGain}
              />
            )}
            
            {/* Equity Summary */}
            {portfolioSummary.byType[INVESTMENT_TYPES.EQUITY].totalInvested > 0 && (
              <SummaryCard
                title="Equity"
                investedAmount={portfolioSummary.byType[INVESTMENT_TYPES.EQUITY].totalInvested}
                currentValue={portfolioSummary.byType[INVESTMENT_TYPES.EQUITY].totalCurrentValue}
                realizedGain={portfolioSummary.byType[INVESTMENT_TYPES.EQUITY].totalRealizedGain}
                unrealizedGain={portfolioSummary.byType[INVESTMENT_TYPES.EQUITY].totalUnrealizedGain} // NEW
                percentageGain={portfolioSummary.byType[INVESTMENT_TYPES.EQUITY].percentageGain}
              />
            )}
          </View>
        )}
        
        {/* Timeline-based Summaries */}
        {portfolioSummary && portfolioSummary.byTimeline && (
          <View style={styles.section}>
            <Text style={styles.subHeader}>Timeline Analysis</Text>
            
            {/* Before April 2025 */}
            <SummaryCard
              title="Pre-April 2025 Investments"
              investedAmount={portfolioSummary.byTimeline.beforeApril2025.totalInvested}
              currentValue={portfolioSummary.byTimeline.beforeApril2025.totalCurrentValue}
              realizedGain={portfolioSummary.byTimeline.beforeApril2025.totalRealizedGain}
              unrealizedGain={portfolioSummary.byTimeline.beforeApril2025.totalUnrealizedGain} // NEW
              percentageGain={portfolioSummary.byTimeline.beforeApril2025.percentageGain}
            />
            
            {/* After April 2025 */}
            <SummaryCard
              title="Post-April 2025 Investments"
              investedAmount={portfolioSummary.byTimeline.afterApril2025.totalInvested}
              currentValue={portfolioSummary.byTimeline.afterApril2025.totalCurrentValue}
              realizedGain={portfolioSummary.byTimeline.afterApril2025.totalRealizedGain}
              unrealizedGain={portfolioSummary.byTimeline.afterApril2025.totalUnrealizedGain} // NEW
              percentageGain={portfolioSummary.byTimeline.afterApril2025.percentageGain}
            />
          </View>
        )}

        
        <Text style={styles.disclaimer}>
          Prices are delayed; not investment advice.
        </Text>
      </ScrollView>
      
      <Portal>
        <FAB.Group
          open={fabOpen}
          icon={fabOpen ? 'close' : 'plus'}
          fabStyle={styles.fab}
          color="#FFFFFF"
          size="small"
          actions={[
            {
              icon: 'plus',
              label: 'Add Investment',
              onPress: handleAddInvestment,
              color: '#FFFFFF',
              style: { 
                backgroundColor: theme.colors.primary,
                ...styles.fabActionItem,
		position: 'absolute',  // This is crucial
		top: 5,  // Adjust this value to move the button lower
		right: 2
              },
              labelStyle: styles.fabActionLabel,
              size: 'small',
              containerStyle: { marginBottom: 0, top: -7, right: 52, alignItems: 'center' } // Center align the icon vertically
            },
            {
              icon: 'minus',
              label: 'Sell Investment',
              onPress: handleSellInvestment,
              color: '#FFFFFF', 
              style: { 
                backgroundColor: theme.colors.primary,
                ...styles.fabActionItem,
		bottom: 13 
              },
              labelStyle: styles.fabActionLabel,
              size: 'small',
              containerStyle: { marginBottom: 103, alignItems: 'center' } // Center align the icon vertically
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          visible={true}
          placement="top"
          fabAnimationDuration={200}
          testID="fab-group"
        />
      </Portal>
    </View>
  );
};

export default PortfolioScreen;