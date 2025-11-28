import { IMqttMessageHandler } from "../../interfaces/IMqttMessageHandler";
import { CommandsModel } from "../models";
import { ParsedTopic } from "../models/ObjectMqttModel";
import { logger } from "../../../config/logger";
import { CommandsService } from "../../../domain/services";
import { v4 as uuidv4 } from "uuid";
import { mqttClient } from "../../../infra/mqtt";

/**
 * Handler MQTT para Commands
 * Implementa IMqttMessageHandler para seguir el Strategy Pattern
 * Único controller que puede publicar mensajes MQTT
 * También procesa respuestas de comandos recibidas por MQTT
 */
class CommandsController implements IMqttMessageHandler {
    /**
     * Procesa un mensaje de comando recibido (subscribe)
     * Normalmente esto sería una respuesta o ACK del dispositivo
     */
    public async handle(
        parsedTopic: ParsedTopic,
        payload: any,
        messageStr: string
    ): Promise<void> {
        try {
            logger.info({ parsedTopic, payload }, "[CommandsController] Mensaje ACK recibido");

            const topic = this.reconstructTopic(parsedTopic);
            const mqttModel = new CommandsModel(topic, payload, messageStr);

            if (!mqttModel.validate()) {
                logger.warn({ parsedTopic, payload }, "[CommandsController] Validación fallida");
                return;
            }

            const data = mqttModel.getDataForFirestore();
            logger.info({ data }, "[CommandsController] Datos del ACK preparados");

            // Guardar comando usando el servicio de dominio
            const service = new CommandsService(parsedTopic);

            // Si es una respuesta de comando (tiene reqId y result/status), resolver el comando
            const result = data.result || data.status;
            if (data.reqId && result) {
                logger.info({ reqId: data.reqId, result }, "[CommandsController] Resolviendo comando con ACK");

                await service.resolve(
                    data.reqId,
                    result,
                    data.ts || Date.now(),
                    data.error || null
                );

                logger.info({ reqId: data.reqId }, "[CommandsController] ✅ Comando resuelto exitosamente");
            } else {
                logger.warn({ data }, "[CommandsController] ACK sin reqId o result - guardando solo el mensaje");
                // Si no, solo guardar el mensaje
                await service.getModel().create(data);
            }

            logger.debug({ parsedTopic }, "command_handled");
        } catch (error) {
            logger.error({ error, parsedTopic }, "[CommandsController] Error al manejar ACK");
            throw error;
        }
    }

    /**
     * Envía un comando al dispositivo (publish)
     * Este es el único método que publica mensajes MQTT
     */
    public async sendCommand(params: {
        stationId: string;
        controllerId: string;
        lockId: string;
        cmd: "lock" | "unlock" | "reboot";
        timeoutMs: number;
    }): Promise<{ reqId: string; acceptedAt: number }> {
        const reqId = uuidv4().slice(0, 8);
        const ts = Date.now();

        try {
            // Crear parsedTopic para el HTTP controller
            const parsedTopic: ParsedTopic = {
                stationId: params.stationId,
                controllerId: params.controllerId,
                lockId: params.lockId,
                action: "command",
                hasLocks: true
            };

            const service = new CommandsService(parsedTopic);

            // console.log({ parsedTopic });
            // Crear comando pendiente en Firestore
            await service.createPending({
                reqId,
                ts,
                cmd: params.cmd,
                timeoutMs: params.timeoutMs
            });

            // Construir el topic para publicar
            const publishTopic = `cycloconnect/stations/${params.stationId}/controller/${params.controllerId}/locks/${params.lockId}/command/set`;

            // console.log({ publishTopic });
            // Publicar el comando
            const payload = JSON.stringify({ ts, cmd: params.cmd, reqId, timeoutMs: params.timeoutMs });

            console.log({ publishTopic, payload });
            mqttClient.publish(publishTopic, payload, { qos: 1 });

            // Configurar timeout para resolver el comando si no hay respuesta
            setTimeout(async () => {
                try {
                    await service.resolve(reqId, "timeout", Date.now());
                } catch (error) {
                    logger.error({ error, reqId }, "command_timeout_resolve_failed");
                }
            }, params.timeoutMs);

            logger.info({ reqId, cmd: params.cmd, stationId: params.stationId, controllerId: params.controllerId, lockId: params.lockId }, "command_sent");

            return { reqId, acceptedAt: ts };
        } catch (error) {
            logger.error({ error, reqId, cmd: params.cmd }, "command_send_failed");
            throw error;
        }
    }

    private reconstructTopic(parsedTopic: ParsedTopic): string {
        const parts = ["stations", parsedTopic.stationId, "controller", parsedTopic.controllerId];
        if (parsedTopic.lockId) {
            parts.push("locks", parsedTopic.lockId);
        }
        if (parsedTopic.action) {
            parts.push(parsedTopic.action);
        }
        return parts.join("/");
    }
}

export default CommandsController;

