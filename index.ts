// Punto de entrada principal de la aplicación
// Inicializa Firebase y el servidor MQTT

import Main from "./src/main";
import { logger } from "./src/config/logger";
import "./src/server"; // Iniciar servidor HTTP

/**
 * Función principal que inicia la aplicación
 */
async function start() {
    try {
        logger.info({}, "🚀 Iniciando servidor IoT MQTT...");

        // Inicializar el servidor MQTT
        await Main.start();

        logger.info({}, "✅ Servidor iniciado correctamente");
    } catch (error) {
        logger.error({ error }, "❌ Error al iniciar el servidor");
        process.exit(1);
    }
}

// Manejar cierre graceful
process.on("SIGINT", () => {
    logger.info({}, "🛑 Recibida señal SIGINT, cerrando servidor...");
    process.exit(0);
});

process.on("SIGTERM", () => {
    logger.info({}, "🛑 Recibida señal SIGTERM, cerrando servidor...");
    process.exit(0);
});

// Manejar errores no capturados
process.on("uncaughtException", (error) => {
    logger.error({ error }, "❌ Excepción no capturada");
    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    logger.error({ reason, promise }, "❌ Promesa rechazada no manejada");
    process.exit(1);
});

// Iniciar la aplicación
start();
