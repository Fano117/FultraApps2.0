import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/design-system';
import { MainTabParamList } from './types';
import HomeScreen from '@/screens/home/HomeScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import NotificationsScreen from '@/screens/notifications/NotificationsScreen';
import EntregasTabNavigator from './EntregasTabNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border.light,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 8) : 8,
          height: Platform.OS === 'android' ? 60 + Math.max(insets.bottom, 0) : 60,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarHideOnKeyboard: true,
        tabBarAllowFontScaling: false,
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Ir a Inicio',
          tabBarTestID: 'home-tab-button',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Ir a Perfil',
          tabBarTestID: 'profile-tab-button',
        }}
      />
      <Tab.Screen
        name="Entregas"
        component={EntregasTabNavigator}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
