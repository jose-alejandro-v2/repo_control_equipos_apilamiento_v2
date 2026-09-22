# SOFTWARE DEVELOPMENT DOCUMENT (SDD)
# 02_PLAN.md

---

# 1. Objetivo del Plan

El presente documento define la estrategia general de desarrollo, implementación, despliegue y evolución del sistema de control operativo de equipos de apilamiento.

El sistema estará orientado a la administración y trazabilidad de equipos alquilados utilizados en campañas operativas agrícolas, permitiendo controlar información documental, operativa y analítica mediante aplicación móvil Android, plataforma web, backend API REST y base de datos PostgreSQL.

---

# 2. Alcance del Desarrollo

## 2.1 Alcance Incluido

El proyecto contempla el desarrollo de:

- Aplicación móvil Android para operación de campo.
- Backend centralizado basado en APIs REST.
- Plataforma web para administración y visualización de indicadores operativos.
- Gestión de autenticación local con BCrypt (login por perfil + usuario + contraseña).
- Gestión de usuarios y roles.
- Gestión de sedes.
- Gestión de campañas operativas.
- Gestión documental PSR / OSR.
- Gestión operativa de equipos.
- Gestión de tipos de equipos.
- Gestión de proveedores.
- Gestión de averías.
- Gestión de evidencias fotográficas.
- Generación de reportes PDF.
- Dashboard KPI.
- Auditoría y trazabilidad operativa.
- Gestión de catálogos y configuraciones.

## 2.2 Alcance Excluido

El proyecto no contempla:

- Operación offline.
- Integración directa con NISIRA.
- Telemetría de equipos.
- Inteligencia artificial.
- Integraciones ERP externas.
- Multiempresa.
- Firma digital avanzada.
- Integración con dispositivos IoT.
- Aplicación iOS.
- Automatización mediante bots.

---

# 3. Estrategia de Implementación

El sistema será desarrollado bajo una arquitectura modular desacoplada basada en servicios REST centralizados.

La implementación seguirá una estrategia incremental orientada a módulos funcionales priorizados según criticidad operacional.

El proyecto estará dividido en fases de:

- análisis,
- arquitectura,
- desarrollo backend,
- desarrollo frontend web,
- desarrollo frontend mobile,
- pruebas,
- despliegue,
- estabilización.

El desarrollo estará enfocado inicialmente en un MVP operativo que permita cubrir las necesidades críticas del proceso operacional de control de equipos.

---

# 4. Arquitectura General

La arquitectura del sistema estará basada en componentes desacoplados distribuidos en:

- Aplicación móvil Android.
- Plataforma web administrativa y analítica.
- Backend API REST centralizado.
- Base de datos relacional PostgreSQL 18.
- Servicio de autenticación local con BCrypt + JWT.
- Servicio de generación PDF.
- Servicio de almacenamiento multimedia basado en filesystem con rutas persistidas en PostgreSQL.

La comunicación entre clientes y backend se realizará mediante HTTPS utilizando APIs REST seguras mediante JWT.

---

# 5. Stack Tecnológico Oficial

| Capa | Tecnología | Estado |
|---|---|---|
| Backend | Quarkus Java 3.14.4 | ✅ Implementado |
| Runtime Backend | Java 21 / Docker | ✅ Implementado |
| Frontend Mobile | Expo React Native SDK ~54.0.35 | ✅ Activo. CRUD operativo: PSR/OSR, catálogos, averías, usuarios, auditoría. Build EAS Cloud (local bloqueado por Sophos). NO migrado a CLI |
| Frontend Web | React 18 SPA, Vite 5, MUI 6 | ✅ Implementado |
| Base de Datos | PostgreSQL 18 | ✅ Oficial / Implementado |
| Migraciones | Flyway | ✅ Implementado |
| Autenticación | Login local BCrypt + JWT propio | ✅ Implementado |
| Seguridad | SmallRye JWT / JWT Build / jBCrypt | ✅ Implementado |
| APIs | REST /api/v1 | ✅ Implementado |
| Reverse Proxy | Nginx | ✅ Implementado |
| Contenedorización | Docker | ✅ Implementado |
| Orquestación | Docker Compose | ✅ Implementado |
| Control de versiones | GitHub | ✅ Implementado |
| CI/CD | GitHub Actions | ⏳ Pendiente |
| Generación PDF | iText PDF | ⏳ Pendiente |
| Fotografías | Filesystem + rutas en PostgreSQL | ⏳ Pendiente |
| Infraestructura Cloud | VPS Linux | ⏳ Pendiente |

