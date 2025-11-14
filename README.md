# FultraApps - Solución Multi-App Empresarial

## 📱 Descripción

FultraApps es una plataforma móvil empresarial desarrollada con Expo y React Native que integra múltiples aplicaciones de gestión empresarial en una sola solución. Actualmente incluye el módulo de **Entregas** con funcionalidad offline-first y sincronización inteligente.

## ✨ Características Principales

### 🎨 Sistema de Diseño Completo
- **Design System** personalizado basado en el diseño Fintech de Dribbble
- Componentes reutilizables (Button, Card, Input, Typography, Badge, Avatar)
- Sistema de temas con colores, tipografía y espaciado consistentes
- Soporte para gradientes y sombras
- Componentes totalmente tipados con TypeScript

### 🔐 Autenticación Segura
- OAuth2/OpenID Connect con react-native-app-auth
- Refresh tokens automáticos
- Almacenamiento seguro con AsyncStorage
- Manejo de sesiones persistentes
- Logout limpio con revocación de tokens

### 📦 Módulo de Entregas
- Gestión de entregas con sincronización offline
- Captura de evidencias fotográficas (cámara/galería)
- Geolocalización automática
- Validación de formularios
- Estados de entrega: Completo, Parcial, No Entregado
- Seguimiento de artículos y cantidades
- Sincronización inteligente en segundo plano

### 💾 Almacenamiento Offline-First
- Persistencia completa con AsyncStorage
- **Sincronización automática en background cada 15 minutos**
- **Envío directo cuando hay internet, guardado local cuando no hay**
- Gestión de imágenes en almacenamiento local
- Sistema de reintentos automáticos
- Estado de sincronización en tiempo real
- Detección inteligente de conectividad con NetInfo

### 🚀 Arquitectura Clean Code

```
FultraApps/
├── src/
│   ├── design-system/          # Sistema de diseño
│   │   ├── theme/              # Temas, colores, tipografía
│   │   └── components/         # Componentes UI reutilizables
│   ├── apps/                   # Módulos de aplicaciones
│   │   └── entregas/           # App de Entregas
│   │       ├── models/         # Tipos y modelos
│   │       ├── services/       # Lógica de negocio
│   │       ├── store/          # Redux slices
│   │       └── screens/        # Pantallas
│   ├── shared/                 # Código compartido
│   │   ├── config/             # Configuración
│   │   ├── services/           # Servicios globales (API, Auth)
│   │   ├── store/              # Redux store
│   │   ├── hooks/              # Custom hooks
│   │   └── utils/              # Utilidades
│   ├── navigation/             # Navegación
│   └── screens/                # Pantallas globales (Login, Home, Profile)
├── App.tsx                     # Punto de entrada
└── package.json
```

## 🛠️ Tecnologías Utilizadas

### Core
- **Expo 50** - Framework principal
- **React Native 0.73** - UI nativa
- **TypeScript 5.3** - Tipado estático

### Estado y Persistencia
- **Redux Toolkit** - Gestión de estado
- **Redux Persist** - Persistencia del estado
- **AsyncStorage** - Almacenamiento local

### Navegación
- **React Navigation 6** - Navegación nativa
- **Bottom Tabs** - Navegación por pestañas
- **Stack Navigator** - Navegación por pilas

### Autenticación
- **react-native-app-auth** - OAuth2/OpenID Connect
- **jwt-decode** - Decodificación de JWT

### UI/UX
- **expo-linear-gradient** - Gradientes
- **expo-blur** - Efectos de blur
- **@expo/vector-icons** - Iconos
- **react-native-safe-area-context** - Áreas seguras

### Funcionalidades Nativas
- **expo-image-picker** - Captura de imágenes
- **expo-camera** - Acceso a cámara
- **expo-location** - Geolocalización
- **expo-file-system** - Sistema de archivos
- **expo-secure-store** - Almacenamiento seguro
- **expo-background-fetch** - Tareas en background
- **expo-task-manager** - Gestión de tareas

### HTTP y APIs
- **axios** - Cliente HTTP
- **@react-native-community/netinfo** - Detección de conectividad

## 📋 Prerequisitos

- Node.js 18+

git clone https://github.com/tu-usuario/FultraApps.git
cd FultraApps
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

