import { resolve } from "../../domain/repositories/commands.repo";
import { updateLockSnapshot } from "../../domain/repositories/locks.repo";
import { logger } from "../../config/logger";

export async function handle({ deviceId, lockId, data }:{
  stationId?:string, deviceId:string, lockId?:string, data:any
}) {
  if (!lockId || typeof data?.ts !== "number" || !data?.reqId || !["ok","error"].includes(data?.result)) {
    logger.warn({ deviceId, lockId }, "state_invalid"); return;
  }
  await resolve(data.reqId, data.result, data.ts, data.error || null);
  if (data.state === "locked" || data.state === "unlocked") {
    await updateLockSnapshot({ controllerId: deviceId, lockId, state: data.state });
  }
}