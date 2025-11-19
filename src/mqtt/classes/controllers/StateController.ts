import { StateModel } from "../models";
import { StateController as StateHTTPController } from "../../../http/controllers";
import { logger } from "../../../config/logger";

/**
 * Controller MQTT para State
 * Procesa mensajes de estado recibidos por MQTT y los guarda en Firestore
 */
class StateController {
    private mqttModel: StateModel;
    private httpController: StateHTTPController;

    constructor(topic: string, payload: any, messageStr: string) {
        this.mqttModel = new StateModel(topic, payload, messageStr);
        const parsedTopic = this.mqttModel.parseTopic();
        this.httpController = new StateHTTPController(parsedTopic);
    }

    /**
     * Procesa el mensaje de estado
     */
    public async handle(): Promise<void> {
        try {
            // Validar el modelo
            if (!this.mqttModel.validate()) {
                logger.warn({ topic: this.mqttModel.topic }, "state_validation_failed");
                return;
            }

            // Obtener datos para Firestore
            const data = this.mqttModel.getDataForFirestore();

            // Guardar usando el controller HTTP
            await this.httpController.save(data);

            logger.debug({ topic: this.mqttModel.topic }, "state_handled");
        } catch (error) {
            logger.error({ error, topic: this.mqttModel.topic }, "state_handle_failed");
            throw error;
        }
    }

    /**
     * Obtiene el modelo MQTT
     */
    public getMqttModel(): StateModel {
        return this.mqttModel;
    }
}

export default StateController;

