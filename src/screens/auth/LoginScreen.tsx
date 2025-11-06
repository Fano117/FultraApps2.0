import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Typography, colors, spacing } from '@/design-system';
import { authService } from '@/shared/services';
import { useAppDispatch } from '@/shared/hooks';
import { setAuthenticated, setUser } from '@/shared/store/slices/authSlice';

const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const success = await authService.signIn();

      if (success) {
        const userData = await authService.getUserData();
        dispatch(setUser(userData));
        dispatch(setAuthenticated(true));
      } else {
        Alert.alert('Error', 'No se pudo iniciar sesión. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Ocurrió un error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.primary[500], colors.primary[700]]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Typography variant="h1" color="inverse" align="center">
              FultraApps
            </Typography>
            <Typography variant="body1" color="inverse" align="center" style={styles.subtitle}>
              Gestión integral de entregas
            </Typography>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              onPress={handleLogin}
              style={styles.loginButton}
            >
              Iniciar Sesión
            </Button>
          </View>

          <View style={styles.footer}>
            <Typography variant="caption" color="inverse" align="center">
              Versión 1.3.0
            </Typography>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[10],
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    marginTop: spacing[3],
    opacity: 0.9,
  },
  buttonContainer: {
    marginBottom: spacing[10],
  },
  loginButton: {
    backgroundColor: colors.white,
    borderWidth: 0,
  },
  footer: {
    alignItems: 'center',
  },
});

export default LoginScreen;
