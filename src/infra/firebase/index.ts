import AdminFirebaseModel from "./AdminFirebaseModel";
import { env } from "../../config/env";

const admin = new AdminFirebaseModel(
    env.FIREBASE_CREDENTIALS_PATH,
    env.FIREBASE_PROJECT_ID,
    env.FIREBASE_CLIENT_EMAIL,
    env.FIREBASE_PRIVATE_KEY
);

try {
    admin.initialize();
} catch (error) {
    console.warn('[Firebase] No se pudo inicializar Firebase');
}

let db: any = null;
try {
    db = admin.firestore();
} catch (error) {
    console.warn('[Firebase] No se pudo obtener Firestore');
}

export default db;