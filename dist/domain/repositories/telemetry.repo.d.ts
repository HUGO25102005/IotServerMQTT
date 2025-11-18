interface CreateTelemetryData {
    stationId: string;
    controllerId: string;
    lockId: string;
    ts: number;
    state: 'locked' | 'unlocked';
    battery?: number;
    rssi?: number;
    fw?: string;
    seq?: number;
}
export declare const telemetryRepo: {
    create(data: CreateTelemetryData): Promise<{
        id: string;
    }>;
    findByLock(lockId: string, limit?: number): Promise<{
        id: string;
    }[]>;
    findByController(controllerId: string, limit?: number): Promise<{
        id: string;
    }[]>;
    findByStation(stationId: string, limit?: number): Promise<{
        id: string;
    }[]>;
    getLatestByLock(lockId: string): Promise<{
        id: string;
    } | null>;
    getStatsByTimeRange(stationId: string, startTs: number, endTs: number): Promise<{
        total_messages: number;
        unique_locks: number;
        avg_battery: number | null;
        avg_rssi: number | null;
    }>;
    getBatteryStats(): Promise<{
        total_locks: number;
        low_battery_count: number;
        avg_battery: number | null;
    }>;
};
export {};
//# sourceMappingURL=telemetry.repo.d.ts.map