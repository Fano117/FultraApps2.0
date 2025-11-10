import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, Typography } from '@/design-system';
import { EntregasTabParamList } from './types';
import EntregasNavigator from './EntregasNavigator';
import PendientesScreen from '@/apps/entregas/screens/PendientesScreen';

const Tab = createMaterialTopTabNavigator<EntregasTabParamList>();

const EntregasTabNavigator: React.FC = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary[600],
          tabBarInactiveTintColor: colors.neutral[600],
          tabBarIndicatorStyle: {
            backgroundColor: colors.primary[600],
            height: 3,
          },
          tabBarLabelStyle: {
            fontSize: 16,
            fontWeight: '700',
            textTransform: 'none',
            color: colors.neutral[900],
          },
          tabBarStyle: {
            backgroundColor: colors.white,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            borderBottomWidth: 1,
            borderBottomColor: colors.border.light,
          },
          tabBarItemStyle: {
            paddingVertical: 12,
          },
          lazy: true,
          swipeEnabled: true,
        }}
      >
        <Tab.Screen
          name="EntregasTab"
          component={EntregasNavigator}
          options={{
            tabBarLabel: 'Entregas',
          }}
        />
        <Tab.Screen
          name="PendientesTab"
          component={PendientesScreen}
          options={{
            tabBarLabel: 'Pendientes',
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontWeight: '600',
  },
});

export default EntregasTabNavigator;
