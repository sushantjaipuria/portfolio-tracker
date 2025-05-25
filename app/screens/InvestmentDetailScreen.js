import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Button, Card, Divider, useTheme } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { INVESTMENT_TYPES, INVESTMENT_STATUS } from '../models';
import { getOriginalInvestments } from '../utils/investmentMerger';
import { formatCurrency, formatPercentage, formatDate, getGainLossColor, formatNumber } from '../utils/helpers';
import { globalStyles } from '../utils/theme';
import EditTransactionModal from '../components/EditTransactionModal';

const InvestmentDetailScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { investments, mergedInvestments, refreshPortfolio } = useApp(); // Add mergedInvestments
  
  // Get investment ID from route params
  const investmentId = route.params?.investment?.id;
  const paramInvestment = route.params?.investment;
  
  // CHANGE: Look in mergedInvestments instead of raw investments
  const freshInvestment = mergedInvestments.find(inv => inv.id === investmentId);
  
  // Use fresh merged data if available
  const investment = freshInvestment || paramInvestment;
  
  const [originalInvestments, setOriginalInvestments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Add state for edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Get original investments if this is a merged investment
  useEffect(() => {
    if (investment && investments.length) {
      const originals = getOriginalInvestments(investment, investments);
      setOriginalInvestments(originals);
    }
  }, [investment, investments]);
  
  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshPortfolio();
    setRefreshing(false);
  };
  
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
  
  // The merged investment already contains the correct values
  if (investment.type === INVESTMENT_TYPES.MUTUAL_FUND || investment.type === INVESTMENT_TYPES.SIP) {
    currentValue = investment.units * (investment.currentNAV / 100); // units already contains remaining
    if (investment.investedAmount > 0) {
      // investedAmount already contains remaining invested amount from merger
      gainLoss = ((currentValue - (investment.investedAmount / 100)) / (investment.investedAmount / 100)) * 100;
    }
  } else if (investment.type === INVESTMENT_TYPES.EQUITY) {
    currentValue = investment.shares * (investment.currentPrice / 100); // shares already contains remaining
    if (investment.investedAmount > 0) {
      // investedAmount already contains remaining invested amount from merger
      gainLoss = ((currentValue - (investment.investedAmount / 100)) / (investment.investedAmount / 100)) * 100;
    }
  }
  
  const gainLossColor = getGainLossColor(gainLoss);
  
  // Handle sell button press
  const handleSellPress = () => {
    navigation.navigate('SellInvestment', { investment });
  };
  
  // Handle edit button press
  const handleEditPress = (transaction) => {
    setSelectedTransaction(transaction);
    setEditModalVisible(true);
  };
  
  // Handle successful edit
  const handleEditSuccess = () => {
    refreshPortfolio();
  };
  
  // Render sales history section
  const renderSalesHistory = () => {
    if (!investment.salesHistory || investment.salesHistory.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales History</Text>
        <Card style={styles.card}>
          <View style={{ overflow: 'hidden', borderRadius: 8 }}>
            <Card.Content>
              {investment.salesHistory.map((sale, index) => (
                <View key={index}>
                  {index > 0 && <Divider style={styles.divider} />}
                  <Text style={styles.transactionTitle}>
                    Sale {index + 1} - {formatDate(sale.saleDate)}
                  </Text>
                  
                  {investment.type === INVESTMENT_TYPES.EQUITY ? (
                    <>
                      <View style={styles.row}>
                        <Text style={styles.label}>Shares Sold</Text>
                        <Text style={styles.value}>{sale.shares}</Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.label}>Sale Price</Text>
                        <Text style={styles.value}>{formatCurrency(sale.salePrice)}</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.row}>
                        <Text style={styles.label}>Units Sold</Text>
                        <Text style={styles.value}>{formatNumber(sale.units, 3)}</Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.label}>Sale NAV</Text>
                        <Text style={styles.value}>{formatCurrency(sale.salePrice)}</Text>
                      </View>
                    </>
                  )}
                  
                  <View style={styles.row}>
                    <Text style={styles.label}>Profit/Loss</Text>
                    <Text style={[
                      styles.value, 
                      { color: getGainLossColor(sale.profit) }
                    ]}>
                      {formatCurrency(sale.profit)}
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </View>
        </Card>
      </View>
    );
  };

  // Render transaction history section
  const renderTransactionHistory = () => {
    if (originalInvestments.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        <Card style={styles.card}>
          <View style={{ overflow: 'hidden', borderRadius: 8 }}>
            <Card.Content>
              {originalInvestments.map((inv, index) => (
                <View key={inv.id}>
                  {index > 0 && <Divider style={styles.divider} />}
                  <View style={styles.transactionHeader}>
                    <Text style={styles.transactionTitle}>
                      Transaction {index + 1} - {formatDate(inv.purchaseDate)}
                    </Text>
                    <Button 
                      mode="text" 
                      compact 
                      icon="pencil" 
                      onPress={() => handleEditPress(inv)}
                    >
                      Edit
                    </Button>
                  </View>
                  
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
    transactionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
  });
  
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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
            
            <View style={styles.row}>
              <Text style={styles.label}>Remaining {investment.type === INVESTMENT_TYPES.EQUITY ? 'Shares' : 'Units'}</Text>
              <Text style={styles.value}>
                {investment.type === INVESTMENT_TYPES.EQUITY 
                  ? investment.shares
                  : formatNumber(investment.units, 3)}
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
              
              {/* For backward compatibility, only show these if there's no salesHistory */}
              {!isActive && (!investment.salesHistory || investment.salesHistory.length === 0) && (
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
      
      {/* Transaction History Section */}
      {renderTransactionHistory()}
      
      {/* Sales History Section */}
      {renderSalesHistory()}
      
      {/* Edit Transaction Modal */}
      <EditTransactionModal
        visible={editModalVisible}
        onDismiss={() => setEditModalVisible(false)}
        transaction={selectedTransaction}
        onSuccess={handleEditSuccess}
      />
      
      <Text style={styles.disclaimer}>
        Prices are delayed; not investment advice.
      </Text>
    </ScrollView>
  );
};

export default InvestmentDetailScreen;