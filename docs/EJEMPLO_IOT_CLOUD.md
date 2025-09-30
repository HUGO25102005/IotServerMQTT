# 🌐 Ejemplo Práctico: Dispositivos IoT con MQTT Cloud

## 📋 Escenario de Uso

Imagina que tienes **cerraduras inteligentes** distribuidas en diferentes ciudades, y quieres que todas se comuniquen con tu servidor local que está en tu casa.

### **Arquitectura:**

```
[Cerradura Madrid] ──┐
[Cerradura Barcelona] ──┼── [MQTT Cloud] ── [Tu Servidor Local]
[Cerradura Valencia] ──┘     (test.mosquitto.org)    (localhost:3000)
```

---

## 🔧 Configuración del Dispositivo IoT

### **Código de ejemplo para ESP32/Arduino:**

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

// Configuración WiFi
const char* ssid = "tu_wifi";
const char* password = "tu_password";

// Configuración MQTT Cloud
const char* mqtt_server = "test.mosquitto.org";
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);

  // Conectar WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi conectado");

  // Conectar MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  if (client.connect("cerradura_madrid_001")) {
    Serial.println("Conectado a MQTT Cloud");

    // Suscribirse a comandos
    client.subscribe("stations/madrid/controllers/ctrl_001/locks/lock_001/command");
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.println("Comando recibido: " + message);

  // Procesar comando (lock/unlock)
  if (message == "lock") {
    // Activar cerradura
    digitalWrite(LOCK_PIN, HIGH);
    sendStatus("locked");
  } else if (message == "unlock") {
    // Desactivar cerradura
    digitalWrite(LOCK_PIN, LOW);
    sendStatus("unlocked");
  }
}

void sendStatus(String state) {
  String topic = "stations/madrid/controllers/ctrl_001/locks/lock_001/status";
  String payload = "{\"state\":\"" + state + "\",\"battery\":85,\"rssi\":-45}";

  client.publish(topic.c_str(), payload.c_str());
}

void loop() {
  client.loop();

  // Enviar telemetría cada 30 segundos
  static unsigned long lastTelemetry = 0;
  if (millis() - lastTelemetry > 30000) {
    sendTelemetry();
    lastTelemetry = millis();
  }
}

void sendTelemetry() {
  String topic = "stations/madrid/controllers/ctrl_001/locks/lock_001/telemetry";
  String payload = "{\"state\":\"locked\",\"battery\":85,\"rssi\":-45,\"timestamp\":" + String(millis()) + "}";

  client.publish(topic.c_str(), payload.c_str());
}
```

---

## 🖥️ Tu Servidor Local (Ya Configurado)

### **Configuración actual en .env:**

```env
# Tu servidor local recibe datos de MQTT Cloud
MQTT_URL=mqtt://test.mosquitto.org:1883
```

### **Lo que sucede:**

1. **Dispositivos IoT** se conectan a `test.mosquitto.org` desde cualquier lugar
2. **Tu servidor local** también se conecta al mismo broker
3. **MQTT Cloud** actúa como intermediario
4. **Todos los datos** llegan a tu servidor local automáticamente

---

## 📡 Topics MQTT que Maneja tu Servidor

### **Topics de Entrada (que recibe tu servidor):**

```
stations/{stationId}/controllers/{controllerId}/locks/{lockId}/status
stations/{stationId}/controllers/{controllerId}/locks/{lockId}/telemetry
stations/{stationId}/controllers/{controllerId}/events
```

### **Topics de Salida (que envía tu servidor):**

```
stations/{stationId}/controllers/{controllerId}/locks/{lockId}/command
```

---

## 🧪 Prueba Práctica

### **1. Simular un dispositivo IoT:**

```bash
# Instalar cliente MQTT
npm install -g mqtt

# Simular telemetría de una cerradura
mqtt pub -h test.mosquitto.org -t "stations/madrid/controllers/ctrl_001/locks/lock_001/telemetry" -m '{"state":"locked","battery":85,"rssi":-45,"timestamp":1640995200000}'

# Simular estado de cerradura
mqtt pub -h test.mosquitto.org -t "stations/madrid/controllers/ctrl_001/locks/lock_001/status" -m '{"state":"unlocked","battery":85,"rssi":-45}'
```

### **2. Verificar que tu servidor recibe los datos:**

```bash
# Verificar logs del servidor
# Deberías ver mensajes como:
# [MQTT] mensaje recibido: stations/madrid/controllers/ctrl_001/locks/lock_001/telemetry
```

### **3. Enviar comando desde tu servidor:**

```bash
# Bloquear cerradura remota
curl -X POST http://localhost:3000/api/locks/lock_001/lock

# El comando se envía a través de MQTT Cloud al dispositivo
```

---

## 🌍 Ventajas de esta Arquitectura

### ✅ **Para Dispositivos IoT:**

- Se conectan desde cualquier lugar con internet
- No necesitan estar en la misma red que tu servidor
- Escalabilidad automática
- Sin configuración de red compleja

### ✅ **Para tu Servidor Local:**

- Recibe datos de dispositivos globales
- No necesitas servidor en la nube
- Control total de tus datos
- Desarrollo y debugging local

### ✅ **Para el Proyecto:**

- Arquitectura distribuida real
- Simula un sistema IoT comercial
- Fácil de probar y demostrar
- Escalable a miles de dispositivos

---

## 🚀 Casos de Uso Reales

### **1. Sistema de Bicicletas Compartidas:**

- Cerraduras en diferentes ciudades
- Tu servidor central en tu oficina
- Monitoreo en tiempo real

### **2. Sistema de Seguridad:**

- Sensores distribuidos
- Cámaras remotas
- Tu servidor de control local

### **3. Agricultura IoT:**

- Sensores de humedad en campos
- Estaciones meteorológicas
- Tu servidor de análisis local

---

## 🔧 Configuración Avanzada

### **Para Producción, considera:**

- **Autenticación MQTT** (usuario/contraseña)
- **TLS/SSL** para conexiones seguras
- **Retención de mensajes** para dispositivos offline
- **QoS levels** para garantizar entrega
- **Will messages** para detectar desconexiones

### **Ejemplo con autenticación:**

```env
MQTT_URL=mqtts://broker.hivemq.com:8883
MQTT_USERNAME=tu_usuario
MQTT_PASSWORD=tu_contraseña
```

**¡Con esta configuración, tu servidor local puede recibir datos de dispositivos IoT en cualquier parte del mundo!** 🌍✨
