import { pool } from "../../infra/db";
export async function createPending(c:any) {
  const sql = `INSERT INTO commands (req_id, station_id, controller_id, lock_id, cmd, ts_requested, timeout_ms)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  await pool.execute(sql, [c.reqId, c.stationId, c.controllerId, c.lockId, c.cmd, c.ts, c.timeoutMs]);
}
export async function resolve(reqId:string, result:"ok"|"error"|"timeout", ts:number, errorMsg?:string) {
  const status = result==='ok' ? 'success' : (result==='timeout' ? 'timeout' : 'error');
  await pool.execute(`UPDATE commands SET status=?, ts_resolved=?, error_msg=? WHERE req_id=?`,
    [status, ts, errorMsg ?? null, reqId]);
}