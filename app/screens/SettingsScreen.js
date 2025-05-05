import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, RadioButton, List, useTheme, Divider, TouchableRipple } from 'react-native-paper';
import { useApp, THEME_PREFERENCES } from '../context/AppContext';
import { globalStyles } from '../utils/theme';

const SettingsScreen = () => {
  const theme = useTheme();
  const { themePreference, setThemePreference } = useApp();
  
  const styles = StyleSheet.create({
    container: {
      ...globalStyles.container,
      backgroundColor: theme.colors.background,
    },
    card: {
      ...globalStyles.card,
      marginTop: 16,
    },
    header: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    radioItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    radioLabel: {
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 8,
    },
    section: {
      marginBottom: 24,
    },
    disclaimer: {
      fontSize: 12,
      color: theme.colors.text,
      textAlign: 'center',
      marginTop: 16,
      fontStyle: 'italic',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}></Text>
      
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.section}>
            <List.Item
              title="Theme"
              left={props => <List.Icon {...props} icon="theme-light-dark" />}
            />
            <Divider />
            
            <RadioButton.Group
              onValueChange={value => setThemePreference(value)}
              value={themePreference}
            >
              <TouchableRipple
                onPress={() => setThemePreference(THEME_PREFERENCES.SYSTEM)}
                rippleColor="rgba(0, 0, 0, .10)"
              >
                <View style={styles.radioItem}>
                  <RadioButton 
                    value={THEME_PREFERENCES.SYSTEM} 
                    color={theme.colors.primary}
                  />
                  <Text style={styles.radioLabel}>System Default</Text>
                </View>
              </TouchableRipple>
              
              <TouchableRipple
                onPress={() => setThemePreference(THEME_PREFERENCES.LIGHT)}
                rippleColor="rgba(0, 0, 0, .10)"
              >
                <View style={styles.radioItem}>
                  <RadioButton 
                    value={THEME_PREFERENCES.LIGHT} 
                    color={theme.colors.primary}
                  />
                  <Text style={styles.radioLabel}>Light</Text>
                </View>
              </TouchableRipple>
              
              <TouchableRipple
                onPress={() => setThemePreference(THEME_PREFERENCES.DARK)}
                rippleColor="rgba(0, 0, 0, .10)"
              >
                <View style={styles.radioItem}>
                  <RadioButton 
                    value={THEME_PREFERENCES.DARK} 
                    color={theme.colors.primary}
                  />
                  <Text style={styles.radioLabel}>Dark</Text>
                </View>
              </TouchableRipple>
            </RadioButton.Group>
          </View>
          
          <View style={styles.section}>
            <List.Item
              title="About"
              left={props => <List.Icon {...props} icon="information-outline" />}
              description="PortTrack - Portfolio Tracking App"
            />
            <Divider />
            <List.Item
              title=""
              description=""
            />
          </View>
        </Card.Content>
      </Card>
      
      <Text style={styles.disclaimer}>
        Prices are delayed; not investment advice.
      </Text>
    </ScrollView>
  );
};

export default SettingsScreen; 