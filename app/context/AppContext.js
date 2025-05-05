import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../utils/theme';
import { signInAnonymous } from '../utils/firebase';
import { getAllInvestments, calculatePortfolioSummary } from '../services/investmentService';

// Create context
export const AppContext = createContext();

// Theme storage key
const THEME_PREF_KEY = 'porttrack_theme_preference';

// Theme preference options
export const THEME_PREFERENCES = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
};

// Provider component
export const AppProvider = ({ children }) => {
  // App state
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  
  // Theme state
  const deviceTheme = useColorScheme();
  const [themePreference, setThemePreference] = useState(THEME_PREFERENCES.SYSTEM);
  const [theme, setTheme] = useState(deviceTheme === 'dark' ? darkTheme : lightTheme);
  
  // Fetch theme preference from storage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_PREF_KEY);
        if (savedPreference) {
          setThemePreference(savedPreference);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };
    
    loadThemePreference();
  }, []);
  
  // Update theme based on preference and device theme
  useEffect(() => {
    if (themePreference === THEME_PREFERENCES.SYSTEM) {
      setTheme(deviceTheme === 'dark' ? darkTheme : lightTheme);
    } else {
      setTheme(themePreference === THEME_PREFERENCES.DARK ? darkTheme : lightTheme);
    }
  }, [themePreference, deviceTheme]);
  
  // Save theme preference to storage
  const saveThemePreference = async (preference) => {
    try {
      await AsyncStorage.setItem(THEME_PREF_KEY, preference);
      setThemePreference(preference);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };
  
  // Authentication
  useEffect(() => {
    const authenticate = async () => {
      try {
        setIsLoading(true);
        const userCredential = await signInAnonymous();
        if (userCredential && userCredential.user) {
          setUser(userCredential.user);
          setIsAuthenticated(true);
        } else {
          // Handle case where authentication succeeds but no user is returned
          console.warn('Authentication completed but no user was returned');
          // Still set authenticated to true to allow app to function
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        // In case of auth error, still allow app to function in offline mode
        setIsAuthenticated(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    authenticate();
  }, []);
  
  // Load investments
  const loadInvestments = async () => {
    try {
      setIsLoading(true);
      const investmentsData = await getAllInvestments();
      setInvestments(investmentsData);
      
      // Calculate portfolio summary
      const summary = calculatePortfolioSummary(investmentsData);
      setPortfolioSummary(summary);
    } catch (error) {
      console.error('Error loading investments:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh investments and recalculate summary
  const refreshPortfolio = async () => {
    await loadInvestments();
  };
  
  // Load investments on authentication
  useEffect(() => {
    if (isAuthenticated) {
      loadInvestments();
    }
  }, [isAuthenticated]);
  
  // Context value
  const contextValue = {
    isLoading,
    isAuthenticated,
    user,
    investments,
    portfolioSummary,
    refreshPortfolio,
    theme,
    themePreference,
    setThemePreference: saveThemePreference,
    isDarkMode: theme === darkTheme,
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using app context
export const useApp = () => useContext(AppContext); 