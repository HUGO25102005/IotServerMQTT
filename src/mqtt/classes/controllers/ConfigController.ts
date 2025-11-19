import { ConfigModel } from "../models";
import { ConfigController as ConfigHTTPController } from "../../../http/controllers";
import { logger } from "../../../config/logger";

/**
 * Controller MQTT para Config
 * Procesa mensajes de configuración del controlador recibidos por MQTT (retained)
 */
class ConfigController {
    private mqttModel: ConfigModel;
    private httpController: ConfigHTTPController;

    constructor(topic: string, payload: any, messageStr: string) {
        this.mqttModel = new ConfigModel(topic, payload, messageStr);
        const parsedTopic = this.mqttModel.parseTopic();
        this.httpController = new ConfigHTTPController(parsedTopic);
    }

    /**
     * Procesa el mensaje de configuración
     */
    public async handle(): Promise<void> {
        try {
            // Validar el modelo
            if (!this.mqttModel.validate()) {
                logger.warn({ topic: this.mqttModel.topic }, "config_validation_failed");
                return;
            }

            // Obtener datos para Firestore
            const data = this.mqttModel.getDataForFirestore();

            // Guardar usando el controller HTTP
            await this.httpController.save(data);

            logger.debug({ topic: this.mqttModel.topic }, "config_handled");
        } catch (error) {
            logger.error({ error, topic: this.mqttModel.topic }, "config_handle_failed");
            throw error;
        }
    }

    /**
     * Obtiene el modelo MQTT
     */
    public getMqttModel(): ConfigModel {
        return this.mqttModel;
    }
}

export default ConfigController;

