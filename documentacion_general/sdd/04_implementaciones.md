# SOFTWARE DEVELOPMENT DOCUMENT (SDD)
# 04_IMPLEMENTATION.md

---

# 1. Control Documental

| Campo | Valor |
|---|---|
| Documento | 04_IMPLEMENTATION.md |
| Proyecto | Sistema de Control Operativo de Equipos de Apilamiento |
| Estado | En desarrollo sincronizado con repositorio |
| Versión | 1.6 |
| Fecha | 2026-08-06 |
| Responsable | Jose Anyarin |
| Base de Datos Oficial | PostgreSQL 18 |

---

# 2. Decisión Técnica Oficial

PostgreSQL 18 queda definido como motor oficial de base de datos del proyecto.

Esta decisión está alineada con el estado actual del repositorio:

- Docker Compose usa PostgreSQL.
- Backend Quarkus usa driver PostgreSQL.
- Las migraciones se gestionan con Flyway.
- La persistencia relacional se implementa con Hibernate ORM Panache.
- El timezone operativo oficial es America/Lima.
- Las evidencias fotográficas usarán filesystem y rutas persistidas en PostgreSQL.

No se usará MySQL en este proyecto.

---

# 3. Arquitectura Consolidada

| Capa | Tecnología |
|---|---|
| Frontend Web | React 18, Vite, MUI |
| Frontend Mobile | Expo React Native SDK ~54.0.35 (NO migrado a CLI) |
| Backend | Quarkus Java 3.14.4 |
| API | REST versionada en /api/v1 |
| Seguridad | JWT propio + BCrypt |
| Base de Datos | PostgreSQL 18 |
| Migraciones | Flyway |
| Proxy | Nginx |
| Contenedores | Docker Compose |

---

# 4. Módulos Implementados

| Módulo | Estado |
|---|---|---|
| Autenticación local BCrypt | ✅ Validado |
| JWT propio | ✅ Validado |
| Usuarios (seed local + CRUD mobile con permisos) | ✅ Validado |
| Roles (Service + DTO + Mapper + CRUD mobile) | ✅ Validado |
| Sedes | ✅ Validado (mobile + web CRUD) |
| Campañas | ✅ Validado (mobile + web + activar/cerrar) |
| PSR / OSR | ✅ Validado (CRUD mobile + web + CreatePsrScreen con date picker) |
| Equipos | ✅ Validado (mobile + web + detalle con botón dinámico) |
| Tipos de Equipo | ✅ Validado (mobile + web CRUD) |
| Proveedores | ✅ Validado (mobile + web CRUD) |
| Marcas | ✅ Validado (mobile + web CRUD) |
| Averías | ✅ Validado (mobile + web + Finalización del Servicio) |
| Auditoría (backend audit/ + mobile screen + V10-V11) | ✅ Validado |
| Configuración (mobile SettingsScreen URL) | ✅ Validado |
| Frontend web (Nginx) | ✅ Validado |
| Mobile login local | ✅ Validado |
| APK inicial (Expo SDK 54, EAS Cloud) | ✅ Validado |
| Docker + PostgreSQL + Nginx | ✅ Validado |
| Migración V8: login_local | ✅ Validado |
| Migración V9: seed_usuarios_local | ✅ Validado |
| Migraciones V10-V11: auditoría | ✅ Validado |
| Componentes UI reutilizables mobile (14) | ✅ Validado |
| Sistema de tema mobile (Design Tokens + MD3) | ✅ Validado |
| Pantalla PSR/OSR mobile (listado + editar) | ✅ Validado |
| Pantalla crear PSR mobile (React Hook Form + Zod + date picker) | ✅ Validado |
| Pantallas catálogos mobile (CatalogScreen genérico) | ✅ Validado |
| Pantalla auditoría mobile | ✅ Validado |
| Pantalla configuración mobile | ✅ Validado |
| CreateEditUserScreen mobile (CRUD usuarios con permisos) | ✅ Validado |
| Finalización del Servicio (backend + mobile) | ✅ Validado |
| Navegación mobile (AuthStack + MainStack + BottomTabs 4 tabs) | ✅ Validado |
| Tests backend (7), web (2), mobile (3) | ✅ Validado |
| CI/CD GitHub Actions | ✅ Validado |
| Modo claro/oscuro frontend web | ✅ Validado |
| AppSelect con Portal + ScrollView completo (onOpen refetch) | ✅ Validado |
| Catálogos en tiempo real (refetch silencioso en focus + onOpen) | ✅ Validado |
| Filtro de equipos por modo (filterEquiposByMode, oculta DEVUELTO) | ✅ Validado |
| Card PSR/OSR en detalle de equipo (EquipoDTO.psrOsr) | ✅ Validado |
| Marca/Modelo/GRR en cards PSR/OSR (PsrDTO.marca/modelo/grr) | ✅ Validado |
| CRUD completo campañas mobile (Dialog + date picker) | ✅ Validado |
| Tab Catálogos con secciones + permisos por rol | ✅ Validado |
| Backend rebuild Docker + verificación retroactiva | ✅ Validado |

---

# 5. Módulos Pendientes

| Módulo | Prioridad |
|---|---|---|
| Evidencias Fotográficas (integración completa ingreso/devolución) | Pendiente |
| Dashboard KPI | Pendiente |
| Reportes PDF | Pendiente |
| QA Integral | Pendiente |
| Firebase Crashlytics | Pendiente |
| Build APK producción (AAB) | Pendiente |
| Fix preview foto Xiaomi/HyperOS | Pendiente |

---

# 6. Convenciones PostgreSQL

| Tipo de tabla | Prefijo | Ejemplo |
|---|---|---|
| Catálogo | dim_ | dim_proveedores |
| Operación | fac_ | fac_equipos |
| Auditoría | auditoria_ | auditoria_eventos |

Tablas esperadas para el núcleo operativo:

- dim_tipos_equipo
- dim_proveedores
- dim_marcas
- fac_equipos
- fac_psr
- fac_osr
- fac_averias
- fac_evidencias
- auditoria_eventos

---

# 7. Flujo de Autenticación Local

## 7.1 Login

1. El usuario selecciona su perfil en un dropdown (Super Admin / Admin / Usuario).
2. El sistema filtra y muestra los usuarios según el perfil seleccionado.
3. El usuario selecciona su nombre.
4. El usuario ingresa su contraseña (por defecto "12345").
5. El backend valida la contraseña contra el hash BCrypt almacenado.
6. Si es correcto, retorna un JWT + indicador `passwordResetRequired`.

## 7.2 Cambio de Contraseña Obligatorio

1. Si `passwordResetRequired = true`, se redirige a la pantalla de cambio de contraseña.
2. El usuario debe ingresar su DNI como nueva contraseña (mínimo 6 caracteres).
3. El backend hashea la nueva contraseña con BCrypt y actualiza el registro.
4. Se genera un nuevo JWT con `passwordResetRequired = false`.

## 7.3 Menú Principal Post-Login

Según el perfil del usuario, se muestran hasta 5 botones:

| Botón | Perfiles | Pantalla destino |
|---|---|---|---|
| Ingreso de PSR y OSR | Super Admin, Admin | PsrOsrScreen |
| Ingreso de Equipo | Super Admin, Admin, Usuario | EquiposList (todos) |
| Registro de Avería | Super Admin, Admin, Usuario | EquiposList (todos) |
| Detalles de Equipo | Super Admin, Admin, Usuario | EquiposList (todos) |
| Finalización del Servicio | Super Admin, Admin, Usuario | EquiposList (filtro AVERIADO) → EquipoDetail → AtenderAveria |

---

# 8. HDT-002 — Núcleo Operativo (COMPLETADO ✅)

El núcleo operativo fue completado incluyendo todos los catálogos, entidades operativas y pantallas mobile/web.

Extensiones post-HDT-002:
- 14 componentes UI reutilizables mobile
- Sistema de tema MD3 con design tokens
- CRUD PSR/OSR con date picker nativo y catálogos integrados
- HDT-004: Catálogos, roles, usuarios, auditoría, settings screens mobile
- HDT-006: CreatePsrScreen con React Hook Form + Zod + date picker
- HDT-007: CreateEditUserScreen con permisos por rol
- Finalización del Servicio (backend + mobile)

---

# 9. Módulo PSR/OSR Mobile (2026-07-24)

## 9.1 Pantallas Implementadas

| Pantalla | Archivo | Funcionalidad |
|---|---|---|
| Listado PSR/OSR | `mobile/src/screens/PsrOsrScreen.js` | Tabla con scroll, botón + crear, lápiz editar, filtros por campaña |
| Crear/Editar PSR | `mobile/src/screens/CreatePsrScreen.js` | Formulario React Hook Form + Zod, date picker nativo, catálogos embebidos |

## 9.2 Formulario CreatePsrScreen

**Tecnologías usadas:**
- React Hook Form (`useForm`) para manejo de formulario
- Zod (`z.object`) para validación de esquema
- `@react-native-community/datetimepicker` para selección de fecha nativa
- Navigation params para modo creación vs edición

**Campos del formulario:**
| Campo | Tipo | Validación | Fuente de datos |
|---|---|---|---|
| Campaña | Select (Picker) | Requerido | API `/campanas` (autodetecta activa) |
| Sede | Select | Requerido | API `/sedes` |
| Fecha de ingreso | DatePicker | Requerido, no futuro | Nativo Android/iOS |
| Mes de ingreso | Select (meses) | Requerido | Generado desde fecha |
| Año de ingreso | Select (años) | Requerido | Generado desde fecha |
| Motivo de PSR | Select | Requerido | API `/motivos-psr` |
| Observación | TextInput multilinea | Opcional, máx. 500 chars | — |

**Formato de fechas:**
- Display: `dd/MM/yyyy`
- Envío API: `yyyy-MM-dd`
- Calculan automáticamente mes y año al seleccionar fecha

## 9.3 Integración con API

| Acción | Método | Endpoint | Códigos |
|---|---|---|---|
| Listar PSR | GET | `/api/v1/psr` | 200 OK |
| Crear PSR | POST | `/api/v1/psr` | 201 Created |
| Editar PSR | PUT | `/api/v1/psr/{id}` | 200 OK |
| Obtener catálogos | GET | `/api/v1/sedes`, `/api/v1/campanas`, `/api/v1/motivos-psr` | 200 OK |

## 9.4 Navegación

- Botón `+` en `headerRight` de PsrOsrScreen → navega a CreatePsr con `mode='create'`
- Botón lápiz en cada fila → navega a CreatePsr con `mode='edit'` y datos precargados
- Submit exitoso → `navigation.goBack()` retorna al listado
- Título dinámico: "Crear PSR" o "Editar PSR"

---

# 10. Criterios de Implementación

Cada módulo debe incluir:

- Entity.
- Repository.
- Service.
- Resource REST.
- DTOs.
- Mapper.
- Validaciones.
- Migración Flyway.
- Restricciones PostgreSQL.
- Pantalla web CRUD cuando aplique.

---

# 11. Frontend Web — Acceso y Diagnóstico

## 11.1 Acceso

El frontend web se sirve a través de Nginx (contenedor `apilamiento-nginx`) en las siguientes URLs:

| Servicio | URL | Descripción |
|---|---|---|
| Frontend (SPA) | `http://localhost:6110/` | Aplicación React (ruteo client-side) |
| API Backend | `http://localhost:6110/api/v1/` | Proxy inverso hacia backend:6111 |
| Health Check | `http://localhost:6110/health` | Estado del backend |
| Swagger UI | `http://localhost:6110/swagger` | Documentación OpenAPI |

**Nota:** El frontend usa `BrowserRouter` de React Router v6. No hay soporte HTTPS configurado en Nginx. Usar siempre `http://localhost`.

## 11.2 Stack de Contenedores

| Contenedor | Puerto Host | Puerto Contenedor | Estado |
|---|---|---|---|
| `apilamiento-nginx` | 6110 / 443 | 80 / 443 | Sirve SPA + proxy API |
| `apilamiento-backend` | 6111 | 6111 | API Quarkus |
| `apilamiento-postgres` | 6112 | 5432 | PostgreSQL 18 |

## 11.3 Diagnóstico Aplicado (2026-07-21)

**Síntoma reportado:** Servicios Docker levantados pero frontend web no visible.

