import { pool } from "../../infra/db";

// upsert de controller + locks desde config (retained)
export async function handle({ stationId, deviceId, data }:{
  stationId:string, deviceId:string, data:any
}) {
  // Simplificado: asumir data.locks = [{lockId, position}]
  await pool.execute(
    `INSERT INTO stations (id) VALUES (?) ON DUPLICATE KEY UPDATE id=id`,
    [stationId]
  );
  await pool.execute(
    `INSERT INTO controllers (id, station_id, fw, hw)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE station_id=VALUES(station_id), fw=VALUES(fw), hw=VALUES(hw)`,
    [deviceId, stationId, data?.fw ?? null, data?.hw ?? null]
  );
  if (Array.isArray(data?.locks)) {
    for (const l of data.locks) {
      await pool.execute(
        `INSERT INTO locks (id, controller_id, position)
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE controller_id=VALUES(controller_id), position=VALUES(position)`,
        [l.lockId, deviceId, l.position ?? null]
      );
    }
  }
}