## 5.1 Decisión Oficial de Base de Datos

La base de datos oficial del proyecto es PostgreSQL 18.

Esta decisión queda alineada con:

- `docker-compose.yml`, que levanta PostgreSQL 18.
- Backend Quarkus con driver `quarkus-jdbc-postgresql`.
- Scripts SQL orientados a PostgreSQL.
- Migraciones Flyway.
- Timezone oficial `America/Lima` configurado en contenedor y backend.

No se usará MySQL en este proyecto.

---

# 6. Estructura de Módulos

| Código | Módulo | Estado Actual |
|---|---|---|---|---|
| MOD-01 | Autenticación | ✅ Validado (local BCrypt) |
| MOD-02 | Usuarios | ✅ Validado (backend + web + mobile CRUD con CreateEditUserScreen) |
| MOD-03 | Sedes | ✅ Validado (mobile + web + mobile CRUD) |
| MOD-04 | Campañas | ✅ Validado (mobile + web + mobile activar/cerrar) |
| MOD-05 | PSR / OSR | ✅ Validado (CRUD mobile con formulario, date picker, catálogos) |
| MOD-06 | Equipos | ✅ Validado (backend + web + mobile, detalle con botón dinámico) |
| MOD-07 | Tipos de Equipos | ✅ Validado (backend + web + mobile CRUD) |
| MOD-08 | Proveedores | ✅ Validado (backend + web + mobile CRUD) |
| MOD-09 | Averías | ✅ Validado (mobile + web). Incluye Finalización del Servicio (restaura estado OPERATIVO) |
| MOD-10 | Evidencias Fotográficas | ⏳ Parcial (1 foto en atención de avería) |
| MOD-11 | Dashboard KPI | ⏳ Pendiente |
| MOD-12 | Reportes PDF | ⏳ Pendiente |
| MOD-13 | Auditoría | ✅ Validado (backend audit/ + mobile screen) |
| MOD-14 | Catálogos | ✅ Validado (mobile con CatalogScreen genérico) |
| MOD-15 | Configuración | ✅ Validado (mobile SettingsScreen con URL configurable) |
| MOD-16 | Mobile App | ✅ Expo SDK 54. 14 componentes UI reutilizables. Sistema de tema MD3. 19+ pantallas. Navegación completa (AuthStack+MainStack+BottomTabs). Build EAS Cloud (local bloqueado por Sophos). NO migrado a CLI |

---

# 7. Fases del Proyecto

| Fase | Objetivo | Estado |
|---|---|---|
| Fase 1 | Definición funcional y documental | ✅ Completado |
| Fase 2 | Diseño arquitectónico | ✅ Completado |
| Fase 3 | Infraestructura Docker + PostgreSQL + Nginx | ✅ Completado |
| Fase 4 | Backend base + autenticación + usuarios + sedes + campañas | ✅ Completado |
| Fase 5 | Frontend web administrativo base | ✅ Completado |
| Fase 6 | Mobile login + APK inicial | ✅ Validado |
| Fase 7 | Migración a autenticación local BCrypt | ✅ Completado |
| Fase 8 | Módulos operativos núcleo | ✅ Completado (PSR/OSR, averías, catálogos, equipos en mobile + web) |
| Fase 8.1 | Migración mobile Expo → React Native CLI | ✅ Completado |
| Fase 8.2 | Componentes UI reutilizables mobile (14 componentes) | ✅ Completado |
| Fase 8.3 | Sistema de tema mobile (design tokens) | ✅ Completado |
| Fase 8.4 | CRUD PSR/OSR mobile con date picker nativo | ✅ Completado |
| Fase 9 | Evidencias, PDF, dashboard | ⏳ Pendiente (auditoría ya completada) |
| Fase 10 | Integración general | ⏳ Pendiente |
| Fase 11 | QA y pruebas operativas | ⏳ Pendiente |
| Fase 12 | Despliegue controlado | ⏳ Pendiente |
| Fase 13 | Estabilización y soporte inicial | ⏳ Pendiente |

---

# 8. Roadmap General Actualizado

