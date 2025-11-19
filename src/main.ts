import { mqttClient } from "./infra/mqtt";
import { logger } from "./config/logger";
import { SUBSCRIPTIONS } from "./mqtt/topics";
import {
    TelemetryController,
    EventsController,
    CommandsController,
    StatusController,
    ConfigController,
    StateController,
} from "./mqtt/classes/controllers";
import { ObjectMqttModel } from "./mqtt/classes/models";

/**
 * Clase principal que orquesta el procesamiento de mensajes MQTT
 * Utiliza los controllers MQTT para procesar cada tipo de mensaje
 */
class Main {
    /**
     * Inicializa el servidor MQTT y configura los listeners
     */
    static async start() {
        logger.info({}, "Inicializando servidor MQTT...");

        // Configurar eventos del cliente MQTT
        this.setupMqttListeners();

        logger.info({}, "Servidor MQTT inicializado correctamente");
    }

    /**
     * Configura los listeners del cliente MQTT
     */
    private static setupMqttListeners() {
        mqttClient.on("connect", () => {
            logger.info({ url: process.env["MQTT_URL"] }, "[MQTT] Conectado");

            // Suscribirse a todos los topics definidos
            SUBSCRIPTIONS.forEach((topic) => {
                mqttClient.subscribe(topic, { qos: 1 }, (err) => {
                    if (err) {
                        logger.error({ err, topic }, "[MQTT] Error al suscribirse");
                    } else {
                        logger.debug({ topic }, "[MQTT] Suscrito");
                    }
                });
            });

            logger.info({ count: SUBSCRIPTIONS.length }, "[MQTT] Suscripciones configuradas");
        });

        mqttClient.on("message", async (topic, payload) => {
            await this.handleMqttMessage(topic, payload);
        });

        mqttClient.on("reconnect", () => {
            logger.warn({}, "[MQTT] Reintentando conexión...");
        });

        mqttClient.on("close", () => {
            logger.warn({}, "[MQTT] Conexión cerrada");
        });

        mqttClient.on("error", (err) => {
            logger.error({ err }, "[MQTT] Error");
        });
    }

    /**
     * Procesa un mensaje MQTT recibido
     * Parsea el topic, identifica la acción y delega al controller correspondiente
     */
    private static async handleMqttMessage(topic: string, payload: Buffer): Promise<void> {
        const messageStr = payload.toString();

        // Intentar parsear el payload como JSON
        let payloadData: any;
        try {
            payloadData = JSON.parse(messageStr);
        } catch (e) {
            logger.warn({ topic, error: e }, "json_invalid");
            // Si no es JSON válido, guardar como texto plano
            payloadData = { raw: messageStr };
        }

        // Crear un modelo temporal para parsear el topic y obtener la acción
        const tempModel = new ObjectMqttModel(topic, payloadData, messageStr);
        const parsedTopic = tempModel.parseTopic();
        const action = parsedTopic.action;

        logger.debug({
            topic,
            action,
            stationId: parsedTopic.stationId,
            controllerId: parsedTopic.controllerId,
            lockId: parsedTopic.lockId
        }, "[MQTT] Mensaje recibido");

        try {
            // Routing basado en la acción del topic
            switch (action) {
                case "telemetry":
                    await this.handleTelemetry(topic, payloadData, messageStr);
                    break;

                case "event":
                    if (!parsedTopic.lockId) {
                        logger.warn({ topic }, "lock_id_missing_for_event");
                        return;
                    }
                    await this.handleEvent(topic, payloadData, messageStr);
                    break;

                case "state":
                    if (!parsedTopic.lockId) {
                        logger.warn({ topic }, "lock_id_missing_for_state");
                        return;
                    }
                    await this.handleState(topic, payloadData, messageStr);
                    break;

                case "status":
                    if (!parsedTopic.controllerId || !parsedTopic.stationId) {
                        logger.warn({ topic }, "controller_id_or_station_id_missing");
                        return;
                    }
                    await this.handleStatus(topic, payloadData, messageStr);
                    break;

                case "config":
                    if (!parsedTopic.controllerId || !parsedTopic.stationId) {
                        logger.warn({ topic }, "controller_id_or_station_id_missing");
                        return;
                    }
                    await this.handleConfig(topic, payloadData, messageStr);
                    break;

                case "command":
                    // Los comandos pueden ser respuestas del dispositivo
                    if (!parsedTopic.lockId) {
                        logger.warn({ topic }, "lock_id_missing_for_command");
                        return;
                    }
                    await this.handleCommand(topic, payloadData, messageStr);
                    break;

                default:
                    logger.warn({ topic, action }, "action_unknown");
            }
        } catch (error) {
            logger.error({ error, topic, action }, "message_processing_failed");
        }
    }

    /**
     * Maneja mensajes de telemetría
     */
    private static async handleTelemetry(topic: string, payload: any, messageStr: string): Promise<void> {
        const controller = new TelemetryController(topic, payload, messageStr);
        await controller.handle();
    }

    /**
     * Maneja mensajes de eventos
     */
    private static async handleEvent(topic: string, payload: any, messageStr: string): Promise<void> {
        const controller = new EventsController(topic, payload, messageStr);
        await controller.handle();
    }

    /**
     * Maneja mensajes de estado
     */
    private static async handleState(topic: string, payload: any, messageStr: string): Promise<void> {
        const controller = new StateController(topic, payload, messageStr);
        await controller.handle();
    }

    /**
     * Maneja mensajes de status del controlador
     */
    private static async handleStatus(topic: string, payload: any, messageStr: string): Promise<void> {
        const controller = new StatusController(topic, payload, messageStr);
        await controller.handle();
    }

    /**
     * Maneja mensajes de configuración
     */
    private static async handleConfig(topic: string, payload: any, messageStr: string): Promise<void> {
        const controller = new ConfigController(topic, payload, messageStr);
        await controller.handle();
    }

    /**
     * Maneja mensajes de comandos (respuestas del dispositivo)
     */
    private static async handleCommand(topic: string, payload: any, messageStr: string): Promise<void> {
        const controller = new CommandsController(topic, payload, messageStr);
        await controller.handle();
    }

    /**
     * Método estático para enviar un comando a un dispositivo
     * Útil para exponer desde la API HTTP
     */
    static async sendCommand(params: {
        stationId: string;
        controllerId: string;
        lockId: string;
        cmd: "lock" | "unlock" | "reboot";
        timeoutMs: number;
    }): Promise<{ reqId: string; acceptedAt: number }> {
        // Crear un controller temporal solo para usar el método sendCommand
        const topic = `stations/${params.stationId}/controller/${params.controllerId}/locks/${params.lockId}/command`;
        const controller = new CommandsController(topic, {}, "");
        return await controller.sendCommand(params);
    }
}

export default Main;
