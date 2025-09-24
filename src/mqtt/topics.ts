export const SUBSCRIPTIONS = [
    "stations/+/controller/+/locks/+/telemetry",
    "stations/+/controller/+/locks/+/event",
    "stations/+/controller/+/locks/+/state",
    "stations/+/controller/+/status",
    "stations/+/controller/+/config",
];
interface ParseTopicResult {
    stationId: string;
    deviceId: string;
    lockId?: string | undefined;
    section: string;
    subtype: string;
}
export function parseTopic(topic: string): ParseTopicResult {
    // stations/{stationId}/controller/{deviceId}/(locks/{lockId}/)?{subtype}
    const parts = topic.split("/");
    const stationId = parts[1] ?? "";
    const deviceId = parts[3] ?? "";
    const section = parts[4] ?? ""; // 'locks' | 'status' | 'config'
    const subtype = parts[parts.length - 1] ?? ""; // telemetry|event|state|status|config
    const lockId = section === "locks" ? parts[6] : undefined;
    return { stationId, deviceId, lockId, section, subtype };
}