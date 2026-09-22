# SOFTWARE SPECIFICATION DOCUMENT
# Sistema de Control de Equipos de Apilamiento

---

# 1. Información General

| Campo | Detalle |
|---|---|
| Proyecto | Sistema de Control de Equipos de Apilamiento |
| Tipo de Sistema | Plataforma Full Stack Empresarial |
| Plataforma | Web SPA + Android APK |
| Backend | Quarkus Java |
| Base de Datos Oficial | PostgreSQL 18 |
| Versión Documento | 1.8 |
| Estado | En desarrollo — frontend web funcional, mobile Expo SDK 54, backend completo con todos los módulos operativos |
| Fecha | 2026-08-06 |
| Responsable | Jose Anyarin |

---

# 2. Objetivo del Sistema

Desarrollar una plataforma digital empresarial para el control operativo de equipos de apilamiento alquilados, permitiendo gestionar el ciclo completo de solicitud, asignación, operación, averías, devoluciones y evidencias fotográficas, garantizando trazabilidad, control de tiempos de inactividad y soporte documental para la validación operacional y financiera del servicio.

---

# 3. Alcance del Sistema

## 3.1 Incluye

- Aplicación móvil Android para operación en campo.
- Plataforma web para administración y gestión operativa.
- Backend API REST centralizado.
- Base de datos PostgreSQL 18.
- Gestión de usuarios y autenticación local con contraseña hasheada (BCrypt).
- Gestión de roles y permisos (Super Admin, Admin, Usuario).
- Gestión de sedes operativas.
- Gestión de campañas operativas.
- Registro manual de PSR y OSR.
- Gestión de proveedores.
- Gestión de marcas.
- Gestión de tipos de equipos.
- Registro de equipos alquilados.
- Registro de accesorios y componentes asociados.
- Registro y gestión de averías.
- Control de estados operativos de equipos.
- Registro de evidencias fotográficas.
- Generación de reportes PDF.
- Dashboard web con indicadores operativos.
- Historial operativo de equipos.
- Auditoría y trazabilidad de operaciones.
- Validaciones operativas en tiempo real.
- Mensajes visuales de confirmación, validación y error.

## 3.2 No Incluye

- Integración directa con NISIRA.
- Operación offline.
- Geolocalización.
- Telemetría en tiempo real.
- Integración ERP.
- Facturación electrónica.
- Workflow de aprobaciones.
- Notificaciones push.
- Integraciones con WhatsApp.
- Integraciones con correo automático.
- Gestión financiera.
- Módulo de mantenimiento predictivo.
- MySQL.

---

# 4. Decisión Técnica Oficial: PostgreSQL

PostgreSQL 18 queda definido como motor de base de datos oficial del proyecto.

Esta decisión está sincronizada con:

- `docker-compose.yml`, que levanta PostgreSQL 18.
- Backend Quarkus con driver `quarkus-jdbc-postgresql`.
- Migraciones Flyway.
- Scripts SQL compatibles con PostgreSQL.
- Persistencia de rutas de evidencias fotográficas en PostgreSQL.
- Timezone oficial `America/Lima`.

No se usará MySQL en este proyecto.

---

# 5. Actores del Sistema

| Actor | Descripción |
|---|---|
| Super Admin | Acceso total al sistema, administración de usuarios, roles, sedes, configuración global, reportes e indicadores. |
| Admin | Administración operativa del sistema, gestión de campañas, equipos, PSR/OSR, averías, catálogos y reportes. |
| Usuario | Responsable del registro operativo de equipos, averías, actualización de estados y evidencias fotográficas desde el aplicativo móvil. |

---

# 6. Roles y Permisos

| ID | Rol | Color | Estado |
|---|---|---|---|
| 1 | Super Admin | Verde | Implementado |
| 2 | Admin | Azul | Implementado |
| 3 | Usuario | Amarillo | Implementado |

---

# 7. Módulos del Sistema

