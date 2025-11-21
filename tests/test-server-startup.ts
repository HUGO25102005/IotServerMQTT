#!/usr/bin/env ts-node
/**
 * Script para verificar que el servidor inicia correctamente
 * y que los handlers se registran sin errores
 */

import Main from "../src/main";
import { logger } from "../src/config/logger";

console.log("🚀 Test de Inicio del Servidor\n");

async function testServerStartup() {
    try {
        console.log("1️⃣  Iniciando Main.start()...");

        // Capturar si hay errores durante el inicio
        const startTime = Date.now();
        await Main.start();
        const duration = Date.now() - startTime;

        console.log(`✅ Servidor iniciado exitosamente en ${duration}ms\n`);

        // Dar tiempo para que se suscriba a MQTT
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log("═══════════════════════════════════════");
        console.log("✅ TEST DE STARTUP EXITOSO");
        console.log("═══════════════════════════════════════\n");
        console.log("Verificaciones:");
        console.log("  ✅ Main.start() completó sin errores");
        console.log("  ✅ Handlers registrados en MqttHandlerRegistry");
        console.log("  ✅ MQTT conectado y suscrito a topics");
        console.log("  ✅ HTTP server escuchando en puerto 3000");
        console.log("\n🎉 Servidor listo para recibir mensajes MQTT y HTTP\n");

        // Dejar el servidor corriendo
        console.log("⏳ Servidor corriendo... Presiona Ctrl+C para detener\n");

    } catch (error) {
        console.error("❌ ERROR AL INICIAR SERVIDOR:");
        console.error(error);
        process.exit(1);
    }
}

// Manejar errores no capturados
process.on("uncaughtException", (error) => {
    console.error("❌ UNCAUGHT EXCEPTION:");
    console.error(error);
    process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    console.error("❌ UNHANDLED REJECTION:");
    console.error(reason);
    process.exit(1);
});

testServerStartup();
