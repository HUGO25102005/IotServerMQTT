// app.ts
import express from "express";
import cors from "cors";
import { router } from "./http/routes";
import { env } from "./config/env";
import { logger } from "./config/logger";
// NOTA: No importar infra/mqtt aquí - los listeners se configuran en main.ts

export const app = express();

// Configuración de CORS
const corsOptions = {
    origin: env.FRONTEND_URL,
    credentials: true, // Permite cookies/autenticación
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};

app.use(cors(corsOptions));
logger.info({ origin: env.FRONTEND_URL }, "✅ CORS configurado");

// Middleware para parsear JSON
app.use(express.json());

// Rutas de la API
app.use("/api", router);
