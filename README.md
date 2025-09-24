# Servidor Node.js para Estación de Bicicletas IoT

Este proyecto es un backend desarrollado en Node.js que gestiona la comunicación MQTT con sensores ESP32 para el control de cerrojos en estaciones de bicicletas.

## Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **TypeScript** - Lenguaje de programación tipado
- **Express.js** - Framework web para APIs REST
- **MQTT** - Protocolo de comunicación IoT (Mosquitto)
- **MySQL** - Base de datos relacional
- **Prometheus** - Métricas y monitoreo

## Arquitectura del Proyecto

```
src/
├── config/          # Configuración y variables de entorno
├── domain/          # Lógica de negocio y repositorios
│   ├── repositories/ # Acceso a datos
│   └── services/    # Servicios de dominio
├── http/            # Controladores y rutas HTTP
├── infra/           # Infraestructura (DB, MQTT, métricas)
├── mqtt/            # Handlers y routing MQTT
│   └── handlers/    # Procesadores de mensajes MQTT
└── utils/           # Utilidades generales
```

## Configuración

1. **Instalar dependencias:**

   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**

   ```bash
   cp env.example .env
   # Editar .env con tus configuraciones
   ```

3. **Configurar base de datos:**

   ```bash
   mysql -u root -p < sql/schema.sql
   ```

4. **Configurar Mosquitto MQTT:**
   - Instalar Mosquitto broker
   - Configurar ACLs para dispositivos y backend
   - Ajustar configuración en .env

## Variables de Entorno

```env
# Servidor
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# MQTT
MQTT_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=bike_station_db
```

## Tópicos MQTT

### Suscripciones del Backend

- `stations/+/controller/+/locks/+/telemetry`
- `stations/+/controller/+/locks/+/event`
- `stations/+/controller/+/locks/+/state`
- `stations/+/controller/+/status`
- `stations/+/controller/+/config`

### Publicaciones del Backend

- `stations/{stationId}/controller/{deviceId}/locks/{lockId}/command/set`

## API REST

### Endpoints de Locks

- `GET /api/locks` - Listar todos los locks
- `GET /api/locks/:lockId` - Obtener estado de un lock
- `POST /api/locks/:lockId/lock` - Bloquear cerrojo
- `POST /api/locks/:lockId/unlock` - Desbloquear cerrojo
- `GET /api/locks/:lockId/status/:reqId` - Estado de comando
- `GET /api/locks/:lockId/events` - Eventos del lock

### Ejemplo de uso:

```bash
# Bloquear cerrojo
curl -X POST http://localhost:3000/api/locks/lock-1/lock \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "st-colima-0001",
    "controllerId": "ctrl-07f3a2",
    "timeoutMs": 5000
  }'

# Consultar estado
curl http://localhost:3000/api/locks/lock-1
```

## Estructura de Base de Datos

- **stations** - Estaciones de bicicletas
- **controllers** - Controladores ESP32
- **locks** - Cerrojos individuales
- **telemetry** - Datos de telemetría
- **events** - Eventos del sistema
- **commands** - Comandos enviados

## Monitoreo

- **Métricas Prometheus:** `GET /api/metrics`
- **Logs estructurados** con Pino
- **Métricas MQTT** (mensajes recibidos, latencia de comandos)

## Desarrollo

```bash
# Modo desarrollo con hot reload
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar en producción
npm start
```

## Flujo de Comunicación

1. **ESP32** publica telemetría en tópicos MQTT
2. **Backend** procesa y valida mensajes
3. **Base de datos** almacena datos históricos
4. **API REST** permite control remoto
5. **Comandos** se envían vía MQTT a dispositivos
6. **Respuestas** se correlacionan por reqId

## Características

- ✅ Arquitectura limpia y escalable
- ✅ Validación de datos MQTT
- ✅ Deduplicación por secuencia
- ✅ Timeout automático de comandos
- ✅ Logs estructurados
- ✅ Métricas de Prometheus
- ✅ Manejo de errores robusto
- ✅ API REST completa
