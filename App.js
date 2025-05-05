import React from 'react';
import { LogBox } from 'react-native';
// Ignore specific warnings instead of all warnings
LogBox.ignoreLogs([
  // Firebase warnings
  '[firebase/auth]',
  '@firebase/auth',
  // React Native Paper warnings
  'Overwriting fontFamily style attribute preprocessor',
  // React Navigation warnings
  'Non-serializable values were found in the navigation state',
  // Duplicate keys warning
  'Encountered two children with the same key',
  // Any other specific warnings you want to ignore
  'Warning: ...',
]);
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { AppProvider, useApp } from './app/context/AppContext';
import AppNavigator from './app/navigation/AppNavigator';
import LoadingScreen from './app/components/LoadingScreen';

// Main app content
const Main = () => {
  const { isLoading, isAuthenticated, theme } = useApp();

  if (isLoading) {
    return (
      <PaperProvider theme={theme}>
        <LoadingScreen message="Initializing PortTrack..." />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <AppNavigator />
    </PaperProvider>
  );
};

// Root component with providers
export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Main />
      </AppProvider>
    </SafeAreaProvider>
  );
} 