| Código | Módulo | Descripción | Estado Actual |
|---|---|---|---|---|
| MOD-01 | Autenticación | Login local con selección de perfil, usuario y contraseña + cambio de contraseña obligatorio en primer ingreso | ✅ Validado |
| MOD-02 | Usuarios | Administración de usuarios, roles y accesos | ✅ Validado (backend + web + mobile CRUD) |
| MOD-03 | Sedes | Gestión de sedes operativas | ✅ Validado (backend + web + mobile CRUD) |
| MOD-04 | Campañas | Gestión de campañas operativas | ✅ Validado (backend + web + mobile CRUD) |
| MOD-05 | PSR / OSR | Registro y control documental | ✅ Validado (backend + web + mobile CRUD con CreatePsrScreen) |
| MOD-06 | Equipos | Gestión operativa de equipos alquilados | ✅ Validado (backend + web + mobile CRUD) |
| MOD-07 | Tipos de Equipos | Administración de categorías y tipos | ✅ Validado (backend + web + mobile CRUD) |
| MOD-08 | Proveedores | Gestión de proveedores | ✅ Validado (backend + web + mobile CRUD) |
| MOD-09 | Averías | Registro, seguimiento y atención de averías | ✅ Validado (backend + web + mobile). Incluye Finalización del Servicio con restauración de estado operativo del equipo |
| MOD-10 | Evidencias Fotográficas | Gestión de fotografías asociadas | ⏳ Parcial (1 foto en atención de avería). Pendiente integración completa |
| MOD-11 | Dashboard KPI | Indicadores operativos | ⏳ Pendiente |
| MOD-12 | Reportes PDF | Generación y exportación PDF | ⏳ Pendiente |
| MOD-13 | Auditoría | Trazabilidad de eventos | ✅ Validado (tablas V10-V11, backend package audit/, mobile screen) |
| MOD-14 | Catálogos | Datos maestros auxiliares | ✅ Validado (mobile con CatalogScreen genérico) |
| MOD-15 | Configuración | Parámetros generales | ✅ Validado (mobile SettingsScreen con URL configurable) |
| MOD-16 | Mobile App | Aplicación Android operativa (Expo SDK 54) | ✅ Validado — 19+ pantallas, navegación completa, CRUDs operativos, tema MD3 |

---

# 8. Estado Funcional Actual

## Implementado y validado

- Infraestructura Docker.
- PostgreSQL 18.
- Backend Quarkus base.
- Nginx reverse proxy.
- Frontend web base.
- Autenticación local con BCrypt (login por selección de perfil → usuario → contraseña).
- Cambio de contraseña obligatorio en primer ingreso (password por defecto → DNI/00000000).
- JWT propio.
- Roles (backend + web + mobile CRUD).
- Usuarios (seed local con datos de prueba, CRUD mobile con permisos por rol).
- Sedes (backend + web + mobile CRUD).
- Campañas (backend + web + mobile con activar/cerrar).
- Mobile login local.
- APK inicial validado (Expo SDK 54, EAS Cloud).
- Menú principal post-login con 5 botones según perfil.
- Tipos de equipo (backend + web + mobile CRUD).
- Proveedores (backend + web + mobile CRUD).
- Marcas (backend + web + mobile CRUD).
- Equipos (backend + web + mobile CRUD + detalle).
- PSR / OSR (backend + web + mobile CRUD con CreatePsrScreen con date picker nativo + Zod).
- Averías (backend + web + mobile: registrar, atender con foto).
- **Finalización del Servicio**: al atender una avería, el equipo restaura su `estadoOperativo = "OPERATIVO"`. Mobile: 1 foto, botón "Finalizar Servicio".
- Auditoría operacional (tablas V10-V11, backend package audit/, mobile screen).
- Configuración mobile (URL API configurable en runtime).
- CatalogScreen genérico para CRUD de catálogos mobile.
- Componentes UI reutilizables mobile (14 componentes).
- Sistema de tema MD3 con design tokens.
- Navegación mobile completa (AuthStack + MainStack + BottomTabs con 4 tabs).
- Tests backend (7 archivos JUnit/Mockito), frontend web (2), mobile (3).
- CI/CD GitHub Actions.
- Modo claro/oscuro frontend web.
- **Desplegables AppSelect con Portal + ScrollView completo** (opciones nunca quedan detrás de la barra de acciones).
- **Catálogos en tiempo real**: refetch silencioso al enfocar pantallas y al abrir desplegables (lo creado por un admin se ve en el otro dispositivo sin reiniciar).
- **Filtro de equipos por modo de navegación** (`filterEquiposByMode`): oculta equipos `DEVUELTO` en modos selección/gestión.
- **Referencias PSR/OSR en detalle de equipo** (card PSR/OSR con PSR, OSR, sede y campaña) y **Marca|Modelo|GRR en cards PSR/OSR** — retroactivo sobre los datos existentes.
- CRUD completo de campañas en mobile (crear/editar con dialog + date picker nativo).
- Tab Catálogos mobile agrupado por secciones (Catálogos/Operación/Administración/Sistema) y oculto para rol Usuario.

