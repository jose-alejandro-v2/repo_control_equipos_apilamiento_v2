# HDT-012 — UX Operativo, Evidencias, Contraseña 8 dígitos, PSR/OSR Finalizado y Sync Motivos→Tipos de Equipo

| Campo | Valor |
|---|---|
| Estado | Implementado y validado |
| Fecha | 2026-08-11 |
| Responsable de desarrollo | Codex |
| Alcance | Backend Quarkus, PostgreSQL (Flyway), aplicación Android, utilidades mobile |
| Hitos incluidos | Migraciones V26–V29 · UX de operación (mayúsculas, layout averías, fecha/hora de atención) · Sync `motivos_psr → tipos_equipo` · Evidencias de ingreso/devolución ampliadas · Contraseña de 8 dígitos · PSR/OSR finalizado read-only · Fix trigger Super Admin |

---

## Objetivo

Cerrar un bloque de mejoras operativas solicitadas en campo: normalizar los identificadores a **mayúsculas** (número PSR, código, modelo, serie, guía de remisión), rediseñar el **layout de averías** en el detalle de equipo, permitir **editar la fecha y hora de atención**, sincronizar el catálogo de **motivos PSR con los tipos de equipo**, ampliar las **evidencias** de ingreso y devolución (incluyendo accesorios), exigir **contraseñas de exactamente 8 dígitos** (DNI), bloquear la edición de **PSR/OSR finalizados** y corregir el **bug del trigger** que impedía eliminar usuarios.

---

## Hito 1 — UX de operación (mayúsculas, layout de averías, fecha/hora de atención)

### Problema

- El operador podía ingresar el **número PSR** en minúsculas y los **identificadores del equipo** (código, modelo, serie, guía de remisión y series de accesorios) en cualquier caso, generando registros inconsistentes.
- El **layout de averías** en el detalle de equipo era pobre: solo mostraba la fecha de reporte y la descripción; no se veía el horómetro ni la fecha de atención.
- Al **atender una avería**, la fecha/hora de atención la fijaba el backend (`now`), sin posibilidad de corregir el momento real del servicio.

### Solución

| Archivo | Cambio |
|---|---|
| `mobile/src/screens/CreatePsrScreen.js` | `numeroPsr` se normaliza a mayúsculas en el payload y en `onChangeText` (`toUpperCase` + `autoCapitalize="characters"`). |
| `mobile/src/screens/EquipmentFormScreen.js` | Código, modelo, serie principal y series de accesorios: `toUpperCase` en `onChangeText` + `autoCapitalize="characters"`. |
| `mobile/src/utils/equipmentForm.js` | `toEquipmentPayload` normaliza a mayúsculas `codigo`, `numeroSerie`, `modelo`, `numeroGuiaRemision` y las series de accesorios. |
| `mobile/src/utils/dateTime.js` (nuevo) | Utilidad compartida `formatDateTime` (`dd/MM/yyyy - HH:mm:ss`) y `parseToISO` (`yyyy-MM-ddTHH:mm:ss-05:00`, timezone `America/Lima`). Se extrajo de `RegistrarAveriaScreen` para reutilizarla en atención. |
| `mobile/src/screens/EquipoDetailScreen.js` | Nueva tarjeta de avería: fecha de reporte **→** fecha de atención (`dd/MM/yyyy HH:mm`) y `Horómetro: reporte — atención` con 2 decimales. |
| `mobile/src/screens/AtenderAveriaScreen.js` | Campo editable "Fecha y hora de atención" (default `now`, formato `dd/MM/yyyy - HH:mm:ss`, se envía como `fechaHoraAtencion`). |
| `service/AveriaService.java` | `actualizar` usa `dto.getFechaHoraAtencion()` si viene (si no, `now`); nueva validación `validateFechaHoraAtencion` → `400` si la fecha de atención es anterior a la fecha de la avería. |
| `mobile/src/screens/RegistrarAveriaScreen.js` | Refactor: usa `dateTime.js` (se eliminan funciones duplicadas) y formatea las fotos obligatorias como `* Foto`. |

### Validación

