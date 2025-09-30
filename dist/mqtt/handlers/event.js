"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const logger_1 = require("../../config/logger");
const events_repo_1 = require("../../domain/repositories/events.repo");
async function handle({ stationId, deviceId, lockId, data }) {
    if (!data.ts || !data.event) {
        logger_1.logger.warn({ stationId, deviceId, lockId, data }, "event_missing_required_fields");
        return;
    }
    const severity = classifyEventSeverity(data.event);
    try {
        await events_repo_1.eventsRepo.create({
            stationId,
            controllerId: deviceId,
            lockId,
            ts: data.ts,
            event: data.event,
            detailsJson: data.details || null,
            severity
        });
        logger_1.logger.info({
            stationId,
            deviceId,
            lockId,
            event: data.event,
            severity
        }, "event_processed");
    }
    catch (error) {
        logger_1.logger.error({
            error,
            stationId,
            deviceId,
            lockId,
            event: data.event
        }, "event_persistence_failed");
    }
}
function classifyEventSeverity(event) {
    const errorEvents = [
        'error_motor',
        'error_sensor',
        'error_battery',
        'communication_error',
        'hardware_failure'
    ];
    const warningEvents = [
        'tamper_detected',
        'forced_open',
        'low_battery',
        'signal_weak',
        'maintenance_required'
    ];
    if (errorEvents.includes(event)) {
        return 'error';
    }
    else if (warningEvents.includes(event)) {
        return 'warn';
    }
    else {
        return 'info';
    }
}
//# sourceMappingURL=event.js.map