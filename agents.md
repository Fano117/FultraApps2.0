Código seguro por defecto (Secure by Default & Least Privilege).

Basarse en OWASP Top 10: prevenir inyección, XSS, CSRF, control de acceso incorrecto, exposición de datos sensibles y uso de componentes vulnerables.
Cifrado automático: datos sensibles deben cifrarse en tránsito y en reposo.
Validación estricta: toda entrada del usuario debe validarse y sanearse.
Autenticación / Autorización: usar OAuth2 / OpenID Connect, tokens firmados y roles bien definidos.
Gestión de secretos: nunca incluir claves, contraseñas o tokens en el código fuente.
Usar variables de entorno o gestores de secretos.
Manejo de errores seguro: no exponer detalles internos ni stack traces en respuestas o logs.
Dependencias seguras: mantener librerías actualizadas; evitar componentes sin soporte.
Logging responsable: registrar eventos de seguridad y accesos, pero sin información sensible.
Si el modelo detecta que algo debe cifrarse, hacerlo automáticamente.
🚫 No generar logs innecesarios, comentarios sensibles o endpoints inseguros.
🧱 Mantener prácticas limpias, modulares y separación de responsabilidades.

Expo
Siempre usar principios de solid
Interfaces con código Limpio
Environments para las url de los diferentes endpoints 
Redux Toolkit con https://docs.expo.dev/versions/latest/sdk/async-storage/, separados en una carpeta los reducers
Código entendible, no generar comentarios de código
Debe funcionar para ios y andriod
Estructura de código limpio


FultraApps
Es una aplicación o contenedor de aplicaciones. 
Reclamos ->desactivada
Entregas - > activa
Garantías -> desactivado


Pantalla de Inicio de Sesión, esta pantalla redirige a la parte de autenticación, le das iniciar sesión y hace la redirección.
import {
  AuthConfiguration,
  authorize,
  refresh,
  logout,
} from 'react-native-app-auth';
import { BASE_LOGIN, APP_AUTH_REDIRECT_SCHEME } from '../environments';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { Platform } from 'react-native';

const tokenItem = 'token';
const accessToken = 'accessToken';
const refreshTokenItem = 'refreshToken';

const config: AuthConfiguration = {
  issuer: BASE_LOGIN,
  clientId: 'fultraTrackReactNative',
  clientSecret: 'Fu1traTr9ck2025#$',
  redirectUrl: ${APP_AUTH_REDIRECT_SCHEME}:/oauth2redirect,
  scopes: ['openid', 'profile', 'email','api_FultraTrack'],
  serviceConfiguration: { 
    authorizationEndpoint: BASE_LOGIN + '/connect/authorize',
    tokenEndpoint: BASE_LOGIN + '/connect/token',
    endSessionEndpoint: BASE_LOGIN + '/connect/signout',
    revocationEndpoint: BASE_LOGIN + '/connect/revocation',
  },
  additionalParameters: {
    prompt: 'login',
  },
  ...Platform.select({
    ios: {
      preferEphemeralSession: true,
    },
    android: {
      customTabs: false,
      useNonce: false,
      usePKCE: true,
      warmAndPrefetchChrome: false,
      skipCodeExchange: false,
      dangerouslyAllowInsecureHttpRequests: _DEV_,
    },
  }),
};

