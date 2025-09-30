export declare function updateLockSnapshot(p: {
    controllerId: string;
    lockId: string;
    state?: 'locked' | 'unlocked';
    seq?: number;
    battery?: number;
    rssi?: number;
}): Promise<void>;
export declare function getLastSeq(controllerId: string, lockId: string): Promise<number | undefined>;
//# sourceMappingURL=locks.repo.d.ts.map