"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsRepo = void 0;
const db_1 = require("../../infra/db");
const firestore_1 = require("firebase-admin/firestore");
exports.eventsRepo = {
    async create(data) {
        const eventRef = db_1.db
            .collection("stations")
            .doc(data.stationId)
            .collection("controllers")
            .doc(data.controllerId)
            .collection("locks")
            .doc(data.lockId)
            .collection("events")
            .doc();
        await eventRef.set({
            station_id: data.stationId,
            controller_id: data.controllerId,
            lock_id: data.lockId,
            ts: data.ts,
            event: data.event,
            details: data.detailsJson || null,
            severity: data.severity,
            created_at: firestore_1.FieldValue.serverTimestamp(),
        });
        return { id: eventRef.id };
    },
    async findByLock(lockId, limit = 100) {
        const snapshot = await db_1.db
            .collectionGroup("events")
            .where("lock_id", "==", lockId)
            .orderBy("ts", "desc")
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },
    async findByStation(stationId, limit = 100) {
        const snapshot = await db_1.db
            .collectionGroup("events")
            .where("station_id", "==", stationId)
            .orderBy("ts", "desc")
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },
    async findBySeverity(severity, limit = 100) {
        const snapshot = await db_1.db
            .collectionGroup("events")
            .where("severity", "==", severity)
            .orderBy("ts", "desc")
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
};
//# sourceMappingURL=events.repo.js.map