import mqtt from "mqtt";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { SUBSCRIPTIONS } from "../mqtt/topics";
import { onMqttMessage } from "../mqtt/routes";

export const mqttClient = mqtt.connect(env.MQTT_URL, {
    username: env.MQTT_USERNAME || "",
    password: env.MQTT_PASSWORD || "",
    clean: true,
});

mqttClient.on("connect", () => {
    logger.info({ url: env.MQTT_URL }, "[MQTT] conectado");
    SUBSCRIPTIONS.forEach((t) => mqttClient.subscribe(t, { qos: 1 }));
    logger.info({ count: SUBSCRIPTIONS.length }, "[MQTT] suscripciones listas");
});

mqttClient.on("message", (topic, payload) => {
    onMqttMessage(topic, payload.toString());
});

mqttClient.on("error", (err) => logger.error({ err }, "[MQTT] error"));