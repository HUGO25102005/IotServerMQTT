import BaseFirestoreModel from "./BaseFirestoreModel";
import { ParsedTopic } from "../../mqtt/classes/models/ObjectMqttModel";

/**
 * Modelo HTTP para Logger
 * Guarda los logs/historial en Firestore
 * 
 * IMPORTANTE: Este modelo siempre guarda en la colección "logs",
 * ignorando la acción del parsedTopic (telemetry, event, etc.)
 */
class LoggerModel extends BaseFirestoreModel {
    constructor(parsedTopic: ParsedTopic) {
        super(parsedTopic, "logs");
    }

    /**
     * Sobrescribe getCollectionPath() para asegurar que siempre use "logs"
     * sin importar la acción del parsedTopic
     */
    public override getCollectionPath() {
        const basePath = this.getBaseCollectionPath();
        // Siempre usar "logs" como colección, ignorando la acción del topic
        return basePath.collection("logs");
    }
}

export default LoggerModel;

