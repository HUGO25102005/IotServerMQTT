import { pool } from "../../infra/db";

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

export const controllersRepo = {
    async create(data: CreateControllerData) {
        const [result] = await pool.execute(
            `INSERT INTO controllers (id, station_id, fw, hw)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         station_id = VALUES(station_id),
         fw = VALUES(fw),
         hw = VALUES(hw)`,
            [data.id, data.stationId, data.fw || null, data.hw || null]
        );
        return result;
    },

    async updateStatus(data: UpdateControllerStatusData) {
        const [result] = await pool.execute(
            `UPDATE controllers 
       SET last_status = ?, last_seen_at = ?
       WHERE id = ?`,
            [data.status, data.lastSeenAt || new Date(), data.id]
        );
        return result;
    },

    async findById(id: string) {
        const [rows]: any = await pool.execute(
            `SELECT * FROM controllers WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    async findByStation(stationId: string) {
        const [rows] = await pool.execute(
            `SELECT * FROM controllers WHERE station_id = ?`,
            [stationId]
        );
        return rows;
    },

    async getAll() {
        const [rows] = await pool.execute(
            `SELECT c.*, s.name as station_name
       FROM controllers c
       LEFT JOIN stations s ON c.station_id = s.id
       ORDER BY c.station_id, c.id`
        );
        return rows;
    },

    async getOnlineCount() {
        const [rows]: any = await pool.execute(
            `SELECT COUNT(*) as count FROM controllers WHERE last_status = 'online'`
        );
        return rows[0].count;
    },

    async getOfflineCount() {
        const [rows]: any = await pool.execute(
            `SELECT COUNT(*) as count FROM controllers WHERE last_status = 'offline'`
        );
        return rows[0].count;
    }
};
