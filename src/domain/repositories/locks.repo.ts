import { db } from "../../infra/db";
import { FieldValue } from "firebase-admin/firestore";

export async function updateLockSnapshot(p: {
    stationId: string;
    controllerId: string;
    lockId: string;
    state?: 'locked' | 'unlocked';
    seq?: number;
    battery?: number;
    rssi?: number;
}) {
    const lockRef = db
        .collection("stations")
        .doc(p.stationId)
        .collection("controllers")
        .doc(p.controllerId)
        .collection("locks")
        .doc(p.lockId);

    const updateData: any = {
        controller_id: p.controllerId,
        updated_at: FieldValue.serverTimestamp(),
    };

    if (p.state !== undefined) updateData.last_state = p.state;
    if (p.battery !== undefined) updateData.last_battery = p.battery;
    if (p.rssi !== undefined) updateData.last_rssi = p.rssi;

    if (p.seq !== undefined) {
        // Usar transacción para GREATEST

        await db.runTransaction(async (transaction: any) => {
            const lockDoc = await transaction.get(lockRef);
            const lockData = lockDoc.data();
            const currentSeq = lockData?.['last_seq'] || 0;
            updateData.last_seq = Math.max(currentSeq, p.seq!);
            transaction.set(lockRef, updateData, { merge: true });
        });
    } else {
        await lockRef.set(updateData, { merge: true });
    }
}

export async function getLastSeq(
    stationId: string,
    controllerId: string,
    lockId: string
): Promise<number | undefined> {
    const lockDoc = await db
        .collection("stations")
        .doc(stationId)
        .collection("controllers")
        .doc(controllerId)
        .collection("locks")
        .doc(lockId)
        .get();

    const lockData = lockDoc.data();
    return lockData?.['last_seq'];
}