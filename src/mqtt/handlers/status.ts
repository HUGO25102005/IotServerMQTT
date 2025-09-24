import { pool } from "../../infra/db";
export async function handle({ deviceId, data }:{ deviceId:string, data:any }) {
  const s = (data?.status === "online" || data?.status === "offline") ? data.status : "unknown";
  await pool.execute(
    `INSERT INTO controllers (id, station_id, last_status, last_seen_at)
     VALUES (?, NULL, ?, NOW())
     ON DUPLICATE KEY UPDATE last_status=VALUES(last_status), last_seen_at=VALUES(last_seen_at)`,
    [deviceId, s]
  );
}