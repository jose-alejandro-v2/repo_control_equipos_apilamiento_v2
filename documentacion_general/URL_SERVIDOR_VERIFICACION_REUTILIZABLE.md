# GUÍA DE REUTILIZACIÓN — URL DE API / VERIFICACIÓN DE SERVIDOR / DETECCIÓN DE RED

> **Propósito:** Explicar de forma EXPLÍCITA cómo funciona el mecanismo de conexión servidor↔móvil en el proyecto **Control de Equipos de Apilamiento** (la "ventana de verificando servidor", el cambio de URL de la API sin recompilar, y el escenario de 2 WiFis), para que un agente IA lo replique con éxito en la segunda app **Insectos Benéficos**.
>
> **Síntoma a resolver:** en Apilamiento funciona; en Insectos Benéficos —con el mismo escenario (celular en la misma WiFi que la laptop, Metro corriendo)— la app muestra **"No se pudo conectar al servidor"**.

---

## 1. CONTEXTO: QUÉ SE IMPLEMENTÓ EN APILAMIENTO

Hay **4 piezas** que trabajan juntas y cada una es obligatoria:

1. **`ServerCheckScreen`** → primera pantalla al abrir la app. Prueba la conexión contra `GET /auth/roles`. Si falla, muestra un formulario para escribir la URL del servidor y botón **"Guardar y probar"**.
2. **`api.js`** → cliente HTTP centralizado (axios) con:
   - URL por defecto (constante) según el entorno (dev/release).
   - **Persistencia de la URL en SecureStore** (`react-native-keychain`).
   - **Interceptor de request** que lee la URL guardada **en cada petición** y la coloca como `baseURL`, además inyecta `Authorization: Bearer <token>`.
   - **Interceptor de respuesta** que borra el token si el backend responde `401`.
3. **`AndroidManifest.xml`** → `android:usesCleartextTraffic="true"` (permite HTTP plano), poque la URL es `http://<IP>:6111` sin TLS.
4. **Backend** → escucha en `0.0.0.0` (no en `127.0.0.1`) y expone el puerto 6111 mapeado en Docker. API base path `/api/v1`.

El resultado: **la URL es un dato de runtime**. El usuario la puede corregir desde la app (pantalla de verificación, botón "Configurar servidor" del login o Settings) sin tocar código ni recompilar el APK.

---

## 2. QUÉ PASA EXACTAMENTE AL ABRIR LA APP (Flujo real)

```
App inicia
   │
   ▼
AppNavigator detecta que NO hay token → AuthNavigator
   │
   ▼
ServerCheckScreen (useEffect al montar):
   1) url = loadApiUrl()   // Keychain("apiUrl") ó BUILT_IN_API_URL
   2) intenta: GET {url}/auth/roles  con timeout=5000ms y baseURL=url
   3) ─── ¿Respuesta 200? ───
         │SÍ → status='ok' → onReady() → reemplaza a  LoginScreen
         │NO → status='fail' → muestra "No se pudo conectar al servidor"
                                    + input "URL de la API"
                                    + botones [Restablecer] [Guardar y probar]
```
- Al pulsar **"Guardar y probar"**: `setApiUrl(normalizada)` (persiste en Keychain) → re-testa la misma URL → si OK, navega a Login.
- Al pulsar **"Reintentar con la URL actual"**: repite el test con la URL que ya está guardada (sirve si el backend tardó en arrancar).

**Login (pantalla siguiente) usa la MISMA URL** porque el interceptor de axios la resuelve por request. No hay conexión "dual": **Metro (6109) sirve el JavaScript, la API (6111) es una conexión directa del celular a la IP de la laptop**.

---

## 3. LA CLAVE TECHNICA: `api.js` (los 3 mecanismos)

### 3.1 Constante de URL por entorno (fallback, NO la fuente de verdad)

