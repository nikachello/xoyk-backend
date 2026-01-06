import express from "express";
import cors from "cors";
import roomsRouter from "./routes/room";

export const app = express();
app.use(cors());
app.use(express.json());

app.use("/rooms", roomsRouter);