| # | Módulo | Estado |
|---|---|---|
| 1 | Infraestructura Docker | ✅ Completado |
| 2 | PostgreSQL 18 | ✅ Completado |
| 3 | Backend API REST Quarkus | ✅ Completado base |
| 4 | Frontend Web SPA | ✅ Completado base |
| 5 | Autenticación local BCrypt + JWT | ✅ Completado |
| 6 | Usuarios (seed local) | ✅ Completado |
| 7 | Roles | ✅ Completado |
| 8 | Sedes | ✅ Completado |
| 9 | Campañas | ✅ Completado |
| 10 | Mobile login local | ✅ Validado |
| 11 | APK inicial | ✅ Validado |
| 12 | Tipos de Equipos | ✅ Completado |
| 13 | Proveedores | ✅ Completado |
| 14 | Equipos | ✅ Completado |
| 15 | PSR / OSR | ✅ Completado (CRUD mobile + web) |
| 16 | Averías | ✅ Completado (mobile + web) |
| 17 | Evidencias Fotográficas | ⏳ Parcial (1 foto en atención) |
| 18 | Dashboard KPI | ⏳ Pendiente |
| 19 | Reportes PDF | ⏳ Pendiente |
| 20 | Auditoría | ✅ Completado |
| 21 | Configuración | ✅ Completado |
| 22 | CI/CD | ⏳ Pendiente |
| 23 | QA Integral | ⏳ Pendiente |
| 24 | Despliegue Producción | ⏳ Pendiente |
| 25 | Migración mobile Expo → React Native CLI | ✅ Completado |
| 26 | Componentes UI reutilizables mobile | ✅ Completado |
| 27 | Sistema de tema mobile (Design Tokens) | ✅ Completado |
| 28 | Pantalla PSR/OSR mobile con date picker, catálogos y CRUD | ✅ Completado |
| 29 | Pantalla crear PSR mobile (React Hook Form + Zod + date picker nativo) | ✅ Completado |
| 30 | Finalización del Servicio (atención de averías con restauración estado equipo) | ✅ Completado |
| 31 | Desplegables AppSelect con Portal + ScrollView completo | ✅ Completado |
| 32 | Catálogos en tiempo real (refetch silencioso en focus + onOpen) | ✅ Completado |
| 33 | Filtro de equipos por modo (oculta DEVUELTO en selección/gestión) | ✅ Completado |
| 34 | Card PSR/OSR en detalle de equipo + Marca/Modelo/GRR en PSR/OSR (retroactivo) | ✅ Completado |
| 35 | CRUD completo campañas mobile (Dialog + date picker) | ✅ Completado |
| 36 | Tab Catálogos con secciones + permisos por rol (oculto para Usuario) | ✅ Completado |
| 37 | HDT-012: Identificadores en mayúsculas (número PSR, código, modelo, serie, guía, accesorios) | ✅ Completado |
| 38 | HDT-012: Layout de averías en detalle (fecha reporte→atención + horómetros) + fecha/hora de atención editable | ✅ Completado |
| 39 | HDT-012: Sync `motivos_psr → tipos_equipo` (find-or-create solo en crear) | ✅ Completado |
| 40 | HDT-012: Evidencias de ingreso (4 vistas + extintor) y devolución por accesorios | ✅ Completado |
| 41 | HDT-012: Máximo 5 fotos en averías + 2 evidencias obligatorias al atender | ✅ Completado |
| 42 | HDT-012: Contraseña de exactamente 8 dígitos (DNI) en backend y mobile | ✅ Completado |
| 43 | HDT-012: PSR/OSR finalizado read-only (backend 409 + UI deshabilitada) | ✅ Completado |
| 44 | HDT-012: Fix trigger Super Admin V29 (permite borrar usuarios, seed sigue protegido) | ✅ Completado |
| 45 | HDT-013: Plantilla de notificación push nueva (Evento / Proveedor - Codigo / Registrado por) | ✅ Completado |
| 46 | HDT-013: Notificación push al registrar una avería (AVERIA_REPORTADA) | ✅ Completado |
| 47 | HDT-013: Notificación push al atender una avería (AVERIA_ATENDIDA) | ✅ Completado |
| 48 | HDT-013: Notificación push al finalizar el servicio / devolución (SERVICIO_FINALIZADO) | ✅ Completado |
| 49 | HDT-013: Rebuild backend Docker + APK Gradle local (debug/release); AGENTS.md sin Expo/EAS | ✅ Completado |
| 50 | HDT-014: Endpoint backend `GET /api/v1/equipos/{id}/timeline` (EquipoTimelineService + DTOs) | ✅ Completado |
| 51 | HDT-014: Orden cronológico ascendente de eventos (PSR → OSR → ingreso → avería → reparación → finalización) con tie-break por tipo | ✅ Completado |
| 52 | HDT-014: Resumen operativo 2×3 (ingreso · nro. averías · finalización / horómetro inicio · t. inactividad · horómetro fin) | ✅ Completado |
| 53 | HDT-014: Segunda pantalla mobile `EquipoTimelineScreen` + botón "Ver Historial" en el listado | ✅ Completado |
| 54 | HDT-014: Fix expand/colapsar/re-expandir + visor de fotos (ZoomableImage) + resumen operativo | ✅ Completado |
| 55 | HDT-014: Tests backend 7/7 y mobile 103/103 + ESLint limpio + rebuild release APK | ✅ Completado |

