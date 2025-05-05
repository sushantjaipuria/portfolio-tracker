import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Screens
import PortfolioScreen from '../screens/PortfolioScreen';
import PortfolioDetailScreen from '../screens/PortfolioDetailScreen';
import AddInvestmentScreen from '../screens/AddInvestmentScreen';
import SellInvestmentScreen from '../screens/SellInvestmentScreen';
import InvestmentDetailScreen from '../screens/InvestmentDetailScreen';
import SoldInvestmentsScreen from '../screens/SoldInvestmentsScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Create navigation stacks
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Portfolio Stack
const PortfolioStack = () => {
  const theme = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Portfolio" 
        component={PortfolioScreen} 
        options={{ title: 'My Portfolio' }}
      />
      <Stack.Screen 
        name="InvestmentDetail" 
        component={InvestmentDetailScreen} 
        options={{ title: 'Investment Details' }}
      />
      <Stack.Screen 
        name="AddInvestment" 
        component={AddInvestmentScreen} 
        options={{ title: 'Add Investment' }}
      />
      <Stack.Screen 
        name="SellInvestment" 
        component={SellInvestmentScreen} 
        options={{ title: 'Sell Investment' }}
      />
    </Stack.Navigator>
  );
};

// Portfolio Detail Stack
const PortfolioDetailStack = () => {
  const theme = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="PortfolioDetail" 
        component={PortfolioDetailScreen} 
        options={{ title: 'Portfolio Details' }}
      />
      <Stack.Screen 
        name="InvestmentDetail" 
        component={InvestmentDetailScreen} 
        options={{ title: 'Investment Details' }}
      />
      <Stack.Screen 
        name="AddInvestment" 
        component={AddInvestmentScreen} 
        options={{ title: 'Add Investment' }}
      />
      <Stack.Screen 
        name="SellInvestment" 
        component={SellInvestmentScreen} 
        options={{ title: 'Sell Investment' }}
      />
    </Stack.Navigator>
  );
};

// Sold Investments Stack
const SoldInvestmentsStack = () => {
  const theme = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="SoldInvestments" 
        component={SoldInvestmentsScreen} 
        options={{ title: 'Sold Investments' }}
      />
      <Stack.Screen 
        name="InvestmentDetail" 
        component={InvestmentDetailScreen} 
        options={{ title: 'Investment Details' }}
      />
    </Stack.Navigator>
  );
};

// Settings Stack
const SettingsStack = () => {
  const theme = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
};

// App Navigation with Tabs
const AppNavigator = () => {
  const theme = useTheme();
  
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.disabled,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
          headerShown: false,
        }}
      >
        <Tab.Screen 
          name="PortfolioTab" 
          component={PortfolioStack} 
          options={{
            tabBarLabel: 'Portfolio',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen 
          name="PortfolioDetailTab" 
          component={PortfolioDetailStack} 
          options={{
            tabBarLabel: 'Details',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="finance" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen 
          name="SoldInvestmentsTab" 
          component={SoldInvestmentsStack} 
          options={{
            tabBarLabel: 'Sold',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cash-multiple" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen 
          name="SettingsTab" 
          component={SettingsStack} 
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cog" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 