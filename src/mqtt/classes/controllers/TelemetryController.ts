import { TelemetryModel } from "../models";
import { TelemetryController as TelemetryHTTPController } from "../../../http/controllers";
import { logger } from "../../../config/logger";

/**
 * Controller MQTT para Telemetry
 * Procesa mensajes de telemetría recibidos por MQTT y los guarda en Firestore
 */
class TelemetryController {
    private mqttModel: TelemetryModel;
    private httpController: TelemetryHTTPController;

    constructor(topic: string, payload: any, messageStr: string) {
        this.mqttModel = new TelemetryModel(topic, payload, messageStr);
        const parsedTopic = this.mqttModel.parseTopic();
        this.httpController = new TelemetryHTTPController(parsedTopic);
    }

    /**
     * Procesa el mensaje de telemetría
     */
    public async handle(): Promise<void> {
        try {
            // Validar el modelo
            if (!this.mqttModel.validate()) {
                logger.warn({ topic: this.mqttModel.topic }, "telemetry_validation_failed");
                return;
            }

            // Obtener datos para Firestore
            const data = this.mqttModel.getDataForFirestore();
            // console.log({ "data de telemetry": data });

            // console.log({ "data de telemetry": data });
            // Guardar usando el controller HTTP
            await this.httpController.save(data);

            logger.debug({ topic: this.mqttModel.topic }, "telemetry_handled");
        } catch (error) {
            logger.error({ error, topic: this.mqttModel.topic }, "telemetry_handle_failed");
            throw error;
        }
    }

    /**
     * Obtiene el modelo MQTT
     */
    public getMqttModel(): TelemetryModel {
        return this.mqttModel;
    }
}

export default TelemetryController;