---

# 9. Ambientes del Sistema

| Ambiente | Objetivo |
|---|---|
| Desarrollo | Construcción y pruebas técnicas |
| QA | Validación funcional y operativa |
| Producción | Operación oficial del sistema |

Cada ambiente deberá mantener configuraciones independientes y controladas.

## 9.1 Configuración de Infraestructura — Congelada

La siguiente configuración corresponde al ambiente de desarrollo local y está validada como funcionando. NO MODIFICAR sin autorización.

### Mapa de Puertos

| Servicio | Puerto Host | Puerto Contenedor | Uso |
|---|---|---|---|
| Nginx | 6110 / 443 | 80 / 443 | Frontend SPA + Proxy API |
| Backend Quarkus | 6111 | 6111 | API REST |
| PostgreSQL 18 | 6112 | 5432 | Base de datos |

### URLs de Acceso

| URL | Descripción |
|---|---|
| `http://localhost:6110/` | Frontend Web SPA |
| `http://localhost:6110/api/v1/` | API Backend (proxy Nginx) |
| `http://localhost:6110/health` | Health Check |
| `http://localhost:6110/swagger` | Swagger UI |
| `localhost:6112` | Conexión DB externa (DBeaver, pgAdmin) |

### Dependencias de Contenedores

```
postgres (healthcheck) → backend → nginx
```

---

# 10. Estrategia de Seguridad

La seguridad del sistema está basada en:

- Autenticación local con contraseñas hasheadas (BCrypt).
- Control de acceso mediante JWT.
- Roles y permisos internos.
- Expiración automática de sesiones (8 horas).
- Cambio de contraseña obligatorio en primer ingreso.
- Uso obligatorio de HTTPS en ambientes controlados.
- Protección de APIs REST.
- Auditoría de eventos críticos.
- Restricción de acceso por usuarios autorizados.

El acceso al sistema solo será permitido para usuarios previamente registrados y habilitados dentro de la plataforma.

---

# 11. Estrategia de Auditoría

El sistema deberá registrar eventos operativos relacionados a:

- Inicio y cierre de sesión.
- Creación de registros.
- Actualización de registros.
- Eliminación física administrativa.
- Eliminación lógica operacional.
- Cambios críticos.
- Errores operacionales.
- Eventos de seguridad.

La auditoría permitirá mantener trazabilidad completa del sistema.

---

# 12. Estrategia de Fotografías y Archivos

El sistema gestionará evidencias fotográficas asociadas a:

- equipos,
- ingreso de equipos,
- devolución de equipos,
- averías,
- atención de averías,
- operaciones documentales.

La decisión oficial es almacenar archivos en filesystem controlado y persistir metadatos/rutas en PostgreSQL.

---

# 13. Estrategia de Reportes PDF

El sistema permitirá generar reportes PDF relacionados a:

- equipos,
- PSR,
- OSR,
- averías,
- indicadores operativos,
- historial de uso,
- evidencias asociadas.

La generación PDF se implementará en backend usando iText PDF u otra librería Java compatible con Quarkus.

---

# 14. Estrategia KPI y Dashboard

El sistema contará con dashboards orientados a visualización operativa y analítica.

Los indicadores permitirán:

- monitoreo operativo,
- control de campañas,
- seguimiento de averías,
- seguimiento de equipos,
- trazabilidad histórica,
- análisis por proveedor,
- análisis por tipo de equipo.

Los dashboards deberán permitir filtros por:

- campaña,
- sede,
- equipo,
- proveedor,
- tipo de equipo,
- estado operativo.

---

