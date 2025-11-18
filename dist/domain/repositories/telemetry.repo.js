"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telemetryRepo = void 0;
const db_1 = require("../../infra/db");
const firestore_1 = require("firebase-admin/firestore");
exports.telemetryRepo = {
    async create(data) {
        const telemetryRef = db_1.db
            .collection("stations")
            .doc(data.stationId)
            .collection("controllers")
            .doc(data.controllerId)
            .collection("locks")
            .doc(data.lockId)
            .collection("telemetry")
            .doc();
        await telemetryRef.set({
            station_id: data.stationId,
            controller_id: data.controllerId,
            lock_id: data.lockId,
            ts: data.ts,
            state: data.state,
            battery: data.battery ?? null,
            rssi: data.rssi ?? null,
            fw: data.fw ?? null,
            seq: data.seq ?? null,
            created_at: firestore_1.FieldValue.serverTimestamp(),
        });
        return { id: telemetryRef.id };
    },
    async findByLock(lockId, limit = 100) {
        const snapshot = await db_1.db
            .collectionGroup("telemetry")
            .where("lock_id", "==", lockId)
            .orderBy("ts", "desc")
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },
    async findByController(controllerId, limit = 100) {
        const snapshot = await db_1.db
            .collectionGroup("telemetry")
            .where("controller_id", "==", controllerId)
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
            .collectionGroup("telemetry")
            .where("station_id", "==", stationId)
            .orderBy("ts", "desc")
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },
    async getLatestByLock(lockId) {
        const snapshot = await db_1.db
            .collectionGroup("telemetry")
            .where("lock_id", "==", lockId)
            .orderBy("ts", "desc")
            .limit(1)
            .get();
        if (snapshot.empty || !snapshot.docs[0])
            return null;
        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        };
    },
    async getStatsByTimeRange(stationId, startTs, endTs) {
        const snapshot = await db_1.db
            .collectionGroup("telemetry")
            .where("station_id", "==", stationId)
            .where("ts", ">=", startTs)
            .where("ts", "<=", endTs)
            .get();
        const docs = snapshot.docs.map(doc => doc.data());
        const uniqueLocks = new Set(docs.map(d => d['lock_id']));
        const batteries = docs.map(d => d['battery']).filter((b) => b !== null && b !== undefined);
        const rssis = docs.map(d => d['rssi']).filter((r) => r !== null && r !== undefined);
        return {
            total_messages: docs.length,
            unique_locks: uniqueLocks.size,
            avg_battery: batteries.length > 0 ? batteries.reduce((a, b) => a + b, 0) / batteries.length : null,
            avg_rssi: rssis.length > 0 ? rssis.reduce((a, b) => a + b, 0) / rssis.length : null,
        };
    },
    async getBatteryStats() {
        const snapshot = await db_1.db
            .collectionGroup("locks")
            .get();
        const locks = snapshot.docs.map(doc => doc.data());
        const locksWithBattery = locks.filter(l => l['last_battery'] !== null && l['last_battery'] !== undefined);
        const lowBatteryCount = locksWithBattery.filter(l => l['last_battery'] < 20).length;
        const avgBattery = locksWithBattery.length > 0
            ? locksWithBattery.reduce((sum, l) => sum + l['last_battery'], 0) / locksWithBattery.length
            : null;
        return {
            total_locks: locks.length,
            low_battery_count: lowBatteryCount,
            avg_battery: avgBattery,
        };
    }
};
//# sourceMappingURL=telemetry.repo.js.map