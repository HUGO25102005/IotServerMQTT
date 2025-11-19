import mqtt from "mqtt";
import { env } from "../config/env";
import { v4 as uuidv4 } from "uuid";

// Generar Client ID único para este servidor
const CLIENT_ID = `bike-station-server-${uuidv4().substring(0, 8)}`;

/**
 * Cliente MQTT exportado
 * NOTA: Los listeners y suscripciones se configuran en main.ts usando los nuevos controllers
 * Este archivo solo exporta el cliente para que pueda ser usado por otros módulos (como CommandsController)
 */
export const mqttClient = mqtt.connect(env.MQTT_URL, {
    clientId: CLIENT_ID,
    username: env.MQTT_USERNAME || "",
    password: env.MQTT_PASSWORD || "",
    clean: true,
    keepalive: 60,
    reconnectPeriod: 5000,
});

// Los listeners se configuran en main.ts, no aquí
// Esto evita duplicar el procesamiento de mensajes