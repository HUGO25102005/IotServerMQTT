// CommonJS module - Compatible con require()
// Mapea topics MQTT a estructura Firestore

/**
 * Mapea un topic MQTT a la estructura de Firestore
 * @param {string} topic - El topic MQTT (ej: "stations/madrid/controller/ctrl_001/locks/lock_001/telemetry")
 * @param {string} type - Tipo de mensaje: 'telemetry' | 'event' | 'state' | 'status' | 'config'
 * @returns {Object|null} Objeto con rootCollection, stationId, controllerId, lockId, type
 */
function mapMqttToFirestore(topic, type = 'telemetry') {
    const parts = topic.split("/");

    // Para topics estructurados: stations/{stationId}/controller/{controllerId}/locks/{lockId}/telemetry
    if (parts.length >= 8 && parts[0] === 'stations' && parts[2] === 'controller') {
        const [, rootCollection, stationId, controllerKey, controllerId, locksKey, lockId, actionType] = parts;
        return {
            rootCollection: rootCollection || 'stations',
            stationId: stationId,
            controllerId: controllerId,
            lockId: lockId,
            type: actionType || type,
        };
    }

    // Para topics genéricos (como casa/todos), usar estructura simple
    const topicPath = topic.replace(/\//g, '_');
    return {
        rootCollection: 'mqtt_messages',
        stationId: topicPath,
        controllerId: 'default',
        lockId: 'default',
        type: 'messages',
    };
}

// Exportar usando CommonJS
module.exports = {
    mapMqttToFirestore
};
