export declare const env: Readonly<{
    PORT: number;
    NODE_ENV: "development" | "production" | "test";
    LOG_LEVEL: "info" | "error" | "warn" | "debug";
    MQTT_URL: string;
    MQTT_USERNAME: string;
    MQTT_PASSWORD: string;
    MQTT_CLIENT_ID: string;
    MQTT_BASE: string;
    MQTT_TOPIC_MENSAJES: string;
    FIREBASE_CREDENTIALS_PATH: string;
    FIREBASE_PROJECT_ID: string;
    FIREBASE_CLIENT_EMAIL: string;
    FIREBASE_PRIVATE_KEY: string;
    COMMAND_TIMEOUT: number;
    TELEMETRY_BATCH_SIZE: number;
} & import("envalid").CleanedEnvAccessors>;
//# sourceMappingURL=env.d.ts.map