import AdminFirebaseModel from "./AdminFirebaseModel";
import { env } from "../../config/env";

const admin = new AdminFirebaseModel(
    env.FIREBASE_CREDENTIALS_PATH,
    env.FIREBASE_PROJECT_ID,
    env.FIREBASE_CLIENT_EMAIL,
    env.FIREBASE_PRIVATE_KEY
);

admin.initialize();
const db = admin.firestore();

export default db;