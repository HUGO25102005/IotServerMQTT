import { db } from "../../infra/db";
import { FieldValue } from "firebase-admin/firestore";

export async function handle({ stationId, deviceId, data }: {
    stationId: string;
    deviceId: string;
    data: any;
}) {
    const s = (data?.status === "online" || data?.status === "offline") ? data.status : "unknown";

    const controllerRef = db
        .collection("stations")
        .doc(stationId)
        .collection("controllers")
        .doc(deviceId);

    await controllerRef.set(
        {
            station_id: stationId,
            last_status: s,
            last_seen_at: FieldValue.serverTimestamp(),
        },
        { merge: true }
    );
}