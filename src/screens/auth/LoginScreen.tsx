import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Button, Typography, colors, spacing } from '@/design-system';
import { authService } from '@/shared/services';
import { useAppDispatch } from '@/shared/hooks';
import { setAuthenticated, setUser } from '@/shared/store/slices/authSlice';

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animaciones para figuras decorativas
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de pulso continuo para el icono principal
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animaciones flotantes para figuras decorativas
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: -20,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: -15,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim3, {
          toValue: -25,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim3, {
          toValue: 0,
          duration: 3500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animación de rotación suave
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleLogin = async () => {
    setLoading(true);
    try {
      const success = await authService.signIn();

      if (success) {
        const userData = await authService.getUserData();
        dispatch(setUser(userData));
        dispatch(setAuthenticated(true));
      } else {
        Alert.alert(
          'Error de autenticación',
          'No se pudo iniciar sesión. Verifica tu conexión e intenta nuevamente.',
          [{ text: 'Entendido', style: 'default' }]
        );
      }
    } catch (error: any) {
      console.error('Login error:', error);

      let errorMessage = 'Ocurrió un error al iniciar sesión';

      // Manejo específico del error de 'authorize of null'
      if (error?.message?.includes('authorize')) {
        errorMessage = 'Error de configuración de autenticación. Verifica que la aplicación esté correctamente configurada.';
      } else if (error?.message?.includes('network')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      } else if (error?.message?.includes('cancelled')) {
        errorMessage = 'Inicio de sesión cancelado';
      }

      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'Reintentar', onPress: handleLogin }, { text: 'Cancelar', style: 'cancel' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.primary[500], colors.primary[700], colors.primary[900]]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* Figuras decorativas animadas */}
        <Animated.View
          style={[
            styles.decorativeShape1,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.15],
              }),
              transform: [
                { translateY: floatAnim1 },
                { rotate }
              ],
            },
          ]}
        >
          <MaterialCommunityIcons name="hexagon" size={120} color={colors.white} />
        </Animated.View>

        <Animated.View
          style={[
            styles.decorativeShape2,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.1],
              }),
              transform: [{ translateY: floatAnim2 }],
            },
          ]}
        >
          <MaterialCommunityIcons name="circle-outline" size={200} color={colors.white} />
        </Animated.View>

        <Animated.View
          style={[
            styles.decorativeShape3,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.12],
              }),
              transform: [{ translateY: floatAnim3 }],
            },
          ]}
        >
          <MaterialCommunityIcons name="triangle-outline" size={80} color={colors.white} />
        </Animated.View>

        <View style={styles.content}>
          {/* Header con animación */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Badge corporativo de FULTRA */}
            <Animated.View
              style={[
                styles.brandBadge,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.badgeGradient}
              >
                <Animated.View
                  style={[
                    styles.iconContainer,
                    { transform: [{ scale: pulseAnim }] }
                  ]}
                >
                  <MaterialCommunityIcons
                    name="truck-delivery"
                    size={80}
                    color={colors.white}
                  />
                </Animated.View>
              </LinearGradient>
            </Animated.View>

            <Typography variant="h1" color="inverse" align="center" style={styles.title}>
              FULTRA
            </Typography>

            <View style={styles.sloganContainer}>
              <View style={styles.sloganLine} />
              <Typography variant="h3" color="inverse" align="center" style={styles.slogan}>
                El cliente preferido por el transportista
              </Typography>
              <View style={styles.sloganLine} />
            </View>

            <View style={styles.subtitleContainer}>
              <MaterialCommunityIcons name="domain" size={20} color={colors.white} />
              <Typography variant="body1" color="inverse" align="center" style={styles.subtitle}>
                Plataforma empresarial de logística
              </Typography>
            </View>

            {/* Características */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="truck-delivery" size={24} color={colors.white} />
                <Typography variant="caption" color="inverse" style={styles.featureText}>
                  Entregas y distribución
                </Typography>
              </View>

              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="cart-variant" size={24} color={colors.white} />
                <Typography variant="caption" color="inverse" style={styles.featureText}>
                  Gestión de ventas
                </Typography>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="location" size={24} color={colors.white} />
                <Typography variant="caption" color="inverse" style={styles.featureText}>
                  Seguimiento en tiempo real
                </Typography>
              </View>

              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="file-document" size={24} color={colors.white} />
                <Typography variant="caption" color="inverse" style={styles.featureText}>
                  Reportes y análisis
                </Typography>
              </View>
            </View>
          </Animated.View>

          {/* Botón de login con animación */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Button
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              onPress={handleLogin}
              style={styles.loginButton}
            >
              <View style={styles.buttonContent}>
                {!loading && (
                  <Ionicons name="log-in" size={24} color={colors.primary[600]} style={styles.buttonIcon} />
                )}
                <Typography variant="body1" style={styles.loginButtonText}>
                  Iniciar Sesión
                </Typography>
              </View>
            </Button>

            <View style={styles.securityContainer}>
              <MaterialCommunityIcons name="shield-check" size={16} color={colors.white} />
              <Typography variant="caption" color="inverse" style={styles.securityText}>
                Conexión segura y encriptada
              </Typography>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View
            style={[
              styles.footer,
              { opacity: fadeAnim }
            ]}
          >
            <View style={styles.versionContainer}>
              <MaterialCommunityIcons name="information" size={16} color={colors.white} />
              <Typography variant="caption" color="inverse" align="center" style={styles.versionText}>
                Versión 1.3.0
              </Typography>
            </View>
          </Animated.View>
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
  // Figuras decorativas
  decorativeShape1: {
    position: 'absolute',
    top: 80,
    right: -30,
    opacity: 0.15,
  },
  decorativeShape2: {
    position: 'absolute',
    bottom: 150,
    left: -50,
    opacity: 0.1,
  },
  decorativeShape3: {
    position: 'absolute',
    top: height * 0.45,
    right: 30,
    opacity: 0.12,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing[10],
  },
  brandBadge: {
    marginBottom: spacing[6],
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  badgeGradient: {
    padding: spacing[6],
    borderRadius: 100,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: spacing[4],
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sloganContainer: {
    marginBottom: spacing[4],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    gap: spacing[3],
  },
  sloganLine: {
    width: 60,
    height: 2,
    backgroundColor: colors.white,
    opacity: 0.5,
  },
  slogan: {
    opacity: 0.95,
    fontWeight: '600',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    lineHeight: 28,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[8],
  },
  subtitle: {
    opacity: 0.95,
    fontWeight: '500',
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 400,
    gap: spacing[4],
    marginTop: spacing[6],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: spacing[3],
    borderRadius: 12,
  },
  featureText: {
    opacity: 0.95,
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: spacing[6],
    gap: spacing[3],
  },
  loginButton: {
    backgroundColor: colors.white,
    borderWidth: 0,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    paddingVertical: spacing[4],
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  buttonIcon: {
    marginRight: spacing[1],
  },
  loginButtonText: {
    color: colors.primary[600],
    fontWeight: 'bold',
    fontSize: 18,
  },
  securityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    opacity: 0.8,
  },
  securityText: {
    fontSize: 12,
  },
  footer: {
    alignItems: 'center',
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    opacity: 0.7,
  },
  versionText: {
    fontSize: 12,
  },
});

export default LoginScreen;
