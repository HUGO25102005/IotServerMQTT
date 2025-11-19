import ObjectMqttModel from "../models/ObjectMqttModel";

class MqttServerController extends ObjectMqttModel {

    constructor(
        topic: string,
        payload: any,
        messageStr: string = payload.toString()
    ) {
        super(topic, payload, messageStr);
    }

    public onMessage() {
        let jsonData = null
        try {
            jsonData = JSON.parse(this.messageStr)
            console.log(JSON.stringify(jsonData, null, 2))
        } catch (e) {
            // Si no es JSON, mostrar como texto
            console.log(this.messageStr)
        }
        console.log('='.repeat(60))

    }

}

export default MqttServerController;