import { TelemetryModel } from "../models";
import { ParsedTopic } from "../../mqtt/classes/models/ObjectMqttModel";
import { updateLockSnapshot, getLastSeq } from "../../domain/repositories/locks.repo";
import { logger } from "../../config/logger";
import { LoggerController } from "./index";

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

        if (!lockId || typeof data?.ts !== "number" || !["locked", "unlocked"].includes(data?.state)) {
            logger.warn({ stationId, controllerId, lockId }, "telemetry_invalid");
            return;
        }

        // Deduplicación por seq si viene
        if (typeof data.seq === "number") {
            const lastSeq = await getLastSeq(stationId, controllerId, lockId);
            if (lastSeq !== undefined && data.seq <= lastSeq) {
                logger.debug({ stationId, controllerId, lockId, seq: data.seq, lastSeq }, "telemetry_duplicate_dropped");

                // Guardar log del duplicado detectado para historial
                // Usa datos ya formateados (data viene formateado desde el modelo MQTT)
                try {
                    const loggerController = new LoggerController(this.model.getParsedTopic());
                    await loggerController.save({
                        type: "duplicate_telemetry",
                        message: `Telemetría duplicada detectada: seq ${data.seq} <= lastSeq ${lastSeq}`,
                        data: {
                            seq: data.seq,
                            telemetryData: data, // Datos ya formateados desde TelemetryModel.getDataForFirestore()
                        },
                        lastSeq: lastSeq,
                        severity: "warn"
                    });
                } catch (error) {
                    logger.error({ error, stationId, controllerId, lockId }, "failed_to_save_duplicate_log");
                }

                // // Drop duplicado - no continuar con el guardado
                // return;
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

