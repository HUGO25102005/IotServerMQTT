"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPending = createPending;
exports.resolve = resolve;
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = __importDefault(require("../../infra/firebase"));
async function createPending(c) {
    const commandRef = firebase_1.default
        .collection("stations")
        .doc(c.stationId)
        .collection("controllers")
        .doc(c.controllerId)
        .collection("locks")
        .doc(c.lockId)
        .collection("commands")
        .doc(c.reqId);
    const indexRef = firebase_1.default.collection("commands_index").doc(c.reqId);
    const commandData = {
        station_id: c.stationId,
        controller_id: c.controllerId,
        lock_id: c.lockId,
        cmd: c.cmd,
        ts_requested: c.ts,
        timeout_ms: c.timeoutMs,
        status: "pending",
        ts_resolved: null,
        error_msg: null,
        created_at: firestore_1.FieldValue.serverTimestamp(),
    };
    await firebase_1.default.runTransaction(async (transaction) => {
        transaction.set(commandRef, commandData);
        transaction.set(indexRef, {
            station_id: c.stationId,
            controller_id: c.controllerId,
            lock_id: c.lockId,
            cmd: c.cmd,
            status: "pending",
            created_at: firestore_1.FieldValue.serverTimestamp(),
        });
    });
}
async function resolve(reqId, result, ts, errorMsg) {
    const indexDoc = await firebase_1.default.collection("commands_index").doc(reqId).get();
    if (!indexDoc.exists) {
        throw new Error(`Command ${reqId} not found`);
    }
    const indexData = indexDoc.data();
    const status = result === "ok" ? "success" : result === "timeout" ? "timeout" : "error";
    const commandRef = firebase_1.default
        .collection("stations")
        .doc(indexData['station_id'])
        .collection("controllers")
        .doc(indexData['controller_id'])
        .collection("locks")
        .doc(indexData['lock_id'])
        .collection("commands")
        .doc(reqId);
    await firebase_1.default.runTransaction(async (transaction) => {
        transaction.update(commandRef, {
            status,
            ts_resolved: ts,
            error_msg: errorMsg || null,
        });
        transaction.update(firebase_1.default.collection("commands_index").doc(reqId), {
            status,
        });
    });
}
//# sourceMappingURL=commands.repo.js.map