"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCommand = sendCommand;
const uuid_1 = require("uuid");
const mqtt_1 = require("../../infra/mqtt");
const commands_repo_1 = require("../repositories/commands.repo");
async function sendCommand(p) {
    const reqId = (0, uuid_1.v4)().slice(0, 8);
    const ts = Date.now();
    await (0, commands_repo_1.createPending)({ reqId, stationId: p.stationId, controllerId: p.controllerId, lockId: p.lockId, cmd: p.cmd, ts, timeoutMs: p.timeoutMs });
    const topic = `stations/${p.stationId}/controller/${p.controllerId}/locks/${p.lockId}/command/set`;
    mqtt_1.mqttClient.publish(topic, JSON.stringify({ ts, cmd: p.cmd, reqId, timeoutMs: p.timeoutMs }), { qos: 1 });
    setTimeout(async () => {
        await (0, commands_repo_1.resolve)(reqId, "timeout", Date.now());
    }, p.timeoutMs);
    return { reqId, acceptedAt: ts };
}
//# sourceMappingURL=command.services.js.map