import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatCurrency, formatPercentage, getGainLossColor, formatNumber } from '../utils/helpers';
import { INVESTMENT_TYPES, INVESTMENT_STATUS } from '../models';
import { globalStyles } from '../utils/theme';

const InvestmentItem = ({ investment, onPress }) => {
  const theme = useTheme();
  const isInactive = investment.status === INVESTMENT_STATUS.INACTIVE;
  
  // Calculate gain/loss percentage
  let gainLoss = 0;
  if (investment.investedAmount > 0) {
    const currentValue = 
      investment.type === INVESTMENT_TYPES.EQUITY
        ? investment.shares * investment.currentPrice
        : investment.units * investment.currentNAV;
    
    gainLoss = ((currentValue - investment.investedAmount) / investment.investedAmount) * 100;
  }
  
  const gainLossColor = getGainLossColor(gainLoss);
  
  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
      opacity: isInactive ? 0.6 : 1,
    },
    cardContainer: {
      // No borderRadius here, will be applied directly to Card
    },
    content: {
      padding: 16,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.text,
    },
    row: {
      ...globalStyles.row,
      justifyContent: 'space-between',
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
    gainLoss: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
      backgroundColor: isInactive ? theme.colors.disabled : theme.colors.primary,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusText: {
      fontSize: 12,
      color: isInactive ? theme.colors.disabled : theme.colors.primary,
    },
  });
  
  // Render different content based on investment type
  const renderDetails = () => {
    if (investment.type === INVESTMENT_TYPES.MUTUAL_FUND || investment.type === INVESTMENT_TYPES.SIP) {
      return (
        <>
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
        </>
      );
    } else if (investment.type === INVESTMENT_TYPES.EQUITY) {
      return (
        <>
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
      );
    }
    return null;
  };
  
  // Get the displayed title based on investment type
  const getTitle = () => {
    if (investment.type === INVESTMENT_TYPES.MUTUAL_FUND || investment.type === INVESTMENT_TYPES.SIP) {
      return `${investment.fundHouse} - ${investment.schemeName}`;
    } else if (investment.type === INVESTMENT_TYPES.EQUITY) {
      return investment.ticker;
    }
    return '';
  };
  
  return (
    <TouchableOpacity onPress={() => onPress(investment)}>
      <View style={styles.container}>
        <View style={styles.cardContainer}>
          <Card style={{ borderRadius: 8, overflow: 'hidden' }}>
            <Card.Content style={styles.content}>
              <Text style={styles.title}>{getTitle()}</Text>
              
              <View style={styles.statusRow}>
                <View style={styles.statusIndicator} />
                <Text style={styles.statusText}>
                  {isInactive ? 'Inactive' : 'Active'} {investment.type}
                </Text>
              </View>
              
              {renderDetails()}
              
              <View style={styles.row}>
                <Text style={styles.label}>Invested Amount</Text>
                <Text style={styles.value}>{formatCurrency(investment.investedAmount)}</Text>
              </View>
              
              <View style={styles.row}>
                <Text style={styles.label}>Current Value</Text>
                <Text style={styles.value}>
                  {investment.type === INVESTMENT_TYPES.EQUITY
                    ? formatCurrency(investment.shares * investment.currentPrice)
                    : formatCurrency(investment.units * investment.currentNAV)}
                </Text>
              </View>
              
              <View style={styles.row}>
                <Text style={styles.label}>Gain/Loss</Text>
                <Text style={[styles.gainLoss, { color: gainLossColor }]}>
                  {formatPercentage(gainLoss)}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default InvestmentItem; 