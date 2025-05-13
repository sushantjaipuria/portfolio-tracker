import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Modal, Portal, TextInput, Text, Button, useTheme } from 'react-native-paper';
import { updateInvestment } from '../services/investmentService';
import { toPaise, formatDate, parseDateString } from '../utils/helpers';
import { INVESTMENT_TYPES } from '../models';

const EditTransactionModal = ({ 
  visible, 
  onDismiss, 
  transaction, 
  onSuccess 
}) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [units, setUnits] = useState('');
  const [purchaseNAV, setPurchaseNAV] = useState('');
  const [shares, setShares] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  
  // Error state
  const [errors, setErrors] = useState({});
  
  // Populate form with transaction data when visible
  useEffect(() => {
    if (visible && transaction) {
      if (transaction.type === INVESTMENT_TYPES.MUTUAL_FUND || transaction.type === INVESTMENT_TYPES.SIP) {
        setUnits(transaction.units.toString());
        setPurchaseNAV((transaction.purchaseNAV / 100).toFixed(2));
      } else if (transaction.type === INVESTMENT_TYPES.EQUITY) {
        setShares(transaction.shares.toString());
        setPurchasePrice((transaction.purchasePrice / 100).toFixed(2));
      }
      setPurchaseDate(formatDate(transaction.purchaseDate));
    }
  }, [visible, transaction]);
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (transaction.type === INVESTMENT_TYPES.MUTUAL_FUND || transaction.type === INVESTMENT_TYPES.SIP) {
      if (!units) newErrors.units = 'Units are required';
      if (parseFloat(units) <= 0) newErrors.units = 'Units must be greater than 0';
      
      if (!purchaseNAV) newErrors.purchaseNAV = 'Purchase NAV is required';
      if (parseFloat(purchaseNAV) <= 0) newErrors.purchaseNAV = 'Purchase NAV must be greater than 0';
    } else if (transaction.type === INVESTMENT_TYPES.EQUITY) {
      if (!shares) newErrors.shares = 'Shares are required';
      if (parseInt(shares) <= 0) newErrors.shares = 'Shares must be greater than 0';
      
      if (!purchasePrice) newErrors.purchasePrice = 'Purchase price is required';
      if (parseFloat(purchasePrice) <= 0) newErrors.purchasePrice = 'Purchase price must be greater than 0';
    }
    
    if (!purchaseDate) newErrors.purchaseDate = 'Purchase date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fix the errors in the form');
      return;
    }
    
    try {
      setIsLoading(true);
      
      let updates = {};
      const purchaseDateObj = parseDateString(purchaseDate);
      
      // Calculate new investedAmount based on units/shares and price/NAV
      let newInvestedAmount = 0;
      
      if (transaction.type === INVESTMENT_TYPES.MUTUAL_FUND || transaction.type === INVESTMENT_TYPES.SIP) {
        newInvestedAmount = parseFloat(units) * parseFloat(purchaseNAV) * 100; // Convert to paise
        
        updates = {
          units: parseFloat(units),
          purchaseNAV: toPaise(purchaseNAV),
          investedAmount: Math.round(newInvestedAmount),
          purchaseDate: purchaseDateObj,
        };
      } else if (transaction.type === INVESTMENT_TYPES.EQUITY) {
        newInvestedAmount = parseInt(shares) * parseFloat(purchasePrice) * 100; // Convert to paise
        
        updates = {
          shares: parseInt(shares),
          purchasePrice: toPaise(purchasePrice),
          investedAmount: Math.round(newInvestedAmount),
          purchaseDate: purchaseDateObj,
        };
      }
      
      await updateInvestment(transaction.id, updates);
      
      Alert.alert(
        'Success',
        'Transaction updated successfully',
        [{ text: 'OK', onPress: () => {
          onSuccess();
          onDismiss();
        }}]
      );
    } catch (error) {
      console.error('Error updating transaction:', error);
      Alert.alert('Error', 'Failed to update transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Portal>
      <Modal 
        visible={visible} 
        onDismiss={onDismiss}
        contentContainerStyle={{
          backgroundColor: theme.colors.surface,
          padding: 20,
          margin: 20,
          borderRadius: 8,
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <Text style={styles.title}>Edit Transaction</Text>
              
              <TextInput
                label="Purchase Date (DD-MM-YYYY)"
                value={purchaseDate}
                onChangeText={setPurchaseDate}
                style={styles.input}
                mode="outlined"
                error={!!errors.purchaseDate}
              />
              {errors.purchaseDate && <Text style={styles.errorText}>{errors.purchaseDate}</Text>}
              
              {(transaction?.type === INVESTMENT_TYPES.MUTUAL_FUND || transaction?.type === INVESTMENT_TYPES.SIP) && (
                <>
                  <TextInput
                    label="Units"
                    value={units}
                    onChangeText={setUnits}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="decimal-pad"
                    error={!!errors.units}
                  />
                  {errors.units && <Text style={styles.errorText}>{errors.units}</Text>}
                  
                  <TextInput
                    label="Purchase NAV (₹)"
                    value={purchaseNAV}
                    onChangeText={setPurchaseNAV}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="decimal-pad"
                    error={!!errors.purchaseNAV}
                  />
                  {errors.purchaseNAV && <Text style={styles.errorText}>{errors.purchaseNAV}</Text>}
                </>
              )}
              
              {transaction?.type === INVESTMENT_TYPES.EQUITY && (
                <>
                  <TextInput
                    label="Number of Shares"
                    value={shares}
                    onChangeText={setShares}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="number-pad"
                    error={!!errors.shares}
                  />
                  {errors.shares && <Text style={styles.errorText}>{errors.shares}</Text>}
                  
                  <TextInput
                    label="Purchase Price Per Share (₹)"
                    value={purchasePrice}
                    onChangeText={setPurchasePrice}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="decimal-pad"
                    error={!!errors.purchasePrice}
                  />
                  {errors.purchasePrice && <Text style={styles.errorText}>{errors.purchasePrice}</Text>}
                </>
              )}
              
              <View style={styles.buttonContainer}>
                <Button 
                  mode="outlined" 
                  onPress={onDismiss} 
                  style={styles.button}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleSubmit} 
                  style={styles.button}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Save
                </Button>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    marginLeft: 8,
  },
});

export default EditTransactionModal;