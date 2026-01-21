import { Server, Socket } from "socket.io";
import { roomManager } from "../rooms";
import { Player } from "../types";
import { getWinningCells } from "../logic/board";

const chars: ("X" | "O" | "Y" | "K")[] = ["X", "O", "Y", "K"];
const DISCONNECT_GRACE_MS = 30_000;

export function gameSocket(io: Server, socket: Socket) {
  /* ===========================
     JOIN / REJOIN ROOM
  ============================ */
  socket.on(
    "joinRoom",
    ({ roomId, player }: { roomId: string; player: Player }) => {
      socket.join(roomId);

      // Store identity on socket (reconnect-safe)
      socket.data.playerId = player.id;
      socket.data.roomId = roomId;

      let state = roomManager.getRoom(roomId);

      // --- ROOM DOES NOT EXIST ---
      if (!state) {
        player.char = chars[0];
        player.connected = true;
        player.lastSeen = Date.now();

        state = roomManager.createRoom(roomId, [player]);
      }
      // --- ROOM EXISTS ---
      else {
        const existingPlayer = state.players.find((p) => p.id === player.id);

        // New player
        if (!existingPlayer) {
          player.char = chars[state.players.length % chars.length];
          player.connected = true;
          player.lastSeen = Date.now();

          state.players.push(player);
        }
        // Reconnecting player
        else {
          existingPlayer.connected = true;
          existingPlayer.lastSeen = Date.now();
          player.char = existingPlayer.char;
        }

        roomManager.setRoomState(roomId, state);
      }

      io.to(roomId).emit("gameUpdate", state);
    }
  );

  /* ===========================
     GAME MOVE
  ============================ */
  socket.on("makeMove", ({ roomId, row, col, playerId }) => {
    const state = roomManager.getRoom(roomId);
    if (!state || state.winner) return;

    const activePlayer = state.players[state.currentTurn];

    // Must be connected & correct turn
    if (
      !activePlayer ||
      activePlayer.id !== playerId ||
      !activePlayer.connected
    ) {
      return;
    }

    if (state.board[row][col] !== "") return;

    state.board[row][col] = activePlayer.char;

    const winningCells = getWinningCells(state.board, row, col, 5);

    if (winningCells) {
      state.winner = activePlayer;
      state.winningCells = winningCells;
    } else {
      state.currentTurn = (state.currentTurn + 1) % state.players.length;
    }

    roomManager.setRoomState(roomId, state);
    io.to(roomId).emit("gameUpdate", state);
  });

  /* ===========================
     GRACEFUL DISCONNECT (MOBILE SAFE)
  ============================ */
  socket.on("disconnect", () => {
    const { roomId, playerId } = socket.data;

    if (!roomId || !playerId) return;

    const state = roomManager.getRoom(roomId);
    if (!state) return;

    const player = state.players.find((p) => p.id === playerId);
    if (!player) return;

    // Mark player offline
    player.connected = false;
    player.lastSeen = Date.now();

    roomManager.setRoomState(roomId, state);
    io.to(roomId).emit("gameUpdate", state);

    // Delayed cleanup (grace period)
    setTimeout(() => {
      const latest = roomManager.getRoom(roomId);
      if (!latest) return;

      const stillOffline = latest.players.find(
        (p) => p.id === playerId && !p.connected
      );

      if (!stillOffline) return;

      // Remove player permanently
      latest.players = latest.players.filter((p) => p.id !== playerId);

      // Fix turn index
      if (latest.currentTurn >= latest.players.length) {
        latest.currentTurn = 0;
      }

      roomManager.setRoomState(roomId, latest);
      io.to(roomId).emit("gameUpdate", latest);
    }, DISCONNECT_GRACE_MS);
  });
}
