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
import { LoggerService } from "./domain/services";
import { MqttHandlerRegistry } from "./mqtt/registry/MqttHandlerRegistry";

/**
 * Clase principal que orquesta el procesamiento de mensajes MQTT
 * Utiliza el MqttHandlerRegistry para procesar cada tipo de mensaje siguiendo el Strategy Pattern
 */
class Main {
    private static handlerRegistry: MqttHandlerRegistry;

    /**
     * Inicializa el servidor MQTT y configura los listeners
     */
    static async start() {
        logger.info({}, "Inicializando servidor MQTT...");

        // Inicializar registry de handlers
        this.initializeHandlerRegistry();

        // Configurar eventos del cliente MQTT
        this.setupMqttListeners();

        logger.info({}, "Servidor MQTT inicializado correctamente");
    }

    /**
     * Inicializa y registra todos los handlers MQTT
     */
    private static initializeHandlerRegistry() {
        this.handlerRegistry = new MqttHandlerRegistry();

        // Registrar todos los handlers
        this.handlerRegistry.register("telemetry", new TelemetryController());
        this.handlerRegistry.register("event", new EventsController());
        this.handlerRegistry.register("state", new StateController());
        this.handlerRegistry.register("status", new StatusController());
        this.handlerRegistry.register("config", new ConfigController());
        this.handlerRegistry.register("command", new CommandsController());
        // Nota: logs no está en el registry porque usa LoggerController del http/controllers

        const actions = this.handlerRegistry.getRegisteredActions();
        logger.info({ count: actions.length, actions }, "[MQTT] Handlers registered");
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
            // console.log({ "topic": topic });
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

        // Verificar si es un topic de cycloconnect (formato diferente)
        if (topic.startsWith("cycloconnect/")) {
            logger.debug({ topic }, "[MQTT] Mensaje recibido de cycloconnect (formato no estándar)");
            topic = topic.replace("cycloconnect/", "");
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
            // Caso especial: logs usa LoggerService del domain/services
            if (action === "logs") {
                const service = new LoggerService(parsedTopic);
                await service.save({
                    type: "mqtt_log",
                    message: messageStr,
                    data: payloadData,
                    severity: "info"
                });
                return;
            }

            // Usar el registry para obtener el handler correspondiente
            const handler = this.handlerRegistry.getHandler(action);

            if (!handler) {
                logger.warn({ topic, action }, "action_unknown");
                return;
            }

            // Delegar al handler (que ahora tiene validaciones internas)
            await handler.handle(parsedTopic, payloadData, messageStr);

        } catch (error) {
            logger.error({ error, topic, action }, "message_processing_failed");
        }
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
        // Instanciar CommandsController directamente para usar sendCommand
        const controller = new CommandsController();
        return await controller.sendCommand(params);
    }
}

export default Main;