- Mobile: suite Jest ampliada; `AtenderAveriaScreen.test.js` cubre fecha/hora de atención.
- Backend: `AveriaServiceTest` cubre la validación de fecha de atención no anterior a la avería.
- Manual: PSR/equipos guardados siempre en mayúsculas; detalle de equipo muestra reporte→atención y horómetros; atención con fecha anterior → `400`.

---

## Hito 2 — Sync `motivos_psr → tipos_equipo` (find-or-create solo en crear)

### Problema

En la práctica los **motivos de PSR** (p.ej. "Daño por manipulación") y los **tipos de equipo** describen a menudo el mismo concepto. El usuario solicitó que al crear un motivo con su **nombre corto**, ese nombre se registre automáticamente como **tipo de equipo** para no duplicar el catálogo manualmente.

### Solución (decisión del usuario)

- **Unidireccional y solo en crear**: al crear un motivo PSR con `nombre_corto`, el backend busca un `tipos_equipo` con ese nombre (case-insensitive); si existe lo reutiliza y si no, lo crea. Editar o eliminar el motivo **no** toca el tipo de equipo.

| Archivo | Cambio |
|---|---|
| `mobile/src/screens/MotivosPsrScreen.js` | Campos del diálogo: `nombre` (Nombre completo, obligatorio, mayúsculas) y `nombreCorto` (Nombre corto, obligatorio, mayúsculas). |
| `mobile/src/screens/CatalogScreen.js` | Soporta flag `uppercase` en los campos de catálogo (`autoCapitalize="characters"` + `toUpperCase` en `onChangeText`). |
| `repository/TipoEquipoRepository.java` | Nuevo `findByNombre(String)` → `find("lower(nombre) = lower(?1)", nombre)`. |
| `service/MotivoPsrService.java` | Constructor recibe `TipoEquipoRepository`; `crear` persiste el motivo y llama a `sincronizarTipoEquipo(nombreCorto, usuario)` (find-or-create). `actualizar`/`eliminar` sin cambios. |
| `test/.../service/MotivoPsrServiceTest.java` | Ampliado a **7 tests** (crea tipo_equipo cuando no existe, reutiliza el existente sin duplicar, nombre corto vacío deriva y crea). |
| `test/.../CatalogScreensConfig.test.js` | Actualizado (ambos inputs visibles, mayúsculas forzadas, payload `{ nombre, nombreCorto }`). |

### Validación E2E (producción local Docker)

- `POST /motivos-psr { nombre: "PRUEBA AUTOMATIZADA E2E", nombreCorto: "PRUEBA E2E" }` → crea motivo **id 14** + `tipos_equipo` **id 10** (`nombre = "PRUEBA E2E"`, `codigo = PRUEBA_E2E`).
- Segundo `POST` con otro nombre pero el mismo nombre corto → crea solo el motivo (id 15), el tipo de equipo **no se duplica**.
- Datos de prueba eliminados (motivos 14-15 y tipo 10).

---

## Hito 3 — Evidencias de ingreso ampliadas y máximo 5 fotos en averías

### Problema

- El ingreso de equipo solo exigía 2 evidencias (guía de remisión y horómetro inicial); faltaban las **4 vistas del equipo** (frontal, lateral izquierdo, lateral derecho, posterior) y el **extintor**.
- Las averías solo permitían 3 fotos (`MAX_FOTOS = 3`).

### Solución

| Archivo | Cambio |
|---|---|
| `db/migration/V26__averia_evidencias_max_5.sql` | `chk_numero_foto_averia` → `numero_foto BETWEEN 1 AND 5` (1-2 registro, 3 horómetro inicial, 4 horómetro de atención, 5 evidencia del servicio). |
| `db/migration/V28__evidencia_extintor.sql` | Amplía `chk_evidencia_ingreso_tipo` y `chk_evidencia_devolucion_tipo` para aceptar `EXTINTOR`. |
| `service/AveriaService.java` | `MAX_FOTOS` de 3 → **5**. |
| `entity/TipoEvidenciaIngreso.java` | Nuevo valor `EXTINTOR`. |
| `service/IngresoEquipoService.java` | `BASE_REQUIRED` ahora incluye `FRONTAL`, `LATERAL_IZQUIERDO`, `LATERAL_DERECHO`, `POSTERIOR`; `requiredEvidence` agrega `EXTINTOR` si el equipo lo tiene. |
| `mobile/src/utils/equipmentForm.js` | `evidenceTypes` y `baseRequiredEvidence` ampliados con las 4 vistas y el extintor. |
| `mobile/src/screens/EquipmentPhotosScreen.js` | Botones de fotos: guía, horómetro inicial, **4 vistas obligatorias** y accesorios (extintor incluido). |

