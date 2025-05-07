import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { TextInput, Text, Surface, useTheme, Portal } from 'react-native-paper';
import { Keyboard } from 'react-native';

/**
 * AutoSuggestInput Component
 * 
 * Purpose: A reusable text input component that displays suggestions as the user types.
 * It accepts suggestions as an array and renders them in a dropdown-like interface.
 * 
 * @param {string} label - The label for the text input
 * @param {string} value - The current value of the input
 * @param {function} onChangeText - Function called when text changes
 * @param {function} onSuggestionSelected - Function called when a suggestion is selected
 * @param {array} suggestions - Array of suggestion strings to display
 * @param {boolean} error - Whether to show error styling
 * @param {object} style - Additional styles for the container
 * @param {boolean} loading - Whether suggestions are loading
 * @param {object} props - Any additional props for the TextInput
 */
// Get screen dimensions for positioning adjustments
const windowHeight = Dimensions.get('window').height;

const AutoSuggestInput = ({
  label,
  value,
  onChangeText,
  onSuggestionSelected,
  suggestions = [],
  error,
  style,
  loading = false,
  ...props
}) => {
  const theme = useTheme();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  
  // Add ref and state for position tracking
  const containerRef = useRef(null);
  const [inputLayout, setInputLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Show suggestions when we have suggestions and input is focused
  useEffect(() => {
    setShowSuggestions(inputFocused && suggestions.length > 0);
  }, [suggestions, inputFocused]);

  // Update position when suggestions are shown
  useEffect(() => {
    if (showSuggestions && containerRef.current) {
      containerRef.current.measureInWindow((x, y, width, height) => {
        setInputLayout({ x, y, width, height });
      });
    }
  }, [showSuggestions]);

  // Handle suggestion selection
  const handleSuggestionPress = (suggestion) => {
    onChangeText(suggestion);
    if (onSuggestionSelected) {
      onSuggestionSelected(suggestion);
    }
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  // Log suggestions status for debugging
  useEffect(() => {
    console.log(`AutoSuggestInput (${label}) state:`, {
      showSuggestions,
      inputFocused,
      suggestionsCount: suggestions.length,
      suggestions,
      inputLayout
    });
  }, [showSuggestions, inputFocused, suggestions, label, inputLayout]);

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    input: {
      backgroundColor: theme.colors.surface,
    },
    suggestionsContainer: {
      maxHeight: Math.min(200, windowHeight * 0.3),
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      // Add elevation for Android
      ...(Platform.OS === 'android' ? {
        elevation: 8,
      } : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      }),
    },

    suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    suggestionText: {
      color: theme.colors.onSurface,
    },
    loadingText: {
      padding: 12,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });

  // No need for platform-specific wrapper styles with Portal

  return (
    <View 
      ref={containerRef}
      style={[styles.container, style]}
      onLayout={() => {
        // Get initial layout measurements
        if (containerRef.current) {
          containerRef.current.measureInWindow((x, y, width, height) => {
            setInputLayout({ x, y, width, height });
          });
        }
      }}
    >
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        mode="outlined"
        error={error}
        onFocus={() => setInputFocused(true)}
        onBlur={() => {
          // Delay hiding to allow selection
          setTimeout(() => setInputFocused(false), 200);
        }}
        {...props}
      />

      {showSuggestions && (
        <Portal>
          <View 
            style={{
              position: 'absolute',
              top: inputLayout.y + inputLayout.height,
              left: inputLayout.x,
              width: inputLayout.width,
              zIndex: 9999,
            }}
          >
            <Surface style={styles.suggestionsContainer}>
              <View style={{ overflow: 'hidden' }}>
                {loading ? (
                  <Text style={styles.loadingText}>Loading suggestions...</Text>
                ) : (
                  <View style={{ maxHeight: Math.min(200, windowHeight * 0.3) }}>
                    {suggestions.map((item, index) => (
                      <TouchableOpacity
                        key={`suggestion-${index}`}
                        style={styles.suggestionItem}
                        onPress={() => handleSuggestionPress(item)}
                      >
                        <Text style={styles.suggestionText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </Surface>
          </View>
        </Portal>
      )}
    </View>
  );
};

export default AutoSuggestInput;