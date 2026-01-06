"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMove = exports.getWinningCells = exports.nextTurn = void 0;
exports.createBoard = createBoard;
const nextTurn = (currentTurn, players) => {
    return (currentTurn + 1) % players.length;
};
exports.nextTurn = nextTurn;
function createBoard(rows, cols) {
    return Array(rows)
        .fill("")
        .map(() => Array(cols).fill(""));
}
const getWinningCells = (board, row, col, target = 5) => {
    const symbol = board[row][col];
    if (!symbol)
        return null;
    const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
    ];
    for (const [dr, dc] of directions) {
        const line = [{ row, col }];
        let r = row + dr, c = col + dc;
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
        if (line.length >= target)
            return line;
    }
    return null;
};
exports.getWinningCells = getWinningCells;
const makeMove = (state, row, col) => {
    if (state.winner || state.board[row][col])
        return state;
    const newBoard = state.board.map((r) => [...r]);
    newBoard[row][col] = state.players[state.currentTurn].char;
    const winningLine = (0, exports.getWinningCells)(newBoard, row, col);
    return {
        board: newBoard,
        players: state.players,
        currentTurn: winningLine
            ? state.currentTurn
            : (0, exports.nextTurn)(state.currentTurn, state.players),
        winner: winningLine ? state.players[state.currentTurn] : null,
        winningCells: winningLine ?? [],
    };
};
exports.makeMove = makeMove;
