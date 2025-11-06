import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  disabled?: boolean;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  disabled = false,
  required = false,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputContainerStyle = [
    styles.inputContainer,
    isFocused && styles.inputContainerFocused,
    error && styles.inputContainerError,
    disabled && styles.inputContainerDisabled,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <View style={inputContainerStyle}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            style,
          ]}
          placeholderTextColor={colors.text.tertiary}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  label: {
    ...typography.subtitle2,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },

  required: {
    color: colors.error[500],
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing[4],
    minHeight: 48,
  },

  inputContainerFocused: {
    borderColor: colors.primary[500],
    backgroundColor: colors.white,
  },

  inputContainerError: {
    borderColor: colors.error[500],
  },

  inputContainerDisabled: {
    backgroundColor: colors.neutral[100],
    opacity: 0.6,
  },

  input: {
    flex: 1,
    ...typography.body1,
    color: colors.text.primary,
    paddingVertical: spacing[3],
  },

  inputWithLeftIcon: {
    paddingLeft: spacing[2],
  },

  inputWithRightIcon: {
    paddingRight: spacing[2],
  },

  leftIcon: {
    marginRight: spacing[2],
  },

  rightIcon: {
    marginLeft: spacing[2],
  },

  error: {
    ...typography.caption,
    color: colors.error[500],
    marginTop: spacing[1],
  },

  hint: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
});
