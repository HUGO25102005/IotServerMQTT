import { config } from "dotenv";
import { cleanEnv, str, num } from "envalid";

// Cargar variables de entorno desde .env
config();

export const env = cleanEnv(process.env, {
    // Configuración del servidor
    PORT: num({ default: 3000 }),
    NODE_ENV: str({ default: "development", choices: ["development", "production", "test"] }),
    LOG_LEVEL: str({ default: "info", choices: ["error", "warn", "info", "debug"] }),

    // Configuración MQTT
    MQTT_URL: str({ default: "mqtt://localhost:1883" }),
    MQTT_USERNAME: str({ default: "" }),
    MQTT_PASSWORD: str({ default: "" }),
    MQTT_CLIENT_ID: str({ default: "" }), // Client ID personalizado (opcional)
    MQTT_BASE: str({ default: "casa/todos" }), // Topic base para suscripciones
    MQTT_TOPIC_MENSAJES: str({ default: "messages/success" }), // Topic para publicar mensajes

    // Firebase Admin SDK - Opción 1: Archivo JSON (Recomendado para desarrollo)
    FIREBASE_CREDENTIALS_PATH: str({ default: "./firebase-credentials.json" }),

    // Firebase Admin SDK - Opción 2: Variables de entorno (Recomendado para producción)
    FIREBASE_PROJECT_ID: str({ default: "" }),
    FIREBASE_CLIENT_EMAIL: str({ default: "" }),
    FIREBASE_PRIVATE_KEY: str({ default: "" }),

    // Configuración adicional
    COMMAND_TIMEOUT: num({ default: 5000 }), // Timeout para comandos en milisegundos
    TELEMETRY_BATCH_SIZE: num({ default: 100 }), // Tamaño del batch para telemetría
});