"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPending = createPending;
exports.resolve = resolve;
const db_1 = require("../../infra/db");
async function createPending(c) {
    const sql = `INSERT INTO commands (req_id, station_id, controller_id, lock_id, cmd, ts_requested, timeout_ms)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await db_1.pool.execute(sql, [c.reqId, c.stationId, c.controllerId, c.lockId, c.cmd, c.ts, c.timeoutMs]);
}
async function resolve(reqId, result, ts, errorMsg) {
    const status = result === 'ok' ? 'success' : (result === 'timeout' ? 'timeout' : 'error');
    await db_1.pool.execute(`UPDATE commands SET status=?, ts_resolved=?, error_msg=? WHERE req_id=?`, [status, ts, errorMsg ?? null, reqId]);
}
//# sourceMappingURL=commands.repo.js.map