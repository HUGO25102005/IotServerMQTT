# 🔄 Cambios Necesarios en la API para Firestore

## 📋 Análisis de Cambios Requeridos

Este documento detalla todos los cambios necesarios en la API para migrar de MySQL a Firestore.

---

## 🎯 Resumen Ejecutivo

### **Cambios Principales:**

1. ✅ **Infraestructura de BD** - Reemplazar MySQL por Firebase Admin SDK
2. ✅ **Repositorios** - Refactorizar todos los repositorios para usar Firestore
3. ✅ **Handlers MQTT** - Actualizar para usar nuevos repositorios
4. ✅ **Controladores HTTP** - Actualizar queries SQL por queries Firestore
5. ✅ **Configuración** - Cambiar variables de entorno
6. ✅ **Dependencias** - Agregar Firebase Admin SDK

---

## 📦 1. CAMBIOS EN DEPENDENCIAS

### **Agregar:**

```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0"
  }
}
```

### **Remover (opcional, si no se usa en otro lugar):**

```json
{
  "dependencies": {
    "mysql2": "^3.15.0" // Ya no se necesita
  }
}
```

**Comando:**

```bash
npm install firebase-admin
npm uninstall mysql2  # Solo si no se usa en otro lugar
```

---

## ⚙️ 2. CAMBIOS EN CONFIGURACIÓN (env.ts)

### **Antes (MySQL):**

```typescript
export const env = cleanEnv(process.env, {
  DB_HOST: host(),
  DB_PORT: num({ default: 3306 }),
  DB_USER: str(),
  DB_PASSWORD: str(),
  DB_NAME: str(),
});
```

### **Después (Firebase):**

```typescript
export const env = cleanEnv(process.env, {
  // Firebase Admin SDK
  FIREBASE_PROJECT_ID: str(),
  FIREBASE_CLIENT_EMAIL: str(),
  FIREBASE_PRIVATE_KEY: str(),
  // O usar archivo de credenciales JSON
  FIREBASE_CREDENTIALS_PATH: str({ default: "" }),
});
```

### **Variables de Entorno (.env):**

**Opción 1: Credenciales Individuales**

```env
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Opción 2: Archivo JSON (Recomendado)**

```env
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
```

---

## 🗄️ 3. CAMBIOS EN INFRAESTRUCTURA (infra/db.ts)

### **Antes (MySQL):**

```typescript
import mysql from "mysql2/promise";
import { env } from "../config/env";

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: 10,
});
```

### **Después (Firebase):**

```typescript
import admin from "firebase-admin";
import { env } from "../config/env";

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  if (env.FIREBASE_CREDENTIALS_PATH) {
    // Opción 1: Desde archivo JSON
    const serviceAccount = require(env.FIREBASE_CREDENTIALS_PATH);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Opción 2: Desde variables de entorno
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }
}

export const db = admin.firestore();
```

---

## 📁 4. CAMBIOS EN REPOSITORIOS

### **4.1. Locks Repository**

#### **Antes (MySQL):**

```typescript
import { pool } from "../../infra/db";

export async function updateLockSnapshot(p: {
    controllerId: string;
    lockId: string;
    state?: 'locked' | 'unlocked';
    seq?: number;
    battery?: number;
    rssi?: number;
}) {
    await pool.execute(
        `INSERT INTO locks (id, controller_id, last_state, last_seq, last_battery, last_rssi)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE ...`,
        [p.lockId, p.controllerId, ...]
    );
}

export async function getLastSeq(controllerId: string, lockId: string) {
    const [rows]: any = await pool.query(
        "SELECT last_seq FROM locks WHERE id=? AND controller_id=?",
        [lockId, controllerId]
    );
    return rows[0]?.last_seq;
}
```

#### **Después (Firestore):**

```typescript
import { db } from "../../infra/db";
import { FieldValue } from "firebase-admin/firestore";

