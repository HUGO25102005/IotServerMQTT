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
        id: any;
    }>;
    findByLock(lockId: string, limit?: number): Promise<any>;
    findByController(controllerId: string, limit?: number): Promise<any>;
    findByStation(stationId: string, limit?: number): Promise<any>;
    getLatestByLock(lockId: string): Promise<any>;
    getStatsByTimeRange(stationId: string, startTs: number, endTs: number): Promise<{
        total_messages: any;
        unique_locks: number;
        avg_battery: number | null;
        avg_rssi: number | null;
    }>;
    getBatteryStats(): Promise<{
        total_locks: any;
        low_battery_count: any;
        avg_battery: number | null;
    }>;
};
export {};
//# sourceMappingURL=telemetry.repo.d.ts.map