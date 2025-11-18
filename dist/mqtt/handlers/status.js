"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const db_1 = require("../../infra/db");
const firestore_1 = require("firebase-admin/firestore");
async function handle({ stationId, deviceId, data }) {
    const s = (data?.status === "online" || data?.status === "offline") ? data.status : "unknown";
    const controllerRef = db_1.db
        .collection("stations")
        .doc(stationId)
        .collection("controllers")
        .doc(deviceId);
    await controllerRef.set({
        station_id: stationId,
        last_status: s,
        last_seen_at: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
}
//# sourceMappingURL=status.js.map