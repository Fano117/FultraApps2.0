# Fintech Design System

Sistema de diseño completo para aplicaciones fintech con React Native, optimizado para crear interfaces modernas y profesionales.

## Componentes Disponibles

### 1. Header / Barra Superior

Componente de encabezado con avatar, saludo personalizado, notificaciones y menú.

```tsx
import { Header } from '@/design-system';

<Header
  userName="Juan Pérez"
  greeting="Hola"
  avatarUrl="https://..."
  notificationCount={5}
  onAvatarPress={() => {}}
  onNotificationPress={() => {}}
  onMenuPress={() => {}}
  variant="default" // 'default' | 'transparent'
/>
```

**Props:**
- `userName`: Nombre del usuario
- `greeting`: Texto de saludo (default: "Hola")
- `avatarUrl`: URL de la foto de perfil
- `notificationCount`: Número de notificaciones
- `variant`: Variante visual

---

### 2. BalanceCard

Tarjeta para mostrar el saldo principal con opción de ocultar, tendencias y gráfica.

```tsx
import { BalanceCard } from '@/design-system';

<BalanceCard
  accountNumber="**** **** **** 4532"
  balance={12450.75}
  currency="$"
  changeAmount={350.20}
  changePercentage={2.89}
  trendData={[4000, 4200, 3800, 4500, 4800]}
  variant="gradient" // 'default' | 'gradient'
  gradientColors={['#667eea', '#764ba2']}
/>
```

**Props:**
- `balance`: Saldo actual (requerido)
- `currency`: Símbolo de moneda (default: "$")
- `changeAmount`: Cambio en monto
- `changePercentage`: Cambio en porcentaje
- `trendData`: Array de números para gráfica de tendencia
- `variant`: 'default' o 'gradient'

---

### 3. QuickActions

Botones de acciones rápidas (Enviar, Recibir, Pagar, etc.)

```tsx
import { QuickActions } from '@/design-system';

const actions = [
  {
    id: '1',
    label: 'Enviar',
    icon: 'paper-plane',
    onPress: () => {},
    color: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  // ... más acciones
];

<QuickActions
  actions={actions}
  columns={4}
/>
```

**Props:**
- `actions`: Array de objetos con id, label, icon, onPress
- `columns`: Número de columnas (default: 4)

---

### 4. CreditCard

Componente visual de tarjeta de crédito/débito con efectos y degradados.

```tsx
import { CreditCard } from '@/design-system';

<CreditCard
  cardNumber="4532 1234 5678 9012"
  cardHolder="Juan Pérez"
  expiryDate="12/25"
  cvv="123"
  cardType="visa" // 'visa' | 'mastercard' | 'amex' | 'discover'
  gradientColors={['#1e3c72', '#2a5298']}
  variant="glassmorphism" // 'default' | 'glassmorphism'
/>
```

**Props:**
- `cardNumber`: Número de tarjeta (se enmascara automáticamente)
- `cardHolder`: Nombre del titular
- `expiryDate`: Fecha de expiración
- `cardType`: Tipo de tarjeta
- `variant`: Estilo visual

---

### 5. TransactionList

Lista de transacciones recientes con iconos de categoría, estados y montos.

```tsx
import { TransactionList } from '@/design-system';

const transactions = [
  {
    id: '1',
    merchantName: 'Starbucks',
    category: 'food',
    categoryIcon: 'cafe',
    amount: -45.50,
    type: 'expense', // 'income' | 'expense'
    status: 'completed', // 'completed' | 'pending' | 'failed'
    date: new Date(),
  },
];

<TransactionList
  transactions={transactions}
  onTransactionPress={(tx) => {}}
  showDate={true}
  groupByDate={false}
/>
```

**Props:**
- `transactions`: Array de transacciones
- `onTransactionPress`: Callback al presionar una transacción
- `showDate`: Mostrar fecha/hora
- `groupByDate`: Agrupar por fecha

---

### 6. SpendingChart

Gráficas de gastos (barras, donut, líneas).

```tsx
import { SpendingChart } from '@/design-system';

const data = [
  { label: 'Comida', value: 850, color: colors.warning[600] },
  { label: 'Transporte', value: 420 },
];

<SpendingChart
  data={data}
  type="bar" // 'bar' | 'donut' | 'line'
  title="Gastos por Categoría"
  height={200}
/>
```

**Props:**
- `data`: Array con label, value y color opcional
- `type`: Tipo de gráfica
- `title`: Título opcional
- `height`: Altura de la gráfica

---

### 7. BottomNavigation

Barra de navegación inferior con badges y estados activos.

```tsx
import { BottomNavigation } from '@/design-system';

const items = [
  {
    id: 'home',
    label: 'Inicio',
    icon: 'home-outline',
    activeIcon: 'home',
    onPress: () => {},
    badge: 3, // opcional
  },
];

<BottomNavigation
  items={items}
  activeItemId="home"
  variant="default" // 'default' | 'floating'
/>
```

---

### 8. StatCard