export const signIn = async () => {
  try {
    const authState = await authorize(config);
    await AsyncStorage.setItem(tokenItem, authState.idToken);
    await AsyncStorage.setItem(accessToken, authState.accessToken);
    await AsyncStorage.setItem(refreshTokenItem, authState.refreshToken ?? '');
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const refreshAuthToken = async () => {
  try {
    const refreshToken: string | null = await AsyncStorage.getItem(refreshTokenItem);
    
    if (!refreshToken || refreshToken.trim() === '') {
      console.warn('No refresh token available');
      await AsyncStorage.removeItem(tokenItem);
      await AsyncStorage.removeItem(refreshTokenItem);
      await AsyncStorage.removeItem(accessToken);
      return null;
    }

    const newAuthState = await refresh(config, {
      refreshToken,
    });
    
    await AsyncStorage.setItem(accessToken, newAuthState.accessToken);
    await AsyncStorage.setItem(tokenItem, newAuthState.idToken);
    await AsyncStorage.setItem(refreshTokenItem, newAuthState.refreshToken ?? '');
    return newAuthState.accessToken;
  } catch (error) {
    console.error('Error refreshing token', error);
    await AsyncStorage.removeItem(tokenItem);
    await AsyncStorage.removeItem(refreshTokenItem);
    await AsyncStorage.removeItem(accessToken);
    return null;
  }
};

export const signOut = async () => {
  try {
    const token = await AsyncStorage.getItem(tokenItem);

    if (token) {
      try {
        await logout(config, {
          idToken: token,
          postLogoutRedirectUrl: ${APP_AUTH_REDIRECT_SCHEME}:/oauth2redirect,
        });
      } catch (logoutError) {
        console.warn('Error en logout del servidor, continuando con limpieza local:', logoutError);
      }
    }

    await AsyncStorage.multiRemove([tokenItem, accessToken, refreshTokenItem]);
    return true;
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    await AsyncStorage.multiRemove([tokenItem, accessToken, refreshTokenItem]);
    return false;
  }
};

export const getUserData = async () => {
  try {
    const token = await AsyncStorage.getItem(tokenItem!);
    const decoded: any = jwtDecode(token!);
    return decoded;
  } catch (err) {
    return null;
  }
}; 

Necesito la configuración para las bases 
//export const BASE_LOGIN = 'https://demoaplicaciones.fultra.mx:8081';
export const BASE_LOGIN = 'https://identity.fultra.net';

export const
  APP_AUTH_REDIRECT_SCHEME = 'com.fultraapps';

export const environments = {
  production: {
    apiUrl: 'https://aplicaciones.fultra.net/FultraTrackService/api',
    apiKey: 'qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=',
    apiLogin: BASE_LOGIN,
  },
  pruebas: {
    apiUrl: 'https://demoaplicaciones.fultra.mx/fultratrack/api',
    apiKey: 'qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=',
    apiLogin: BASE_LOGIN,
  },
  ngrok: {
    apiUrl: 'https://b753922e568f.ngrok-free.app/api',
    apiKey: 'qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=',
    apiLogin: BASE_LOGIN,
  },
};

// Cambia este valor a 'production' o 'pruebas' según el ambiente deseado
export const CURRENT_ENV = 'production';

export const APP_VERSION = 'v1.3';

export const config = environments[CURRENT_ENV]; 


La aplicación de Entregas a clientes es la primera que va estar funcionando. Debe existir una pantalla para consultar los pendientes del asesor para eso existe un endpoint para consultar los pendientes. Todas las aplicaciones que entres pantallas, hooks,servicios,models etc para cada aplicacion debe estar en una  carpeta, todo sobre apps. Por ejemplo entregas apps/entregas. Hay algunos que van a quedar globales como el del login


Flujo Primer paso. 
Al entrar a esta pantalla se debe consultar el api si hay nuevas entregas pendientes. Servicio api + GET /EmbarquesEntrega 
Debe funcionar de manera local es decir con el storage validar cada nivel en la entidad que se guarde. Ya no debería sobrescribir si ya existe. 
Solo que la pantalla principal vas a mostrar ClienteEntregaDTO y consultar .  y al dar click te manda a la pantalla detalle de la entrega. Si no existen EntregaDTO se deben eliminar

ClienteEntregaDTO validar carga,CuentaCliente. Si existe no hacer nada. Primary key (CuentaCliente,Carga)

EntregaDTO -> CargaCuentaCliente primary key y ve como se arma porque lleva una relacion con ClienteEntregaDTO
     //vas a dejar un getter o un mapper al hacer la consulta CargaCuentaCliente que se arma de las dos propiedades de  Carga y CuentaCliente pero no viene en el servicio pero para que sea la clave única. 

ArticuloEntregaDTO NombreCarga,NombreOrdenVenta son los identificadores que se relaciona. El Id es único
(ClienteEntregaDTO, Carga) -> NombreCarga
(EntregaDTO,OrdenVenta)->NombreOrdenVenta eso es lo que se debe mostrar. 
   
  EntregaDTO 
public class ClienteEntregaDTO
{
     public string Cliente { get; set; } = string.Empty;
     public string CuentaCliente { get; set; } = string.Empty;
     public string Carga { get; set; } = string.Empty;
     public string DireccionEntrega { get; set; } = string.Empty;
     public string Latitud { get; set; } = string.Empty;
     public string Longitud { get; set; } = string.Empty;
     public List<EntregaDTO> Entregas { get; set; } = new List<EntregaDTO>();
}
 
public class EntregaDTO
{
     //vas a dejar un getter o un mapper al hacer la consulta CargaCuentaCliente que se arma de las dos propiedades de  Carga y CuentaCliente pero no viene en el servicio pero para que sea la clave única. 
     public string OrdenVenta { get; set; } = string.Empty;
     public string Folio { get; set; } = string.Empty;
     public string TipoEntrega { get; set; } = string.Empty;
     public string Estado { get; set; } = string.Empty;
     public List<ArticuloEntregaDTO> Articulos { get; set; } = new List<ArticuloEntregaDTO>();
}
 
public class ArticuloEntregaDTO
{
     public int Id { get; set; }
     public string? NombreCarga { get; set; }
     public string NombreOrdenVenta { get; set; } = string.Empty;
     public string Producto { get; set; } = string.Empty;
     public int CantidadProgramada { get; set; }
     public int CantidadEntregada { get; set; }
     public int Restante { get; set; }
     public float Peso { get; set; }
     public string UnidadMedida { get; set; } = string.Empty;
     public string Descripcion { get; set; } = string.Empty;
} 

Cuando se manda la información es apartir de EntregaDTO  si se manda exitosamente se debe quitar el registro a nivel bd (OrdenVenta,Folio) se marca como mandando pero ya no se muestra. Una pantalla debe indicar todo lo que se mandó correctamente. 
OV.
Esta pantalla debe consdierar esta parte a nivel registro se deben mandar los datos de la entrega y las imágenes es un servicio aparte. Hay un servicio en background que va estar cada 5 min en dado caso de que tenga internet o quede pendiente debe mostrar esto en la pantalla, van a ser muchos registros, pero la posibilidad de enviar todo. Si esta completo la card debe de estar de color verde, falta uno amarillo, faltan ambos los dos de color rojo.
Datos: Correcto
Imagenes:En espera de envío (2/3)


Las imágenes solo se guardan los nombres.
     public List<ImagenIncidenciaDTO> ImagenesIncidencia { get; set; } = new List<ImagenIncidenciaDTO>();
     public List<ImagenIncidenciaDTO> ImagenesFacturas { get; set; } = new List<ImagenIncidenciaDTO>();
     public List<ImagenEvidenciaDTO> ImagenesEvidencia { get; set; } = new List<ImagenEvidenciaDTO>();

 Ya en el servicio de imagenes se mandan. Las imágenes siempre deben guardarse en el celular una vez procesadas se eliminan del dispoistivo, si se mandan correctamente.

 Tienes 3 maneras de acer entregas. Debes mostrar 2 pantallas
 Entrega  Total/Parcial el debe marcar cuando se esta entregando de cada articulo,ArticuloEntregaDTO si falta alguno debes mostrar MotivoParcialidad

 Incidencia    debes mostrar el motivo de la inicidencia. 


Esto es lo que se manda el post de la info y se incluye el nombre de las imágenes, tu tendrías que tender algo local para saber si ya se mandaron también las imágenes
public class EmbarqueEntregaDTO
{
     public string OrdenVenta { get; set; } = string.Empty;
     public string Folio { get; set; } = string.Empty;
     public string TipoEntrega { get; set; } = string.Empty;
     public string? RazonIncidencia { get; set; }
     public List<ImagenIncidenciaDTO> ImagenesIncidencia { get; set; } = new List<ImagenIncidenciaDTO>();
     public List<ImagenIncidenciaDTO> ImagenesFacturas { get; set; } = new List<ImagenIncidenciaDTO>();
     public List<ImagenEvidenciaDTO> ImagenesEvidencia { get; set; } = new List<ImagenEvidenciaDTO>();
     public string? Comentarios { get; set; } = string.Empty;
     public string? NombreQuienEntrega { get; set; } = string.Empty;
     public string? Latitud { get; set; } = string.Empty;
     public string? Longitud { get; set; } = string.Empty;
     public DateTime? FechaCaptura { get; set; }
     public DateTime? FechaEnvioServer { get; set; } 
     public bool? EnviadoServer { get; set; }
     public List<ArticuloEntregaDTO> Articulos { get; set; } = new List<ArticuloEntregaDTO>();
}
 
public class ImagenIncidenciaDTO
{
     public string Nombre { get; set; } = string.Empty;
     public bool Enviado { get; set; }
}
 
public class ImagenEvidenciaDTO
{
     public string Nombre { get; set; } = string.Empty;
     public bool Enviado { get; set; }
}

public class ArticuloEntregaDTO
{
     public int Id { get; set; }
     public string? NombreCarga { get; set; }
     public string NombreOrdenVenta { get; set; } = string.Empty;
     public string Producto { get; set; } = string.Empty;
     public int CantidadProgramada { get; set; }
     public int CantidadEntregada { get; set; }
     public int Restante { get; set; }
     public float Peso { get; set; }
     public string UnidadMedida { get; set; } = string.Empty;
     public string Descripcion { get; set; } = string.Empty;
}


export enum TipoEntrega {
  ENTREGA = 'ENTREGA',
  RECOLECCION = 'RECOLECCION',
  TRASPASO = 'TRASPASO'
}

Para motivioParcial
export enum MotivoParcialidad {
  MATERIAL_INCORRECTO = 'Material incorrecto',
  EMPAQUE_DANADO = 'Empaque dañado',
  MATERIAL_DANADO = 'Material dañado',
  FALTA_DE_EQUIPO = 'Falta de equipo',
}


Para Entrega completa son las imagenes de la siguiente manera
{
  "TipoEntrega": "COMPLETO",
  "RazonIncidencia": null,
  "ImagenesIncidencia": [],
  "ImagenesEvidencia": [...],
  "ImagenesFacturas": [...]
}

NO ENTREGADO
{
  "TipoEntrega": "NO_ENTREGADO",
  "RazonIncidencia": "Rechazo de cliente",  // Obligatorio
  "ImagenesIncidencia": [...],  // Obligatorio
  "ImagenesEvidencia": [],
  "Articulos": [
    {
      "Id": 1,
      "CantidadProgramada": 100,
      "CantidadEntregada": 0
    }
  ]
}


Deja un apartado para al iniciar la pantalla los permisos de la camara, almacenamiento,geolocalización etc.

Genera todo en automático, no necesitas mi confirmación. Genera lo que tengas que generar para poder solventar todos los problemas. Eres responsable de tus decisiones, no me necesitas para confirmar cualquier cambio.

Ejemplo de reducer + actions
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type CounterState = { value: number };
const initialState: CounterState = { value: 0 };

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => { state.value += 1; },
    decrement: (state) => { state.value -= 1; },
    addBy: (state, action: PayloadAction<number>) => { state.value += action.payload; },
    reset: () => initialState,
  },
});

