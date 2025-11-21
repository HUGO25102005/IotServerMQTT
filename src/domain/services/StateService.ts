import { StateModel } from "../../http/models";
import { ParsedTopic } from "../../mqtt/classes/models/ObjectMqttModel";
import { resolve } from "../repositories/commands.repo";
import { updateLockSnapshot } from "../repositories/locks.repo";
import { logger } from "../../config/logger";

/**
 * Servicio de Estado
 * Maneja la lógica de negocio relacionada con el estado de locks
 * Incluye resolución de comandos y actualización de snapshots
 */
class StateService {
    private model: StateModel;

    constructor(parsedTopic: ParsedTopic) {
        this.model = new StateModel(parsedTopic);
    }

    /**
     * Procesa un mensaje de estado
     * Resuelve comandos pendientes y actualiza el snapshot del lock
     */
    public async save(data: any): Promise<void> {
        const { stationId, controllerId, lockId } = this.model.getParsedTopic();

        // Validación básica
        if (!lockId || typeof data?.ts !== "number" || !data?.reqId || !["ok", "error"].includes(data?.result)) {
            logger.warn({ controllerId, lockId }, "state_invalid");
            return;
        }

        try {
            // Resolver comando pendiente
            await resolve(data.reqId, data.result, data.ts, data.error || null);

            // Actualizar snapshot del lock si viene el estado
            if ((data.state === "locked" || data.state === "unlocked") && stationId) {
                await updateLockSnapshot({
                    stationId,
                    controllerId,
                    lockId,
                    state: data.state,
                });
            }

            // Guardar registro histórico del estado
            await this.model.updateLockState(data);

            logger.debug({ stationId, controllerId, lockId, reqId: data.reqId, result: data.result }, "state_processed");
        } catch (error) {
            logger.error({ error, controllerId, lockId, reqId: data.reqId }, "state_save_failed");
            throw error;
        }
    }

    /**
     * Obtiene el modelo para acceso directo si es necesario
     */
    public getModel(): StateModel {
        return this.model;
    }
}

export default StateService;