## Pendiente

- Evidencias fotográficas (integración completa).
- Reportes PDF.
- Dashboard KPI.
- QA Integral.
- Firebase Crashlytics.
- Build APK producción.

---

# 9. Entidades Principales Implementadas

- `dim_roles`
- `dim_usuarios`
- `dim_sedes`
- `dim_campanas`
- `dim_tipos_equipo`
- `dim_proveedores`
- `dim_marcas`
- `fac_equipos`
- `fac_psr`
- `fac_osr`
- `fac_averias`
- `fac_evidencias`
- `auditoria_eventos`
- `login_local` (tabla de autenticación local V8)
- `auditoria_tipos` (catálogo de tipos de eventos V11)

---

# 10. Reglas de Negocio Principales

- El acceso se realiza mediante autenticación local con selección de perfil y usuario.
- El usuario debe estar registrado y activo en la plataforma.
- La contraseña por defecto es "12345" y debe cambiarse en el primer ingreso.
- La nueva contraseña debe ser el número de DNI del usuario.
- Solo una campaña puede estar activa a la vez.
- PSR y OSR se registran manualmente tomando como referencia la información proveniente de NISIRA.
- No existe integración directa con NISIRA.
- Cada equipo debe tener proveedor obligatorio.
- Cada equipo debe tener número de serie único.
- Cada equipo debe tener código interno único.
- Los estados operativos de equipo son: `OPERATIVO` y `AVERIADO`.
- Un equipo en estado `AVERIADO` no permite registrar una nueva avería hasta que sea atendido.
- Al atender una avería (marcar `ATENDIDA`), el equipo se restaura automáticamente a `OPERATIVO`.
- Un equipo con historial no debe eliminarse físicamente.
- Las evidencias fotográficas son obligatorias para ingreso y devolución de equipos.
- Las averías deben registrar fecha/hora de reporte y fecha/hora de atención.
- El tiempo de inactividad se calcula en días calendario.
- La información operacional debe mantener trazabilidad histórica.
- PostgreSQL es la base de datos oficial.

---

# 11. Flujos Operativos Implementados

1. ✅ Login local (seleccionar perfil → seleccionar usuario → ingresar contraseña).
2. ✅ Cambio de contraseña obligatorio en primer ingreso (password por defecto → DNI/00000000).
3. ✅ Validación de usuario autorizado + menú principal con 5 botones según perfil.
4. ✅ Gestión de campaña activa.
5. ✅ Registro de PSR y OSR (mobile con date picker nativo + Zod).
6. ✅ CRUD de proveedores, marcas y tipos de equipo.
7. ✅ Registro de equipos (CRUD completo).
8. ✅ Registro de avería (mobile con 2 fotos).
9. ✅ Atención de avería (mobile con 1 foto, acción realizada).
10. ✅ Finalización del Servicio: restaura `estadoOperativo = "OPERATIVO"` al atender.
11. ✅ Cálculo automático de tiempo inactivo (días calendario).
12. ✅ Consulta de historial de equipos.
13. ✅ Auditoría de eventos (backend + mobile).
14. ⏳ Registro de evidencias de devolución.
15. ⏳ Generación de PDF.
16. ⏳ Dashboard de indicadores KPI.

---

# 12. Punto Crítico de Desarrollo

