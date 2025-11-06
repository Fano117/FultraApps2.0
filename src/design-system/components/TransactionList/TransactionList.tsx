import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../Avatar/Avatar';
import { Badge } from '../Badge/Badge';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';

export interface Transaction {
  id: string;
  merchantName: string;
  category: string;
  categoryIcon?: keyof typeof Ionicons.glyphMap;
  amount: number;
  type: 'income' | 'expense';
  status: 'completed' | 'pending' | 'failed';
  date: Date;
  avatarUrl?: string;
  description?: string;
}

export interface TransactionListProps {
  transactions: Transaction[];
  onTransactionPress?: (transaction: Transaction) => void;
  style?: ViewStyle;
  showDate?: boolean;
  groupByDate?: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onTransactionPress,
  style,
  showDate = true,
  groupByDate = false,
}) => {
  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }

    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupTransactionsByDate = () => {
    const groups: { [key: string]: Transaction[] } = {};

    transactions.forEach((transaction) => {
      const dateKey = transaction.date.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });

    return Object.entries(groups).map(([dateKey, items]) => ({
      date: new Date(dateKey),
      transactions: items,
    }));
  };

  const getCategoryColor = (category: string) => {
    const categoryColors: { [key: string]: string } = {
      food: colors.warning[600],
      transport: colors.info[600],
      shopping: colors.secondary[600],
      entertainment: colors.error[600],
      bills: colors.primary[600],
      income: colors.success[600],
    };

    return categoryColors[category.toLowerCase()] || colors.primary[600];
  };

  const getStatusBadgeVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
    }
  };

  const renderTransaction = (transaction: Transaction) => {
    const categoryColor = getCategoryColor(transaction.category);
    const isIncome = transaction.type === 'income';

    return (
      <TouchableOpacity
        key={transaction.id}
        style={styles.transactionItem}
        onPress={() => onTransactionPress?.(transaction)}
        activeOpacity={0.7}
      >
        <View style={styles.transactionLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}15` }]}>
            {transaction.avatarUrl ? (
              <Avatar source={{ uri: transaction.avatarUrl }} size="small" />
            ) : (
              <Ionicons
                name={transaction.categoryIcon || 'storefront-outline'}
                size={24}
                color={categoryColor}
              />
            )}
          </View>

          <View style={styles.transactionInfo}>
            <Text style={styles.merchantName}>{transaction.merchantName}</Text>
            <View style={styles.categoryRow}>
              <Badge
                value={transaction.category}
                variant="neutral"
                size="small"
              />
              {showDate && (
                <Text style={styles.transactionTime}>
                  {formatTime(transaction.date)}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.transactionRight}>
          <Text
            style={[
              styles.amount,
              isIncome ? styles.amountIncome : styles.amountExpense,
            ]}
          >
            {isIncome ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
          </Text>
          {transaction.status !== 'completed' && (
            <Badge
              value={transaction.status}
              variant={getStatusBadgeVariant(transaction.status)}
              size="small"
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (groupByDate) {
    const groupedData = groupTransactionsByDate();

    return (
      <View style={[styles.container, style]}>
        {groupedData.map((group) => (
          <View key={group.date.toDateString()} style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{formatDate(group.date)}</Text>
            {group.transactions.map(renderTransaction)}
          </View>
        ))}
      </View>
    );
  }

  return (
    <FlatList
      data={transactions}
      renderItem={({ item }) => renderTransaction(item)}
      keyExtractor={(item) => item.id}
      style={[styles.container, style]}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  dateGroup: {
    marginBottom: spacing[4],
    paddingHorizontal: spacing[4],
  },
  dateHeader: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing[3],
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2],
    paddingHorizontal: spacing[3],
    ...shadows.sm,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    gap: spacing[1],
  },
  merchantName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  transactionTime: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  amount: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 16,
  },
  amountIncome: {
    color: colors.success[600],
  },
  amountExpense: {
    color: colors.text.primary,
  },
});
