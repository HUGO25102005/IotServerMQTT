import { logger } from "../../config/logger";
import { eventsRepo } from "../../domain/repositories/events.repo";

interface EventData {
    ts: number;
    event: string;
    details?: any;
}

interface EventContext {
    stationId: string;
    deviceId: string;
    lockId: string;
    data: EventData;
}

export async function handle({ stationId, deviceId, lockId, data }: EventContext) {
    // Validar campos obligatorios
    if (!data.ts || !data.event) {
        logger.warn({ stationId, deviceId, lockId, data }, "event_missing_required_fields");
        return;
    }

    // Clasificar severidad del evento
    const severity = classifyEventSeverity(data.event);

    try {
        // Persistir evento en la base de datos
        await eventsRepo.create({
            stationId,
            controllerId: deviceId,
            lockId,
            ts: data.ts,
            event: data.event,
            detailsJson: data.details || null,
            severity
        });

        logger.info({
            stationId,
            deviceId,
            lockId,
            event: data.event,
            severity
        }, "event_processed");

    } catch (error) {
        logger.error({
            error,
            stationId,
            deviceId,
            lockId,
            event: data.event
        }, "event_persistence_failed");
    }
}

function classifyEventSeverity(event: string): 'info' | 'warn' | 'error' {
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
    } else if (warningEvents.includes(event)) {
        return 'warn';
    } else {
        return 'info';
    }
}
