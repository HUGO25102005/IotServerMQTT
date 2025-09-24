import { cleanEnv, str, num, url, host } from "envalid";

export const env = cleanEnv(process.env, {
    PORT:        num({ default: 3000 }),
    MQTT_URL:    str(),
    MQTT_USERNAME: str({ default: "" }),
    MQTT_PASSWORD: str({ default: "" }),
    DB_HOST:     host(),
    DB_PORT:     num({ default: 3306 }),
    DB_USER:     str(),
    DB_PASSWORD: str(),
    DB_NAME:     str(),
  });