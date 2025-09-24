import { pool } from "../../infra/db";

interface CreateTelemetryData {
    stationId: string;
    controllerId: string;
    lockId: string;
    ts: number;
    state: 'locked' | 'unlocked';
    battery?: number;
    rssi?: number;
    fw?: string;
    seq?: number;
}

export const telemetryRepo = {
    async create(data: CreateTelemetryData) {
        const [result] = await pool.execute(
            `INSERT INTO telemetry (station_id, controller_id, lock_id, ts, state, battery, rssi, fw, seq)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.stationId,
                data.controllerId,
                data.lockId,
                data.ts,
                data.state,
                data.battery || null,
                data.rssi || null,
                data.fw || null,
                data.seq || null
            ]
        );
        return result;
    },

    async findByLock(lockId: string, limit = 100) {
        const [rows] = await pool.execute(
            `SELECT * FROM telemetry 
       WHERE lock_id = ? 
       ORDER BY ts DESC 
       LIMIT ?`,
            [lockId, limit]
        );
        return rows;
    },

    async findByController(controllerId: string, limit = 100) {
        const [rows] = await pool.execute(
            `SELECT * FROM telemetry 
       WHERE controller_id = ? 
       ORDER BY ts DESC 
       LIMIT ?`,
            [controllerId, limit]
        );
        return rows;
    },

    async findByStation(stationId: string, limit = 100) {
        const [rows] = await pool.execute(
            `SELECT * FROM telemetry 
       WHERE station_id = ? 
       ORDER BY ts DESC 
       LIMIT ?`,
            [stationId, limit]
        );
        return rows;
    },

    async getLatestByLock(lockId: string) {
        const [rows]: any = await pool.execute(
            `SELECT * FROM telemetry 
       WHERE lock_id = ? 
       ORDER BY ts DESC 
       LIMIT 1`,
            [lockId]
        );
        return rows[0] || null;
    },

    async getStatsByTimeRange(stationId: string, startTs: number, endTs: number) {
        const [rows]: any = await pool.execute(
            `SELECT 
         COUNT(*) as total_messages,
         COUNT(DISTINCT lock_id) as unique_locks,
         AVG(battery) as avg_battery,
         AVG(rssi) as avg_rssi
       FROM telemetry 
       WHERE station_id = ? AND ts BETWEEN ? AND ?`,
            [stationId, startTs, endTs]
        );
        return rows[0];
    },

    async getBatteryStats() {
        const [rows]: any = await pool.execute(
            `SELECT 
         COUNT(*) as total_locks,
         SUM(CASE WHEN last_battery < 20 THEN 1 ELSE 0 END) as low_battery_count,
         AVG(last_battery) as avg_battery
       FROM locks 
       WHERE last_battery IS NOT NULL`
        );
        return rows[0];
    }
};
