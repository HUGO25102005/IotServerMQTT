"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandLatency = exports.mqttMessagesTotal = exports.register = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
exports.register = new prom_client_1.default.Registry();
prom_client_1.default.collectDefaultMetrics({ register: exports.register });
exports.mqttMessagesTotal = new prom_client_1.default.Counter({
    name: "mqtt_messages_received_total",
    help: "Mensajes MQTT recibidos por tipo",
    labelNames: ["type"],
});
exports.register.registerMetric(exports.mqttMessagesTotal);
exports.commandLatency = new prom_client_1.default.Summary({
    name: "mqtt_command_latency_ms_summary",
    help: "Latencia comando→ACK",
    labelNames: ["cmd"],
});
exports.register.registerMetric(exports.commandLatency);
//# sourceMappingURL=metrics.js.map