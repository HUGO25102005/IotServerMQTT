import { StatusModel } from "../models";
import { ParsedTopic } from "../../mqtt/classes/models/ObjectMqttModel";
import { logger } from "../../config/logger";

/**
 * Controller HTTP para Status
 * Maneja la persistencia del estado del controlador
 */
class StatusController {
    private model: StatusModel;

    constructor(parsedTopic: ParsedTopic) {
        this.model = new StatusModel(parsedTopic);
    }

    /**
     * Actualiza el estado del controlador
     */
    public async save(data: any): Promise<void> {
        const { stationId, controllerId } = this.model.getParsedTopic();

        // Validar y normalizar el status
        const status = (data?.status === "online" || data?.status === "offline") ? data.status : "unknown";

        try {
            // Actualizar el documento del controller con el status
            await this.model.updateControllerStatus({
                status,
                ...data
            });

            logger.debug({ stationId, controllerId, status }, "status_updated");
        } catch (error) {
            logger.error({ error, stationId, controllerId }, "status_update_failed");
            throw error;
        }
    }

    /**
     * Obtiene el modelo para acceso directo si es necesario
     */
    public getModel(): StatusModel {
        return this.model;
    }
}

export default StatusController;

