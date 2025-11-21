import { IMqttMessageHandler } from "../interfaces/IMqttMessageHandler";
import { logger } from "../../config/logger";

/**
 * Registro centralizado de handlers MQTT
 * Implementa el patrón Registry para mapear acciones a handlers
 * 
 * Este registry permite:
 * - Registrar handlers para cada tipo de acción (telemetry, event, etc.)
 * - Obtener el handler apropiado para procesar un mensaje
 * - Extensión sin modificación (Open/Closed Principle)
 * 
 * @example
 * ```typescript
 * const registry = new MqttHandlerRegistry();
 * registry.register("telemetry", new TelemetryMqttHandler());
 * const handler = registry.getHandler("telemetry");
 * await handler.handle(parsedTopic, payload, messageStr);
 * ```
 */
export class MqttHandlerRegistry {
    private handlers = new Map<string, IMqttMessageHandler>();

    /**
     * Registra un handler para una acción específica
     * 
     * @param action - Nombre de la acción (telemetry, event, state, status, config, command, logs)
     * @param handler - Instancia del handler que procesará la acción
     * 
     * @example
     * ```typescript
     * registry.register("telemetry", new TelemetryMqttHandler());
     * ```
     */
    register(action: string, handler: IMqttMessageHandler): void {
        if (this.handlers.has(action)) {
            logger.warn({ action }, "[Registry] Handler already registered, overwriting");
        }
        this.handlers.set(action, handler);
        logger.debug({ action }, "[Registry] Handler registered");
    }

    /**
     * Obtiene el handler para una acción específica
     * 
     * @param action - Nombre de la acción
     * @returns Handler correspondiente o undefined si no existe
     * 
     * @example
     * ```typescript
     * const handler = registry.getHandler("telemetry");
     * if (handler) {
     *     await handler.handle(parsedTopic, payload, messageStr);
     * }
     * ```
     */
    getHandler(action: string): IMqttMessageHandler | undefined {
        return this.handlers.get(action);
    }

    /**
     * Verifica si existe un handler registrado para la acción
     * 
     * @param action - Nombre de la acción
     * @returns true si existe un handler, false en caso contrario
     * 
     * @example
     * ```typescript
     * if (registry.hasHandler("telemetry")) {
     *     // ...
     * }
     * ```
     */
    hasHandler(action: string): boolean {
        return this.handlers.has(action);
    }

    /**
     * Obtiene todas las acciones registradas
     * Útil para logging y debugging
     * 
     * @returns Array con los nombres de todas las acciones registradas
     * 
     * @example
     * ```typescript
     * const actions = registry.getRegisteredActions();
     * console.log(`Handlers registrados: ${actions.join(", ")}`);
     * ```
     */
    getRegisteredActions(): string[] {
        return Array.from(this.handlers.keys());
    }

    /**
     * Limpia todos los handlers registrados
     * Útil para testing y reinicialización
     */
    clear(): void {
        this.handlers.clear();
        logger.debug({}, "[Registry] All handlers cleared");
    }

    /**
     * Obtiene el número de handlers registrados
     * 
     * @returns Cantidad de handlers registrados
     */
    size(): number {
        return this.handlers.size;
    }
}
