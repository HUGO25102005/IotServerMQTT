import mqtt from 'mqtt';
import { env } from '../config/env';
import { CommandsController } from '../mqtt/classes';
// import { CommandsController } from '../mqtt/classes';

const STATION_ID = 'stn_001';
const CONTROLLER_ID = 'ctrl_001';
const LOCK_ID = 'lock_001';
// const API_URL = `http://localhost:${env.PORT}/api/commands/${LOCK_ID}`;

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

            // Send HTTP Command after subscription
            setTimeout(sendCommand, 1000);
        });
    });

    client.on('message', async (topic, payload) => {
        console.log(`\n[MQTT] Received message on ${topic}:`, payload.toString());

        try {
            const data = JSON.parse(payload.toString());

            if (topic.includes('/command/set')) {
                console.log('[TEST] Received command from server. Simulating ACK...');

                // Simulate ACK from device
                const ackTopic = `cycloconnect/stations/${STATION_ID}/controller/${CONTROLLER_ID}/locks/${LOCK_ID}/ack`;
                const ackPayload = JSON.stringify({
                    reqId: data.reqId,
                    status: 'success',
                    ts: Date.now()
                });

                client.publish(ackTopic, ackPayload);
                console.log(`[TEST] Published ACK to ${ackTopic}`);

                // Check status after a short delay to allow server to process ACK
                setTimeout(() => checkStatus(data.reqId), 2000);
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

async function sendCommand() {
    // try {
    //     console.log(`\n[HTTP] Sending POST request to ${API_URL}...`);
    //     const res = await fetch(API_URL, {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({
    //             stationId: STATION_ID,
    //             controllerId: CONTROLLER_ID,
    //             action: 'open',
    //             requestedBy: 'tester'
    //         })
    //     });

    //     if (!res.ok) {
    //         throw new Error(`HTTP status ${res.status}: ${res.statusText}`);
    //     }

    //     const data = await res.json();
    //     console.log('[HTTP] Response:', data);
    // } catch (error) {
    //     console.error('[HTTP] Error:', error);
    //     process.exit(1);
    // }
    const commandController = new CommandsController();
    commandController.sendCommand({
        stationId: STATION_ID,
        controllerId: CONTROLLER_ID,
        lockId: LOCK_ID,
        cmd: 'lock',
        timeoutMs: 5000
    });
}

async function checkStatus(commandId: string) {
    try {
        const statusUrl = `http://localhost:${env.PORT}/api/commands/status/${commandId}`;
        console.log(`\n[HTTP] Checking status at ${statusUrl}...`);

        const res = await fetch(statusUrl);
        const data = await res.json() as any;
        console.log('[HTTP] Status Response:', data);

        if (data.status === 'success') {
            console.log('\n✅ TEST PASSED: Command status is "success"');
            process.exit(0);
        } else {
            console.log(`\n❌ TEST FAILED: Command status is "${data.status}" (expected "success")`);
            process.exit(1);
        }
    } catch (error) {
        console.error('[HTTP] Status Check Error:', error);
        process.exit(1);
    }
}

runTest();
