import ObjectMqttModel from "./ObjectMqttModel";

/**
 * Modelo MQTT para Commands
 * Encapsula los comandos que se envían/reciben por MQTT
 * Este modelo se usa tanto para comandos salientes (publish) como entrantes (subscribe)
 */
class CommandsModel extends ObjectMqttModel {
    constructor(
        topic: string,
        payload: any,
        messageStr: string = payload.toString()
    ) {
        super(topic, payload, messageStr);
    }

    /**
     * Valida que el payload tenga los campos mínimos requeridos para un comando
     */
    public validate(): boolean {
        // Validar que tenga los campos básicos de un comando
        return (
            this.payload !== null &&
            this.payload !== undefined &&
            (this.payload.cmd || this.payload.reqId)
        );
    }

    /**
     * Obtiene los datos listos para guardar en Firestore
     * Retorna el JSON tal cual llegó de MQTT
     */
    public getDataForFirestore(): any {
        return {
            ...this.payload,
            timestamp: this.timestamp,
            timestamp_iso: this.timestampStr,
        };
    }

    /**
     * Construye el topic completo para publicar un comando
     * Formato: stations/{stationId}/controller/{controllerId}/locks/{lockId}/command/set
     */
    public getPublishTopic(): string {
        const parsed = this.parseTopic();
        return `stations/${parsed.stationId}/controller/${parsed.controllerId}/locks/${parsed.lockId}/command/set`;
    }
}

export default CommandsModel;

