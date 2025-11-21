import { ConfigModel } from "../../http/models";
import { ParsedTopic } from "../../mqtt/classes/models/ObjectMqttModel";
import { controllersRepo } from "../repositories/controllers.repo";
import db from "../../infra/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "../../config/logger";

/**
 * Servicio de Configuración
 * Maneja la lógica de negocio relacionada con la configuración de controladores y locks
 * Incluye creación/actualización de estaciones, controladores y locks
 */
class ConfigService {
    private model: ConfigModel;

    constructor(parsedTopic: ParsedTopic) {
        this.model = new ConfigModel(parsedTopic);
    }

    /**
     * Procesa la configuración del controlador
     * Crea/actualiza la estación, controlador y locks
     */
    public async save(data: any): Promise<void> {
        const { stationId, controllerId } = this.model.getParsedTopic();

        try {
            // Crear/actualizar station
            await db
                .collection("stations")
                .doc(stationId)
                .set({ created_at: FieldValue.serverTimestamp() }, { merge: true });

            // Crear/actualizar controller
            await controllersRepo.create({
                id: controllerId,
                stationId,
                fw: data?.fw,
                hw: data?.hw,
            });

            // Crear/actualizar locks
            if (Array.isArray(data?.locks)) {
                for (const lock of data.locks) {
                    const lockRef = db
                        .collection("stations")
                        .doc(stationId)
                        .collection("controllers")
                        .doc(controllerId)
                        .collection("locks")
                        .doc(lock.lockId);

                    await lockRef.set(
                        {
                            controller_id: controllerId,
                            position: lock.position ?? null,
                            created_at: FieldValue.serverTimestamp(),
                        },
                        { merge: true }
                    );
                }
            }

            // Actualizar la configuración en el documento del controller
            await this.model.updateControllerConfig(data);

            logger.info({ stationId, controllerId, locksCount: data?.locks?.length || 0 }, "config_processed");
        } catch (error) {
            logger.error({ error, stationId, controllerId }, "config_save_failed");
            throw error;
        }
    }

    /**
     * Obtiene el modelo para acceso directo si es necesario
     */
    public getModel(): ConfigModel {
        return this.model;
    }
}

export default ConfigService;
