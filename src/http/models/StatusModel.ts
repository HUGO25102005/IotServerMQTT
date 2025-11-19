import BaseFirestoreModel from "./BaseFirestoreModel";
import { ParsedTopic } from "../../mqtt/classes/models/ObjectMqttModel";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Modelo HTTP para Status
 * Guarda el estado del controlador en Firestore
 * Nota: Status se guarda directamente en el documento del controller, no en una subcolección
 */
class StatusModel extends BaseFirestoreModel {
    constructor(parsedTopic: ParsedTopic) {
        // Status se guarda en el documento del controller, no en subcolección
        super(parsedTopic, "status");
    }

    /**
     * Status se actualiza directamente en el documento del controller
     * Sobrescribe el método create para actualizar el documento del controller
     */
    public async updateControllerStatus(data: any) {
        const basePath = this.getBaseCollectionPath();

        await basePath.set({
            ...data,
            station_id: this.parsedTopic.stationId,
            controller_id: this.parsedTopic.controllerId,
            last_status: data.status || "unknown",
            last_seen_at: FieldValue.serverTimestamp(),
            updated_at: FieldValue.serverTimestamp(),
        }, { merge: true });

        return basePath;
    }
}

export default StatusModel;

