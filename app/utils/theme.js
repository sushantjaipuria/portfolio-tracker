import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { Platform } from 'react-native';

// Custom font configuration
const fontConfig = {
  ios: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '200',
    },
  },
  android: {
    regular: {
      fontFamily: 'sans-serif',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'sans-serif-medium',
      fontWeight: 'normal',
    },
    light: {
      fontFamily: 'sans-serif-light',
      fontWeight: 'normal',
    },
    thin: {
      fontFamily: 'sans-serif-thin',
      fontWeight: 'normal',
    },
  },
};

const fonts = configureFonts({
  config: fontConfig,
});

const commonColors = {
  primary: '#0066CC', // Blue
  secondary: '#6200EA', // Deep Purple
  accent: '#03DAC6', // Teal
  positive: '#4CAF50', // Green for gains
  negative: '#F44336', // Red for losses
  warning: '#FFA000', // Amber for warnings
  info: '#2196F3', // Light Blue for information
};

// Light theme
export const lightTheme = {
  ...MD3LightTheme,
  fonts,
  roundness: 8,
  colors: {
    ...MD3LightTheme.colors,
    ...commonColors,
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#212121',
    disabled: '#9E9E9E',
    placeholder: '#757575',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#FF3B30',
    card: '#FFFFFF',
    border: '#E0E0E0',
  },
  animation: {
    scale: Platform.OS === 'ios' ? 1.0 : 0.9,
  },
};

// Dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  fonts,
  roundness: 8,
  colors: {
    ...MD3DarkTheme.colors,
    ...commonColors,
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    disabled: '#757575',
    placeholder: '#9E9E9E',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#FF453A',
    card: '#2C2C2C',
    border: '#333333',
  },
  animation: {
    scale: Platform.OS === 'ios' ? 1.0 : 0.9,
  },
};

// Common styles used across the app
export const globalStyles = {
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    // Removed overflow: 'hidden' to fix Surface shadow warning
  },
  cardTitle: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginVertical: 8,
    paddingVertical: 8,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  inactiveItem: {
    opacity: 0.6,
  },
  footer: {
    padding: 16,
    textAlign: 'center',
    fontSize: 12,
  },
}; 