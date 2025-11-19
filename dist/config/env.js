"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const envalid_1 = require("envalid");
(0, dotenv_1.config)();
exports.env = (0, envalid_1.cleanEnv)(process.env, {
    PORT: (0, envalid_1.num)({ default: 3000 }),
    NODE_ENV: (0, envalid_1.str)({ default: "development", choices: ["development", "production", "test"] }),
    LOG_LEVEL: (0, envalid_1.str)({ default: "info", choices: ["error", "warn", "info", "debug"] }),
    MQTT_URL: (0, envalid_1.str)({ default: "mqtt://localhost:1883" }),
    MQTT_USERNAME: (0, envalid_1.str)({ default: "" }),
    MQTT_PASSWORD: (0, envalid_1.str)({ default: "" }),
    MQTT_CLIENT_ID: (0, envalid_1.str)({ default: "" }),
    MQTT_BASE: (0, envalid_1.str)({ default: "casa/todos" }),
    MQTT_TOPIC_MENSAJES: (0, envalid_1.str)({ default: "messages/success" }),
    FIREBASE_CREDENTIALS_PATH: (0, envalid_1.str)({ default: "./firebase-credentials.json" }),
    FIREBASE_PROJECT_ID: (0, envalid_1.str)({ default: "" }),
    FIREBASE_CLIENT_EMAIL: (0, envalid_1.str)({ default: "" }),
    FIREBASE_PRIVATE_KEY: (0, envalid_1.str)({ default: "" }),
    COMMAND_TIMEOUT: (0, envalid_1.num)({ default: 5000 }),
    TELEMETRY_BATCH_SIZE: (0, envalid_1.num)({ default: 100 }),
});
//# sourceMappingURL=env.js.map