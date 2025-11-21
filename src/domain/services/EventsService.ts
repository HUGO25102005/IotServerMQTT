import { EventsModel } from "../../http/models";
import { ParsedTopic } from "../../mqtt/classes/models/ObjectMqttModel";
import { logger } from "../../config/logger";

/**
 * Servicio de Eventos
 * Maneja la lógica de negocio relacionada con eventos de locks
 * Incluye clasificación de severidad y persistencia
 */
class EventsService {
    private model: EventsModel;

    constructor(parsedTopic: ParsedTopic) {
        this.model = new EventsModel(parsedTopic);
    }

    /**
     * Clasifica la severidad del evento
     */
    private classifyEventSeverity(event: string): 'info' | 'warn' | 'error' {
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

    /**
     * Guarda un evento
     */
    public async save(data: any): Promise<void> {
        const { stationId, controllerId, lockId } = this.model.getParsedTopic();

        // Validar campos obligatorios
        if (!data.ts || !data.event) {
            logger.warn({ stationId, controllerId, lockId, data }, "event_missing_required_fields");
            return;
        }

        // Clasificar severidad del evento
        const severity = this.classifyEventSeverity(data.event);

        try {
            // Persistir evento en la base de datos
            await this.model.create({
                ts: data.ts,
                event: data.event,
                details: data.details || null,
                severity
            });

            logger.info({
                stationId,
                controllerId,
                lockId,
                event: data.event,
                severity
            }, "event_processed");
        } catch (error) {
            logger.error({
                error,
                stationId,
                controllerId,
                lockId,
                event: data.event
            }, "event_persistence_failed");
            throw error;
        }
    }

    /**
     * Obtiene el modelo para acceso directo si es necesario
     */
    public getModel(): EventsModel {
        return this.model;
    }
}

export default EventsService;
