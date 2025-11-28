#!/bin/bash

# Script simple para probar el flujo completo
BROKER="test.mosquitto.org"

echo "🔧 Prueba de flujo de comandos MQTT"
echo ""
echo "1️⃣ Iniciando listener para comandos..."

# Función para escuchar y responder
(
  mosquitto_sub -h $BROKER \
    -t "cycloconnect/stations/+/controller/+/locks/+/command/set" \
    -F "%t %p" | while IFS= read -r line; do
    
    topic=$(echo "$line" | awk '{print $1}')
    payload=$(echo "$line" | cut -d' ' -f2-)
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📩 COMANDO RECIBIDO"
    echo "Topic: $topic"
    echo "Payload: $payload"
    
    # Extraer parametros del topic
    # cycloconnect/stations/station_1/controller/ctrl_001/locks/lock_1/command/set
    station=$(echo "$topic" | cut -d'/' -f3)
    controller=$(echo "$topic" | cut -d'/' -f5)
    lock=$(echo "$topic" | cut -d'/' -f7)
    
    # Extraer reqId
    reqId=$(echo "$payload" | grep -o '"reqId":"[^"]*"' | cut -d'"' -f4)
    cmd=$(echo "$payload" | grep -o '"cmd":"[^"]*"' | cut -d'"' -f4)
    
    echo "Station: $station"
    echo "Controller: $controller"
    echo "Lock: $lock"
    echo "ReqId: $reqId"
    echo "Command: $cmd"
    
    # Esperar 500ms
    sleep 0.5
    
    # Enviar ACK
    ack_topic="cycloconnect/stations/$station/controller/$controller/locks/$lock/ack"
    ts=$(date +%s)000
    
    ack_payload="{\"reqId\":\"$reqId\",\"status\":\"success\",\"action\":\"$cmd\",\"message\":\"OK\",\"ts\":$ts}"
    
    echo ""
    echo "📤 ENVIANDO ACK"
    echo "Topic: $ack_topic"
    echo "Payload: $ack_payload"
    
    mosquitto_pub -h $BROKER -t "$ack_topic" -m "$ack_payload"
    
    echo "✅ ACK enviado"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
  done
) &

listener_pid=$!
echo "✅ Listener iniciado (PID: $listener_pid)"
echo ""
echo "2️⃣ Esperando 3 segundos para que se suscriba..."
sleep 3

echo ""
echo "3️⃣ Enviando comando HTTP..."
response=$(curl -X POST http://localhost:3000/api/locks/lock_1/unlock \
  -H "Content-Type: application/json" \
  -d '{"stationId":"station_1","controllerId":"ctrl_001","timeoutMs":10000}' \
  -s)

echo "Respuesta HTTP: $response"
reqId=$(echo "$response" | grep -o '"reqId":"[^"]*"' | cut -d'"' -f4)
echo "ReqId del comando: $reqId"

echo ""
echo "4️⃣ Esperando 5 segundos para ver el flujo completo..."
sleep 5

echo ""
echo "5️⃣ Consultando estado del comando..."
status_response=$(curl -s "http://localhost:3000/api/locks/lock_1/status/$reqId")
echo "Estado: $status_response"

echo ""
echo "🛑 Deteniendo listener..."
kill $listener_pid 2>/dev/null

echo ""
echo "✅ Prueba completada"
