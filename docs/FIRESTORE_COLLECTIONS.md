# 🗄️ Definición de Estructura de Colecciones y Documentos - Firestore

## 📋 Estructura Completa de Firestore

Esta es la definición **completa y definitiva** de todas las colecciones y documentos que se utilizarán en Firestore.

---

## 🏗️ Jerarquía de Colecciones

```
Firestore Root
│
├── stations/                                    [COLLECTION]
│   └── {stationId}/                            [DOCUMENT]
│       └── controllers/                        [SUBCOLLECTION]
│           └── {controllerId}/                 [DOCUMENT]
│               └── locks/                      [SUBCOLLECTION]
│                   └── {lockId}/                [DOCUMENT]
│                       ├── telemetry/           [SUBCOLLECTION]
│                       ├── events/              [SUBCOLLECTION]
│                       └── commands/            [SUBCOLLECTION]
│
└── commands_index/                            [COLLECTION]
    └── {reqId}/                                [DOCUMENT]
```

---

## 📝 Definición Detallada de Colecciones y Documentos

### 1. **COLLECTION: `stations`**

#### **Document Path:** `stations/{stationId}`

**ID del Documento:** `stationId` (string) - Ejemplo: `"st-colima-0001"`

**Campos del Documento:**

| Campo        | Tipo        | Requerido | Descripción           |
| ------------ | ----------- | --------- | --------------------- |
| `name`       | `string`    | No        | Nombre de la estación |
| `created_at` | `Timestamp` | Sí        | Fecha de creación     |

**Ejemplo:**

