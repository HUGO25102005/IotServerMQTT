import admin from "firebase-admin";
import { env } from "../config/env";
import { logger } from "../config/logger";

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
    try {
        if (env.FIREBASE_CREDENTIALS_PATH) {
            // Opción 1: Desde archivo JSON (Recomendado para desarrollo)
            const serviceAccount = require(env.FIREBASE_CREDENTIALS_PATH);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            logger.info({ path: env.FIREBASE_CREDENTIALS_PATH }, "Firebase inicializado desde archivo JSON");
        } else if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
            // Opción 2: Desde variables de entorno (Recomendado para producción)
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: env.FIREBASE_PROJECT_ID,
                    clientEmail: env.FIREBASE_CLIENT_EMAIL,
                    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
                }),
            });
            logger.info({ projectId: env.FIREBASE_PROJECT_ID }, "Firebase inicializado desde variables de entorno");
        } else {
            throw new Error(
                "Firebase no configurado. Proporciona FIREBASE_CREDENTIALS_PATH o " +
                "FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY"
            );
        }
    } catch (error) {
        logger.error({ error }, "Error al inicializar Firebase");
        throw error;
    }
}

export const db = admin.firestore();