**Diagnóstico:**
1. Todos los contenedores estaban en ejecución (`docker ps`).
2. Nginx servía correctamente el HTML (`curl http://localhost/` → 200).
3. Los assets JS/CSS se servían correctamente (HTTP 200).
4. La API respondía correctamente a través del proxy (`/api/v1/auth/roles` → datos).

**Causa raíz:** La imagen Docker del frontend (`apilamiento-nginx`) fue construida sin un archivo `.dockerignore`, lo que provocaba dos problemas:
- El contexto de build incluía `node_modules` (~128 MB), ralentizando el build.
- Los `node_modules` del host Windows se copiaban dentro del builder Alpine, potencialmente causando conflictos con binarios nativos de plataforma.

**Solución aplicada:**
1. Se creó `frontend/.dockerignore` excluyendo `node_modules`, `dist`, `.git`, `__tests__` y archivos markdown.
2. Se reconstruyó la imagen con `docker compose build --no-cache nginx`.
3. Se recreó el contenedor con `docker compose up -d --force-recreate nginx`.
4. Se verificó que el frontend responde correctamente (todos los endpoints 200 OK).

**Comando para reconstruir el frontend tras cambios:**
```bash
docker compose build nginx
docker compose up -d --force-recreate nginx
```

---

# 12. Configuración Operativa Congelada

La siguiente configuración de infraestructura está validada y en funcionamiento. NO MODIFICAR.

## 12.1 Mapa de Puertos Docker (HOST → Contenedor)

| Servicio | Puerto Host | Puerto Contenedor | Protocolo |
|---|---|---|---|
| Nginx (Frontend + Proxy) | 6110 | 80 | HTTP |
| Nginx (HTTPS futuro) | 443 | 443 | HTTPS |
| Backend Quarkus | 6111 | 6111 | HTTP |
| PostgreSQL 18 | 6112 | 5432 | TCP |

## 12.2 URLs de Acceso (Entorno Local Docker)

| Servicio | URL |
|---|---|
| Frontend Web (SPA) | `http://localhost/` |
| API Backend | `http://localhost/api/v1/` |
| Health Check | `http://localhost/health` |
| Swagger UI | `http://localhost/swagger` |
| Swagger JSON | `http://localhost/q/openapi` |
| Conexión DB (externo) | `localhost:6112` |
| Conexión DB (Docker) | `postgres:5432` |

## 12.3 Cadena de Conexión a Base de Datos

| Contexto | Cadena |
|---|---|
| Backend (Docker) | `jdbc:postgresql://postgres:5432/repo_control_equipos_apilamiento` |
| Backend (dev local) | `jdbc:postgresql://localhost:5432/repo_control_equipos_apilamiento` |
| Cliente externo | `jdbc:postgresql://localhost:6112/repo_control_equipos_apilamiento` |

## 12.4 Configuración Mobile (APK)

| Parámetro | Valor |
|---|---|
| Framework | Expo React Native SDK ~54.0.35 (NO migrado a CLI — se mantiene Expo) |
| API URL (LAN) | `http://10.13.18.168:6111/api/v1` |
| API URL (debug) | `http://127.0.0.1:6111/api/v1` |
| Almacenamiento de token | `react-native-keychain` (Keychain/secure storage) |
| Timeout de API | 15000ms |
| Navegación | React Navigation 7 (NativeStackNavigator + BottomTabNavigator) |
| Formularios | React Hook Form + Zod + `@react-native-community/datetimepicker` |
| UI Components | 14 componentes reutilizables + sistema de tema (design tokens) |
| Theme | MD3 con claro/oscuro + modo Vanguard |
| Pantallas totales | 19 (login, home, equipos, PSR/OSR, averías, perfil, etc.) |
| Build local | Bloqueado por Sophos Endpoint (sin permisos admin). Usar EAS Cloud |

## 12.5 Configuración Backend

| Parámetro | Valor |
|---|---|
| Puerto HTTP | 6111 |
| Host | `0.0.0.0` |
| API Base Path | `/api/v1` |
| JWT Expiración | 28800s (8h) |
| Timezone | `America/Lima` |
| Tamaño máximo body | 10MB |
| Pool conexiones DB | min:2, max:20 |

## 12.6 Nombres de Contenedores

| Contenedor | Imagen |
|---|---|
| `apilamiento-nginx` | `nginx:alpine` (build local) |
| `apilamiento-backend` | `quarkus:3.14` (build local) |
| `apilamiento-postgres` | `postgres:18` |

## 12.7 Dependencias de Orquestación

```
postgres (healthcheck) → backend → nginx
```

---

# 13. Módulo Finalización del Servicio (2026-07-30)

## 13.1 Objetivo

Implementar el flujo completo de atención de averías: al marcar una avería como `ATENDIDA`, el equipo asociado debe restaurar su `estadoOperativo` a `OPERATIVO`, registrar la acción realizada, la fecha/hora de atención y los días de inactividad. Adicionalmente, la pantalla mobile debe permitir tomar 1 foto como evidencia y subirla al finalizar.

## 13.2 Problema Resuelto

Anteriormente, al atender una avería en mobile (`AtenderAveriaScreen`), el backend solo actualizaba el estado de la avería pero **no restauraba el estado operativo del equipo**. El equipo quedaba en `AVERIADO` incluso después de haber sido reparado. Esto impedía registrar una nueva avería sobre el mismo equipo.

Además, el endpoint `PUT /averias/{id}` tenía `@Valid` que forzaba `@NotNull equipoId` y `@NotBlank descripcionFalla` en toda actualización, incluso en actualizaciones parciales como la atención donde solo se envía `estadoAveria` y `accionRealizada`.

## 13.3 Backend — Capas Modificadas

### 13.3.1 AveriaService.java

| Método | Cambio |
|---|---|
| `actualizar(id, dto)` | Cuando `dto.estadoAveria == "ATENDIDA"`, además restaura `equipo.estadoOperativo = "OPERATIVO"` dentro de la misma transacción `@Transactional`. Calcula automáticamente `fechaHoraAtencion` (hora actual) y `diasInactividad` (diferencia entre fecha de atención y fecha de avería). |

### 13.3.2 AveriaResource.java

| Método | Cambio |
|---|---|
| `actualizar(id, dto)` | Removido `@Valid` del parámetro para permitir actualizaciones parciales. El service maneja nulos adecuadamente. |

### 13.3.3 Flujo Backend

```
PUT /averias/{id} { estadoAveria: "ATENDIDA", accionRealizada: "..." }
  → Service.actualizar()
    → Calcula fechaHoraAtencion = now
    → Calcula diasInactividad = diff(fechaHoraAtencion - fechaHoraAveria)
    → Actualiza avería
    → equipo.estadoOperativo = "OPERATIVO"
    → equipo.fechaActualizacion = now
    → Commit transaccional
```

## 13.4 Mobile — Pantallas Modificadas

### 13.4.1 AtenderAveriaScreen.js — Simplificación y Correcciones

| Aspecto | Antes | Después |
|---|---|---|
| Fotos solicitadas | 3 fotos | 1 foto (Evidencia) |
| Botón foto | Siempre "Tomar foto" | "Tomar foto" / "Cambiar foto" según estado |
| Texto botón submit | "Guardar Reparacición" | "Finalizar Servicio" |
| Preview de foto | Usaba URI copiada a caché con `ReactNativeBlobUtil.fs.cp()` | Usa `asset.uri` directo (mismo patrón que RegistrarAveriaScreen) |
| Upload de foto | Inmediato al tomar foto | Al hacer submit con "Finalizar Servicio" |
| Estado de foto | `evidencias` integrado con datos del servidor | `localPhotoUri` separado del servidor |
| Dependencias | `ReactNativeBlobUtil`, `loadApiUrl`, `getToken`, `ZoomableImage`, Modal viewer | Solo `api` y componentes básicos |

**Estructura actual de la pantalla:**
1. InfoCard: descripción, fecha, estado de la avería
2. PhotoCard: 1 slot con preview local + botón "Tomar foto"/"Cambiar foto"
3. FormCard: campo "Acción realizada" (React Hook Form + Zod, min 10 caracteres) + botón "Finalizar Servicio"
4. Submit: sube la foto (si existe) vía `PUT /averias/{id}/evidencias/1`, luego `PUT /averias/{id}` con `estadoAveria: "ATENDIDA"`, navega back

### 13.4.2 HomeScreen.js

| Cambio | Detalle |
|---|---|
| Menú "Finalización del Servicio" | Pasa `params: { filterEstado: 'AVERIADO' }` a `EquiposList` |

### 13.4.3 EquiposListScreen.js

| Cambio | Detalle |
|---|---|
| Filtro por estado | Lee `route.params?.filterEstado`. Si es `'AVERIADO'` usa endpoint `/equipos/por-estado/AVERIADO` |

### 13.4.4 EquipoDetailScreen.js

| Cambio | Detalle |
|---|---|
| Botón dinámico | Si `estadoOperativo === 'AVERIADO'`: muestra "Registrar Reparación", busca avería `REPORTADA` del equipo, navega a `AtenderAveria` con su ID |
| Botón dinámico | Si `estadoOperativo === 'OPERATIVO'`: muestra "Registrar Avería", navega a `RegistrarAveria` (comportamiento original) |

## 13.5 Archivos Modificados

| Archivo | Cambio |
|---|---|
| `backend/src/main/java/.../service/AveriaService.java` | `actualizar()` restaura `estadoOperativo = "OPERATIVO"` |
| `backend/src/main/java/.../controller/AveriaResource.java` | Removido `@Valid` del PUT |
| `mobile/src/screens/AtenderAveriaScreen.js` | Simplificado a 1 foto, preview local, upload en submit, botón "Finalizar Servicio" |
| `mobile/src/screens/HomeScreen.js` | Menú con `filterEstado: 'AVERIADO'` |
| `mobile/src/screens/EquiposListScreen.js` | Filtro por `filterEstado` en route params |
| `mobile/src/screens/EquipoDetailScreen.js` | Botón condicional "Registrar Reparación" vs "Registrar Avería" |

## 13.6 Problema Conocido

La preview de foto en `AtenderAveriaScreen` no se muestra en el dispositivo Xiaomi/HyperOS a pesar de usar el mismo patrón que `RegistrarAveriaScreen.js` (que sí funciona). Pendiente de debuggear si `launchCamera` devuelve una URI no renderizable por `<Image>` en este dispositivo específico.

---

# 14. Cierre

Este documento queda sincronizado con PostgreSQL 18 como base oficial, frontend web accesible en `http://localhost/`, y módulo PSR/OSR mobile funcional con formulario React Hook Form + Zod + date picker nativo. La configuración de red, puertos y conexiones queda documentada y congelada en la sección 12. Adicionalmente, el flujo de Finalización del Servicio (atención de averías con restauración de estado operativo) queda implementado en backend y mobile.

---

# 15. Auto-actualización de Averías en EquipoDetailScreen

## 15.1 Problema

Al registrar una avería desde `EquipoDetailScreen` (`RegistrarAveria`), el listado de averías del equipo no se actualizaba automáticamente al volver a la pantalla. Era necesario salir de la pantalla y volver a entrar para ver la avería recién registrada.

## 15.2 Causa

`useFocusEffect` (línea 96) solo invocaba `fetchEquipo()`, que recarga el equipo y las evidencias, pero **nunca recargaba el listado de averías** al recuperar el foco tras navegar a `RegistrarAveria` o `AtenderAveria`.

## 15.3 Solución (EquipoDetailScreen.js)

| Cambio | Detalle |
|---|---|
| `loadAverias()` | Función `useCallback([id])` que solo descarga el listado (`/averias/por-equipo/{id}`) y actualiza el estado `averias`. Sin lógica de toggle. |
| `toggleAverias()` | `useCallback([loadAverias])` que conmuta `showAverias` (ver/ocultar) y dispara `loadAverias()` al abrir. Reemplaza al antiguo `fetchAverias`. |
| `showAveriasRef` | `useRef` sincronizado en cada render con `showAverias`. Permite que el callback estable del `useFocusEffect` lea el valor actual sin closures obsoletos. |
| Nuevo `useFocusEffect` | Se dispara al recuperar el foco (volver de RegistrarAveria/AtenderAveria); si `showAverias` está visible, llama `loadAverias()` → el listado se actualiza automáticamente. |
| Botón "Ver/Ocultar Averías" | `onPress` apunta a `toggleAverias` (antes `fetchAverias`). |

## 15.4 Comportamiento Resultante

