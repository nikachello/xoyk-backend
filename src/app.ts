import cors from "cors";
import roomsRouter from "./routes/room";
import dotenv from "dotenv";
import express from "express";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

export const app = express();
app.use(cors());
app.use(express.json());

app.use("/rooms", roomsRouter);
