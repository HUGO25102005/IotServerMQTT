"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locksController = void 0;
const logger_1 = require("../config/logger");
const command_services_1 = require("../domain/services/command.services");
const db_1 = require("../infra/db");
const firestore_1 = require("firebase-admin/firestore");
exports.locksController = {
    async getAll(_req, res) {
        try {
            const stationsSnapshot = await db_1.db.collection("stations").get();
            const allLocks = [];
            for (const stationDoc of stationsSnapshot.docs) {
                const stationId = stationDoc.id;
                const controllersSnapshot = await stationDoc.ref.collection("controllers").get();
                for (const controllerDoc of controllersSnapshot.docs) {
                    const controllerData = controllerDoc.data();
                    const locksSnapshot = await controllerDoc.ref.collection("locks").get();
                    for (const lockDoc of locksSnapshot.docs) {
                        allLocks.push({
                            ...lockDoc.data(),
                            id: lockDoc.id,
                            station_id: stationId,
                            controller_status: controllerData['last_status'],
                        });
                    }
                }
            }
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
        }
        catch (error) {
            logger_1.logger.error({ error }, "get_all_locks_failed");
            res.status(500).json({
                success: false,
                error: "Error interno del servidor"
            });
        }
    },
    async getById(req, res) {
        try {
            const { lockId } = req.params;
            const locksSnapshot = await db_1.db
                .collectionGroup("locks")
                .where(firestore_1.FieldPath.documentId(), "==", lockId)
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
            const controllerDoc = await db_1.db
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
        }
        catch (error) {
            logger_1.logger.error({ error, lockId: req.params['lockId'] }, "get_lock_failed");
            return res.status(500).json({
                success: false,
                error: "Error interno del servidor"
            });
        }
    },
    async lock(req, res) {
        try {
            const { lockId } = req.params;
            const { stationId, controllerId, timeoutMs = 5000 } = req.body;
            if (!stationId || !controllerId) {
                return res.status(400).json({
                    success: false,
                    error: "stationId y controllerId son requeridos"
                });
            }
            const result = await (0, command_services_1.sendCommand)({
                stationId,
                controllerId,
                lockId: lockId,
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
        }
        catch (error) {
            logger_1.logger.error({ error, lockId: req.params['lockId'] }, "lock_command_failed");
            return res.status(500).json({
                success: false,
                error: "Error interno del servidor"
            });
        }
    },
    async unlock(req, res) {
        try {
            const { lockId } = req.params;
            const { stationId, controllerId, timeoutMs = 5000 } = req.body;
            if (!stationId || !controllerId) {
                return res.status(400).json({
                    success: false,
                    error: "stationId y controllerId son requeridos"
                });
            }
            const result = await (0, command_services_1.sendCommand)({
                stationId,
                controllerId,
                lockId: lockId,
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
        }
        catch (error) {
            logger_1.logger.error({ error, lockId: req.params['lockId'] }, "unlock_command_failed");
            return res.status(500).json({
                success: false,
                error: "Error interno del servidor"
            });
        }
    },
    async getCommandStatus(req, res) {
        try {
            const { lockId, reqId } = req.params;
            if (!reqId) {
                return res.status(400).json({
                    success: false,
                    error: "reqId requerido"
                });
            }
            const commandIndexDoc = await db_1.db.collection("commands_index").doc(reqId).get();
            if (!commandIndexDoc.exists) {
                return res.status(404).json({
                    success: false,
                    error: "Comando no encontrado"
                });
            }
            const indexData = commandIndexDoc.data();
            if (indexData['lock_id'] !== lockId) {
                return res.status(404).json({
                    success: false,
                    error: "Comando no encontrado"
                });
            }
            const stationId = indexData['station_id'];
            const controllerId = indexData['controller_id'];
            const lockIdFromIndex = indexData['lock_id'];
            if (!stationId || !controllerId || !lockIdFromIndex) {
                return res.status(404).json({
                    success: false,
                    error: "Comando no encontrado"
                });
            }
            const commandDoc = await db_1.db
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
            const commandData = commandDoc.data();
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
        }
        catch (error) {
            logger_1.logger.error({ error, lockId: req.params['lockId'], reqId: req.params['reqId'] }, "get_command_status_failed");
            return res.status(500).json({
                success: false,
                error: "Error interno del servidor"
            });
        }
    },
    async getEvents(req, res) {
        try {
            const { lockId } = req.params;
            const limit = parseInt(req.query['limit']) || 50;
            const eventsSnapshot = await db_1.db
                .collectionGroup("events")
                .where("lock_id", "==", lockId)
                .orderBy("ts", "desc")
                .limit(limit)
                .get();
            const events = eventsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return res.json({
                success: true,
                data: events
            });
        }
        catch (error) {
            logger_1.logger.error({ error, lockId: req.params['lockId'] }, "get_lock_events_failed");
            return res.status(500).json({
                success: false,
                error: "Error interno del servidor"
            });
        }
    }
};
//# sourceMappingURL=locks.controller.js.map