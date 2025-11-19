import { TelemetryModel } from "../models";
import { ParsedTopic } from "../../mqtt/classes/models/ObjectMqttModel";
import { updateLockSnapshot, getLastSeq } from "../../domain/repositories/locks.repo";
import { logger } from "../../config/logger";

/**
 * Controller HTTP para Telemetry
 * Maneja la persistencia de datos de telemetría en Firestore
 */
class TelemetryController {
    private model: TelemetryModel;

    constructor(parsedTopic: ParsedTopic) {
        this.model = new TelemetryModel(parsedTopic);
    }

    /**
     * Guarda un registro de telemetría
     * Incluye validación, deduplicación por seq y actualización del snapshot del lock
     */
    public async save(data: any): Promise<void> {
        const { stationId, controllerId, lockId } = this.model.getParsedTopic();
        // console.log({ "data de telemetry desde http": data });

        // Validación básica
        if (!lockId || typeof data?.ts !== "number" || !["locked", "unlocked"].includes(data?.state)) {
            // console.log({ "data de telemetry desde http save invalid": data });
            logger.warn({ stationId, controllerId, lockId }, "telemetry_invalid");
            return;
        }
        // console.log({ "data": data });

            // Deduplicación por seq si viene
        if (typeof data.seq === "number") {
            // console.log({ "data.seq": data.seq });
            const lastSeq = await getLastSeq(stationId, controllerId, lockId);
            // console.log({ "lastSeq": lastSeq });
            if (lastSeq !== undefined && data.seq <= lastSeq) {
                logger.debug({ stationId, controllerId, lockId, seq: data.seq, lastSeq }, "telemetry_duplicate_dropped");
                // Drop duplicado
                // falta agregar log aqui para que se pueda ver el hisotrial
            }
        }

        try {
            // console.log({ "data de telemetry desde http save": data });
            // Persistir detalle en la colección telemetry
            await this.model.create({
                ts: data.ts,
                state: data.state,
                battery: data.battery ?? null,
                rssi: data.rssi ?? null,
                fw: data.fw ?? null,
                seq: data.seq ?? null,
            });

            // Actualizar snapshot del lock

            await updateLockSnapshot({
                stationId,
                controllerId,
                lockId,
                state: data.state,
                seq: data.seq,
                battery: data.battery,
                rssi: data.rssi,
            });

            logger.debug({ stationId, controllerId, lockId, seq: data.seq }, "telemetry_saved");
        } catch (error) {
            logger.error({ error, stationId, controllerId, lockId }, "telemetry_save_failed");
            throw error;
        }
    }

    /**
     * Obtiene el modelo para acceso directo si es necesario
     */
    public getModel(): TelemetryModel {
        return this.model;
    }
}

export default TelemetryController;

