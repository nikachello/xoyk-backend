"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomManager = exports.RoomManager = void 0;
const board_1 = require("./logic/board");
class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    createRoom(id, players) {
        const state = {
            board: (0, board_1.createBoard)(13, 13),
            players,
            currentTurn: 0,
            winner: null,
            winningCells: [],
        };
        this.rooms.set(id, { id, state });
        return state;
    }
    getRoom(id) {
        return this.rooms.get(id)?.state ?? null;
    }
    setRoomState(id, state) {
        const room = this.rooms.get(id);
        if (room)
            room.state = state;
    }
    deleteRoom(id) {
        this.rooms.delete(id);
    }
}
exports.RoomManager = RoomManager;
exports.roomManager = new RoomManager();