# 15. Estrategia QA y Testing

El proyecto contemplará pruebas:

- funcionales,
- operativas,
- integración,
- APIs REST,
- frontend Android,
- frontend web,
- autenticación,
- persistencia PostgreSQL,
- carga y consulta de evidencias.

---

# 16. Estrategia DevOps y Despliegue

La estrategia de despliegue considerará:

- control de versiones mediante GitHub,
- ramas controladas,
- despliegues controlados,
- validación QA previa,
- separación de ambientes,
- control de versiones backend y frontend,
- backups PostgreSQL,
- variables de entorno seguras.

---

# 17. Estado Actual del Desarrollo

## HDT-002 — Núcleo Operativo ✅ (CERRADO)

1. Tipos de Equipo ✅
2. Proveedores ✅
3. Marcas ✅
4. Equipos ✅
5. PSR / OSR ✅ (CRUD mobile + web)
6. Averías ✅ (mobile + web)

## HDT-003 — Calidad, Despliegue y Auditoría ✅ (EN AUDITORÍA)

1. Tests backend (JUnit 5 + Mockito, 7 archivos) ✅
2. Tests frontend web (Jest, 2 archivos) ✅
3. Tests mobile (Jest + RNTL, 3 archivos) ✅
4. Módulo Rol completo ✅
5. Paquete audit/ (entidad, repositorio, servicio, API) ✅
6. Paquete config/ (CORS, AppConfig) ✅
7. Paquete security/ (JwtFilter, SecurityUtil) ✅
8. Migraciones V10 (auditoria_eventos) + V11 (seed) ✅
9. GitHub Actions CI/CD ✅
10. Modo claro/oscuro frontend ✅

## HDT-004 — Pantallas Mobile Faltantes ✅ (CERRADO)

1. CatalogScreen genérico reutilizable ✅
2. Marcas, Proveedores, TiposEquipo, Sedes Screens (CRUD) ✅
3. Roles, Usuarios, Auditoría, Settings Screens ✅
4. Tab Catálogos con menú de 9 botones ✅
5. PSR/OSR backend + web + mobile ✅

## HDT-006 — Gestión móvil PSR/OSR ✅ (CERRADO)

1. CreatePsrScreen con React Hook Form + Zod + date picker nativo ✅
2. Edición PSR/OSR con atomicidad transaccional ✅
3. Catálogos integrados (campañas, sedes, motivos) ✅

## HDT-007 — CRUD Usuarios Mobile ✅ (CERRADO)

1. CreateEditUserScreen (crear/editar usuarios) ✅
2. Permisos por rol (solo Super Admin edita Super Admin) ✅
3. Correcciones de autenticación (race condition en login, logout robusto) ✅

## HDT-008 — UX Desplegables, Catálogos en Tiempo Real y Referencias PSR/OSR ✅ (IMPLEMENTADO)

1. AppSelect reescrito con Portal + ScrollView completo (opciones nunca detrás de la barra de acciones) ✅
2. Catálogos en tiempo real (refetch silencioso en `useFocusEffect` + `onOpen`) ✅
3. Filtro de equipos por modo (`filterEquiposByMode`, oculta DEVUELTO en select/manage) ✅
4. Card PSR/OSR en EquipoDetail (backend `EquipoDTO.psrOsr` + `PsrOsrRefDTO`) ✅
5. Marca/Modelo/GRR en cards PSR/OSR (backend `PsrDTO.marca/modelo/grr`) ✅
6. Retroactividad validada en producción local (PSR existentes y `GET /equipos/6`) ✅
7. CRUD completo campañas mobile (Dialog + date picker nativo) ✅
8. Tab Catálogos con secciones + permisos por rol; CatalogScreen/RolesScreen con `headerRight` ✅

## HDT-009 — Teclado móvil no cubre los inputs (UX) ✅ (IMPLEMENTADO)

1. Componente `KeyboardAwareScrollView` (KeyboardAvoidingView + ScrollView) ✅
2. Migración de pantallas con inputs: Login, PasswordChange, CreateEditUser, CreatePsr, RegistrarAveria, AtenderAveria, Settings ✅
3. `EquipmentFormScreen` con `KeyboardAvoidingView` + footer sticky fuera del scroll ✅
4. Diálogos con inputs protegidos (Campanas, Catalog) ✅
5. Tests verdes: 38/38 (nuevo test del componente + corrección de `PasswordChangeScreen` y `AuthContext`) ✅

