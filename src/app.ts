// app.ts
import express from "express";
import { router } from "./http/routes";
import "./infra/mqtt";

export const app = express();
app.use(express.json());
app.use("/api", router);
