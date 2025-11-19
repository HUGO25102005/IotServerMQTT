import BaseFirestoreModel from "./BaseFirestoreModel";
import { ParsedTopic } from "../../mqtt/classes/models/ObjectMqttModel";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Modelo HTTP para State
 * Guarda el estado del lock en Firestore
 * Nota: State puede actualizar tanto el documento del lock como crear un registro histórico
 */
class StateModel extends BaseFirestoreModel {
    constructor(parsedTopic: ParsedTopic) {
        super(parsedTopic, "state");
    }

    /**
     * Actualiza el estado del lock en el documento del lock
     * Además crea un registro histórico en la subcolección state
     */
    public async updateLockState(data: any) {
        const basePath = this.getBaseCollectionPath();

        // Actualizar el documento del lock con el último estado
        await basePath.set({
            last_state: data.state || null,
            last_seq: data.seq || null,
            last_battery: data.battery || null,
            last_rssi: data.rssi || null,
            updated_at: FieldValue.serverTimestamp(),
        }, { merge: true });

        // También crear un registro histórico en la subcolección state
        if (this.parsedTopic.lockId) {
            await this.create(data);
        }

        return basePath;
    }
}

export default StateModel;

