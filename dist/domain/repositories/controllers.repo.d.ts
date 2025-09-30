interface CreateControllerData {
    id: string;
    stationId: string;
    fw?: string;
    hw?: string;
}
interface UpdateControllerStatusData {
    id: string;
    status: 'online' | 'offline' | 'unknown';
    lastSeenAt?: Date;
}
export declare const controllersRepo: {
    create(data: CreateControllerData): Promise<import("mysql2").QueryResult>;
    updateStatus(data: UpdateControllerStatusData): Promise<import("mysql2").QueryResult>;
    findById(id: string): Promise<any>;
    findByStation(stationId: string): Promise<import("mysql2").QueryResult>;
    getAll(): Promise<import("mysql2").QueryResult>;
    getOnlineCount(): Promise<any>;
    getOfflineCount(): Promise<any>;
};
export {};
//# sourceMappingURL=controllers.repo.d.ts.map