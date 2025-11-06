import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector, useAppDispatch } from '@/shared/hooks';
import { setAuthenticated, setUser, setLoading } from '@/shared/store/slices/authSlice';
import { authService } from '@/shared/services';
import { RootStackParamList } from './types';
import LoginScreen from '@/screens/auth/LoginScreen';
import MainTabNavigator from './MainTabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      dispatch(setAuthenticated(authenticated));

      if (authenticated) {
        const userData = await authService.getUserData();
        dispatch(setUser(userData));
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      dispatch(setAuthenticated(false));
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
};