1. Pantalla en foco con averías visibles → al volver de registrar/atender una avería, el listado se recarga automáticamente.
2. El estado del equipo (`estadoOperativo`) también se refresca con `fetchEquipo()` en el focus, manteniendo sincronizado el botón "Registrar Avería"/"Registrar Reparación".
3. No hay fetch duplicado al abrir por primera vez: `toggleAverias` es quien carga; el `useFocusEffect` solo actúa sobre focus posteriores cuando ya está visible.

## 15.5 Pruebas Internas

- `npx eslint src/screens/EquipoDetailScreen.js` → sin errores (exit 0).
- `npx jest` → 21/22 tests pasan. El único fallo (`PasswordChangeScreen.test.js`) es **pre-existente** y no relacionado: el test no envuelve el render en `SafeAreaProvider` requerido por `useSafeAreaInsets`. Verificado con `git stash` (falla sin el cambio).
- Validación manual en emulador Android: registrar avería → al volver, el listado muestra la nueva avería sin salir de la pantalla.

---

# 16. Modo Contextual en EquiposListScreen (UX de selección vs gestión)

## 16.1 Problema

`HomeScreen` mapea 4 intenciones distintas a la misma pantalla `EquiposList`:

| Acción | Intención real |
|---|---|
| Ingreso de Equipo | **Gestión/creación** → SelectPsrEquipment |
| Registro de Avería | **Seleccionar** equipo → EquipoDetail → RegistrarAveria |
| Detalles de Equipo | **Consulta** → EquipoDetail |
| Finalización del Servicio | **Seleccionar** equipo averiado → AtenderAveria |

`EquiposListScreen` siempre pintaba el botón **"Nuevo ingreso"** (navega a `SelectPsrEquipment`, alta de equipo por PSR/OSR). En los contextos de selección/consulta ese botón era un affordance engañoso: el usuario viene a *elegir* un equipo, no a *crear* uno.

## 16.2 Solución

Se introduce un parámetro `mode` en los params de navegación hacia `EquiposList`:

| Valor | Uso | Título | Botón "Nuevo ingreso" |
|---|---|---|---|
| `manage` (por defecto) | Ingreso de Equipo / tab Equipos | "Equipos ingresados" | Visible |
| `select` | Registro de Avería / Finalización del Servicio | "Seleccionar equipo" | Oculto |
| `view` | Detalles de Equipo | "Consulta de equipos" | Oculto |

### 16.2.1 HomeScreen.js

| Cambio | Detalle |
|---|---|
| `menuActions` | Cada acción pasa ahora `params: { mode: ... }` explícito. `Finalización del Servicio` mantiene `filterEstado: 'AVERIADO'` junto a `mode: 'select'`. |

### 16.2.2 EquiposListScreen.js

| Cambio | Detalle |
|---|---|
| Derivación | `const mode = route.params?.mode ?? 'manage'`; `const isManage = mode === 'manage'`. Si no llegan params (acceso directo por tab), se asume gestión. |
| Título contextual | `filterEstado === 'AVERIADO'` → "Equipos averiados"; `manage` → "Equipos ingresados"; `select` → "Seleccionar equipo"; `view` → "Consulta de equipos". |
| Botón condicional | "Nuevo ingreso" solo se renderiza cuando `isManage`. El resto de la pantalla (búsqueda, listado, edición con lápiz para admins) permanece igual. |

### 16.2.3 Lápiz de edición (EquiposListScreen.js)

La edición es una acción de **gestión**, por lo que queda aislada al contexto `manage`, igual que el botón "Nuevo ingreso".

| Modo | Lápiz de edición | Lápiz (admin) sobre card |
|---|---|---|
| `manage` | Visible | Sí |
| `select` | Oculto | No |
| `view` | Oculto | No |

| Cambio | Detalle |
|---|---|
| Condición del lápiz | `{isManage && canEdit ? ( ... ) : null}`. Antes solo dependía de `canEdit = isAdminOrSuperAdmin(user)`, lo que mostraba el lápiz en "Detalles de Equipo" (`view`) y "Registro de Avería" (`select`) — un affordance de gestión en contextos de consulta/selección. Ahora solo aparece en `mode: 'manage'`. |

La edición inline sigue disponible en el tab **Equipos** (desde la barra inferior, sin `mode`, se asume `manage`), donde la acción de gestionar equipos pertenece.

## 16.3 Limitación Conocida (heredada de `filterEstado`)

React Navigation conserva los `params` de un tab cuando este ya está montado. Si el usuario entra con `mode: 'select'` desde Home y luego toca directamente el tab "Equipos" en la barra inferior, el modo `select` queda "pegado" (botón oculto) hasta que se re-navegue desde Home. Es el mismo comportamiento heredado del parámetro `filterEstado`. Se decidió **no** añadir un listener `tabPress` para resetear el modo, priorizando un código mínimo y consistente con el precedente. Si en el futuro el estado pegado molesta, se puede implementar como fix puntual (deuda 🟢 documentada).

## 16.4 Pruebas Internas

- `npx eslint src/screens/HomeScreen.js src/screens/EquiposListScreen.js` → sin errores (exit 0).
- `npx jest` → 21/22 tests pasan. Único fallo `PasswordChangeScreen.test.js` **pre-existente** (falta `SafeAreaProvider`), verificado con `git stash`.
- Validación manual en emulador Android: navegar desde las 4 acciones del Home y verificar título, visibilidad del botón "Nuevo ingreso" y del lápiz de edición según modo.

---

# 17. Finalización del Servicio — Devolución de Equipos

## 17.1 Problema

El FM (sección 3.8) define que la finalización del servicio exige ingresar las fotos del equipo **"tal cual como cuando se recepcionó"** y guardar. No existía pantalla para registrar la devolución: un equipo que dejaba de estar en servicio no quedaba marcado ni se registraban sus evidencias de retorno.

## 17.2 Análisis FM vs Implementación (brechas)

| Requerimiento FM | Estado previo | Implementación |
|---|---|---|
| Fotos de devolución al finalizar | ❌ No existía | ✅ Nuevo módulo con 4 evidencias obligatorias |
| Marcar equipo como devuelto | ❌ No existía | ✅ `estado_operativo = 'DEVUELTO'` + `fecha_devolucion` |
| PDF de reporte de finalización | ❌ No existía | ⏳ Deuda documentada (fuera de alcance) |
| Fotos de avería (FM pide 3, hay 2) | ⚠️ Parcial | 🟡 Deuda documentada |
| Fotos de atención (FM pide 3, hay 1) | ⚠️ Parcial | 🟡 Deuda documentada |

## 17.3 Decisiones de Diseño

### 17.3.1 Módulo backend limpio `devolucion-equipos`

No se reutilizó `fac_evidencias_ingreso_equipo` porque su constraint `chk_evidencias_ingreso` limita los tipos a los de ingreso. Se creó tabla dedicada `fac_evidencias_devolucion_equipo` con CHECK de tipos propios.

### 17.3.2 Estados permitidos

La migración V20 reemplaza el constraint existente (`DROP IF EXISTS` + `ADD`) por `chk_estado_operativo_equipo` con `('OPERATIVO','AVERIADO','DEVUELTO')`.

### 17.3.3 Evidencias obligatorias (4)

`DEVOLUCION_FRONTAL`, `DEVOLUCION_LATERAL_IZQUIERDO`, `DEVOLUCION_LATERAL_DERECHO`, `DEVOLUCION_POSTERIOR`. `DevolucionEquipoService.finalizar` valida que estén las 4 antes de marcar DEVUELTO.

### 17.3.4 Fotos

Solo JPEG/PNG, máximo 5 MB (validado en service y en CHECK `chk_evidencia_devolucion_tamanio`). Tabla con BYTEA + `UNIQUE(equipo_id, tipo)` (upsert por slot).

## 17.4 Backend — Archivos del Módulo

| Archivo | Contenido |
|---|---|
| `db/migration/V20__devolucion_equipo.sql` | `fecha_devolucion`, constraint DEVUELTO, tabla evidencias + índices |
| `entity/TipoEvidenciaDevolucion.java` | Enum con los 4 tipos |
| `entity/EvidenciaDevolucionEquipo.java` | JPA entity + UNIQUE(equipo_id, tipo) |
| `repository/EvidenciaDevolucionEquipoRepository.java` | `listByEquipo`, `findByEquipoAndTipo` |
| `dto/EvidenciaDevolucionEquipoDTO.java` | DTO de salida (sin contenido binario) |
| `mapper/EvidenciaDevolucionEquipoMapper.java` | MapStruct |
| `service/DevolucionEquipoService.java` | `guardarEvidencia` (upsert), `listarEvidencias`, `obtenerArchivo`, `finalizar` |
| `controller/DevolucionEquipoResource.java` | `@Path("/devolucion-equipos")`, 4 endpoints |
| `entity/Equipo.java` / `dto/EquipoDTO.java` / `mapper/EquipoMapper.java` | Campo `fechaDevolucion` añadido |

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| PUT | `/devolucion-equipos/{equipoId}/evidencias/{tipo}` | Sube foto multipart (upsert) |
| GET | `/devolucion-equipos/{equipoId}/evidencias` | Lista evidencias |
| GET | `/devolucion-equipos/{equipoId}/evidencias/{tipo}/archivo` | Binario de la foto |
| POST | `/devolucion-equipos/{equipoId}/finalizar` | Valida 4 evidencias → `DEVUELTO` + `fecha_devolucion` |

## 17.5 Mobile — Pantalla `DevolucionEquipoScreen`

| Aspecto | Detalle |
|---|---|
| Navegación | Desde `EquiposList` con `devolucion: true` (ver 17.6) |
| Carga | `GET /equipos/{id}` + `GET /devolucion-equipos/{id}/evidencias` |
| Fotos | 4 slots, `launchCamera`, upload inmediato por slot con `PUT .../evidencias/{tipo}` |
| Visor | Tocar foto guardada → Modal con `ZoomableImage` + descargar (mismo patrón que EquipmentPhotosScreen) |
| Finalizar | Botón "Finalizar y devolver equipo" habilitado solo con 4/4 fotos → `POST .../finalizar` → alerta → `navigation.popTo('MainTabs')` |

## 17.6 Corrección de Flujo (incongruencia reportada)

La primera versión hacía que "Finalización del Servicio" filtrara **solo equipos AVERIADO** (`filterEstado: 'AVERIADO'`). El usuario indicó que el flujo debe listar equipos **operativos o averiados de forma indistinta**, excluyendo únicamente los **ya devueltos**.

| Archivo | Cambio |
|---|---|
| `HomeScreen.js` | Acción pasa `params: { mode: 'select', devolucion: true }` (ya no `filterEstado`) |
| `EquiposListScreen.js` | `const esDevolucion = route.params?.devolucion === true`. En devolución: `GET /equipos` y filtra `estadoOperativo !== 'DEVUELTO'`. Título "Equipos para devolución". Tap navega a `DevolucionEquipo` |
| `AppNavigator.js` | Registra `DevolucionEquipo` en MainStack (título "Finalización del Servicio") |

### Lógica de filtrado en `EquiposListScreen.js`

```
esDevolucion → GET /equipos → arr.filter(e => e.estadoOperativo !== 'DEVUELTO')
filterEstado  → GET /equipos → arr.filter(e => e.estadoOperativo === filterEstado)
sin filtro    → GET /equipos (todos)
```

## 17.7 Pruebas Realizadas (emulador)

- [x] Flujo Home → Finalización → lista "Equipos para devolución" muestra OPERATIVO/AVERIADO y **oculta DEVUELTO**.
- [x] Tap en equipo navega a `DevolucionEquipo` (no a EquipoDetail).
- [x] Carga de evidencias previas (GET) y precarga de slots.
- [x] Toma de foto con cámara virtual + upload inmediato → persistida en BD (4 registros).
- [x] Visor de foto (GET archivo) con botón "Descargar al dispositivo".
- [x] Finalizar → alerta "Equipo devuelto" → BD con `estado_operativo='DEVUELTO'` y `fecha_devolucion`.
- [x] Lista se refresca y ya no muestra el equipo devuelto.
- [x] Migración V20 aplicada (BD en v20); constraint incluye DEVUELTO.

## 17.8 Pruebas de Código

- Backend: `mvn compile` exitoso (via Docker image `maven:3.9-eclipse-temurin-21`).
- Mobile: `npx eslint src/screens/DevolucionEquipoScreen.js src/screens/EquiposListScreen.js src/navigation/AppNavigator.js` → exit 0.
- Mobile: `npx jest` → 21/22. Único fallo `PasswordChangeScreen.test.js` **pre-existente** (falta `SafeAreaProvider`), ajeno a este módulo.

