import { v4 as uuidv4 } from "uuid";
import { mqttClient } from "../../infra/mqtt";
import { createPending, resolve } from "../repositories/commands.repo";
import { commandLatency } from "../../infra/metrics";

export async function sendCommand(p:{stationId:string, controllerId:string, lockId:string, cmd:"lock"|"unlock"|"reboot", timeoutMs:number}) {
  const reqId = uuidv4().slice(0, 8);
  const ts = Date.now();

  await createPending({ reqId, stationId: p.stationId, controllerId: p.controllerId, lockId: p.lockId, cmd: p.cmd, ts, timeoutMs: p.timeoutMs });

  const topic = `stations/${p.stationId}/controller/${p.controllerId}/locks/${p.lockId}/command/set`;
  mqttClient.publish(topic, JSON.stringify({ ts, cmd: p.cmd, reqId, timeoutMs: p.timeoutMs }), { qos: 1 });

  // temporizador de timeout (simple; opcional mover a un scheduler)
  setTimeout(async () => {
    await resolve(reqId, "timeout", Date.now());
  }, p.timeoutMs);

  // métrica de latencia se observa cuando llegue el ACK (state handler)
  // (si quieres, guarda ts inicial por reqId para medir exacto)
  return { reqId, acceptedAt: ts };
}