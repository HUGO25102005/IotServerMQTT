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
        id: string;
    }>;
    findByLock(lockId: string, limit?: number): Promise<{
        id: string;
    }[]>;
    findByStation(stationId: string, limit?: number): Promise<{
        id: string;
    }[]>;
    findBySeverity(severity: "info" | "warn" | "error", limit?: number): Promise<{
        id: string;
    }[]>;
};
export {};
//# sourceMappingURL=events.repo.d.ts.map