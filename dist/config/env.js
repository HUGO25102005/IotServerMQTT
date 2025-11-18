"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const envalid_1 = require("envalid");
(0, dotenv_1.config)();
exports.env = (0, envalid_1.cleanEnv)(process.env, {
    PORT: (0, envalid_1.num)({ default: 3000 }),
    MQTT_URL: (0, envalid_1.str)(),
    MQTT_USERNAME: (0, envalid_1.str)({ default: "" }),
    MQTT_PASSWORD: (0, envalid_1.str)({ default: "" }),
    MQTT_CLIENT_ID: (0, envalid_1.str)({ default: "" }),
    FIREBASE_CREDENTIALS_PATH: (0, envalid_1.str)({ default: "./firebase-credentials.json" }),
    FIREBASE_PROJECT_ID: (0, envalid_1.str)({ default: "" }),
    FIREBASE_CLIENT_EMAIL: (0, envalid_1.str)({ default: "" }),
    FIREBASE_PRIVATE_KEY: (0, envalid_1.str)({ default: "" }),
});
//# sourceMappingURL=env.js.map