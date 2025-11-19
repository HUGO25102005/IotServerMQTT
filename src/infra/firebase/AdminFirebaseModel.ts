import admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";

class AdminFirebase {

    constructor(
        private credentialsPath: string,
        private projectId: string,
        private clientEmail: string,
        private privateKey: string
    ) {
        this.credentialsPath = credentialsPath;
        this.projectId = projectId;
        this.clientEmail = clientEmail;
        this.privateKey = privateKey;
    }

    public initialize() {
        try {
            if (this.credentialsPath) {
                // Resolver la ruta absoluta desde la raíz del proyecto
                const resolvedPath = path.isAbsolute(this.credentialsPath)
                    ? this.credentialsPath
                    : path.resolve(process.cwd(), this.credentialsPath);

                console.log(`[Firebase] Intentando cargar credenciales desde: ${resolvedPath}`);

                // Verificar que el archivo existe antes de requerirlo
                if (!fs.existsSync(resolvedPath)) {
                    console.warn(`[Firebase] ⚠️ Archivo de credenciales no encontrado en: ${resolvedPath}`);
                    console.warn(`[Firebase] Directorio de trabajo actual: ${process.cwd()}`);
                    return;
                }

                const serviceAccount = require(resolvedPath);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                })
                console.log(`[Firebase] ✅ Inicializado desde archivo JSON: ${resolvedPath}`)
                return;
            }
            if (this.projectId && this.clientEmail && this.privateKey) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: this.projectId,
                        clientEmail: this.clientEmail,
                        privateKey: this.privateKey.replace(/\\n/g, '\n'),
                    }),
                })
                console.log(`[Firebase] ✅ Inicializado desde variables de entorno`)
                return;
            }

            console.warn('[Firebase] ⚠️ No configurado. Los mensajes MQTT no se guardarán en Firestore.')
            console.warn('[Firebase] Configura FIREBASE_CREDENTIALS_PATH o las variables FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY')

        } catch (error: any) {
            console.error('[Firebase] ❌ Error al inicializar:', error.message)
            console.warn('[Firebase] Continuando sin Firebase...')
            // No lanzar error, solo mostrar warning
        }
    }

    public firestore() {
        try {
            if (!admin.apps.length) {
                this.initialize();
            }
            if (!admin.apps.length) {
                // Si después de initialize() aún no hay apps, Firebase no está configurado
                return null;
            }
            return admin.firestore();
        } catch (error: any) {
            console.error('[Firebase] ❌ Error al obtener firestore:', error.message)
            return null;
        }
    }
}

export default AdminFirebase;