```js
import axios from 'axios'
import * as Keychain from 'react-native-keychain'

const TOKEN_KEY = 'accessToken'
const API_URL_KEY = 'apiUrl'

const LAN_API_URL = 'http://10.13.18.168:6111/api/v1'   // IP LAN de producción local
const DEBUG_API_URL = 'http://127.0.0.1:6111/api/v1'    // emulador / adb reverse
const IS_DEVELOPMENT = typeof __DEV__ !== 'undefined' && __DEV__
const FALLBACK_API_URL = IS_DEVELOPMENT ? DEBUG_API_URL : LAN_API_URL
export const BUILT_IN_API_URL = normalizeApiUrl(process.env.API_URL || FALLBACK_API_URL)
```

> ⚠️ **Punto crítico del escenario "2 WiFis":** `LAN_API_URL` y `DEBUG_API_URL` son **solo valores iniciales**. Si cambias de WiFi, la IP de la laptop cambia y la constante queda **desactualizada**. Por eso existe el input de URL: **el valor guardado en Keychain tiene prioridad** sobre `BUILT_IN_API_URL`.

### 3.2 Persistencia segura de la URL y del token

```js
let _cachedApiUrl = null
let _cachedToken  = null

export async function loadApiUrl() {
  if (!_cachedApiUrl) {
    const stored = await getSecureValue(API_URL_KEY)      // Keychain("apiUrl")
    _cachedApiUrl = normalizeApiUrl(stored || BUILT_IN_API_URL)
  }
  return _cachedApiUrl
}

export async function setApiUrl(url) {
  const normalized = normalizeApiUrl(url)                 // quita espacios y "/" finales
  await setSecureValue(API_URL_KEY, normalized)
  _cachedApiUrl = normalized
}

async function getSecureValue(key) {
  const credentials = await Keychain.getGenericPassword({ service: key })
  return credentials ? credentials.password : null
}
async function setSecureValue(key, value) {
  await Keychain.setGenericPassword('mi-app', String(value), { service: key })
}
```

### 3.3 Interceptores de axios (el porqué una URL nueva aplica al instante)

```js
const api = axios.create({
  baseURL: BUILT_IN_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

api.interceptors.request.use(async (config) => {
  const [apiUrl, token] = await Promise.all([loadApiUrl(), getToken()])
  config.baseURL = apiUrl                                // ← URL leída en CADA request
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {                // sesión inválida
      _cachedToken = null
      void removeToken()
    }
    return Promise.reject(error)
  }
)
```

**Por qué esto importa en la replicación:** si en Insectos Benéficos creas un client axios/fetch con una `baseURL` fija y el test de la pantalla usa una URL manual solo para el test (pero los siguientes llamados NO vuelven a leer la URL guardada), el login seguirá apuntando a la URL vieja y "funcionará para verificar" pero fallará raro o inconsistente. La URL debe ser `baseURL` dinámica resuelta **en cada request** por interceptor.

---

## 4. LA PANTALLA `ServerCheckScreen` (código a replicar tal cual)

```js
const CHECK_TIMEOUT = 5000

// Test de conexión con la URL indicada (override explícito de baseURL para ESTE request)
const runCheck = useCallback(async (urlToTest) => {
  try {
    await api.get('/auth/roles', { timeout: CHECK_TIMEOUT, baseURL: urlToTest })
    setStatus('ok')
    onReady()                       // navegar a Login
  } catch (e) {
    setStatus('fail')
    setError(e.code === 'ECONNABORTED'
      ? 'Tiempo de espera agotado. Verifica que el servidor esté activo y la IP sea correcta.'
      : (e.message || 'No se pudo conectar con el servidor'))
  }
}, [onReady])

// "Guardar y probar"
const handleSaveAndTest = async () => {
  const normalized = String(draftUrl || '').trim().replace(/\/+$/, '')
  if (!normalized) { setError('La URL de la API es obligatoria'); return }
  await setApiUrl(normalized)          // PERSISTE ANTES de probar
  await runCheck(normalized)
}
```

