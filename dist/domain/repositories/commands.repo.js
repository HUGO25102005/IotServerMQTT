"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPending = createPending;
exports.resolve = resolve;
const db_1 = require("../../infra/db");
const firestore_1 = require("firebase-admin/firestore");
async function createPending(c) {
    const commandRef = db_1.db
        .collection("stations")
        .doc(c.stationId)
        .collection("controllers")
        .doc(c.controllerId)
        .collection("locks")
        .doc(c.lockId)
        .collection("commands")
        .doc(c.reqId);
    const indexRef = db_1.db.collection("commands_index").doc(c.reqId);
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
    await db_1.db.runTransaction(async (transaction) => {
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
    const indexDoc = await db_1.db.collection("commands_index").doc(reqId).get();
    if (!indexDoc.exists) {
        throw new Error(`Command ${reqId} not found`);
    }
    const indexData = indexDoc.data();
    const status = result === "ok" ? "success" : result === "timeout" ? "timeout" : "error";
    const commandRef = db_1.db
        .collection("stations")
        .doc(indexData['station_id'])
        .collection("controllers")
        .doc(indexData['controller_id'])
        .collection("locks")
        .doc(indexData['lock_id'])
        .collection("commands")
        .doc(reqId);
    await db_1.db.runTransaction(async (transaction) => {
        transaction.update(commandRef, {
            status,
            ts_resolved: ts,
            error_msg: errorMsg || null,
        });
        transaction.update(db_1.db.collection("commands_index").doc(reqId), {
            status,
        });
    });
}
//# sourceMappingURL=commands.repo.js.map