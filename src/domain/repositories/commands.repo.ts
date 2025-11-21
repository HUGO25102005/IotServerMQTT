
import { FieldValue } from "firebase-admin/firestore";
import db from "../../infra/firebase";

interface CreatePendingParams {
    reqId: string;
    stationId: string;
    controllerId: string;
    lockId: string;
    cmd: string;
    ts: number;
    timeoutMs: number;
}

export async function createPending(c: CreatePendingParams) {
    const commandRef = db
        .collection("stations")
        .doc(c.stationId)
        .collection("controllers")
        .doc(c.controllerId)
        .collection("locks")
        .doc(c.lockId)
        .collection("commands")
        .doc(c.reqId);

    const indexRef = db.collection("commands_index").doc(c.reqId);

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
        created_at: FieldValue.serverTimestamp(),
    };

    // Escribir en ambos lugares (comando y índice) usando transacción
    await db.runTransaction(async (transaction: any) => {
        transaction.set(commandRef, commandData);
        transaction.set(indexRef, {
            station_id: c.stationId,
            controller_id: c.controllerId,
            lock_id: c.lockId,
            cmd: c.cmd,
            status: "pending",
            created_at: FieldValue.serverTimestamp(),
        });
    });
}

export async function resolve(
    reqId: string,
    result: "ok" | "error" | "timeout",
    ts: number,
    errorMsg?: string
) {
    // Primero buscar en commands_index para obtener la ruta
    const indexDoc = await db.collection("commands_index").doc(reqId).get();

    if (!indexDoc.exists) {
        throw new Error(`Command ${reqId} not found`);
    }

    const indexData = indexDoc.data()!;
    const status =
        result === "ok" ? "success" : result === "timeout" ? "timeout" : "error";

    const commandRef = db
        .collection("stations")
        .doc(indexData['station_id'])
        .collection("controllers")
        .doc(indexData['controller_id'])
        .collection("locks")
        .doc(indexData['lock_id'])
        .collection("commands")
        .doc(reqId);

    // Actualizar ambos (comando y índice) usando transacción
    await db.runTransaction(async (transaction: any) => {
        transaction.update(commandRef, {
            status,
            ts_resolved: ts,
            error_msg: errorMsg || null,
        });
        transaction.update(db.collection("commands_index").doc(reqId), {
            status,
        });
    });
}