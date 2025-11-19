export const SUBSCRIPTIONS = [
    "stations/+/controller/+/locks/+/telemetry",
    "stations/+/controller/+/locks/+/event",
    "stations/+/controller/+/locks/+/state",
    "stations/+/controller/+/status",
    "stations/+/controller/+/config",
    "cycloconnect/#", // Topic base para cycloconnect (captura todos los subtopics)
];
interface ParseTopicResult {
    stationId: string;
    deviceId: string;
    lockId?: string | undefined;
    section: string;
    subtype: string;
}
export function parseTopic(topic: string): ParseTopicResult {
    // Formato: stations/{stationId}/controller/{deviceId}/locks/{lockId}/{subtype}
    // O: stations/{stationId}/controller/{deviceId}/{subtype} (para status/config)
    const parts = topic.split("/");
    const stationId = parts[1] ?? "";
    const deviceId = parts[3] ?? "";
    const section = parts[4] ?? ""; // 'locks' | 'status' | 'config'
    const subtype = parts[parts.length - 1] ?? ""; // telemetry|event|state|command|status|config
    const lockId = section === "locks" ? parts[6] : undefined;
    return { stationId, deviceId, lockId, section, subtype };
}