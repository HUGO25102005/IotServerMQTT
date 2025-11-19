interface ParsedTopic {
    stationId: string;
    controllerId: string;
    lockId?: string;
    action: string; // telemetry, event, state, command, status, config
    hasLocks: boolean;
}

class ObjectMqttModel {
    private parsedTopicCache: ParsedTopic | null = null;

    constructor(
        public topic: string,
        public payload: any,
        public messageStr: string = payload.toString(),
        public timestamp: number = Date.now(),
        public timestampStr: string = new Date().toISOString()
    ) {
        this.topic = topic;
        this.timestamp = Date.now();
        this.timestampStr = new Date().toISOString();
    }

    /**
     * Parsea el topic y extrae sus componentes
     * Formato: stations/{stationId}/controller/{controllerId}/locks/{lockId}/{action}
     * O: stations/{stationId}/controller/{controllerId}/{action} (para status/config)
     */
    public parseTopic(): ParsedTopic {
        if (this.parsedTopicCache) {
            return this.parsedTopicCache;
        }

        const parts = this.topic.split("/");

        // stations/{stationId}/controller/{controllerId}/locks/{lockId}/{action}
        // stations/{stationId}/controller/{controllerId}/{action}
        const stationId = parts[1] ?? "";
        const controllerId = parts[3] ?? "";
        const section = parts[4] ?? ""; // 'locks' | 'status' | 'config'
        const action = parts[parts.length - 1] ?? ""; // telemetry|event|state|command|status|config

        const hasLocks = section === "locks";
        const lockId = hasLocks ? parts[5] ?? "" : "";

        this.parsedTopicCache = {
            stationId,
            controllerId,
            lockId,
            action,
            hasLocks
        };

        return this.parsedTopicCache;
    }

    /**
     * Retorna la acción del topic (último segmento)
     * Útil para routing en main.ts
     */
    public getAction(): string {
        return this.parseTopic().action;
    }

    /**
     * Retorna la ruta completa del topic para guardar en Firestore
     * Esta será la ruta que se usará como referencia en la base de datos
     */
    public getTopicToSend(): string {
        return this.topic;
    }

    /**
     * Obtiene el stationId parseado
     */
    public getStationId(): string {
        return this.parseTopic().stationId;
    }

    /**
     * Obtiene el controllerId parseado
     */
    public getControllerId(): string {
        return this.parseTopic().controllerId;
    }

    /**
     * Obtiene el lockId parseado (si existe)
     */
    public getLockId(): string | undefined {
        return this.parseTopic().lockId;
    }

    /**
     * Verifica si el topic tiene locks
     */
    public hasLocks(): boolean {
        return this.parseTopic().hasLocks;
    }
}

export default ObjectMqttModel;
export type { ParsedTopic };