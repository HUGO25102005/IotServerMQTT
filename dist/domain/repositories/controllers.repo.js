"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.controllersRepo = void 0;
const firebase_1 = __importDefault(require("../../infra/firebase"));
const firestore_1 = require("firebase-admin/firestore");
exports.controllersRepo = {
    async create(data) {
        const controllerRef = firebase_1.default
            .collection("stations")
            .doc(data.stationId)
            .collection("controllers")
            .doc(data.id);
        await controllerRef.set({
            station_id: data.stationId,
            fw: data.fw || null,
            hw: data.hw || null,
            last_status: "unknown",
            last_seen_at: null,
            created_at: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        return { id: controllerRef.id };
    },
    async updateStatus(data) {
        const controllerRef = firebase_1.default
            .collection("stations")
            .doc(data.stationId)
            .collection("controllers")
            .doc(data.id);
        await controllerRef.update({
            last_status: data.status,
            last_seen_at: data.lastSeenAt || firestore_1.FieldValue.serverTimestamp(),
        });
        return { id: controllerRef.id };
    },
    async findById(id, stationId) {
        const controllerDoc = await firebase_1.default
            .collection("stations")
            .doc(stationId)
            .collection("controllers")
            .doc(id)
            .get();
        if (!controllerDoc.exists)
            return null;
        return {
            id: controllerDoc.id,
            ...controllerDoc.data()
        };
    },
    async findByStation(stationId) {
        const snapshot = await firebase_1.default
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
        const stationsSnapshot = await firebase_1.default.collection("stations").get();
        const allControllers = [];
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
        allControllers.sort((a, b) => {
            if (a.station_id !== b.station_id) {
                return a.station_id.localeCompare(b.station_id);
            }
            return a.id.localeCompare(b.id);
        });
        return allControllers;
    },
    async getOnlineCount() {
        const snapshot = await firebase_1.default
            .collectionGroup("controllers")
            .where("last_status", "==", "online")
            .get();
        return snapshot.size;
    },
    async getOfflineCount() {
        const snapshot = await firebase_1.default
            .collectionGroup("controllers")
            .where("last_status", "==", "offline")
            .get();
        return snapshot.size;
    }
};
//# sourceMappingURL=controllers.repo.js.map