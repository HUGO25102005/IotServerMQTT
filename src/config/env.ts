import { config } from "dotenv";
import { cleanEnv, str, num } from "envalid";

// Cargar variables de entorno desde .env
config();

export const env = cleanEnv(process.env, {
    PORT: num({ default: 3000 }),
    MQTT_URL: str(),
    MQTT_USERNAME: str({ default: "" }),
    MQTT_PASSWORD: str({ default: "" }),
    MQTT_CLIENT_ID: str({ default: "" }), // Client ID personalizado (opcional)

    // Firebase Admin SDK - Opción 1: Archivo JSON (Recomendado)
    FIREBASE_CREDENTIALS_PATH: str({ default: "./firebase-credentials.json" }),

    // Firebase Admin SDK - Opción 2: Variables de entorno (Alternativa)
    FIREBASE_PROJECT_ID: str({ default: "" }),
    FIREBASE_CLIENT_EMAIL: str({ default: "" }),
    FIREBASE_PRIVATE_KEY: str({ default: "" }),
});