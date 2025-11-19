import admin from "firebase-admin";

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
                const serviceAccount = require(this.credentialsPath)
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                })
                console.log(`[Firebase] ✅ Inicializado desde archivo JSON: ${this.credentialsPath}`)
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
            throw new Error(error.message);
        }
    }

    public firestore() {
        try {
            if (!admin.apps.length) {
                this.initialize();
            }
            return admin.firestore();
        } catch (error: any) {
            console.error('[Firebase] ❌ Error al obtener firestore:', error.message)
            throw new Error(error.message);
        }
    }
}

export default AdminFirebase;