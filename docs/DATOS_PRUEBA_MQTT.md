# 📡 Datos de Prueba MQTT para la API

Este documento contiene ejemplos de comandos `mosquitto_pub` y payloads JSON para probar la API mediante MQTT.

---

## 🔧 **Instalación de Mosquitto**

### **macOS:**
```bash
brew install mosquitto
```

### **Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install mosquitto-clients
```

### **Windows:**
Descargar desde: https://mosquitto.org/download/

---

## 📋 **Configuración de Conexión**

Antes de enviar mensajes, configura las variables de entorno o edita el archivo `.env`:

```bash
MQTT_URL=mqtt://localhost:1883
# O para broker remoto:
MQTT_URL=mqtt://test.mosquitto.org:1883
MQTT_USERNAME=  # Opcional
MQTT_PASSWORD=  # Opcional
```

---

## 🧪 **1. CONFIG - Configuración Inicial del Controlador**

**Descripción:** Define la estructura de la estación, controlador y cerraduras. Debe enviarse primero.

### **Topic:**
```
stations/{stationId}/controller/{controllerId}/config
```

### **Ejemplo 1: Estación Madrid con 3 cerraduras**
```bash
mosquitto_pub -h localhost -p 1883 -t "stations/madrid/controller/ctrl_001/config" \
  -m '{
    "fw": "1.2.3",
    "hw": "2.1",
    "locks": [
      {"lockId": "lock_001", "position": "A1"},
      {"lockId": "lock_002", "position": "A2"},
      {"lockId": "lock_003", "position": "B1"}
    ]
  }' -q 1 -r
```

### **Ejemplo 2: Estación Barcelona con 2 cerraduras**
```bash
mosquitto_pub -h localhost -p 1883 -t "stations/barcelona/controller/ctrl_002/config" \
  -m '{
    "fw": "1.3.0",
    "hw": "2.2",
    "locks": [
      {"lockId": "lock_101", "position": "C1"},
      {"lockId": "lock_102", "position": "C2"}
    ]
  }' -q 1 -r
```

**Nota:** El flag `-r` (retain) mantiene el mensaje para nuevos suscriptores.

---

## 📊 **2. TELEMETRY - Datos de Telemetría de Cerradura**

**Descripción:** Envía datos periódicos de estado, batería, señal, etc.

### **Topic:**
```
stations/{stationId}/controller/{controllerId}/locks/{lockId}/telemetry
```

### **Ejemplo 1: Cerradura bloqueada con batería alta**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_001/telemetry" \
  -m '{
    "ts": 1704067200000,
    "state": "locked",
    "battery": 85,
    "rssi": -45,
    "fw": "1.2.3",
    "seq": 1001
  }' -q 1
```

### **Ejemplo 2: Cerradura desbloqueada con batería baja**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_001/telemetry" \
  -m '{
    "ts": 1704067260000,
    "state": "unlocked",
    "battery": 15,
    "rssi": -75,
    "fw": "1.2.3",
    "seq": 1002
  }' -q 1
```

### **Ejemplo 3: Telemetría mínima (solo estado)**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_002/telemetry" \
  -m '{
    "ts": 1704067320000,
    "state": "locked"
  }' -q 1
```

### **Ejemplo 4: Con secuencia para deduplicación**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_003/telemetry" \
  -m '{
    "ts": 1704067380000,
    "state": "unlocked",
    "battery": 92,
    "rssi": -42,
    "seq": 2001
  }' -q 1
```

**Campos requeridos:**
- `ts`: Timestamp en milisegundos (number)
- `state`: "locked" o "unlocked" (string)

**Campos opcionales:**
- `battery`: Nivel de batería 0-100 (number)
- `rssi`: Intensidad de señal en dBm (number)
- `fw`: Versión de firmware (string)
- `seq`: Número de secuencia para deduplicación (number)

---

## 🔄 **3. STATE - Estado de Comando (ACK)**

**Descripción:** Respuesta del dispositivo cuando recibe un comando de lock/unlock.

### **Topic:**
```
stations/{stationId}/controller/{controllerId}/locks/{lockId}/state
```

### **Ejemplo 1: Comando exitoso (OK)**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_001/state" \
  -m '{
    "ts": 1704067500000,
    "reqId": "abc12345",
    "result": "ok",
    "state": "locked"
  }' -q 1
```

### **Ejemplo 2: Comando con error**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_001/state" \
  -m '{
    "ts": 1704067560000,
    "reqId": "def67890",
    "result": "error",
    "error": "Motor jammed",
    "state": "locked"
  }' -q 1
```

### **Ejemplo 3: ACK sin cambio de estado**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_002/state" \
  -m '{
    "ts": 1704067620000,
    "reqId": "ghi11111",
    "result": "ok"
  }' -q 1
```

**Campos requeridos:**
- `ts`: Timestamp en milisegundos (number)
- `reqId`: ID de la solicitud del comando (string)
- `result`: "ok" o "error" (string)

