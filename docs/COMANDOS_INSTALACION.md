# 🚀 Guía de Instalación y Ejecución - Servidor Node.js IoT

## 📋 Prerrequisitos

### Para macOS/Linux:

- Node.js (v18 o superior)
- npm o yarn
- Homebrew (para macOS)

### Para Windows:

- Node.js (v18 o superior)
- npm o yarn
- MySQL Server
- Mosquitto MQTT Broker

---

## 🛠️ Instalación de Dependencias

### 1. Clonar e instalar dependencias del proyecto,

```bash
# Navegar al directorio del proyecto
cd ServidorNodeDaalogguer

# Instalar dependencias de Node.js
npm install
```

---

## 🗄️ Configuración de MySQL

### Para macOS/Linux:

```bash
# Instalar MySQL con Homebrew
brew install mysql

# Iniciar MySQL
brew services start mysql

# Crear la base de datos
mysql -u root -e "CREATE DATABASE IF NOT EXISTS bike_station_db;"

# Ejecutar el esquema SQL
mysql -u root bike_station_db < sql/schema.sql
```

### Para Windows:

```cmd
# 1. Descargar e instalar MySQL desde: https://dev.mysql.com/downloads/mysql/
# 2. Durante la instalación, configurar contraseña para root (o dejarla vacía)

# 3. Abrir Command Prompt como Administrador y navegar a la carpeta MySQL
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"

# 4. Iniciar MySQL (si no está como servicio)
mysqld --console

# 5. En otra ventana de Command Prompt, conectar a MySQL
mysql -u root -p

# 6. Crear la base de datos
CREATE DATABASE IF NOT EXISTS bike_station_db;
USE bike_station_db;

# 7. Ejecutar el esquema (copiar y pegar el contenido de sql/schema.sql)
# O desde el directorio del proyecto:
mysql -u root -p bike_station_db < sql/schema.sql
```

---

## 📡 Configuración de MQTT

### Opción 1: MQTT Local (Mosquitto)

#### Para macOS/Linux:

```bash
# Instalar Mosquitto
brew install mosquitto

# Iniciar Mosquitto
brew services start mosquitto

# Verificar que esté ejecutándose
brew services list | grep mosquitto
```

#### Para Windows:

```cmd
# 1. Descargar Mosquitto desde: https://mosquitto.org/download/
# 2. Instalar Mosquitto
# 3. Abrir Command Prompt como Administrador

# 4. Iniciar Mosquitto
net start mosquitto

# 5. Verificar que esté ejecutándose
net start | findstr mosquitto
```

### Opción 2: MQTT Cloud (Recomendado para IoT)

**Ventaja:** Los dispositivos IoT pueden conectarse desde cualquier lugar y tu servidor local recibe todos los datos.

#### Servidores MQTT Gratuitos:

1. **Eclipse Mosquitto (Recomendado para pruebas)**

   ```env
   MQTT_URL=mqtt://test.mosquitto.org:1883
   ```

2. **HiveMQ Cloud**

   ```env
   MQTT_URL=mqtts://broker.hivemq.com:8883
   ```

3. **EMQX Cloud**

   ```env
   MQTT_URL=mqtts://broker.emqx.io:8883
   ```

4. **AWS IoT Core (Requiere cuenta AWS)**
   ```env
   MQTT_URL=wss://your-endpoint.iot.region.amazonaws.com/mqtt
   ```

#### Ventajas de MQTT Cloud vs Local:

| Aspecto                  | MQTT Local            | MQTT Cloud               |
| ------------------------ | --------------------- | ------------------------ |
| **Dispositivos remotos** | ❌ Solo local         | ✅ Desde cualquier lugar |
| **Infraestructura**      | ❌ Necesitas servidor | ✅ Sin mantenimiento     |
| **Escalabilidad**        | ❌ Limitada           | ✅ Automática            |
| **Conectividad**         | ❌ Solo LAN           | ✅ Internet global       |
| **Configuración**        | ❌ Compleja           | ✅ Simple                |
| **Costo**                | ❌ Servidor propio    | ✅ Gratuito (límites)    |

**Recomendación:** Usa MQTT Cloud para proyectos IoT reales donde los dispositivos están distribuidos geográficamente.

---

## ⚙️ Configuración de Variables de Entorno

### 1. Crear archivo .env

```bash
# Copiar el archivo de ejemplo
cp env.example .env
```

### 2. Editar .env según tu configuración:

#### Para MQTT Local (MySQL sin contraseña):

```env
# Configuración del servidor
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Configuración MQTT Local
MQTT_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Configuración de base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=bike_station_db

# Configuración adicional
COMMAND_TIMEOUT=5000
TELEMETRY_BATCH_SIZE=100
```

