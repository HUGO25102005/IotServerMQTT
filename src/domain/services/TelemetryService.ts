import { TelemetryModel } from "../../http/models";
import { ParsedTopic } from "../../mqtt/classes/models/ObjectMqttModel";
import { updateLockSnapshot, getLastSeq } from "../repositories/locks.repo";
import { logger } from "../../config/logger";
import { LoggerService } from "./index";

/**
 * Servicio de Telemetría
 * Maneja la lógica de negocio relacionada con telemetría de locks
 * Incluye persistencia, validación, deduplicación y actualización de snapshots
 */
class TelemetryService {
    private model: TelemetryModel;

    constructor(parsedTopic: ParsedTopic) {
        this.model = new TelemetryModel(parsedTopic);
    }

    /**
     * Guarda un registro de telemetría
     * Incluye validación, deduplicación por seq y actualización del snapshot del lock
     * Soporta tanto el formato antiguo (ts, state) como el nuevo formato del dispositivo
     */
    public async save(data: any): Promise<void> {
        const { stationId, controllerId, lockId } = this.model.getParsedTopic();

        // Mapear datos del dispositivo al formato esperado
        let ts: number;
        let state: "locked" | "unlocked";

        // Formato nuevo del dispositivo: tiene timestamp o hora+fecha, y servomotor.estado
        if (data?.servomotor?.estado) {
            // Obtener timestamp
            if (typeof data.timestamp === "number") {
                ts = data.timestamp;
            } else if (data.hora && data.fecha) {
                // Convertir hora y fecha a timestamp
                // Formato esperado: hora: "HH:MM:SS", fecha: "DD/MM/YYYY"
                const [day, month, year] = data.fecha.split('/');
                const [hour, minute, second] = data.hora.split(':');
                const dateObj = new Date(year, month - 1, day, hour, minute, second);
                ts = dateObj.getTime();
            } else {
                // Si no hay timestamp ni hora/fecha, usar el tiempo actual
                ts = Date.now();
            }

            // Mapear estado del servomotor a locked/unlocked
            const estadoServomotor = data.servomotor.estado.toLowerCase();
            if (estadoServomotor === "libre") {
                state = "unlocked";
            } else if (estadoServomotor === "ocupado") {
                state = "locked";
            } else {
                logger.warn({ stationId, controllerId, lockId, estadoServomotor }, "telemetry_invalid_servo_state");
                return;
            }
        }
        // Formato antiguo: tiene ts y state directamente
        else if (typeof data?.ts === "number" && ["locked", "unlocked"].includes(data?.state)) {
            ts = data.ts;
            state = data.state;
        }
        // Formato inválido
        else {
            logger.warn({ stationId, controllerId, lockId, data }, "telemetry_invalid");
            return;
        }

        if (!lockId) {
            logger.warn({ stationId, controllerId, lockId, data }, "telemetry_missing_lockid");
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
                    const loggerService = new LoggerService(this.model.getParsedTopic());
                    await loggerService.save({
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
            // Persistir detalle en la colección telemetry
            // Incluir campos tanto del formato nuevo como del antiguo
            await this.model.create({
                ts,
                state,
                // Campos del formato antiguo (si existen)
                battery: data.battery ?? null,
                rssi: data.rssi ?? null,
                fw: data.fw ?? null,
                seq: data.seq ?? null,
                // Campos del formato nuevo del dispositivo (si existen)
                lock_id: data.lock_id ?? null,
                sensor_ultrasonico: data.sensor_ultrasonico ?? null,
                servomotor: data.servomotor ?? null,
                fotoresistencia: data.fotoresistencia ?? null,
                hora: data.hora ?? null,
                fecha: data.fecha ?? null,
            });

            // Actualizar snapshot del lock
            await updateLockSnapshot({
                stationId,
                controllerId,
                lockId,
                state,
                seq: data.seq,
                battery: data.battery,
                rssi: data.rssi,
            });

            logger.debug({ stationId, controllerId, lockId, seq: data.seq, state }, "telemetry_saved");
        } catch (error) {
            logger.error({ error, stationId, controllerId, lockId }, "telemetry_save_failed");
            throw error;
        }
    }

    /**
     * Obtiene todos los registros de telemetría
     * @param limit - Número máximo de registros a retornar (opcional)
     * @returns Array de registros de telemetría
     */
    public async findAll(limit?: number): Promise<any[]> {
        return await this.model.findAll(limit);
    }

    /**
     * Obtiene un registro de telemetría por ID
     * @param telemetryId - ID del registro de telemetría
     * @returns Registro de telemetría o null si no existe
     */
    public async findById(telemetryId: string): Promise<any | null> {
        return await this.model.findById(telemetryId);
    }

    /**
     * Obtiene el modelo para acceso directo si es necesario
     */
    public getModel(): TelemetryModel {
        return this.model;
    }
}

export default TelemetryService;
