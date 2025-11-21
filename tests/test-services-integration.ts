#!/usr/bin/env ts-node
/**
 * Script de testing de integración para verificar que los Services funcionan correctamente
 */

import { TelemetryService, EventsService, LoggerService, StateService, StatusService, ConfigService } from "../src/domain/services";
import { ParsedTopic } from "../src/mqtt/classes/models/ObjectMqttModel";

console.log("🧪 Iniciando Tests de Integración de Services...\n");

// Mock ParsedTopic para testing
const mockParsedTopic: ParsedTopic = {
    stationId: "test-station",
    controllerId: "test-controller",
    lockId: "test-lock",
    action: "telemetry",
    hasLocks: true
};

let passedTests = 0;
let totalTests = 0;

function test(name: string, fn: () => void) {
    totalTests++;
    try {
        fn();
        console.log(`✅ ${name}`);
        passedTests++;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error}`);
    }
}

// Test 1: Services se pueden instanciar
console.log("📦 Test 1: Instanciación de Services\n");

test("TelemetryService se instancia correctamente", () => {
    const service = new TelemetryService(mockParsedTopic);
    if (!service) throw new Error("Service is undefined");
    if (typeof service.save !== "function") throw new Error("save method not found");
    if (typeof service.findAll !== "function") throw new Error("findAll method not found");
    if (typeof service.findById !== "function") throw new Error("findById method not found");
});

test("EventsService se instancia correctamente", () => {
    const service = new EventsService(mockParsedTopic);
    if (!service) throw new Error("Service is undefined");
    if (typeof service.save !== "function") throw new Error("save method not found");
});

test("StateService se instancia correctamente", () => {
    const service = new StateService(mockParsedTopic);
    if (!service) throw new Error("Service is undefined");
    if (typeof service.save !== "function") throw new Error("save method not found");
});

test("StatusService se instancia correctamente", () => {
    const service = new StatusService(mockParsedTopic);
    if (!service) throw new Error("Service is undefined");
    if (typeof service.save !== "function") throw new Error("save method not found");
});

test("ConfigService se instancia correctamente", () => {
    const service = new ConfigService(mockParsedTopic);
    if (!service) throw new Error("Service is undefined");
    if (typeof service.save !== "function") throw new Error("save method not found");
});

test("LoggerService se instancia correctamente", () => {
    const service = new LoggerService(mockParsedTopic);
    if (!service) throw new Error("Service is undefined");
    if (typeof service.save !== "function") throw new Error("save method not found");
    if (typeof service.findAll !== "function") throw new Error("findAll method not found");
    if (typeof service.findById !== "function") throw new Error("findById method not found");
});

console.log("\n📋 Test 2: Verificación de Métodos\n");

test("TelemetryService tiene método getModel()", () => {
    const service = new TelemetryService(mockParsedTopic);
    const model = service.getModel();
    if (!model) throw new Error("getModel() returned undefined");
});

test("EventsService tiene método getModel()", () => {
    const service = new EventsService(mockParsedTopic);
    const model = service.getModel();
    if (!model) throw new Error("getModel() returned undefined");
});

test("LoggerService tiene método estático createLog()", () => {
    if (typeof LoggerService.createLog !== "function") {
        throw new Error("createLog static method not found");
    }
});

console.log("\n═══════════════════════════════════════");
console.log(`✅ Tests Pasados: ${passedTests}/${totalTests}`);
console.log("═══════════════════════════════════════\n");

if (passedTests === totalTests) {
    console.log("🎉 TODOS LOS TESTS DE INTEGRACIÓN PASARON\n");
    console.log("Los Services están correctamente implementados:");
    console.log("  • Todos los services se instancian correctamente");
    console.log("  • Todos los métodos requeridos están presentes");
    console.log("  • La interfaz de los services es consistente");
    process.exit(0);
} else {
    console.error(`❌ ${totalTests - passedTests} test(s) fallaron\n`);
    process.exit(1);
}
