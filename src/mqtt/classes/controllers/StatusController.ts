import { IMqttMessageHandler } from "../../interfaces/IMqttMessageHandler";
import { StatusModel } from "../models";
import { ParsedTopic } from "../models/ObjectMqttModel";
import { logger } from "../../../config/logger";
import { StatusService } from "../../../domain/services";

/**
 * Handler MQTT para Status
 * Implementa IMqttMessageHandler para seguir el Strategy Pattern
 * Procesa mensajes de status del controlador recibidos por MQTT
 */
class StatusController implements IMqttMessageHandler {
    public async handle(
        parsedTopic: ParsedTopic,
        payload: any,
        messageStr: string
    ): Promise<void> {
        try {
            const topic = this.reconstructTopic(parsedTopic);
            const mqttModel = new StatusModel(topic, payload, messageStr);

            if (!mqttModel.validate()) {
                logger.warn({ parsedTopic }, "status_validation_failed");
                return;
            }

            const data = mqttModel.getDataForFirestore();
            // Guardar usando el servicio de dominio
            const service = new StatusService(parsedTopic);
            await service.save(data);

            logger.debug({ parsedTopic }, "status_handled");
        } catch (error) {
            logger.error({ error, parsedTopic }, "status_handle_failed");
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

export default StatusController;

