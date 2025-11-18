"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const locks_repo_1 = require("../../domain/repositories/locks.repo");
const telemetry_repo_1 = require("../../domain/repositories/telemetry.repo");
const logger_1 = require("../../config/logger");
async function handle({ stationId, deviceId, lockId, data }) {
    if (!lockId || typeof data?.ts !== "number" || !["locked", "unlocked"].includes(data?.state)) {
        logger_1.logger.warn({ stationId, deviceId, lockId }, "telemetry_invalid");
        return;
    }
    if (typeof data.seq === "number") {
        const last = await (0, locks_repo_1.getLastSeq)(stationId, deviceId, lockId);
        if (last !== undefined && data.seq <= last)
            return;
    }
    await telemetry_repo_1.telemetryRepo.create({
        stationId,
        controllerId: deviceId,
        lockId,
        ts: data.ts,
        state: data.state,
        battery: data.battery,
        rssi: data.rssi,
        fw: data.fw,
        seq: data.seq,
    });
    await (0, locks_repo_1.updateLockSnapshot)({
        stationId,
        controllerId: deviceId,
        lockId,
        state: data.state,
        seq: data.seq,
        battery: data.battery,
        rssi: data.rssi,
    });
}
//# sourceMappingURL=telemetry.js.map