"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const envalid_1 = require("envalid");
exports.env = (0, envalid_1.cleanEnv)(process.env, {
    PORT: (0, envalid_1.num)({ default: 3000 }),
    MQTT_URL: (0, envalid_1.str)(),
    MQTT_USERNAME: (0, envalid_1.str)({ default: "" }),
    MQTT_PASSWORD: (0, envalid_1.str)({ default: "" }),
    DB_HOST: (0, envalid_1.host)(),
    DB_PORT: (0, envalid_1.num)({ default: 3306 }),
    DB_USER: (0, envalid_1.str)(),
    DB_PASSWORD: (0, envalid_1.str)(),
    DB_NAME: (0, envalid_1.str)(),
});
//# sourceMappingURL=env.js.map