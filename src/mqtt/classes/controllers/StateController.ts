import { IMqttMessageHandler } from "../../interfaces/IMqttMessageHandler";
import { StateModel } from "../models";
import { StateController as StateHTTPController } from "../../../http/controllers";
import { ParsedTopic } from "../models/ObjectMqttModel";
import { logger } from "../../../config/logger";

/**
 * Handler MQTT para State
 * Implementa IMqttMessageHandler para seguir el Strategy Pattern
 * Procesa mensajes de estado recibidos por MQTT y los guarda en Firestore
 */
class StateController implements IMqttMessageHandler {
    public async handle(
        parsedTopic: ParsedTopic,
        payload: any,
        messageStr: string
    ): Promise<void> {
        try {
            const topic = this.reconstructTopic(parsedTopic);
            const mqttModel = new StateModel(topic, payload, messageStr);

            if (!mqttModel.validate()) {
                logger.warn({ parsedTopic }, "state_validation_failed");
                return;
            }

            const data = mqttModel.getDataForFirestore();
            const httpController = new StateHTTPController(parsedTopic);
            await httpController.save(data);

            logger.debug({ parsedTopic }, "state_handled");
        } catch (error) {
            logger.error({ error, parsedTopic }, "state_handle_failed");
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

export default StateController;

