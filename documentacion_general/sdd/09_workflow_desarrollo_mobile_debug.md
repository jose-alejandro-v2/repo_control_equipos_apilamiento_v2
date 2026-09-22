# WORKFLOW DESARROLLO MOBILE — DEBUG APK + METRO + HOT RELOAD (CELULARES FÍSICOS)

| Campo | Valor |
|---|---|
| Fecha | 2026-08-12 |
| Alcance | Desarrollo diario con hot reload en Cel 1 (Xiaomi 25100RA69G) y Cel 2 (Xiaomi 24049RN28L) |
| Carpeta | `mobile/` |
| Estado | ✅ FUNCIONAL — validado en ambos celulares |

---

## 1. Concepto Clave: Debug APK vs Release APK

| | APK Debug | APK Release |
|---|---|---|
| Bundle JS | Se carga DESDE METRO al abrir la app | Embebido dentro del APK |
| Necesita Metro | **Sí** (obligatorio) | No |
| Hot reload | **Sí** (inmediato, sin reinstalar) | No |
| Reinstalar por cambio de código | No | Sí (rebuild ~1.5–4 min) |
| "Unable to load script" si Metro/túnel caído | **Sí** | No |
| ServerCheck (pantalla config servidor) | Casi inútil (el JS ni arranca si Metro está caído) | Sí, útil para cambiar IP del backend sin reinstalar |

**Regla práctica**: durante desarrollo usar **Debug APK + Metro** (hot reload). El APK Release es solo para validación/producción final.

---

## 2. Requisitos Previos (servicios que deben estar corriendo)

| Servicio | Cómo verificar |
|---|---|
| Backend Docker | `docker ps` → `apilamiento-backend` Up en `6111` |
| Metro | `http://127.0.0.1:6109/status` → 200 |
| Celulares | `adb devices -l` → ambos con estado `device` |

---

## 3. Conectar Celulares por WiFi (ADB wireless)

Cada vez que cambies de red o entren al emparejamiento, debes:

```powershell
# 1. Ver AVDs y dispositivos
adb devices -l

# 2. Emparejar cada celular (leer IP:puerto + código FRESCOS de cada teléfono:
#    Ajustes → Config.adicional → Desarrollador → Depuración inalámbrica → Emparejar dispositivo con un código)
#    OJO: el código/IP expira en ~2 minutos
adb pair <IP_CEL1>:<puerto> <codigo>
adb pair <IP_CEL2>:<puerto> <codigo>

# 3. Copiar el nombre EXACTO de cada dispositivo desde adb devices -l
#    (puede llevar sufijos como "(2)" — ej. adb-qctoduvsa6v4cyhi-Iv9Gws (2)._adb-tls-connect._tcp)
adb devices -l

# 4. Restablecer túneles para cada dispositivo (usar nombre EXACTO)
adb -s "adb-qctoduvsa6v4cyhi-Iv9Gws (2)._adb-tls-connect._tcp" reverse tcp:6109 tcp:6109
adb -s "adb-qctoduvsa6v4cyhi-Iv9Gws (2)._adb-tls-connect._tcp" reverse tcp:6111 tcp:6111
adb -s "adb-85ijey5tdax8ob5p-NMIkJB (2)._adb-tls-connect._tcp" reverse tcp:6109 tcp:6109
adb -s "adb-85ijey5tdax8ob5p-NMIkJB (2)._adb-tls-connect._tcp" reverse tcp:6111 tcp:6111
```

### Errores comunes al conectar

| Error | Causa | Solución |
|---|---|---|
| `protocol fault (couldn't read status message)` | Código de pair expirado o IP:puerto desactualizado | Re leer el código fresco en el teléfono y reintentar |
| `device '..._adb-tls-connect._tcp' not found` | El nombre del dispositivo cambió (ej. se añadió "(2)") | Copiar el nombre EXACTO de `adb devices -l` |

---

## 4. Lanzar la App (debug) en los celulares

```powershell
adb -s "adb-qctoduvsa6v4cyhi-Iv9Gws (2)._adb-tls-connect._tcp" shell am force-stop com.apilamiento.mobile
adb -s "adb-qctoduvsa6v4cyhi-Iv9Gws (2)._adb-tls-connect._tcp" shell am start -n com.apilamiento.mobile/.MainActivity
adb -s "adb-85ijey5tdax8ob5p-NMIkJB (2)._adb-tls-connect._tcp" shell am force-stop com.apilamiento.mobile
adb -s "adb-85ijey5tdax8ob5p-NMIkJB (2)._adb-tls-connect._tcp" shell am start -n com.apilamiento.mobile/.MainActivity
```

**Verificación de que cargó desde Metro** (logcat):

```
ReactHost{0}.loadJSBundleFromMetro(): Creating BundleLoader
ReactNativeJS: Running "ControlDeEquipos" with {"rootTag":1,...,"fabric":true}
```

> Nota: si lanzas la app dos veces seguidas rápido, puede salir un crash transitorio de `onNewIntent`/soft exception. Solo haz `force-stop` antes de `start`.

---

## 5. Solucionar "Unable to load script" (pantalla roja)

**Causa**: la app debug no encuentra Metro. Ocurre cuando:
1. Los túneles `adb reverse tcp:6109` se perdieron (reconexión WiFi/USB), o
2. Metro no está corriendo en el PC.

**La pantalla ServerCheck/Login NO puede ayudar aquí** porque es código JS que vive DENTRO del bundle; si el bundle no carga, ninguna pantalla React corre.

### Solución

