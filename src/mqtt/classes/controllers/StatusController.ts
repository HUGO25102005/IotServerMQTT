import { StatusModel } from "../models";
import { StatusController as StatusHTTPController } from "../../../http/controllers";
import { logger } from "../../../config/logger";

/**
 * Controller MQTT para Status
 * Procesa mensajes de status del controlador recibidos por MQTT
 */
class StatusController {
    private mqttModel: StatusModel;
    private httpController: StatusHTTPController;

    constructor(topic: string, payload: any, messageStr: string) {
        this.mqttModel = new StatusModel(topic, payload, messageStr);
        const parsedTopic = this.mqttModel.parseTopic();
        this.httpController = new StatusHTTPController(parsedTopic);
    }

    /**
     * Procesa el mensaje de status
     */
    public async handle(): Promise<void> {
        try {
            // Validar el modelo
            if (!this.mqttModel.validate()) {
                logger.warn({ topic: this.mqttModel.topic }, "status_validation_failed");
                return;
            }

            // Obtener datos para Firestore
            const data = this.mqttModel.getDataForFirestore();

            // Guardar usando el controller HTTP
            await this.httpController.save(data);

            logger.debug({ topic: this.mqttModel.topic }, "status_handled");
        } catch (error) {
            logger.error({ error, topic: this.mqttModel.topic }, "status_handle_failed");
            throw error;
        }
    }

    /**
     * Obtiene el modelo MQTT
     */
    public getMqttModel(): StatusModel {
        return this.mqttModel;
    }
}

export default StatusController;