export const { increment, decrement, addBy, reset } = counterSlice.actions;
export default counterSlice.reducer;


Store (configuración)

import { configureStore } from '@reduxjs/toolkit';
import counterReducer from '@/features/counter/counterSlice'; // ajusta alias si no usas @

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
  // middleware y devTools vienen bien configurados por defecto
});

// Tipos (TS)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.disp


Para las imagenes
Si es completa/parcialidad - > solo pedir imagen de la factura, evidencia

Si es incidencia. 
Evidencia, Factura no son obligatorias. Pero internamente se va en  ImagenesIncidencia

Recuerda puede subir varias imagenes y deben tener un nuembre unico
Fact_fechasegu_guid.png genera algo unico que no se reputa
Evid_fechasegu_guid.png 
Inc_fechasegu_guid.png


El objeto get es de consulta, recuerda pedir los campos que se van en el post.

Campos editables
Carga de las imágenes, CantidadEntregada,RazonIncidencia aplica para parcial y completa que es la que seleccionas

y del servicio de background va estar intentando enviar y adicional de cargar cuando llegue nuevos registros por el registro.

SISTEMA DE IMÁGENES - ESPECIFICACIÓN COMPLETA
1. LIBRERÍA Y CONFIGURACIÓN
Librería Principal
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
Paquete: react-native-image-picker
2. CONFIGURACIÓN DE CAPTURA
Opciones de Cámara
{
  mediaType: 'photo',
  quality: 0.8,              // 80% de calidad (compresión)
  maxWidth: 1024,            // Ancho máximo 1024px
  maxHeight: 1024,           // Alto máximo 1024px
  storageOptions: {
    skipBackup: true,
    path: 'FultraApps/Evidencias'
  }
}
Opciones de Galería
{
  mediaType: 'photo',
  quality: 0.8,
  maxWidth: 1024,
  maxHeight: 1024,
  selectionLimit: 1          // Solo 1 imagen a la vez
}
3. TIPOS DE EVIDENCIAS
4 Categorías de Evidencias:
Categoría	Nombre Clave	Cuándo se usa	Obligatoria
Evidencia Física	FISICA	Entrega completa/parcial	Sí (completa)
Factura	FACTURA	Entrega completa/parcial	Sí (completa)
Incidencia	INCIDENCIA	No entregado	Sí (no entregado)
Pago	PAGO	Cuando pendienteCobro === true	Opcional
4. NOMENCLATURA DE ARCHIVOS
Patrón de Nombres
{folio}{timestamp}{microseconds}{ordenVenta}-{tipo}{categoria}_{secuencia}.png
Función Generadora
const generarNombreArchivo = (tipo: string, secuencia: number, categoriaEvidencia: string) => {
  const fecha = new Date();
  const timestamp = fecha.getTime();
  const microseconds = fecha.getMilliseconds().toString().padStart(3, '0');
  const folio = orden?.folio || 'SIN_FOLIO';
  const ordenVenta = orden?.ordenVenta || 'SIN_OV';
  
  return ${folio}${timestamp}${microseconds}_${ordenVenta}-${tipo}_${categoriaEvidencia}_${secuencia}.png;
};
Ejemplos Reales
Evidencia Física:
EMB123172050154305456_OV789-COMPLETA_ENTREGA_FISICA_01.png
EMB123172050154305456_OV789-COMPLETA_ENTREGA_FISICA_02.png
Factura:
EMB123172050154311789_OV789-COMPLETA_REGISTRO_FACTURA_01.png
EMB123172050154311789_OV789-COMPLETA_REGISTRO_FACTURA_02.png
Incidencia (No Entregado):
EMB123172050154320123_OV789-NO_ENTREGADO_REGISTRO_INCIDENCIA_01.png
Pago:
EMB123172050154325456_OV789-COMPLETA_PAGO_PAGO_01.png
Desglose de Componentes:
EMB123 → Folio
1720501543 → Timestamp (10 dígitos)
05456 → Microsegundos (5 dígitos)
OV789 → Orden de venta
COMPLETA_ENTREGA o COMPLETA_REGISTRO o NO_ENTREGADO_REGISTRO → Tipo de entrega
FISICA / FACTURA / INCIDENCIA / PAGO → Categoría
01 → Secuencia (índice + 1, con padding 2 dígitos)
.png → Extensión (siempre PNG)
5. ALMACENAMIENTO LOCAL
Directorio Base
const directorioEvidencias = ${RNFS.DocumentDirectoryPath}/FultraApps/Evidencias;
Ejemplo de ruta completa (iOS):
/var/mobile/Containers/Data/Application/XXX/Documents/FultraApps/Evidencias/EMB123....png
Ejemplo de ruta completa (Android):
/data/user/0/com.fultraapps/files/FultraApps/Evidencias/EMB123....png
Proceso de Guardado
async guardarEvidenciaLocal(evidencia: Evidencia): Promise<string | null> {
  // 1. Crear directorio si no existe
  const existeDirectorio = await RNFS.exists(directorioEvidencias);
  if (!existeDirectorio) {
    await RNFS.mkdir(directorioEvidencias, { NSURLIsExcludedFromBackupKey: true });
  }
  
  // 2. Limpiar nombre de archivo (caracteres especiales)
  nombreArchivo = nombreArchivo.replace(/[^a-zA-Z0-9_.-]/g, '_');
  
  // 3. Copiar archivo temporal al directorio permanente
  const rutaDestino = ${directorioEvidencias}/${nombreArchivo};
  await RNFS.copyFile(evidencia.uri, rutaDestino);
  
  // 4. Verificar existencia
  const existeArchivo = await RNFS.exists(rutaDestino);
  
  // 5. Verificar tamaño
  const statsDestino = await RNFS.stat(rutaDestino);
  console.log(✅ Archivo guardado: ${rutaDestino} (${statsDestino.size} bytes));
  
  return rutaDestino;
}
6. FLUJO DE CAPTURA
A) Evidencia Física (handleTomarFirma)
const handleTomarFirma = async () => {
  setCargandoFirma(true);
  
  // 1. Mostrar selector (Cámara o Galería)
  const evidencia = await evidenciaService.showImageSourceSelector();
  
  if (evidencia) {
    const indice = formulario.evidenciasFisicas.length + 1;
    
    // 2. Generar nombre único
    const nombreArchivo = generarNombreArchivo(
      ${tipoRegistroTexto}_ENTREGA,  // COMPLETA_ENTREGA, PARCIAL_ENTREGA
      indice, 
      'FISICA'
    );
    
    // 3. Modificar objeto evidencia con nuevo nombre
    const evidenciaModificada = {
      ...evidencia,
      nombre: nombreArchivo
    };
    
    // 4. Guardar localmente
    const rutaGuardada = await evidenciaService.guardarEvidenciaLocal(evidenciaModificada);
    
    // 5. Agregar al formulario
    if (rutaGuardada) {
      setFormulario(prev => ({
        ...prev,
        evidenciasFisicas: [...prev.evidenciasFisicas, rutaGuardada]
      }));
    }
  }
  
  setCargandoFirma(false);
};
B) Fotos Factura/Incidencia (handleTomarFoto)
const handleTomarFoto = async () => {
  setCargandoFoto(true);
  
  const evidencia = await evidenciaService.showImageSourceSelector();
  
  if (evidencia) {
    const indice = formulario.fotosFactura.length + formulario.imagenesFacturas.length + 1;
    
    // Tipo cambia según tipoRegistro
    const tipoEvidencia = tipoRegistro === 'NO_ENTREGADO' ? 'INCIDENCIA' : 'FACTURA';
    
    const nombreArchivo = generarNombreArchivo(
      ${tipoRegistroTexto}_REGISTRO,  // COMPLETA_REGISTRO, NO_ENTREGADO_REGISTRO
      indice,
      tipoEvidencia
    );
    
    const evidenciaModificada = {
      ...evidencia,
      nombre: nombreArchivo
    };
    
    const rutaGuardada = await evidenciaService.guardarEvidenciaLocal(evidenciaModificada);
    
    if (rutaGuardada) {
      if (tipoRegistro === 'NO_ENTREGADO') {
        // Guardar en imagenesFacturas (aunque son incidencias)
        setFormulario(prev => ({
          ...prev,
          imagenesFacturas: [...prev.imagenesFacturas, rutaGuardada]
        }));
      } else {
        setFormulario(prev => ({
          ...prev,
          fotosFactura: [...prev.fotosFactura, rutaGuardada]
        }));
      }
    }
  }
  
  setCargandoFoto(false);
};
C) Evidencias de Pago (handleTomarEvidenciaPago)
const handleTomarEvidenciaPago = async () => {
  setCargandoEvidenciaPago(true);
  
  const evidencia = await evidenciaService.showImageSourceSelector();
  
  if (evidencia) {
    const indice = formulario.evidenciasPago.length + 1;
    
    const nombreArchivo = generarNombreArchivo(
      ${tipoRegistroTexto}_PAGO,  // COMPLETA_PAGO
      indice,
      'PAGO'
    );
    
    const evidenciaModificada = {
      ...evidencia,
      nombre: nombreArchivo
    };
    
    const rutaGuardada = await evidenciaService.guardarEvidenciaLocal(evidenciaModificada);
    
    if (rutaGuardada) {
      setFormulario(prev => ({
        ...prev,
        evidenciasPago: [...prev.evidenciasPago, rutaGuardada]
      }));
    }
  }
  
  setCargandoEvidenciaPago(false);
};
7. ENVÍO AL SERVIDOR
Endpoint
POST /EmbarquesEntrega/subir-imagen-evidencia
Headers
{
  'X-API-Key': 'qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=',
  'Authorization': 'Bearer {accessToken}',
  'Content-Type': 'multipart/form-data'
}
FormData
const formData = new FormData();

