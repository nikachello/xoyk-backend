import { Server, Socket } from "socket.io";
import { roomManager } from "../rooms";
import { Player } from "../types";
import { getWinningCells } from "../logic/board";

const chars: ("X" | "O" | "Y" | "K")[] = ["X", "O", "Y", "K"];

export function gameSocket(io: Server, socket: Socket) {
  socket.on(
    "joinRoom",
    ({ roomId, player }: { roomId: string; player: Player }) => {
      socket.join(roomId);

      let state = roomManager.getRoom(roomId);

      if (!state) {
        player.char = chars[0];
        state = roomManager.createRoom(roomId, [player]);
      } else {
        const existingPlayer = state.players.find((p) => p.id === player.id);
        if (!existingPlayer) {
          // Assign character based on player count
          player.char = chars[state.players.length % chars.length];
          state.players.push(player);
        } else {
          // Ensure existing player has their assigned char
          player.char = existingPlayer.char;
        }
        roomManager.setRoomState(roomId, state);
      }

      // Broadcast update to everyone in the room
      io.to(roomId).emit("gameUpdate", state);
    }
  );

  socket.on("makeMove", ({ roomId, row, col, playerId }) => {
    const state = roomManager.getRoom(roomId);
    if (!state || state.players.length < 4 || state.winner) return;

    const activePlayer = state.players[state.currentTurn];
    if (activePlayer.id !== playerId) return;

    // prevent overwrite
    if (state.board[row][col] !== "") return;

    // 1. place move first
    state.board[row][col] = activePlayer.char;

    // 2. check win
    const winningCells = getWinningCells(state.board, row, col, 5);

    if (winningCells) {
      state.winner = activePlayer;
      state.winningCells = winningCells;
    } else {
      // 3. rotate turn
      state.currentTurn = (state.currentTurn + 1) % state.players.length;
    }

    roomManager.setRoomState(roomId, state);
    io.to(roomId).emit("gameUpdate", state);
  });
}
