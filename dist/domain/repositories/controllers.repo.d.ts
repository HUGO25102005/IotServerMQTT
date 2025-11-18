interface CreateControllerData {
    id: string;
    stationId: string;
    fw?: string;
    hw?: string;
}
interface UpdateControllerStatusData {
    id: string;
    stationId: string;
    status: 'online' | 'offline' | 'unknown';
    lastSeenAt?: Date;
}
export declare const controllersRepo: {
    create(data: CreateControllerData): Promise<{
        id: string;
    }>;
    updateStatus(data: UpdateControllerStatusData): Promise<{
        id: string;
    }>;
    findById(id: string, stationId: string): Promise<{
        id: string;
    } | null>;
    findByStation(stationId: string): Promise<{
        id: string;
    }[]>;
    getAll(): Promise<any[]>;
    getOnlineCount(): Promise<number>;
    getOfflineCount(): Promise<number>;
};
export {};
//# sourceMappingURL=controllers.repo.d.ts.map