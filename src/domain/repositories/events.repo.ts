import { pool } from "../../infra/db";

interface CreateEventData {
    stationId: string;
    controllerId: string;
    lockId: string;
    ts: number;
    event: string;
    detailsJson: any;
    severity: 'info' | 'warn' | 'error';
}

export const eventsRepo = {
    async create(data: CreateEventData) {
        const [result] = await pool.execute(
            `INSERT INTO events (station_id, controller_id, lock_id, ts, event, details_json, severity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                data.stationId,
                data.controllerId,
                data.lockId,
                data.ts,
                data.event,
                JSON.stringify(data.detailsJson),
                data.severity
            ]
        );
        return result;
    },

    async findByLock(lockId: string, limit = 100) {
        const [rows] = await pool.execute(
            `SELECT * FROM events 
       WHERE lock_id = ? 
       ORDER BY ts DESC 
       LIMIT ?`,
            [lockId, limit]
        );
        return rows;
    },

    async findByStation(stationId: string, limit = 100) {
        const [rows] = await pool.execute(
            `SELECT * FROM events 
       WHERE station_id = ? 
       ORDER BY ts DESC 
       LIMIT ?`,
            [stationId, limit]
        );
        return rows;
    },

    async findBySeverity(severity: 'info' | 'warn' | 'error', limit = 100) {
        const [rows] = await pool.execute(
            `SELECT * FROM events 
       WHERE severity = ? 
       ORDER BY ts DESC 
       LIMIT ?`,
            [severity, limit]
        );
        return rows;
    }
};
