"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const db_1 = require("../../infra/db");
async function handle({ deviceId, data }) {
    const s = (data?.status === "online" || data?.status === "offline") ? data.status : "unknown";
    await db_1.pool.execute(`INSERT INTO controllers (id, station_id, last_status, last_seen_at)
     VALUES (?, NULL, ?, NOW())
     ON DUPLICATE KEY UPDATE last_status=VALUES(last_status), last_seen_at=VALUES(last_seen_at)`, [deviceId, s]);
}
//# sourceMappingURL=status.js.map