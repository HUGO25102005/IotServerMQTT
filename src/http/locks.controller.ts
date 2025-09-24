import { Request, Response } from "express";
import { logger } from "../config/logger";
import { sendCommand } from "../domain/services/command.services";
import { pool } from "../infra/db";

export const locksController = {
    // Obtener estado de todos los locks
    async getAll(req: Request, res: Response) {
        try {
            const [rows] = await pool.execute(
                `SELECT l.*, c.station_id, c.last_status as controller_status
         FROM locks l
         JOIN controllers c ON l.controller_id = c.id
         ORDER BY c.station_id, l.position`
            );

            res.json({
                success: true,
                data: rows
            });
        } catch (error) {
            logger.error({ error }, "get_all_locks_failed");
            res.status(500).json({
                success: false,
                error: "Error interno del servidor"
            });
        }
    },

    // Obtener estado de un lock específico
    async getById(req: Request, res: Response) {
        try {
            const { lockId } = req.params;

            const [rows]: any = await pool.execute(
                `SELECT l.*, c.station_id, c.last_status as controller_status
         FROM locks l
         JOIN controllers c ON l.controller_id = c.id
         WHERE l.id = ?`,
                [lockId]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Lock no encontrado"
                });
            }

            res.json({
                success: true,
                data: rows[0]
            });
        } catch (error) {
            logger.error({ error, lockId: req.params['lockId'] }, "get_lock_failed");
            res.status(500).json({
                success: false,
                error: "Error interno del servidor"
            });
        }
    },

    // Bloquear un lock
    async lock(req: Request, res: Response) {
        try {
            const { lockId } = req.params;
            const { stationId, controllerId, timeoutMs = 5000 } = req.body;

            if (!stationId || !controllerId) {
                return res.status(400).json({
                    success: false,
                    error: "stationId y controllerId son requeridos"
                });
            }

            const result = await sendCommand({
                stationId,
                controllerId,
                lockId: lockId!,
                cmd: "lock",
                timeoutMs
            });

            res.status(202).json({
                success: true,
                message: "Comando de bloqueo enviado",
                data: {
                    reqId: result.reqId,
                    statusUrl: `/api/locks/${lockId}/status/${result.reqId}`
                }
            });
        } catch (error) {
            logger.error({ error, lockId: req.params['lockId'] }, "lock_command_failed");
            res.status(500).json({
                success: false,
                error: "Error interno del servidor"
            });
        }
    },

    // Desbloquear un lock
    async unlock(req: Request, res: Response) {
        try {
            const { lockId } = req.params;
            const { stationId, controllerId, timeoutMs = 5000 } = req.body;

            if (!stationId || !controllerId) {
                return res.status(400).json({
                    success: false,
                    error: "stationId y controllerId son requeridos"
                });
            }

            const result = await sendCommand({
                stationId,
                controllerId,
                lockId: lockId!,
                cmd: "unlock",
                timeoutMs
            });

            res.status(202).json({
                success: true,
                message: "Comando de desbloqueo enviado",
                data: {
                    reqId: result.reqId,
                    statusUrl: `/api/locks/${lockId}/status/${result.reqId}`
                }
            });
        } catch (error) {
            logger.error({ error, lockId: req.params['lockId'] }, "unlock_command_failed");
            res.status(500).json({
                success: false,
                error: "Error interno del servidor"
            });
        }
    },

    // Obtener estado de un comando
    async getCommandStatus(req: Request, res: Response) {
        try {
            const { lockId, reqId } = req.params;

            const [rows]: any = await pool.execute(
                `SELECT * FROM commands WHERE req_id = ? AND lock_id = ?`,
                [reqId, lockId]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Comando no encontrado"
                });
            }

            const command = rows[0];
            res.json({
                success: true,
                data: {
                    reqId: command.req_id,
                    cmd: command.cmd,
                    status: command.status,
                    requestedAt: command.ts_requested,
                    resolvedAt: command.ts_resolved,
                    errorMsg: command.error_msg
                }
            });
        } catch (error) {
            logger.error({ error, lockId: req.params['lockId'], reqId: req.params['reqId'] }, "get_command_status_failed");
            res.status(500).json({
                success: false,
                error: "Error interno del servidor"
            });
        }
    },

    // Obtener eventos de un lock
    async getEvents(req: Request, res: Response) {
        try {
            const { lockId } = req.params;
            const limit = parseInt(req.query['limit'] as string) || 50;

            const [rows] = await pool.execute(
                `SELECT * FROM events 
         WHERE lock_id = ? 
         ORDER BY ts DESC 
         LIMIT ?`,
                [lockId, limit]
            );

            res.json({
                success: true,
                data: rows
            });
        } catch (error) {
            logger.error({ error, lockId: req.params['lockId'] }, "get_lock_events_failed");
            res.status(500).json({
                success: false,
                error: "Error interno del servidor"
            });
        }
    }
};
