import ObjectMqttModel from "./ObjectMqttModel";

/**
 * Modelo MQTT para Telemetry
 * Encapsula los datos de telemetría que llegan por MQTT
 */
class TelemetryModel extends ObjectMqttModel {
    constructor(
        topic: string,
        payload: any,
        messageStr: string = payload.toString()
    ) {
        super(topic, payload, messageStr);
    }

    /**
     * Valida que el payload tenga los campos mínimos requeridos
     * Puedes agregar más validaciones específicas aquí si es necesario
     */
    public validate(): boolean {
        // Por ahora solo validamos que el payload exista
        // Puedes agregar validaciones más específicas según tus necesidades
        return this.payload !== null && this.payload !== undefined;
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

export default TelemetryModel;

