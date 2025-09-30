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
    create(data: CreateTelemetryData): Promise<import("mysql2").QueryResult>;
    findByLock(lockId: string, limit?: number): Promise<import("mysql2").QueryResult>;
    findByController(controllerId: string, limit?: number): Promise<import("mysql2").QueryResult>;
    findByStation(stationId: string, limit?: number): Promise<import("mysql2").QueryResult>;
    getLatestByLock(lockId: string): Promise<any>;
    getStatsByTimeRange(stationId: string, startTs: number, endTs: number): Promise<any>;
    getBatteryStats(): Promise<any>;
};
export {};
//# sourceMappingURL=telemetry.repo.d.ts.map