import { createBoard } from "./logic/board";
import { GameState, Player } from "./types";

interface Room {
  id: string;
  state: GameState;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  createRoom(id: string, players: Player[]): GameState {
    const state: GameState = {
      board: createBoard(13, 13),
      players,
      currentTurn: 0,
      winner: null,
      winningCells: [],
    };
    this.rooms.set(id, { id, state });
    return state;
  }

  getRoom(id: string): GameState | null {
    return this.rooms.get(id)?.state ?? null;
  }

  setRoomState(id: string, state: GameState) {
    const room = this.rooms.get(id);
    if (room) room.state = state;
  }

  deleteRoom(id: string) {
    this.rooms.delete(id);
  }
}

export const roomManager = new RoomManager();
