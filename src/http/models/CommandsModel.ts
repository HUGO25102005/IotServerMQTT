import BaseFirestoreModel from "./BaseFirestoreModel";
import { ParsedTopic } from "../../mqtt/classes/models/ObjectMqttModel";

/**
 * Modelo HTTP para Commands
 * Guarda los comandos en Firestore
 */
class CommandsModel extends BaseFirestoreModel {
    constructor(parsedTopic: ParsedTopic) {
        super(parsedTopic, "commands");
    }
}

export default CommandsModel;

