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
        player.socketId = socket.id;

        state = roomManager.createRoom(roomId, [player]);
      }
      // --- ROOM EXISTS ---
      else {
        const existingPlayer = state.players.find((p) => p.id === player.id);

        if (!existingPlayer) {
          // Assign first unused char
          const usedChars = new Set(state.players.map((p) => p.char));
          const nextChar =
            chars.find((c) => !usedChars.has(c)) ??
            chars[state.players.length % chars.length];

          player.char = nextChar;
          player.connected = true;
          player.lastSeen = Date.now();
          player.socketId = socket.id;

          state.players.push(player);
        } else {
          // Reconnecting player
          existingPlayer.connected = true;
          existingPlayer.lastSeen = Date.now();
          existingPlayer.socketId = socket.id;

          // Cancel any pending disconnect cleanup
          if (existingPlayer.disconnectTimer) {
            clearTimeout(existingPlayer.disconnectTimer);
            existingPlayer.disconnectTimer = undefined;
          }

          player.char = existingPlayer.char; // preserve original char
        }

        roomManager.setRoomState(roomId, state);
      }

      io.to(roomId).emit("gameUpdate", state);
    }
  );

  /* ===========================
       GAME MOVE
  ============================ */
  socket.on("makeMove", ({ row, col }) => {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;

    if (!roomId || !playerId) return;

    const state = roomManager.getRoom(roomId);
    if (!state || state.winner) return;

    const activePlayer = state.players[state.currentTurn];

    // Only allow move if active player is connected
    if (!activePlayer.connected) return;
    if (activePlayer.id !== playerId) return;

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

    // Ignore disconnect from stale socket
    if (player.socketId !== socket.id) return;

    // Mark offline
    player.connected = false;
    player.lastSeen = Date.now();

    roomManager.setRoomState(roomId, state);
    io.to(roomId).emit("gameUpdate", state);

    // Schedule delayed cleanup
    player.disconnectTimer = setTimeout(() => {
      const latest = roomManager.getRoom(roomId);
      if (!latest) return;

      const idx = latest.players.findIndex((p) => p.id === playerId);
      if (idx === -1) return;

      // Adjust turn safely
      if (latest.currentTurn > idx) {
        latest.currentTurn--;
      } else if (latest.currentTurn === idx) {
        latest.currentTurn %= Math.max(1, latest.players.length - 1);
      }

      latest.players.splice(idx, 1);

      roomManager.setRoomState(roomId, latest);
      io.to(roomId).emit("gameUpdate", latest);
    }, DISCONNECT_GRACE_MS);
  });
}
