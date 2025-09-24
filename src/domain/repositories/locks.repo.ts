import { pool } from "../../infra/db";
export async function updateLockSnapshot(p:{controllerId:string, lockId:string, state?:'locked'|'unlocked', seq?:number, battery?:number, rssi?:number}) {
  const conn = await pool.getConnection();
  try {
    await conn.execute(
      `INSERT INTO locks (id, controller_id, last_state, last_seq, last_battery, last_rssi)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         last_state=VALUES(last_state),
         last_seq=GREATEST(COALESCE(last_seq,0), VALUES(last_seq)),
         last_battery=VALUES(last_battery),
         last_rssi=VALUES(last_rssi)`,
      [p.lockId, p.controllerId, p.state ?? null, p.seq ?? null, p.battery ?? null, p.rssi ?? null]
    );
  } finally { conn.release(); }
}
export async function getLastSeq(controllerId:string, lockId:string) {
  const [rows]: any = await pool.query("SELECT last_seq FROM locks WHERE id=? AND controller_id=?", [lockId, controllerId]);
  return rows[0]?.last_seq as number|undefined;
}