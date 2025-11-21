import { ParsedTopic } from "../classes/models/ObjectMqttModel";

/**
 * Interface que define el contrato para todos los handlers de mensajes MQTT
 * Implementa el Strategy Pattern para permitir el routing dinámico de mensajes
 * 
 * Cada tipo de mensaje (telemetry, event, state, etc.) debe implementar esta interface
 * para ser registrado en el MqttHandlerRegistry
 */
export interface IMqttMessageHandler {
    /**
     * Maneja un mensaje MQTT recibido
     * 
     * @param parsedTopic - Topic ya parseado con stationId, controllerId, lockId, action
     * @param payload - Payload del mensaje (ya parseado como JSON)
     * @param messageStr - String original del mensaje (útil para casos donde el JSON falla)
     * @returns Promise que se resuelve cuando el mensaje ha sido procesado
     * @throws Error si ocurre un problema durante el procesamiento
     */
    handle(parsedTopic: ParsedTopic, payload: any, messageStr: string): Promise<void>;
}
