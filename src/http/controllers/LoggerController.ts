import { LoggerModel } from "../models";
import { ParsedTopic } from "../../mqtt/classes/models/ObjectMqttModel";
import { logger } from "../../config/logger";
import { v4 as uuidv4 } from "uuid";

/**
 * Tipos de logs disponibles
 */
export type LogType =
    | "duplicate_telemetry"
    | "modification_telemetry"
    | "invalid_data"
    | "error_processing"
    | "request_received"
    | "command_sent"
    | "command_timeout"
    | "event_processed"
    | "state_update"
    | "config_update"
    | string; // Permite tipos personalizados

export type LogSeverity = "info" | "warn" | "error";

export interface LogData {
    type: LogType;
    message: string;
    data?: any; // Datos adicionales relacionados con el log
    severity?: LogSeverity;
    lastSeq?: number; // Último seq conocido (opcional, para telemetría)
}

/**
 * Controller HTTP para Logger
 * Maneja la persistencia de logs/historial en Firestore
 * 
 * Este controller es reutilizable desde cualquier otro controller HTTP.
 * Solo necesita recibir el ParsedTopic y los datos formateados.
 */
class LoggerController {
    private model: LoggerModel;

    constructor(parsedTopic: ParsedTopic) {
        this.model = new LoggerModel(parsedTopic);
    }

    /**
     * Guarda un log en Firestore
     * @param logData - Datos del log ya formateados
     * 
     * Ejemplo de uso desde TelemetryController:
     * ```typescript
     * const loggerController = new LoggerController(this.model.getParsedTopic());
     * await loggerController.save({
     *     type: "duplicate_telemetry",
     *     message: `Telemetría duplicada: seq ${data.seq} <= lastSeq ${lastSeq}`,
     *     data: { seq: data.seq, telemetryData: data },
     *     lastSeq: lastSeq,
     *     severity: "warn"
     * });
     * ```
     */
    public async save(logData: LogData): Promise<void> {
        try {
            const { stationId, controllerId, lockId } = this.model.getParsedTopic();

            await this.model.create({
                uid: uuidv4(),
                type: logData.type,
                message: logData.message,
                lastSeq: logData.lastSeq ?? null,
                data: logData.data || null,
                severity: logData.severity || "warn",
            });

            logger.debug({ stationId, controllerId, lockId, type: logData.type }, "log_saved");
        } catch (error) {
            logger.error({ error, type: logData.type }, "log_save_failed");
            throw error;
        }
    }

    /**
     * Método helper para crear logs de forma más simple
     * Útil para casos comunes
     */
    public static async createLog(
        parsedTopic: ParsedTopic,
        type: LogType,
        message: string,
        options?: {
            data?: any;
            severity?: LogSeverity;
            lastSeq?: number;
        }
    ): Promise<void> {
        const loggerController = new LoggerController(parsedTopic);
        const logData: LogData = {
            type,
            message,
        };

        if (options?.data !== undefined) logData.data = options.data;
        if (options?.severity !== undefined) logData.severity = options.severity;
        if (options?.lastSeq !== undefined) logData.lastSeq = options.lastSeq;

        await loggerController.save(logData);
    }

    /**
     * Obtiene todos los logs
     * @param limit - Número máximo de logs a retornar (opcional)
     * @returns Array de logs
     */
    public async findAll(limit?: number): Promise<any[]> {
        return await this.model.findAll(limit);
    }

    /**
     * Obtiene un log por ID
     * @param logId - ID del log
     * @returns Log o null si no existe
     */
    public async findById(logId: string): Promise<any | null> {
        return await this.model.findById(logId);
    }

    /**
     * Obtiene el modelo para acceso directo si es necesario
     */
    public getModel(): LoggerModel {
        return this.model;
    }
}

export default LoggerController;
