import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { PORTFOLIO_OWNERS, useApp } from '../context/AppContext';

const OwnerToggle = () => {
  const theme = useTheme();
  const { currentOwner, setCurrentOwner } = useApp();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 8,
    },
    label: {
      marginRight: 8,
      fontSize: 12,
      color: theme.colors.onPrimary,
    },
    segmented: {
      maxWidth: 140,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Portfolio</Text>
      <SegmentedButtons
        value={currentOwner}
        onValueChange={(value) => {
          if (value) {
            setCurrentOwner(value);
          }
        }}
        buttons={[
          { value: PORTFOLIO_OWNERS.SJ, label: 'SJ' },
          { value: PORTFOLIO_OWNERS.SKJ, label: 'SKJ' },
        ]}
        style={styles.segmented}
        density="small"
      />
    </View>
  );
};

export default OwnerToggle;


