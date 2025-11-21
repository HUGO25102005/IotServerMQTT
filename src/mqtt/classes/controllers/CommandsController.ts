import { IMqttMessageHandler } from "../../interfaces/IMqttMessageHandler";
import { CommandsModel } from "../models";
import { CommandsController as CommandsHTTPController } from "../../../http/controllers";
import { ParsedTopic } from "../models/ObjectMqttModel";
import { mqttClient } from "../../../infra/mqtt";
import { logger } from "../../../config/logger";
import { v4 as uuidv4 } from "uuid";

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
            const topic = this.reconstructTopic(parsedTopic);
            const mqttModel = new CommandsModel(topic, payload, messageStr);

            if (!mqttModel.validate()) {
                logger.warn({ parsedTopic }, "command_validation_failed");
                return;
            }

            const data = mqttModel.getDataForFirestore();
            const httpController = new CommandsHTTPController(parsedTopic);

            // Si es una respuesta de comando (tiene reqId y result), resolver el comando
            if (data.reqId && data.result) {
                await httpController.resolve(
                    data.reqId,
                    data.result,
                    data.ts || Date.now(),
                    data.error || null
                );
            } else {
                // Si no, solo guardar el mensaje
                await httpController.getModel().create(data);
            }

            logger.debug({ parsedTopic }, "command_handled");
        } catch (error) {
            logger.error({ error, parsedTopic }, "command_handle_failed");
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

            const httpController = new CommandsHTTPController(parsedTopic);

            // Crear comando pendiente en Firestore
            await httpController.createPending({
                reqId,
                ts,
                cmd: params.cmd,
                timeoutMs: params.timeoutMs
            });

            // Construir el topic para publicar
            const publishTopic = `stations/${params.stationId}/controller/${params.controllerId}/locks/${params.lockId}/command/set`;

            // Publicar el comando
            const payload = JSON.stringify({ ts, cmd: params.cmd, reqId, timeoutMs: params.timeoutMs });
            mqttClient.publish(publishTopic, payload, { qos: 1 });

            // Configurar timeout para resolver el comando si no hay respuesta
            setTimeout(async () => {
                try {
                    await httpController.resolve(reqId, "timeout", Date.now());
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

