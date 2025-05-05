import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  useTheme, 
  SegmentedButtons,
  HelperText,
  Divider,
  RadioButton,
  Modal,
  Portal,
  IconButton
} from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { addInvestment } from '../services/investmentService';
import { INVESTMENT_TYPES, INVESTMENT_STATUS, SIP_FREQUENCY, MutualFund, SIP, Equity } from '../models';
import { toPaise, formatDate, parseDateString } from '../utils/helpers';
import { globalStyles } from '../utils/theme';
import LoadingScreen from '../components/LoadingScreen';

const AddInvestmentScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { refreshPortfolio } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get default selection from route params, if any
  const defaultType = route.params?.selectedType || INVESTMENT_TYPES.MUTUAL_FUND;
  
  // Form state
  const [investmentType, setInvestmentType] = useState(defaultType);
  
  // Field completion tracking states
  const [purchaseNAVCompleted, setPurchaseNAVCompleted] = useState(false);
  const [unitsCompleted, setUnitsCompleted] = useState(false);
  
  // Mutual Fund & SIP form fields
  const [fundHouse, setFundHouse] = useState('');
  const [schemeName, setSchemeName] = useState('');
  const [units, setUnits] = useState('');
  const [purchaseNAV, setPurchaseNAV] = useState('');
  const [currentNAV, setCurrentNAV] = useState('');
  const [investedAmount, setInvestedAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(formatDate(new Date()));
  
  // SIP specific fields
  const [frequency, setFrequency] = useState(SIP_FREQUENCY.MONTHLY);
  const [amountPerPeriod, setAmountPerPeriod] = useState('');
  const [periods, setPeriods] = useState('');
  
  // Equity form fields
  const [ticker, setTicker] = useState('');
  const [shares, setShares] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  
  // Error state
  const [errors, setErrors] = useState({});
  
  // Date picker state
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [activeDate, setActiveDate] = useState('purchaseDate'); // Track which date field is active
  const [tempDate, setTempDate] = useState(new Date()); // For calendar navigation
  
  // Reset form based on investment type
  useEffect(() => {
    resetForm();
  }, [investmentType]);
  
  // Reset form when returning to this screen
  useEffect(() => {
    // Create a navigation focus listener to reset the form when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      // Reset the form completely when returning to this screen
      resetForm();
    });
    
    // Clean up the listener when component unmounts
    return unsubscribe;
  }, [navigation]);
  
  // Reset form fields
  const resetForm = () => {
    // Reset common fields
    setPurchaseDate(formatDate(new Date()));
    setInvestedAmount('');
    
    // Reset completion tracking states
    setPurchaseNAVCompleted(false);
    setUnitsCompleted(false);
    
    if (investmentType === INVESTMENT_TYPES.MUTUAL_FUND) {
      setFundHouse('');
      setSchemeName('');
      setUnits('');
      setPurchaseNAV('');
      setCurrentNAV('');
    } else if (investmentType === INVESTMENT_TYPES.SIP) {
      setFundHouse('');
      setSchemeName('');
      setUnits('');
      setPurchaseNAV('');
      setCurrentNAV('');
      setFrequency(SIP_FREQUENCY.MONTHLY);
      setAmountPerPeriod('');
      setPeriods('');
    } else if (investmentType === INVESTMENT_TYPES.EQUITY) {
      setTicker('');
      setShares('');
      setPurchasePrice('');
      setCurrentPrice('');
    }
    
    // Reset errors
    setErrors({});
  };
  
  // Calculate missing values
  useEffect(() => {
    if (investmentType === INVESTMENT_TYPES.MUTUAL_FUND || investmentType === INVESTMENT_TYPES.SIP) {
      // Calculate units if investedAmount and purchaseNAV are provided and completed
      if (investedAmount && purchaseNAV && !units && purchaseNAVCompleted) {
        const calculatedUnits = parseFloat(investedAmount) / parseFloat(purchaseNAV);
        setUnits(calculatedUnits.toFixed(3));
      }
      
      // Calculate invested amount if units and purchaseNAV are provided and both completed
      if (units && purchaseNAV && !investedAmount && purchaseNAVCompleted && unitsCompleted) {
        const calculatedAmount = parseFloat(units) * parseFloat(purchaseNAV);
        setInvestedAmount(calculatedAmount.toFixed(2));
      }
    } else if (investmentType === INVESTMENT_TYPES.EQUITY) {
      // Calculate invested amount if shares and purchasePrice are provided
      if (shares && purchasePrice && !investedAmount) {
        const calculatedAmount = parseInt(shares) * parseFloat(purchasePrice);
        setInvestedAmount(calculatedAmount.toFixed(2));
      }
      
      // Calculate shares if investedAmount and purchasePrice are provided
      if (investedAmount && purchasePrice && !shares) {
        const calculatedShares = parseFloat(investedAmount) / parseFloat(purchasePrice);
        setShares(Math.floor(calculatedShares).toString());
      }
    }
  }, [investmentType, investedAmount, purchaseNAV, units, shares, purchasePrice, purchaseNAVCompleted, unitsCompleted]);
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (investmentType === INVESTMENT_TYPES.MUTUAL_FUND) {
      if (!fundHouse) newErrors.fundHouse = 'Fund house is required';
      if (!schemeName) newErrors.schemeName = 'Scheme name is required';
      if (!units) newErrors.units = 'Units are required';
      if (!purchaseNAV) newErrors.purchaseNAV = 'Purchase NAV is required';
      if (!currentNAV) newErrors.currentNAV = 'Current NAV is required';
      if (!investedAmount) newErrors.investedAmount = 'Invested amount is required';
    } else if (investmentType === INVESTMENT_TYPES.SIP) {
      if (!fundHouse) newErrors.fundHouse = 'Fund house is required';
      if (!schemeName) newErrors.schemeName = 'Scheme name is required';
      if (!amountPerPeriod) newErrors.amountPerPeriod = 'Amount per period is required';
      if (!frequency) newErrors.frequency = 'Frequency is required';
      if (!currentNAV) newErrors.currentNAV = 'Current NAV is required';
      if (!units) newErrors.units = 'Units are required';
      if (!investedAmount) newErrors.investedAmount = 'Invested amount is required';
    } else if (investmentType === INVESTMENT_TYPES.EQUITY) {
      if (!ticker) newErrors.ticker = 'Ticker is required';
      if (!shares) newErrors.shares = 'Number of shares is required';
      if (!purchasePrice) newErrors.purchasePrice = 'Purchase price is required';
      if (!currentPrice) newErrors.currentPrice = 'Current price is required';
      if (!investedAmount) newErrors.investedAmount = 'Invested amount is required';
    }
    
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
      
      let investmentData;
      
      // Convert date from DD-MM-YYYY to a Date object
      const purchaseDateObj = parseDateString(purchaseDate);

      if (investmentType === INVESTMENT_TYPES.MUTUAL_FUND) {
        investmentData = {
          ...MutualFund,
          type: INVESTMENT_TYPES.MUTUAL_FUND,
          fundHouse,
          schemeName,
          units: parseFloat(units),
          purchaseNAV: toPaise(purchaseNAV),
          currentNAV: toPaise(currentNAV),
          investedAmount: toPaise(investedAmount),
          status: INVESTMENT_STATUS.ACTIVE,
          purchaseDate: purchaseDateObj,
        };
      } else if (investmentType === INVESTMENT_TYPES.SIP) {
        investmentData = {
          ...SIP,
          type: INVESTMENT_TYPES.SIP,
          fundHouse,
          schemeName,
          units: parseFloat(units),
          amountPerPeriod: toPaise(amountPerPeriod),
          frequency,
          purchaseNAV: toPaise(purchaseNAV),
          currentNAV: toPaise(currentNAV),
          investedAmount: toPaise(investedAmount),
          status: INVESTMENT_STATUS.ACTIVE,
          startDate: purchaseDateObj,
        };
      } else if (investmentType === INVESTMENT_TYPES.EQUITY) {
        investmentData = {
          ...Equity,
          type: INVESTMENT_TYPES.EQUITY,
          ticker,
          shares: parseInt(shares),
          purchasePrice: toPaise(purchasePrice),
          currentPrice: toPaise(currentPrice),
          investedAmount: toPaise(investedAmount),
          status: INVESTMENT_STATUS.ACTIVE,
          purchaseDate: purchaseDateObj,
        };
      }
      
      await addInvestment(investmentData);
      await refreshPortfolio();
      
      Alert.alert(
        'Success',
        'Investment added successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error adding investment:', error);
      Alert.alert('Error', 'Failed to add investment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const styles = StyleSheet.create({
    container: {
      ...globalStyles.container,
      backgroundColor: theme.colors.background,
    },
    header: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 24,
      color: theme.colors.text,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.text,
    },
    input: {
      backgroundColor: theme.colors.surface,
      marginBottom: 16,
    },
    disabledInput: {
      backgroundColor: theme.colors.surfaceDisabled,
      opacity: 0.3,
      marginBottom: 16,
    },
    button: {
      marginTop: 24,
      marginBottom: 40,
    },
    segmentContainer: {
      marginBottom: 24,
    },
    radioGroup: {
      marginBottom: 16,
    },
    radioItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
    },
    radioLabel: {
      fontSize: 16,
      color: theme.colors.text,
    },
    divider: {
      marginVertical: 16,
    },
    helperText: {
      marginTop: -12,
      marginBottom: 12,
      color: theme.colors.onSurfaceVariant,
    },
  });
  
  // Effect to handle date picker modal date setting
  useEffect(() => {
    if (datePickerVisible) {
      // Parse the current date value from DD-MM-YYYY format
      setTempDate(parseDateString(purchaseDate));
    }
  }, [datePickerVisible, purchaseDate]);
    
  // DatePicker Modal
  const renderDatePickerModal = () => {
    
    // Generate calendar days
    const daysInMonth = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(tempDate.getFullYear(), tempDate.getMonth(), 1).getDay();
    
    // Calendar header with month and year
    const monthName = tempDate.toLocaleDateString('en-US', { month: 'long' });
    const yearNumber = tempDate.getFullYear();
    
    // Days of the week header
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Handle selected day
    const handleDaySelect = (day) => {
      const newDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), day);
      const formattedDate = formatDate(newDate);
      
      // Update the date field
      setPurchaseDate(formattedDate);
      
      setDatePickerVisible(false);
    };
    
    // Navigate to previous/next month
    const prevMonth = () => {
      setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth() - 1, 1));
    };
    
    const nextMonth = () => {
      setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 1));
    };
    
    return (
      <Portal>
        <Modal 
          visible={datePickerVisible} 
          onDismiss={() => setDatePickerVisible(false)}
          contentContainerStyle={{
            backgroundColor: theme.colors.surface,
            padding: 20,
            margin: 20,
            borderRadius: 8,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            {/* Month navigation */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 }}>
              <IconButton icon="chevron-left" onPress={prevMonth} />
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{monthName} {yearNumber}</Text>
              <IconButton icon="chevron-right" onPress={nextMonth} />
            </View>
            
            {/* Weekday headers */}
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              {weekdays.map(day => (
                <Text key={day} style={{ flex: 1, textAlign: 'center' }}>{day}</Text>
              ))}
            </View>
            
            {/* Calendar days */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {/* Empty spaces for days before the 1st of the month */}
              {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                <View key={`empty-${index}`} style={{ width: '14.28%', padding: 10 }} />
              ))}
              
              {/* Actual days of the month */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                
                // Check if this day is the selected day
                const currentDate = parseDateString(purchaseDate);
                const isSelected = 
                  day === currentDate.getDate() && 
                  tempDate.getMonth() === currentDate.getMonth() && 
                  tempDate.getFullYear() === currentDate.getFullYear();
                
                return (
                  <Button 
                    key={`day-${day}`}
                    onPress={() => handleDaySelect(day)}
                    mode={isSelected ? "contained" : "text"}
                    style={{ 
                      width: '14.28%', 
                      height: 40,
                      margin: 0,
                      padding: 0,
                      justifyContent: 'center',
                      borderRadius: isSelected ? 20 : 0,
                    }}
                    labelStyle={{ 
                      fontSize: 14,
                      margin: 0,
                    }}
                  >
                    {day}
                  </Button>
                );
              })}
            </View>
            
            {/* Buttons */}
            <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'flex-end' }}>
              <Button onPress={() => setDatePickerVisible(false)} style={{ marginRight: 10 }}>
                Cancel
              </Button>
              <Button mode="contained" onPress={() => {
                // Format selected date
                const formattedDate = formatDate(tempDate);
                
                // Update the date field
                setPurchaseDate(formattedDate);
                
                setDatePickerVisible(false);
              }}>
                Confirm
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    );
  };
  
  if (isLoading) {
    return <LoadingScreen message="Adding investment..." />;
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* Render the DatePicker Modal */}
      {renderDatePickerModal()}
      
      <Text style={styles.header}>Add New Investment</Text>
      
      {/* Investment Type Selection */}
      <View style={styles.segmentContainer}>
        <SegmentedButtons
          value={investmentType}
          onValueChange={setInvestmentType}
          buttons={[
            { value: INVESTMENT_TYPES.MUTUAL_FUND, label: 'Mutual Fund' },
            { value: INVESTMENT_TYPES.SIP, label: 'SIP' },
            { value: INVESTMENT_TYPES.EQUITY, label: 'Equity' },
          ]}
        />
      </View>
      
      {/* Mutual Fund Form */}
      {investmentType === INVESTMENT_TYPES.MUTUAL_FUND && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mutual Fund Details</Text>
          
          <TextInput
            label="Fund House"
            value={fundHouse}
            onChangeText={setFundHouse}
            style={styles.input}
            mode="outlined"
            error={!!errors.fundHouse}
          />
          {errors.fundHouse && <HelperText type="error">{errors.fundHouse}</HelperText>}
          
          <TextInput
            label="Scheme Name"
            value={schemeName}
            onChangeText={setSchemeName}
            style={styles.input}
            mode="outlined"
            error={!!errors.schemeName}
          />
          {errors.schemeName && <HelperText type="error">{errors.schemeName}</HelperText>}
          
          <TextInput
            label="Purchase Date (DD-MM-YYYY)"
            value={purchaseDate}
            onChangeText={setPurchaseDate}
            style={styles.input}
            mode="outlined"
            error={!!errors.purchaseDate}
            right={<TextInput.Icon 
              icon="calendar" 
              onPress={() => {
                setActiveDate('purchaseDate');
                setDatePickerVisible(true);
              }}
            />}
          />
          {errors.purchaseDate && <HelperText type="error">{errors.purchaseDate}</HelperText>}
          
          <TextInput
            label="Investment Amount (₹)"
            value={investedAmount}
            onChangeText={setInvestedAmount}
            style={styles.disabledInput}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.investedAmount}
            editable={false}
          />
          {errors.investedAmount ? (
            <HelperText type="error">{errors.investedAmount}</HelperText>
          ) : (
            <Text style={styles.helperText}>This value is automatically calculated</Text>
          )}
          
          <TextInput
            label="Purchase NAV (₹)"
            value={purchaseNAV}
            onChangeText={(text) => {
              setPurchaseNAV(text);
              setPurchaseNAVCompleted(false); // Reset completion status while typing
            }}
            onBlur={() => setPurchaseNAVCompleted(true)} // Mark as completed when focus leaves
            style={styles.input}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.purchaseNAV}
          />
          {errors.purchaseNAV && <HelperText type="error">{errors.purchaseNAV}</HelperText>}
          
          <TextInput
            label="Units"
            value={units}
            onChangeText={(text) => {
              setUnits(text);
              setUnitsCompleted(false); // Reset completion status while typing
            }}
            onBlur={() => setUnitsCompleted(true)} // Mark as completed when focus leaves
            style={styles.input}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.units}
          />
          {errors.units && <HelperText type="error">{errors.units}</HelperText>}
          
          <TextInput
            label="Current NAV (₹)"
            value={currentNAV}
            onChangeText={setCurrentNAV}
            style={styles.input}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.currentNAV}
          />
          {errors.currentNAV && <HelperText type="error">{errors.currentNAV}</HelperText>}
        </View>
      )}
      
      {/* SIP Form */}
      {investmentType === INVESTMENT_TYPES.SIP && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SIP Details</Text>
          
          <TextInput
            label="Fund House"
            value={fundHouse}
            onChangeText={setFundHouse}
            style={styles.input}
            mode="outlined"
            error={!!errors.fundHouse}
          />
          {errors.fundHouse && <HelperText type="error">{errors.fundHouse}</HelperText>}
          
          <TextInput
            label="Scheme Name"
            value={schemeName}
            onChangeText={setSchemeName}
            style={styles.input}
            mode="outlined"
            error={!!errors.schemeName}
          />
          {errors.schemeName && <HelperText type="error">{errors.schemeName}</HelperText>}
          
          <Text style={styles.sectionTitle}>Frequency</Text>
          <RadioButton.Group
            onValueChange={value => setFrequency(value)}
            value={frequency}
          >
            <View style={styles.radioGroup}>
              <View style={styles.radioItem}>
                <RadioButton value={SIP_FREQUENCY.WEEKLY} />
                <Text style={styles.radioLabel}>Weekly</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value={SIP_FREQUENCY.MONTHLY} />
                <Text style={styles.radioLabel}>Monthly</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value={SIP_FREQUENCY.QUARTERLY} />
                <Text style={styles.radioLabel}>Quarterly</Text>
              </View>
            </View>
          </RadioButton.Group>
          
          <TextInput
            label="Start Date (DD-MM-YYYY)"
            value={purchaseDate}
            onChangeText={setPurchaseDate}
            style={styles.input}
            mode="outlined"
            error={!!errors.purchaseDate}
            right={<TextInput.Icon 
              icon="calendar" 
              onPress={() => {
                setActiveDate('purchaseDate');
                setDatePickerVisible(true);
              }}
            />}
          />
          {errors.purchaseDate && <HelperText type="error">{errors.purchaseDate}</HelperText>}
          
          <TextInput
            label="Amount Per Period (₹)"
            value={amountPerPeriod}
            onChangeText={setAmountPerPeriod}
            style={styles.input}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.amountPerPeriod}
          />
          {errors.amountPerPeriod && <HelperText type="error">{errors.amountPerPeriod}</HelperText>}
          
          <TextInput
            label="Total Units Accumulated"
            value={units}
            onChangeText={(text) => {
              setUnits(text);
              setUnitsCompleted(false); // Reset completion status while typing
            }}
            onBlur={() => setUnitsCompleted(true)} // Mark as completed when focus leaves
            style={styles.input}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.units}
          />
          {errors.units && <HelperText type="error">{errors.units}</HelperText>}
          
          <TextInput
            label="Average Purchase NAV (₹)"
            value={purchaseNAV}
            onChangeText={(text) => {
              setPurchaseNAV(text);
              setPurchaseNAVCompleted(false); // Reset completion status while typing
            }}
            onBlur={() => setPurchaseNAVCompleted(true)} // Mark as completed when focus leaves
            style={styles.input}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.purchaseNAV}
          />
          {errors.purchaseNAV && <HelperText type="error">{errors.purchaseNAV}</HelperText>}
          
          <TextInput
            label="Current NAV (₹)"
            value={currentNAV}
            onChangeText={setCurrentNAV}
            style={styles.input}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.currentNAV}
          />
          {errors.currentNAV && <HelperText type="error">{errors.currentNAV}</HelperText>}
          
          <TextInput
            label="Total Amount Invested (₹)"
            value={investedAmount}
            onChangeText={setInvestedAmount}
            style={styles.input}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.investedAmount}
          />
          {errors.investedAmount && <HelperText type="error">{errors.investedAmount}</HelperText>}
        </View>
      )}
      
      {/* Equity Form */}
      {investmentType === INVESTMENT_TYPES.EQUITY && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equity Details</Text>
          
          <TextInput
            label="Ticker Symbol"
            value={ticker}
            onChangeText={setTicker}
            style={styles.input}
            mode="outlined"
            error={!!errors.ticker}
          />
          {errors.ticker && <HelperText type="error">{errors.ticker}</HelperText>}
          
          <TextInput
            label="Purchase Date (DD-MM-YYYY)"
            value={purchaseDate}
            onChangeText={setPurchaseDate}
            style={styles.input}
            mode="outlined"
            error={!!errors.purchaseDate}
            right={<TextInput.Icon 
              icon="calendar" 
              onPress={() => {
                setActiveDate('purchaseDate');
                setDatePickerVisible(true);
              }}
            />}
          />
          {errors.purchaseDate && <HelperText type="error">{errors.purchaseDate}</HelperText>}
          
          <TextInput
            label="Number of Shares"
            value={shares}
            onChangeText={setShares}
            style={styles.input}
            mode="outlined"
            keyboardType="number-pad"
            error={!!errors.shares}
          />
          {errors.shares && <HelperText type="error">{errors.shares}</HelperText>}
          
          <TextInput
            label="Purchase Price Per Share (₹)"
            value={purchasePrice}
            onChangeText={setPurchasePrice}
            style={styles.input}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.purchasePrice}
          />
          {errors.purchasePrice && <HelperText type="error">{errors.purchasePrice}</HelperText>}
          
          <TextInput
            label="Total Amount Invested (₹)"
            value={investedAmount}
            onChangeText={setInvestedAmount}
            style={styles.disabledInput}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.investedAmount}
            editable={false}
          />
          {errors.investedAmount ? (
            <HelperText type="error">{errors.investedAmount}</HelperText>
          ) : (
            <Text style={styles.helperText}>This value is automatically calculated</Text>
          )}
          
          <TextInput
            label="Current Price Per Share (₹)"
            value={currentPrice}
            onChangeText={setCurrentPrice}
            style={styles.input}
            mode="outlined"
            keyboardType="decimal-pad"
            error={!!errors.currentPrice}
          />
          {errors.currentPrice && <HelperText type="error">{errors.currentPrice}</HelperText>}
        </View>
      )}
      
      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.button}
      >
        Add Investment
      </Button>
    </ScrollView>
  );
};

export default AddInvestmentScreen; 