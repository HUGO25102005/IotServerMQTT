import db from "../../infra/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { ParsedTopic } from "../../mqtt/classes/models/ObjectMqttModel";

/**
 * Clase base para todos los modelos HTTP que interactúan con Firestore
 * Construye las rutas de colecciones basándose en el topic parseado
 */
class BaseFirestoreModel {
    protected parsedTopic: ParsedTopic;
    protected collectionName: string;

    constructor(parsedTopic: ParsedTopic, collectionName: string) {
        this.parsedTopic = parsedTopic;
        this.collectionName = collectionName;
    }

    /**
     * Construye la ruta base de la colección según el tipo de topic
     * Para topics con locks: stations/{stationId}/controllers/{controllerId}/locks/{lockId}
     * Para topics sin locks: stations/{stationId}/controllers/{controllerId}
     */
    protected getBaseCollectionPath() {
        const { stationId, controllerId, lockId, hasLocks } = this.parsedTopic;

        if (hasLocks && lockId) {
            // Ruta con locks: stations/{stationId}/controllers/{controllerId}/locks/{lockId}
            return db
                .collection("stations")
                .doc(stationId)
                .collection("controllers")
                .doc(controllerId)
                .collection("locks")
                .doc(lockId);
        } else {
            // Ruta sin locks: stations/{stationId}/controllers/{controllerId}
            return db
                .collection("stations")
                .doc(stationId)
                .collection("controllers")
                .doc(controllerId);
        }
    }

    /**
     * Obtiene la referencia a la colección específica (telemetry, events, commands, etc.)
     * Retorna la referencia a la subcolección donde se guardarán los documentos
     * Nota: Para status y config, retorna null ya que se guardan directamente en el documento del controller
     */
    public getCollectionPath() {
        // Status y config se guardan directamente en el documento del controller, no en subcolección
        if (this.collectionName === "status" || this.collectionName === "config") {
            return null;
        }
        return this.getBaseCollectionPath().collection(this.collectionName);
    }

    /**
     * Crea un nuevo documento en la colección
     * @param data - Datos a guardar (normalmente el JSON tal cual llega de MQTT)
     * @param docId - ID opcional del documento. Si no se proporciona, Firestore genera uno automático
     * @returns Referencia al documento creado
     */
    public async create(data: any, docId?: string) {
        const collectionRef = this.getCollectionPath();

        // Si es status o config, no se puede usar create directamente
        // Deben usar los métodos específicos updateControllerStatus o updateControllerConfig
        if (!collectionRef) {
            throw new Error(`No se puede usar create() para ${this.collectionName}. Usa los métodos específicos de la clase.`);
        }
        // console.log(collectionRef.doc(docId));
        const docRef = docId ? collectionRef.doc(docId) : collectionRef.doc();

        const dataToSave = {
            ...data,
            // Construir topic usando "controllers" (plural) para la ruta de Firestore
            topic: this.parsedTopic.stationId ?
                `stations/${this.parsedTopic.stationId}/controllers/${this.parsedTopic.controllerId}${this.parsedTopic.lockId ? `/locks/${this.parsedTopic.lockId}` : ''}${this.parsedTopic.action ? `/${this.parsedTopic.action}` : ''}` :
                '',
            station_id: this.parsedTopic.stationId,
            controller_id: this.parsedTopic.controllerId,
            ...(this.parsedTopic.lockId && { lock_id: this.parsedTopic.lockId }),
            created_at: FieldValue.serverTimestamp(),
            updated_at: FieldValue.serverTimestamp(),
        };

        const firestorePath = docRef.path;
        console.log(`[BaseFirestoreModel] 💾 Guardando en Firestore: ${firestorePath}`);
        console.log(`[BaseFirestoreModel] 📦 Datos:`, JSON.stringify(dataToSave, null, 2));

        try {
            await docRef.set(dataToSave);
            console.log(`[BaseFirestoreModel] ✅ Document guardado exitosamente en: ${firestorePath}`);

            // Verificar que realmente se guardó
            const savedDoc = await docRef.get();
            if (savedDoc.exists) {
                console.log(`[BaseFirestoreModel] ✅ Verificado: Document existe en Firestore`);
            } else {
                console.error(`[BaseFirestoreModel] ❌ ERROR: Document NO existe después de guardarlo!`);
            }
        } catch (error: any) {
            console.error(`[BaseFirestoreModel] ❌ ERROR al guardar:`, error);
            console.error(`[BaseFirestoreModel] Error code:`, error.code);
            console.error(`[BaseFirestoreModel] Error message:`, error.message);
            throw error;
        }

        return docRef;
    }

    /**
     * Busca un documento por su ID
     * @param docId - ID del documento a buscar
     * @returns Documento encontrado o null
     */
    public async findById(docId: string) {
        const collectionRef = this.getCollectionPath();
        if (!collectionRef) {
            throw new Error(`No se puede usar findById() para ${this.collectionName}. Usa los métodos específicos de la clase.`);
        }

        const docRef = collectionRef.doc(docId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return null;
        }

        return { id: doc.id, ...doc.data() };
    }

    /**
     * Actualiza un documento existente
     * @param docId - ID del documento a actualizar
     * @param data - Datos a actualizar
     */
    public async update(docId: string, data: any) {
        const collectionRef = this.getCollectionPath();
        if (!collectionRef) {
            throw new Error(`No se puede usar update() para ${this.collectionName}. Usa los métodos específicos de la clase.`);
        }

        const docRef = collectionRef.doc(docId);

        await docRef.update({
            ...data,
            updated_at: FieldValue.serverTimestamp(),
        });

        return docRef;
    }

    /**
     * Elimina un documento
     * @param docId - ID del documento a eliminar
     */
    public async delete(docId: string) {
        const collectionRef = this.getCollectionPath();
        if (!collectionRef) {
            throw new Error(`No se puede usar delete() para ${this.collectionName}. Usa los métodos específicos de la clase.`);
        }

        const docRef = collectionRef.doc(docId);
        await docRef.delete();
    }

    /**
     * Obtiene todos los documentos de la colección (con límite opcional)
     * @param limit - Número máximo de documentos a retornar
     * @returns Array de documentos
     */
    public async findAll(limit?: number) {
        const collectionRef = this.getCollectionPath();
        if (!collectionRef) {
            throw new Error(`No se puede usar findAll() para ${this.collectionName}. Usa los métodos específicos de la clase.`);
        }

        let query = collectionRef.orderBy("created_at", "desc");

        if (limit) {
            query = query.limit(limit) as any;
        }

        const snapshot = await query.get();
        return snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    /**
     * Obtiene el parsedTopic (útil para clases hijas)
     */
    public getParsedTopic(): ParsedTopic {
        return this.parsedTopic;
    }
}

export default BaseFirestoreModel;

