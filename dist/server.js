"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
app_1.app.listen(env_1.env.PORT, () => console.log(`API on :${env_1.env.PORT}`));
//# sourceMappingURL=server.js.map