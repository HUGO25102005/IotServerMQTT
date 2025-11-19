import ObjectMqttModel from "./ObjectMqttModel";

/**
 * Modelo MQTT para State
 * Encapsula el estado del lock que llega por MQTT
 */
class StateModel extends ObjectMqttModel {
    constructor(
        topic: string,
        payload: any,
        messageStr: string = payload.toString()
    ) {
        super(topic, payload, messageStr);
    }

    /**
     * Valida que el payload tenga los campos mínimos requeridos
     */
    public validate(): boolean {
        return (
            this.payload !== null &&
            this.payload !== undefined &&
            (this.payload.state || this.payload.reqId)
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
}

export default StateModel;