## 17.9 Deuda Documentada

| Ítem | Severidad | Plan |
|---|---|---|
| PDF de reporte de finalización del servicio | 🟠 Alto | Fuera de alcance; requeriría librería de generación PDF y plantilla |
| Fotos de avería: FM pide 3, implementado 2 | 🟡 Medio | Ampliar `fac_evidencias` de averías a 3 slots |
| Fotos de atención: FM pide 3, implementado 1 | 🟡 Medio | Ampliar `AtenderAveriaScreen` a 3 slots |
| Estado pegado en tab EquiposList tras `mode/devolucion` | 🟢 Bajo | Listener `tabPress` para resetear params (misma limitación que §16.3) |

# 18. Login UX - Desplegables de ancho completo y campos visibles a la vez

## 18.1 Problema

En `LoginScreen.js` existían dos inconvenientes de experiencia de usuario:

1. **Ancho de los desplegables (Perfil y Usuario):** los ítems del `Menu` de react-native-paper (`Menu.Item`) no heredan el ancho del botón ancla, por lo que el menú desplegado resultaba notablemente más angosto que el campo que lo abre (`AppSelect`).
2. **Campos secuenciales:** el formulario ocultaba Usuario y Contraseña hasta avanzar por un estado `step` (`roles` → `usuarios` → `password`), obligando a tocar "Continuar"/avanzar para ver cada campo. La norma de UX es mostrar los tres campos (Perfil, Usuario, Contraseña) simultáneamente.

## 18.2 Causas raíz

| Síntoma | Causa |
|---|---|
| Ítems del desplegable angostos | `Menu`/`Menu.Item` de react-native-paper no toman el ancho del `anchor` por defecto |
| Campos secuenciales | Estado `step` en `LoginScreen` condicionaba el render de cada campo |

## 18.3 Solución

### 18.3.1 `components/AppSelect.js` — ancho del desplegable

- Se mide el ancho del contenedor ancla mediante `onLayout` (`anchorWidth`).
- Se aplica `style={{ width: anchorWidth }}` al `Menu` para que todos los `Menu.Item` compartan el ancho del campo.
- El anchor envuelve el `<Button>` con `width: '100%'` dentro de un `<View>` con `onLayout`.

Resultado en emulador: los ítems ("Super Admin", "Admin", "Usuario") pasan de un ancho mínimo (texto corto) a ~735px, coincidiendo con el ancho del campo que los abre (ancla ~818px).

### 18.3.2 `screens/LoginScreen.js` — campos simultáneos

- Se **elimina por completo** el estado `step`.
- El `useEffect` que reacciona a `selectedRolId` ahora resetea `selectedUsuarioId` y `password` (antes hacía `setStep('usuarios')`).
- Se elimina el segundo `useEffect` que hacía `setStep('password')`.
- `handleSaveApiUrl` reemplaza `setStep('roles')` por `setPassword('')`.
- Render estable: siempre se muestran Perfil (select), Usuario (select, `disabled` y con placeholder "Primero selecciona un perfil" hasta elegir Perfil), Contraseña (input) y el botón "Iniciar sesión" (`disabled` hasta tener usuario y contraseña).
- Se retira el botón "Cambiar usuario".

## 18.4 Pruebas realizadas (emulador)

- [x] Tres campos (Perfil, Usuario, Contraseña) visibles a la vez en el login.
- [x] Select de Usuario deshabilitado con placeholder "Primero selecciona un perfil" hasta elegir Perfil.
- [x] Al elegir Perfil, el select de Usuario se habilita y carga los usuarios del perfil.
- [x] ítems del desplegable de Perfil y de Usuario con el ancho del campo (ancla ~819px, menú ~735px).
- [x] Botón "Iniciar sesión" deshabilitado hasta ingresar usuario y contraseña.
- [x] Login ejecuta y muestra la respuesta del backend (p.ej. "Contraseña incorrecta" ante credencial no coincidente), confirmando el envío y manejo de error.

> Nota: no se completó un login con éxito porque el hash BCrypt de un usuario local en la BD actual difiere del seed (`V9` usa `00000000`); el objetivo del cambio (UX de desplegables y campos simultáneos) quedó validado. Este comportamiento es previo al cambio y ajeno al mismo.

## 18.5 Pruebas de Código

- Mobile: `npx eslint src/LoginScreen.js src/components/AppSelect.js` → exit 0.
- Mobile: `npx jest` → 21/22. Único fallo `PasswordChangeScreen.test.js` **pre-existente** (falta `SafeAreaProvider`), ajeno a este cambio.

## 18.6 Archivos Modificados

| Archivo | Cambio |
|---|---|
| `mobile/src/components/AppSelect.js` | Medición de ancho del anchor (`onLayout`) + `width` en el `Menu` |
| `mobile/src/screens/LoginScreen.js` | Eliminación de `step`; tres campos siempre visibles; `disabled` condicional en Usuario y "Iniciar sesión"; retiro de "Cambiar usuario" |

## 19. Restricción de permisos en mantenimiento de catálogos

### 19.1 Problema

Los mantenimientos CRUD de catálogos operativos (marcas, proveedores, tipos de equipo, sedes, campañas y motivos PSR) estaban disponibles para cualquier rol autenticado. El rol **Usuario** no debía poder crear, editar ni eliminar registros, solo consultarlos.

### 19.2 Solución

- **Backend (autoridad)**: en los recursos REST de los seis catálogos, los métodos de escritura (POST/PUT/DELETE) y las acciones de campaña (`activar`/`cerrar`) quedaron anotados con `@RolesAllowed({"Super Admin","Admin"})`. GET permanece accesible para los tres roles (anotación a nivel de clase).
- **Frontend Web**: las páginas `Marcas`, `Proveedores`, `TiposEquipo`, `Sedes`, `MotivosPsr` y `Campanas` obtienen el rol vía `useApp()` y calculan `canEdit = rolId === 1 || rolId === 2`, ocultando el botón "Nuevo/Nueva" y las acciones de editar/eliminar (y activar/cerrar en campañas) cuando el rol no lo permite.
- **Mobile**: `CatalogScreen` recibe la prop `canEdit` (oculta el FAB y las acciones de editar/eliminar). Cada pantalla hija (`MarcasScreen`, `ProveedoresScreen`, `TiposEquipoScreen`, `SedesScreen`, `MotivosPsrScreen`) pasa `canEdit={isAdminOrSuperAdmin(user)}`; `CampanasScreen` oculta activar/cerrar/eliminar si no tiene permiso. Reutiliza `utils/roles.js`.

### 19.3 Casos cubiertos

| Rol | Leer | Crear/Editar/Eliminar |
|---|---|---|
| Super Admin | ✅ | ✅ |
| Admin | ✅ | ✅ |
| Usuario | ✅ | ❌ (HTTP 403) |

### 19.4 Archivos Modificados

| Capa | Archivo |
|---|---|
| Backend | `CampanaResource.java`, `MarcaResource.java`, `MotivoPsrResource.java`, `ProveedorResource.java`, `SedeResource.java`, `TipoEquipoResource.java` |
| Frontend Web | `Marcas.jsx`, `Proveedores.jsx`, `TiposEquipo.jsx`, `Sedes.jsx`, `MotivosPsr.jsx`, `Campanas.jsx` |
| Mobile | `CatalogScreen.js`, `CampanasScreen.js`, `MarcasScreen.js`, `ProveedoresScreen.js`, `TiposEquipoScreen.js`, `SedesScreen.js`, `MotivosPsrScreen.js` |

## 20. Desplegables AppSelect con Portal + ScrollView completo (2026-08-05)

### 20.1 Problema

El `Menu` de react-native-paper desplegaba las opciones con `contentStyle maxHeight` + `zIndex`, pero en el dispositivo del usuario el listado quedaba **detrás de la barra de acciones** y no permitía hacer scroll hasta el último ítem (listas largas de marcas/proveedores). La primera solución con `Modal` + `ScrollView` seguía dejando el menú detrás de la barra de acciones inferior.

### 20.2 Solución — `mobile/src/components/AppSelect.js` (reescritura)

| Aspecto | Detalle |
|---|---|
| Render | `Portal` de react-native-paper + `Pressable` overlay (`testID="select-overlay"`) para cerrar tocando fuera + `View` posicionado (`testID="select-menu"`) con `ScrollView` interno siempre scrolleable. |
| Posicionamiento | `measureInWindow` sobre el nodo ancla (`ref` + `collapsable={false}`) → `{ x, y, width, height }`; el menú se ubica debajo del anchor. Fallback `{ left: 16, right: 16, top: 80 }`. |
| Altura máxima | `maxHeight = max(120, windowHeight - anchor.y - anchor.height - insets.bottom - 24)`; el `ScrollView` permite llegar al último ítem. |
| Prop `onOpen` | Callback opcional invocado al abrir el menú (antes de `setVisible(true)`) para refetch silencioso de catálogos. |
| Contrato `onChange` | `onChange(option.value, option)` — sin cambios en consumidores. |

## 21. Catálogos en tiempo real (2026-08-05)

### 21.1 Problema

Los catálogos (marcas, proveedores, tipos, sedes, campañas, motivos, roles) se cargaban una sola vez al montar cada pantalla. Un catálogo creado por el admin en un dispositivo no aparecía en el otro celular hasta reiniciar la app.

### 21.2 Solución — refetch silencioso en focus + al abrir desplegables

| Pantalla | Cambio |
|---|---|
| `EquipmentFormScreen.js` | `loadCatalogs(silent)`; `useFocusEffect` con `loadedRef` (primera vez con loader; re-enfoques recargan en silencio). `onOpen={() => loadCatalogs(true)}` en los 3 selects. |
| `CreatePsrScreen.js` | `loadCatalogs(silent)`; `useFocusEffect` + `loadedRef`; validaciones de negocio solo en carga no-silenciosa; `onOpen` en campaña, sede y motivo. |
| `CreateEditUserScreen.js` | `loadRoles(silent)`; `useFocusEffect` + `loadedRef`; `onOpen={() => loadRoles(true)}` en el select de rol. |
| `LoginScreen.js` | `fetchRoles(silent)`; `onOpen={() => fetchRoles(true)}` en el select de Perfil. |

El refetch silencioso no muestra spinners ni errores (UX no intrusiva); los errores de carga inicial sí se muestran.

## 22. Filtro de equipos por modo de navegación (DEVUELTO)

`mobile/src/utils/equipmentForm.js` — nueva función pura `filterEquiposByMode(equipos, { mode, filterEstado })`:

| Modo | Comportamiento |
|---|---|
| `select` / `manage` | Oculta equipos `DEVUELTO`. |
| `view` | Muestra todos (`OPERATIVO`, `AVERIADO`, `DEVUELTO`). |
| `filterEstado` | Si se define, solo equipos con ese `estadoOperativo`. |

`EquiposListScreen.js` la usa con mensajes de vacío contextuales por modo. Tests: `mobile/src/__tests__/equiposListFilter.test.js`.

## 23. Referencias PSR/OSR — backend + mobile (2026-08-06)

### 23.1 Backend — `EquipoDTO` con bloque `psrOsr`

- `dto/PsrOsrRefDTO.java` (nuevo): `psrId`, `numeroPsr`, `numeroOsr`, `sedeNombre`, `campanaNombre`.
- `dto/EquipoDTO.java`: campo anidado `psrOsr`.
- `service/EquipoService.java`: solo `buscarPorId(id)` resuelve la vinculación (evita N+1 en `listarTodos`).

```
Equipo → Osr.equipoId → Osr.psrId → Psr → (Sede, Campaña)
```

### 23.2 Backend — `PsrDTO` con `marca`, `modelo`, `grr`

`service/PsrService.java` `toDTO(psr)` resuelve vía `osrRepository.findByPsrId` → `resolverEquipoAsociado(dto, osr)`: si `osr.equipoId != null`, obtiene el equipo y llena `modelo`, `grr` (= `numeroGuiaRemision`) y `marca` (nombre vía `MarcaRepository`). Se inyectan `EquipoRepository` y `MarcaRepository`.

### 23.3 Mobile

