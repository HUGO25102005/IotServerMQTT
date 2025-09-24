import { parseTopic } from "./topics";
import { logger } from "../config/logger";
import { mqttMessagesTotal } from "../infra/metrics";
import * as telemetry from "./handlers/telemetry";
import * as event from "./handlers/event";
import * as state from "./handlers/state";
import * as status from "./handlers/status";
import * as config from "./handlers/config";

export function onMqttMessage(topic: string, raw: string) {
  const { stationId, deviceId, lockId, subtype } = parseTopic(topic);
  let data: any;
  try { data = JSON.parse(raw); } 
  catch { logger.warn({ topic }, "json_invalid"); return; }

  mqttMessagesTotal.inc({ type: subtype! });

  switch (subtype) {
    case "telemetry": return telemetry.handle({ stationId, deviceId, lockId, data });
    case "event": {    
        if (!lockId) {
            logger.warn({ topic }, "lock_id_missing");
            return;
        }
        return event.handle({ stationId, deviceId, lockId, data });
    }
    case "state": {
        if (!lockId) {
            logger.warn({ topic }, "lock_id_missing");
            return;
        }
        return state.handle({ stationId, deviceId, lockId, data });
    }
    case "status": {
        if (!deviceId || !stationId) {
            logger.warn({ topic }, "device_id_or_station_id_missing");
            return;
        }
        return status.handle({ deviceId, data });
    }
    case "config": {
        if (!deviceId || !stationId) {
            logger.warn({ topic }, "device_id_missing");
            return;
        }
        return config.handle({ stationId, deviceId, data });
    }
    default:
      logger.warn({ topic }, "subtype_unknown");
  }
}