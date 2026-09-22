# Avance de migracion Expo a React Native CLI

## Fase 0 - Linea base

Fecha: 2026-07-13
Rama: `refactor/mobile-react-native-cli`
Commit de referencia: `320cbbd`

### Estado Git previo

- La rama activa es la rama de migracion solicitada.
- `main` no fue modificada.
- Existian cambios locales previos no relacionados en el root: `package.json` y `package-lock.json`. Se conservaron y no se incluyeron en los commits de esta migracion.
- `mobile_expo_backup/` existe y se conserva.

### Entorno

- Node: `v26.4.0`
- npm: `12.0.0`
- Java: Eclipse Temurin JDK `21`
- `ANDROID_HOME` y `ANDROID_SDK_ROOT`: no definidos en el proceso de diagnostico.
- `JAVA_HOME`: debe apuntar a Eclipse Temurin JDK 21.

### Estado real de `mobile/`

- Proyecto Expo SDK `~54.0.35`.
- React Native `0.81.5` y React `19.1.0`.
- `main` apunta a `expo/AppEntry`.
- Scripts de inicio, Android, prebuild y EAS dependen de Expo.
- `mobile/android/` no esta versionado; `.gitignore` contiene `mobile/android/` y `mobile/ios/`.
- No existe `mobile/index.js`, `mobile/metro.config.js` ni `mobile/react-native.config.js`.
- `mobile_cli/` existe como intento previo, pero usa React Native `0.86.0` y no se considera base final.

### Tests baseline

Comando: `npm test -- --runInBand`

Resultado: no finalizo ni produjo salida dentro de 120 segundos; se cancelo para evitar dejar el proceso bloqueado. Una segunda ejecucion controlada con `--detectOpenHandles --forceExit` presento el mismo comportamiento. La causa queda pendiente de aislar tras preparar la configuracion CLI.

### Imports y dependencias Expo detectados

Imports funcionales:

- `mobile/App.js`: `expo-status-bar`.
- `mobile/src/api.js`: `expo-secure-store`.

Configuracion o dependencias Expo detectadas: `expo`, `expo-asset`, `expo-auth-session`, `expo-constants`, `expo-dev-client`, `expo-font`, `expo-linking`, `expo-secure-store`, `expo-status-bar`, `expo-web-browser`, `babel-preset-expo`, `jest-expo`, scripts Expo/EAS y plugins Expo en `app.json`.

### Dependencias funcionales a conservar

React Navigation, React Native Paper, safe-area-context, screens, vector-icons, Axios, React Hook Form, Zod y las pantallas existentes de autenticacion, equipos, averias, catalogos, usuarios, roles, auditoria, PSR y configuracion.

### Resultado de Fase 0

Diagnostico registrado. Se puede iniciar la Fase 1: generar y validar una base React Native CLI `0.81.5` / React `19.1.0` antes de integrar el codigo funcional existente.

## Fase 1 - Base CLI temporal

### Generacion

La plantilla se genero correctamente en `ApilamientoMobileCli/` con React Native CLI `0.81.5`, React `19.1.0`, titulo `Control de Equipos` y package Android `com.apilamiento.mobile`. La instalacion de npm finalizo correctamente tras ampliar el timeout.

### Validacion Gradle

La primera ejecucion fallo porque `ANDROID_HOME` no estaba definido. Se localizo el SDK en `C:\Users\jose.anyarin\AppData\Local\Android\Sdk` y se repitio la validacion con esa variable.

La segunda ejecucion fallo en `:app:checkDebugAarMetadata` por `AccessDeniedException` al mover transformaciones en el cache Gradle global. Se repitio con `GRADLE_USER_HOME` aislado dentro de la carpeta temporal y despues con `--no-parallel --max-workers=1`; ambas ejecuciones volvieron a fallar al mover transformaciones con `AccessDeniedException`.

Resultado: Fase 1 bloqueada por el entorno Windows/Sophos durante la validacion Gradle. No se copio la base temporal a `mobile/`, no se modifico `mobile/` y no se genero `app-debug.apk`. No se debe avanzar a la Fase 2 hasta que la base vacia compile correctamente.

### Reintento de desbloqueo

Se genero una segunda base limpia fuera del repositorio, en la carpeta temporal del sistema, y se instalaron `854` paquetes correctamente. La compilacion se repitio con:

- SDK Android configurado mediante `ANDROID_HOME` y `ANDROID_SDK_ROOT`.
- `GRADLE_USER_HOME` nuevo fuera del repositorio.
- `--no-daemon --no-parallel --max-workers=1`.
- `-Dorg.gradle.vfs.watch=false`.

El fallo continuo con `AccessDeniedException` al mover workspaces temporales de `caches/8.14.3/transforms` a su destino inmutable. Un movimiento manual equivalente dentro del mismo directorio si funciona, lo que confirma interferencia de bloqueo de archivos durante Gradle y no un problema de package Android, Java o SDK.

Desbloqueo requerido antes de continuar: excluir del analisis en tiempo real de Sophos/antivirus las carpetas de proyecto y cache Gradle, o ejecutar la validacion en un entorno Windows/Linux sin ese bloqueo. No se autoriza cambiar la version Gradle/RN de forma arbitraria.

### Resolucion y resultado

La validacion se completo en una plantilla limpia React Native CLI `0.81.5` / React `19.1.0`. Windows bloqueaba el renombrado atomico de workspaces Gradle; se normalizaron los workspaces temporales pendientes dentro de un cache de prueba y Gradle pudo continuar. Tambien se uso una ruta corta (`C:\rn`) para evitar el limite de 260 caracteres de Ninja/CMake.

Comando validado:

```powershell
./gradlew.bat assembleDebug --no-daemon --no-parallel --max-workers=1
```

