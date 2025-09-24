import { updateLockSnapshot, getLastSeq } from "../../domain/repositories/locks.repo";
import { pool } from "../../infra/db";
import { logger } from "../../config/logger";

export async function handle({ stationId, deviceId, lockId, data }:{
  stationId:string, deviceId:string, lockId?:string | undefined, data:any
}) {
  if (!lockId || typeof data?.ts !== "number" || !["locked","unlocked"].includes(data?.state)) {
    logger.warn({ stationId, deviceId, lockId }, "telemetry_invalid"); return;
  }
  // DEDUP por seq si viene
  if (typeof data.seq === "number") {
    const last = await getLastSeq(deviceId, lockId);
    if (last !== undefined && data.seq <= last) return; // drop duplicado
  }
  // persistir detalle
  await pool.execute(
    `INSERT INTO telemetry (station_id, controller_id, lock_id, ts, state, battery, rssi, fw, seq)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [stationId, deviceId, lockId, data.ts, data.state ?? null, data.battery ?? null, data.rssi ?? null, data.fw ?? null, data.seq ?? null]
  );
  // snapshot
  await updateLockSnapshot({
    controllerId: deviceId, lockId, state: data.state, seq: data.seq, battery: data.battery, rssi: data.rssi
  });
}