HDT-002 (Núcleo Operativo) fue completado: tipos de equipo, proveedores, marcas, equipos, PSR/OSR, averías — todo implementado en backend, web y mobile.

HDT-003 (Calidad, Despliegue y Auditoría) completado: tests, CI/CD, auditoría, modo claro/oscuro.

HDT-004 (Pantallas Mobile Faltantes) completado: catálogos mobile, configuración, auditoría screen.

HDT-006 (Gestión móvil PSR/OSR) completado: CreatePsrScreen con date picker nativo + Zod.

HDT-007 (CRUD Usuarios Mobile) completado: CreateEditUserScreen con permisos por rol.

HDT-008 (UX Desplegables, Catálogos en Tiempo Real y Referencias PSR/OSR) completado: AppSelect con Portal + ScrollView completo, catálogos sincronizados en tiempo real entre dispositivos, filtro DEVUELTO por modo, card PSR/OSR en detalle de equipo, línea Marca|Modelo|GRR en PSR/OSR (retroactivo), CRUD completo de campañas mobile y tab Catálogos con secciones y permisos.

HDT-009 (Teclado móvil no cubre los inputs - UX) completado: componente `KeyboardAwareScrollView` (KeyboardAvoidingView + ScrollView) aplicado a Login, PasswordChange, CreateEditUser, CreatePsr, RegistrarAveria, AtenderAveria y Settings; `EquipmentFormScreen` con KeyboardAvoidingView + footer sticky; diálogos de Campanas y Catalog protegidos; suite Jest 38/38 (con corrección de tests pre-existentes `PasswordChangeScreen` y `AuthContext`).

HDT-010 (Usuarios Mobile simplificado) completado: `CreateEditUserScreen` solo con Nombre, Rol y Ubicación (schema Zod solo exige `nombre`); Ubicación como desplegable con las Sedes activas; backend crea usuarios sin correo ni rol (asigna rol "Usuario" por defecto) y rechaza con 400 si falta el nombre. Tests: `UsuarioServiceTest` 6/6 y `CreateEditUserScreen.test.js` 4 casos; suite Jest 42/42; API validada en producción local Docker.

HDT-011 (Horómetro en Averías y Trazabilidad de Usuario) completado: fix del 409 al devolver (no se revierte el estado `OPERATIVO` si el equipo ya fue devuelto), registro del horómetro al reportar (V22) y al atender (V25) una avería con cálculo de días de inactividad (`AveriaService`, `AtenderAveriaScreen` mobile, `Averias.jsx` web), y trazabilidad de `usuario_creacion`/`usuario_actualizacion` desde el JWT en 11 controllers (Equipo, Avería, Campana, Marca, MotivoPsr, Proveedor, Rol, Sede, TipoEquipo, Usuario, PSR/OSR). `ApiResponse` ahora expone el campo `error` con el mensaje real del backend. Migraciones V21–V25 aplicadas (incluye trigger de protección del Super Admin). Tests: `AveriaServiceTest` 12/12, `AveriaResourceTest` 3/3, `EquipoResourceTest` 2/2, `DevolucionEquipoServiceTest` 7/7; suite backend 74 tests 0 fallos; validación E2E en producción local Docker.

**Feature Finalización del Servicio** completado: backend restaura estado operativo, mobile con foto + botón "Finalizar Servicio".

**Próximo foco:** Evidencias fotográficas completas, Dashboard KPI, Reportes PDF, QA Integral, rebuild APK EAS Cloud, Firebase Crashlytics.

---

# 13. Consideraciones Técnicas

- Backend: Quarkus Java 3.14.4.
- Base de datos: PostgreSQL 18.
- Persistencia: Hibernate ORM Panache.
- Migraciones: Flyway (V1-V11).
- Seguridad: JWT propio + BCrypt para hash de contraseñas.
- Frontend web: React 18 + Vite 5 + MUI 6.
- Mobile: Expo React Native SDK ~54.0.35 (NO React Native CLI).
- UI Mobile: react-native-paper (MD3).
- Formularios mobile: React Hook Form + Zod.
- Navegación mobile: React Navigation (NativeStackNavigator + BottomTabNavigator).
- Proxy: Nginx.
- Contenedores: Docker Compose.
- Archivos: filesystem controlado con rutas en PostgreSQL.
- Timezone: America/Lima.
- Build APK: EAS Cloud (no local por restricción Sophos).