- `EquipoDetailScreen.js`: card **"PSR / OSR"** (línea ~166) con PSR, OSR, Sede y Campaña desde `equipo.psrOsr`; estado vacío "Sin PSR/OSR vinculada" si el equipo no tiene vinculación.
- `PsrOsrScreen.js`: línea `Marca: ... | Modelo: ... | GRR: ...` (línea ~151), renderizada solo si existe al menos un valor.

### 23.4 Retroactividad validada (producción local)

`GET /equipos/6` → `psrOsr: { psrId: 4, numeroPsr: "PSR-2026-004", numeroOsr: "OSR-2026-004", sedeNombre: "Packing Uva", campanaNombre: "26-27" }`. Las 4 PSR existentes devuelven `marca/modelo/grr` correctos. Contenedor `apilamiento-backend` reconstruido y saludable. Tests `EquipoServiceTest` + `PsrServiceTest` (exit 0).

## 24. Mejoras de administración mobile (2026-08-05/06)

- `AppNavigator.js`: tab Catálogos con secciones agrupadas (Catálogos / Operación / Administración / Sistema); oculto para rol Usuario con mensaje "No tienes permisos para acceder a esta sección."; Configuración solo Super Admin.
- `CatalogScreen.js` / `RolesScreen.js`: el botón de creación pasa de FAB a `headerRight` (`IconButton` `+`) vía `useLayoutEffect`. `RolesScreen` pasa `canEdit={isAdminOrSuperAdmin(user)}`.
- `CampanasScreen.js`: CRUD completo mobile — crear/editar campañas en `Dialog` con `AppInput` (nombre, código) + `DateField` con `DateTimePicker` nativo (fechas inicio/fin), POST/PUT; `headerRight` `+` solo con `canEdit`; tap en card abre edición.

## 25. Pruebas de Código (HDT-008)

- **Backend**: `mvn compile` exitoso (JDK 21 vía Docker `maven:3.9-eclipse-temurin-21` con caché `.m2` local). `EquipoServiceTest` + `PsrServiceTest` pasan. `docker compose build backend && up -d backend` → health check `UP`.
- **Mobile**: ESLint limpio en `EquipoDetailScreen` y `PsrOsrScreen`. Suite Jest: 33 pass / 2 fail **pre-existentes y ajenos** (`PasswordChangeScreen.test.js` sin `SafeAreaProvider`; `AuthContext.test.js` flaky por timing que pasa aislado).
- **Dispositivos**: card PSR/OSR y línea Marca|Modelo|GRR visibles en los 2 celulares (REDMI admin + Xiaomi usuario).

## 26. Teclado móvil no cubre los inputs (HDT-009, 2026-08-06)

### 26.1 Problema

Hallazgo del perfil de auditor (G-MOB-UI / adaptación a tamaños de pantalla): en el celular, al enfocar un campo (contraseña, nombre, observaciones), el teclado virtual **cubría el input**, impidiendo ver lo que se escribe. El `AndroidManifest.xml` ya tenía `android:windowSoftInputMode="adjustResize"` correcto (mobile/android/app/src/main/AndroidManifest.xml:24), pero la mayoría de pantallas no reaccionaban al teclado.

### 26.2 Solución — componente `mobile/src/components/KeyboardAwareScrollView.js` (nuevo)

| Aspecto | Detalle |
|---|---|
| Estructura | `KeyboardAvoidingView` (Android `behavior="height"`, iOS `behavior="padding"`) envolviendo un `ScrollView` con `keyboardShouldPersistTaps="handled"`. |
| Props | `behavior` (anula el default por plataforma), `keyboardVerticalOffset` (default `0`, para iOS descontar el header), `contentContainerStyle`, `style`, resto se pasan al `ScrollView`. |
| Decisión de diseño | Primera versión usaba `useHeaderHeight` de `@react-navigation/elements`; se descartó porque ese hook lanza error fuera de un navigator (rompía los tests que renderizan pantallas aisladas). |

### 26.3 Pantallas migradas

| Pantalla | Antes | Después |
|---|---|---|
| `LoginScreen.js` | `ScrollView` | `KeyboardAwareScrollView` |
| `PasswordChangeScreen.js` | `View` (sin scroll) + `flex: 1` | `KeyboardAwareScrollView` + `flexGrow: 1` en `contentContainerStyle` |
| `CreateEditUserScreen.js` | `ScrollView` | `KeyboardAwareScrollView` |
| `CreatePsrScreen.js` | `ScrollView` | `KeyboardAwareScrollView` |
| `RegistrarAveriaScreen.js` | `ScrollView` | `KeyboardAwareScrollView` (2 bloques: formulario y fotos) |
| `AtenderAveriaScreen.js` | `ScrollView` | `KeyboardAwareScrollView` |
| `SettingsScreen.js` | `ScrollView` | `KeyboardAwareScrollView` |

**Excepción `EquipmentFormScreen.js`**: tiene un footer sticky (botón guardar) que debe quedar **por encima del teclado** pero **fuera del scroll**. Se reestructuró con `KeyboardAvoidingView` (hermano del footer) + `ScrollView` interno (el footer permanece fuera del scroll y se eleva con el teclado).

**Dialogs con inputs**: en `CampanasScreen.js` y `CatalogScreen.js`, el `ScrollView` interno de `Dialog.ScrollArea` se envolvió en `KeyboardAvoidingView` (`padding` iOS / `height` Android) + `keyboardShouldPersistTaps="handled"`, de modo que el teclado no tapa los campos del diálogo.

### 26.4 Corrección de tests pre-existentes

| Test | Problema | Corrección |
|---|---|---|
| `PasswordChangeScreen.test.js` | Fallaba por "No safe area value available" (la pantalla usa `useSafeAreaInsets` y el test no la envolvía en `SafeAreaProvider`) | El render se envuelve en `SafeAreaProvider` con `initialMetrics` |
| `AuthContext.test.js` | Flaky por timing: timeout de 5s excedido bajo carga paralela (pasaba aislado) | Timeout del test elevado a 15s |

### 26.5 Pruebas de Código

- Mobile: `npm run lint` → exit 0.
- Mobile: `npm test` → **38/38 pass** (12 suites). Nuevo `KeyboardAwareScrollView.test.js` (3 casos: renderiza hijos, respeta `behavior`, `keyboardShouldPersistTaps="handled"` por defecto).

### 26.6 Archivos Modificados/Creados

| Archivo | Acción |
|---|---|
| `mobile/src/components/KeyboardAwareScrollView.js` | Nuevo |
| `mobile/src/LoginScreen.js` | Modificado |
| `mobile/src/screens/PasswordChangeScreen.js` | Modificado |
| `mobile/src/screens/CreateEditUserScreen.js` | Modificado |
| `mobile/src/screens/CreatePsrScreen.js` | Modificado |
| `mobile/src/screens/EquipmentFormScreen.js` | Modificado (KAV + ScrollView, footer sticky fuera) |
| `mobile/src/screens/RegistrarAveriaScreen.js` | Modificado |
| `mobile/src/screens/AtenderAveriaScreen.js` | Modificado |
| `mobile/src/screens/SettingsScreen.js` | Modificado |
| `mobile/src/screens/CampanasScreen.js` | Modificado (KAV en dialog) |
| `mobile/src/screens/CatalogScreen.js` | Modificado (KAV en dialog) |
| `mobile/src/__tests__/KeyboardAwareScrollView.test.js` | Nuevo |
| `mobile/src/__tests__/PasswordChangeScreen.test.js` | Modificado (SafeAreaProvider) |
| `mobile/src/__tests__/AuthContext.test.js` | Modificado (timeout 15s) |

## 27. Usuarios Mobile — solo Nombre obligatorio y Ubicación desde Sedes (HDT-010, 2026-08-06)

### 27.1 Problema

En `CreateEditUserScreen.js` el formulario pedía Correo, Área, Puesto, Empresa y Departamento (campos que el usuario comentó), pero el schema Zod **todavía exigía `correo` y `rolId`** (además de `nombre`), y `ubicacion` era un input libre. Al comentar los campos, el submit quedaba bloqueado por la validación de correo ausente. Además, el backend exigía correo obligatorio (`UsuarioService.crear`) y `rolId` `@NotNull` (`UsuarioDTO`), y la columna `rol_id` es `NOT NULL` en BD.

### 27.2 Solución — Mobile `CreateEditUserScreen.js`

| Aspecto | Detalle |
|---|---|
| Schema | Solo `nombre` obligatorio (`min(1)`). `rolId` y `ubicacion` opcionales. Se eliminan correo/área/puesto/empresa/departamento. |
| Catálogos | `loadCatalogs()` carga en paralelo `/roles` y `/sedes` (refetch silencioso en focus + `onOpen`). |
| Rol | `AppSelect` con los roles (sigue excluyendo Super Admin); opcional con placeholder "Seleccione un rol (opcional)". |
| Ubicación | Reemplaza `AppInput` por `AppSelect` con opciones desde **Sedes** (value = nombre de la sede, label = `nombre (codigo)`), filtrando inactivas. Placeholder "Seleccione la ubicación (opcional)". |
| Payload | `{ nombre, rolId: Number|null, ubicacion: string|null }` — ya no envía correo. |

### 27.3 Backend

| Archivo | Cambio |
|---|---|
| `dto/UsuarioDTO.java` | Se elimina `@NotNull` sobre `rolId` (rol deja de ser obligatorio). |
| `repository/RolRepository.java` | Nuevo `findByNombre(String)` (Panache `find("nombre", ...)`). |
| `service/UsuarioService.java` | `crear`: ya no exige correo (si viene vacío → `null`; el conflicto de unicidad solo se valida cuando hay correo). Si `rolId` es `null`, resuelve por defecto el rol **"Usuario"** vía `RolRepository.findByNombre` (si no existe, `BadRequestException`). `nombre` es obligatorio: si es nulo/vacío tras `trim()` → `BadRequestException("El nombre es obligatorio")`. |

### 27.4 Validación (producción local Docker)

- `mvn test` (Docker `maven:3.9-eclipse-temurin-21`): **`UsuarioServiceTest` 6/6 PASS** (nuevo: crear solo con nombre → rol "Usuario" por defecto; nombre vacío → 400; correo duplicado → 409; sin rol "Usuario" en catálogo → 400; actualizar nombre; actualizar inexistente → null). Únicos 2 errores de la suite: **pre-existentes** (`MarcaResourceTest` error de QuarkusTest por ruta `/app/target/classes` en entorno Docker; `MarcaServiceTest` UnnecessaryStubbing) — confirmados en el commit base sin mis cambios.
- `docker compose build backend && up -d backend` → health check `UP`.
- API real con JWT de prueba (RS256 firmado con `privatekey.pem`):
  - `POST /usuarios { nombre: "Usuario Test Solo Nombre" }` → **201**, `rolId: 3` (Usuario), `correo: null`.
  - `POST /usuarios { nombre: "...", rolId: 2, ubicacion: "Packing Uva" }` → **201**, `rolId: 2`, `ubicacion: "Packing Uva"`.
  - `POST /usuarios {}` → **400** "El nombre es obligatorio".
  - Usuarios de prueba eliminados vía `DELETE /usuarios/{id}` (DB limpia).
- Mobile: ESLint limpio. Suite Jest **42/42** (nuevo `CreateEditUserScreen.test.js` con 4 casos: solo muestra Nombre/Rol/Ubicación; crea solo con nombre → `{rolId: null, ubicacion: null}`; selecciona rol y ubicación desde catálogos; edita preservando valores).

### 27.5 Archivos Modificados/Creados

| Archivo | Acción |
|---|---|
| `backend/.../dto/UsuarioDTO.java` | Modificado (sin `@NotNull` en rolId) |
| `backend/.../repository/RolRepository.java` | Modificado (`findByNombre`) |
| `backend/.../service/UsuarioService.java` | Modificado (crear sin correo, rol por defecto, nombre obligatorio) |
| `backend/.../service/UsuarioServiceTest.java` | Nuevo (6 tests) |
| `mobile/src/screens/CreateEditUserScreen.js` | Modificado (schema solo nombre, sedes, Ubicación AppSelect, payload) |
| `mobile/src/__tests__/CreateEditUserScreen.test.js` | Nuevo (4 tests) |

## 28. Fix 409 al devolver equipo y trazabilidad de devolución (2026-08-09)

### 28.1 Problema

Al atender una avería sobre un equipo que ya había sido devuelto (`fecha_devolucion` seteada), `AveriaService.marcarAtendida` igualaba el equipo a `OPERATIVO`, revirtiendo la devolución. Además, el listado mobile mostraba equipos `DEVUELTO` en selecciones/gestión, y la API devolvía `409` con un mensaje genérico sin detalle útil para el cliente.

