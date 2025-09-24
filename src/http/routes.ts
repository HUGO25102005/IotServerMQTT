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
    const { pool } = await import("../infra/db");
    const [rows]: any = await pool.query(
        "SELECT id AS lockId, last_state, last_battery, last_rssi, position FROM locks WHERE controller_id=?",
        [req.params.controllerId]
    );
    res.json(rows);
});

router.post("/stations/:stationId/controllers/:controllerId/locks/:lockId/:cmd", async (req, res) => {
    const { sendCommand } = await import("../domain/services/command.services");
    const { stationId, controllerId, lockId, cmd } = req.params as any;
    const { timeoutMs = 5000 } = req.body || {};
    const r = await sendCommand({ stationId, controllerId, lockId, cmd, timeoutMs });
    res.status(202).json(r);
});

router.get("/commands/:reqId", async (req, res) => {
    const { pool } = await import("../infra/db");
    const [rows]: any = await pool.query(
        "SELECT req_id, status, error_msg, ts_requested, ts_resolved FROM commands WHERE req_id=?",
        [req.params.reqId]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
});

// Métricas Prometheus
router.get("/metrics", async (_req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});