---

## Hito 4 — Evidencias de devolución por accesorios

### Problema

Al devolver un equipo solo se exigían las **4 vistas de devolución**; los **accesorios con los que ingresó el equipo** (extintor, baterías, conos, etc.) no tenían evidencia de devolución, perdiéndose la verificación de que regresaron completos.

### Solución

| Archivo | Cambio |
|---|---|
| `db/migration/V27__devolucion_evidencias_accesorios.sql` | `chk_evidencia_devolucion_tipo` ampliado a los 11 accesorios (baterías, cono, botiquín, cargador, transformador, cable, mesa de rodillos, elevador, conector). (V28 añade luego `EXTINTOR`.) |
| `entity/TipoEvidenciaDevolucion.java` | Enumerado ampliado con los accesorios. |
| `service/DevolucionEquipoService.java` | Nuevo `evidenciaRequerida(equipo)`: vistas obligatorias + accesorios marcados en el equipo; al devolver, además actualiza `usuario_actualizacion`/`fecha_actualizacion` en cada evidencia. |
| `mobile/src/screens/DevolucionEquipoScreen.js` | Grid dinámico: vistas de devolución + accesorios del equipo (con su evidencia). |
| `mobile/src/utils/equipmentForm.js` | `extintor` ahora tiene `evidence: 'EXTINTOR'`. |
| `test/.../DevolucionEquipoServiceTest.java` | Ampliado (evidencias por accesorios). |

---

## Hito 5 — Contraseña de exactamente 8 dígitos (DNI)

### Problema

La contraseña podía tener 8+ caracteres alfanuméricos; la política operativa es usar el **DNI (8 dígitos)** como contraseña.

### Solución

| Archivo | Cambio |
|---|---|
| `dto/ChangePasswordRequest.java` | `@Size(min=8)` → `@Pattern(regexp = "^\\d{8}$")` ("debe tener exactamente 8 dígitos numéricos"). |
| `service/LocalAuthService.java` | `changePassword` valida `newPassword.matches("\\d{8}")`; `usuarios-by-rol` expone `passwordResetRequired` en el payload. |
| `mobile/src/screens/PasswordChangeScreen.js` | Inputs numéricos (`keyboardType="number-pad"`, `maxLength=8`, filtro `[^0-9]`), validación de exactamente 8 dígitos. |
| `mobile/src/LoginScreen.js` | Contraseña numérica de 8 dígitos; si el usuario tiene `passwordResetRequired`, autocompleta `00000000`. |
| `test/.../LocalAuthServiceTest.java` | Ampliado (validación 8 dígitos). |
| `test/.../PasswordChangeScreen.test.js` | Actualizado (8 dígitos). |
| `mobile/src/__tests__/LoginScreen.test.js` (nuevo) | Cubre autocompletado `00000000` y filtro numérico. |

---

## Hito 6 — PSR/OSR finalizado (read-only)

### Problema

Cuando un equipo era **devuelto** (`DEVUELTO`), su PSR/OSR quedaba históricamente finalizado, pero la app aún permitía **editar**, **eliminar** o **agregar OSR**, rompiendo la trazabilidad del documento.

### Solución

| Archivo | Cambio |
|---|---|
| `dto/PsrDTO.java` | Nuevo campo `finalizado` (`Boolean`). |
| `service/PsrService.java` | `enriquecerDto` setea `finalizado = true` cuando el equipo asociado está `DEVUELTO`; nuevo `estaFinalizado(psr)` que **bloquea** `actualizar` y `eliminar` con `409` ("El PSR/OSR está finalizado y no puede editarse/eliminarse"). |
| `mobile/src/screens/PsrOsrScreen.js` | Chip `FINALIZADO`, botones de editar/eliminar/agregar OSR deshabilitados y `handleEdit`/`handleAddOsr`/`handleDelete` no-op cuando `finalizado`. |
| `test/.../PsrServiceTest.java` | Ampliado (editar/eliminar finalizado → 409). |

