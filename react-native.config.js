module.exports = {
  dependencies: {
    // Improve build reliability by disabling auto-linking for potentially problematic packages
    // when they're not explicitly needed
    'react-native-flipper': {
      platforms: {
        ios: null,
      },
    },
  },
  project: {
    ios: {
      sourceDir: './ios',
    },
    android: {
      sourceDir: './android',
    },
  },
}; 