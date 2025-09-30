#include <string>
#include <iostream>

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
};

// Ejemplo de uso
int main() {
    // Crear controlador para casa, estación 1, objeto 1
    ControllerTopicsClass controller("madrid", "ctrl_001", "lock_001");
    
    // Obtener topic de telemetría
    std::string topicTelemetry = controller.getTelemetryTopic();
    std::cout << "Topic de telemetría: " << topicTelemetry << std::endl;
    
    // Mostrar todos los topics
    controller.printAllTopics();
    
    // Ejemplo con múltiples controladores
    ControllerTopicsClass controller2("barcelona", "ctrl_002", "lock_002");
    controller2.printAllTopics();
    
    return 0;
}

