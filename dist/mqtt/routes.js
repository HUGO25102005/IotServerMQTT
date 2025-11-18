"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onMqttMessage = onMqttMessage;
const topics_1 = require("./topics");
const logger_1 = require("../config/logger");
const metrics_1 = require("../infra/metrics");
const telemetry = __importStar(require("./handlers/telemetry"));
const event = __importStar(require("./handlers/event"));
const state = __importStar(require("./handlers/state"));
const status = __importStar(require("./handlers/status"));
const config = __importStar(require("./handlers/config"));
function onMqttMessage(topic, raw) {
    const { stationId, deviceId, lockId, subtype } = (0, topics_1.parseTopic)(topic);
    let data;
    try {
        data = JSON.parse(raw);
    }
    catch {
        logger_1.logger.warn({ topic }, "json_invalid");
        return;
    }
    metrics_1.mqttMessagesTotal.inc({ type: subtype });
    switch (subtype) {
        case "telemetry":
            telemetry.handle({ stationId, deviceId, lockId, data });
            return;
        case "event": {
            if (!lockId) {
                logger_1.logger.warn({ topic }, "lock_id_missing");
                return;
            }
            event.handle({ stationId, deviceId, lockId, data });
            return;
        }
        case "state": {
            if (!lockId) {
                logger_1.logger.warn({ topic }, "lock_id_missing");
                return;
            }
            state.handle({ stationId, deviceId, lockId, data });
            return;
        }
        case "status": {
            if (!deviceId || !stationId) {
                logger_1.logger.warn({ topic }, "device_id_or_station_id_missing");
                return;
            }
            status.handle({ stationId, deviceId, data });
            return;
        }
        case "config": {
            if (!deviceId || !stationId) {
                logger_1.logger.warn({ topic }, "device_id_missing");
                return;
            }
            config.handle({ stationId, deviceId, data });
            return;
        }
        default:
            logger_1.logger.warn({ topic }, "subtype_unknown");
    }
}
//# sourceMappingURL=routes.js.map