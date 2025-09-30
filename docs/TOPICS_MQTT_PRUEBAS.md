# 📡 Topics MQTT para Pruebas - Interfaz Gráfica

## 🔧 **Configuración de Conexión MQTT**

### **Para MQTT Explorer, MQTT.fx, o similar:**

```
Broker: test.mosquitto.org
Port: 1883
Protocol: MQTT v3.1.1 o v5.0
Client ID: mqtt-explorer-1570e1be (o cualquier ID único)
Username: (vacío)
Password: (vacío)
```

---

## 📋 **Topics que Escucha tu Servidor**

Tu servidor está suscrito a estos **wildcard patterns**:


```
stations/+/controller/+/locks/+/telemetry
stations/+/controller/+/locks/+/event
stations/+/controller/+/locks/+/state
stations/+/controller/+/status
stations/+/controller/+/config
```

**Nota:** El `+` es un wildcard que acepta cualquier valor en esa posición.

---

## 🧪 **Ejemplos de Topics para Pruebas**

### **1. Telemetría de Cerradura**

```
Topic: stations/madrid/controller/ctrl_001/locks/lock_001/telemetry
```

**Payload de ejemplo:**

```json
{
  "state": "locked",
  "battery": 85,
  "rssi": -45,
  "timestamp": 1640995200000,
  "seq": 12345
}
```

### **2. Evento de Cerradura**

```
Topic: stations/madrid/controller/ctrl_001/locks/lock_001/event
```

**Payload de ejemplo:**

```json
{
  "event": "lock_activated",
  "details": {
    "reason": "user_command",
    "user_id": "user_123"
  },
  "timestamp": 1640995200000
}
```

### **3. Estado de Cerradura**

```
Topic: stations/madrid/controller/ctrl_001/locks/lock_001/state
```

**Payload de ejemplo:**

```json
{
  "state": "unlocked",
  "battery": 85,
  "rssi": -45,
  "last_update": 1640995200000
}
```

### **4. Estado del Controlador**

```
Topic: stations/madrid/controller/ctrl_001/status
```

**Payload de ejemplo:**

```json
{
  "status": "online",
  "fw_version": "1.2.3",
  "hw_version": "2.1",
  "uptime": 86400,
  "last_seen": 1640995200000
}
```

### **5. Configuración del Controlador**

```
Topic: stations/madrid/controller/ctrl_001/config
```

**Payload de ejemplo:**

```json
{
  "config": {
    "telemetry_interval": 30,
    "battery_threshold": 20,
    "lock_timeout": 5000
  },
  "timestamp": 1640995200000
}
```

---

## 🎯 **Topics Completos para Copiar y Pegar**

### **Estación Madrid:**

```
stations/madrid/controller/ctrl_001/locks/lock_001/telemetry
stations/madrid/controller/ctrl_001/locks/lock_001/event
stations/madrid/controller/ctrl_001/locks/lock_001/state
stations/madrid/controller/ctrl_001/status
stations/madrid/controller/ctrl_001/config
```

### **Estación Barcelona:**

```
stations/barcelona/controller/ctrl_002/locks/lock_002/telemetry
stations/barcelona/controller/ctrl_002/locks/lock_002/event
stations/barcelona/controller/ctrl_002/locks/lock_002/state
stations/barcelona/controller/ctrl_002/status
stations/barcelona/controller/ctrl_002/config
```

### **Estación Valencia:**

```
stations/valencia/controller/ctrl_003/locks/lock_003/telemetry
stations/valencia/controller/ctrl_003/locks/lock_003/event
stations/valencia/controller/ctrl_003/locks/lock_003/state
stations/valencia/controller/ctrl_003/status
stations/valencia/controller/ctrl_003/config
```

---

## 🔄 **Topics de Comandos (que envía tu servidor)**

Tu servidor también **publica** comandos en estos topics:

```
stations/{stationId}/controller/{controllerId}/locks/{lockId}/command
```

### **Ejemplo de comando:**

```
Topic: stations/madrid/controller/ctrl_001/locks/lock_001/command
```

**Payload de ejemplo:**

```json
{
  "command": "lock",
  "req_id": "req_12345",
  "timeout_ms": 5000,
  "timestamp": 1640995200000
}
```

---

## 🧪 **Secuencia de Prueba Recomendada**

### **1. Enviar Telemetría:**

```
Topic: stations/madrid/controller/ctrl_001/locks/lock_001/telemetry
Payload: {"state":"locked","battery":85,"rssi":-45,"timestamp":1640995200000,"seq":12345}
```

### **2. Enviar Estado:**

```
Topic: stations/madrid/controller/ctrl_001/locks/lock_001/state
Payload: {"state":"locked","battery":85,"rssi":-45,"last_update":1640995200000}
```

### **3. Enviar Evento:**

```
Topic: stations/madrid/controller/ctrl_001/locks/lock_001/event
Payload: {"event":"lock_activated","details":{"reason":"user_command"},"timestamp":1640995200000}
```

### **4. Enviar Estado del Controlador:**

```
Topic: stations/madrid/controller/ctrl_001/status
Payload: {"status":"online","fw_version":"1.2.3","uptime":86400,"last_seen":1640995200000}
```

---

## 📊 **Verificar que tu Servidor Recibe los Datos**

### **1. Revisar logs del servidor:**

Deberías ver mensajes como:

```
[MQTT] mensaje recibido: stations/madrid/controller/ctrl_001/locks/lock_001/telemetry
```

### **2. Verificar en la base de datos:**

```sql
-- Ver telemetría recibida
SELECT * FROM telemetry ORDER BY created_at DESC LIMIT 10;

-- Ver eventos recibidos
SELECT * FROM events ORDER BY created_at DESC LIMIT 10;

-- Ver estado de cerraduras
SELECT * FROM locks ORDER BY updated_at DESC LIMIT 10;
```

### **3. Verificar API:**

```bash
# Ver cerraduras
curl http://localhost:3000/api/locks

# Ver eventos de una cerradura específica
curl http://localhost:3000/api/locks/lock_001/events
```

---

## 🎨 **Configuración en MQTT Explorer**

### **1. Nueva Conexión:**

- **Name:** Bike Station Test
- **Host:** test.mosquitto.org
- **Port:** 1883
- **Client ID:** mqtt-explorer-1570e1be

### **2. Publicar Mensaje:**

- **Topic:** `stations/madrid/controller/ctrl_001/locks/lock_001/telemetry`
- **Payload:** `{"state":"locked","battery":85,"rssi":-45,"timestamp":1640995200000}`
- **QoS:** 1
- **Retain:** false

### **3. Suscribirse a Comandos:**

- **Topic:** `stations/madrid/controller/ctrl_001/locks/lock_001/command`
- **QoS:** 1

---

## ⚡ **Tips para Pruebas Rápidas**

### **1. Usar timestamps actuales:**

```javascript
// En la consola del navegador o Node.js
Math.floor(Date.now() / 1000) * 1000;
```

### **2. Generar datos realistas:**

```json
{
  "state": "locked",
  "battery": Math.floor(Math.random() * 30) + 70,
  "rssi": Math.floor(Math.random() * 20) - 60,
  "timestamp": Math.floor(Date.now() / 1000) * 1000
}
```

### **3. Simular múltiples dispositivos:**

Cambiar los IDs en los topics:

- `madrid` → `barcelona`, `valencia`, `sevilla`
- `ctrl_001` → `ctrl_002`, `ctrl_003`
- `lock_001` → `lock_002`, `lock_003`

**¡Con estos topics podrás probar completamente la funcionalidad MQTT de tu servidor!** 🚀
