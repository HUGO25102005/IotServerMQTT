interface CreatePendingParams {
    reqId: string;
    stationId: string;
    controllerId: string;
    lockId: string;
    cmd: string;
    ts: number;
    timeoutMs: number;
}
export declare function createPending(c: CreatePendingParams): Promise<void>;
export declare function resolve(reqId: string, result: "ok" | "error" | "timeout", ts: number, errorMsg?: string): Promise<void>;
export {};
//# sourceMappingURL=commands.repo.d.ts.map