## HDT-010 — Usuarios Mobile: solo Nombre obligatorio y Ubicación desde Sedes ✅ (IMPLEMENTADO)

1. `CreateEditUserScreen` simplificado: solo Nombre, Rol y Ubicación (schema solo `nombre` obligatorio) ✅
2. Ubicación como `AppSelect` poblado con las Sedes activas ✅
3. Backend: crear usuario sin correo ni rol (rol "Usuario" por defecto), nombre obligatorio (400) ✅
4. Tests: `UsuarioServiceTest` 6/6 + `CreateEditUserScreen.test.js` 4 tests; suite Jest 42/42 ✅

## HDT-011 — Horómetro en Averías y Trazabilidad de Usuario (Auditoría) ✅ (IMPLEMENTADO)

1. Fix 409 devolución: `AveriaService` no revierte `OPERATIVO` si `fecha_devolucion` seteada; `ApiResponse.error` expone el mensaje real al cliente ✅
2. `filterEquiposByMode` (mobile) oculta equipos `DEVUELTO` en `select`/`manage` ✅
3. Horómetro en registro de avería (V22) + `AveriaService.crear` usa `fechaHoraAveria` del DTO (no siempre `now`) ✅
4. Horómetro al atender (V25): `AveriaService.actualizar` exige y valida `horometroAtencion >= horometro`, setea `fechaHoraAtencion`, calcula `diasInactividad` ✅
5. Mobile `AtenderAveriaScreen` (input horómetro atención + días inactivo) + Web `Averias.jsx` (columnas horómetro atención/días inactivo) ✅
6. Trazabilidad usuario JWT: 11 controllers inyectan `SecurityContext` y setean `usuarioCreacion`/`usuarioActualizacion` desde el token (no más fallback `1L` en flujo HTTP) ✅
7. `OsrRequest.usuarioCreacion` + `OsrService` lee de request (no hardcodea `1L`) ✅
8. Tests: `AveriaResourceTest` 3/3 + `EquipoResourceTest` 2/2 + `AveriaServiceTest` 12/12 + `DevolucionEquipoServiceTest` 7/7; suite backend 74/0 ✅
9. Migraciones soporte: V21 (evidencia horómetro inicial), V23 (superadmin protegido), V24 (backfill horómetro_inicio) ✅

## HDT-012 — UX Operativo, Evidencias, Contraseña 8 dígitos, PSR/OSR Finalizado y Sync Motivos→Tipos de Equipo ✅ (IMPLEMENTADO)

1. Identificadores normalizados a mayúsculas: número PSR (`CreatePsrScreen`), código/modelo/serie/guía y series de accesorios (`EquipmentFormScreen` + `toEquipmentPayload`) ✅
2. Layout de averías en detalle de equipo: fecha reporte → fecha atención + `Horómetro: reporte — atención` (`EquipoDetailScreen`) ✅
3. Fecha y hora de atención editable (`AtenderAveriaScreen` + `dateTime.js`) con validación backend: `400` si es anterior a la fecha de la avería (`AveriaService.validateFechaHoraAtencion`) ✅
4. Sync `motivos_psr → tipos_equipo` find-or-create solo en crear (`MotivoPsrService.sincronizarTipoEquipo` + `TipoEquipoRepository.findByNombre`); `nombre_corto` obligatorio en mobile ✅
5. Evidencias de ingreso ampliadas: 4 vistas (frontal, laterales, posterior) + extintor (`IngresoEquipoService`, `EquipmentPhotosScreen`, V28) ✅
6. Evidencias de devolución por accesorios: vistas + accesorios con los que ingresó el equipo (`DevolucionEquipoService.evidenciaRequerida`, `DevolucionEquipoScreen`, V27) ✅
7. Máximo 5 fotos por avería (V26, `AveriaService.MAX_FOTOS=5`); al atender: 2 evidencias obligatorias (horómetro de atención + evidencia del servicio) ✅
8. Contraseña de exactamente 8 dígitos (DNI): `ChangePasswordRequest @Pattern ^\d{8}$` + `LocalAuthService` + `PasswordChangeScreen`/`LoginScreen` (autofill `00000000` si `passwordResetRequired`) ✅
9. PSR/OSR finalizado read-only: `PsrDTO.finalizado` (equipo `DEVUELTO`), `PsrService` bloquea editar/eliminar con `409`, UI deshabilita botones ✅
10. Fix trigger Super Admin (V29): `RETURN OLD` en DELETE (antes `RETURN NEW` = NULL cancelaba el borrado de cualquier usuario); el seed sigue protegido con `RAISE EXCEPTION` ✅
11. Tests: backend 92/92 unit (excl. `MarcaResourceTest` @QuarkusTest que requiere BD viva) + mobile 77/77 Jest y ESLint limpio; E2E verificado (sync, delete usuarios, trigger) ✅