Detalles de comportamiento a respetar:
- El test se hace contra **el mismo endpoint que expone el backend**: `GET /auth/roles` (público, sin JWT). Si tu backend no tiene `/auth/roles`, usa el endpoint público más liviano de tu API, pero DEBE existir y devolver 200.
- El `baseURL` override es **por request** (`{ baseURL: urlToTest }`); así el test no contamina la URL global.
- Normalización: `trim()` + quitar `/` final. Esto evita `http://ip:6111/api/v1/` con doble slash.

---

## 5. PERMISOS DE RED EN ANDROID (CAUSA #1 PROBABLE DEL FALLO)

En Android 9+ (API 28+), **el tráfico HTTP plano (`http://`) está bloqueado por defecto**. Si en Insectos Benéficos el `AndroidManifest.xml` NO tiene `usesCleartextTraffic`, TODO request a `http://<IP>:6111` falla con "no se pudo conectar", aunque la IP y el backend estén perfectos.

**En Apilamiento está configurado así** (`mobile/android/app/src/main/AndroidManifest.xml:19`):

```xml
<application
    android:name=".MainApplication"
    android:allowBackup="false"
    android:usesCleartextTraffic="true"    <!-- ← OBLIGATORIO para http:// -->
    ...>
```

También requiere el permiso de internet:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

> **En Insectos Benéficos verifica:** `usesCleartextTraffic="true"` + `INTERNET` en el `AndroidManifest.xml` de `android/app/src/main/`. Alternativa más fina: un `networkSecurityConfig` con la IP, pero `usesCleartextTraffic="true"` es lo que usa Apilamiento.

---

## 6. REQUISITOS DEL LADO DEL SERVIDOR/BACKEND

Para que la laptop sirva la API al celular por WiFi se necesita TODO lo siguiente:

| Requisito | Cómo se cumple en Apilamiento | Respuesta (antes de implementar verifica) |
|---|---|---|
| Backend escucha en todas las interfaces | `quarkus.http.host=0.0.0.0` (`application.properties:30`) | ¿Tu backend escucha en `0.0.0.0`? |
| Puerto HTTP expuesto al host | `6111:6111` en `docker-compose.yml` | ¿El puerto HOST está mapeado? |
| Base path de API | `quarkus.resteasy-reactive.path=/api/v1` → la URL es `http://IP:6111/api/v1` | ¿La URL que escribes termina con el mismo base path que usa tu backend? |
| Firewall Windows / antivirus dejan pasar el puerto | Validado en la red de la laptop (exclusiones Sophos para el flujo de build; el puerto 6111 accesible) | ¿Hay regla de entrada en el puerto del backend? |
| Celular y laptop en la MISMA red/subred | WiFi del día actual | ¿Están en la misma subred (mismo router, sin aislamiento AP)? |

Prueba de sanidad **desde la laptop** (antes de tocar el celular):

```powershell
# 1. IP LAN actual de la laptop
ipconfig | Select-String -Pattern "IPv4"

# 2. ¿La API responde en esa IP?
curl http://<IP_LAPTOP>:6111/api/v1/auth/roles
```

Si el `curl` responde OK, la red está bien y el problema está en la app (cleartext/interceptor/URL guardada). Si el `curl` falla, el problema está en backend/firewall/Docker y hay que resolverlo primero.

---

## 7. EL ESCENARIO DE LAS 2 WIFIS (por qué "antes funcionaba y ahora no")

En Apilamiento co-existen 2 redes WiFi y hay **DOS tipos de URL involucradas** que dependen de la red activa:

