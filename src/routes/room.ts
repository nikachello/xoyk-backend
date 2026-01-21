import { Request, Response, Router } from "express";
import { roomManager } from "../rooms";
import { Player } from "../types";
import { randomUUID } from "crypto";

const router = Router();

router.post("/", (req: Request, res: Response) => {
  const player: Player = req.body.player;
  if (!player) return res.status(400).json({ error: "Player required" });

  player.char = "X";

  const roomId = randomUUID();
  const state = roomManager.createRoom(roomId, [player]);

  res.json({ roomId, state });
});

router.post("/join/:roomId", (req: Request, res: Response) => {
  const { roomId } = req.params;
  const player: Player = req.body.player;

  if (!player || !player.name || !player.id) {
    return res.status(400).json({ error: "Invalid player data" });
  }

  let state = roomManager.getRoom(roomId);
  if (!state) return res.status(404).json({ error: "Room not found" });

  const existingPlayer = state.players.find((p) => p.id === player.id);

  if (!existingPlayer) {
    if (state.players.length >= 4) {
      return res.status(400).json({ error: "Room is full" });
    }

    const chars: ("X" | "O" | "Y" | "K")[] = ["X", "O", "Y", "K"];
    player.char = chars[state.players.length];

    state.players.push(player);
    roomManager.setRoomState(roomId, state);
  }

  res.json({ roomId, state });
});

export default router;
