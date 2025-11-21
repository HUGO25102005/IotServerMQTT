import { IMqttMessageHandler } from "../../interfaces/IMqttMessageHandler";
import { ConfigModel } from "../models";
import { ParsedTopic } from "../models/ObjectMqttModel";
import { logger } from "../../../config/logger";
import { ConfigService } from "../../../domain/services";

/**
 * Handler MQTT para Config
 * Implementa IMqttMessageHandler para seguir el Strategy Pattern
 * Procesa mensajes de configuración del controlador recibidos por MQTT (retained)
 */
class ConfigController implements IMqttMessageHandler {
    public async handle(
        parsedTopic: ParsedTopic,
        payload: any,
        messageStr: string
    ): Promise<void> {
        try {
            const topic = this.reconstructTopic(parsedTopic);
            const mqttModel = new ConfigModel(topic, payload, messageStr);

            if (!mqttModel.validate()) {
                logger.warn({ parsedTopic }, "config_validation_failed");
                return;
            }

            const data = mqttModel.getDataForFirestore();
            // Guardar usando el servicio de dominio
            const service = new ConfigService(parsedTopic);
            await service.save(data);

            logger.debug({ parsedTopic }, "config_handled");
        } catch (error) {
            logger.error({ error, parsedTopic }, "config_handle_failed");
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

export default ConfigController;

