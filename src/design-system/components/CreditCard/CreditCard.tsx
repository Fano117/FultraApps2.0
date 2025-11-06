import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';

export interface CreditCardProps {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv?: string;
  cardType?: 'visa' | 'mastercard' | 'amex' | 'discover';
  gradientColors?: string[];
  style?: ViewStyle;
  variant?: 'default' | 'glassmorphism';
}

export const CreditCard: React.FC<CreditCardProps> = ({
  cardNumber,
  cardHolder,
  expiryDate,
  cvv,
  cardType = 'visa',
  gradientColors = ['#667eea', '#764ba2'],
  style,
  variant = 'default',
}) => {
  const formatCardNumber = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    const masked = cleaned.slice(0, -4).replace(/\d/g, '•');
    const lastFour = cleaned.slice(-4);
    return `${masked.match(/.{1,4}/g)?.join(' ') || ''} ${lastFour}`.trim();
  };

  const getCardLogo = () => {
    switch (cardType) {
      case 'visa':
        return 'VISA';
      case 'mastercard':
        return 'MC';
      case 'amex':
        return 'AMEX';
      case 'discover':
        return 'DISC';
      default:
        return 'CARD';
    }
  };

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, variant === 'glassmorphism' && styles.glass, style]}
    >
      {variant === 'glassmorphism' && <View style={styles.glassOverlay} />}

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.chip} />
          <Text style={styles.cardLogo}>{getCardLogo()}</Text>
        </View>

        <View style={styles.cardNumberContainer}>
          <Text style={styles.cardNumber}>{formatCardNumber(cardNumber)}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Card Holder</Text>
            <Text style={styles.value}>{cardHolder.toUpperCase()}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Expires</Text>
            <Text style={styles.value}>{expiryDate}</Text>
          </View>
          {cvv && (
            <View style={styles.infoBlock}>
              <Text style={styles.label}>CVV</Text>
              <Text style={styles.value}>{cvv}</Text>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 1.586,
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
    ...shadows.xl,
    overflow: 'hidden',
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chip: {
    width: 50,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 215, 0, 0.8)',
  },
  cardLogo: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '700',
    letterSpacing: 2,
  },
  cardNumberContainer: {
    marginVertical: spacing[4],
  },
  cardNumber: {
    fontSize: 22,
    color: colors.white,
    fontWeight: '600',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  infoBlock: {
    gap: spacing[1],
  },
  label: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
