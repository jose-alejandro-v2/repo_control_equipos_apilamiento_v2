# Sistema de Control de Equipos de Apilamiento

Plataforma full-stack para la gestión operativa de equipos de apilamiento alquilados en campañas agrícolas. Controla el ciclo completo: solicitud, asignación, operación, averías, atención y trazabilidad documental.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Backend** | Quarkus Java 3.14.4 — Hibernate ORM Panache — REST `/api/v1` |
| **Frontend Web** | React 18 + Vite 5 + Material UI 6 |
| **Mobile** | React Native CLI 0.81.5 (Android, sin Expo) + react-native-paper (MD3) + React Navigation |
| **Base de Datos** | PostgreSQL 18 — Flyway migrations |
| **Autenticación** | BCrypt + JWT propio |
| **Infraestructura** | Docker Compose + Nginx |
| **Build APK** | Gradle local (debug/release) |
| **CI/CD** | GitHub Actions |

---

## Estado del Proyecto

| Hito | Estado |
|---|---|
| HDT-001 — Base del Sistema (Docker, PostgreSQL, Backend, Auth) | ✅ Cerrado |
| HDT-002 — Núcleo Operativo (catálogos, equipos, averías) | ✅ Cerrado |
| HDT-003 — Calidad, Despliegue y Auditoría | ✅ En auditoría |
| HDT-004 — Catálogos y screens mobile faltantes | ✅ Cerrado |
| HDT-005 — Migración a React Native CLI | ✅ Cerrado (RN CLI puro, sin Expo) |
| HDT-006 — Gestión móvil PSR/OSR | ✅ Cerrado |
| HDT-007 — CRUD Usuarios Mobile | ✅ Cerrado |
| HDT-008 — UX Desplegables, Catálogos en Tiempo Real y Referencias PSR/OSR | ✅ Implementado |
| HDT-009 — Teclado móvil no cubre los inputs (UX) | ✅ Implementado |
| HDT-010 — Usuarios Mobile: solo Nombre obligatorio y Ubicación desde Sedes | ✅ Implementado |
| HDT-011 — Horómetro en Averías y Trazabilidad de Usuario (Auditoría) | ✅ Implementado |
| HDT-012 — UX Operativo, Evidencias, Contraseña 8 dígitos, PSR/OSR Finalizado y Sync Motivos→Tipos | ✅ Implementado |
| HDT-013 — Notificaciones Push Ampliadas (plantilla nueva + avería reportada/atendida + servicio finalizado) | ✅ Implementado |
| HDT-014 — Timeline Dinámico de Detalle de Equipo (segunda pantalla mobile + endpoint backend) | ✅ Implementado |
| HDT-015 — PSR 1:N OSR (múltiples OSR por PSR, estados parcial/finalizado, gestión por OSR) | ✅ Implementado |
| HDT-016 — Corrección PSR/OSR y catálogo de áreas para usuarios | ✅ Implementado |
| HDT-017 — Reporte PDF: mejora UX/UI y fix descarga mobile | ✅ Implementado |

**Features adicionales:** Finalización del Servicio (al atender una avería se restaura el estado operativo del equipo) · Devolución de equipos con evidencias por accesorios · Desplegables AppSelect con Portal + ScrollView completo · Catálogos sincronizados en tiempo real entre dispositivos · Card PSR/OSR en detalle de equipo y Marca/Modelo/GRR en PSR/OSR (retroactivo) · Teclado móvil que no cubre los inputs (KeyboardAwareScrollView en pantallas y diálogos) · Creación de usuarios mobile con solo Nombre obligatorio y Ubicación desplegable desde Sedes · Horómetro en registro y atención de averías con cálculo de días de inactividad · Trazabilidad de `usuario_creacion`/`usuario_actualizacion` desde el JWT en todos los CRUD (auditoría real) · Super Admin protegido por trigger de BD · Identificadores operativos en mayúsculas (número PSR, código, modelo, serie, guía) · Layout de averías en detalle con fecha reporte→atención y horómetros · Fecha y hora de atención editable y validada · Sync `motivos_psr → tipos_equipo` (find-or-create solo en crear) · Evidencias de ingreso ampliadas (4 vistas + extintor) y máximo 5 fotos por avería · Contraseña de exactamente 8 dígitos (DNI) · PSR/OSR finalizado read-only (409 backend + UI deshabilitada) · Fix trigger Super Admin que permite eliminar usuarios (el seed sigue protegido) · Notificaciones push FCM con plantilla `Evento/Proveedor/Codigo/Registrado por` en 4 eventos: ingreso de equipo, avería reportada, avería atendida y servicio finalizado (navegación al detalle al tocar) ·   Timeline dinámica de detalle de equipo como segunda pantalla ("Ver Historial" desde el listado): endpoint `GET /api/v1/equipos/{id}/timeline` que consolida PSR/OSR/ingreso/averías/reparaciones/finalización en orden cronológico ascendente, con resumen operativo (ingreso · nro. averías · finalización / horómetro inicio · t. inactividad · horómetro fin) y eventos expandibles con evidencias · PSR 1:N OSR: una PSR puede tener ilimitadas OSRs, con estados ACTIVO/PARCIAL/FINALIZADO, gestión individual por OSR y selección por OSR en ingreso de equipo · Catálogo de áreas (Recepción Packing, Almacén de Materiales, Frío, Cámara de PT) con selector en usuarios · **Reporte PDF de 3 páginas** (información general + recepción + devolución): tablas compactas 2×2, fotos reducidas 25%, accesorios separados por hoja, fix descarga mobile (magic bytes en lugar de statusCode).

