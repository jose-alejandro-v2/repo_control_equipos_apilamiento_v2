# HDT-013 — Notificaciones Push Ampliadas (Plantilla nueva + Avería Reportada/Atendida + Servicio Finalizado)

| Campo | Valor |
|---|---|
| Estado | Implementado y validado (tests) |
| Fecha | 2026-08-13 |
| Responsable de desarrollo | AI Full Stack (opencode) |
| Alcance | Backend Quarkus (FCM HTTP v1), aplicación Android (React Native CLI), navegación push |
| Hitos incluidos | Plantilla nueva de notificación · Evento avería reportada · Evento avería atendida · Evento servicio finalizado · Rebuild backend Docker · Rebuild APK Gradle local (debug/release) · Aclaración Expo/EAS en AGENTS.md |

---

## Objetivo

Ampliar el envío de notificaciones push, que hasta ahora solo cubría el **ingreso de un nuevo equipo**, para cubrir también:

1. **Registro de una nueva avería** (equipo pasa a `AVERIADO`).
2. **Atención de una avería** (equipo vuelve a `OPERATIVO`).
3. **Finalización del servicio** (equipo pasa a `DEVUELTO`, PSR/OSR queda finalizado).

Además, se rediseñó la **plantilla del mensaje** para mostrar:

```
Evento: Nuevo ingreso de Equipo
Proveedor: ACME S.A.C. - Codigo: EQ-001
Registrado por: JUAN PEREZ
```

---

## 1. Diseño del payload FCM

| Evento | `data.tipo` | Título | Línea "Evento:" |
|---|---|---|---|
| Ingreso de equipo | `INGRESO_EQUIPO` | Nuevo ingreso de equipo | Nuevo ingreso de Equipo |
| Avería reportada | `AVERIA_REPORTADA` | Nueva avería reportada | Avería reportada |
| Avería atendida | `AVERIA_ATENDIDA` | Avería atendida | Avería atendida |
| Servicio finalizado | `SERVICIO_FINALIZADO` | Servicio finalizado | Servicio finalizado |

- `data.entidadId` = `equipo.getId()` (la app navega al detalle del equipo en todos los casos).
- Destinatarios = todos los dispositivos con token FCM activo **excepto** el usuario que originó la acción (regla "total usuarios − 1", ya existente).
- `android.priority = HIGH`, título en `notification.title`, cuerpo en `notification.body` (3 líneas con salto de línea).

---

## 2. Backend — Cambios

| Archivo | Cambio |
|---|---|
| `mapper/NotificacionPushMapper.java` | Plantilla nueva `Evento:/Proveedor: - Codigo:/Registrado por:`. Constantes `TIPO_*` y 4 métodos (`mensajeIngreso`, `mensajeAveriaReportada`, `mensajeAveriaAtendida`, `mensajeServicioFinalizado`) sobre un método privado genérico. |
| `service/NotificacionPushService.java` | Refactor a flujo genérico: `notificar(equipo, usuarioOrigen, tipo)`, `emitir(tipo, proveedor, codigo, usuario, equipoId, tokens)`, `buildMessage(...)`. Se reemplazó `MarcaRepository` por `ProveedorRepository` (la plantilla usa `proveedor.razonSocial`). 4 métodos públicos: `notificarIngresoEquipo`, `notificarAveriaReportada`, `notificarAveriaAtendida`, `notificarServicioFinalizado`. |
| `service/AveriaService.java` | Inyecta `NotificacionPushService`. En `crear()` dispara `notificarAveriaReportada` (tras marcar equipo `AVERIADO`). En `actualizar()` dispara `notificarAveriaAtendida` dentro del bloque `primeraAtencion` (tras volver el equipo a `OPERATIVO`, respetando equipos ya devueltos). |
| `service/DevolucionEquipoService.java` | Inyecta `NotificacionPushService`. En `finalizar()` dispara `notificarServicioFinalizado` (tras marcar equipo `DEVUELTO`). |

> Los envíos se realizan en el hilo daemon `fcm-notifier` (asíncrono, no bloquea la transacción). Un fallo de envío a un dispositivo no afecta a los demás ni revierte la operación.

---

## 3. Mobile — Cambios

| Archivo | Cambio |
|---|---|
| `mobile/src/navigation/AppNavigator.js` | `navigateFromNotification` ahora navega a `EquipoDetail` para los 4 tipos: `INGRESO_EQUIPO`, `AVERIA_REPORTADA`, `AVERIA_ATENDIDA`, `SERVICIO_FINALIZADO`. |
| `mobile/src/push.js` | Importación de `@react-native-firebase/messaging` sin `.default` (elimina los warnings de API deprecada v22). |
| `mobile/package.json` | `start` con `--host 10.13.18.71 --port 6109` + script `reverse` (`adb reverse tcp:6109 tcp:6109`) para solucionar *Cannot connect to Metro*. |

---

## 4. Testing

| Suite | Resultado |
|---|---|
| Backend `NotificacionPushServiceTest` | 12/12 ✅ (payload plantilla, resolución de proveedor, exclusión de origen, 4 tipos de evento, JWT OAuth2, ruta FCM) |
| Backend `AveriaServiceTest` | 16/16 ✅ (incluye verify de `notificarAveriaReportada`/`notificarAveriaAtendida`) |
| Backend `DevolucionEquipoServiceTest` | 12/12 ✅ (incluye verify de `notificarServicioFinalizado`) |
| Backend suite completa (unit) | **109/109** ✅ (excl. `MarcaResourceTest` @QuarkusTest con BD) |
| Mobile Jest | **80/80** ✅ |
| Mobile ESLint | 0 errores ✅ |
| Rebuild backend Docker | ✅ `apilamiento-backend` UP, health `UP` con BD |

---

## 5. Build APK

- Build **local con Gradle** (React Native CLI puro, sin Expo ni EAS Cloud).
- Debug: `npm run android:debug` → `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `npm run android:release` → `mobile/android/app/build/outputs/apk/release/app-release.apk`
- Se aclaró en `AGENTS.md` (secciones 2, 4.4, 6.1, 6.2, 7, 12) y en la guía `07_build_android_gradle.md` que el APK **no usa Expo/EAS**; la guía legada `07_build_android_eas.md` quedó marcada como obsoleta.

---

## 6. Ensayos en celulares (pendiente de ejecución manual)

1. Instalar el APK debug/release en los cels (`adb install -r`).
2. Verificar que los 4 eventos generan notificación con la plantilla nueva.
3. Confirmar que al tocar la notificación se navega al detalle del equipo.

---

## 7. Próximos pasos

- Realizar los ensayos en dispositivos (revisar los 4 flujos).
- Version bump del hito (`npm run version:minor` en `mobile/`) y registro en `versionHistory.js`.
- Cierre formal con auditoría (reporte `_auditoria/HITO-013/`).
