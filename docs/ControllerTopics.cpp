#include <string>
#include <iostream>
#include <vector>

class ControllerTopicsClass {
private:
    std::string ubicacion;
    std::string idStacion;
    std::string idObjeto;

public:
    // Constructor
    ControllerTopicsClass(const std::string& ubicacion, const std::string& idStacion, const std::string& idObjeto) 
        : ubicacion(ubicacion), idStacion(idStacion), idObjeto(idObjeto) {}
    
    // Getters
    std::string getUbicacion() const { return ubicacion; }
    std::string getIdStacion() const { return idStacion; }
    std::string getIdObjeto() const { return idObjeto; }
    
    // Métodos para generar topics MQTT
    std::string getTelemetryTopic() const {
        return "stations/" + ubicacion + "/controller/" + idStacion + "/locks/" + idObjeto + "/telemetry";
    }
    
    std::string getEventTopic() const {
        return "stations/" + ubicacion + "/controller/" + idStacion + "/locks/" + idObjeto + "/event";
    }
    
    std::string getStateTopic() const {
        return "stations/" + ubicacion + "/controller/" + idStacion + "/locks/" + idObjeto + "/state";
    }
    
    std::string getCommandTopic() const {
        return "stations/" + ubicacion + "/controller/" + idStacion + "/locks/" + idObjeto + "/command";
    }
    
    std::string getControllerStatusTopic() const {
        return "stations/" + ubicacion + "/controller/" + idStacion + "/status";
    }
    
    std::string getControllerConfigTopic() const {
        return "stations/" + ubicacion + "/controller/" + idStacion + "/config";
    }
    
    // Método para obtener todos los topics como vector
    std::vector<std::string> getAllTopics() const {
        return {
            getTelemetryTopic(),
            getEventTopic(),
            getStateTopic(),
            getCommandTopic(),
            getControllerStatusTopic(),
            getControllerConfigTopic()
        };
    }
    
    // Método para mostrar todos los topics
    void printAllTopics() const {
        std::cout << "=== Topics para " << ubicacion << " - Estación " << idStacion << " - Objeto " << idObjeto << " ===" << std::endl;
        std::cout << "Telemetría: " << getTelemetryTopic() << std::endl;
        std::cout << "Eventos:    " << getEventTopic() << std::endl;
        std::cout << "Estado:     " << getStateTopic() << std::endl;
        std::cout << "Comandos:   " << getCommandTopic() << std::endl;
        std::cout << "Status:     " << getControllerStatusTopic() << std::endl;
        std::cout << "Config:     " << getControllerConfigTopic() << std::endl;
        std::cout << std::endl;
    }
    
    // Método para generar payload JSON de ejemplo
    std::string generateTelemetryPayload() const {
        return "{\"state\":\"locked\",\"battery\":85,\"rssi\":-45,\"timestamp\":" + std::to_string(time(nullptr) * 1000) + ",\"seq\":12345}";
    }
    
    std::string generateEventPayload() const {
        return "{\"event\":\"lock_activated\",\"details\":{\"reason\":\"user_command\"},\"timestamp\":" + std::to_string(time(nullptr) * 1000) + "}";
    }
    
    std::string generateStatePayload() const {
        return "{\"state\":\"locked\",\"battery\":85,\"rssi\":-45,\"last_update\":" + std::to_string(time(nullptr) * 1000) + "}";
    }
    
    std::string generateStatusPayload() const {
        return "{\"status\":\"online\",\"fw_version\":\"1.2.3\",\"uptime\":86400,\"last_seen\":" + std::to_string(time(nullptr) * 1000) + "}";
    }
    
    std::string generateCommandPayload(const std::string& command) const {
        return "{\"command\":\"" + command + "\",\"req_id\":\"req_" + std::to_string(time(nullptr)) + "\",\"timeout_ms\":5000,\"timestamp\":" + std::to_string(time(nullptr) * 1000) + "}";
    }
};

// Ejemplo de uso
int main() {
    std::cout << "=== Generador de Topics MQTT para Bike Station ===" << std::endl;
    std::cout << std::endl;
    
    // Crear controlador para Madrid
    ControllerTopicsClass controllerMadrid("madrid", "ctrl_001", "lock_001");
    controllerMadrid.printAllTopics();
    
    // Crear controlador para Barcelona
    ControllerTopicsClass controllerBarcelona("barcelona", "ctrl_002", "lock_002");
    controllerBarcelona.printAllTopics();
    
    // Crear controlador para Valencia
    ControllerTopicsClass controllerValencia("valencia", "ctrl_003", "lock_003");
    controllerValencia.printAllTopics();
    
    // Ejemplo de uso práctico
    std::cout << "=== Ejemplo de Payloads JSON ===" << std::endl;
    std::cout << "Topic: " << controllerMadrid.getTelemetryTopic() << std::endl;
    std::cout << "Payload: " << controllerMadrid.generateTelemetryPayload() << std::endl;
    std::cout << std::endl;
    
    std::cout << "Topic: " << controllerMadrid.getEventTopic() << std::endl;
    std::cout << "Payload: " << controllerMadrid.generateEventPayload() << std::endl;
    std::cout << std::endl;
    
    std::cout << "Topic: " << controllerMadrid.getCommandTopic() << std::endl;
    std::cout << "Payload: " << controllerMadrid.generateCommandPayload("lock") << std::endl;
    std::cout << std::endl;
    
    return 0;
}