1. **URL de Metro (JavaScript, puerto 6109):** el celular carga el JS desde el PC. Se define en la app vía **"Change Bundle Location"** o `adb reverse tcp:6109 tcp:6109`. Si el PC cambia de WiFi, cambia su IP y hay que actualizar esta URL (documentado en AGENTS.md §13.11; ej. IP usada: `10.13.18.71`).
2. **URL de la API (JSON, puerto 6111):** la que guarda el ServerCheck/Settings en Keychain. Debe apuntar a la **IP actual** de la laptop en la red activa (ej. `10.13.18.168:6111/api/v1`).

**Causa 99% del "no se pudo conectar" al cambiar de WiFi:** la URL de la API guardada en el celular quedó con la IP de la **otra** WiFi. La red nueva le da otra IP a la laptop y/o bloquea la anterior.

**Flujo correcto al cambiar de WiFi:**
1. `ipconfig` → obtener la nueva IP de la laptop en la red activa.
2. En el celular, abrir la app → pantalla de verificación → escribir `http://<NUEVA_IP>:6111/api/v1` → **"Guardar y probar"**.
3. Si la app ya pasó la verificación pero el login falla: abrir "Configurar servidor" (en Login) o Settings y corregir la URL.
4. Si además usas hot reload con Metro, verificar "Change Bundle Location" con la misma nueva IP del PC.

> Regla de oro: **la URL de la API SIEMPRE es la IP asignada por la WiFi actual, no una IP fija memorizada.**

---

## 8. DEBUG: POR QUÉ FALLA EN "INSECTOS BENÉFICOS" (checklist ordenado)

Si la pantalla muestra **"No se pudo conectar al servidor"** con el mismo escenario que Apilamiento, revisa en ESTE orden:

| # | Verificación | Cómo | Probabilidad |
|---|---|---|---|
| 1 | **Cleartext HTTP permitido** | `android/app/src/main/AndroidManifest.xml` → `android:usesCleartextTraffic="true"` | 🔴 Alta |
| 2 | **URL guardada de la otra WiFi** | Revisar en el input de la pantalla de verificación qué URL quedó; corregir a la IP actual | 🔴 Alta |
| 3 | **Backend responde desde la laptop** | `curl http://<IP_LAPTOP>:6111/api/v1/auth/roles` | 🟠 Media |
| 4 | **Backend en 0.0.0.0 y puerto mapeado** | host config + `docker ps` / puertos | 🟠 Media |
| 5 | **Firewall Windows / antivirus** | Regla de entrada para el puerto del backend; excluir app/SDK en Sophos | 🟠 Media |
| 6 | **Celular y laptop misma subred** | Mismo router WiFi; desactivar aislamiento AP/cliente | 🟡 Media |
| 7 | **El cliente HTTP aplica la URL por request** | Verificar el interceptor: `baseURL` leído de `loadApiUrl()` en cada request | 🟡 Media/Alta si cambió la URL |
| 8 | **Base path correcto** | La URL debe terminar con el base path real de la API (`/api/v1` en Apilamiento) | 🟢 Baja |
| 9 | **Timeout demasiado corto** | El backend/contenerdor frío tarda >5s en la primera respuesta; subir a 10s o presionar "Reintentar" | 🟢 Baja |
| 10 | **Metro y API confundidos** | Metro=6109 (JS), API=6111 (JSON). La verificación SOLO prueba la API | 🟢 Baja |

**Diagnóstico rápido:** en la laptop, con el backend arriba, ejecuta `curl` con la IP LAN. Si responde, prueba en el celular el endpoint desde el navegador del celular (`http://<IP>:6111/api/v1/auth/roles`) — si el celular no lo abre ni en el navegador, es red/firewall/cleartext del lado del celular; si lo abre en el navegador pero la app falla, es `usesCleartextTraffic` o el interceptor de la app.

---

## 9. PASOS PARA REPLICAR EN "INSECTOS BENÉFICOS" (implementación exacta)

