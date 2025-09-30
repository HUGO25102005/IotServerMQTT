export declare function sendCommand(p: {
    stationId: string;
    controllerId: string;
    lockId: string;
    cmd: "lock" | "unlock" | "reboot";
    timeoutMs: number;
}): Promise<{
    reqId: string;
    acceptedAt: number;
}>;
//# sourceMappingURL=command.services.d.ts.map