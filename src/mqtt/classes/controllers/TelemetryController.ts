import { IMqttMessageHandler } from "../../interfaces/IMqttMessageHandler";
import { TelemetryModel } from "../models";
import { ParsedTopic } from "../models/ObjectMqttModel";
import { logger } from "../../../config/logger";
import { TelemetryService } from "../../../domain/services";


/**
 * Handler MQTT para Telemetría
 * Implementa IMqttMessageHandler para seguir el Strategy Pattern
 * Procesa mensajes de telemetría recibidos por MQTT y los guarda en Firestore
 */
class TelemetryController implements IMqttMessageHandler {
    /**
     * Procesa un mensaje de telemetría desde MQTT
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
            logger.info({ parsedTopic }, "[Telemetry] Handler iniciado");

            // Reconstruir el topic string para el modelo (temporal hasta que refactoricemos los modelos)
            const topic = this.reconstructTopic(parsedTopic);
            logger.info({ topic }, "[Telemetry] Topic reconstruido");

            // Crear modelo MQTT para validación
            const mqttModel = new TelemetryModel(topic, payload, messageStr);
            logger.info({ payload }, "[Telemetry] Modelo creado");

            // Validar el modelo
            if (!mqttModel.validate()) {
                logger.warn({ parsedTopic, payload }, "[Telemetry] Validación fallida");
                return;
            }

            logger.info({}, "[Telemetry] Modelo validado correctamente");

            // Obtener datos para Firestore
            const data = mqttModel.getDataForFirestore();
            logger.info({ data }, "[Telemetry] Datos preparados para Firestore");

            // Guardar usando el servicio de dominio
            const service = new TelemetryService(parsedTopic);
            logger.info({}, "[Telemetry] Servicio creado, llamando save()");
            await service.save(data);

            logger.info({ parsedTopic }, "[Telemetry] telemetry_handled");
        } catch (error) {
            logger.error({ error, parsedTopic }, "[Telemetry] telemetry_handle_failed");
            throw error;
        }
    }

    /**
     * Helper para reconstruir el topic desde ParsedTopic
     * Temporal hasta que refactoricemos los modelos MQTT para no depender del topic string
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

export default TelemetryController;

