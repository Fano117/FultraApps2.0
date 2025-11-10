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

      {/* Header personalizado */}
      <View style={styles.header}>
        <Typography variant="h5" style={styles.headerTitle}>
          Entregas
        </Typography>
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary[600],
          tabBarInactiveTintColor: colors.neutral[500],
          tabBarIndicatorStyle: {
            backgroundColor: colors.primary[600],
            height: 3,
          },
          tabBarLabelStyle: {
            fontSize: 15,
            fontWeight: '600',
            textTransform: 'none',
            marginTop: 4,
          },
          tabBarStyle: {
            backgroundColor: colors.white,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            borderBottomWidth: 1,
            borderBottomColor: colors.border.light,
          },
          tabBarItemStyle: {
            paddingVertical: 8,
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
