import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatCurrency, formatPercentage, getGainLossColor } from '../utils/helpers';
import { globalStyles } from '../utils/theme';

const SummaryCard = ({ title, investedAmount, currentValue, percentageGain, isInactive = false }) => {
  const theme = useTheme();
  const gainLossColor = getGainLossColor(percentageGain);
  
  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
      opacity: isInactive ? 0.6 : 1,
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
    percentageValue: {
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <Card style={{ borderRadius: 8 }}>
          <View style={{ overflow: 'hidden', borderRadius: 8 }}>
          <Card.Title
            title={title}
            titleStyle={styles.title}
            style={styles.titleContainer}
          />
          <Card.Content style={styles.content}>
            <View style={styles.row}>
              <Text style={styles.label}>Invested Amount</Text>
              <Text style={styles.value}>
                {formatCurrency(investedAmount)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Current Value</Text>
              <Text style={styles.value}>
                {formatCurrency(currentValue)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Gain/Loss</Text>
              <Text style={[styles.percentageValue, { color: gainLossColor }]}>
                {formatPercentage(percentageGain)}
              </Text>
            </View>
          </Card.Content>
          </View>
        </Card>
      </View>
    </View>
  );
};

export default SummaryCard; 