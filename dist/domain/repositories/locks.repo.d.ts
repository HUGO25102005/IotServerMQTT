export declare function updateLockSnapshot(p: {
    stationId: string;
    controllerId: string;
    lockId: string;
    state?: 'locked' | 'unlocked';
    seq?: number;
    battery?: number;
    rssi?: number;
}): Promise<void>;
export declare function getLastSeq(stationId: string, controllerId: string, lockId: string): Promise<number | undefined>;
//# sourceMappingURL=locks.repo.d.ts.map