import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../Card/Card';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';

export interface BalanceCardProps {
  accountNumber?: string;
  balance: number;
  currency?: string;
  changeAmount?: number;
  changePercentage?: number;
  trendData?: number[];
  style?: ViewStyle;
  variant?: 'default' | 'gradient';
  gradientColors?: string[];
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  accountNumber,
  balance,
  currency = '$',
  changeAmount,
  changePercentage,
  trendData,
  style,
  variant = 'gradient',
  gradientColors = [colors.primary[600], colors.primary[800]],
}) => {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const isPositiveChange = changeAmount !== undefined && changeAmount >= 0;

  const formatBalance = (amount: number) => {
    return amount.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const content = (
    <View style={styles.content}>
      {accountNumber && (
        <Text style={[styles.accountNumber, variant === 'gradient' && styles.textLight]}>
          {accountNumber}
        </Text>
      )}

      <View style={styles.balanceContainer}>
        <View style={styles.balanceRow}>
          <View>
            <Text style={[styles.balanceLabel, variant === 'gradient' && styles.textLight]}>
              Saldo Total
            </Text>
            <View style={styles.amountRow}>
              <Text style={[styles.balanceAmount, variant === 'gradient' && styles.textLight]}>
                {balanceVisible ? `${currency}${formatBalance(balance)}` : '••••••'}
              </Text>
              <TouchableOpacity
                onPress={() => setBalanceVisible(!balanceVisible)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={balanceVisible ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={variant === 'gradient' ? colors.white : colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {(changeAmount !== undefined || changePercentage !== undefined) && (
          <View style={[
            styles.changeBadge,
            isPositiveChange ? styles.changePositive : styles.changeNegative,
          ]}>
            <Ionicons
              name={isPositiveChange ? 'trending-up' : 'trending-down'}
              size={14}
              color={isPositiveChange ? colors.success[600] : colors.error[600]}
            />
            {changePercentage !== undefined && (
              <Text style={[
                styles.changeText,
                isPositiveChange ? styles.changeTextPositive : styles.changeTextNegative,
              ]}>
                {isPositiveChange ? '+' : ''}{changePercentage.toFixed(2)}%
              </Text>
            )}
            {changeAmount !== undefined && (
              <Text style={[
                styles.changeText,
                isPositiveChange ? styles.changeTextPositive : styles.changeTextNegative,
              ]}>
                ({isPositiveChange ? '+' : ''}{currency}{formatBalance(Math.abs(changeAmount))})
              </Text>
            )}
          </View>
        )}
      </View>

      {trendData && trendData.length > 0 && (
        <View style={styles.trendContainer}>
          <MiniSparkline data={trendData} color={variant === 'gradient' ? colors.white : colors.primary[600]} />
        </View>
      )}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientCard, style]}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <Card style={[styles.card, style]} variant="elevated" padding="large">
      {content}
    </Card>
  );
};

const MiniSparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  return (
    <View style={sparklineStyles.container}>
      {data.map((value, index) => {
        const height = ((value - minValue) / range) * 100;
        return (
          <View
            key={index}
            style={[
              sparklineStyles.bar,
              {
                height: `${Math.max(height, 10)}%`,
                backgroundColor: color,
                opacity: 0.3 + (height / 100) * 0.7,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const sparklineStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    gap: 2,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
  },
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing[4],
  },
  gradientCard: {
    marginHorizontal: spacing[4],
    padding: spacing[6],
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  content: {
    gap: spacing[4],
  },
  accountNumber: {
    ...typography.caption,
    color: colors.text.secondary,
    letterSpacing: 1,
  },
  balanceContainer: {
    gap: spacing[3],
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceLabel: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing[1],
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  balanceAmount: {
    ...typography.h1,
    fontSize: 36,
    fontWeight: '700',
    color: colors.text.primary,
  },
  eyeButton: {
    padding: spacing[2],
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  changePositive: {
    backgroundColor: colors.success[50],
  },
  changeNegative: {
    backgroundColor: colors.error[50],
  },
  changeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  changeTextPositive: {
    color: colors.success[700],
  },
  changeTextNegative: {
    color: colors.error[700],
  },
  trendContainer: {
    marginTop: spacing[2],
  },
  textLight: {
    color: colors.white,
  },
});
