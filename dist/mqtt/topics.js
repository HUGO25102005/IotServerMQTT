"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBSCRIPTIONS = void 0;
exports.parseTopic = parseTopic;
exports.SUBSCRIPTIONS = [
    "stations/+/controller/+/locks/+/telemetry",
    "stations/+/controller/+/locks/+/event",
    "stations/+/controller/+/locks/+/state",
    "stations/+/controller/+/status",
    "stations/+/controller/+/config",
];
function parseTopic(topic) {
    const parts = topic.split("/");
    const stationId = parts[1] ?? "";
    const deviceId = parts[3] ?? "";
    const section = parts[4] ?? "";
    const subtype = parts[parts.length - 1] ?? "";
    const lockId = section === "locks" ? parts[6] : undefined;
    return { stationId, deviceId, lockId, section, subtype };
}
//# sourceMappingURL=topics.js.map