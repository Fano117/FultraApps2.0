import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  style,
  textStyle,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle;

  const textStyles: TextStyle = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    isDisabled && styles.textDisabled,
    textStyle,
  ].filter(Boolean) as TextStyle;

  const content = (
    <>
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary[600] : colors.white}
          style={styles.loader}
        />
      )}
      {!loading && leftIcon}
      <Text style={textStyles}>{children}</Text>
      {!loading && rightIcon}
    </>
  );

  if (variant === 'gradient' && !isDisabled) {
    return (
      <TouchableOpacity disabled={isDisabled} {...props} activeOpacity={0.8}>
        <LinearGradient
          colors={[colors.primary[500], colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={containerStyle}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={containerStyle}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },

  primary: {
    backgroundColor: colors.primary[600],
    ...shadows.sm,
  },
  secondary: {
    backgroundColor: colors.secondary[600],
    ...shadows.sm,
  },
  outline: {
    backgroundColor: colors.transparent,
    borderWidth: 1.5,
    borderColor: colors.primary[600],
  },
  ghost: {
    backgroundColor: colors.transparent,
  },
  gradient: {
    ...shadows.md,
  },

  size_small: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  size_medium: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  size_large: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },

  fullWidth: {
    width: '100%',
  },

  disabled: {
    opacity: 0.5,
  },

  text: {
    ...typography.button,
    color: colors.white,
  },
  text_primary: {
    color: colors.white,
  },
  text_secondary: {
    color: colors.white,
  },
  text_outline: {
    color: colors.primary[600],
  },
  text_ghost: {
    color: colors.primary[600],
  },
  text_gradient: {
    color: colors.white,
  },

  text_small: {
    ...typography.buttonSmall,
  },
  text_medium: {
    ...typography.button,
  },
  text_large: {
    ...typography.button,
    fontSize: 18,
  },

  textDisabled: {
    opacity: 0.7,
  },

  loader: {
    marginRight: spacing[2],
  },
});
