export type Player = {
  id: number;
  name: string;
  char: string;
  connected: boolean;
  lastSeen: number;
};

export type Coord = { row: number; col: number };

export type GameState = {
  board: (string | null)[][];
  players: Player[];
  currentTurn: number;
  winner: Player | null;
  winningCells: Coord[];
};