---

## Hito 7 — Fix trigger Super Admin (V29)

### Problema (bug latente 🟠 Alto)

`V23__superadmin_protegido.sql` creó el trigger `proteger_super_admin` con `RETURN NEW`. En un `BEFORE DELETE`, `NEW` es `NULL`, y retornar `NULL` desde el trigger **cancela el borrado de CUALQUIER fila**, no solo del Super Admin. Resultado: `DELETE /usuarios/{id}` respondía `200 OK` ("eliminado") pero la fila seguía en BD (no se eliminaba ningún usuario). Afectaba el CRUD de usuarios (backend `UsuarioResource` y mobile `UsuariosScreen`).

### Solución — `db/migration/V29__fix_trigger_superadmin_delete.sql`

- `CREATE OR REPLACE FUNCTION proteger_super_admin()`:
  - Para `DELETE` se devuelve **`OLD`** (el borrado procede).
  - Solo el seed Super Admin (`id_microsoft = 'seed-superadmin'`) sigue protegido con `RAISE EXCEPTION` (no eliminable, rol/estado/nombre/correo inmutables).

### Validación E2E (producción local Docker)

| Operación | Resultado |
|---|---|
| `DELETE /usuarios/{usuario normal}` | `DELETE 1` (fila eliminada) |
| `DELETE /usuarios/1` (seed Super Admin) | `RAISE EXCEPTION` "El usuario Super Admin no puede ser eliminado" |
| `flyway_schema_history` | Versión **29** aplicada con éxito |

---

## Migraciones aplicadas (V26–V29)

| Archivo | Contenido |
|---|---|
| `V26__averia_evidencias_max_5.sql` | `chk_numero_foto_averia` → `numero_foto BETWEEN 1 AND 5`. |
| `V27__devolucion_evidencias_accesorios.sql` | `chk_evidencia_devolucion_tipo` ampliado a los 11 accesorios. |
| `V28__evidencia_extintor.sql` | `EXTINTOR` aceptado como evidencia de ingreso y de devolución (amplía checks de ambas tablas). |
| `V29__fix_trigger_superadmin_delete.sql` | Corrige `proteger_super_admin`: `RETURN OLD` en DELETE; solo el seed sigue protegido. |

> V28 reemplaza el check de devolución de V27 (mismo nombre de constraint, `DROP ... IF EXISTS` + re-`ADD`).

---

## Archivos Modificados/Creados (resumen)

### Backend

| Archivo | Acción |
|---|---|
| `dto/ChangePasswordRequest.java` | Modificado (`@Pattern ^\d{8}$`) |
| `dto/PsrDTO.java` | Modificado (`finalizado`) |
| `entity/TipoEvidenciaDevolucion.java` | Modificado (11 accesorios) |
| `entity/TipoEvidenciaIngreso.java` | Modificado (`EXTINTOR`) |
| `repository/TipoEquipoRepository.java` | Modificado (`findByNombre`) |
| `service/AveriaService.java` | Modificado (MAX_FOTOS=5, fechaHoraAtencion editable y validada) |
| `service/DevolucionEquipoService.java` | Modificado (`evidenciaRequerida`, usuario/fecha en evidencias) |
| `service/IngresoEquipoService.java` | Modificado (4 vistas + extintor requeridos) |
| `service/LocalAuthService.java` | Modificado (8 dígitos, `passwordResetRequired`) |
| `service/MotivoPsrService.java` | Modificado (sync find-or-create `tipos_equipo`) |
| `service/PsrService.java` | Modificado (`finalizado`, 409 en editar/eliminar) |
| `db/migration/V26__averia_evidencias_max_5.sql` | Nueva |
| `db/migration/V27__devolucion_evidencias_accesorios.sql` | Nueva |
| `db/migration/V28__evidencia_extintor.sql` | Nueva |
| `db/migration/V29__fix_trigger_superadmin_delete.sql` | Nueva |
| `test/.../service/AveriaServiceTest.java` | Ampliado |
| `test/.../service/DevolucionEquipoServiceTest.java` | Ampliado |
| `test/.../service/IngresoEquipoServiceTest.java` | Ampliado |
| `test/.../service/LocalAuthServiceTest.java` | Ampliado |
| `test/.../service/MotivoPsrServiceTest.java` | Ampliado (7 tests) |
| `test/.../service/PsrServiceTest.java` | Ampliado |

