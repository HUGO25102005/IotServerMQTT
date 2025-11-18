import { updateLockSnapshot, getLastSeq } from "../../domain/repositories/locks.repo";
import { telemetryRepo } from "../../domain/repositories/telemetry.repo";
import { logger } from "../../config/logger";

export async function handle({ stationId, deviceId, lockId, data }: {
    stationId: string;
    deviceId: string;
    lockId?: string | undefined;
    data: any;
}) {
    if (!lockId || typeof data?.ts !== "number" || !["locked", "unlocked"].includes(data?.state)) {
        logger.warn({ stationId, deviceId, lockId }, "telemetry_invalid");
        return;
    }
    // DEDUP por seq si viene
    if (typeof data.seq === "number") {
        const last = await getLastSeq(stationId, deviceId, lockId);
        if (last !== undefined && data.seq <= last) return; // drop duplicado
    }
    // persistir detalle
    await telemetryRepo.create({
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
    // snapshot
    await updateLockSnapshot({
        stationId,
        controllerId: deviceId,
        lockId,
        state: data.state,
        seq: data.seq,
        battery: data.battery,
        rssi: data.rssi,
    });
}