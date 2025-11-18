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
    const { db } = await Promise.resolve().then(() => __importStar(require("../infra/db")));
    const { stationId } = req.query;
    if (!stationId) {
        return res.status(400).json({ error: "stationId requerido en query" });
    }
    const locksSnapshot = await db
        .collection("stations")
        .doc(stationId)
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
exports.router.post("/stations/:stationId/controllers/:controllerId/locks/:lockId/:cmd", async (req, res) => {
    const { sendCommand } = await Promise.resolve().then(() => __importStar(require("../domain/services/command.services")));
    const { stationId, controllerId, lockId, cmd } = req.params;
    const { timeoutMs = 5000 } = req.body || {};
    const r = await sendCommand({ stationId, controllerId, lockId, cmd, timeoutMs });
    res.status(202).json(r);
});
exports.router.get("/commands/:reqId", async (req, res) => {
    const { db } = await Promise.resolve().then(() => __importStar(require("../infra/db")));
    const commandIndexDoc = await db.collection("commands_index").doc(req.params.reqId).get();
    if (!commandIndexDoc.exists) {
        return res.status(404).json({ message: "Not found" });
    }
    const indexData = commandIndexDoc.data();
    const stationId = indexData['station_id'];
    const controllerId = indexData['controller_id'];
    const lockId = indexData['lock_id'];
    if (!stationId || !controllerId || !lockId) {
        return res.status(404).json({ message: "Not found" });
    }
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
    const commandData = commandDoc.data();
    return res.json({
        req_id: commandDoc.id,
        status: commandData['status'],
        error_msg: commandData['error_msg'],
        ts_requested: commandData['ts_requested'],
        ts_resolved: commandData['ts_resolved'],
    });
});
exports.router.get("/metrics", async (_req, res) => {
    res.set("Content-Type", metrics_1.register.contentType);
    res.end(await metrics_1.register.metrics());
});
//# sourceMappingURL=routes.js.map