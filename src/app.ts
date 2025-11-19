// app.ts
import express from "express";
import { router } from "./http/routes";
// NOTA: No importar infra/mqtt aquí - los listeners se configuran en main.ts

export const app = express();
app.use(express.json());
app.use("/api", router);
