import BaseFirestoreModel from "./BaseFirestoreModel";
import { ParsedTopic } from "../../mqtt/classes/models/ObjectMqttModel";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Modelo HTTP para Config
 * Guarda la configuración del controlador en Firestore
 * Nota: Config se guarda directamente en el documento del controller, no en una subcolección
 */
class ConfigModel extends BaseFirestoreModel {
    constructor(parsedTopic: ParsedTopic) {
        // Config se guarda en el documento del controller, no en subcolección
        super(parsedTopic, "config");
    }

    /**
     * Config se actualiza directamente en el documento del controller
     * Sobrescribe el método create para actualizar el documento del controller
     */
    public async updateControllerConfig(data: any) {
        const basePath = this.getBaseCollectionPath();

        await basePath.set({
            ...data,
            station_id: this.parsedTopic.stationId,
            controller_id: this.parsedTopic.controllerId,
            updated_at: FieldValue.serverTimestamp(),
        }, { merge: true });

        return basePath;
    }
}

export default ConfigModel;

