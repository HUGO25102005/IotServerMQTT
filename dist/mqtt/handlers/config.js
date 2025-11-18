"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const db_1 = require("../../infra/db");
const firestore_1 = require("firebase-admin/firestore");
const controllers_repo_1 = require("../../domain/repositories/controllers.repo");
async function handle({ stationId, deviceId, data }) {
    await db_1.db
        .collection("stations")
        .doc(stationId)
        .set({ created_at: firestore_1.FieldValue.serverTimestamp() }, { merge: true });
    await controllers_repo_1.controllersRepo.create({
        id: deviceId,
        stationId,
        fw: data?.fw,
        hw: data?.hw,
    });
    if (Array.isArray(data?.locks)) {
        for (const l of data.locks) {
            const lockRef = db_1.db
                .collection("stations")
                .doc(stationId)
                .collection("controllers")
                .doc(deviceId)
                .collection("locks")
                .doc(l.lockId);
            await lockRef.set({
                controller_id: deviceId,
                position: l.position ?? null,
                created_at: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
        }
    }
}
//# sourceMappingURL=config.js.map