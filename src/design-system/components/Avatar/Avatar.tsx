import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface AvatarProps {
  size?: AvatarSize;
  source?: { uri: string } | number;
  name?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 'medium',
  source,
  name,
  backgroundColor = colors.primary[500],
  style,
}) => {
  const containerStyle: ViewStyle = [
    styles.base,
    styles[size],
    !source && { backgroundColor },
    style,
  ].filter(Boolean) as ViewStyle;

  const getInitials = (fullName: string): string => {
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <View style={containerStyle}>
      {source ? (
        <Image source={source} style={styles.image} />
      ) : name ? (
        <Text style={[styles.text, styles[`text_${size}`]]}>{getInitials(name)}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  small: {
    width: 32,
    height: 32,
  },
  medium: {
    width: 48,
    height: 48,
  },
  large: {
    width: 64,
    height: 64,
  },
  xlarge: {
    width: 80,
    height: 80,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  text: {
    color: colors.white,
    fontWeight: '600',
  },
  text_small: {
    fontSize: 12,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 24,
  },
  text_xlarge: {
    fontSize: 32,
  },
});
