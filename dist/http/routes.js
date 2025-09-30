"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const locks_controller_1 = require("./locks.controller");
const metrics_1 = require("../infra/metrics");
exports.router = (0, express_1.Router)();
exports.router.get("/locks", locks_controller_1.locksController.getAll);
exports.router.get("/locks/:lockId", locks_controller_1.locksController.getById);
exports.router.post("/locks/:lockId/lock", locks_controller_1.locksController.lock);
exports.router.post("/locks/:lockId/unlock", locks_controller_1.locksController.unlock);
exports.router.get("/locks/:lockId/status/:reqId", locks_controller_1.locksController.getCommandStatus);
exports.router.get("/locks/:lockId/events", locks_controller_1.locksController.getEvents);
exports.router.get("/controllers/:controllerId/locks", async (req, res) => {
    const { pool } = await Promise.resolve().then(() => __importStar(require("../infra/db")));
    const [rows] = await pool.query("SELECT id AS lockId, last_state, last_battery, last_rssi, position FROM locks WHERE controller_id=?", [req.params.controllerId]);
    res.json(rows);
});
exports.router.post("/stations/:stationId/controllers/:controllerId/locks/:lockId/:cmd", async (req, res) => {
    const { sendCommand } = await Promise.resolve().then(() => __importStar(require("../domain/services/command.services")));
    const { stationId, controllerId, lockId, cmd } = req.params;
    const { timeoutMs = 5000 } = req.body || {};
    const r = await sendCommand({ stationId, controllerId, lockId, cmd, timeoutMs });
    res.status(202).json(r);
});
exports.router.get("/commands/:reqId", async (req, res) => {
    const { pool } = await Promise.resolve().then(() => __importStar(require("../infra/db")));
    const [rows] = await pool.query("SELECT req_id, status, error_msg, ts_requested, ts_resolved FROM commands WHERE req_id=?", [req.params.reqId]);
    if (!rows.length)
        return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
});
exports.router.get("/metrics", async (_req, res) => {
    res.set("Content-Type", metrics_1.register.contentType);
    res.end(await metrics_1.register.metrics());
});
//# sourceMappingURL=routes.js.map