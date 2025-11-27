#!/bin/bash

echo "📡 Enviando mensajes MQTT de prueba al servidor..."
echo "🌐 Broker: test.mosquitto.org:1883"
echo ""

# 1. Telemetría
echo "1️⃣  Enviando telemetría..."
mosquitto_pub -h test.mosquitto.org -t "cycloconnect/stations/station_1/controller/ctrl_001/locks/lock_1/telemetry" \
  -m '{"battery":85,"fw":"1.2.3","rssi":-45,"seq":1001,"state":"locked","ts":1732719310000}'
sleep 0.5

# 2. Evento de desbloqueo exitoso
echo "2️⃣  Enviando evento de desbloqueo..."
mosquitto_pub -h test.mosquitto.org -t "cycloconnect/stations/station_1/controller/ctrl_001/locks/lock_1/event" \
  -m '{"event_type":"unlock_success","event_id":"evt_123456","user_id":"user_789","method":"rfid","description":"Lock desbloqueado correctamente"}'
sleep 0.5

# 3. Estado bloqueado
echo "3️⃣  Enviando estado bloqueado..."
mosquitto_pub -h test.mosquitto.org -t "cycloconnect/stations/station_1/controller/ctrl_001/locks/lock_1/state" \
  -m '{"state":"locked","reqId":"req_abc123","locked":true,"reason":"manual_lock"}'
sleep 0.5

# 4. Estado desbloqueado
echo "4️⃣  Enviando estado desbloqueado..."
mosquitto_pub -h test.mosquitto.org -t "cycloconnect/stations/station_1/controller/ctrl_001/locks/lock_1/state" \
  -m '{"state":"unlocked","reqId":"req_abc124","locked":false,"reason":"command_unlock"}'
sleep 0.5

# 5. Status del controlador
echo "5️⃣  Enviando status del controlador..."
mosquitto_pub -h test.mosquitto.org -t "cycloconnect/stations/station_1/controller/ctrl_001/status" \
  -m '{"online":true,"last_seen":"2025-11-27T10:30:00Z","cpu_usage":45,"memory_usage":62,"total_locks":12,"active_locks":10,"firmware_version":"2.1.0"}'
sleep 0.5

# 6. Configuración
echo "6️⃣  Enviando configuración..."
mosquitto_pub -h test.mosquitto.org -t "cycloconnect/stations/station_1/controller/ctrl_001/config" \
  -m '{"auto_lock_timeout":300,"telemetry_interval":60,"heartbeat_interval":30,"max_retry_attempts":3,"debug_mode":false}'
sleep 0.5

# 7. ACK de comando exitoso
echo "7️⃣  Enviando ACK de comando..."
mosquitto_pub -h test.mosquitto.org -t "cycloconnect/stations/station_1/controller/ctrl_001/locks/lock_1/ack" \
  -m '{"reqId":"req_abc123","status":"success","action":"unlock","message":"Comando ejecutado correctamente"}'

echo ""
echo "✅ Todos los mensajes de prueba enviados correctamente"
echo "📋 Revisa los logs del servidor para ver cómo fueron procesados"

