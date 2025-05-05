import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

const LoadingScreen = ({ message = 'Loading...' }) => {
  const theme = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    message: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

export default LoadingScreen; 