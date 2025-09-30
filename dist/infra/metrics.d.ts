import client from "prom-client";
export declare const register: client.Registry<"text/plain; version=0.0.4; charset=utf-8">;
export declare const mqttMessagesTotal: client.Counter<"type">;
export declare const commandLatency: client.Summary<"cmd">;
//# sourceMappingURL=metrics.d.ts.map