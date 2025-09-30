"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const locks_repo_1 = require("../../domain/repositories/locks.repo");
const db_1 = require("../../infra/db");
const logger_1 = require("../../config/logger");
async function handle({ stationId, deviceId, lockId, data }) {
    if (!lockId || typeof data?.ts !== "number" || !["locked", "unlocked"].includes(data?.state)) {
        logger_1.logger.warn({ stationId, deviceId, lockId }, "telemetry_invalid");
        return;
    }
    if (typeof data.seq === "number") {
        const last = await (0, locks_repo_1.getLastSeq)(deviceId, lockId);
        if (last !== undefined && data.seq <= last)
            return;
    }
    await db_1.pool.execute(`INSERT INTO telemetry (station_id, controller_id, lock_id, ts, state, battery, rssi, fw, seq)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [stationId, deviceId, lockId, data.ts, data.state ?? null, data.battery ?? null, data.rssi ?? null, data.fw ?? null, data.seq ?? null]);
    await (0, locks_repo_1.updateLockSnapshot)({
        controllerId: deviceId, lockId, state: data.state, seq: data.seq, battery: data.battery, rssi: data.rssi
    });
}
//# sourceMappingURL=telemetry.js.map