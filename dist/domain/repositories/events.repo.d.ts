interface CreateEventData {
    stationId: string;
    controllerId: string;
    lockId: string;
    ts: number;
    event: string;
    detailsJson: any;
    severity: 'info' | 'warn' | 'error';
}
export declare const eventsRepo: {
    create(data: CreateEventData): Promise<import("mysql2").QueryResult>;
    findByLock(lockId: string, limit?: number): Promise<import("mysql2").QueryResult>;
    findByStation(stationId: string, limit?: number): Promise<import("mysql2").QueryResult>;
    findBySeverity(severity: "info" | "warn" | "error", limit?: number): Promise<import("mysql2").QueryResult>;
};
export {};
//# sourceMappingURL=events.repo.d.ts.map