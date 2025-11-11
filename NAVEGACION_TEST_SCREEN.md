# 📱 Agregar TestDataAdminScreen a la Navegación

## 🎯 Objetivo

Agregar la pantalla de administración de datos de prueba a tu navegación principal para poder acceder fácilmente durante el desarrollo.

---

## 📂 Ubicación del Archivo

El archivo ya está creado en:
```
src/screens/TestDataAdminScreen.tsx
```

---

## 🔧 Pasos para Agregar a la Navegación

### Opción 1: Agregar al Drawer/Menu Principal

Si tu app usa un Drawer Navigator (menú lateral):

```typescript
// En tu archivo de navegación (ej: App.tsx o Navigation.tsx)

import TestDataAdminScreen from './src/screens/TestDataAdminScreen';

// Dentro de tu Drawer.Navigator
<Drawer.Navigator>
  {/* Tus pantallas existentes */}
  <Drawer.Screen
    name="Home"
    component={HomeScreen}
  />
  <Drawer.Screen
    name="Entregas"
    component={EntregasScreen}
  />

  {/* Agregar pantalla de testing */}
  <Drawer.Screen
    name="TestData"
    component={TestDataAdminScreen}
    options={{
      title: '🧪 Datos de Prueba',
      drawerLabel: 'Administrar Testing',
    }}
  />
</Drawer.Navigator>
```

### Opción 2: Agregar a Stack Navigator

Si usas Stack Navigator:

```typescript
import TestDataAdminScreen from './src/screens/TestDataAdminScreen';

<Stack.Navigator>
  <Stack.Screen
    name="Home"
    component={HomeScreen}
  />

  {/* Agregar pantalla de testing */}
  <Stack.Screen
    name="TestDataAdmin"
    component={TestDataAdminScreen}
    options={{
      title: '🧪 Datos de Prueba',
      headerBackTitle: 'Atrás',
    }}
  />
</Stack.Navigator>
```

### Opción 3: Agregar como Tab en Bottom Tabs

Si usas Tab Navigator:

```typescript
import TestDataAdminScreen from './src/screens/TestDataAdminScreen';
import { Ionicons } from '@expo/vector-icons';

<Tab.Navigator>
  <Tab.Screen
    name="Home"
    component={HomeScreen}
    options={{
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="home" size={size} color={color} />
      ),
    }}
  />

  {/* Solo en desarrollo */}
  {__DEV__ && (
    <Tab.Screen
      name="TestData"
      component={TestDataAdminScreen}
      options={{
        title: 'Testing',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="flask" size={size} color={color} />
        ),
      }}
    />
  )}
</Tab.Navigator>
```

### Opción 4: Agregar Botón de Acceso Rápido (Recomendado para Dev)

En tu pantalla principal (Home o Dashboard), agregar un botón flotante:

```typescript
// En HomeScreen.tsx o similar

import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Tu contenido existente */}

      {/* Botón flotante para testing - solo en desarrollo */}
      {__DEV__ && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate('TestDataAdmin')}
        >
          <Text style={styles.floatingButtonText}>🧪</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  floatingButtonText: {
    fontSize: 28,
  },
});
```

---

## 🚀 Navegación Programática

Para navegar desde cualquier parte de la app:

```typescript
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();

// Navegar a la pantalla
navigation.navigate('TestDataAdmin');
```

---

## 🔐 Proteger Solo para Desarrollo

Para que la pantalla SOLO aparezca en desarrollo:

### Método 1: Condicional con __DEV__

```typescript
<Stack.Navigator>
  {/* Pantallas normales */}
  <Stack.Screen name="Home" component={HomeScreen} />

  {/* Solo en desarrollo */}
  {__DEV__ && (
    <Stack.Screen
      name="TestDataAdmin"
      component={TestDataAdminScreen}
      options={{ title: '🧪 Testing' }}
    />
  )}
</Stack.Navigator>
```

### Método 2: Basado en environment config

```typescript
import { config } from '@/shared/config/environments';

<Stack.Navigator>
  {/* Pantallas normales */}
  <Stack.Screen name="Home" component={HomeScreen} />

  {/* Solo si authDisabled está habilitado */}
  {config.devCredentials?.authDisabled && (
    <Stack.Screen
      name="TestDataAdmin"
      component={TestDataAdminScreen}
      options={{ title: '🧪 Testing' }}
    />
  )}
</Stack.Navigator>
```

### Método 3: Pantalla protegida por contraseña

