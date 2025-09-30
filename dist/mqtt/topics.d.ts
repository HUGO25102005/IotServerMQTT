export declare const SUBSCRIPTIONS: string[];
interface ParseTopicResult {
    stationId: string;
    deviceId: string;
    lockId?: string | undefined;
    section: string;
    subtype: string;
}
export declare function parseTopic(topic: string): ParseTopicResult;
export {};
//# sourceMappingURL=topics.d.ts.map