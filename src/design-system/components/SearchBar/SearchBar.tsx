import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';

export interface SearchBarProps {
  placeholder?: string;
  onSearch?: (text: string) => void;
  onClear?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'rounded';
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Buscar...',
  onSearch,
  onClear,
  style,
  variant = 'default',
}) => {
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    setSearchText('');
    onClear?.();
  };

  const handleChangeText = (text: string) => {
    setSearchText(text);
    onSearch?.(text);
  };

  return (
    <View
      style={[
        styles.container,
        variant === 'rounded' && styles.rounded,
        isFocused && styles.focused,
        style,
      ]}
    >
      <Ionicons
        name="search-outline"
        size={20}
        color={isFocused ? colors.primary[600] : colors.text.secondary}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        value={searchText}
        onChangeText={handleChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {searchText.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    height: 48,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  rounded: {
    borderRadius: borderRadius.full,
  },
  focused: {
    borderColor: colors.primary[600],
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
  },
  clearButton: {
    padding: spacing[1],
  },
});
