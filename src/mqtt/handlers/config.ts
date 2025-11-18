import { db } from "../../infra/db";
import { FieldValue } from "firebase-admin/firestore";
import { controllersRepo } from "../../domain/repositories/controllers.repo";

// upsert de controller + locks desde config (retained)
export async function handle({ stationId, deviceId, data }: {
    stationId: string;
    deviceId: string;
    data: any;
}) {
    // Simplificado: asumir data.locks = [{lockId, position}]

    // Crear/actualizar station
    await db
        .collection("stations")
        .doc(stationId)
        .set({ created_at: FieldValue.serverTimestamp() }, { merge: true });

    // Crear/actualizar controller
    await controllersRepo.create({
        id: deviceId,
        stationId,
        fw: data?.fw,
        hw: data?.hw,
    });

    // Crear/actualizar locks
    if (Array.isArray(data?.locks)) {
        for (const l of data.locks) {
            const lockRef = db
                .collection("stations")
                .doc(stationId)
                .collection("controllers")
                .doc(deviceId)
                .collection("locks")
                .doc(l.lockId);

            await lockRef.set(
                {
                    controller_id: deviceId,
                    position: l.position ?? null,
                    created_at: FieldValue.serverTimestamp(),
                },
                { merge: true }
            );
        }
    }
}