---

# 14. Pendientes Funcionales

- Evidencias fotográficas: integración completa (ingreso/devolución de equipos).
- Reportes PDF (iText PDF).
- Dashboard KPI.
- QA Integral.
- Firebase Crashlytics.
- Rebuild APK producción (AAB).
- Fix de preview fotográfica en dispositivo Xiaomi/HyperOS.

---

# 15. Configuración de Red y Puertos — Congelada

La siguiente configuración de infraestructura está validada y funcionando. NO MODIFICAR sin autorización expresa del arquitecto validada por auditoría.

## 15.1 Mapa de Puertos Docker

| Servicio | Puerto Host | Puerto Contenedor | Protocolo | Uso |
|---|---|---|---|---|
| Nginx (Frontend + Proxy) | 6110 | 80 | HTTP | Frontend SPA + Proxy API |
| Nginx (HTTPS futuro) | 443 | 443 | HTTPS | Reservado para SSL |
| Backend Quarkus | 6111 | 6111 | HTTP | API REST |
| PostgreSQL 18 | 6112 | 5432 | TCP | Base de datos (Host:6112 para evitar conflicto con PostgreSQL local en 5432) |

## 15.2 URLs de Acceso

| Servicio | URL | Descripción |
|---|---|---|
| Frontend Web (SPA) | `http://localhost:6110/` | Aplicación React con ruteo client-side |
| API Backend | `http://localhost:6110/api/v1/` | Proxy inverso Nginx → backend:6111 |
| Health Check | `http://localhost:6110/health` | Estado del backend Quarkus |
| Swagger UI | `http://localhost:6110/swagger` | Documentación OpenAPI |
| Conexión DB (externo) | `localhost:6112` | Clientes externos (VS Code, DBeaver, pgAdmin) |
| Conexión DB (Docker) | `postgres:5432` | Red interna Docker entre contenedores |

## 15.3 Cadena de Conexión a Base de Datos

| Contexto | Cadena |
|---|---|
| Backend (Docker) | `jdbc:postgresql://postgres:5432/repo_control_equipos_apilamiento` |
| Backend (dev local) | `jdbc:postgresql://localhost:5432/repo_control_equipos_apilamiento` |
| Cliente externo | `jdbc:postgresql://localhost:6112/repo_control_equipos_apilamiento` |

## 15.4 Configuración Mobile (APK)

| Parámetro | Valor | Dónde se define |
|---|---|---|
| API URL (LAN) | `http://10.13.18.168:6111/api/v1` | `mobile/src/api.js:6` |
| API URL (debug) | `http://127.0.0.1:6111/api/v1` | `mobile/src/api.js:7` |
| Almacenamiento de token | `react-native-keychain` (SecureStore) | `mobile/src/api.js` |
| Timeout de API | 15000ms | `mobile/src/api.js:53` |

## 15.5 Configuración Backend

| Parámetro | Valor |
|---|---|
| Puerto HTTP | 6111 |
| Host | `0.0.0.0` |
| API Base Path | `/api/v1` |
| JWT Expiración | 28800s (8h) |
| Timezone | `America/Lima` |
| Tamaño máximo body | 10MB |
| Pool conexiones DB | min:2, max:20 |

## 15.6 Nombres de Contenedores

| Contenedor | Imagen | Puerto Expuesto |
|---|---|---|
| `apilamiento-nginx` | `nginx:alpine` (build local) | 6110, 443 |
| `apilamiento-backend` | `quarkus:3.14` (build local) | 6111 |
| `apilamiento-postgres` | `postgres:18` | 6112 → 5432 |

## 15.7 Dependencias de Orquestación

```
postgres (healthcheck) → backend → nginx
```

---

# 16. Cierre

Este documento queda sincronizado con el estado actual del repositorio y establece PostgreSQL 18 como base de datos oficial del sistema. La configuración de puertos, conexiones y URLs queda documentada y congelada en la sección 15.