```json
{
  "name": "Estación Colima 0001",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 2. **SUBCOLLECTION: `stations/{stationId}/controllers`**

#### **Document Path:** `stations/{stationId}/controllers/{controllerId}`

**ID del Documento:** `controllerId` (string) - Ejemplo: `"ctrl-07f3a2"`

**Campos del Documento:**

| Campo          | Tipo                | Requerido | Valores Permitidos                   | Descripción                  |
| -------------- | ------------------- | --------- | ------------------------------------ | ---------------------------- |
| `station_id`   | `string`            | Sí        | -                                    | ID de la estación padre      |
| `fw`           | `string \| null`    | No        | -                                    | Versión de firmware          |
| `hw`           | `string \| null`    | No        | -                                    | Versión de hardware          |
| `last_status`  | `string`            | Sí        | `"online"`, `"offline"`, `"unknown"` | Estado de conectividad       |
| `last_seen_at` | `Timestamp \| null` | No        | -                                    | Última vez que se vio online |
| `created_at`   | `Timestamp`         | Sí        | -                                    | Fecha de creación            |

**Ejemplo:**

```json
{
  "station_id": "st-colima-0001",
  "fw": "1.2.3",
  "hw": "2.1",
  "last_status": "online",
  "last_seen_at": "2024-01-15T12:45:00Z",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 3. **SUBCOLLECTION: `stations/{stationId}/controllers/{controllerId}/locks`**

#### **Document Path:** `stations/{stationId}/controllers/{controllerId}/locks/{lockId}`

**ID del Documento:** `lockId` (string) - Ejemplo: `"lock-001"`

**Campos del Documento:**

| Campo           | Tipo             | Requerido | Valores Permitidos       | Descripción                         |
| --------------- | ---------------- | --------- | ------------------------ | ----------------------------------- |
| `controller_id` | `string`         | Sí        | -                        | ID del controlador padre            |
| `position`      | `string \| null` | No        | -                        | Posición física del cerrojo         |
| `last_state`    | `string \| null` | No        | `"locked"`, `"unlocked"` | Estado actual del cerrojo           |
| `last_seq`      | `number \| null` | No        | -                        | Último número de secuencia recibido |
| `last_battery`  | `number \| null` | No        | 0-100                    | Último nivel de batería reportado   |
| `last_rssi`     | `number \| null` | No        | -                        | Última señal RSSI reportada         |
| `updated_at`    | `Timestamp`      | Sí        | -                        | Fecha de última actualización       |
| `created_at`    | `Timestamp`      | Sí        | -                        | Fecha de creación                   |

**Nota:** Este documento actúa como **snapshot** del estado actual del cerrojo.

**Ejemplo:**

```json
{
  "controller_id": "ctrl-07f3a2",
  "position": "A1",
  "last_state": "locked",
  "last_seq": 12345,
  "last_battery": 85,
  "last_rssi": -45,
  "updated_at": "2024-01-15T12:45:00Z",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 4. **SUBCOLLECTION: `stations/{stationId}/controllers/{controllerId}/locks/{lockId}/telemetry`**

#### **Document Path:** `stations/{stationId}/controllers/{controllerId}/locks/{lockId}/telemetry/{telemetryId}`

**ID del Documento:** `telemetryId` (string) - Auto-generado por Firestore o timestamp

**Campos del Documento:**

| Campo           | Tipo             | Requerido | Valores Permitidos       | Descripción                              |
| --------------- | ---------------- | --------- | ------------------------ | ---------------------------------------- |
| `station_id`    | `string`         | Sí        | -                        | ID de la estación                        |
| `controller_id` | `string`         | Sí        | -                        | ID del controlador                       |
| `lock_id`       | `string`         | Sí        | -                        | ID del cerrojo                           |
| `ts`            | `number`         | Sí        | -                        | Timestamp en milisegundos (Unix epoch)   |
| `state`         | `string`         | Sí        | `"locked"`, `"unlocked"` | Estado del cerrojo                       |
| `battery`       | `number \| null` | No        | 0-100                    | Nivel de batería                         |
| `rssi`          | `number \| null` | No        | -                        | Señal RSSI                               |
| `fw`            | `string \| null` | No        | -                        | Versión de firmware                      |
| `seq`           | `number \| null` | No        | -                        | Número de secuencia (para deduplicación) |
| `created_at`    | `Timestamp`      | Sí        | -                        | Fecha de creación                        |

**Ejemplo:**

```json
{
  "station_id": "st-colima-0001",
  "controller_id": "ctrl-07f3a2",
  "lock_id": "lock-001",
  "ts": 1705322700000,
  "state": "locked",
  "battery": 85,
  "rssi": -45,
  "fw": "1.2.3",
  "seq": 12345,
  "created_at": "2024-01-15T12:45:00Z"
}
```

---

### 5. **SUBCOLLECTION: `stations/{stationId}/controllers/{controllerId}/locks/{lockId}/events`**

#### **Document Path:** `stations/{stationId}/controllers/{controllerId}/locks/{lockId}/events/{eventId}`

**ID del Documento:** `eventId` (string) - Auto-generado por Firestore o timestamp

**Campos del Documento:**

| Campo           | Tipo             | Requerido | Valores Permitidos            | Descripción                                          |
| --------------- | ---------------- | --------- | ----------------------------- | ---------------------------------------------------- |
| `station_id`    | `string`         | Sí        | -                             | ID de la estación                                    |
| `controller_id` | `string`         | Sí        | -                             | ID del controlador                                   |
| `lock_id`       | `string`         | Sí        | -                             | ID del cerrojo                                       |
| `ts`            | `number`         | Sí        | -                             | Timestamp en milisegundos (Unix epoch)               |
| `event`         | `string`         | Sí        | -                             | Tipo de evento (ej: "lock_activated", "error_motor") |
| `details`       | `object \| null` | No        | -                             | Detalles adicionales del evento (JSON)               |
| `severity`      | `string`         | Sí        | `"info"`, `"warn"`, `"error"` | Severidad del evento                                 |
| `created_at`    | `Timestamp`      | Sí        | -                             | Fecha de creación                                    |

**Ejemplo:**

```json
{
  "station_id": "st-colima-0001",
  "controller_id": "ctrl-07f3a2",
  "lock_id": "lock-001",
  "ts": 1705322700000,
  "event": "lock_activated",
  "details": {
    "reason": "user_command",
    "user_id": "user_123"
  },
  "severity": "info",
  "created_at": "2024-01-15T12:45:00Z"
}
```

---

### 6. **SUBCOLLECTION: `stations/{stationId}/controllers/{controllerId}/locks/{lockId}/commands`**

#### **Document Path:** `stations/{stationId}/controllers/{controllerId}/locks/{lockId}/commands/{reqId}`

**ID del Documento:** `reqId` (string) - ID único del comando - Ejemplo: `"7c1b3c"`

**Campos del Documento:**

| Campo           | Tipo             | Requerido | Valores Permitidos                               | Descripción                  |
| --------------- | ---------------- | --------- | ------------------------------------------------ | ---------------------------- |
| `station_id`    | `string`         | Sí        | -                                                | ID de la estación            |
| `controller_id` | `string`         | Sí        | -                                                | ID del controlador           |
| `lock_id`       | `string`         | Sí        | -                                                | ID del cerrojo               |
| `cmd`           | `string`         | Sí        | `"lock"`, `"unlock"`, `"reboot"`                 | Tipo de comando              |
| `ts_requested`  | `number`         | Sí        | -                                                | Timestamp de solicitud (ms)  |
| `timeout_ms`    | `number`         | Sí        | -                                                | Timeout en milisegundos      |
| `status`        | `string`         | Sí        | `"pending"`, `"success"`, `"error"`, `"timeout"` | Estado del comando           |
| `ts_resolved`   | `number \| null` | No        | -                                                | Timestamp de resolución (ms) |
| `error_msg`     | `string \| null` | No        | -                                                | Mensaje de error (si aplica) |
| `created_at`    | `Timestamp`      | Sí        | -                                                | Fecha de creación            |

**Ejemplo:**

```json
{
  "station_id": "st-colima-0001",
  "controller_id": "ctrl-07f3a2",
  "lock_id": "lock-001",
  "cmd": "unlock",
  "ts_requested": 1705322700000,
  "timeout_ms": 5000,
  "status": "success",
  "ts_resolved": 1705322705000,
  "error_msg": null,
  "created_at": "2024-01-15T12:45:00Z"
}
```

---

### 7. **COLLECTION: `commands_index`** (Colección Auxiliar)

#### **Document Path:** `commands_index/{reqId}`

**ID del Documento:** `reqId` (string) - Mismo ID que en la subcolección de commands

**Propósito:** Permite búsquedas rápidas por `reqId` sin conocer la ruta completa (stationId, controllerId, lockId).

**Campos del Documento:**

| Campo           | Tipo        | Requerido | Descripción        |
| --------------- | ----------- | --------- | ------------------ |
| `station_id`    | `string`    | Sí        | ID de la estación  |
| `controller_id` | `string`    | Sí        | ID del controlador |
| `lock_id`       | `string`    | Sí        | ID del cerrojo     |
| `cmd`           | `string`    | Sí        | Tipo de comando    |
| `status`        | `string`    | Sí        | Estado del comando |
| `created_at`    | `Timestamp` | Sí        | Fecha de creación  |

**Ejemplo:**

```json
{
  "station_id": "st-colima-0001",
  "controller_id": "ctrl-07f3a2",
  "lock_id": "lock-001",
  "cmd": "unlock",
  "status": "success",
  "created_at": "2024-01-15T12:45:00Z"
}
```

**Nota:** Este documento debe mantenerse sincronizado con el documento correspondiente en la subcolección `commands`.

---

## 🔗 Relaciones entre Colecciones

### **Jerarquía de Relaciones:**

```
stations (1) ──> (N) controllers
controllers (1) ──> (N) locks
locks (1) ──> (N) telemetry (histórico)
locks (1) ──> (N) events (histórico)
locks (1) ──> (N) commands (histórico)
commands ──> commands_index (1:1) - Índice auxiliar
```

### **Referencias:**

- Los documentos de `controllers` contienen `station_id` (referencia al padre)
- Los documentos de `locks` contienen `controller_id` (referencia al padre)
- Los documentos de `telemetry`, `events`, `commands` contienen `station_id`, `controller_id`, `lock_id` (referencias para consultas)

---

## 📊 Resumen de Rutas Completas

| Entidad             | Ruta Completa                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------- |
| **Estación**        | `/stations/{stationId}`                                                                   |
| **Controlador**     | `/stations/{stationId}/controllers/{controllerId}`                                        |
| **Cerrojo**         | `/stations/{stationId}/controllers/{controllerId}/locks/{lockId}`                         |
| **Telemetría**      | `/stations/{stationId}/controllers/{controllerId}/locks/{lockId}/telemetry/{telemetryId}` |
| **Evento**          | `/stations/{stationId}/controllers/{controllerId}/locks/{lockId}/events/{eventId}`        |
| **Comando**         | `/stations/{stationId}/controllers/{controllerId}/locks/{lockId}/commands/{reqId}`        |
| **Índice Comandos** | `/commands_index/{reqId}`                                                                 |

---

## 🎯 Tipos de Datos en Firestore

| Tipo Firestore | Tipo TypeScript | Descripción               |
| -------------- | --------------- | ------------------------- |
| `string`       | `string`        | Texto                     |
| `number`       | `number`        | Número (entero o decimal) |
| `boolean`      | `boolean`       | Verdadero/Falso           |
| `Timestamp`    | `Timestamp`     | Fecha y hora              |
| `null`         | `null`          | Valor nulo                |
| `object`       | `object`        | Objeto JSON anidado       |
| `array`        | `array`         | Arreglo de valores        |

---

## ✅ Reglas de Validación Implícitas

1. **IDs Únicos:**

   - `stationId` debe ser único en la colección `stations`
   - `controllerId` debe ser único dentro de `stations/{stationId}/controllers`
   - `lockId` debe ser único dentro de `stations/{stationId}/controllers/{controllerId}/locks`
   - `reqId` debe ser único en `commands_index` y en cada subcolección `commands`

2. **Referencias:**

   - `station_id` en `controllers` debe existir en `stations`
   - `controller_id` en `locks` debe existir en `stations/{stationId}/controllers`
   - `lock_id` en `telemetry`, `events`, `commands` debe existir en `stations/{stationId}/controllers/{controllerId}/locks`

3. **Deduplicación:**

   - `seq` en `telemetry` debe ser mayor que `last_seq` en el documento `lock` correspondiente

4. **Sincronización:**
   - `commands_index/{reqId}` debe estar sincronizado con `stations/{stationId}/controllers/{controllerId}/locks/{lockId}/commands/{reqId}`

---

## 📋 Checklist de Estructura

- ✅ **Colecciones definidas:** `stations`, `commands_index`
- ✅ **Subcolecciones definidas:** `controllers`, `locks`, `telemetry`, `events`, `commands`
- ✅ **Campos de documentos especificados:** Todos los campos con tipo y requerimiento
- ✅ **Tipos de datos definidos:** Tipos Firestore mapeados
- ✅ **Relaciones documentadas:** Jerarquía y referencias
- ✅ **IDs de documentos especificados:** Cómo se generan los IDs
- ✅ **Ejemplos proporcionados:** Documentos de ejemplo para cada tipo

---

**Esta es la estructura definitiva y completa de Firestore para el proyecto IotServerMQTT.**
