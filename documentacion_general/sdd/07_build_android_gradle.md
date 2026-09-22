# BUILD ANDROID — LOCAL GRADLE (DEBUG / RELEASE)

| Campo | Valor |
|---|---|
| Fecha | 2026-08-13 |
| Alcance | APK Android instalable compilado localmente con Gradle (React Native CLI) |
| Carpeta | `mobile/` |
| Estado | ✅ FUNCIONAL — El APK NO usa Expo SDK ni EAS Cloud |

---

## 1. Regla Principal

El APK **NO usa Expo SDK ni EAS Cloud**. El proyecto es **React Native CLI puro** (carpeta `android/` gestionada por Gradle). El build se hace **localmente** con Gradle en dos variantes:

- **Debug** → APK en `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- **Release** → APK en `mobile/android/app/build/outputs/apk/release/app-release.apk`

NO usar `eas-cli`, `expo` ni `eas.json` en ningún punto del ciclo mobile.

---

## 2. Scripts disponibles (`mobile/package.json`)

| Script | Comando | Resultado |
|---|---|---|
| Debug | `npm run android:debug` | `cd android && gradlew.bat assembleDebug` → `app-debug.apk` |
| Release | `npm run android:release` | `cd android && gradlew.bat assembleRelease` → `app-release.apk` |
| Limpiar | `npm run android:clean` | `cd android && gradlew.bat clean` |

### 2.1 Procedimiento

```bash
cd mobile
npm run android:clean       # opcional, para limpiar build previo
npm run android:debug       # o npm run android:release
```

El APK queda en:
```text
mobile/android/app/build/outputs/apk/debug/app-debug.apk
mobile/android/app/build/outputs/apk/release/app-release.apk
```

---

## 3. Workflow de Desarrollo (Debug + Metro + Hot Reload)

Ver `documentacion_general/sdd/09_workflow_desarrollo_mobile_debug.md` para el detalle completo.

| Aspecto | Valor |
|---|---|
| APK debug usa Metro (bundle no embebido) | Hot reload inmediato; requiere Metro + túneles o IP LAN |
| APK release usa bundle embebido | Sin Metro; rebuild ~1.5–4 min por cambio |
| Metro | `npm run start` en `mobile/` (escucha en `10.13.18.71:6109`) |
| Reenvío de puerto | `npm run reverse` (`adb reverse tcp:6109 tcp:6109`) |

---

## 4. Limitación conocida (antivirus Sophos)

Sophos Endpoint Agent puede bloquear las operaciones de rename atómico de Gradle en Windows:

```
Could not move temporary workspace (C:\...\.gradle-home\caches\...) to immutable location
```

### Solución (NO migrar a EAS/Expo)

Agregar exclusiones del antivirus (requiere permisos de TI) para:
- `C:\repos\repo_control_equipos_apilamiento_v2\mobile`
- `C:\Users\jose.anyarin\.gradle`
- `C:\Users\jose.anyarin\AppData\Local\Android\Sdk`

El build SIEMPRE es local con Gradle. EAS/Expo no es una alternativa válida.

---

## 5. Configuración Congelada (NO CAMBIAR)

| Archivo | Clave | Valor | Razón |
|---|---|---|---|
| `package.json` | `main` | `"index.js"` | Entry point React Native CLI (AppRegistry.registerComponent) |
| `android/gradle.properties` | `hermesEnabled` | `true` | Hermes habilitado (RN 0.81 con newArch) |
| `android/gradle.properties` | `newArchEnabled` | `true` | Nueva arquitectura React Native |

- `app.json` solo define `name`/`displayName` (sin `jsEngine` ni `platforms`).
- NO crear `eas.json` ni `app.config.*`.

---

## 6. Instalación en el celular

1. Conectar celular por USB/Wi-Fi y verificar: `adb devices -l`
2. Instalar el APK:
   ```powershell
   adb -s <serial> install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk
   ```
3. Para debug con Metro: `npm run reverse` + `npm run start`, y en el celular abrir la app.

---

*Documento actualizado por AI Auditor. Reemplaza la guía EAS legada. Versión 1.0 — 2026-08-13*