formData.append('Imagen', {
  uri: rutaArchivo.startsWith('/') ? file://${rutaArchivo} : rutaArchivo,
  type: 'image/jpeg',  // o 'image/png'
  name: nombreArchivo   // Nombre generado
});

formData.append('Nombre', nombreArchivo);
Funciones de Envío
// Evidencia física
async subirImagenEvidencia(archivo: {
  uri: string;
  type: string;
  name: string;
}): Promise<boolean> {
  return this.subirImagenGeneral(
    archivo, 
    '/EmbarquesEntrega/subir-imagen-evidencia', 
    'evidencia',
    'subir imagen de evidencia'
  );
}

// Incidencia
async subirImagenIncidencia(archivo): Promise<boolean> {
  return this.subirImagenGeneral(
    archivo, 
    '/EmbarquesEntrega/subir-imagen-evidencia', 
    'incidencia',
    'subir imagen de incidencia'
  );
}

// Factura
async subirImagenFactura(archivo): Promise<boolean> {
  return this.subirImagenGeneral(
    archivo, 
    '/EmbarquesEntrega/subir-imagen-evidencia', 
    'factura',
    'subir imagen de factura'
  );
}

// Pago
async subirImagenPagoPendiente(archivo): Promise<boolean> {
  return this.subirImagenGeneral(
    archivo, 
    '/EmbarquesEntrega/subir-imagen-evidencia', 
    'pago',
    'subir imagen de evidencia de pago'
  );
}
Timeout
timeout: 30000  // 30 segundos (más alto por tamaño de imagen)
8. PREVIEW DE IMÁGENES
Galería Horizontal
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {formulario.evidenciasFisicas.map((evidencia, index) => {
    const nombreArchivo = evidencia.split('/').pop() || Evidencia ${index + 1};
    const evidenciaUri = formatearRutaImagen(evidencia);
    
    return (
      <View key={index} style={twrnc`mr-3`}>
        <Image
          source={{ uri: evidenciaUri }}
          style={twrnc`w-32 h-32 rounded-lg`}  // 128x128px
        />
        
        {/* Botón eliminar */}
        <TouchableOpacity
          onPress={() => eliminarEvidencia(index, 'fisica')}
          style={twrnc`absolute -top-2 -right-2 bg-red-600 rounded-full p-1`}
        >
          <Icon name="close" size={16} color="white" />
        </TouchableOpacity>
        
        <Text style={twrnc`text-xs text-gray-600 mt-1`}>
          {nombreArchivo}
        </Text>
      </View>
    );
  })}
