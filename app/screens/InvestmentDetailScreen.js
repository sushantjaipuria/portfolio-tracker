import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Divider, useTheme } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { INVESTMENT_TYPES, INVESTMENT_STATUS } from '../models';
import { getOriginalInvestments } from '../utils/investmentMerger';
import { formatCurrency, formatPercentage, formatDate, getGainLossColor, formatNumber } from '../utils/helpers';
import { globalStyles } from '../utils/theme';

const InvestmentDetailScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { investments } = useApp();
  const investment = route.params?.investment;
  const [originalInvestments, setOriginalInvestments] = useState([]);
  
  // Get original investments if this is a merged investment
  useEffect(() => {
    if (investment && investments.length) {
      const originals = getOriginalInvestments(investment, investments);
      setOriginalInvestments(originals);
    }
  }, [investment, investments]);
  
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
  
  // Calculate gain/loss percentage
  const isActive = investment.status === INVESTMENT_STATUS.ACTIVE;
  let currentValue = 0;
  let gainLoss = 0;
  
  if (investment.type === INVESTMENT_TYPES.MUTUAL_FUND || investment.type === INVESTMENT_TYPES.SIP) {
    currentValue = investment.units * (investment.currentNAV / 100);
    if (investment.investedAmount > 0) {
      gainLoss = ((currentValue - (investment.investedAmount / 100)) / (investment.investedAmount / 100)) * 100;
    }
  } else if (investment.type === INVESTMENT_TYPES.EQUITY) {
    currentValue = investment.shares * (investment.currentPrice / 100);
    if (investment.investedAmount > 0) {
      gainLoss = ((currentValue - (investment.investedAmount / 100)) / (investment.investedAmount / 100)) * 100;
    }
  }
  
  const gainLossColor = getGainLossColor(gainLoss);
  
  // Handle sell button press
  const handleSellPress = () => {
    navigation.navigate('SellInvestment', { investment });
  };
  
  // Render transaction history section
  const renderTransactionHistory = () => {
    if (originalInvestments.length <= 1) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        <Card style={styles.card}>
          <View style={{ overflow: 'hidden', borderRadius: 8 }}>
            <Card.Content>
              {originalInvestments.map((inv, index) => (
                <View key={inv.id}>
                  {index > 0 && <Divider style={styles.divider} />}
                  <Text style={styles.transactionTitle}>
                    Transaction {index + 1} - {formatDate(inv.purchaseDate)}
                  </Text>
                  
                  {investment.type === INVESTMENT_TYPES.EQUITY ? (
                    <>
                      <View style={styles.row}>
                        <Text style={styles.label}>Shares</Text>
                        <Text style={styles.value}>{inv.shares}</Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.label}>Purchase Price</Text>
                        <Text style={styles.value}>{formatCurrency(inv.purchasePrice)}</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.row}>
                        <Text style={styles.label}>Units</Text>
                        <Text style={styles.value}>{formatNumber(inv.units, 3)}</Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.label}>NAV</Text>
                        <Text style={styles.value}>{formatCurrency(inv.purchaseNAV)}</Text>
                      </View>
                    </>
                  )}
                  
                  <View style={styles.row}>
                    <Text style={styles.label}>Amount</Text>
                    <Text style={styles.value}>{formatCurrency(inv.investedAmount)}</Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </View>
        </Card>
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
      marginBottom: 8,
      color: theme.colors.text,
    },
    subHeader: {
      fontSize: 16,
      marginBottom: 16,
      color: theme.colors.text,
      opacity: isActive ? 1 : 0.6,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.text,
    },
    card: {
      ...globalStyles.card,
      marginBottom: 16,
    },
    divider: {
      marginVertical: 16,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    label: {
      fontSize: 14,
      color: theme.colors.text,
    },
    value: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    highlight: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
      backgroundColor: isActive ? theme.colors.primary : theme.colors.disabled,
    },
    statusText: {
      fontSize: 14,
      color: isActive ? theme.colors.primary : theme.colors.disabled,
    },
    buttonContainer: {
      marginTop: 16,
      marginBottom: 32,
    },
    disclaimer: {
      fontSize: 12,
      color: theme.colors.text,
      textAlign: 'center',
      marginTop: 16,
      fontStyle: 'italic',
    },
    transactionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.text,
    },
  });
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Investment Details</Text>
      
      {/* Status */}
      <View style={styles.statusContainer}>
        <View style={styles.statusIndicator} />
        <Text style={styles.statusText}>
          {isActive ? 'Active' : 'Sold'} {investment.type}
        </Text>
      </View>
      
      {/* Investment name */}
      {investment.type === INVESTMENT_TYPES.MUTUAL_FUND || investment.type === INVESTMENT_TYPES.SIP ? (
        <Text style={styles.subHeader}>{investment.fundHouse} - {investment.schemeName}</Text>
      ) : (
        <Text style={styles.subHeader}>{investment.ticker}</Text>
      )}
      
      {/* Summary Section */}
      <Card style={styles.card}>
        <View style={{ overflow: 'hidden', borderRadius: 8 }}>
          <Card.Content>
            <View style={styles.row}>
              <Text style={styles.label}>Invested Amount</Text>
              <Text style={styles.value}>{formatCurrency(investment.investedAmount)}</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Current Value</Text>
              <Text style={styles.value}>{formatCurrency(currentValue * 100)}</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Gain/Loss</Text>
              <Text style={[styles.value, { color: gainLossColor }]}>
                {formatPercentage(gainLoss)}
              </Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Purchase Date</Text>
              <Text style={styles.value}>
                {formatDate(investment.purchaseDate)}
              </Text>
            </View>
            
            {!isActive && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.row}>
                  <Text style={styles.label}>Sold Date</Text>
                  <Text style={styles.value}>
                    {formatDate(investment.soldDate)}
                  </Text>
                </View>
              </>
            )}
          </Card.Content>
        </View>
      </Card>
      
      {/* Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <Card style={styles.card}>
          <View style={{ overflow: 'hidden', borderRadius: 8 }}>
            <Card.Content>
              {investment.type === INVESTMENT_TYPES.MUTUAL_FUND || investment.type === INVESTMENT_TYPES.SIP ? (
                <>
                  <View style={styles.row}>
                    <Text style={styles.label}>Fund House</Text>
                    <Text style={styles.value}>{investment.fundHouse}</Text>
                  </View>
                  
                  <View style={styles.row}>
                    <Text style={styles.label}>Scheme Name</Text>
                    <Text style={styles.value}>{investment.schemeName}</Text>
                  </View>
                  
                  <View style={styles.row}>
                    <Text style={styles.label}>Units</Text>
                    <Text style={styles.value}>{formatNumber(investment.units, 3)}</Text>
                  </View>
                  
                  <View style={styles.row}>
                    <Text style={styles.label}>Purchase NAV</Text>
                    <Text style={styles.value}>{formatCurrency(investment.purchaseNAV)}</Text>
                  </View>
                  
                  <View style={styles.row}>
                    <Text style={styles.label}>Current NAV</Text>
                    <Text style={styles.value}>{formatCurrency(investment.currentNAV)}</Text>
                  </View>
                  
                  {investment.type === INVESTMENT_TYPES.SIP && (
                    <>
                      <View style={styles.row}>
                        <Text style={styles.label}>Frequency</Text>
                        <Text style={styles.value}>{investment.frequency}</Text>
                      </View>
                      
                      <View style={styles.row}>
                        <Text style={styles.label}>Amount Per Period</Text>
                        <Text style={styles.value}>{formatCurrency(investment.amountPerPeriod)}</Text>
                      </View>
                    </>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.row}>
                    <Text style={styles.label}>Ticker</Text>
                    <Text style={styles.value}>{investment.ticker}</Text>
                  </View>
                  
                  <View style={styles.row}>
                    <Text style={styles.label}>Shares</Text>
                    <Text style={styles.value}>{investment.shares}</Text>
                  </View>
                  
                  <View style={styles.row}>
                    <Text style={styles.label}>Purchase Price</Text>
                    <Text style={styles.value}>{formatCurrency(investment.purchasePrice)}</Text>
                  </View>
                  
                  <View style={styles.row}>
                    <Text style={styles.label}>Current Price</Text>
                    <Text style={styles.value}>{formatCurrency(investment.currentPrice)}</Text>
                  </View>
                </>
              )}
              
              {!isActive && (
                <>
                  <Divider style={styles.divider} />
                  {investment.type === INVESTMENT_TYPES.MUTUAL_FUND || investment.type === INVESTMENT_TYPES.SIP ? (
                    <>
                      <View style={styles.row}>
                        <Text style={styles.label}>Sold Units</Text>
                        <Text style={styles.value}>{formatNumber(investment.soldUnits, 3)}</Text>
                      </View>
                      
                      <View style={styles.row}>
                        <Text style={styles.label}>Sold NAV</Text>
                        <Text style={styles.value}>{formatCurrency(investment.soldNAV)}</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.row}>
                        <Text style={styles.label}>Sold Shares</Text>
                        <Text style={styles.value}>{investment.soldShares}</Text>
                      </View>
                      
                      <View style={styles.row}>
                        <Text style={styles.label}>Sold Price</Text>
                        <Text style={styles.value}>{formatCurrency(investment.soldPrice)}</Text>
                      </View>
                    </>
                  )}
                </>
              )}
            </Card.Content>
          </View>
        </Card>
      </View>
      
      {/* Action buttons */}
      {isActive && (
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            onPress={handleSellPress}
            icon="cash"
          >
            Sell Investment
          </Button>
        </View>
      )}
      
      {/* Transaction History Section - only shown for merged investments */}
      {originalInvestments.length > 1 && renderTransactionHistory()}
      
      <Text style={styles.disclaimer}>
        Prices are delayed; not investment advice.
      </Text>
    </ScrollView>
  );
};

export default InvestmentDetailScreen;