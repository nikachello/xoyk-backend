import { Coord, GameState, Player } from "../types";

export const nextTurn = (currentTurn: number, players: Player[]): number => {
  return (currentTurn + 1) % players.length;
};

export function createBoard(rows: number, cols: number): (string | null)[][] {
  return Array(rows)
    .fill("")
    .map(() => Array(cols).fill(""));
}

export const getWinningCells = (
  board: (string | null)[][],
  row: number,
  col: number,
  target = 5
): Coord[] | null => {
  const symbol = board[row][col];
  if (!symbol) return null;

  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [dr, dc] of directions) {
    const line: Coord[] = [{ row, col }];

    let r = row + dr,
      c = col + dc;
    while (board[r]?.[c] === symbol) {
      line.push({ row: r, col: c });
      r += dr;
      c += dc;
    }

    r = row - dr;
    c = col - dc;
    while (board[r]?.[c] === symbol) {
      line.push({ row: r, col: c });
      r -= dr;
      c -= dc;
    }

    if (line.length >= target) return line;
  }

  return null;
};

export const makeMove = (
  state: GameState,
  row: number,
  col: number
): GameState => {
  if (state.winner || state.board[row][col]) return state;

  const newBoard = state.board.map((r) => [...r]);
  newBoard[row][col] = state.players[state.currentTurn].char;

  const winningLine = getWinningCells(newBoard, row, col);

  return {
    board: newBoard,
    players: state.players,
    currentTurn: winningLine
      ? state.currentTurn
      : nextTurn(state.currentTurn, state.players),
    winner: winningLine ? state.players[state.currentTurn] : null,
    winningCells: winningLine ?? [],
  };
};
