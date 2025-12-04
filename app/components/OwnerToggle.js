import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons, useTheme } from 'react-native-paper';
import { PORTFOLIO_OWNERS, useApp } from '../context/AppContext';

const OwnerToggle = () => {
  const theme = useTheme();
  const { currentOwner, setCurrentOwner } = useApp();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 22,
    },
    segmented: {
      maxWidth: 140,
    },
  });

  return (
    <View style={styles.container}>
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


