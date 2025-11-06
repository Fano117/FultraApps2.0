import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import {
  Header,
  BalanceCard,
  QuickActions,
  CreditCard,
  TransactionList,
  BottomNavigation,
  SpendingChart,
  StatCard,
  Divider,
  SearchBar,
} from '../../../design-system';
import { colors, spacing } from '../../../design-system/theme';
import type { Transaction } from '../../../design-system/components/TransactionList/TransactionList';
import type { QuickAction } from '../../../design-system/components/QuickActions/QuickActions';
import type { NavigationItem } from '../../../design-system/components/BottomNavigation/BottomNavigation';

export const FintechHomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');

  // Datos de ejemplo
  const quickActions: QuickAction[] = [
    {
      id: '1',
      label: 'Enviar',
      icon: 'paper-plane',
      onPress: () => console.log('Enviar'),
      color: colors.primary[600],
      backgroundColor: colors.primary[50],
    },
    {
      id: '2',
      label: 'Recibir',
      icon: 'download',
      onPress: () => console.log('Recibir'),
      color: colors.success[600],
      backgroundColor: colors.success[50],
    },
    {
      id: '3',
      label: 'Pagar',
      icon: 'card',
      onPress: () => console.log('Pagar'),
      color: colors.secondary[600],
      backgroundColor: colors.secondary[50],
    },
    {
      id: '4',
      label: 'Más',
      icon: 'grid',
      onPress: () => console.log('Más'),
      color: colors.neutral[600],
      backgroundColor: colors.neutral[50],
    },
  ];

  const transactions: Transaction[] = [
    {
      id: '1',
      merchantName: 'Starbucks Coffee',
      category: 'food',
      categoryIcon: 'cafe',
      amount: -45.50,
      type: 'expense',
      status: 'completed',
      date: new Date(),
    },
    {
      id: '2',
      merchantName: 'Uber',
      category: 'transport',
      categoryIcon: 'car',
      amount: -12.30,
      type: 'expense',
      status: 'completed',
      date: new Date(Date.now() - 3600000),
    },
    {
      id: '3',
      merchantName: 'Salary Deposit',
      category: 'income',
      categoryIcon: 'cash',
      amount: 5000,
      type: 'income',
      status: 'completed',
      date: new Date(Date.now() - 86400000),
    },
    {
      id: '4',
      merchantName: 'Amazon',
      category: 'shopping',
      categoryIcon: 'bag-handle',
      amount: -120.00,
      type: 'expense',
      status: 'pending',
      date: new Date(Date.now() - 172800000),
    },
  ];

  const spendingData = [
    { label: 'Comida', value: 850, color: colors.warning[600] },
    { label: 'Transporte', value: 420, color: colors.info[600] },
    { label: 'Compras', value: 1200, color: colors.secondary[600] },
    { label: 'Servicios', value: 680, color: colors.primary[600] },
  ];

  const navigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Inicio',
      icon: 'home-outline',
      activeIcon: 'home',
      onPress: () => setActiveTab('home'),
    },
    {
      id: 'transactions',
      label: 'Actividad',
      icon: 'list-outline',
      activeIcon: 'list',
      onPress: () => setActiveTab('transactions'),
    },
    {
      id: 'scan',
      label: 'Escanear',
      icon: 'scan-outline',
      activeIcon: 'scan',
      onPress: () => setActiveTab('scan'),
    },
    {
      id: 'cards',
      label: 'Tarjetas',
      icon: 'card-outline',
      activeIcon: 'card',
      onPress: () => setActiveTab('cards'),
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: 'person-outline',
      activeIcon: 'person',
      onPress: () => setActiveTab('profile'),
      badge: 3,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header
        userName="Juan Pérez"
        greeting="Hola"
        notificationCount={5}
        onAvatarPress={() => console.log('Avatar pressed')}
        onNotificationPress={() => console.log('Notifications pressed')}
        onMenuPress={() => console.log('Menu pressed')}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Balance Card */}
        <BalanceCard
          accountNumber="**** **** **** 4532"
          balance={12450.75}
          currency="$"
          changeAmount={350.20}
          changePercentage={2.89}
          trendData={[4000, 4200, 3800, 4500, 4800, 4600, 5200]}
          variant="gradient"
          gradientColors={['#667eea', '#764ba2']}
          style={styles.balanceCard}
        />

        {/* Quick Actions */}
        <QuickActions
          actions={quickActions}
          columns={4}
          style={styles.quickActions}
        />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Gastos del mes"
            value="$3,150"
            icon="trending-down"
            trend={{ value: 12, isPositive: false }}
            subtitle="vs mes anterior"
            color={colors.error[600]}
            style={styles.statCard}
          />
          <StatCard
            title="Ahorros"
            value="$8,420"
            icon="wallet"
            trend={{ value: 8, isPositive: true }}
            subtitle="Meta: $10,000"
            color={colors.success[600]}
            style={styles.statCard}
          />
        </View>

        {/* Credit Card */}
        <View style={styles.section}>
          <CreditCard
            cardNumber="4532 1234 5678 9012"
            cardHolder="Juan Pérez"
            expiryDate="12/25"
            cvv="123"
            cardType="visa"
            gradientColors={['#1e3c72', '#2a5298']}
            variant="glassmorphism"
            style={styles.creditCard}
          />
        </View>

        <Divider label="Gastos por Categoría" style={styles.divider} />

        {/* Spending Chart */}
        <View style={styles.section}>
          <SpendingChart
            data={spendingData}
            type="bar"
            height={180}
          />
        </View>

        <Divider label="Transacciones Recientes" style={styles.divider} />

        {/* Recent Transactions */}
        <View style={styles.transactionsContainer}>
          <TransactionList
            transactions={transactions.slice(0, 5)}
            onTransactionPress={(transaction) =>
              console.log('Transaction pressed:', transaction)
            }
            showDate={true}
          />
        </View>
      </ScrollView>

      <BottomNavigation
        items={navigationItems}
        activeItemId={activeTab}
        variant="default"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[6],
  },
  balanceCard: {
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },
  quickActions: {
    marginBottom: spacing[6],
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statCard: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  creditCard: {
    marginBottom: spacing[2],
  },
  divider: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[4],
  },
  transactionsContainer: {
    flex: 1,
    minHeight: 400,
  },
});