---

## Versionado de la aplicación Mobile

La aplicación mobile utiliza **Semantic Versioning (SemVer) `X.Y.Z`** como fuente única de verdad.

- **MAJOR (`X`)**: cambios incompatibles o migraciones de stack.
- **MINOR (`Y`)**: se incrementa en `+1` por cada HITO implementado.
- **PATCH (`Z`)**: correcciones asociadas a `fix:`.
- `docs:`, `refactor:`, `test:` y `chore:` no modifican la versión.

La versión actual es **1.14.0**. La versión mostrada en `PerfilScreen` y `SettingsScreen` se obtiene automáticamente desde `mobile/package.json` mediante `mobile/src/constants/appVersion.js`.

Para incrementar la versión:

```bash
cd mobile
npm run version:minor
npm run version:patch
```

El script actualiza `package.json` y `android/app/build.gradle`, incluyendo `versionName` y un `versionCode` monótono. Después de cada HITO se debe agregar la entrada correspondiente a `mobile/src/constants/versionHistory.js`.

El historial de versiones está disponible desde **Perfil → Aplicación → Historial de versiones**.

---

## Módulos Implementados

| Módulo | Backend | Web | Mobile |
|---|---|---|---|
| Autenticación local BCrypt | ✅ | ✅ | ✅ |
| Usuarios (CRUD + permisos por rol) | ✅ | ✅ | ✅ |
| Roles | ✅ | ✅ | ✅ |
| Sedes | ✅ | ✅ | ✅ |
| Campañas (activar/cerrar) | ✅ | ✅ | ✅ |
| Tipos de Equipo | ✅ | ✅ | ✅ |
| Proveedores | ✅ | ✅ | ✅ |
| Marcas | ✅ | ✅ | ✅ |
| Equipos (con detalle + estado dinámico) | ✅ | ✅ | ✅ |
| PSR / OSR (con date picker nativo) | ✅ | ✅ | ✅ |
| Averías (registrar + atender + finalizar, con horómetro y días de inactividad) | ✅ | ✅ | ✅ |
| Finalización del Servicio | ✅ | — | ✅ |
| Evidencias Fotográficas (1 foto) | ✅ | — | ✅ |
| Auditoría de Eventos | ✅ | ✅ | ✅ |
| Configuración (URL API) | — | — | ✅ |

---

## Puerto de Inicio Rápido

```bash
# Clonar
git clone <repo-url>
cd repo_control_equipos_apilamiento_v2

# Backend (Docker)
docker compose up -d

# Frontend Web (dev)
cd frontend
npm install
npm run dev

# Mobile
cd mobile
npm run start        # Metro (debug con hot reload)
npm run reverse      # adb reverse tcp:6109 tcp:6109

# Build APK (local Gradle, sin Expo/EAS)
cd mobile
npm run android:debug    # → android/app/build/outputs/apk/debug/app-debug.apk
npm run android:release  # → android/app/build/outputs/apk/release/app-release.apk
```

## URLs de Acceso (Local)

| Servicio | URL |
|---|---|
| Frontend SPA | `http://localhost:6110/` |
| API REST | `http://localhost:6110/api/v1/` |
| Swagger UI | `http://localhost:6110/swagger` |
| Health Check | `http://localhost:6110/health` |
| DB (externo) | `localhost:6112` |

---

## Documentación

- Especificaciones: `documentacion_general/sdd/01_epecificaciones.md`
- Plan de desarrollo: `documentacion_general/sdd/02_planes.md`
- Tareas y roadmap: `documentacion_general/sdd/03_tareas.md`
- Implementación detallada: `documentacion_general/sdd/04_implementaciones.md`
- Convenciones del proyecto: `AGENTS.md`
- Hitos: `documentacion_general/sdd/05_hito_*.md` (001–017)
- Build Android (local Gradle): `documentacion_general/sdd/07_build_android_gradle.md`
- Firebase FCM: `documentacion_general/sdd/08_firebase_fcm_configuracion.md`
