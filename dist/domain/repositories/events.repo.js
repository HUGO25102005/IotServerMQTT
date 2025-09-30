"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsRepo = void 0;
const db_1 = require("../../infra/db");
exports.eventsRepo = {
    async create(data) {
        const [result] = await db_1.pool.execute(`INSERT INTO events (station_id, controller_id, lock_id, ts, event, details_json, severity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            data.stationId,
            data.controllerId,
            data.lockId,
            data.ts,
            data.event,
            JSON.stringify(data.detailsJson),
            data.severity
        ]);
        return result;
    },
    async findByLock(lockId, limit = 100) {
        const [rows] = await db_1.pool.execute(`SELECT * FROM events 
       WHERE lock_id = ? 
       ORDER BY ts DESC 
       LIMIT ?`, [lockId, limit]);
        return rows;
    },
    async findByStation(stationId, limit = 100) {
        const [rows] = await db_1.pool.execute(`SELECT * FROM events 
       WHERE station_id = ? 
       ORDER BY ts DESC 
       LIMIT ?`, [stationId, limit]);
        return rows;
    },
    async findBySeverity(severity, limit = 100) {
        const [rows] = await db_1.pool.execute(`SELECT * FROM events 
       WHERE severity = ? 
       ORDER BY ts DESC 
       LIMIT ?`, [severity, limit]);
        return rows;
    }
};
//# sourceMappingURL=events.repo.js.map