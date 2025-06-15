import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Divider, useTheme, IconButton } from 'react-native-paper';
import { formatCurrency, formatPercentage, getGainLossColor, formatNumber } from '../utils/helpers';
import { formatSaleDate, getGroupedSchemeDisplayName } from '../utils/groupSoldInvestments';
import { INVESTMENT_TYPES } from '../models';
import { globalStyles } from '../utils/theme';

const SoldSchemeSummaryCard = ({ groupedScheme, onPress }) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate display values
  const totalUnits = groupedScheme.type === INVESTMENT_TYPES.EQUITY ? 
    groupedScheme.totalSharesSold : groupedScheme.totalUnitsSold;
  const unitsLabel = groupedScheme.type === INVESTMENT_TYPES.EQUITY ? 'shares' : 'units';
  const gainLossColor = getGainLossColor(groupedScheme.totalGainLossPercentage);
  const displayName = getGroupedSchemeDisplayName(groupedScheme);
  
  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    content: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    titleContainer: {
      flex: 1,
      marginRight: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.errorContainer,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.error,
      marginRight: 4,
    },
    statusText: {
      fontSize: 12,
      color: theme.colors.error,
      fontWeight: '500',
    },
    summarySection: {
      marginBottom: 12,
    },
    summaryRow: {
      ...globalStyles.row,
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
    gainLossValue: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    expandButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
    expandButtonText: {
      fontSize: 14,
      color: theme.colors.primary,
      marginRight: 4,
    },
    salesHistorySection: {
      marginTop: 8,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    salesHistoryTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 12,
      color: theme.colors.text,
    },
    saleItem: {
      backgroundColor: theme.colors.surfaceVariant,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    saleItem_last: {
      marginBottom: 0,
    },
    saleDate: {
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.7,
      marginBottom: 4,
    },
    saleDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    saleUnits: {
      fontSize: 13,
      color: theme.colors.text,
      flex: 1,
    },
    saleGain: {
      fontSize: 13,
      fontWeight: 'bold',
    },
  });
  
  const handleCardPress = () => {
    if (onPress) {
      onPress(groupedScheme);
    }
  };
  
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.7}>
      <View style={styles.container}>
        <Card style={{ borderRadius: 8 }}>
          <View style={{ overflow: 'hidden', borderRadius: 8 }}>
            <Card.Content style={styles.content}>
              {/* Header Section */}
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>{displayName}</Text>
                  {groupedScheme.fundHouse && (
                    <Text style={styles.subtitle}>{groupedScheme.fundHouse}</Text>
                  )}
                </View>
                <View style={styles.statusIndicator}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Inactive</Text>
                </View>
              </View>
              
              {/* Summary Section */}
              <View style={styles.summarySection}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Total {unitsLabel.charAt(0).toUpperCase() + unitsLabel.slice(1)} Sold
                  </Text>
                  <Text style={styles.summaryValue}>
                    {formatNumber(totalUnits, groupedScheme.type === INVESTMENT_TYPES.EQUITY ? 0 : 3)} {unitsLabel}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Gain/Loss</Text>
                  <Text style={[styles.gainLossValue, { color: gainLossColor }]}>
                    {formatCurrency(groupedScheme.totalGainLoss)} ({formatPercentage(groupedScheme.totalGainLossPercentage)})
                  </Text>
                </View>
              </View>
              
              {/* Expand/Collapse Button */}
              {groupedScheme.salesHistory && groupedScheme.salesHistory.length > 0 && (
                <TouchableOpacity style={styles.expandButton} onPress={toggleExpansion}>
                  <Text style={styles.expandButtonText}>
                    {isExpanded ? 'Hide' : 'Show'} Sales History
                  </Text>
                  <IconButton
                    icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    iconColor={theme.colors.primary}
                    style={{ margin: 0 }}
                  />
                </TouchableOpacity>
              )}
              
              {/* Sales History Section */}
              {isExpanded && groupedScheme.salesHistory && groupedScheme.salesHistory.length > 0 && (
                <View style={styles.salesHistorySection}>
                  <Text style={styles.salesHistoryTitle}>Sales History</Text>
                  
                  {groupedScheme.salesHistory.map((sale, index) => (
                    <View 
                      key={`${sale.investmentId}_${sale.date}_${index}`}
                      style={[
                        styles.saleItem,
                        index === groupedScheme.salesHistory.length - 1 && styles.saleItem_last
                      ]}
                    >
                      <Text style={styles.saleDate}>
                        {formatSaleDate(sale.date)}
                      </Text>
                      
                      <View style={styles.saleDetails}>
                        <Text style={styles.saleUnits}>
                          {formatNumber(sale.units, groupedScheme.type === INVESTMENT_TYPES.EQUITY ? 0 : 3)} {unitsLabel} @ {formatCurrency(sale.salePrice)}
                        </Text>
                        <Text style={[styles.saleGain, { color: getGainLossColor(sale.profit > 0 ? 1 : sale.profit < 0 ? -1 : 0) }]}>
                          {sale.profit >= 0 ? '+' : ''}{formatCurrency(sale.profit)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Card.Content>
          </View>
        </Card>
      </View>
    </TouchableOpacity>
  );
};

export default SoldSchemeSummaryCard;