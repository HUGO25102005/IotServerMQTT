import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { mqttClient } from '../../infra/mqtt';
import { logger } from '../../config/logger';
import { CommandsService } from '../../domain/services';

/**
 * HTTP controller handling command publishing via MQTT and status queries.
 * Endpoints:
 *   POST /api/commands/:lockId   -> publish command
 *   GET  /api/commands/status/:commandId -> get status
 */
export class CommandHttpController {
    /**
     * Publish a lock command.
     * Expected body: { stationId, controllerId, action: 'open' | 'close', requestedBy }
     */
    // const mockReq = {
    //         params: {
    //             lockId: LOCK_ID
    //         },
    //         body: {
    //             stationId: STATION_ID,
    //             controllerId: CONTROLLER_ID,
    //             action: 'open',
    //             requestedBy: 'tester'
    //         }
    //     } as unknown as Request;
    
    //     // Mock Express Response
    //     const mockRes = {
    //         status: function (code: number) {
    //             console.log(`[HTTP Mock] Status set to ${code}`);
    //             return this;
    //         },
    //         json: function (data: any) {
    //             console.log('[HTTP Mock] JSON response:', data);
    //             if (data.commandId) {
    //                 // If we got a commandId, start checking status
    //                 setTimeout(() => checkStatus(data.commandId), 2000);
    //             } else if (data.error) {
    //                 console.error('[TEST] Controller returned error:', data.error);
    //                 process.exit(1);
    //             }
    //             return this;
    //         }
    //     } as unknown as Response;
    
    static async publish(req: Request, res: Response) {
        try {
            const { lockId } = req.params;
            const { stationId, controllerId, action, requestedBy } = req.body;

            // Basic validation
            if (!stationId || !controllerId || !lockId || !action) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            if (!['open', 'close'].includes(action)) {
                return res.status(400).json({ error: "action must be 'open' or 'close'" });
            }

            const commandId = uuidv4();
            const ts = Date.now();
            const topic = `stations/${stationId}/controller/${controllerId}/locks/${lockId}/command`;
            const payload = JSON.stringify({
                command: 'lock',
                action,
                requestedBy: requestedBy || 'unknown',
                timestamp: ts,
                commandId,
            });

            // Publish via MQTT
            await new Promise<void>((resolve, reject) => {
                mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // Record pending command in DB for later status tracking
            const service = new CommandsService({
                stationId,
                controllerId,
                lockId,
                action: 'command',
                hasLocks: true,
            });

            // No await here to avoid blocking response, but catch errors
            service.createPending({
                reqId: commandId,
                ts,
                cmd: action === 'open' ? 'lock' : 'unlock',
                timeoutMs: 5000,
            }).catch((e) => logger.error({ e }, 'Failed to create pending command'));

            return res.status(202).json({
                status: 'sent',
                message: 'Command published to MQTT',
                commandId,
            });
        } catch (error) {
            logger.error({ error }, 'publish command failed');
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Retrieve command status.
     */
    static async getStatus(req: Request, res: Response) {
        try {
            const { commandId } = req.params;
            // Reuse existing logic from http/routes.ts (GET /commands/:reqId)
            const { db } = await import('../../infra/db');
            const doc = await db.collection('commands_index').doc(commandId).get();
            if (!doc.exists) {
                return res.status(404).json({ error: 'Command not found' });
            }
            const data = doc.data()!;
            return res.json({
                commandId,
                status: data['status'] || 'sent',
                ...data,
            });
        } catch (error) {
            logger.error({ error }, 'get command status failed');
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
