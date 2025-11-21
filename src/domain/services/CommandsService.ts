import { CommandsModel } from "../../http/models";
import { ParsedTopic } from "../../mqtt/classes/models/ObjectMqttModel";
import { createPending, resolve } from "../repositories/commands.repo";
import { logger } from "../../config/logger";

/**
 * Servicio de Comandos
 * Maneja la lógica de negocio relacionada con comandos de locks
 * Incluye creación de comandos pendientes y resolución de respuestas
 */
class CommandsService {
    private model: CommandsModel;

    constructor(parsedTopic: ParsedTopic) {
        this.model = new CommandsModel(parsedTopic);
    }

    /**
     * Crea un comando pendiente
     * Usado cuando se envía un comando al dispositivo
     */
    public async createPending(data: {
        reqId: string;
        ts: number;
        cmd: "lock" | "unlock" | "reboot";
        timeoutMs: number;
    }): Promise<void> {
        const { stationId, controllerId, lockId } = this.model.getParsedTopic();

        if (!lockId) {
            throw new Error("lockId is required for commands");
        }

        try {
            // Crear registro pendiente en el repositorio
            await createPending({
                reqId: data.reqId,
                stationId,
                controllerId,
                lockId,
                cmd: data.cmd,
                ts: data.ts,
                timeoutMs: data.timeoutMs
            });

            // También guardar en la colección de comandos
            await this.model.create({
                req_id: data.reqId,
                cmd: data.cmd,
                ts: data.ts,
                timeout_ms: data.timeoutMs,
                status: "pending"
            }, data.reqId);

            logger.debug({ stationId, controllerId, lockId, reqId: data.reqId, cmd: data.cmd }, "command_pending_created");
        } catch (error) {
            logger.error({ error, stationId, controllerId, lockId, reqId: data.reqId }, "command_create_failed");
            throw error;
        }
    }

    /**
     * Resuelve un comando (cuando llega la respuesta del dispositivo)
     */
    public async resolve(reqId: string, result: "success" | "error" | "timeout", ts: number, error?: string | null): Promise<void> {
        try {
            // Resolver en el repositorio
            await resolve(reqId, result === "success" ? "ok" : result === "error" ? "error" : "timeout", ts, error || undefined);

            // Actualizar en la colección de comandos
            const commandDoc = await this.model.findById(reqId);
            if (commandDoc) {
                await this.model.update(reqId, {
                    status: result,
                    ts_resolved: ts,
                    error_msg: error || null
                });
            }

            logger.debug({ reqId, result, error }, "command_resolved");
        } catch (error) {
            logger.error({ error, reqId }, "command_resolve_failed");
            throw error;
        }
    }

    /**
     * Obtiene el modelo para acceso directo si es necesario
     */
    public getModel(): CommandsModel {
        return this.model;
    }
}

export default CommandsService;
