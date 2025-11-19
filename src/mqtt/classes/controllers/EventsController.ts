import { EventsModel } from "../models";
import { EventsController as EventsHTTPController } from "../../../http/controllers";
import { logger } from "../../../config/logger";

/**
 * Controller MQTT para Events
 * Procesa eventos recibidos por MQTT y los guarda en Firestore
 */
class EventsController {
    private mqttModel: EventsModel;
    private httpController: EventsHTTPController;

    constructor(topic: string, payload: any, messageStr: string) {
        this.mqttModel = new EventsModel(topic, payload, messageStr);
        const parsedTopic = this.mqttModel.parseTopic();
        this.httpController = new EventsHTTPController(parsedTopic);
    }

    /**
     * Procesa el mensaje de evento
     */
    public async handle(): Promise<void> {
        try {
            // Validar el modelo
            if (!this.mqttModel.validate()) {
                logger.warn({ topic: this.mqttModel.topic }, "event_validation_failed");
                return;
            }

            // Obtener datos para Firestore
            const data = this.mqttModel.getDataForFirestore();

            // Guardar usando el controller HTTP
            await this.httpController.save(data);

            logger.debug({ topic: this.mqttModel.topic }, "event_handled");
        } catch (error) {
            logger.error({ error, topic: this.mqttModel.topic }, "event_handle_failed");
            throw error;
        }
    }

    /**
     * Obtiene el modelo MQTT
     */
    public getMqttModel(): EventsModel {
        return this.mqttModel;
    }
}

export default EventsController;