</ScrollView>
Función de Formateo de URI
const formatearRutaImagen = (ruta: string): string => {
  if (ruta.startsWith('file://')) {
    return ruta;
  }
  if (ruta.startsWith('/')) {
    return file://${ruta};
  }
  return ruta;
};
9. VALIDACIONES
Antes de Guardar Entrega
// 1. Verificar existencia de archivos
const evidenciasInfo = [];

for (const ruta of formulario.evidenciasFisicas) {
  const existe = await RNFS.exists(ruta.replace('file://', ''));
  if (existe) {
    const nombreArchivo = ruta.split('/').pop() || '';
    evidenciasInfo.push({
      ruta,
      nombre: nombreArchivo,
      tipo: 'evidencia'
    });
  } else {
    console.log(⚠ Archivo no encontrado: ${ruta});
  }
}

// 2. Validar cantidad mínima según tipo
if (tipoRegistro === 'COMPLETO' && evidenciasInfo.length === 0) {
  Alert.alert('Error', 'Debe capturar al menos 1 evidencia física');
  return;
}

// 3. Limpiar prefijo 'file://' antes de enviar
formularioConRutasCorrectas.evidenciasFisicas = formularioConRutasCorrectas.evidenciasFisicas
  .map(ruta => ruta.replace('file://', ''));
