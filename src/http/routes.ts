import { Router } from "express";
import { locksController } from "./locks.controller";
import { register } from "../infra/metrics";
import { ParsedTopic } from "../mqtt/classes/models/ObjectMqttModel";
import { LoggerService, TelemetryService } from "../domain/services";
import { CommandHttpController } from "./controllers/CommandHttpController";
// import { CommandHttpController } from "./CommandHttpController";

export const router = Router();

// Locks routes
router.get("/locks", locksController.getAll);
router.get("/locks/:lockId", locksController.getById);
router.post("/locks/:lockId/lock", locksController.lock);
router.post("/locks/:lockId/unlock", locksController.unlock);
router.get("/locks/:lockId/status/:reqId", locksController.getCommandStatus);
router.get("/locks/:lockId/events", locksController.getEvents);

// New command endpoints
router.post("/commands/:lockId", CommandHttpController.publish);
router.get("/commands/status/:commandId", CommandHttpController.getStatus);

// Telemetry routes
router.get("/telemetry", async (req, res) => {
    try {
        const { stationId, controllerId, lockId, limit } = req.query;
        if (!stationId || !controllerId || !lockId) {
            return res.status(400).json({ error: "stationId, controllerId y lockId son requeridos en query params" });
        }
        const parsedTopic: ParsedTopic = {
            stationId: stationId as string,
            controllerId: controllerId as string,
            lockId: lockId as string,
            action: "telemetry",
            hasLocks: true,
        };
        const service = new TelemetryService(parsedTopic);
        const limitNum = limit ? parseInt(limit as string, 10) : undefined;
        const telemetry = await service.findAll(limitNum);
        return res.json({ stationId, controllerId, lockId, count: telemetry.length, data: telemetry });
    } catch (error: any) {
        return res.status(500).json({ error: "Error al obtener telemetría", message: error.message });
    }
});

router.get("/telemetry/:telemetryId", async (req, res) => {
    try {
        const { stationId, controllerId, lockId } = req.query;
        const { telemetryId } = req.params;
        if (!stationId || !controllerId || !lockId) {
            return res.status(400).json({ error: "stationId, controllerId y lockId son requeridos en query params" });
        }
        const parsedTopic: ParsedTopic = {
            stationId: stationId as string,
            controllerId: controllerId as string,
            lockId: lockId as string,
            action: "telemetry",
            hasLocks: true,
        };
        const service = new TelemetryService(parsedTopic);
        const telemetry = await service.findById(telemetryId);
        if (!telemetry) return res.status(404).json({ message: "Telemetría no encontrada" });
        return res.json(telemetry);
    } catch (error: any) {
        return res.status(500).json({ error: "Error al obtener telemetría", message: error.message });
    }
});

// Logs routes
router.get("/logs", async (req, res) => {
    try {
        const { stationId, controllerId, lockId, limit } = req.query;
        if (!stationId || !controllerId || !lockId) {
            return res.status(400).json({ error: "stationId, controllerId y lockId son requeridos en query params" });
        }
        const parsedTopic: ParsedTopic = {
            stationId: stationId as string,
            controllerId: controllerId as string,
            lockId: lockId as string,
            action: "telemetry",
            hasLocks: true,
        };
        const service = new LoggerService(parsedTopic);
        const limitNum = limit ? parseInt(limit as string, 10) : undefined;
        const logs = await service.findAll(limitNum);
        return res.json({ stationId, controllerId, lockId, count: logs.length, data: logs });
    } catch (error: any) {
        return res.status(500).json({ error: "Error al obtener logs", message: error.message });
    }
});

router.get("/logs/:logId", async (req, res) => {
    try {
        const { stationId, controllerId, lockId } = req.query;
        const { logId } = req.params;
        if (!stationId || !controllerId || !lockId) {
            return res.status(400).json({ error: "stationId, controllerId y lockId son requeridos en query params" });
        }
        const parsedTopic: ParsedTopic = {
            stationId: stationId as string,
            controllerId: controllerId as string,
            lockId: lockId as string,
            action: "telemetry",
            hasLocks: true,
        };
        const service = new LoggerService(parsedTopic);
        const log = await service.findById(logId);
        if (!log) return res.status(404).json({ message: "Log no encontrado" });
        return res.json(log);
    } catch (error: any) {
        return res.status(500).json({ error: "Error al obtener log", message: error.message });
    }
});

// Legacy routes
router.get("/controllers/:controllerId/locks", async (req, res) => {
    const { db } = await import("../infra/db");
    const { stationId } = req.query;
    if (!stationId) return res.status(400).json({ error: "stationId requerido en query" });
    const locksSnapshot = await db
        .collection("stations")
        .doc(stationId as string)
        .collection("controllers")
        .doc(req.params.controllerId)
        .collection("locks")
        .get();
    const locks = locksSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return { lockId: doc.id, last_state: data['last_state'], last_battery: data['last_battery'], last_rssi: data['last_rssi'], position: data['position'] };
    });
    return res.json(locks);
});

router.post("/stations/:stationId/controllers/:controllerId/locks/:lockId/:cmd", async (req, res) => {
    const { sendCommand } = await import("../domain/services/command.services");
    const { stationId, controllerId, lockId, cmd } = req.params as any;
    const { timeoutMs = 5000 } = req.body || {};
    const r = await sendCommand({ stationId, controllerId, lockId, cmd, timeoutMs });
    res.status(202).json(r);
});

router.get("/commands/:reqId", async (req, res) => {
    const { db } = await import("../infra/db");
    const commandIndexDoc = await db.collection("commands_index").doc(req.params.reqId).get();
    if (!commandIndexDoc.exists) return res.status(404).json({ message: "Not found" });
    const indexData = commandIndexDoc.data()!;
    const stationId = indexData['station_id'];
    const controllerId = indexData['controller_id'];
    const lockId = indexData['lock_id'];
    if (!stationId || !controllerId || !lockId) return res.status(404).json({ message: "Not found" });
    const commandDoc = await db
        .collection("stations")
        .doc(stationId)
        .collection("controllers")
        .doc(controllerId)
        .collection("locks")
        .doc(lockId)
        .collection("commands")
        .doc(req.params.reqId)
        .get();
    if (!commandDoc.exists) return res.status(404).json({ message: "Not found" });
    const commandData = commandDoc.data()!;
    return res.json({ req_id: commandDoc.id, status: commandData['status'], error_msg: commandData['error_msg'], ts_requested: commandData['ts_requested'], ts_resolved: commandData['ts_resolved'] });
});

// Prometheus metrics
router.get("/metrics", async (_req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});
