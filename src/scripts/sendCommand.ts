import mqtt from 'mqtt';
import { env } from '../config/env';
import { CommandHttpController } from '../http/controllers/CommandHttpController';
import { Request, Response } from 'express';

const STATION_ID = 'stn_001';
const CONTROLLER_ID = 'ctrl_001';
const LOCK_ID = 'lock_001';

async function runTest() {
    console.log('Starting verification test...');
    console.log(`Connecting to MQTT broker at ${env.MQTT_URL}...`);

    const client = mqtt.connect(env.MQTT_URL, {
        username: env.MQTT_USERNAME,
        password: env.MQTT_PASSWORD
    });

    client.on('connect', () => {
        console.log('Test client connected to MQTT');

        // Subscribe to command topic to verify server publishes it
        const commandTopic = `cycloconect/stations/${STATION_ID}/controller/${CONTROLLER_ID}/locks/${LOCK_ID}/command/set`;
        client.subscribe(commandTopic, (err) => {
            if (err) {
                console.error('Subscribe error:', err);
                process.exit(1);
            }
            console.log(`Subscribed to ${commandTopic}`);

            // Trigger the controller method after subscription
            setTimeout(triggerController, 1000);
        });
    });

    client.on('message', async (topic, payload) => {
        console.log(`\n[MQTT] Received message on ${topic}:`, payload.toString());

        try {
            const data = JSON.parse(payload.toString());

            if (topic.includes('/command/set')) {
                console.log('[TEST] Received command from server. Simulating ACK...');

                // Simulate ACK from device
                // Try standard topic to ensure it matches subscription
                const ackTopic = `stations/${STATION_ID}/controller/${CONTROLLER_ID}/locks/${LOCK_ID}/ack`;
                const ackPayload = JSON.stringify({
                    reqId: data.reqId,
                    status: 'success',
                    ts: Date.now()
                });

                client.publish(ackTopic, ackPayload);
                console.log(`[TEST] Published ACK to ${ackTopic}`);
                console.log('[INFO] Ensure the main server is running to process this ACK and update the DB.');
            }
        } catch (e) {
            console.error('Error processing message:', e);
        }
    });

    client.on('error', (err) => {
        console.error('MQTT Client Error:', err);
        process.exit(1);
    });
}

async function triggerController() {
    console.log('\n[TEST] Triggering CommandHttpController.publish...');

    // Mock Express Request
    const mockReq = {
        params: {
            lockId: LOCK_ID
        },
        body: {
            stationId: STATION_ID,
            controllerId: CONTROLLER_ID,
            action: 'open',
            requestedBy: 'tester'
        }
    } as unknown as Request;

    // Mock Express Response
    const mockRes = {
        status: function (code: number) {
            console.log(`[HTTP Mock] Status set to ${code}`);
            return this;
        },
        json: function (data: any) {
            console.log('[HTTP Mock] JSON response:', data);
            if (data.commandId) {
                // If we got a commandId, start checking status
                setTimeout(() => checkStatus(data.commandId), 2000);
            } else if (data.error) {
                console.error('[TEST] Controller returned error:', data.error);
                process.exit(1);
            }
            return this;
        }
    } as unknown as Response;

    // Call the controller method
    await CommandHttpController.publish(mockReq, mockRes);
}

async function checkStatus(commandId: string) {
    try {
        const statusUrl = `http://localhost:${env.PORT}/api/commands/status/${commandId}`;
        console.log(`\n[HTTP] Checking status at ${statusUrl}...`);

        const res = await fetch(statusUrl);
        if (!res.ok) {
            console.log(`[HTTP] Status check failed with ${res.status}. Server might not be running.`);
            return;
        }

        const data = await res.json() as any;
        console.log('[HTTP] Status Response:', data);

        if (data.status === 'success' || data.status === 'ok') {
            console.log(`\n✅ TEST PASSED: Command status is "${data.status}"`);
            process.exit(0);
        } else {
            console.log(`\n⚠️ Command status is "${data.status}". Waiting...`);
            // Retry a few times?
            setTimeout(() => checkStatus(commandId), 2000);
        }
    } catch (error) {
        console.error('[HTTP] Status Check Error (is server running?):', error);
        // Don't exit immediately, maybe just retry or warn
        process.exit(1);
    }
}

runTest();
