import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { typography, TypographyVariant, colors, TextColor } from '../../theme';

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: keyof typeof colors.text;
  align?: TextStyle['textAlign'];
  children: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body1',
  color = 'primary',
  align = 'left',
  style,
  children,
  ...props
}) => {
  const textStyle: TextStyle = [
    typography[variant],
    { color: colors.text[color], textAlign: align },
    style,
  ].filter(Boolean) as TextStyle;

  return (
    <Text style={textStyle} {...props}>
      {children}
    </Text>
  );
};