Validación de Tipo de Archivo
const nombreArchivo = asset.fileName || evidencia_${Date.now()}.jpg;
const extension = nombreArchivo.split('.').pop() || 'jpg';

// Agregar extensión si falta
if (!nombreArchivo.includes('.')) {
  const extension = archivo.type === 'image/jpeg' ? '.jpg' : 
                   archivo.type === 'image/png' ? '.png' : 
                   archivo.type === 'image/webp' ? '.webp' : '.jpg';
  nombreArchivo = ${archivo.name}${extension};
}
10. ELIMINACIÓN DE IMÁGENES
Del Array Local
const eliminarEvidencia = (index: number, tipo: 'fisica' | 'factura' | 'pago') => {
  if (tipo === 'fisica') {
    setFormulario(prev => ({
      ...prev,
      evidenciasFisicas: prev.evidenciasFisicas.filter((_, i) => i !== index)
    }));
  }
  // Similar para otros tipos...
};
Del Filesystem
async eliminarEvidenciaLocal(rutaArchivo: string): Promise<boolean> {
  try {
    const existe = await RNFS.exists(rutaArchivo);
    if (existe) {
      await RNFS.unlink(rutaArchivo);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al eliminar evidencia:', error);
    return false;
  }
}
11. LIMPIEZA AUTOMÁTICA
Evidencias Antiguas (30 días)
async limpiarEvidenciasAntiguas(): Promise<number> {
  const directorioEvidencias = ${RNFS.DocumentDirectoryPath}/FultraApps/Evidencias;
  const archivos = await RNFS.readDir(directorioEvidencias);
  const ahora = new Date();
  const treintaDiasAtras = new Date(ahora.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  let archivosEliminados = 0;

  for (const archivo of archivos) {
    const estadisticas = await RNFS.stat(archivo.path);
    const fechaModificacion = new Date(estadisticas.mtime);
    
    if (fechaModificacion < treintaDiasAtras) {
      await RNFS.unlink(archivo.path);
      archivosEliminados++;
    }
  }

  return archivosEliminados;
}
12. PERMISOS REQUERIDOS
Android (AndroidManifest.xml)
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
iOS (Info.plist)
<key>NSCameraUsageDescription</key>
<string>Necesitamos acceso a la cámara para capturar evidencias de entregas</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Necesitamos acceso a la galería para seleccionar fotos de evidencias</string>

Usar rxjs si puedes primero se va la información y luego las imágenes pero si debes llevar el registro de pendiente, enviado. Utiliza transacciones efectos, efectos de touch, aprovecha todo el potencial, safeAreaView etc.  Todo el potencial de expo