```powershell
# 1. Verificar Metro
Invoke-WebRequest http://127.0.0.1:6109/status   # debe dar 200

# 2. Verificar túneles (si vacíos, recrearlos)
adb -s "<nombre_exacto>" reverse --list
adb -s "<nombre_exacto>" reverse tcp:6109 tcp:6109
adb -s "<nombre_exacto>" reverse tcp:6111 tcp:6111

# 3. Reabrir la app (force-stop + start) o pulsar RELOAD en la pantalla roja
```

### Causa frecuente (2026-08-13): Metro iniciado con `--host <IP>` (solo escucha una interfaz)

Si Metro se inició con `npx react-native start --host 10.13.18.71` (o similar), SOLO escucha en esa IP:

```
TCP  10.13.18.71:6109  LISTENING   → loopback (127.0.0.1) NO responde
```

Consecuencia: los celulares que usan túnel `adb reverse` (apuntan a `localhost:6109` = `127.0.0.1`) NO encuentran Metro y muestran "Unable to load script" (`loadJSBundleFromAssets`), aunque Cel 1 (IP LAN directa) sí funcione.

**Corrección**: iniciar Metro con `--host 0.0.0.0` para que escuche en TODAS las interfaces (loopback + LAN):

```powershell
# En mobile/
npx react-native start --host 0.0.0.0 --port 6109
# o background:
Start-Process cmd -ArgumentList '/c','npx react-native start --host 0.0.0.0 --port 6109 > metro.log 2>&1' -WorkingDirectory 'C:\repos\repo_control_equipos_apilamiento_v2\mobile' -WindowStyle Hidden
```

**Verificar** que escucha en todas las interfaces:
```powershell
netstat -ano | Select-String ':6109' | Select-String 'LISTEN'
# Debe mostrar:  TCP  0.0.0.0:6109  LISTENING
```

> El mensaje de error muestra código del polyfill de console de React Native (setUpGlobals), pero ese código NO es la causa — solo es donde RN presenta el error "Unable to load script" / "Cannot connect to Metro".

---

## 6. Error 500 del Metro — `UnableToResolveError`

**Síntoma**: pantalla roja con 500 y mensaje del tipo `Unable to resolve module ../Core/InitializeCore`.

**Causa**: caché de Metro corrupta/desincronizada (pasa tras modificar `package.json`/`node_modules` o por corridas largas del Metro).

**Los archivos en `node_modules` SÍ existen** — es la caché del Metro la que falla.

### Solución (limpiar caché + reiniciar Metro)

```powershell
# 1. Detener procesos de Metro (los node arrancados en el background)
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Limpiar caché
Remove-Item -Recurse -Force "C:\repos\repo_control_equipos_apilamiento_v2\mobile\.metro-cache"
Remove-Item -Recurse -Force "C:\repos\repo_control_equipos_apilamiento_v2\mobile\.cache"
Remove-Item -Recurse -Force "C:\repos\repo_control_equipos_apilamiento_v2\mobile\node_modules\.cache"

# 3. Reiniciar Metro con reset
cd mobile
npm run start -- --reset-cache

# 4. Reabrir la app (primera carga tarda ~50s porque recompila todo)
```

---

## 7. Configuración de la URL del bundle (una sola vez por dispositivo)

> **Importante**: esto ya quedó configurado el 2026-08-12 y se PERSISTE en cada app.

### 7.1 Cel 2 — usa túnel adb (localhost:6109)

- Sin configuración especial. Depende de que los túneles `6109` estén vivos.

### 7.2 Cel 1 — App Original (usuario 0 "José Anyarín")

- Configurado para usar la **IP LAN del PC directo** (`10.13.18.71:6109`), así NO depende de túneles.
- Se guarda en la preferencia `debug_http_host` de la app.

### 7.3 Cel 1 — App Dual (usuario 999 "XSpace" / Aplicaciones Duales)

- El túnel `adb reverse` **NO le funciona** (aislamiento de red del Segunda Espacio/XSpace).
- Configurado para usar la **IP LAN del PC directo** (`10.13.18.71:6109`).

### 7.4 Cómo cambiar la IP del bundle si cambia la red del PC

```powershell
# Por UI (en el celular):
# 1. Abrir Dev Menu:  adb shell input keyevent 82          (o agitar el celular)
# 2. Seleccionar "Change Bundle Location"
# 3. Elegir la opción con la IP LAN nueva (ej. 10.13.18.71:6109) y "APPLY CHANGES"
```

O directamente escribiendo la preferencia (app debug):

```powershell
adb -s "<nombre_exacto>" shell run-as com.apilamiento.mobile \
  sh -c "echo \"<?xml...\" > shared_prefs/com.apilamiento.mobile_preferences.xml"
```

> **Regla general**: la app espera que la IP LAN del PC no cambie. Si cambia (nueva red),
> actualizar en AMBAS apps del Cel 1 (original y dual) y verificar túneles del Cel 2.

---

## 8. Detección de dispositivos y usuarios (Cel 1 Dual)

| Contexto | Valor |
|---|---|
| App principal (user 0) | `u0_a344` — "José Anyarín" |
| App dual (user 999) | `u999_a344` — "XSpace" / Segunda Espacio |
| Ver usuarios | `adb shell pm list users` |
| Ver instancias en ejecución | `adb shell "ps -ef \| grep apilamiento"` |

Lanzar la app en un usuario específico:

```powershell
adb -s "<nombre_exacto>" shell am start --user 0  -n com.apilamiento.mobile/.MainActivity   # original
adb -s "<nombre_exacto>" shell am start --user 999 -n com.apilamiento.mobile/.MainActivity   # dual
```

---

## 9. Referencias

- Config de red y puertos congelados: `AGENTS.md` sección 13
- Build APK (EAS/local): `documentacion_general/sdd/07_build_android_eas.md`
- ServerCheckScreen: `mobile/src/screens/ServerCheckScreen.js`

*Documento redactado por AI Arquitecto. Fecha: 2026-08-12.*