// Necesitamos stationId y controllerId para construir la ruta
export async function updateLockSnapshot(p: {
  stationId: string; // NUEVO: Necesario para la ruta
  controllerId: string;
  lockId: string;
  state?: "locked" | "unlocked";
  seq?: number;
  battery?: number;
  rssi?: number;
}) {
  const lockRef = db
    .collection("stations")
    .doc(p.stationId)
    .collection("controllers")
    .doc(p.controllerId)
    .collection("locks")
    .doc(p.lockId);

  const updateData: any = {
    controller_id: p.controllerId,
    updated_at: FieldValue.serverTimestamp(),
  };

  if (p.state !== undefined) updateData.last_state = p.state;
  if (p.seq !== undefined) {
    // Usar transacción para GREATEST
    await db.runTransaction(async (transaction) => {
      const lockDoc = await transaction.get(lockRef);
      const currentSeq = lockDoc.data()?.last_seq || 0;
      updateData.last_seq = Math.max(currentSeq, p.seq!);
    });
  }
  if (p.battery !== undefined) updateData.last_battery = p.battery;
  if (p.rssi !== undefined) updateData.last_rssi = p.rssi;

  await lockRef.set(updateData, { merge: true });
}

export async function getLastSeq(
  stationId: string, // NUEVO: Necesario para la ruta
  controllerId: string,
  lockId: string
) {
  const lockDoc = await db
    .collection("stations")
    .doc(stationId)
    .collection("controllers")
    .doc(controllerId)
    .collection("locks")
    .doc(lockId)
    .get();

  return lockDoc.data()?.last_seq;
}
```

**⚠️ CAMBIO IMPORTANTE:** Ahora necesitamos `stationId` en todas las funciones porque la estructura es anidada.

---

### **4.2. Commands Repository**

#### **Antes (MySQL):**

```typescript
export async function createPending(c: any) {
  await pool.execute(
    `INSERT INTO commands (req_id, station_id, controller_id, lock_id, cmd, ts_requested, timeout_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [c.reqId, c.stationId, c.controllerId, c.lockId, c.cmd, c.ts, c.timeoutMs]
  );
}

export async function resolve(
  reqId: string,
  result: "ok" | "error" | "timeout",
  ts: number,
  errorMsg?: string
) {
  await pool.execute(
    `UPDATE commands SET status=?, ts_resolved=?, error_msg=? WHERE req_id=?`,
    [status, ts, errorMsg ?? null, reqId]
  );
}
```

#### **Después (Firestore):**

```typescript
import { db } from "../../infra/db";
import { FieldValue } from "firebase-admin/firestore";

export async function createPending(c: {
  reqId: string;
  stationId: string;
  controllerId: string;
  lockId: string;
  cmd: string;
  ts: number;
  timeoutMs: number;
}) {
  const commandRef = db
    .collection("stations")
    .doc(c.stationId)
    .collection("controllers")
    .doc(c.controllerId)
    .collection("locks")
    .doc(c.lockId)
    .collection("commands")
    .doc(c.reqId);

  const indexRef = db.collection("commands_index").doc(c.reqId);

  const commandData = {
    station_id: c.stationId,
    controller_id: c.controllerId,
    lock_id: c.lockId,
    cmd: c.cmd,
    ts_requested: c.ts,
    timeout_ms: c.timeoutMs,
    status: "pending",
    ts_resolved: null,
    error_msg: null,
    created_at: FieldValue.serverTimestamp(),
  };

  // Escribir en ambos lugares (comando y índice)
  await db.runTransaction(async (transaction) => {
    transaction.set(commandRef, commandData);
    transaction.set(indexRef, {
      station_id: c.stationId,
      controller_id: c.controllerId,
      lock_id: c.lockId,
      cmd: c.cmd,
      status: "pending",
      created_at: FieldValue.serverTimestamp(),
    });
  });
}

export async function resolve(
  reqId: string,
  result: "ok" | "error" | "timeout",
  ts: number,
  errorMsg?: string
) {
  // Primero buscar en commands_index para obtener la ruta
  const indexDoc = await db.collection("commands_index").doc(reqId).get();

  if (!indexDoc.exists) {
    throw new Error(`Command ${reqId} not found`);
  }

  const indexData = indexDoc.data()!;
  const status =
    result === "ok" ? "success" : result === "timeout" ? "timeout" : "error";

  const commandRef = db
    .collection("stations")
    .doc(indexData.station_id)
    .collection("controllers")
    .doc(indexData.controller_id)
    .collection("locks")
    .doc(indexData.lock_id)
    .collection("commands")
    .doc(reqId);

  // Actualizar ambos (comando y índice)
  await db.runTransaction(async (transaction) => {
    transaction.update(commandRef, {
      status,
      ts_resolved: ts,
      error_msg: errorMsg || null,
    });
    transaction.update(db.collection("commands_index").doc(reqId), {
      status,
    });
  });
}
```

---

### **4.3. Telemetry Repository**

#### **Antes (MySQL):**

```typescript
await pool.execute(
    `INSERT INTO telemetry (station_id, controller_id, lock_id, ts, state, battery, rssi, fw, seq)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [stationId, deviceId, lockId, data.ts, data.state, ...]
);
```

#### **Después (Firestore):**

```typescript
const telemetryRef = db
  .collection("stations")
  .doc(stationId)
  .collection("controllers")
  .doc(deviceId)
  .collection("locks")
  .doc(lockId)
  .collection("telemetry")
  .doc(); // Auto-ID

await telemetryRef.set({
  station_id: stationId,
  controller_id: deviceId,
  lock_id: lockId,
  ts: data.ts,
  state: data.state,
  battery: data.battery ?? null,
  rssi: data.rssi ?? null,
  fw: data.fw ?? null,
  seq: data.seq ?? null,
  created_at: FieldValue.serverTimestamp(),
});
```

---

### **4.4. Events Repository**

#### **Antes (MySQL):**

```typescript
await pool.execute(
  `INSERT INTO events (station_id, controller_id, lock_id, ts, event, details_json, severity)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [
    stationId,
    deviceId,
    lockId,
    data.ts,
    data.event,
    JSON.stringify(data.details),
    severity,
  ]
);
```

#### **Después (Firestore):**

```typescript
const eventRef = db
  .collection("stations")
  .doc(stationId)
  .collection("controllers")
  .doc(deviceId)
  .collection("locks")
  .doc(lockId)
  .collection("events")
  .doc(); // Auto-ID

await eventRef.set({
  station_id: stationId,
  controller_id: deviceId,
  lock_id: lockId,
  ts: data.ts,
  event: data.event,
  details: data.details || null, // Firestore maneja objetos directamente
  severity,
  created_at: FieldValue.serverTimestamp(),
});
```

---

### **4.5. Controllers Repository**

#### **Antes (MySQL):**

```typescript
await pool.execute(
  `INSERT INTO controllers (id, station_id, fw, hw)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE ...`,
  [deviceId, stationId, data.fw, data.hw]
);
```

#### **Después (Firestore):**

```typescript
const controllerRef = db
  .collection("stations")
  .doc(stationId)
  .collection("controllers")
  .doc(deviceId);

await controllerRef.set(
  {
    station_id: stationId,
    fw: data.fw || null,
    hw: data.hw || null,
    last_status: "unknown",
    last_seen_at: null,
    created_at: FieldValue.serverTimestamp(),
  },
  { merge: true }
);
```

---

## 🔧 5. CAMBIOS EN HANDLERS MQTT

### **5.1. Telemetry Handler**

#### **Cambios Necesarios:**

1. **Pasar `stationId` a `updateLockSnapshot`:**

```typescript
// Antes
await updateLockSnapshot({
    controllerId: deviceId,
    lockId,
    state: data.state,
    ...
});

// Después
await updateLockSnapshot({
    stationId,  // NUEVO: Requerido
    controllerId: deviceId,
    lockId,
    state: data.state,
    ...
});
```

2. **Cambiar inserción directa de telemetría:**

```typescript
// Antes
await pool.execute(`INSERT INTO telemetry ...`);

// Después
await telemetryRepo.create({
    stationId,
    controllerId: deviceId,
    lockId,
    ts: data.ts,
    state: data.state,
    ...
});
```

---

### **5.2. State Handler**

#### **Cambios Necesarios:**

1. **Actualizar `resolve` para usar `commands_index`:**

```typescript
// Ya no necesita stationId, controllerId, lockId
// porque los busca en commands_index
await resolve(data.reqId, data.result, data.ts, data.error || null);
```

---

### **5.3. Status Handler**

#### **Cambios Necesarios:**

1. **Necesita `stationId` para construir la ruta:**

```typescript
// Antes
export async function handle({
  deviceId,
  data,
}: {
  deviceId: string;
  data: any;
}) {
  await pool.execute(`INSERT INTO controllers ...`);
}

// Después
export async function handle({
  stationId,
  deviceId,
  data,
}: {
  stationId: string; // NUEVO: Requerido
  deviceId: string;
  data: any;
}) {
  const controllerRef = db
    .collection("stations")
    .doc(stationId)
    .collection("controllers")
    .doc(deviceId);

  await controllerRef.set(
    {
      station_id: stationId,
      last_status: data.status === "online" ? "online" : "offline",
      last_seen_at: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
```

---

### **5.4. Config Handler**

#### **Cambios Necesarios:**

1. **Usar Firestore en lugar de SQL:**

```typescript
// Ya está bien estructurado, solo cambiar implementación interna
// de los repositorios que usa
```

---

## 🌐 6. CAMBIOS EN CONTROLADORES HTTP

### **6.1. Locks Controller - getAll()**

#### **Antes (MySQL con JOIN):**

```typescript
const [rows] = await pool.execute(
  `SELECT l.*, c.station_id, c.last_status as controller_status
     FROM locks l
     JOIN controllers c ON l.controller_id = c.id
     ORDER BY c.station_id, l.position`
);
```

#### **Después (Firestore - Múltiples consultas):**

```typescript
// Necesitamos recorrer todas las estaciones y controladores
const stationsSnapshot = await db.collection("stations").get();
const allLocks: any[] = [];

for (const stationDoc of stationsSnapshot.docs) {
  const stationId = stationDoc.id;
  const controllersSnapshot = await stationDoc.ref
    .collection("controllers")
    .get();

  for (const controllerDoc of controllersSnapshot.docs) {
    const controllerId = controllerDoc.id;
    const controllerData = controllerDoc.data();
    const locksSnapshot = await controllerDoc.ref.collection("locks").get();

    for (const lockDoc of locksSnapshot.docs) {
      allLocks.push({
        ...lockDoc.data(),
        id: lockDoc.id,
        station_id: stationId,
        controller_status: controllerData.last_status,
      });
    }
  }
}

// Ordenar por station_id y position
allLocks.sort((a, b) => {
  if (a.station_id !== b.station_id) {
    return a.station_id.localeCompare(b.station_id);
  }
  return (a.position || "").localeCompare(b.position || "");
});
```

**⚠️ NOTA:** Esta consulta es más costosa en Firestore. Considera usar **Collection Group Queries** si necesitas optimizar:

```typescript
// Alternativa con Collection Group (requiere índice)
const locksSnapshot = await db.collectionGroup("locks").get();
// Pero necesitarías agregar station_id y controller_id a cada documento lock
```

---

### **6.2. Locks Controller - getById()**

#### **Antes (MySQL):**

```typescript
const [rows]: any = await pool.execute(
  `SELECT l.*, c.station_id, c.last_status as controller_status
     FROM locks l
     JOIN controllers c ON l.controller_id = c.id
     WHERE l.id = ?`,
  [lockId]
);
```

#### **Después (Firestore):**

```typescript
// Problema: No conocemos stationId ni controllerId
// Solución: Usar Collection Group Query
const locksSnapshot = await db
  .collectionGroup("locks")
  .where(FieldPath.documentId(), "==", lockId)
  .limit(1)
  .get();

if (locksSnapshot.empty) {
  return res.status(404).json({ success: false, error: "Lock no encontrado" });
}

const lockDoc = locksSnapshot.docs[0];
const lockData = lockDoc.data();
const lockPath = lockDoc.ref.path.split("/");
const stationId = lockPath[1];
const controllerId = lockPath[3];

// Obtener controller para controller_status
const controllerDoc = await db
  .collection("stations")
  .doc(stationId)
  .collection("controllers")
  .doc(controllerId)
  .get();

res.json({
  success: true,
  data: {
    ...lockData,
    id: lockDoc.id,
    station_id: stationId,
    controller_status: controllerDoc.data()?.last_status,
  },
});
```

**⚠️ REQUIERE ÍNDICE:** Necesitas crear un índice compuesto en Firestore Console para `collectionGroup("locks")`.

---

### **6.3. Locks Controller - getCommandStatus()**

#### **Antes (MySQL):**

```typescript
const [rows]: any = await pool.execute(
  `SELECT * FROM commands WHERE req_id = ? AND lock_id = ?`,
  [reqId, lockId]
);
```

#### **Después (Firestore):**

```typescript
// Usar commands_index para búsqueda rápida
const commandIndexDoc = await db.collection("commands_index").doc(reqId).get();

if (!commandIndexDoc.exists) {
  return res
    .status(404)
    .json({ success: false, error: "Comando no encontrado" });
}

const indexData = commandIndexDoc.data()!;

// Verificar que el lock_id coincida
if (indexData.lock_id !== lockId) {
  return res
    .status(404)
    .json({ success: false, error: "Comando no encontrado" });
}

// Obtener comando completo
const commandDoc = await db
  .collection("stations")
  .doc(indexData.station_id)
  .collection("controllers")
  .doc(indexData.controller_id)
  .collection("locks")
  .doc(indexData.lock_id)
  .collection("commands")
  .doc(reqId)
  .get();

const commandData = commandDoc.data()!;
res.json({
  success: true,
  data: {
    reqId: commandDoc.id,
    cmd: commandData.cmd,
    status: commandData.status,
    requestedAt: commandData.ts_requested,
    resolvedAt: commandData.ts_resolved,
    errorMsg: commandData.error_msg,
  },
});
```

---

### **6.4. Locks Controller - getEvents()**

#### **Antes (MySQL):**

```typescript
const [rows] = await pool.execute(
  `SELECT * FROM events 
     WHERE lock_id = ? 
     ORDER BY ts DESC 
     LIMIT ?`,
  [lockId, limit]
);
```

#### **Después (Firestore):**

```typescript
// Problema: No conocemos stationId ni controllerId
// Solución: Usar Collection Group Query
const eventsSnapshot = await db
  .collectionGroup("events")
  .where("lock_id", "==", lockId)
  .orderBy("ts", "desc")
  .limit(limit)
  .get();

const events = eventsSnapshot.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}));

res.json({ success: true, data: events });
```

**⚠️ REQUIERE ÍNDICE:** Necesitas crear un índice compuesto en Firestore Console:

- Collection: `events` (collection group)
- Fields: `lock_id` (ASC), `ts` (DESC)

---

## 🔍 7. CAMBIOS EN ROUTES (routes.ts)

### **Cambios en rutas legacy:**

#### **Antes (MySQL):**

```typescript
router.get("/controllers/:controllerId/locks", async (req, res) => {
  const [rows]: any = await pool.query(
    "SELECT id AS lockId, last_state, last_battery, last_rssi, position FROM locks WHERE controller_id=?",
    [req.params.controllerId]
  );
  res.json(rows);
});
```

#### **Después (Firestore):**

```typescript
router.get("/controllers/:controllerId/locks", async (req, res) => {
  // Problema: Necesitamos stationId
  // Solución: Buscar en todas las estaciones o requerir stationId en query
  const { stationId } = req.query;

  if (!stationId) {
    return res.status(400).json({ error: "stationId requerido en query" });
  }

  const locksSnapshot = await db
    .collection("stations")
    .doc(stationId as string)
    .collection("controllers")
    .doc(req.params.controllerId)
    .collection("locks")
    .get();

  const locks = locksSnapshot.docs.map((doc) => ({
    lockId: doc.id,
    last_state: doc.data().last_state,
    last_battery: doc.data().last_battery,
    last_rssi: doc.data().last_rssi,
    position: doc.data().position,
  }));

  res.json(locks);
});
```

---

## 📝 8. CAMBIOS EN SERVICIOS

### **Command Services**

#### **Cambios Necesarios:**

1. **`createPending` ahora necesita todos los parámetros:**

```typescript
// Ya está bien, solo asegurarse de que se pasen todos los parámetros
```

---

## 🔐 9. CONFIGURACIÓN DE FIREBASE

### **¿Necesitas la misma configuración del frontend?**

**NO**, el backend usa **Firebase Admin SDK**, que es diferente al SDK del cliente (frontend).

### **Diferencias:**

| Aspecto           | Frontend (Cliente)                      | Backend (Admin SDK)                      |
| ----------------- | --------------------------------------- | ---------------------------------------- |
| **SDK**           | `firebase` o `@firebase/js`             | `firebase-admin`                         |
| **Autenticación** | Usuarios (email/password, Google, etc.) | Service Account (JSON)                   |
| **Permisos**      | Reglas de seguridad de Firestore        | Acceso completo (bypass de reglas)       |
| **Configuración** | `apiKey`, `authDomain`, etc.            | `projectId`, `privateKey`, `clientEmail` |
| **Uso**           | Lectura/escritura limitada por reglas   | Lectura/escritura completa               |

### **Lo que necesitas en el backend:**

1. **Service Account JSON** desde Firebase Console:

   - Ir a Firebase Console → Project Settings → Service Accounts
   - Generar nueva clave privada
   - Descargar archivo JSON

2. **O variables de entorno:**
   ```env
   FIREBASE_PROJECT_ID=tu-proyecto-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

### **Archivo de credenciales (firebase-credentials.json):**

```json
{
  "type": "service_account",
  "project_id": "tu-proyecto-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

**⚠️ IMPORTANTE:**

- Este archivo contiene credenciales sensibles
- **NO** subirlo a Git (agregar a `.gitignore`)
- Usar variables de entorno en producción

---

## 📊 10. ÍNDICES NECESARIOS EN FIRESTORE

Debes crear estos índices en Firebase Console:

### **Índice 1: Collection Group - Locks**

```
Collection ID: locks (collection group)
Fields:
  - lock_id (ASC)
  - ts (DESC)  // Si necesitas ordenar por timestamp
```

### **Índice 2: Collection Group - Events**

```
Collection ID: events (collection group)
Fields:
  - lock_id (ASC)
  - ts (DESC)
```

### **Índice 3: Collection Group - Events por Severidad**

```
Collection ID: events (collection group)
Fields:
  - severity (ASC)
  - ts (DESC)
```

### **Índice 4: Collection Group - Commands**

```
Collection ID: commands (collection group)
Fields:
  - status (ASC)
  - ts_requested (DESC)
```

---

## ✅ 11. CHECKLIST DE MIGRACIÓN

- [ ] Instalar `firebase-admin`
- [ ] Remover `mysql2` (si no se usa)
- [ ] Actualizar `env.ts` con variables de Firebase
- [ ] Crear `infra/db.ts` con Firebase Admin SDK
- [ ] Refactorizar `locks.repo.ts`
- [ ] Refactorizar `commands.repo.ts`
- [ ] Refactorizar `telemetry.repo.ts`
- [ ] Refactorizar `events.repo.ts`
- [ ] Refactorizar `controllers.repo.ts`
- [ ] Actualizar `telemetry.ts` handler
- [ ] Actualizar `state.ts` handler
- [ ] Actualizar `status.ts` handler
- [ ] Actualizar `config.ts` handler
- [ ] Actualizar `locks.controller.ts` (todos los métodos)
- [ ] Actualizar `routes.ts` (rutas legacy)
- [ ] Crear índices en Firestore Console
- [ ] Configurar Service Account
- [ ] Actualizar `.env` con credenciales Firebase
- [ ] Probar todas las rutas API
- [ ] Probar handlers MQTT
- [ ] Verificar sincronización de `commands_index`

---

## 🎯 RESUMEN DE CAMBIOS CRÍTICOS

1. **Todas las funciones ahora necesitan `stationId`** porque la estructura es anidada
2. **No hay JOINs** - Necesitas hacer múltiples consultas o usar Collection Group Queries
3. **`commands_index` es crítico** para búsquedas rápidas por `reqId`
4. **Collection Group Queries** requieren índices compuestos en Firestore Console
5. **Transacciones** para operaciones atómicas (ej: actualizar comando y su índice)
6. **Service Account** diferente a la configuración del frontend

---

**¿Listo para empezar la migración?** 🚀