API_URL=https://aplicaciones.fultra.net/FultraTrackService/api
OAUTH_ISSUER=https://identity.fultra.net
OAUTH_CLIENT_ID=fultraTrackReactNative
OAUTH_CLIENT_SECRET=tu-client-secret
OAUTH_REDIRECT_SCHEME=com.fultraapps
```

### 4. Ejecutar la aplicación

#### Desarrollo

```bash
# Iniciar Metro Bundler
npm start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```
#### Producción

###  Login Screen
- Interfaz con gradiente y branding
- Manejo de errores de autenticación
- Redirección automática si ya está autenticado

### 🏠 Home Screen
- Dashboard con estadísticas
- Navegación a módulos de apps
- Tarjetas de resumen de entregas
- Indicador de entregas pendientes de sincronizar
- Pull to refresh

### 📦 Entregas List Screen
- Lista de clientes con entregas pendientes
- Vista expandible por cliente
- Información de ubicación
- Badges de estado
- Contador de entregas por cliente
- Búsqueda y filtrado

### 📝 Entrega Detail Screen
- Formulario completo de entrega
- Tres tipos de registro: Completo, Parcial, No Entregado
- Captura de imágenes (evidencia, facturas, incidencias)
- Validación de campos obligatorios
- Captura automática de ubicación GPS
- Gestión de cantidades de artículos
- Preview de imágenes capturadas

### 🔄 Pendientes Screen
- Lista de entregas pendientes de sincronizar
- Estados de sincronización en tiempo real
- Sincronización individual o masiva
- Reintentos automáticos en caso de error
- Indicadores de progreso
- Contador de intentos

### 👤 Profile Screen
- Información del usuario
- Estadísticas personales
- Opciones de configuración
- Limpiar caché local

## 🔒 Seguridad
- Refresh tokens automáticos

✅ **Almacenamiento Seguro**
- Solicitud explícita de permisos
- Validación antes de acceder a recursos

## 🧪 Testing
```bash
# Ejecutar tests


### ClienteEntregaDTO
```typescript
{
  cliente: string;
  cuentaCliente: string;
  carga: string;
  direccionEntrega: string;
  latitud: string;
  longitud: string;
  entregas: EntregaDTO[];
}
```

### EntregaDTO
```typescript
{
  ordenVenta: string;
  folio: string;
  tipoEntrega: string;
  estado: string;
  articulos: ArticuloEntregaDTO[];
}
```

### EntregaSync
```typescript
{
  id: string;
  ordenVenta: string;
  folio: string;
  tipoEntrega: string;
  estado: EstadoSincronizacion;
  nombreQuienEntrega: string;
  imagenesEvidencia: ImagenDTO[];
  imagenesFacturas: ImagenDTO[];
  imagenesIncidencia: ImagenDTO[];
  latitud: string;
  longitud: string;
  fechaCaptura: Date;
  intentosEnvio: number;
}
```

## 🔄 Estados de Sincronización

1. **PENDIENTE_ENVIO** - Entrega guardada localmente
2. **ENVIANDO** - Enviando datos al servidor
3. **DATOS_ENVIADOS** - Datos enviados, pendiente imágenes
4. **IMAGENES_PENDIENTES** - Subiendo imágenes
5. **COMPLETADO** - Sincronización completada
6. **ERROR** - Error en sincronización (permite reintentar)

## 🌐 Configuración de Ambientes

### Producción
```typescript
{
  apiUrl: 'https://aplicaciones.fultra.net/FultraTrackService/api',
  apiLogin: 'https://identity.fultra.net'
}
```

### Pruebas
```typescript
{
  apiUrl: 'https://demoaplicaciones.fultra.mx/fultratrack/api',
  apiLogin: 'https://identity.fultra.net'
}
```

### Desarrollo (ngrok)
```typescript
{
  apiUrl: 'https://[tu-ngrok-url].ngrok-free.app/api',
  apiLogin: 'https://identity.fultra.net'
}
```

## 🎨 Design System

### Colores Principales
- **Primary**: Violet (#8B5CF6) - Acciones principales
- **Secondary**: Pink (#EC4899) - Acciones secundarias
- **Success**: Green (#22C55E) - Estados exitosos
- **Warning**: Amber (#F59E0B) - Advertencias
- **Error**: Red (#EF4444) - Errores

### Tipografía
- **Headings**: h1-h6 (32px - 16px)
- **Body**: body1-body3 (16px - 12px)
- **Subtitle**: subtitle1-subtitle2
- **Button**: Semibold, 16px/14px

### Espaciado
Sistema basado en múltiplos de 4px (spacing[1] = 4px, spacing[4] = 16px, etc.)

## 📄 Licencia

© 2025 Fultra. Todos los derechos reservados.

## 👥 Equipo de Desarrollo

- **Arquitectura**: Clean Architecture + SOLID
- **UI/UX**: Sistema de diseño propio basado en Material Design
- **Backend**: API REST con .NET
- **Mobile**: Expo + React Native

## 🐛 Reporte de Bugs

Para reportar bugs o solicitar features, crea un issue en el repositorio.

## 📞 Soporte

Para soporte técnico, contacta a: soporte@fultra.net

---

Desarrollado con ❤️ por el equipo de Fultra
