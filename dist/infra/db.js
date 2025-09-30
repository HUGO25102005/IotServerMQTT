"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const env_1 = require("../config/env");
exports.pool = promise_1.default.createPool({
    host: env_1.env.DB_HOST, port: env_1.env.DB_PORT, user: env_1.env.DB_USER,
    password: env_1.env.DB_PASSWORD, database: env_1.env.DB_NAME, connectionLimit: 10,
});
//# sourceMappingURL=db.js.map