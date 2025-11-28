#!/bin/bash

# Script para simular un dispositivo IoT que responde a comandos
# Este script escucha comandos y envía respuestas automáticas (ACKs)

BROKER="test.mosquitto.org"
STATION_ID="station_1"
CONTROLLER_ID="ctrl_001"
LOCK_ID="lock_1"

echo "🤖 Simulador de Dispositivo IoT iniciado"
echo "📡 Broker: $BROKER"
echo "🔧 Station: $STATION_ID, Controller: $CONTROLLER_ID, Lock: $LOCK_ID"
echo ""
echo "👂 Escuchando comandos..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Suscribirse al topic de comandos y procesar cada mensaje
mosquitto_sub -h $BROKER \
  -t "cycloconnect/stations/$STATION_ID/controller/$CONTROLLER_ID/locks/$LOCK_ID/command/set" \
  -v | while read -r line; do
  
  # Extraer el topic y el payload
  topic=$(echo "$line" | cut -d' ' -f1)
  payload=$(echo "$line" | cut -d' ' -f2-)
  
  echo "📩 Comando recibido:"
  echo "   Topic: $topic"
  echo "   Payload: $payload"
  
  # Extraer reqId y cmd del payload JSON
  reqId=$(echo "$payload" | grep -o '"reqId":"[^"]*"' | cut -d'"' -f4)
  cmd=$(echo "$payload" | grep -o '"cmd":"[^"]*"' | cut -d'"' -f4)
  
  if [ -z "$reqId" ]; then
    echo "   ⚠️  No se encontró reqId en el payload"
    echo ""
    continue
  fi
  
  echo "   📋 ReqId: $reqId"
  echo "   🔧 Comando: $cmd"
  
  # Simular delay de procesamiento (500ms)
  sleep 0.5
  
  # Construir el topic de ACK
  ack_topic="cycloconnect/stations/$STATION_ID/controller/$CONTROLLER_ID/locks/$LOCK_ID/ack"
  
  # Construir el payload de respuesta
  ts=$(date +%s)000  # timestamp en milisegundos
  ack_payload=$(cat <<EOF
{
  "reqId": "$reqId",
  "status": "success",
  "action": "$cmd",
  "message": "Comando ejecutado correctamente",
  "ts": $ts
}
EOF
)
  
  # Enviar ACK
  echo "   ✅ Enviando ACK..."
  mosquitto_pub -h $BROKER -t "$ack_topic" -m "$ack_payload"
  
  echo "   📤 ACK enviado a: $ack_topic"
  echo "   📦 Payload: $ack_payload"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
done
