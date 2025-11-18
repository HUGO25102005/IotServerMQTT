"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLockSnapshot = updateLockSnapshot;
exports.getLastSeq = getLastSeq;
const db_1 = require("../../infra/db");
const firestore_1 = require("firebase-admin/firestore");
async function updateLockSnapshot(p) {
    const lockRef = db_1.db
        .collection("stations")
        .doc(p.stationId)
        .collection("controllers")
        .doc(p.controllerId)
        .collection("locks")
        .doc(p.lockId);
    const updateData = {
        controller_id: p.controllerId,
        updated_at: firestore_1.FieldValue.serverTimestamp(),
    };
    if (p.state !== undefined)
        updateData.last_state = p.state;
    if (p.battery !== undefined)
        updateData.last_battery = p.battery;
    if (p.rssi !== undefined)
        updateData.last_rssi = p.rssi;
    if (p.seq !== undefined) {
        await db_1.db.runTransaction(async (transaction) => {
            const lockDoc = await transaction.get(lockRef);
            const lockData = lockDoc.data();
            const currentSeq = lockData?.['last_seq'] || 0;
            updateData.last_seq = Math.max(currentSeq, p.seq);
            transaction.set(lockRef, updateData, { merge: true });
        });
    }
    else {
        await lockRef.set(updateData, { merge: true });
    }
}
async function getLastSeq(stationId, controllerId, lockId) {
    const lockDoc = await db_1.db
        .collection("stations")
        .doc(stationId)
        .collection("controllers")
        .doc(controllerId)
        .collection("locks")
        .doc(lockId)
        .get();
    const lockData = lockDoc.data();
    return lockData?.['last_seq'];
}
//# sourceMappingURL=locks.repo.js.map