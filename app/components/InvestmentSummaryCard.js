import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatCurrency } from '../utils/helpers';
import { globalStyles } from '../utils/theme';

const InvestmentSummaryCard = ({ 
  schemeName, 
  currentValue = 0, 
  totalUnits = 0, 
  remainingUnits = 0, 
  currentNAV = 0,
  totalShares = 0,
  remainingShares = 0,
  currentPrice = 0,
  type
}) => {
  const theme = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
      marginTop: 8,
    },
    cardContainer: {
      // No borderRadius here, will be applied directly to Card
    },
    titleContainer: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    title: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    content: {
      padding: 16,
    },
    row: {
      ...globalStyles.row,
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    label: {
      fontSize: 14,
      color: theme.colors.text,
    },
    value: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
  });

  const isMutualFund = type === 'Mutual Fund' || type === 'SIP';

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <Card style={{ borderRadius: 8 }}>
          <View style={{ overflow: 'hidden', borderRadius: 8 }}>
            <Card.Title
              title={schemeName}
              titleStyle={styles.title}
              style={styles.titleContainer}
            />
            <Card.Content style={styles.content}>
              <View style={styles.row}>
                <Text style={styles.label}>Current Value</Text>
                <Text style={styles.value}>
                  {formatCurrency(currentValue)}
                </Text>
              </View>
              
              {isMutualFund ? (
                <>
                  <View style={styles.row}>
                    <Text style={styles.label}>Total Units</Text>
                    <Text style={styles.value}>{typeof totalUnits === 'number' ? parseFloat(totalUnits).toFixed(4) : (totalUnits || '0')}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Remaining Units</Text>
                    <Text style={styles.value}>{typeof remainingUnits === 'number' ? parseFloat(remainingUnits).toFixed(4) : (remainingUnits || '0')}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Current NAV</Text>
                    <Text style={styles.value}>{formatCurrency(currentNAV)}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.row}>
                    <Text style={styles.label}>Total Shares</Text>
                    <Text style={styles.value}>{totalShares || '0'}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Remaining Shares</Text>
                    <Text style={styles.value}>{remainingShares || '0'}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Current Price</Text>
                    <Text style={styles.value}>{formatCurrency(currentPrice)}</Text>
                  </View>
                </>
              )}
            </Card.Content>
          </View>
        </Card>
      </View>
    </View>
  );
};

export default InvestmentSummaryCard;