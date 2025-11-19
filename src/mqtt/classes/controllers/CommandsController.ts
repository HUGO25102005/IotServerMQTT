import { CommandsModel } from "../models";
import { CommandsController as CommandsHTTPController } from "../../../http/controllers";
import { mqttClient } from "../../../infra/mqtt";
import { logger } from "../../../config/logger";
import { v4 as uuidv4 } from "uuid";

/**
 * Controller MQTT para Commands
 * Único controller que puede publicar mensajes MQTT
 * También procesa respuestas de comandos recibidas por MQTT
 */
class CommandsController {
    private mqttModel: CommandsModel;
    private httpController: CommandsHTTPController;

    constructor(topic: string, payload: any, messageStr: string) {
        this.mqttModel = new CommandsModel(topic, payload, messageStr);
        const parsedTopic = this.mqttModel.parseTopic();
        this.httpController = new CommandsHTTPController(parsedTopic);
    }

    /**
     * Procesa un mensaje de comando recibido (subscribe)
     * Normalmente esto sería una respuesta o ACK del dispositivo
     */
    public async handle(): Promise<void> {
        try {
            // Validar el modelo
            if (!this.mqttModel.validate()) {
                logger.warn({ topic: this.mqttModel.topic }, "command_validation_failed");
                return;
            }

            // Obtener datos para Firestore
            const data = this.mqttModel.getDataForFirestore();

            // Si es una respuesta de comando (tiene reqId y result), resolver el comando
            if (data.reqId && data.result) {
                await this.httpController.resolve(
                    data.reqId,
                    data.result,
                    data.ts || Date.now(),
                    data.error || null
                );
            } else {
                // Si no, solo guardar el mensaje
                await this.httpController.getModel().create(data);
            }

            logger.debug({ topic: this.mqttModel.topic }, "command_handled");
        } catch (error) {
            logger.error({ error, topic: this.mqttModel.topic }, "command_handle_failed");
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
            // Crear comando pendiente en Firestore
            await this.httpController.createPending({
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
                    await this.httpController.resolve(reqId, "timeout", Date.now());
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

    /**
     * Obtiene el modelo MQTT
     */
    public getMqttModel(): CommandsModel {
        return this.mqttModel;
    }
}

export default CommandsController;

