"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameSocket = gameSocket;
const rooms_1 = require("../rooms");
const board_1 = require("../logic/board");
const chars = ["X", "O", "Y", "K"];
function gameSocket(io, socket) {
    socket.on("joinRoom", ({ roomId, player }) => {
        socket.join(roomId);
        let state = rooms_1.roomManager.getRoom(roomId);
        if (!state) {
            player.char = chars[0];
            state = rooms_1.roomManager.createRoom(roomId, [player]);
        }
        else {
            const existingPlayer = state.players.find((p) => p.id === player.id);
            if (!existingPlayer) {
                // Assign character based on player count
                player.char = chars[state.players.length % chars.length];
                state.players.push(player);
            }
            else {
                // Ensure existing player has their assigned char
                player.char = existingPlayer.char;
            }
            rooms_1.roomManager.setRoomState(roomId, state);
        }
        // Broadcast update to everyone in the room
        io.to(roomId).emit("gameUpdate", state);
    });
    socket.on("makeMove", ({ roomId, row, col, playerId }) => {
        const state = rooms_1.roomManager.getRoom(roomId);
        if (!state || state.players.length < 4 || state.winner)
            return;
        const activePlayer = state.players[state.currentTurn];
        if (activePlayer.id !== playerId)
            return;
        // prevent overwrite
        if (state.board[row][col] !== "")
            return;
        // 1. place move first
        state.board[row][col] = activePlayer.char;
        // 2. check win
        const winningCells = (0, board_1.getWinningCells)(state.board, row, col, 5);
        if (winningCells) {
            state.winner = activePlayer;
            state.winningCells = winningCells;
        }
        else {
            // 3. rotate turn
            state.currentTurn = (state.currentTurn + 1) % state.players.length;
        }
        rooms_1.roomManager.setRoomState(roomId, state);
        io.to(roomId).emit("gameUpdate", state);
    });
}
