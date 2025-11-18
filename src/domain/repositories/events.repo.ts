import { db } from "../../infra/db";
import { FieldValue } from "firebase-admin/firestore";

interface CreateEventData {
    stationId: string;
    controllerId: string;
    lockId: string;
    ts: number;
    event: string;
    detailsJson: any;
    severity: 'info' | 'warn' | 'error';
}

export const eventsRepo = {
    async create(data: CreateEventData) {
        const eventRef = db
            .collection("stations")
            .doc(data.stationId)
            .collection("controllers")
            .doc(data.controllerId)
            .collection("locks")
            .doc(data.lockId)
            .collection("events")
            .doc(); // Auto-ID

        await eventRef.set({
            station_id: data.stationId,
            controller_id: data.controllerId,
            lock_id: data.lockId,
            ts: data.ts,
            event: data.event,
            details: data.detailsJson || null, // Firestore maneja objetos directamente
            severity: data.severity,
            created_at: FieldValue.serverTimestamp(),
        });

        return { id: eventRef.id };
    },

    async findByLock(lockId: string, limit = 100) {
        const snapshot = await db
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

    async findByStation(stationId: string, limit = 100) {
        const snapshot = await db
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

    async findBySeverity(severity: 'info' | 'warn' | 'error', limit = 100) {
        const snapshot = await db
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
