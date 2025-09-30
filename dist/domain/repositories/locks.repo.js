"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLockSnapshot = updateLockSnapshot;
exports.getLastSeq = getLastSeq;
const db_1 = require("../../infra/db");
async function updateLockSnapshot(p) {
    const conn = await db_1.pool.getConnection();
    try {
        await conn.execute(`INSERT INTO locks (id, controller_id, last_state, last_seq, last_battery, last_rssi)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         last_state=VALUES(last_state),
         last_seq=GREATEST(COALESCE(last_seq,0), VALUES(last_seq)),
         last_battery=VALUES(last_battery),
         last_rssi=VALUES(last_rssi)`, [p.lockId, p.controllerId, p.state ?? null, p.seq ?? null, p.battery ?? null, p.rssi ?? null]);
    }
    finally {
        conn.release();
    }
}
async function getLastSeq(controllerId, lockId) {
    const [rows] = await db_1.pool.query("SELECT last_seq FROM locks WHERE id=? AND controller_id=?", [lockId, controllerId]);
    return rows[0]?.last_seq;
}
//# sourceMappingURL=locks.repo.js.map