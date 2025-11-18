"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
if (!firebase_admin_1.default.apps.length) {
    try {
        if (env_1.env.FIREBASE_CREDENTIALS_PATH) {
            const serviceAccount = require(env_1.env.FIREBASE_CREDENTIALS_PATH);
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount),
            });
            logger_1.logger.info({ path: env_1.env.FIREBASE_CREDENTIALS_PATH }, "Firebase inicializado desde archivo JSON");
        }
        else if (env_1.env.FIREBASE_PROJECT_ID && env_1.env.FIREBASE_CLIENT_EMAIL && env_1.env.FIREBASE_PRIVATE_KEY) {
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert({
                    projectId: env_1.env.FIREBASE_PROJECT_ID,
                    clientEmail: env_1.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: env_1.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
                }),
            });
            logger_1.logger.info({ projectId: env_1.env.FIREBASE_PROJECT_ID }, "Firebase inicializado desde variables de entorno");
        }
        else {
            throw new Error("Firebase no configurado. Proporciona FIREBASE_CREDENTIALS_PATH o " +
                "FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY");
        }
    }
    catch (error) {
        logger_1.logger.error({ error }, "Error al inicializar Firebase");
        throw error;
    }
}
exports.db = firebase_admin_1.default.firestore();
//# sourceMappingURL=db.js.map