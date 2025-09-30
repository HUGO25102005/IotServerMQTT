import mqtt from "mqtt";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { SUBSCRIPTIONS } from "../mqtt/topics";
import { onMqttMessage } from "../mqtt/routes";
import { v4 as uuidv4 } from "uuid";

// Generar Client ID único para este servidor
const CLIENT_ID = `bike-station-server-${uuidv4().substring(0, 8)}`;

export const mqttClient = mqtt.connect(env.MQTT_URL, {
    clientId: CLIENT_ID,
    username: env.MQTT_USERNAME || "",
    password: env.MQTT_PASSWORD || "",
    clean: true,
    keepalive: 60,
    reconnectPeriod: 5000,
});

mqttClient.on("connect", () => {
    logger.info({ url: env.MQTT_URL, clientId: CLIENT_ID }, "[MQTT] conectado");
    SUBSCRIPTIONS.forEach((t) => mqttClient.subscribe(t, { qos: 1 }));
    logger.info({ count: SUBSCRIPTIONS.length, clientId: CLIENT_ID }, "[MQTT] suscripciones listas");
});

mqttClient.on("message", (topic, payload) => {
    onMqttMessage(topic, payload.toString());
});

mqttClient.on("error", (err) => logger.error({ err }, "[MQTT] error"));