```typescript
// En TestDataAdminScreen.tsx, agregar al inicio:

const [unlocked, setUnlocked] = useState(false);
const [password, setPassword] = useState('');

if (!unlocked) {
  return (
    <View style={styles.lockContainer}>
      <Text style={styles.lockTitle}>🔒 Acceso Restringido</Text>
      <TextInput
        style={styles.lockInput}
        placeholder="Contraseña de desarrollo"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={() => {
          if (password === 'dev123') {
            setUnlocked(true);
          } else {
            Alert.alert('Error', 'Contraseña incorrecta');
          }
        }}
      />
    </View>
  );
}

// Resto del código normal...
```

---

## 📱 Ejemplo Completo de Integración

Asumiendo que tu app tiene esta estructura:

```
App.tsx
  └── NavigationContainer
      └── Stack.Navigator
          ├── LoginScreen
          └── MainTabs (después de login)
              ├── HomeScreen
              ├── EntregasScreen
              └── ProfileScreen
```

Aquí está cómo integrarlo:

```typescript
// App.tsx o tu archivo principal de navegación

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Importar tus pantallas existentes
import LoginScreen from './src/screens/auth/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import EntregasScreen from './src/screens/EntregasScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Importar pantalla de testing
import TestDataAdminScreen from './src/screens/TestDataAdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tabs principales
function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Entregas" component={EntregasScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />

      {/* Tab de testing solo en desarrollo */}
      {__DEV__ && (
        <Tab.Screen
          name="Testing"
          component={TestDataAdminScreen}
          options={{
            title: '🧪 Testing',
            tabBarBadge: 'DEV',
          }}
        />
      )}
    </Tab.Navigator>
  );
}

// Stack principal
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />

        {/* Pantalla de testing como modal - solo en desarrollo */}
        {__DEV__ && (
          <Stack.Screen
            name="TestDataAdmin"
            component={TestDataAdminScreen}
            options={{
              presentation: 'modal',
              title: '🧪 Administración de Testing',
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 🎨 Personalización de Estilos

Para que coincida con el tema de tu app:

```typescript
// En TestDataAdminScreen.tsx, modificar los estilos:

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#TU_COLOR_PRIMARIO', // Cambiar por tu color
    // ... resto de estilos
  },
  button: {
    backgroundColor: '#TU_COLOR_PRIMARIO', // Cambiar por tu color
    // ... resto de estilos
  },
});
```

O usar tu sistema de temas existente:

```typescript
import { useTheme } from '@/shared/hooks/useTheme'; // Tu hook de tema

export default function TestDataAdminScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.primary }]}>
      {/* ... */}
    </View>
  );
}
```

---

## 🔍 Verificar que Funciona

1. **Reiniciar la app:**
   ```bash
   npm start -- --clear
   ```

2. **Buscar la nueva pantalla:**
   - En el menú lateral
   - En los tabs inferiores
   - O presionar el botón flotante

3. **Debe mostrar:**
   ```
   🧪 Datos de Prueba
   Administración y Simulación

   Estado Actual
   No hay datos de prueba cargados

   Configuración de Datos
   [Controles...]

   [Botón: Cargar Datos]
   ```

---

## ⚠️ Importante para Producción

**ANTES de publicar la app en producción:**

1. **Remover acceso a TestDataAdminScreen:**
   - Eliminar del navigator
   - O asegurar con `{__DEV__ && ...}`

2. **Verificar que NO hay datos de prueba:**
   ```sql
   DELETE FROM Clientes WHERE EsTestData = 1;
   DELETE FROM Entregas WHERE EsTestData = 1;
   DELETE FROM RutasGPS WHERE EsTestData = 1;
   ```

3. **Desactivar devCredentials:**
   ```typescript
   // environments.ts
   export const config: EnvironmentConfig = {
     // ...
     devCredentials: undefined, // ⚠️ IMPORTANTE
   };
   ```

---

## 🎯 Acceso Rápido para QA

Si quieres que QA acceda sin mostrar en menú:

```typescript
// Agregar gesto secreto en cualquier pantalla

import { TouchableWithoutFeedback } from 'react-native';

let tapCount = 0;
let tapTimer: NodeJS.Timeout;

<TouchableWithoutFeedback
  onPress={() => {
    tapCount++;
    clearTimeout(tapTimer);

    tapTimer = setTimeout(() => {
      tapCount = 0;
    }, 1000);

    // 5 taps rápidos para abrir testing
    if (tapCount === 5) {
      navigation.navigate('TestDataAdmin');
      tapCount = 0;
    }
  }}
>
  <View style={styles.logo}>
    {/* Tu logo o elemento visual */}
  </View>
</TouchableWithoutFeedback>
```

---

**¡Listo!** Ahora puedes acceder a la pantalla de administración de datos de prueba desde cualquier parte de tu app.
