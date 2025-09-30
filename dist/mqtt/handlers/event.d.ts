interface EventData {
    ts: number;
    event: string;
    details?: any;
}
interface EventContext {
    stationId: string;
    deviceId: string;
    lockId: string;
    data: EventData;
}
export declare function handle({ stationId, deviceId, lockId, data }: EventContext): Promise<void>;
export {};
//# sourceMappingURL=event.d.ts.map