## Feature: Finalización del Servicio ✅ (COMPLETADO)

- Backend: al marcar `ATENDIDA`, restaura `equipo.estadoOperativo = "OPERATIVO"`
- Backend: removido `@Valid` del PUT para permitir actualizaciones parciales
- Mobile: AtenderAveriaScreen simplificado a 1 foto, botón "Finalizar Servicio"
- Mobile: foto se sube en submit junto con la atención
- Mobile: EquipoDetail muestra "Registrar Reparación" si `AVERIADO`, "Registrar Avería" si `OPERATIVO`
- Mobile: HomeScreen menú "Finalización del Servicio" filtra equipos AVERIADOS

## Extensiones realizadas (post-HDT-002)

- 14 componentes UI reutilizables ✅
- Sistema de tema (Design Tokens) ✅
- CRUD PSR/OSR mobile con date picker nativo ✅
- Catálogos integrados en mobile (sedes, motivos, campañas) ✅
- Desplegables AppSelect con Portal + ScrollView ✅
- Catálogos sincronizados en tiempo real entre dispositivos ✅
- Filtro de equipos por modo de navegación ✅
- Referencias PSR/OSR y Marca/Modelo/GRR retroactivas ✅
- CRUD completo campañas mobile + tab Catálogos con secciones y permisos ✅
- Teclado móvil no cubre inputs (`KeyboardAwareScrollView` en pantallas y diálogos) ✅
- Usuario mobile simplificado (solo Nombre obligatorio, Ubicación desde Sedes) ✅
- Horómetro en registro y atención de averías (V22/V25) + días de inactividad ✅
- Trazabilidad de `usuario_creacion`/`usuario_actualizacion` desde JWT en todos los CRUD ✅
- Super Admin protegido por trigger de BD (no eliminable, no cambiable de rol/estado) ✅
- Identificadores operativos en mayúsculas (número PSR, código, modelo, serie, guía) ✅
- Layout de averías en detalle (reporte→atención + horómetros) y fecha/hora de atención editable ✅
- Sync `motivos_psr → tipos_equipo` (find-or-create solo en crear) ✅
- Evidencias de ingreso (4 vistas + extintor) y de devolución por accesorios ✅
- Máximo 5 fotos por avería + 2 evidencias obligatorias al atender ✅
- Contraseña de exactamente 8 dígitos (DNI) en backend y mobile ✅
- PSR/OSR finalizado read-only (backend 409 + UI deshabilitada) ✅
- Fix trigger Super Admin (V29): permite borrar usuarios, el seed sigue protegido ✅

## Próximo foco

Evidencias Fotográficas (integración completa), Dashboard KPI, Reportes PDF, QA Integral, rebuild APK EAS Cloud, Firebase Crashlytics, fix preview foto Xiaomi/HyperOS.

---

# 18. Riesgos del Proyecto

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Cambios operativos no documentados | Alto | Validación por hito |
| Crecimiento no controlado de requerimientos | Alto | Backlog cerrado por MVP |
| Conectividad limitada en operación | Medio | Validación previa de red en campo |
| Cambios organizacionales | Medio | Roles configurables |
| Incremento futuro de módulos | Medio | Arquitectura modular |
| Retraso en módulos operativos | Alto | Priorizar HDT-002 inmediatamente |

---

# 19. Dependencias del Proyecto

El proyecto depende de:

- Infraestructura tecnológica.
- Accesos corporativos.
- Disponibilidad de usuarios operativos.
- Validaciones funcionales.
- Definición de formatos PDF.
- Definición final de campos obligatorios para evidencias.

---

# 20. Consideraciones Finales

PostgreSQL 18 queda establecido como base de datos oficial del proyecto.

HDT-002 (núcleo operativo) fue completado incluyendo extensiones mobile. El próximo avance debe enfocarse en evidencias fotográficas, dashboard KPI, reportes PDF, QA integral y build APK vía EAS Cloud.
