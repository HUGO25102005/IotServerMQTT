import { v4 as uuidv4 } from "uuid";
import { mqttClient } from "../../infra/mqtt";
import { createPending, resolve } from "../repositories/commands.repo";
import { logger } from "../../config/logger";

export async function sendCommand(p: { stationId: string, controllerId: string, lockId: string, cmd: "lock" | "unlock" | "reboot", timeoutMs: number }) {
    const reqId = uuidv4().slice(0, 8);
    const ts = Date.now();

    logger.info({ reqId, stationId: p.stationId, controllerId: p.controllerId, lockId: p.lockId, cmd: p.cmd }, "[CommandService] Iniciando envío de comando");

    await createPending({ reqId, stationId: p.stationId, controllerId: p.controllerId, lockId: p.lockId, cmd: p.cmd, ts, timeoutMs: p.timeoutMs });

    logger.info({ reqId }, "[CommandService] Comando guardado como pendiente en Firestore");

    // Agregar prefijo cycloconnect/ para que el dispositivo lo reciba
    const topic = `cycloconnect/stations/${p.stationId}/controller/${p.controllerId}/locks/${p.lockId}/command/set`;
    const payload = JSON.stringify({ ts, cmd: p.cmd, reqId, timeoutMs: p.timeoutMs });

    logger.info({ topic, payload, mqttConnected: mqttClient.connected }, "[CommandService] Publicando comando a MQTT");

    mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
            logger.error({ err, reqId, topic }, "[CommandService] Error al publicar comando MQTT");
        } else {
            logger.info({ reqId, topic }, "[CommandService] ✅ Comando publicado exitosamente a MQTT");
        }
    });

    // temporizador de timeout (simple; opcional mover a un scheduler)
    setTimeout(async () => {
        logger.warn({ reqId }, "[CommandService] Comando timeout - no se recibió ACK");
        await resolve(reqId, "timeout", Date.now());
    }, p.timeoutMs);

    logger.info({ reqId, acceptedAt: ts }, "[CommandService] Comando aceptado");
    return { reqId, acceptedAt: ts };
}