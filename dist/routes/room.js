"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rooms_1 = require("../rooms");
const crypto_1 = require("crypto");
const router = (0, express_1.Router)();
router.post("/", (req, res) => {
    const player = req.body.player;
    if (!player)
        return res.status(400).json({ error: "Player required" });
    player.char = "X";
    const roomId = (0, crypto_1.randomUUID)();
    const state = rooms_1.roomManager.createRoom(roomId, [player]);
    res.json({ roomId, state });
});
router.post("/join/:roomId", (req, res) => {
    const { roomId } = req.params;
    const player = req.body.player;
    // 1. Validation: Ensure player has a name and ID
    if (!player || !player.name || !player.id) {
        return res.status(400).json({ error: "Invalid player data" });
    }
    let state = rooms_1.roomManager.getRoom(roomId);
    if (!state)
        return res.status(404).json({ error: "Room not found" });
    const existingPlayer = state.players.find((p) => p.id === player.id);
    if (!existingPlayer) {
        if (state.players.length >= 4) {
            return res.status(400).json({ error: "Room is full" });
        }
        // 2. Assign the character HERE based on the current length
        const chars = ["X", "O", "Y", "K"];
        player.char = chars[state.players.length];
        state.players.push(player);
        rooms_1.roomManager.setRoomState(roomId, state);
    }
    res.json({ roomId, state });
});
exports.default = router;