Tarjeta de estadística con icono, valor, tendencia y subtítulo.

```tsx
import { StatCard } from '@/design-system';

<StatCard
  title="Gastos del mes"
  value="$3,150"
  icon="trending-down"
  trend={{ value: 12, isPositive: false }}
  subtitle="vs mes anterior"
  color={colors.error[600]}
  onPress={() => {}}
/>
```

---

### 9. Componentes de Input

#### Input
```tsx
<Input
  label="Email"
  placeholder="tu@email.com"
  leftIcon={<Ionicons name="mail" />}
  error="Email inválido"
  hint="Ingresa tu correo electrónico"
  required={true}
/>
```

#### SearchBar
```tsx
<SearchBar
  placeholder="Buscar transacciones..."
  onSearch={(text) => {}}
  onClear={() => {}}
  variant="rounded"
/>
```

#### AmountInput
```tsx
<AmountInput
  value={amount}
  onChangeValue={setAmount}
  currency="$"
  label="Monto a enviar"
  maxAmount={10000}
/>
```

---

### 10. Componentes UI Base

#### Button
```tsx
<Button
  variant="primary" // 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient'
  size="medium" // 'small' | 'medium' | 'large'
  leftIcon={<Icon />}
  rightIcon={<Icon />}
  loading={false}
  disabled={false}
  fullWidth={true}
>
  Enviar Dinero
</Button>
```

#### IconButton & FAB
```tsx
<IconButton
  icon="add"
  onPress={() => {}}
  variant="primary"
  size="medium"
/>

<FAB
  icon="add"
  onPress={() => {}}
  position="bottom-right"
/>
```

#### Card
```tsx
<Card
  variant="elevated" // 'default' | 'elevated' | 'outline' | 'gradient'
  padding="medium" // 'none' | 'small' | 'medium' | 'large'
  gradient={['#667eea', '#764ba2']}
  onPress={() => {}}
>
  <Text>Contenido</Text>
</Card>
```

#### Badge
```tsx
<Badge
  value={10}
  variant="primary" // 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral'
  size="medium" // 'small' | 'medium' | 'large'
  dot={false}
/>
```

#### Avatar
```tsx
<Avatar
  source={{ uri: 'https://...' }}
  size="medium" // 'small' | 'medium' | 'large' | 'xlarge'
  fallbackText="JP"
  variant="circle" // 'circle' | 'rounded' | 'square'
/>
```

#### ProgressBar
```tsx
<ProgressBar
  value={65}
  max={100}
  label="Progreso del ahorro"
  showPercentage={true}
  color={colors.success[600]}
  variant="rounded" // 'default' | 'rounded' | 'thin'
/>
```

#### Divider
```tsx
<Divider
  label="Opciones"
  orientation="horizontal" // 'horizontal' | 'vertical'
  thickness={1}
/>
```

#### Skeleton
```tsx
<Skeleton
  width="100%"
  height={20}
  variant="text" // 'text' | 'circular' | 'rectangular'
/>

<SkeletonGroup>
  <Skeleton width="60%" height={24} />
  <Skeleton width="40%" height={16} />
</SkeletonGroup>
```

#### CategoryIcon
```tsx
<CategoryIcon
  category="food" // Categorías predefinidas con iconos
  size="medium"
/>
```

---

## Tema y Colores

El design system incluye un sistema de temas completo con:

- **Colores primarios y secundarios** con escalas de 50-900
- **Colores de estado**: success, warning, error, info
- **Espaciado** consistente (spacing[1] a spacing[12])
- **Tipografía** (h1, h2, h3, body, caption, etc.)
- **Sombras** (sm, md, lg, xl)
- **Border radius** (sm, md, lg, xl, 2xl, full)

```tsx
import { colors, spacing, typography, shadows, borderRadius } from '@/design-system/theme';
```

---

## Ejemplo Completo

Ver el archivo `src/apps/fintech/screens/FintechHomeScreen.tsx` para un ejemplo completo de una pantalla home de una app fintech usando todos los componentes.

---

## Instalación de Dependencias

Asegúrate de tener instaladas estas dependencias:

```bash
npm install expo-linear-gradient @expo/vector-icons
```

---

## Guía de Uso con Tailwind CSS

Aunque los componentes están estilizados con StyleSheet de React Native, puedes extender los estilos usando NativeWind/Tailwind CSS:

```tsx
<Button className="mt-4 shadow-lg" variant="primary">
  Botón con Tailwind
</Button>
```

---

## Contribuir

Para agregar nuevos componentes al design system:

1. Crea la carpeta del componente en `src/design-system/components/NombreComponente/`
2. Crea `NombreComponente.tsx` con el componente
3. Crea `index.ts` que exporte el componente
4. Actualiza `src/design-system/components/index.ts` para exportar el nuevo componente
5. Documenta el componente en este README

---

## Componentes Inspirados en

- [Dribbble Fintech Designs](https://dribbble.com/tags/fintech)
- Material Design 3
- iOS Human Interface Guidelines
- Mejores prácticas de apps bancarias modernas