### 28.2 Solución

| Archivo | Cambio |
|---|---|
| `service/AveriaService.java` | `marcarAtendida` solo restaura `estadoOperativo = "OPERATIVO"` si `fechaDevolucion == null` (no revierte un equipo ya devuelto). |
| `dto/ApiResponse.java` | Nuevo campo `error` en el wrapper `{ success, message, data, error, errorCode, timestamp }` para que el cliente reciba el mensaje real del backend (no solo "request failed with status code 409"). |
| `mobile/src/utils/equipmentForm.js` | `filterEquiposByMode` oculta equipos `DEVUELTO` en modos `select`/`manage` (los equipos fuera de servicio ya no saturan las listas operativas). |
| `test/.../service/MarcaServiceTest.java` | Se eliminó un stub muerto (`when(repository.findById(any()))` no usado en `crear_deberiaPersistirYRetornarDTO`) que generaba `UnnecessaryStubbing`. Ahora 6/6. |

### 28.3 Pruebas

- `DevolucionEquipoServiceTest` (nuevo) — 7/7.
- `AveriaServiceTest` ampliado a 12/12 (caso: atender no revierte devolución).
- Suite backend unit: 67/67 (sin contar `MarcaResourceTest` @QuarkusTest que requiere env OIDC, pre-existente).
- Mobile: 16/16.

### 28.4 Archivos Modificados/Creados

| Archivo | Acción |
|---|---|
| `backend/.../service/AveriaService.java` | Modificado |
| `backend/.../dto/ApiResponse.java` | Modificado (campo `error`) |
| `mobile/src/utils/equipmentForm.js` | Modificado (`filterEquiposByMode` oculta DEVUELTO) |
| `backend/.../test/service/DevolucionEquipoServiceTest.java` | Nuevo (7 tests) |
| `backend/.../test/service/AveriaServiceTest.java` | Modificado (12 tests) |
| `backend/.../test/service/MarcaServiceTest.java` | Modificado (eliminado stub muerto) |

## 29. Horómetro en el registro y atención de averías (2026-08-09 / 2026-08-10)

### 29.1 Problema

El registro de avería no capturaba el horómetro de la máquina en el momento de la falla, y al atender tampoco se registraba el horómetro al quedar operativa ni los días de inactividad. La trazabilidad del horómetro a lo largo del ciclo de vida del equipo quedaba incompleta.

### 29.2 Migraciones

| Archivo | Contenido |
|---|---|
| `V22__averias_horometro.sql` | Agrega `horometro NUMERIC(12,2)` a `fac_averias` (horómetro en el reporte). |
| `V25__averias_horometro_atencion.sql` | Agrega `horometro_atencion NUMERIC(12,2)` a `fac_averias` (horómetro al atender). |

### 29.3 Backend

| Archivo | Cambio |
|---|---|
| `entity/Averia.java` | Campos `horometro`, `horometroAtencion` (`BigDecimal`) + `diasInactividad` (transient, calculado). |
| `dto/AveriaDTO.java` | `horometro`, `horometroAtencion`, `diasInactividad` con validación `@DecimalMin`/`@Digits(integer=12, fraction=2)`. |
| `mapper/AveriaMapper.java` | Mapeo bidireccional + cálculo de `diasInactividad` vía `ChronoUnit.DAYS.between(fechaHoraAveria, fechaHoraAtencion)`. |
| `service/AveriaService.java` | `crear` usa `dto.getFechaHoraAveria()` si viene (no siempre `now`) y valida formato de `horometro`. `actualizar` con `estadoAveria="ATENDIDA"`: exige `horometroAtencion` en la primera atención (400 si falta), valida formato, valida `horometroAtencion >= horometro` reportado (400 si la máquina "retrocedió"), setea `fechaHoraAtencion = now`, calcula y persiste `diasInactividad`. |

### 29.4 Mobile — `AtenderAveriaScreen.js`

| Aspecto | Detalle |
|---|---|
| Input | "Horómetro de atención *" (numérico; solo lectura si ya atendida). |
| Display | Tras atender, muestra horómetro de atención + "Días inactivo: N". |
| Validación UI | Bloquea submit si el horómetro está vacío o es menor al reportado. |

### 29.5 Web — `frontend/src/pages/Averias.jsx`

- Columna "Horómetro Atención" en la tabla (muestra `horometroAtencion`).
- Columna "Días Inactivo" calculada desde `diasInactividad` del DTO.

### 29.6 Pruebas

- `AveriaServiceTest` — 12/12 (incluye: atender exige horómetro, valida `>=` reportado, calcula días).
- `AtenderAveriaScreen.test.js` (nuevo) — 3/3 (requiere mocks de tema con `action.secondary` y `LoadingScreen`).

### 29.7 Validación E2E (producción local Docker)

| Paso | Resultado |
|---|---|
| Reportar avería (fecha `2026-06-30T10:30-05:00`, horómetro `12800.5`) | BD guarda la fecha reportada (no `now`) y el horómetro |
| Atender con `horometroAtencion=12800.5` (igual al reportado) | `400` (debe ser `>` al reportado) |
| Atender con `horometroAtencion=12900.5` | `200`, `fechaHoraAtencion = now`, `dias_inactividad = 41` |
| Limpieza | Avería 19 eliminada, equipo 12 restaurado a `AVERIADO` |

### 29.8 Archivos Modificados/Creados

| Archivo | Acción |
|---|---|
| `backend/.../entity/Averia.java` | Modificado |
| `backend/.../dto/AveriaDTO.java` | Modificado |
| `backend/.../mapper/AveriaMapper.java` | Modificado |
| `backend/.../service/AveriaService.java` | Modificado |
| `backend/.../db/migration/V22__averias_horometro.sql` | Nueva |
| `backend/.../db/migration/V25__averias_horometro_atencion.sql` | Nueva |
| `backend/.../test/service/AveriaServiceTest.java` | Modificado (12 tests) |
| `mobile/src/screens/AtenderAveriaScreen.js` | Modificado |
| `mobile/src/__tests__/AtenderAveriaScreen.test.js` | Nuevo (3 tests) |
| `frontend/src/pages/Averias.jsx` | Modificado |

## 30. Trazabilidad de usuario desde JWT en todos los CRUD (2026-08-10)

### 30.1 Problema

Todos los `Resource` usaban el patrón `dto.getUsuarioCreacion() != null ? ... : 1L` en los services, pero los controllers **no inyectaban el usuario del JWT**. Como los clientes nunca envían `usuarioCreacion`/`usuarioActualizacion`, el fallback `1L` (Super Admin) se disparaba siempre. Verificación en BD: todas las averías y equipos tenían `usuario_creacion = 1` y `usuario_actualizacion = 1`, aun cuando el operador real era un usuario distinto (p.ej. José Anyarín, id 17).

### 30.2 Solución — usuario tomado del token, inmutable por el cliente

Cada controller inyecta `@Context SecurityContext context` en `crear`/`actualizar` y asigna el id del JWT al DTO/Request antes de delegar al service:

```java
dto.setUsuarioCreacion(SecurityUtil.getUsuarioId(context));      // crear
dto.setUsuarioActualizacion(SecurityUtil.getUsuarioId(context)); // actualizar
```

`SecurityUtil.getUsuarioId(context)` lee el `subject` del `JsonWebToken` (id numérico del usuario autenticado). El service mantiene el fallback `1L` solo como defensa para llamadas internas/sin token, pero en el flujo HTTP el id siempre viene del JWT.

### 30.3 Controllers corregidos (11 + soporte OsrRequest)

| Controller | `crear` | `actualizar` |
|---|---|---|
| `AveriaResource` | ✅ | ✅ |
| `EquipoResource` | ✅ (nuevo) | ✅ (ya existía) |
| `CampanaResource` | ✅ | ✅ |
| `MarcaResource` | ✅ | ✅ |
| `MotivoPsrResource` | ✅ | ✅ |
| `ProveedorResource` | ✅ | ✅ |
| `RolResource` | ✅ | ✅ |
| `SedeResource` | ✅ | ✅ |
| `TipoEquipoResource` | ✅ | ✅ |
| `UsuarioResource` | ✅ | ✅ |
| `PsrResource` | ✅ (PsrRequest; también setea `osr.usuarioActualizacion`) | ✅ |
| `OsrResource` | ✅ (OsrRequest) | — (solo crear) |

`OsrRequest` no tenía campos de usuario: se añadió `usuarioCreacion` + getter/setter, y `OsrService.crear` dejó de hardcodear `1L` para leer `request.getUsuarioCreacion() != null ? ... : 1L`.

> Los endpoints de evidencias (`AveriaResource.subirEvidencia`, `DevolucionEquipoResource`, `IngresoEquipoResource`) **ya** pasaban `SecurityUtil.getUsuarioId(context)` explícitamente, por lo que sus registros sí quedaban correctos. Este hito cierra la brecha en los CRUD transaccionales.

### 30.4 Pruebas

| Test | Resultado |
|---|---|
| `AveriaResourceTest` (nuevo) | 3/3 — crear asigna usuario del token, actualizar asigna usuario del token, sin token → null |
| `EquipoResourceTest` (nuevo) | 2/2 — crear/actualizar asignan usuario del token |
| Suite backend completa | **74 tests, 0 fallos**, 1 error pre-existente (`MarcaResourceTest` @QuarkusTest requiere env OIDC), 1 skipeado |

### 30.5 Validación E2E (producción local Docker)

Autenticado como usuario **23** (Carla Huamanorqque):

| Operación | Resultado BD |
|---|---|
| `POST /averias` (crear avería 19) | `fac_averias.usuario_creacion = 23` |
| `PUT /averias/19` (atender) | `fac_averias.usuario_actualizacion = 23` |
| `POST /equipos` (crear equipo 18) | `fac_equipos.usuario_creacion = 23` |
| `PUT /equipos/18` (actualizar) | `fac_equipos.usuario_actualizacion = 23` |

> Con el login real de José Anyarín (id 17) todos los registros quedan a su nombre. Los registros históricos (ya con `usuario_creacion = 1`) **no se modificaron**: el fix es hacia adelante.

Datos de prueba limpiados (avería 19 y equipo 18 eliminados).

### 30.6 Archivos Modificados/Creados

| Archivo | Acción |
|---|---|
| `controller/AveriaResource.java` | Modificado |
| `controller/EquipoResource.java` | Modificado |
| `controller/CampanaResource.java` | Modificado |
| `controller/MarcaResource.java` | Modificado |
| `controller/MotivoPsrResource.java` | Modificado |
| `controller/ProveedorResource.java` | Modificado |
| `controller/RolResource.java` | Modificado |
| `controller/SedeResource.java` | Modificado |
| `controller/TipoEquipoResource.java` | Modificado |
| `controller/UsuarioResource.java` | Modificado |
| `controller/PsrResource.java` | Modificado |
| `controller/OsrResource.java` | Modificado |
| `dto/OsrRequest.java` | Modificado (`usuarioCreacion`) |
| `service/OsrService.java` | Modificado (lee de request, no hardcodea 1L) |
| `test/.../controller/AveriaResourceTest.java` | Nuevo (3 tests) |
| `test/.../controller/EquipoResourceTest.java` | Nuevo (2 tests) |

## 31. Migraciones de soporte V21–V25 (2026-08-09 / 2026-08-10)

| Archivo | Contenido |
|---|---|
| `V21__evidencia_horometro_inicial.sql` | Amplía `chk_evidencia_ingreso_tipo` para aceptar `HOROMETRO_INICIAL` como tipo de evidencia de ingreso. |
| `V23__superadmin_protegido.sql` | Corrige `rol_id` del Super Admin seed a 1 y crea trigger `proteger_super_admin` que impide eliminarlo, cambiar su rol/estado/id_microsoft/nombre/correo. |
| `V24__backfill_horometro_inicio.sql` | Completa `horometro_inicio` NULL en `fac_equipos` con un valor aleatorio entre 1234.5 y 24345.6 (bug: `IngresoEquipoService.applyData` no persistía horómetros en borradores). |

(V22 y V25 documentadas en la sección 29.)

## 32. UX de operación — mayúsculas, layout de averías y fecha/hora de atención (HDT-012, 2026-08-11)

### 32.1 Identificadores en mayúsculas

