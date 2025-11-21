import { IMqttMessageHandler } from "../../interfaces/IMqttMessageHandler";
import { EventsModel } from "../models";
import { EventsController as EventsHTTPController } from "../../../http/controllers";
import { ParsedTopic } from "../models/ObjectMqttModel";
import { logger } from "../../../config/logger";

/**
 * Handler MQTT para Eventos
 * Implementa IMqttMessageHandler para seguir el Strategy Pattern
 * Procesa eventos recibidos por MQTT y los guarda en Firestore
 */
class EventsController implements IMqttMessageHandler {
    /**
     * Procesa un mensaje de evento desde MQTT
     * 
     * @param parsedTopic - Topic ya parseado con stationId, controllerId, lockId, action
     * @param payload - Payload del mensaje (ya parseado como JSON)
     * @param messageStr - String original del mensaje
     */
    public async handle(
        parsedTopic: ParsedTopic,
        payload: any,
        messageStr: string
    ): Promise<void> {
        try {
            // Reconstruir el topic string para el modelo
            const topic = this.reconstructTopic(parsedTopic);

            // Crear modelo MQTT para validación
            const mqttModel = new EventsModel(topic, payload, messageStr);

            // Validar el modelo
            if (!mqttModel.validate()) {
                logger.warn({ parsedTopic }, "event_validation_failed");
                return;
            }

            // Obtener datos para Firestore
            const data = mqttModel.getDataForFirestore();

            // Guardar usando el controller HTTP
            const httpController = new EventsHTTPController(parsedTopic);
            await httpController.save(data);

            logger.debug({ parsedTopic }, "event_handled");
        } catch (error) {
            logger.error({ error, parsedTopic }, "event_handle_failed");
            throw error;
        }
    }

    /**
     * Helper para reconstruir el topic desde ParsedTopic
     */
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

export default EventsController;

