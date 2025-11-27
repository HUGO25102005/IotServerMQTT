import { Request, Response } from "express";
import { logger } from "../config/logger";
import { sendCommand } from "../domain/services/command.services";
import { db } from "../infra/db";
import { FieldPath } from "firebase-admin/firestore";

export const locksController = {
    // Obtener estado de todos los locks
    async getAll(_req: Request, res: Response) {
        console.log("getAllLocks");
        try {
            // Usar collectionGroup para obtener TODOS los locks sin importar la jerarquía
            // Esto funciona incluso si los documentos padre (stations/controllers) no existen
            const locksSnapshot = await db.collectionGroup("locks").get();

            console.log(`✅ Encontrados ${locksSnapshot.size} locks usando collectionGroup`);

            const allLocks: any[] = [];

            for (const lockDoc of locksSnapshot.docs) {
                const lockData = lockDoc.data();

                // Extraer stationId y controllerId del path
                // path format: stations/{stationId}/controllers/{controllerId}/locks/{lockId}
                const pathParts = lockDoc.ref.path.split("/");
                const stationId = pathParts[1];
                const controllerId = pathParts[3];

                console.log(`Lock encontrado: ${lockDoc.id} en ${lockDoc.ref.path}`);

                allLocks.push({
                    ...lockData,
                    id: lockDoc.id,
                    station_id: stationId,
                    controller_id: controllerId,
                });
            }

            // Ordenar por station_id y position
            allLocks.sort((a, b) => {
                if (a.station_id !== b.station_id) {
                    return a.station_id.localeCompare(b.station_id);
                }
                return (a.position || "").localeCompare(b.position || "");
            });

            res.json({
                success: true,
                data: allLocks
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

            const locksSnapshot = await db
                .collectionGroup("locks")
                .where(FieldPath.documentId(), "==", lockId)
                .limit(1)
                .get();

            if (locksSnapshot.empty) {
                return res.status(404).json({
                    success: false,
                    error: "Lock no encontrado"
                });
            }

            const lockDoc = locksSnapshot.docs[0];
            if (!lockDoc) {
                return res.status(404).json({
                    success: false,
                    error: "Lock no encontrado"
                });
            }

            const lockData = lockDoc.data();
            const lockPath = lockDoc.ref.path.split("/");
            const stationId = lockPath[1];
            const controllerId = lockPath[3];

            if (!stationId || !controllerId) {
                return res.status(404).json({
                    success: false,
                    error: "Lock no encontrado"
                });
            }

            // Obtener controller para controller_status
            const controllerDoc = await db
                .collection("stations")
                .doc(stationId)
                .collection("controllers")
                .doc(controllerId)
                .get();

            return res.json({
                success: true,
                data: {
                    ...lockData,
                    id: lockDoc.id,
                    station_id: stationId,
                    controller_status: controllerDoc.data()?.['last_status'],
                }
            });
        } catch (error) {
            logger.error({ error, lockId: req.params['lockId'] }, "get_lock_failed");
            return res.status(500).json({
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

            return res.status(202).json({
                success: true,
                message: "Comando de bloqueo enviado",
                data: {
                    reqId: result.reqId,
                    statusUrl: `/api/locks/${lockId}/status/${result.reqId}`
                }
            });
        } catch (error) {
            logger.error({ error, lockId: req.params['lockId'] }, "lock_command_failed");
            return res.status(500).json({
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

            return res.status(202).json({
                success: true,
                message: "Comando de desbloqueo enviado",
                data: {
                    reqId: result.reqId,
                    statusUrl: `/api/locks/${lockId}/status/${result.reqId}`
                }
            });
        } catch (error) {
            logger.error({ error, lockId: req.params['lockId'] }, "unlock_command_failed");
            return res.status(500).json({
                success: false,
                error: "Error interno del servidor"
            });
        }
    },

    // Obtener estado de un comando
    async getCommandStatus(req: Request, res: Response) {
        try {
            const { lockId, reqId } = req.params;

            if (!reqId) {
                return res.status(400).json({
                    success: false,
                    error: "reqId requerido"
                });
            }

            // Usar commands_index para búsqueda rápida
            const commandIndexDoc = await db.collection("commands_index").doc(reqId).get();

            if (!commandIndexDoc.exists) {
                return res.status(404).json({
                    success: false,
                    error: "Comando no encontrado"
                });
            }

            const indexData = commandIndexDoc.data()!;

            // Verificar que el lock_id coincida
            if (indexData['lock_id'] !== lockId) {
                return res.status(404).json({
                    success: false,
                    error: "Comando no encontrado"
                });
            }

            // Obtener comando completo
            const stationId = indexData['station_id'];
            const controllerId = indexData['controller_id'];
            const lockIdFromIndex = indexData['lock_id'];

            if (!stationId || !controllerId || !lockIdFromIndex) {
                return res.status(404).json({
                    success: false,
                    error: "Comando no encontrado"
                });
            }

            const commandDoc = await db
                .collection("stations")
                .doc(stationId)
                .collection("controllers")
                .doc(controllerId)
                .collection("locks")
                .doc(lockIdFromIndex)
                .collection("commands")
                .doc(reqId)
                .get();

            if (!commandDoc.exists) {
                return res.status(404).json({
                    success: false,
                    error: "Comando no encontrado"
                });
            }

            const commandData = commandDoc.data()!;
            return res.json({
                success: true,
                data: {
                    reqId: commandDoc.id,
                    cmd: commandData['cmd'],
                    status: commandData['status'],
                    requestedAt: commandData['ts_requested'],
                    resolvedAt: commandData['ts_resolved'],
                    errorMsg: commandData['error_msg']
                }
            });
        } catch (error) {
            logger.error({ error, lockId: req.params['lockId'], reqId: req.params['reqId'] }, "get_command_status_failed");
            return res.status(500).json({
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

            const eventsSnapshot = await db
                .collectionGroup("events")
                .where("lock_id", "==", lockId)
                .orderBy("ts", "desc")
                .limit(limit)
                .get();

            const events = eventsSnapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }));

            return res.json({
                success: true,
                data: events
            });
        } catch (error) {
            logger.error({ error, lockId: req.params['lockId'] }, "get_lock_events_failed");
            return res.status(500).json({
                success: false,
                error: "Error interno del servidor"
            });
        }
    }
};