1. **`api.js`**: copiar el patrón de Apilamiento completo:
   - Constantes `LAN_API_URL` / `DEBUG_API_URL` / `BUILT_IN_API_URL` (ajustar IP y puerto de tu backend).
   - `loadApiUrl` / `setApiUrl` / `getToken` / `setToken` / `removeToken` con SecureStore (react-native-keychain) usando claves `apiUrl` y `accessToken`.
   - Interceptor de request que resuelve `baseURL` + Bearer por request.
   - Interceptor de respuesta que limpia token en `401`.
2. **`AndroidManifest.xml`**: agregar `INTERNET` + `android:usesCleartextTraffic="true"`.
3. **`ServerCheckScreen`**: copiar la lógica de la sección 4 (test `GET /auth/roles` con `timeout` y `baseURL` por request, input de URL, "Guardar y probar" que persiste antes de probar, "Reintentar").
4. **LoginScreen**: agregar el colapsable **"Configurar servidor"** (input de URL + Restablecer + Guardar) para poder corregir la URL sin salir del login.
5. **Settings**: (opcional pero recomendado) pantalla de configuración con el mismo input de URL.
6. **Backend**: verificar `0.0.0.0` + puerto mapeado + endpoint público de prueba (`/auth/roles` o equivalente) que devuelva 200.
7. **Prueba de la red**: desde la laptop, `curl http://<IP_LAPTOP>:<PUERTO>/<basepath>/<endpoint-prueba>`.
8. **Scripts npm** (iguales que Apilamiento): `start` con `--host <IP_LAPTOP> --port 6109`, `reverse`, `android:debug`, `android:release`.

---

## 10. ARCHIVOS DE REFERENCIA (REPO APILAMIENTO)

| Archivo | Qué implementa |
|---|---|
| `mobile/src/api.js` | URL runtime, SecureStore, interceptores, `parseToken` |
| `mobile/src/screens/ServerCheckScreen.js` | Pantalla "Verificando servidor" + test + guardar |
| `mobile/src/screens/SettingsScreen.js` | Configuración de URL dentro de la app |
| `mobile/src/LoginScreen.js` | Botón colapsable "Configurar servidor" |
| `mobile/android/app/src/main/AndroidManifest.xml` | `usesCleartextTraffic="true"` + `INTERNET` |
| `mobile/package.json` | Scripts `start --host <IP>`, `reverse`, `android:debug`, `android:release` |
| `backend/src/main/resources/application.properties` | `quarkus.http.host=0.0.0.0`, puerto 6111, base path `/api/v1` |
| `docker-compose.yml` | Mapeo `6111:6111` del backend |
| `documentacion_general/sdd/09_workflow_desarrollo_mobile_debug.md` | Workflow debug APK + Metro (contexto de las 2 WiFis) |
| `documentacion_general/LOGIN_MODELO_REUTILIZABLE.md` | Lógica completa de login (complemento de esta guía) |

---

## 11. RESUMEN EN 10 PUNTOS (para el agente que implementa)

1. La URL de la API es un **dato de runtime**, nunca una constante inamovible.
2. La URL se **persiste en SecureStore** y se lee **en cada request** vía interceptor.
3. El ServerCheck solo prueba conectividad contra un endpoint público (en Apilamiento `GET /auth/roles`, timeout 5s).
4. "Guardar y probar" **persiste antes de probar**.
5. `usesCleartextTraffic="true"` es INDISPENSABLE para `http://` en Android 9+.
6. Backend debe escuchar en `0.0.0.0` y el puerto debe estar mapeado y abierto en el firewall.
7. La URL debe terminar con el base path real (`/api/v1`).
8. Metro (6109) y API (6111) son cosas distintas; al cambiar de WiFi hay que actualizar **ambas** IPs (bundle location + URL API).
9. Si el navegador del celular abre la URL pero la app no, es cleartext o interceptor.
10. Ante duda, muévete con `ipconfig` + `curl` antes de tocar la app.

---
*Documento de referencia — extraído del proyecto Control de Equipos de Apilamiento.*