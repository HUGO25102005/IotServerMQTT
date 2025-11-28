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
     * Soporta formato antiguo (ts, state) y formato nuevo del dispositivo (timestamp o hora+fecha, servomotor)
     */
    public validate(): boolean {
        if (!this.payload || typeof this.payload !== "object") {
            return false;
        }

        // Formato nuevo del dispositivo: debe tener (timestamp O hora+fecha) Y servomotor.estado
        const hasNewFormatTime =
            typeof this.payload.timestamp === "number" ||
            (typeof this.payload.hora === "string" && typeof this.payload.fecha === "string");

        const hasNewFormat =
            hasNewFormatTime &&
            this.payload.servomotor?.estado;

        // Formato antiguo: debe tener ts y state
        const hasOldFormat =
            typeof this.payload.ts === "number" &&
            (this.payload.state === "locked" || this.payload.state === "unlocked");

        return hasNewFormat || hasOldFormat;
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

