"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mqttClient = void 0;
const mqtt_1 = __importDefault(require("mqtt"));
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
const topics_1 = require("../mqtt/topics");
const routes_1 = require("../mqtt/routes");
exports.mqttClient = mqtt_1.default.connect(env_1.env.MQTT_URL, {
    username: env_1.env.MQTT_USERNAME || "",
    password: env_1.env.MQTT_PASSWORD || "",
    clean: true,
});
exports.mqttClient.on("connect", () => {
    logger_1.logger.info({ url: env_1.env.MQTT_URL }, "[MQTT] conectado");
    topics_1.SUBSCRIPTIONS.forEach((t) => exports.mqttClient.subscribe(t, { qos: 1 }));
    logger_1.logger.info({ count: topics_1.SUBSCRIPTIONS.length }, "[MQTT] suscripciones listas");
});
exports.mqttClient.on("message", (topic, payload) => {
    (0, routes_1.onMqttMessage)(topic, payload.toString());
});
exports.mqttClient.on("error", (err) => logger_1.logger.error({ err }, "[MQTT] error"));
//# sourceMappingURL=mqtt.js.map