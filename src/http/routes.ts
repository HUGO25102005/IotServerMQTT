import { Router } from "express";
import { locksController } from "./locks.controller";
import { register } from "../infra/metrics";

export const router = Router();

// Rutas de locks
router.get("/locks", locksController.getAll);
router.get("/locks/:lockId", locksController.getById);
router.post("/locks/:lockId/lock", locksController.lock);
router.post("/locks/:lockId/unlock", locksController.unlock);
router.get("/locks/:lockId/status/:reqId", locksController.getCommandStatus);
router.get("/locks/:lockId/events", locksController.getEvents);

// Rutas legacy (mantener compatibilidad)
router.get("/controllers/:controllerId/locks", async (req, res) => {
    const { db } = await import("../infra/db");
    const { stationId } = req.query;

    if (!stationId) {
        return res.status(400).json({ error: "stationId requerido en query" });
    }

    const locksSnapshot = await db
        .collection("stations")
        .doc(stationId as string)
        .collection("controllers")
        .doc(req.params.controllerId)
        .collection("locks")
        .get();

    const locks = locksSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            lockId: doc.id,
            last_state: data['last_state'],
            last_battery: data['last_battery'],
            last_rssi: data['last_rssi'],
            position: data['position'],
        };
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

    // Leer de commands_index para búsqueda rápida
    const commandIndexDoc = await db.collection("commands_index").doc(req.params.reqId).get();

    if (!commandIndexDoc.exists) {
        return res.status(404).json({ message: "Not found" });
    }

    const indexData = commandIndexDoc.data()!;
    const stationId = indexData['station_id'];
    const controllerId = indexData['controller_id'];
    const lockId = indexData['lock_id'];

    if (!stationId || !controllerId || !lockId) {
        return res.status(404).json({ message: "Not found" });
    }

    // Obtener comando completo
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

    if (!commandDoc.exists) {
        return res.status(404).json({ message: "Not found" });
    }

    const commandData = commandDoc.data()!;
    return res.json({
        req_id: commandDoc.id,
        status: commandData['status'],
        error_msg: commandData['error_msg'],
        ts_requested: commandData['ts_requested'],
        ts_resolved: commandData['ts_resolved'],
    });
});

// Métricas Prometheus
router.get("/metrics", async (_req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});