**Campos opcionales:**
- `state`: "locked" o "unlocked" (string) - actualiza el snapshot si está presente
- `error`: Mensaje de error si result es "error" (string)

---

## 📡 **4. STATUS - Estado del Controlador**

**Descripción:** Indica si el controlador está online u offline.

### **Topic:**
```
stations/{stationId}/controller/{controllerId}/status
```

### **Ejemplo 1: Controlador online**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/status" \
  -m '{
    "status": "online"
  }' -q 1
```

### **Ejemplo 2: Controlador offline**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/status" \
  -m '{
    "status": "offline"
  }' -q 1
```

### **Ejemplo 3: Estado desconocido (se interpreta como "unknown")**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/status" \
  -m '{
    "status": "maintenance"
  }' -q 1
```

**Campos:**
- `status`: "online", "offline" o cualquier otro valor (se interpreta como "unknown")

---

## 🚨 **5. EVENT - Eventos del Sistema**

**Descripción:** Eventos del sistema como errores, advertencias o información.

### **Topic:**
```
stations/{stationId}/controller/{controllerId}/locks/{lockId}/event
```

### **Ejemplo 1: Evento informativo**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_001/event" \
  -m '{
    "ts": 1704067800000,
    "event": "lock_activated",
    "details": {
      "reason": "user_command",
      "user_id": "user_123",
      "method": "rfid"
    }
  }' -q 1
```

### **Ejemplo 2: Advertencia - Batería baja**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_001/event" \
  -m '{
    "ts": 1704067860000,
    "event": "low_battery",
    "details": {
      "battery_level": 15,
      "threshold": 20
    }
  }' -q 1
```

### **Ejemplo 3: Advertencia - Señal débil**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_001/event" \
  -m '{
    "ts": 1704067920000,
    "event": "signal_weak",
    "details": {
      "rssi": -85,
      "threshold": -80
    }
  }' -q 1
```

### **Ejemplo 4: Error - Motor**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_001/event" \
  -m '{
    "ts": 1704067980000,
    "event": "error_motor",
    "details": {
      "error_code": "MOTOR_001",
      "description": "Motor jammed during operation"
    }
  }' -q 1
```

### **Ejemplo 5: Error - Sensor**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_002/event" \
  -m '{
    "ts": 1704068040000,
    "event": "error_sensor",
    "details": {
      "sensor_id": "hall_001",
      "reading": null
    }
  }' -q 1
```

### **Ejemplo 6: Advertencia - Manipulación detectada**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_001/event" \
  -m '{
    "ts": 1704068100000,
    "event": "tamper_detected",
    "details": {
      "sensor": "tamper_switch",
      "location": "front_panel"
    }
  }' -q 1
```

### **Ejemplo 7: Evento sin detalles**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_003/event" \
  -m '{
    "ts": 1704068160000,
    "event": "maintenance_required"
  }' -q 1
```

**Campos requeridos:**
- `ts`: Timestamp en milisegundos (number)
- `event`: Nombre del evento (string)

**Campos opcionales:**
- `details`: Objeto con información adicional del evento (object)

**Clasificación automática de severidad:**
- **error**: `error_motor`, `error_sensor`, `error_battery`, `communication_error`, `hardware_failure`
- **warn**: `tamper_detected`, `forced_open`, `low_battery`, `signal_weak`, `maintenance_required`
- **info**: Cualquier otro evento

---

## 🎯 **Secuencia Completa de Prueba**

### **Paso 1: Configurar estación y controlador**
```bash
mosquitto_pub -h localhost -p 1883 -t "stations/madrid/controller/ctrl_001/config" \
  -m '{"fw":"1.2.3","hw":"2.1","locks":[{"lockId":"lock_001","position":"A1"},{"lockId":"lock_002","position":"A2"}]}' \
  -q 1 -r
```

### **Paso 2: Marcar controlador como online**
```bash
mosquitto_pub -h localhost -p 1883 -t "stations/madrid/controller/ctrl_001/status" \
  -m '{"status":"online"}' -q 1
```

### **Paso 3: Enviar telemetría de cerradura 1**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_001/telemetry" \
  -m '{"ts":1704067200000,"state":"locked","battery":85,"rssi":-45,"seq":1001}' -q 1
```

### **Paso 4: Enviar telemetría de cerradura 2**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_002/telemetry" \
  -m '{"ts":1704067260000,"state":"unlocked","battery":92,"rssi":-42,"seq":1002}' -q 1
```

### **Paso 5: Enviar evento informativo**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_001/event" \
  -m '{"ts":1704067320000,"event":"lock_activated","details":{"reason":"user_command"}}' -q 1
```

### **Paso 6: Simular respuesta a comando**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "stations/madrid/controller/ctrl_001/locks/lock_001/state" \
  -m '{"ts":1704067380000,"reqId":"abc12345","result":"ok","state":"locked"}' -q 1
```

