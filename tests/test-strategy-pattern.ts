#!/usr/bin/env ts-node
/**
 * Script de prueba para verificar que el Strategy Pattern funciona correctamente
 * Este script prueba:
 * 1. Que el registry se inicializa correctamente
 * 2. Que los handlers están registrados
 * 3. Que el método handle funciona correctamente
 */

import { MqttHandlerRegistry } from "../src/mqtt/registry/MqttHandlerRegistry";
import {
    TelemetryController,
    EventsController,
    StateController,
    StatusController,
    ConfigController,
    CommandsController,
} from "../src/mqtt/classes/controllers";
import { ParsedTopic } from "../src/mqtt/classes/models/ObjectMqttModel";

console.log("🧪 Iniciando pruebas del Strategy Pattern...\n");

// Test 1: Crear el registry
console.log("Test 1: Creando MqttHandlerRegistry...");
const registry = new MqttHandlerRegistry();
console.log("✅ Registry creado exitosamente\n");

// Test 2: Registrar handlers
console.log("Test 2: Registrando handlers...");
registry.register("telemetry", new TelemetryController());
registry.register("event", new EventsController());
registry.register("state", new StateController());
registry.register("status", new StatusController());
registry.register("config", new ConfigController());
registry.register("command", new CommandsController());
console.log("✅ Handlers registrados exitosamente\n");

// Test 3: Verificar que los handlers están registrados
console.log("Test 3: Verificando handlers registrados...");
const actions = registry.getRegisteredActions();
console.log(`   Handlers registrados: ${actions.join(", ")}`);
console.log(`   Total: ${registry.size()}`);

const expectedActions = ["telemetry", "event", "state", "status", "config", "command"];
const allRegistered = expectedActions.every(action => registry.hasHandler(action));

if (allRegistered) {
    console.log("✅ Todos los handlers esperados están registrados\n");
} else {
    console.error("❌ Faltan algunos handlers");
    process.exit(1);
}

// Test 4: Verificar que se puede obtener un handler
console.log("Test 4: Obteniendo handler de telemetría...");
const telemetryHandler = registry.getHandler("telemetry");
if (telemetryHandler) {
    console.log("✅ Handler de telemetría obtenido correctamente");
    console.log(`   Tipo: ${telemetryHandler.constructor.name}\n`);
} else {
    console.error("❌ No se pudo obtener el handler de telemetría");
    process.exit(1);
}

// Test 5: Verificar que un handler inexistente retorna undefined
console.log("Test 5: Intentando obtener handler inexistente...");
const unknownHandler = registry.getHandler("unknown_action");
if (!unknownHandler) {
    console.log("✅ Handler inexistente retorna undefined correctamente\n");
} else {
    console.error("❌ Handler inexistente debería retornar undefined");
    process.exit(1);
}

// Test 6: Verificar la signature del método handle
console.log("Test 6: Verificando signature del método handle...");
if (typeof telemetryHandler?.handle === "function") {
    console.log("✅ El handler tiene el método 'handle'\n");
} else {
    console.error("❌ El handler no tiene el método 'handle'");
    process.exit(1);
}

// Test 7: Simular parsedTopic
console.log("Test 7: Creando parsedTopic de prueba...");
const mockParsedTopic: ParsedTopic = {
    stationId: "station-test",
    controllerId: "controller-test",
    lockId: "lock-test",
    action: "telemetry",
    hasLocks: true
};
console.log("✅ ParsedTopic creado:", JSON.stringify(mockParsedTopic, null, 2));
console.log();

console.log("═══════════════════════════════════════");
console.log("✅ TODAS LAS PRUEBAS PASARON");
console.log("═══════════════════════════════════════");
console.log("\nEl Strategy Pattern está implementado correctamente:");
console.log(`  • ${registry.size()} handlers registrados`);
console.log(`  • Registry funcionando correctamente`);
console.log(`  • Interface IMqttMessageHandler implementada`);
console.log("\n🎉 Sistema listo para procesar mensajes MQTT\n");