| Pantalla | Campo(s) | Cambio |
|---|---|---|
| `CreatePsrScreen.js` | Número PSR | `toUpperCase` en `onChangeText` + `autoCapitalize="characters"`; payload con `.trim().toUpperCase()` |
| `EquipmentFormScreen.js` | Código, modelo, serie principal | `toUpperCase` en `onChangeText` + `autoCapitalize="characters"` |
| `EquipmentFormScreen.js` | Series de accesorios | `toUpperCase` + `autoCapitalize="characters"` |
| `utils/equipmentForm.js` | `toEquipmentPayload` | Normaliza a mayúsculas `codigo`, `numeroSerie`, `modelo`, `numeroGuiaRemision` y todas las series de accesorios (defensa en la capa de payload) |

### 32.2 Utilidad compartida `mobile/src/utils/dateTime.js` (nuevo)

Extraída de `RegistrarAveriaScreen` para reutilizarla en la atención:

| Función | Salida |
|---|---|
| `formatDateTime(date)` | `dd/MM/yyyy - HH:mm:ss` (retorna `''` si la fecha es inválida) |
| `parseToISO(displayDate)` | `yyyy-MM-ddTHH:mm:ss-05:00` (timezone `America/Lima`); default `now` si el formato es inválido |

### 32.3 Layout de averías en el detalle de equipo — `EquipoDetailScreen.js`

- Fecha de reporte **→** fecha de atención (`formatAveriaDateTime`, `dd/MM/yyyy HH:mm`).
- Nueva línea `Horómetro: <reporte> — <atención>` (2 decimales, `formatAveriaHorometro`).
- Separación visual entre fecha/horómetro y descripción.

### 32.4 Fecha y hora de atención editable — `AtenderAveriaScreen.js` + backend

| Archivo | Cambio |
|---|---|
| `AtenderAveriaScreen.js` | Campo "Fecha y hora de atención" (default `now`, editable mientras la avería no esté `ATENDIDA`); se envía `fechaHoraAtencion` como ISO. |
| `service/AveriaService.java` | `actualizar` usa `dto.getFechaHoraAtencion()` si viene (si no, `now`); `validateFechaHoraAtencion` → `400` si la atención es anterior a la fecha de la avería. |

**Pruebas**: `AveriaServiceTest` y `AtenderAveriaScreen.test.js` ampliados. `RegistrarAveriaScreen.js` refactorizado para usar `dateTime.js`.

## 33. Sync `motivos_psr → tipos_equipo` find-or-create (HDT-012, 2026-08-11)

### 33.1 Problema

Los **motivos de PSR** y los **tipos de equipo** describen conceptos que en la práctica coinciden (p.ej. "Daño por manipulación"). El usuario pidió que al crear un motivo con su **nombre corto**, ese nombre quede registrado automáticamente como **tipo de equipo**, sin duplicar catálogos manualmente.

### 33.2 Decisión

Sync **unidireccional y solo en crear**: si ya existe un `tipos_equipo` con el mismo nombre (case-insensitive) se reutiliza; si no, se crea. Editar/eliminar el motivo no afecta `tipos_equipo`.

| Archivo | Cambio |
|---|---|
| `repository/TipoEquipoRepository.java` | Nuevo `findByNombre` → `find("lower(nombre) = lower(?1)", nombre)`. |
| `service/MotivoPsrService.java` | Inyecta `TipoEquipoRepository`; `crear` persiste el motivo y llama `sincronizarTipoEquipo(nombreCorto, usuario)` (find-or-create; `nombreCorto` vacío → no sincroniza). |
| `mobile/src/screens/MotivosPsrScreen.js` | Campos: `nombre` (Nombre completo, obligatorio, mayúsculas) + `nombreCorto` (Nombre corto, obligatorio, mayúsculas). |
| `mobile/src/screens/CatalogScreen.js` | Soporta flag `uppercase` por campo (`autoCapitalize="characters"` + `toUpperCase`). |

### 33.3 Validación E2E (producción local Docker)

- `POST /motivos-psr { nombre: "PRUEBA AUTOMATIZADA E2E", nombreCorto: "PRUEBA E2E" }` → motivo id 14 + `tipos_equipo` id 10 creados.
- Segundo `POST` con otro nombre y el mismo nombre corto → solo motivo id 15; `tipos_equipo` **no se duplica** (find-or-create OK).
- Datos de prueba eliminados.

**Pruebas**: `MotivoPsrServiceTest` 7/7 (3 nuevos) + `CatalogScreensConfig.test.js` actualizado.

## 34. Evidencias de ingreso ampliadas y máximo 5 fotos por avería (HDT-012, 2026-08-11)

### 34.1 Problema

El ingreso solo exigía guía de remisión y horómetro inicial; faltaban las **4 vistas del equipo** y el **extintor**. Las averías admitían máximo 3 fotos.

### 34.2 Solución

| Archivo | Cambio |
|---|---|
| `V26__averia_evidencias_max_5.sql` | `chk_numero_foto_averia` → `numero_foto BETWEEN 1 AND 5`. |
| `V28__evidencia_extintor.sql` | `EXTINTOR` aceptado en checks de ingreso y devolución. |
| `entity/TipoEvidenciaIngreso.java` | Nuevo valor `EXTINTOR`. |
| `service/AveriaService.java` | `MAX_FOTOS` 3 → **5**. |
| `service/IngresoEquipoService.java` | `BASE_REQUIRED` + 4 vistas; `requiredEvidence` + `EXTINTOR` si el equipo lo tiene. |
| `utils/equipmentForm.js` | `evidenceTypes`/`baseRequiredEvidence` + 4 vistas y extintor. |
| `EquipmentPhotosScreen.js` | Guía + horómetro + 4 vistas obligatorias + accesorios; botones obligatorios prefijados `*`. |

## 35. Evidencias de devolución por accesorios (HDT-012, 2026-08-11)

### 35.1 Problema

Al devolver un equipo solo se exigían las 4 vistas de devolución; los **accesorios con los que ingresó** no tenían evidencia de devolución.

### 35.2 Solución

| Archivo | Cambio |
|---|---|
| `V27__devolucion_evidencias_accesorios.sql` | `chk_evidencia_devolucion_tipo` ampliado a 11 accesorios. |
| `entity/TipoEvidenciaDevolucion.java` | Enumerado ampliado (extintor, baterías, cono, botiquín, cargador, transformador, cable, mesa de rodillos, elevador, conector). |
| `service/DevolucionEquipoService.java` | `evidenciaRequerida(equipo)` = vistas obligatorias + accesorios marcados en el equipo; al devolver actualiza `usuario_actualizacion`/`fecha_actualizacion` en cada evidencia. |
| `DevolucionEquipoScreen.js` | Grid dinámico: vistas de devolución + accesorios del equipo. |
| `utils/equipmentForm.js` | `extintor` con `evidence: 'EXTINTOR'`. |

**Pruebas**: `DevolucionEquipoServiceTest` + `DevolucionEquipoScreen.test.js` ampliados.

## 36. Contraseña de exactamente 8 dígitos (DNI) (HDT-012, 2026-08-11)

| Archivo | Cambio |
|---|---|
| `dto/ChangePasswordRequest.java` | `@Size(min=8)` → `@Pattern(regexp = "^\\d{8}$")`. |
| `service/LocalAuthService.java` | `changePassword` valida `matches("\\d{8}")`; `usuarios-by-rol` expone `passwordResetRequired`. |
| `PasswordChangeScreen.js` | `keyboardType="number-pad"`, `maxLength=8`, filtro `[^0-9]`, validación de 8 dígitos. |
| `LoginScreen.js` | Contraseña numérica de 8 dígitos; autocompleta `00000000` cuando `passwordResetRequired`. |

**Pruebas**: `LocalAuthServiceTest` ampliado, `PasswordChangeScreen.test.js` actualizado, `LoginScreen.test.js` nuevo.

## 37. PSR/OSR finalizado read-only (HDT-012, 2026-08-11)

### 37.1 Problema

Con un equipo **devuelto** (`DEVUELTO`), su PSR/OSR quedaba históricamente finalizado pero la app seguía permitiendo editarlo, eliminarlo o agregar OSR.

### 37.2 Solución

| Archivo | Cambio |
|---|---|
| `dto/PsrDTO.java` | Campo `finalizado` (`Boolean`). |
| `service/PsrService.java` | `enriquecerDto` setea `finalizado` según el estado del equipo asociado; `estaFinalizado(psr)` bloquea `actualizar`/`eliminar` con `409`. |
| `PsrOsrScreen.js` | Chip `FINALIZADO`; editar/eliminar/agregar OSR deshabilitados (iconos apagados, handlers no-op). |

**Pruebas**: `PsrServiceTest` ampliado.

## 38. Fix trigger Super Admin (V29) (HDT-012, 2026-08-11)

### 38.1 Problema (bug latente 🟠 Alto)

`V23` creó `proteger_super_admin()` con `RETURN NEW`. En un `BEFORE DELETE`, `NEW` es `NULL` y retornar `NULL` **cancela el borrado de cualquier fila**, no solo del Super Admin: `DELETE /usuarios/{id}` respondía `200` pero la fila seguía en BD.

### 38.2 Solución — `V29__fix_trigger_superadmin_delete.sql`

`CREATE OR REPLACE FUNCTION proteger_super_admin()`:
- En `DELETE` devuelve **`OLD`** (el borrado procede).
- Solo el seed (`id_microsoft = 'seed-superadmin'`) sigue protegido con `RAISE EXCEPTION` (no eliminable; rol/estado/nombre/correo inmutables).

### 38.3 Validación E2E (producción local Docker)

| Operación | Resultado |
|---|---|
| `DELETE /usuarios/{usuario normal}` | `DELETE 1` (fila eliminada) |
| `DELETE /usuarios/1` (seed) | `RAISE EXCEPTION` "El usuario Super Admin no puede ser eliminado" |
| `flyway_schema_history` | versión 29 aplicada con éxito |

---

## 39. Notificaciones push ampliadas — plantilla nueva y 3 eventos operativos (HDT-013, 2026-08-13)

### 39.1 Contexto

Hasta HDT-012 el único push era `INGRESO_EQUIPO` (al finalizar el ingreso de un equipo). Se amplía a los 4 eventos y se rediseña la plantilla del mensaje.

Plantilla (body de la notificación):

```
Evento: Nuevo ingreso de Equipo
Proveedor: ACME S.A.C. - Codigo: EQ-001
Registrado por: JUAN PEREZ
```

### 39.2 Backend

| Archivo | Cambio |
|---|---|
| `mapper/NotificacionPushMapper.java` | Constantes `TIPO_INGRESO_EQUIPO`, `TIPO_AVERIA_REPORTADA`, `TIPO_AVERIA_ATENDIDA`, `TIPO_SERVICIO_FINALIZADO`. 4 métodos públicos sobre un método privado `mensaje(...)` que arma `notification.title/body` y `data.tipo/entidadId`. `data.entidadId` = `equipo.getId()`. |
| `service/NotificacionPushService.java` | Refactor genérico: `notificar(equipo, usuarioOrigen, tipo)`, `emitir(tipo, proveedor, codigo, usuario, equipoId, tokens)`, `buildMessage(...)`. Reemplaza `MarcaRepository` por `ProveedorRepository` (la plantilla muestra `proveedor.razonSocial`). 4 métodos públicos (`notificarIngresoEquipo`, `notificarAveriaReportada`, `notificarAveriaAtendida`, `notificarServicioFinalizado`). Envío asíncrono en hilo daemon `fcm-notifier`; fallo de un token no afecta al resto. |
| `service/AveriaService.java` | Inyecta `NotificacionPushService`. `crear()` → `notificarAveriaReportada` (equipo `AVERIADO`). `actualizar()` primera atención → `notificarAveriaAtendida` (equipo `OPERATIVO`, respetando equipos devueltos). |
| `service/DevolucionEquipoService.java` | Inyecta `NotificacionPushService`. `finalizar()` → `notificarServicioFinalizado` (equipo `DEVUELTO`). |

### 39.3 Mobile

| Archivo | Cambio |
|---|---|
| `mobile/src/navigation/AppNavigator.js` | `navigateFromNotification` navega a `EquipoDetail` con `data.entidadId` para los 4 `tipo` (`INGRESO_EQUIPO`, `AVERIA_REPORTADA`, `AVERIA_ATENDIDA`, `SERVICIO_FINALIZADO`). |
| `mobile/src/push.js` | `require('@react-native-firebase/messaging')` sin `.default` → elimina warnings de API deprecada v22. |
| `mobile/package.json` | `start` con `--host 10.13.18.71 --port 6109` (Metro accesible desde los cels) + script `reverse` (`adb reverse tcp:6109 tcp:6109`). |

