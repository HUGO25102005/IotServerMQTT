import { logger } from "../config/logger";

/**
 * Parsea de forma segura un string JSON
 * @param jsonString String JSON a parsear
 * @param fallback Valor por defecto si el parseo falla
 * @returns Objeto parseado o valor por defecto
 */
export function safeJsonParse<T = any>(jsonString: string, fallback: T | null = null): T | null {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        logger.warn({ error, jsonString }, "json_parse_failed");
        return fallback;
    }
}

/**
 * Convierte un objeto a JSON de forma segura
 * @param obj Objeto a convertir
 * @param fallback Valor por defecto si la conversión falla
 * @returns String JSON o valor por defecto
 */
export function safeJsonStringify(obj: any, fallback: string = "{}"): string {
    try {
        return JSON.stringify(obj);
    } catch (error) {
        logger.warn({ error, obj }, "json_stringify_failed");
        return fallback;
    }
}

/**
 * Valida si un string es un JSON válido
 * @param jsonString String a validar
 * @returns true si es JSON válido, false en caso contrario
 */
export function isValidJson(jsonString: string): boolean {
    try {
        JSON.parse(jsonString);
        return true;
    } catch {
        return false;
    }
}

/**
 * Normaliza un objeto JSON eliminando campos undefined y null opcionales
 * @param obj Objeto a normalizar
 * @returns Objeto normalizado
 */
export function normalizeJson(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(normalizeJson);
    }

    if (typeof obj === 'object') {
        const normalized: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
                normalized[key] = normalizeJson(value);
            }
        }
        return normalized;
    }

    return obj;
}
