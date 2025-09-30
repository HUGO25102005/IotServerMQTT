"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeJsonParse = safeJsonParse;
exports.safeJsonStringify = safeJsonStringify;
exports.isValidJson = isValidJson;
exports.normalizeJson = normalizeJson;
const logger_1 = require("../config/logger");
function safeJsonParse(jsonString, fallback = null) {
    try {
        return JSON.parse(jsonString);
    }
    catch (error) {
        logger_1.logger.warn({ error, jsonString }, "json_parse_failed");
        return fallback;
    }
}
function safeJsonStringify(obj, fallback = "{}") {
    try {
        return JSON.stringify(obj);
    }
    catch (error) {
        logger_1.logger.warn({ error, obj }, "json_stringify_failed");
        return fallback;
    }
}
function isValidJson(jsonString) {
    try {
        JSON.parse(jsonString);
        return true;
    }
    catch {
        return false;
    }
}
function normalizeJson(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(normalizeJson);
    }
    if (typeof obj === 'object') {
        const normalized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
                normalized[key] = normalizeJson(value);
            }
        }
        return normalized;
    }
    return obj;
}
//# sourceMappingURL=json.js.map