let mqtt
try {
  mqtt = require('mqtt')
} catch (err) {
  console.error("No se encontró la dependencia 'mqtt'. Instálala con: npm install mqtt")
  process.exit(1)
}

const MQTT_URL = process.env.MQTT_URL || 'mqtt://10.93.163.244:1883'
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'casa/todos'
const MQTT_TOPIC_SENSOR1 = process.env.MQTT_TOPIC_SENSOR1 || 'casa/sensor1'
const MQTT_TOPIC_MENSAJES = process.env.MQTT_TOPIC_MENSAJES || 'messages/success';

const options = {}
if (process.env.MQTT_USERNAME) options.username = process.env.MQTT_USERNAME
if (process.env.MQTT_PASSWORD) options.password = process.env.MQTT_PASSWORD

const clientA = mqtt.connect(MQTT_URL, options)

clientA.on('connect', () => {
  console.log(`[MQTT] Conectado a ${MQTT_URL}`)
  clientA.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error('[MQTT] Error al suscribirse:', err.message)
      return
    }
    console.log(`[MQTT] Suscrito al tópico: ${MQTT_TOPIC}`)
    clientA.publish(MQTT_TOPIC_MENSAJES, 'Hola desde Node.js 👋, soy isa desde la lap', { qos: 0 })
  })
})

clientA.on('reconnect', () => {
  console.log('[MQTT] Reintentando conexión...')
})

clientA.on('close', () => {
  console.log('[MQTT] Conexión cerrada')
})

clientA.on('error', (err) => {
  console.error('[MQTT] Error:', err.message)
})

clientA.on('message', (topic, message) => {
  console.log(`[MQTT] Mensaje en ${topic}:`, message.toString())
})



const clientB = mqtt.connect(MQTT_URL, options)

clientB.on('connect', () => {
  console.log(`[MQTT] Conectado a ${MQTT_URL}`)
  clientB.subscribe(MQTT_TOPIC_SENSOR1, (err) => {
    if (err) {
      console.error('[MQTT] Error al suscribirse:', err.message)
      return
    }
    console.log(`[MQTT] Suscrito al tópico: ${MQTT_TOPIC_SENSOR1}`)
    clientB.publish(MQTT_TOPIC_SENSOR1, 'Hola desde Node.js 👋', { qos: 0 })
  })
})

clientB.on('reconnect', () => {
  console.log('[MQTT] Reintentando conexión...')
})

clientB.on('close', () => {
  console.log('[MQTT] Conexión cerrada')
})

clientB.on('error', (err) => {
  console.error('[MQTT] Error:', err.message)
})

clientB.on('message', (topic, message) => {
  console.log(`[MQTT] Mensaje en ${topic}:`, message.toString())
})