### 39.4 Pruebas

| Suite | Resultado |
|---|---|
| Backend unit (excl. `MarcaResourceTest`) | **109/109** ✅ |
| Mobile Jest | **80/80** ✅ |
| Mobile ESLint | 0 errores ✅ |

### 39.5 Despliegue y build

- Backend Docker reconstruido (`apilamiento-backend` UP, health `UP`).
- APK **local Gradle** (sin Expo/EAS): `android:debug` → `app-debug.apk`, `android:release` → `app-release.apk`. Versión `1.10.0`.
- `AGENTS.md` corregido (secciones 2, 4.4, 6, 7, 12): el proyecto es **React Native CLI puro**, build local Gradle; guía legada `07_build_android_eas.md` marcada obsoleta, nueva guía `07_build_android_gradle.md`.




---

## 40. Fix CRUD catálogos: DELETE con validación de referencias (2026-08-18)

### 40.1 Contexto

Al intentar eliminar una marca/proveedor referenciado por equipos, el backend devolvía **500** (violación de FK PostgreSQL, SQLState 23503) en vez de un error amigable. Se auditó todo el CRUD de catálogos y se blindaron todos los eliminar que podían violar una restricción.

### 40.2 Cambios backend

| Service | Verificación previa al DELETE | Mensaje 409 |
|---|---|---|
| MarcaService.eliminar | EquipoRepository.listByMarcaId no vacío | marca tiene equipos asociados |
| ProveedorService.eliminar | EquipoRepository.listByProveedorId no vacío | proveedor tiene equipos asociados |
| TipoEquipoService.eliminar | EquipoRepository.listByTipoEquipoId no vacío | tipo de equipo tiene equipos asociados |
| SedeService.eliminar | PsrRepository.listBySedeId o UsuarioRepository.findBySitioId no vacíos | sede tiene PSRs o usuarios asociados |
| CampanaService.eliminar | PsrRepository.listByCampanaId no vacío | campaña tiene PSRs asociados |
| MotivoPsrService.eliminar | PsrRepository.listByMotivoId no vacío | motivo tiene PSRs asociados |
| RolService.eliminar | UsuarioRepository.findByRolId no vacío | rol tiene usuarios asociados |
| EquipoService.eliminar | AveriaRepository.listByEquipoId o OsrRepository.findByEquipoId | equipo tiene averías u OSR asociadas |
| PsrService.eliminar | OsrRepository.findByPsrId presente | PSR tiene una OSR asociada |

- Todos lanzan WebApplicationException(message, Response.Status.CONFLICT) (patrón ya usado en EquipoService.actualizar/PsrService); el ManejadorGlobalExcepciones lo transforma en **409** {success:false, errorCode:"WEB_409"}.
- Repos nuevos: PsrRepository.listByMotivoId, UsuarioRepository.findBySitioId.

### 40.3 Tests

- Ajustados por constructor: MarcaServiceTest, ProveedorServiceTest, MotivoPsrServiceTest, EquipoServiceTest, RolServiceTest.
- Nuevos: SedeServiceTest (4), CampanaServiceTest (3), TipoEquipoServiceTest (3) + casos 409 en los existentes.
- Backend unit (excl. MarcaResourceTest): **130/130** ok. (1 error pre-existente de MarcaResourceTest que exige BD + vars OIDC).

### 40.4 Verificación end-to-end

- DELETE /api/v1/marcas/18 (Bioshack, con 1 equipo) → **409** "No se puede eliminar la marca porque tiene equipos asociados".
- DELETE /api/v1/marcas/16 (sin equipos) → **200** "Marca eliminada correctamente".
- Backend Docker reconstruido y levantado (`apilamiento-backend` UP).

---

## 41. Desactivar/Activar catálogos desde UI — soft delete (2026-08-18)

### 41.1 Contexto

Con el fix de la sección 40, los registros referenciados ya no se pueden eliminar (409). Como alternativa al borrado, los catálogos soportan el **soft delete** mediante el campo `estadoActivo` (columna ya existente, default `true`). El backend ya lo soporta: `PUT /api/v1/{recurso}/{id}` con `{"estadoActivo": false|true}` actualiza el estado en todos los servicios de catálogo (`if (dto.getEstadoActivo() != null)`). La tarea fue exponerlo en la UI web y mobile.

### 41.2 Cambios frontend web

En `Marcas.jsx`, `Proveedores.jsx`, `TiposEquipo.jsx`, `Sedes.jsx` y `MotivosPsr.jsx`:

- Nuevo botón toggle en las acciones de cada fila: `ToggleOn` (verde, activo → Desactivar) / `ToggleOff` (gris, inactivo → Activar), patrón consistente con el Activar/Cerrar de Campañas.
- `handleToggle(item)` envía `PUT /{recurso}/{id}` con los campos mínimos del DTO (nombre/razónSocial/ruc/descripcion/nombreCorto) + `estadoActivo` invertido, recarga la lista.
- Se mantienen los Chips "Activo/Inactivo" existentes en tabla y card.

### 41.3 Cambios mobile

En `CatalogScreen.js` (afecta Marcas, Proveedores, TiposEquipo, Sedes, Motivos PSR y Roles):

- Nuevo botón toggle (`toggle-switch` / `toggle-switch-off-outline`) al lado de eliminar, visible solo con `canEdit`.
- `handleToggleEstado(item)` confirma vía Alert y envía `PUT /{endpoint}/{id}` con los campos del config `fields` + `estadoActivo` invertido.
- Indicador "Inactivo" (color warning) en la card cuando `estadoActivo === false`.

### 41.4 Tests

- `CatalogScreen.test.js`: +2 tests (desactivar con `estadoActivo=false` y reactivar mostrando "Inactivo" con `estadoActivo=true`), mock `put` agregado.
- Suite mobile: **22 suites / 105 tests** OK + ESLint limpio.
- Frontend web: `vite build` OK (820 módulos). (El `jest` web falla por una causa pre-existente: `setup.js` bajo `__tests__` se ejecuta como archivo de test y `@testing-library/jest-dom` no encuentra `expect`; no está relacionado con este cambio.)

### 41.5 Despliegue

- Web: rebuild de la imagen `apilamiento-nginx` (multi-stage node:20-alpine → `npm run build` → nginx).
- Mobile: bump patch → **1.11.1** (versionCode 11101) y rebuild APK release con Gradle local.

## 42. PSR 1:N OSR — múltiples OSR por PSR (HDT-015, 2026-08-26)

### 42.1 Contexto
Una PSR (Pedido de Servicio) solo podía tener 1 OSR (Orden de Servicio). El área solicita PSRs con N OSRs (ilimitado: 1..15+), cada OSR con su propio número, costo/moneda y equipo. El PSR se considera **FINALIZADO** solo cuando **todas** sus OSRs están con equipo `DEVUELTO`; con x/N devueltas queda **PARCIAL**.

### 42.2 Backend

| Archivo | Cambio |
|---|---|
| `db/migration/V32__psr_multiples_osr.sql` | `DROP CONSTRAINT fac_osr_psr_id_key` (UNIQUE) + índice `psr_numero`. `numero_osr` sigue `UNIQUE` global. |
| `entity/Osr.java` | `@Column(psr_id) unique=true` → sin unique. |
| `repository/OsrRepository.java` | `listByPsrId`, `listByPsrIdForUpdate`, `countByPsrId`. Mantiene `findByPsrId` para compat. |
| `dto/PsrDTO.java` | `List<OsrDTO> osrs` + `estadoPsr` (ACTIVO/PARCIAL/FINALIZADO) + `osrsTotal/osrsFinalizadas`. `osr` deprecated alias al primero. |
| `dto/OsrDTO.java` | Campos equipo: `equipoId`, `estadoEquipo`, `marca`, `modelo`, `grr`, `finalizado`. |
| `dto/IngresoEquipoRequest.java` | Nuevo campo `osrId` (opcional, para seleccionar OSR específica). |
| `mapper/OsrMapper.java` | Mapea `equipoId`. |
| `service/PsrService.java` | `toDTO` lista `osrs` y enriquece cada una con equipo (marca/modelo/grr/finalizado), calcula `estadoPsr`/`finalizado` por `allMatch`. `estaFinalizado`=todas DEVUELTO. `tieneOsrConEquipo` para `eliminar` (bloquea solo si alguna OSR tiene equipo; vacías se borran en cascada). `actualizar` edita primera OSR por compat. |
| `service/OsrService.java` | Permite N OSR por PSR (elimina `409 ya tiene OSR`). `listarPorPsrId`, `buscarPorId`, `actualizar(PUT /osr/{id})`, `eliminar(DELETE /osr/{id})` con guard `equipoId!=null →409`. |
| `controller/OsrResource.java` | `GET /osr/{id}`, `GET /osr/por-psr/{id}` (lista), `GET /por-psr/{id}/unica` (compat), `POST /osr`, `PUT /osr/{id}`, `DELETE /osr/{id}`. |
| `service/IngresoEquipoService.java` | `listarPsrPendientes` itera `psr × osrs` (1 fila por OSR disponible). `crearBorrador` recibe `osrId`; si no viene y hay >1 disponible exige especificar OSR. |

### 42.3 Mobile

| Pantalla | Cambio |
|---|---|
| `PsrOsrScreen.js` | Card PSR con `StatusChip 1/3 Finalizadas`, lista de OSRs con costo/equipo/estado y acciones por OSR (editar/eliminar). `Agregar OSR` siempre visible si no FINALIZADO. Filtro busca en `numeroPsr` + todos `osr.numeroOsr`. |
| `CreatePsrScreen.js` | Modos `osr` (crear) + `editOsr` (PUT /osr/{id} costo/moneda). `numeroOsr` upperCase, editable solo al crear. PSR edit mantiene inline de primera OSR. |
| `SelectPsrEquipmentScreen.js` | `keyExtractor` por `osrId`, selección por OSR, `continueFlow` navega con `osrId`. |
| `EquipmentFormScreen.js` | `POST /ingresos-equipo/borradores` envía `osrId` además de `psrId`. |

### 42.4 Validación

| Área | Resultado |
|---|---|
| Backend | `PsrServiceTest` 7 tests (nuevo parcial), `OsrServiceTest` 3 tests, `IngresoEquipoServiceTest` 8 tests (incluye múltiples OSR por PSR) |
| Mobile | `npm run lint` sin errores (PsrOsrScreen, CreatePsrScreen, SelectPsrEquipmentScreen, EquipmentFormScreen) |
| Compatibilidad | PSRs históricos con 1 OSR siguen mostrando `osr` singular; `GET /psr` retorna `osrs[]` + `osr` alias. |

### 42.5 Archivos Modificados/Creados
| Archivo | Acción |
|---|---|
| `backend/.../db/migration/V32__psr_multiples_osr.sql` | Nuevo |
| `backend/.../entity/Osr.java` | Modificado |
| `backend/.../repository/OsrRepository.java` | Modificado |
| `backend/.../dto/PsrDTO.java` | Modificado |
| `backend/.../dto/OsrDTO.java` | Modificado |
| `backend/.../dto/IngresoEquipoRequest.java` | Modificado |
| `backend/.../mapper/OsrMapper.java` | Modificado |
| `backend/.../service/PsrService.java` | Modificado |
| `backend/.../service/OsrService.java` | Modificado |
| `backend/.../service/IngresoEquipoService.java` | Modificado |
| `backend/.../controller/OsrResource.java` | Modificado |
| `backend/.../test/service/PsrServiceTest.java` | Modificado |
| `backend/.../test/service/OsrServiceTest.java` | Modificado |
| `backend/.../test/service/IngresoEquipoServiceTest.java` | Modificado |
| `mobile/src/screens/PsrOsrScreen.js` | Modificado (lista 1:N) |
| `mobile/src/screens/CreatePsrScreen.js` | Modificado (editOsr) |
| `mobile/src/screens/SelectPsrEquipmentScreen.js` | Modificado (osrId) |
| `mobile/src/screens/EquipmentFormScreen.js` | Modificado (osrId) |
| `mobile/src/constants/versionHistory.js` | Modificado (1.12.0) |
| `mobile/package.json` / `android/app/build.gradle` | Bump minor 1.12.0 (11200) |
