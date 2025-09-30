"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const db_1 = require("../../infra/db");
async function handle({ stationId, deviceId, data }) {
    await db_1.pool.execute(`INSERT INTO stations (id) VALUES (?) ON DUPLICATE KEY UPDATE id=id`, [stationId]);
    await db_1.pool.execute(`INSERT INTO controllers (id, station_id, fw, hw)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE station_id=VALUES(station_id), fw=VALUES(fw), hw=VALUES(hw)`, [deviceId, stationId, data?.fw ?? null, data?.hw ?? null]);
    if (Array.isArray(data?.locks)) {
        for (const l of data.locks) {
            await db_1.pool.execute(`INSERT INTO locks (id, controller_id, position)
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE controller_id=VALUES(controller_id), position=VALUES(position)`, [l.lockId, deviceId, l.position ?? null]);
        }
    }
}
//# sourceMappingURL=config.js.map