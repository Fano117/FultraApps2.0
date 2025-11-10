# API Móvil - Especificación de Endpoints para Backend

## Documento de Integración FultraApps 2.0

Este documento detalla los endpoints del backend que deben ser implementados para soportar las funcionalidades de rastreo y gestión de entregas en la aplicación móvil FultraApps.

---

## 📋 Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Entregas y Órdenes](#entregas-y-órdenes)
3. [Ubicación del Chofer](#ubicación-del-chofer)
4. [Notificaciones](#notificaciones)
5. [Modelos de Datos](#modelos-de-datos)
6. [Validaciones y Reglas de Negocio](#validaciones-y-reglas-de-negocio)
7. [Seguridad y Rate Limiting](#seguridad-y-rate-limiting)

---

## 🔐 Autenticación

Todos los endpoints requieren el header:
```
Authorization: Bearer {accessToken}
```

El token debe ser validado contra OpenIddict/OAuth2 (identity.fultra.net).

---

## 📦 Entregas y Órdenes

### GET /api/mobile/entregas

Lista paginada de entregas asignadas al chofer.

**Query Parameters:**
- `page` (number, default: 1): Número de página
- `pageSize` (number, default: 20, max: 100): Elementos por página
- `status` (string, optional): Filtro por estatus (PENDIENTE, EN_RUTA, COMPLETADA)
- `date` (string, optional): Fecha en formato ISO 8601 (default: hoy)

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "string (guid)",
      "numeroOrden": "string",
      "cliente": {
        "id": "string",
        "nombre": "string",
        "contacto": "string",
        "telefono": "string"
      },
      "direccion": {
        "calle": "string",
        "ciudad": "string",
        "codigoPostal": "string",
        "coordenadas": {
          "latitud": number,
          "longitud": number
        }
      },
      "estatus": "PENDIENTE | EN_RUTA | COMPLETADA | CANCELADA",
      "productos": [
        {
          "id": "string",
          "nombre": "string",
          "cantidad": number,
          "unidad": "string",
          "descripcion": "string"
        }
      ],
      "instrucciones": "string",
      "notas": "string",
      "fechaProgramada": "ISO 8601 date",
      "secuencia": number,
      "distancia": number (meters),
      "tiempoEstimado": number (seconds)
    }
  ],
  "totalCount": number,
  "pageNumber": number,
  "pageSize": number,
  "totalPages": number
}
```

**Validaciones:**
- El chofer solo puede ver entregas asignadas a él
- Validar que `page` >= 1 y `pageSize` <= 100

---

### GET /api/mobile/entregas/{id}

Obtiene los detalles completos de una entrega específica.

**Path Parameters:**
- `id` (string, required): ID de la entrega

**Response (200 OK):**
```json
{
  "id": "string",
  "numeroOrden": "string",
  "cliente": {
    "id": "string",
    "nombre": "string",
    "contacto": "string",
    "telefono": "string"
  },
  "direccion": {
    "calle": "string",
    "ciudad": "string",
    "codigoPostal": "string",
    "coordenadas": {
      "latitud": number,
      "longitud": number
    }
  },
  "estatus": "string",
  "productos": [...],
  "instrucciones": "string",
  "notas": "string",
  "fechaProgramada": "ISO 8601 date",
  "secuencia": number
}
```

**Errores:**
- 404: Entrega no encontrada
- 403: El chofer no tiene permiso para ver esta entrega

---

### GET /api/mobile/entregas/ruta

Obtiene la ruta optimizada del día para el chofer.

**Query Parameters:**
- `choferId` (string, required): ID del chofer
- `date` (string, optional): Fecha en formato ISO 8601 (default: hoy)

**Response (200 OK):**
```json
{
  "puntos": [
    {
      "latitud": number,
      "longitud": number
    }
  ],
  "distanciaTotal": number (meters),
  "tiempoEstimado": number (seconds),
  "entregas": [
    // Array de entregas ordenadas por secuencia
  ]
}
```

**Lógica de Negocio:**
- Los puntos deben estar ordenados de manera óptima (TSP - Traveling Salesman Problem)
- Incluir solo entregas con estatus PENDIENTE o EN_RUTA
- El primer punto debe ser la ubicación actual del chofer (si está disponible)

---

### POST /api/mobile/entregas/{id}/confirmar

Confirma la entrega con evidencia fotográfica y firma.

**Path Parameters:**
- `id` (string, required): ID de la entrega

**Request (multipart/form-data):**
- `fechaEntrega` (string, required): Fecha/hora de entrega en ISO 8601
- `nombreReceptor` (string, required): Nombre de quien recibe
- `latitud` (number, required): Latitud donde se realizó la entrega
- `longitud` (number, required): Longitud donde se realizó la entrega
- `observaciones` (string, optional): Notas adicionales
- `foto` (file, required): Imagen de evidencia (JPG/PNG, max 5MB)
- `firma` (file, required): Imagen de firma digital (JPG/PNG, max 2MB)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Entrega confirmada exitosamente",
  "data": {
    "entregaId": "string"
  }
}
```

**Validaciones:**
- La foto y firma son requeridas
- Validar que las coordenadas estén dentro de un radio razonable (ej. 500m del destino)
- Validar que el chofer tenga asignada esta entrega
- Actualizar el estatus de la entrega a COMPLETADA

**Acciones Post-Confirmación:**
1. Guardar la foto y firma en Azure Blob Storage
2. Publicar evento `EntregaConfirmada` en RabbitMQ:
```json
{
  "entregaId": "string",
  "choferId": "string",
  "fecha": "ISO 8601",
  "clienteId": "string",
  "numeroOrden": "string"
}
```
3. Enviar notificación push al supervisor
4. Enviar notificación por email/SMS al cliente

**Errores:**
- 400: Datos inválidos o archivos faltantes
- 403: El chofer no tiene permiso
- 404: Entrega no encontrada
- 409: La entrega ya fue confirmada

---

## 📍 Ubicación del Chofer

### POST /api/mobile/chofer/ubicacion

Actualiza la ubicación del chofer en tiempo real.

**Request Body:**
```json
{
  "choferId": "string",
  "latitud": number,
  "longitud": number,
  "timestamp": "ISO 8601",
  "velocidad": number (optional, km/h),
  "precision": number (optional, meters)
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Validaciones:**
- Validar que `choferId` coincida con el usuario autenticado
- Validar rangos de coordenadas (-90 <= lat <= 90, -180 <= lon <= 180)
- Validar que `timestamp` no sea futuro ni muy antiguo (> 5 minutos)

**Acciones:**
1. Guardar ubicación en tabla `UbicacionesChofer`
2. Publicar evento `UbicacionActualizada` en RabbitMQ:
```json
{
  "choferId": "string",
  "latitud": number,
  "longitud": number,
  "timestamp": "ISO 8601",
  "velocidad": number
}
```

---

### POST /api/mobile/chofer/ubicacion/batch

Envía múltiples ubicaciones en batch (para sincronización offline).

**Request Body:**
```json
[
  {
    "choferId": "string",
    "latitud": number,
    "longitud": number,
    "timestamp": "ISO 8601",
    "velocidad": number,
    "precision": number
  }
]
```

**Response (200 OK):**
```json
{
  "success": true,
  "processedCount": number
}
```

**Validaciones:**
- Máximo 100 ubicaciones por batch
- Aplicar las mismas validaciones que el endpoint individual
- Ignorar duplicados (mismo choferId + timestamp)

---

## 🔔 Notificaciones

### POST /api/mobile/notifications/subscribe

Registra el dispositivo para recibir notificaciones push.

**Request Body:**
```json
{
  "choferId": "string",
  "expoNotificationToken": "string",
  "deviceId": "string (UUID)"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Validaciones:**
- Validar formato de `expoNotificationToken` (ExponentPushToken[...])
- Un chofer puede tener múltiples dispositivos registrados
- Si ya existe un registro con el mismo `deviceId`, actualizar el token

---

### POST /api/mobile/notifications/unsubscribe

Elimina el registro de notificaciones del dispositivo.

**Request Body:**
```json
{
  "deviceId": "string"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

## 📊 Modelos de Datos

### Tabla: Entregas

```sql
CREATE TABLE Entregas (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  NumeroOrden NVARCHAR(50) NOT NULL,
  ClienteId UNIQUEIDENTIFIER NOT NULL,
  ChoferId UNIQUEIDENTIFIER NOT NULL,
  Estatus NVARCHAR(20) NOT NULL, -- PENDIENTE, EN_RUTA, COMPLETADA, CANCELADA
  DireccionCalle NVARCHAR(255) NOT NULL,
  DireccionCiudad NVARCHAR(100) NOT NULL,
  DireccionCodigoPostal NVARCHAR(10),
  Latitud DECIMAL(10, 8) NOT NULL,
  Longitud DECIMAL(11, 8) NOT NULL,
  FechaProgramada DATETIME2 NOT NULL,
  FechaCompletada DATETIME2,
  Secuencia INT,
  Instrucciones NVARCHAR(MAX),
  Notas NVARCHAR(MAX),
  NombreReceptor NVARCHAR(100),
  ObservacionesEntrega NVARCHAR(MAX),
  FotoEvidenciaUrl NVARCHAR(500),
  FirmaUrl NVARCHAR(500),
  LatitudEntrega DECIMAL(10, 8),
  LongitudEntrega DECIMAL(11, 8),
  CreadoPor NVARCHAR(100),
  FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
  ModificadoPor NVARCHAR(100),
  FechaModificacion DATETIME2,
  
  CONSTRAINT FK_Entregas_Clientes FOREIGN KEY (ClienteId) REFERENCES Clientes(Id),
  CONSTRAINT FK_Entregas_Choferes FOREIGN KEY (ChoferId) REFERENCES Choferes(Id)
);

CREATE INDEX IX_Entregas_ChoferId_Estatus ON Entregas(ChoferId, Estatus);
CREATE INDEX IX_Entregas_FechaProgramada ON Entregas(FechaProgramada);
```

### Tabla: UbicacionesChofer

```sql
CREATE TABLE UbicacionesChofer (
  Id BIGINT IDENTITY(1,1) PRIMARY KEY,
  ChoferId UNIQUEIDENTIFIER NOT NULL,
  Latitud DECIMAL(10, 8) NOT NULL,
  Longitud DECIMAL(11, 8) NOT NULL,
  Timestamp DATETIME2 NOT NULL,
  Velocidad DECIMAL(5, 2),
  Precision DECIMAL(7, 2),
  FechaCreacion DATETIME2 DEFAULT GETUTCDATE(),
  
  CONSTRAINT FK_UbicacionesChofer_Choferes FOREIGN KEY (ChoferId) REFERENCES Choferes(Id)
);

CREATE INDEX IX_UbicacionesChofer_ChoferId_Timestamp ON UbicacionesChofer(ChoferId, Timestamp DESC);
```

### Tabla: DispositivosNotificaciones

```sql
CREATE TABLE DispositivosNotificaciones (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  ChoferId UNIQUEIDENTIFIER NOT NULL,
  DeviceId NVARCHAR(100) NOT NULL UNIQUE,
  ExpoNotificationToken NVARCHAR(200) NOT NULL,
  Activo BIT DEFAULT 1,
  FechaRegistro DATETIME2 DEFAULT GETUTCDATE(),
  FechaUltimaActualizacion DATETIME2 DEFAULT GETUTCDATE(),
  
  CONSTRAINT FK_DispositivosNotificaciones_Choferes FOREIGN KEY (ChoferId) REFERENCES Choferes(Id)
);

CREATE INDEX IX_DispositivosNotificaciones_ChoferId ON DispositivosNotificaciones(ChoferId);
```

---

## ✅ Validaciones y Reglas de Negocio

### Validaciones Generales

1. **Autenticación**: Todos los endpoints deben validar el token JWT
2. **Autorización**: Validar que el usuario tenga el rol `Chofer` o `Administrador`
3. **Coordenadas**: 
   - Latitud: -90 <= lat <= 90
   - Longitud: -180 <= lon <= 180
4. **Timestamps**: No deben ser futuros ni muy antiguos (tolerancia: 5 minutos)

### Reglas de Negocio para Confirmar Entrega

1. Solo el chofer asignado puede confirmar la entrega
2. La entrega debe estar en estado PENDIENTE o EN_RUTA
3. Las coordenadas de confirmación deben estar dentro de 500m del destino
4. La foto y firma son obligatorias
5. Tamaño máximo: Foto 5MB, Firma 2MB
6. Formatos permitidos: JPG, PNG

### Políticas de Retención

- **UbicacionesChofer**: Mantener últimos 90 días, archivar datos antiguos
- **Fotos/Firmas en Blob Storage**: Retener 2 años
- **Logs de notificaciones**: 30 días

---

## 🔒 Seguridad y Rate Limiting

### Rate Limiting

- **Endpoints de lectura** (GET): 100 requests/minuto por usuario
- **Endpoints de escritura** (POST, PUT): 50 requests/minuto por usuario
- **Upload de archivos**: 10 requests/minuto por usuario

### CORS

Configurar CORS para permitir requests desde la app móvil:
```csharp
services.AddCors(options =>
{
    options.AddPolicy("MobileAppPolicy", builder =>
    {
        builder.WithOrigins("capacitor://localhost", "ionic://localhost")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});
```

### Validación de Token

```csharp
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://identity.fultra.net";
        options.Audience = "api_FultraTrack";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true
        };
    });
```

---

## 🔌 Integración con RabbitMQ

### Exchange y Queues

```csharp
// Declarar exchange
channel.ExchangeDeclare(
    exchange: "fultratrack.events",
    type: ExchangeType.Topic,
    durable: true
);

// Publicar eventos
var properties = channel.CreateBasicProperties();
properties.Persistent = true;
properties.ContentType = "application/json";

channel.BasicPublish(
    exchange: "fultratrack.events",
    routingKey: "entrega.confirmada",
    basicProperties: properties,
    body: Encoding.UTF8.GetBytes(JsonSerializer.Serialize(evento))
);
```

### Eventos a Publicar

1. **entrega.confirmada**
2. **ubicacion.actualizada**
3. **chofer.cercano** (cuando entra a geofence de 200m)

---

## 📝 Notas Adicionales

1. **Azure Blob Storage**: Las imágenes deben guardarse en un contenedor dedicado `entregas-evidencias/` con estructura: `{choferId}/{entregaId}/{timestamp}_foto.jpg`

2. **Logging**: Registrar todas las operaciones críticas (confirmación de entrega, actualización de ubicación) en un sistema de logging centralizado (ej. Seq, Application Insights)

3. **Monitoreo**: Configurar alertas para:
   - Confirmaciones de entrega fuera del radio permitido
   - Chofer sin reporte de ubicación por más de 10 minutos (durante jornada activa)
   - Errores de sincronización de ubicación

4. **Performance**: 
   - Cachear lista de entregas por 30 segundos
   - Usar índices apropiados en las consultas
   - Batch inserts para ubicaciones

---

## 📞 Contacto

Para dudas o aclaraciones sobre esta especificación, contactar al equipo de desarrollo móvil.

**Versión del documento**: 1.0  
**Fecha**: 2025-01-10  
**Actualizado por**: Copilot AI Assistant