### Mobile

| Archivo | Acción |
|---|---|
| `src/utils/dateTime.js` | Nuevo (formatDateTime + parseToISO) |
| `src/utils/equipmentForm.js` | Modificado (mayúsculas, vistas/evidencia extintor) |
| `src/LoginScreen.js` | Modificado (contraseña 8 dígitos + autofill 00000000) |
| `src/screens/AtenderAveriaScreen.js` | Modificado (fecha/hora atención editable + 2 fotos obligatorias) |
| `src/screens/CatalogScreen.js` | Modificado (flag `uppercase`) |
| `src/screens/CreatePsrScreen.js` | Modificado (número PSR en mayúsculas) |
| `src/screens/DevolucionEquipoScreen.js` | Modificado (evidencias por accesorios) |
| `src/screens/EquipmentFormScreen.js` | Modificado (identificadores en mayúsculas) |
| `src/screens/EquipmentPhotosScreen.js` | Modificado (4 vistas obligatorias) |
| `src/screens/EquipoDetailScreen.js` | Modificado (layout averías: reporte→atención + horómetros) |
| `src/screens/MotivosPsrScreen.js` | Modificado (campo nombre corto) |
| `src/screens/PasswordChangeScreen.js` | Modificado (8 dígitos numéricos) |
| `src/screens/PsrOsrScreen.js` | Modificado (FINALIZADO read-only) |
| `src/screens/RegistrarAveriaScreen.js` | Modificado (usa dateTime.js) |
| `src/__tests__/AtenderAveriaScreen.test.js` | Ampliado |
| `src/__tests__/CatalogScreensConfig.test.js` | Actualizado |
| `src/__tests__/DevolucionEquipoScreen.test.js` | Ampliado |
| `src/__tests__/LoginScreen.test.js` | Nuevo |
| `src/__tests__/PasswordChangeScreen.test.js` | Actualizado |
| `src/__tests__/RegistrarAveriaScreen.test.js` | Actualizado |
| `src/__tests__/equipmentForm.test.js` | Ampliado |

---

## Decisiones

- **Mayúsculas por normalización**: la conversión se hace en la UI (`toUpperCase`) y de nuevo en `toEquipmentPayload` como defensa (capa de payload).
- **Sync unidireccional solo al crear**: editar/eliminar motivos no propaga cambios a `tipos_equipo`; evita efectos colaterales en catálogos ya referenciados.
- **Fecha de atención editable pero validada**: el backend rechaza (`400`) una atención anterior a la fecha de la avería.
- **Evidencias de devolución dinámicas**: se exigen las vistas + exactamente los accesorios con los que ingresó el equipo (los accesorios ausentes no se exigen).
- **Contraseña = DNI (8 dígitos)**: validación tanto en backend (`@Pattern`/service) como en mobile (teclado numérico, filtro de entrada).
- **PSR/OSR finalizado read-only**: el `409` en backend es la garantía real; la UI solo lo refleja (botones deshabilitados).
- **V29 respeta V23**: se corrige con `CREATE OR REPLACE`; la protección del seed Super Admin se mantiene intacta.

---

## Estado del sistema tras el hito

- Backend reconstruido y desplegado (`docker compose build backend && up -d backend`), health check `UP`, migraciones V26–V29 aplicadas.
- Suite backend unit: **92 tests, 0 fallos** (excluye `MarcaResourceTest`, `@QuarkusTest` que requiere base de datos viva/entorno — pre-existente).
- Suite mobile: **77 tests, 0 fallos** (19 suites) + `eslint` limpio.
- APK debug desplegado en ambos celulares (Xiaomi principal y alterno) con túneles `adb reverse tcp:6109/6111`; los cambios JS se sirven desde Metro (sin bundleInDebug).
