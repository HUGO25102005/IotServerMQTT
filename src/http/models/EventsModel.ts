import BaseFirestoreModel from "./BaseFirestoreModel";
import { ParsedTopic } from "../../mqtt/classes/models/ObjectMqttModel";

/**
 * Modelo HTTP para Events
 * Guarda los eventos en Firestore
 */
class EventsModel extends BaseFirestoreModel {
    constructor(parsedTopic: ParsedTopic) {
        super(parsedTopic, "events");
    }
}

export default EventsModel;