Resultado: `BUILD SUCCESSFUL` y APK generado en `C:\rn\android\app\build\outputs\apk\debug\app-debug.apk` (101,539,425 bytes).

La base Android CLI se incorporo a `mobile/android/` sin caches, APK, `local.properties` ni keystores. Se conserva `mobile_expo_backup/`.

## Validacion de la aplicacion integrada en dispositivo

Fecha: 2026-07-21

- Se ejecutaron las 3 suites Jest existentes: 7 pruebas aprobadas.
- Se genero la APK debug nativa con React Native CLI y Gradle para `arm64-v8a`.
- Comando validado: `gradlew.bat assembleDebug --no-daemon --no-parallel --max-workers=1 -Dorg.gradle.vfs.watch=false -PreactNativeArchitectures=arm64-v8a`.
- Resultado: `BUILD SUCCESSFUL` y APK en `mobile/android/app/build/outputs/apk/debug/app-debug.apk` (40,357,628 bytes).
- Los workspaces de transformacion bloqueados por Sophos se normalizaron dentro del cache Gradle aislado, sin cambiar versiones del stack.
- La APK se instalo mediante ADB inalambrico en el dispositivo Android `24049RN28L`.
- Metro se inicio con React Native CLI en el puerto `6109` y se conecto mediante `adb reverse tcp:6109 tcp:6109` sobre ADB Wi-Fi.
- `com.apilamiento.mobile/.MainActivity` quedo como actividad visible y no se detectaron errores criticos de React Native.
- Expo Go, EAS Build y comandos Expo no participaron en la compilacion, instalacion ni ejecucion.
- En debug, la API usa `http://127.0.0.1:6111/api/v1` mediante `adb reverse tcp:6111 tcp:6111`; en release conserva `http://10.13.18.168:6111/api/v1` como valor LAN configurable.
- El interceptor Axios espera la carga de URL y token desde Keychain antes de cada solicitud, evitando la carrera que producia `Network Error` al iniciar el login.
- Se valido desde el dispositivo que los tuneles ADB Wi-Fi de Metro (`6109`) y backend (`6111`) estan activos. El login conserva la opcion `Configurar servidor` para cambios posteriores de IP.
- El Bottom Tab usa el inset inferior real de Android para evitar superposicion con la barra de navegacion del dispositivo.
- Las escenas principales del Bottom Tab reservan el inset superior real y la barra de estado usa fondo no translucido, evitando superposicion con la barra de notificaciones.
- El login usa `ScrollView` y padding de area segura superior/inferior; sus acciones permanecen visibles y desplazables al abrir la configuracion del servidor o el teclado.

## Aplicacion del sistema de diseno Mobile Vanguard

Fecha: 2026-07-21

- Se aplico el orden de implementacion definido en el apartado 30 de `documentacion_general/base/DESIGN_SYSTEM_MOBILE_VANGUARD.md`.
- Se centralizaron color, tipografia, espaciado, radios, sombras y estados en `mobile/src/theme/index.js`; no quedan colores literales fuera del tema.
- Se incorporaron las variantes oficiales Poppins Regular, Medium, SemiBold y Bold en `mobile/android/app/src/main/assets/fonts/`, junto con su licencia OFL.
- Se crearon componentes reutilizables para botones, campos, selector, tarjetas, cabecera, chips de estado, navegacion inferior, confirmacion, toast y estados loading/empty/error.
- Login y Home se migraron primero; despues PSR, Equipos, detalle de equipo, registro y atencion de averias; finalmente catalogos, administracion, perfil, configuracion y navegacion.
- Se conservaron rutas, endpoints, payloads, autenticacion, validaciones React Hook Form + Zod y reglas de visibilidad por rol.
- La barra inferior usa 68 dp mas el inset inferior y las escenas respetan el inset superior del dispositivo.
- Se agrego configuracion ESLint local para ejecutar `npm run lint` sin cambiar dependencias ni versiones mayores.
- Validaciones JavaScript: `npm run lint` correcto y 3 suites Jest / 7 pruebas aprobadas.
- El bundle Android de Metro se genero correctamente, resolviendo JSX, imports y 26 activos.
- La compilacion Gradle alcanzo CMake sin errores de codigo, pero Ninja rechazo rutas fisicas mayores a 260 caracteres. La unidad temporal y los caches de prueba fueron retirados; para regenerar el APK se mantiene la solucion ya validada de copiar el proyecto a una ruta fisica corta como `C:\rn` antes de ejecutar Gradle.

## Instalacion Wi-Fi posterior a Vanguard

Fecha: 2026-07-22

- Se preparo una copia fisica corta en `C:\rn-mobile-vanguard` para evitar MAX_PATH de Ninja/CMake.
- Se normalizaron exclusivamente workspaces temporales de Gradle bloqueados por Sophos; no se modificaron versiones ni dependencias del proyecto.
- Se agrego la tarea oficial `fonts.gradle` de `react-native-vector-icons` en `mobile/android/app/build.gradle` para empaquetar correctamente los iconos MaterialCommunityIcons.
- Gradle finalizo con `BUILD SUCCESSFUL` para `arm64-v8a`.
- APK generado y copiado a `mobile/android/app/build/outputs/apk/debug/app-debug.apk` (42,827,009 bytes; SHA-256 `6858E8C20B247E2EA922E72A59E80663AF7A0F248487230A2C29457FAA052606`).
- Instalacion ADB Wi-Fi finalizada con `Success` en el dispositivo Android `24049RN28L`.
- Se activaron `adb reverse tcp:6109 tcp:6109` para Metro y `adb reverse tcp:6111 tcp:6111` para la API.
- Se verifico visualmente el login Vanguard, la carga de perfiles, Poppins, los iconos y las areas seguras superior e inferior.
