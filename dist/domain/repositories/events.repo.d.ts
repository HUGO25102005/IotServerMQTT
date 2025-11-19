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
    create(data: CreateEventData): Promise<{
        id: any;
    }>;
    findByLock(lockId: string, limit?: number): Promise<any>;
    findByStation(stationId: string, limit?: number): Promise<any>;
    findBySeverity(severity: "info" | "warn" | "error", limit?: number): Promise<any>;
};
export {};
//# sourceMappingURL=events.repo.d.ts.map