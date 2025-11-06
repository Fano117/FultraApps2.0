import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';

export interface AmountInputProps {
  value: string;
  onChangeValue: (value: string) => void;
  currency?: string;
  label?: string;
  maxAmount?: number;
  style?: ViewStyle;
  error?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChangeValue,
  currency = '$',
  label,
  maxAmount,
  style,
  error,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChangeText = (text: string) => {
    const cleanedText = text.replace(/[^0-9.]/g, '');
    const parts = cleanedText.split('.');

    if (parts.length > 2) {
      return;
    }

    if (parts[1] && parts[1].length > 2) {
      return;
    }

    if (maxAmount && parseFloat(cleanedText) > maxAmount) {
      return;
    }

    onChangeValue(cleanedText);
  };

  const formatDisplayValue = () => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        <Text style={styles.currency}>{currency}</Text>
        <TextInput
          style={styles.input}
          value={isFocused ? value : formatDisplayValue()}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.text.tertiary}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {maxAmount && !error && (
        <Text style={styles.hint}>
          Monto máximo: {currency}
          {maxAmount.toLocaleString('es-MX')}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  label: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  inputContainerFocused: {
    borderColor: colors.primary[600],
    backgroundColor: colors.white,
  },
  inputContainerError: {
    borderColor: colors.error[600],
  },
  currency: {
    ...typography.h1,
    fontSize: 32,
    color: colors.text.secondary,
    marginRight: spacing[2],
  },
  input: {
    flex: 1,
    ...typography.h1,
    fontSize: 32,
    color: colors.text.primary,
    fontWeight: '700',
  },
  error: {
    ...typography.caption,
    color: colors.error[600],
  },
  hint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
