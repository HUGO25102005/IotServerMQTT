import { IMqttMessageHandler } from "../../interfaces/IMqttMessageHandler";
import { ParsedTopic } from "../models/ObjectMqttModel";
import { logger } from "../../../config/logger";
import { LoggerService } from "../../../domain/services";

/**
 * Handler MQTT para Display
 * Procesa mensajes de display enviados por los controladores
 * Guarda los datos en logs para historial
 */
class DisplayController implements IMqttMessageHandler {
    /**
     * Procesa un mensaje de display recibido
     */
    public async handle(
        parsedTopic: ParsedTopic,
        payload: any,
        messageStr: string
    ): Promise<void> {
        try {
            const { stationId, controllerId } = parsedTopic;

            logger.info({
                stationId,
                controllerId,
                payload
            }, "[DisplayController] Mensaje de display recibido");

            // Guardar en logs para historial
            const loggerService = new LoggerService(parsedTopic);
            await loggerService.save({
                type: "display_message",
                message: messageStr,
                data: payload,
                severity: "info"
            });

            logger.debug({ parsedTopic }, "display_message_saved");
        } catch (error) {
            logger.error({ error, parsedTopic }, "[DisplayController] Error al manejar mensaje de display");
            throw error;
        }
    }
}

export default DisplayController;
