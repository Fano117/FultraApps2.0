import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export interface DividerProps {
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  style?: ViewStyle;
  thickness?: number;
  color?: string;
}

export const Divider: React.FC<DividerProps> = ({
  label,
  orientation = 'horizontal',
  style,
  thickness = 1,
  color = colors.border.light,
}) => {
  if (label) {
    return (
      <View style={[styles.labelContainer, style]}>
        <View style={[styles.line, { height: thickness, backgroundColor: color }]} />
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.line, { height: thickness, backgroundColor: color }]} />
      </View>
    );
  }

  if (orientation === 'vertical') {
    return (
      <View
        style={[
          styles.vertical,
          { width: thickness, backgroundColor: color },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.horizontal,
        { height: thickness, backgroundColor: color },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    height: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  line: {
    flex: 1,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
});
