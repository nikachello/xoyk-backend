export interface Player {
  id: string;
  name: string;
  char: "X" | "O" | "Y" | "K";
  connected: boolean;
  lastSeen: number;
  socketId?: string;
  disconnectTimer?: NodeJS.Timeout;
}

export type Coord = { row: number; col: number };

export type GameState = {
  board: (string | null)[][];
  players: Player[];
  currentTurn: number;
  winner: Player | null;
  winningCells: Coord[];
};
