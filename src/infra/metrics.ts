import client from "prom-client";
export const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const mqttMessagesTotal = new client.Counter({
    name: "mqtt_messages_received_total",
    help: "Mensajes MQTT recibidos por tipo",
    labelNames: ["type"],
});
register.registerMetric(mqttMessagesTotal);

export const commandLatency = new client.Summary({
    name: "mqtt_command_latency_ms_summary",
    help: "Latencia comando→ACK",
    labelNames: ["cmd"],
});
register.registerMetric(commandLatency);