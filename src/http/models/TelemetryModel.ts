import BaseFirestoreModel from "./BaseFirestoreModel";
import { ParsedTopic } from "../../mqtt/classes/models/ObjectMqttModel";

/**
 * Modelo HTTP para Telemetry
 * Guarda los datos de telemetría en Firestore
 */
class TelemetryModel extends BaseFirestoreModel {
    constructor(parsedTopic: ParsedTopic) {
        super(parsedTopic, "telemetry");
    }
}

export default TelemetryModel;

