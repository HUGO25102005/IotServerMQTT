import db from "../../infra/firebase";
import { FieldValue } from "firebase-admin/firestore";

interface CreateControllerData {
    id: string;
    stationId: string;
    fw?: string;
    hw?: string;
}

interface UpdateControllerStatusData {
    id: string;
    stationId: string;
    status: 'online' | 'offline' | 'unknown';
    lastSeenAt?: Date;
}

export const controllersRepo = {
    async create(data: CreateControllerData) {
        const controllerRef = db
            .collection("stations")
            .doc(data.stationId)
            .collection("controllers")
            .doc(data.id);

        await controllerRef.set(
            {
                station_id: data.stationId,
                fw: data.fw || null,
                hw: data.hw || null,
                last_status: "unknown",
                last_seen_at: null,
                created_at: FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        return { id: controllerRef.id };
    },

    async updateStatus(data: UpdateControllerStatusData) {
        const controllerRef = db
            .collection("stations")
            .doc(data.stationId)
            .collection("controllers")
            .doc(data.id);

        await controllerRef.update({
            last_status: data.status,
            last_seen_at: data.lastSeenAt || FieldValue.serverTimestamp(),
        });

        return { id: controllerRef.id };
    },

    async findById(id: string, stationId: string) {
        const controllerDoc = await db
            .collection("stations")
            .doc(stationId)
            .collection("controllers")
            .doc(id)
            .get();

        if (!controllerDoc.exists) return null;

        return {
            id: controllerDoc.id,
            ...controllerDoc.data()
        };
    },

    async findByStation(stationId: string) {
        const snapshot = await db
            .collection("stations")
            .doc(stationId)
            .collection("controllers")
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    async getAll() {
        const stationsSnapshot = await db.collection("stations").get();
        const allControllers: any[] = [];

        for (const stationDoc of stationsSnapshot.docs) {
            const stationData = stationDoc.data();
            const controllersSnapshot = await stationDoc.ref.collection("controllers").get();

            for (const controllerDoc of controllersSnapshot.docs) {
                allControllers.push({
                    id: controllerDoc.id,
                    ...controllerDoc.data(),
                    station_name: stationData['name'] || null,
                });
            }
        }

        // Ordenar por station_id e id
        allControllers.sort((a, b) => {
            if (a.station_id !== b.station_id) {
                return a.station_id.localeCompare(b.station_id);
            }
            return a.id.localeCompare(b.id);
        });

        return allControllers;
    },

    async getOnlineCount() {
        const snapshot = await db
            .collectionGroup("controllers")
            .where("last_status", "==", "online")
            .get();

        return snapshot.size;
    },

    async getOfflineCount() {
        const snapshot = await db
            .collectionGroup("controllers")
            .where("last_status", "==", "offline")
            .get();

        return snapshot.size;
    }
};
