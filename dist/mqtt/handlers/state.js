"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const commands_repo_1 = require("../../domain/repositories/commands.repo");
const locks_repo_1 = require("../../domain/repositories/locks.repo");
const logger_1 = require("../../config/logger");
async function handle({ stationId, deviceId, lockId, data }) {
    if (!lockId || typeof data?.ts !== "number" || !data?.reqId || !["ok", "error"].includes(data?.result)) {
        logger_1.logger.warn({ deviceId, lockId }, "state_invalid");
        return;
    }
    await (0, commands_repo_1.resolve)(data.reqId, data.result, data.ts, data.error || null);
    if ((data.state === "locked" || data.state === "unlocked") && stationId) {
        await (0, locks_repo_1.updateLockSnapshot)({
            stationId,
            controllerId: deviceId,
            lockId,
            state: data.state,
        });
    }
}
//# sourceMappingURL=state.js.map