---

## 📝 **Script de Prueba Completo (Bash)**

Crea un archivo `test_mqtt.sh` con el siguiente contenido:

```bash
#!/bin/bash

MQTT_HOST="localhost"
MQTT_PORT="1883"
STATION_ID="madrid"
CONTROLLER_ID="ctrl_001"
LOCK_ID="lock_001"

echo "🚀 Iniciando pruebas MQTT..."

# 1. Config
echo "📋 Enviando configuración..."
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT \
  -t "stations/$STATION_ID/controller/$CONTROLLER_ID/config" \
  -m '{"fw":"1.2.3","hw":"2.1","locks":[{"lockId":"lock_001","position":"A1"},{"lockId":"lock_002","position":"A2"}]}' \
  -q 1 -r

sleep 1

# 2. Status
echo "📡 Enviando status..."
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT \
  -t "stations/$STATION_ID/controller/$CONTROLLER_ID/status" \
  -m '{"status":"online"}' -q 1

sleep 1

# 3. Telemetry
echo "📊 Enviando telemetría..."
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT \
  -t "stations/$STATION_ID/controller/$CONTROLLER_ID/locks/$LOCK_ID/telemetry" \
  -m "{\"ts\":$(date +%s)000,\"state\":\"locked\",\"battery\":85,\"rssi\":-45,\"seq\":1001}" -q 1

sleep 1

# 4. Event
echo "🚨 Enviando evento..."
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT \
  -t "stations/$STATION_ID/controller/$CONTROLLER_ID/locks/$LOCK_ID/event" \
  -m "{\"ts\":$(date +%s)000,\"event\":\"lock_activated\",\"details\":{\"reason\":\"user_command\"}}" -q 1

sleep 1

# 5. State (ACK)
echo "🔄 Enviando estado (ACK)..."
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT \
  -t "stations/$STATION_ID/controller/$CONTROLLER_ID/locks/$LOCK_ID/state" \
  -m "{\"ts\":$(date +%s)000,\"reqId\":\"test123\",\"result\":\"ok\",\"state\":\"locked\"}" -q 1

echo "✅ Pruebas completadas!"
```

**Ejecutar:**
```bash
chmod +x test_mqtt.sh
./test_mqtt.sh
```

---

## 🔍 **Verificar Datos Recibidos**

### **1. Ver logs del servidor:**
```bash
# Si usas npm run dev, verás los logs en la consola
```

### **2. Consultar API REST:**

```bash
# Ver todas las cerraduras
curl http://localhost:3000/api/locks

# Ver una cerradura específica
curl http://localhost:3000/api/locks/lock_001

# Ver eventos de una cerradura
curl http://localhost:3000/api/locks/lock_001/events

# Ver estado de un comando
curl http://localhost:3000/api/locks/lock_001/status/test123
```

### **3. Verificar en Firestore:**

Accede a la consola de Firebase y verifica las colecciones:
- `stations/{stationId}/controllers/{controllerId}/locks/{lockId}`
- `stations/{stationId}/controllers/{controllerId}/locks/{lockId}/telemetry`
- `stations/{stationId}/controllers/{controllerId}/locks/{lockId}/events`
- `stations/{stationId}/controllers/{controllerId}/locks/{lockId}/commands`

---

## ⚠️ **Notas Importantes**

1. **Timestamps:** Usa milisegundos desde epoch (ej: `Date.now()` en JavaScript)
2. **Secuencias:** El campo `seq` se usa para deduplicación. Debe ser incremental.
3. **QoS:** Se recomienda usar QoS 1 para garantizar entrega.
4. **Retain:** Solo usar `-r` en mensajes de configuración.
5. **Topics:** Respeta exactamente la estructura de topics mostrada.
6. **JSON:** Asegúrate de que el JSON sea válido (sin comillas simples, sin trailing commas).

---

## 🐛 **Solución de Problemas**

### **El servidor no recibe mensajes:**
- Verifica que el servidor esté corriendo: `npm run dev`
- Verifica la URL del broker en `.env`
- Verifica que el topic coincida exactamente con los patrones de suscripción

### **Errores de validación:**
- Verifica que los campos requeridos estén presentes
- Verifica que los tipos de datos sean correctos (number, string, etc.)
- Verifica que `state` sea exactamente "locked" o "unlocked"

### **Datos no aparecen en Firestore:**
- Verifica las credenciales de Firebase en `.env`
- Verifica los logs del servidor para errores
- Verifica que la estructura de colecciones sea correcta

---

## 📚 **Referencias**

- Documentación de Mosquitto: https://mosquitto.org/man/mosquitto_pub-1.html
- Estructura de Firestore: Ver `docs/FIRESTORE_COLLECTIONS.md`
- Topics MQTT: Ver `docs/TOPICS_MQTT_PRUEBAS.md`