#### Para MQTT Cloud (Recomendado para IoT):

```env
# Configuración del servidor
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Configuración MQTT Cloud (Eclipse Mosquitto)
MQTT_URL=mqtt://test.mosquitto.org:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Configuración de base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=bike_station_db

# Configuración adicional
COMMAND_TIMEOUT=5000
TELEMETRY_BATCH_SIZE=100
```

#### Para Windows (si configuraste contraseña en MySQL):

```env
# Configuración del servidor
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Configuración MQTT (Local o Cloud)
MQTT_URL=mqtt://localhost:1883
# O para Cloud: MQTT_URL=mqtt://test.mosquitto.org:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Configuración de base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=bike_station_db

# Configuración adicional
COMMAND_TIMEOUT=5000
TELEMETRY_BATCH_SIZE=100
```

---

## 🚀 Ejecución del Servidor

### 1. Modo Desarrollo (con recarga automática)

```bash
npm run dev
```

### 2. Modo Producción

```bash
# Compilar TypeScript
npm run build

# Ejecutar servidor
npm start
```

---

## ✅ Verificación de Funcionamiento

### 1. Verificar que el servidor esté corriendo

```bash
curl http://localhost:3000/api/locks
```

**Respuesta esperada:** `{"success":true,"data":[]}`

### 2. Verificar métricas

```bash
curl http://localhost:3000/api/metrics
```

**Respuesta esperada:** Métricas de Prometheus

### 3. Verificar logs del servidor

Deberías ver en la consola:

```
API on :3000
[MQTT] conectado
[MQTT] suscripciones listas
```

---

## 🔧 Comandos de Diagnóstico

### Verificar servicios en ejecución:

#### macOS/Linux:

```bash
# Verificar MySQL
brew services list | grep mysql

# Verificar Mosquitto
brew services list | grep mosquitto

# Verificar puertos
lsof -i :3000  # Servidor Node.js
lsof -i :3306  # MySQL
lsof -i :1883  # Mosquitto
```

#### Windows:

```cmd
# Verificar servicios
net start | findstr mysql
net start | findstr mosquitto

# Verificar puertos
netstat -an | findstr :3000
netstat -an | findstr :3306
netstat -an | findstr :1883
```

---

## 🛑 Detener Servicios

### Para macOS/Linux:

```bash
# Detener el servidor Node.js
Ctrl + C

# Detener MySQL
brew services stop mysql

# Detener Mosquitto
brew services stop mosquitto
```

### Para Windows:

```cmd
# Detener el servidor Node.js
Ctrl + C

# Detener MySQL
net stop mysql

# Detener Mosquitto
net stop mosquitto
```

---

## 🐛 Solución de Problemas Comunes

### Error: "ECONNREFUSED ::1:1883"

**Causa:** Mosquitto no está ejecutándose
**Solución:** Iniciar Mosquitto según las instrucciones anteriores

### Error: "Access denied for user 'root'@'localhost'"

**Causa:** Credenciales incorrectas en .env
**Solución:** Verificar usuario y contraseña en el archivo .env

### Error: "Database 'bike_station_db' doesn't exist"

**Causa:** La base de datos no fue creada
**Solución:** Ejecutar el comando de creación de base de datos

### Error: "Missing environment variables"

**Causa:** El archivo .env no existe o no se está cargando
**Solución:** Crear el archivo .env basado en env.example

---

## 📚 Endpoints Disponibles

Una vez que el servidor esté ejecutándose, puedes probar estos endpoints:

```bash
# Obtener todas las cerraduras
GET http://localhost:3000/api/locks

# Obtener cerradura específica
GET http://localhost:3000/api/locks/{lockId}

# Bloquear cerradura
POST http://localhost:3000/api/locks/{lockId}/lock

# Desbloquear cerradura
POST http://localhost:3000/api/locks/{lockId}/unlock

# Estado de comando
GET http://localhost:3000/api/locks/{lockId}/status/{reqId}

# Eventos de cerradura
GET http://localhost:3000/api/locks/{lockId}/events

# Métricas Prometheus
GET http://localhost:3000/api/metrics
```

---

## 🎯 Estado Final Esperado

Cuando todo esté funcionando correctamente, deberías ver:

1. ✅ **Servidor HTTP**: Corriendo en puerto 3000
2. ✅ **Base de Datos MySQL**: Conectada y con esquema creado
3. ✅ **Broker MQTT**: Mosquitto ejecutándose en puerto 1883
4. ✅ **Variables de Entorno**: Configuradas correctamente
5. ✅ **API Endpoints**: Respondiendo correctamente
6. ✅ **Métricas Prometheus**: Disponibles en `/api/metrics`

**¡El proyecto estará completamente funcional y listo para pruebas!** 🎉
