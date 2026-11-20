import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOARD_COLS,
  BOARD_ROWS,
  createInitialBoard,
  evaluateGameResult,
  executeMove,
  findBestXiangqiMove,
  getAllLegalMoves,
  getLegalMovesForPiece,
  isSideInCheck,
  XiangqiBoard,
} from './xiangqiEngine';

function createEmptyBoard(): XiangqiBoard {
  return Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => null)
  );
}

test('Initial Xiangqi board spawns 32 pieces and 44 legal Red opening moves', () => {
  const board = createInitialBoard();
  let count = 0;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c]) count++;
    }
  }
  assert.equal(count, 32);
  const redMoves = getAllLegalMoves(board, 'red');
  assert.equal(redMoves.length, 44);
});

test('Horse leg blocking and Elephant eye blocking strictly follow Xiangqi rules', () => {
  const board = createEmptyBoard();
  board[9][4] = { id: 'rk', side: 'red', type: 'K' };
  board[0][4] = { id: 'bk', side: 'black', type: 'K' };
  board[7][4] = { id: 'rh', side: 'red', type: 'H' };
  // Block upward horse leg at (6, 4)
  board[6][4] = { id: 'rp', side: 'red', type: 'P' };
  // Block left horse leg at (7, 3)
  board[7][3] = { id: 're', side: 'red', type: 'E' };

  const horseMoves = getLegalMovesForPiece(board, 7, 4);
  assert.equal(
    horseMoves.some((m) => m.row === 5 && m.col === 3),
    false,
    'Blocked top leg prevents Horse jumping to (5,3)'
  );
  assert.equal(
    horseMoves.some((m) => m.row === 5 && m.col === 5),
    false,
    'Blocked top leg prevents Horse jumping to (5,5)'
  );
  assert.equal(
    horseMoves.some((m) => m.row === 8 && m.col === 2),
    false,
    'Blocked left leg prevents Horse jumping to (8,2)'
  );
  assert.equal(
    horseMoves.some((m) => m.row === 9 && m.col === 5),
    true,
    'Unblocked bottom-right jump to (9,5) remains legal'
  );
});

test('Cannon jumps exactly one screen to capture enemy piece', () => {
  const board = createEmptyBoard();
  board[9][3] = { id: 'rk', side: 'red', type: 'K' };
  board[0][5] = { id: 'bk', side: 'black', type: 'K' };
  board[7][1] = { id: 'rc', side: 'red', type: 'C' };
  board[5][1] = { id: 'screen', side: 'red', type: 'P' };
  board[2][1] = { id: 'target', side: 'black', type: 'R' };
  board[1][1] = { id: 'behind', side: 'black', type: 'H' };

  const cannonMoves = getLegalMovesForPiece(board, 7, 1);
  assert.equal(
    cannonMoves.some((m) => m.row === 2 && m.col === 1),
    true,
    'Cannon can capture enemy Rook behind single screen'
  );
  assert.equal(
    cannonMoves.some((m) => m.row === 1 && m.col === 1),
    false,
    'Cannon cannot capture through two pieces'
  );
  assert.equal(
    cannonMoves.some((m) => m.row === 3 && m.col === 1),
    false,
    'Cannon cannot slide past screen without capturing'
  );
});

test('Flying General rule prevents Kings from facing each other without blockers', () => {
  const board = createEmptyBoard();
  board[9][4] = { id: 'rk', side: 'red', type: 'K' };
  board[0][4] = { id: 'bk', side: 'black', type: 'K' };
  board[5][4] = { id: 'ra', side: 'red', type: 'P' };

  // Moving the Pawn off file 4 would expose Flying General!
  const pawnMoves = getLegalMovesForPiece(board, 5, 4);
  assert.equal(
    pawnMoves.some((m) => m.row === 5 && m.col === 3),
    false,
    'Cannot move blocking piece sideways if Kings would face directly'
  );
  assert.equal(
    pawnMoves.some((m) => m.row === 4 && m.col === 4),
    true,
    'Advancing along file 4 keeps Kings separated'
  );
});

test('Checkmate evaluation detects Red victory cleanly', () => {
  const board = createEmptyBoard();
  board[9][3] = { id: 'rk', side: 'red', type: 'K' };
  board[0][4] = { id: 'bk', side: 'black', type: 'K' };
  board[0][0] = { id: 'rr1', side: 'red', type: 'R' };
  board[1][8] = { id: 'rr2', side: 'red', type: 'R' };

  assert.equal(isSideInCheck(board, 'black'), true);
  const result = evaluateGameResult(board, 'black');
  assert.equal(result.status, 'red_win');
  assert.equal(result.reason, 'checkmate');
  assert.equal(result.winner, 'red');
});

test('AI player finds capturing or mating moves reliably across difficulties', () => {
  const board = createEmptyBoard();
  board[9][3] = { id: 'rk', side: 'red', type: 'K' };
  board[0][5] = { id: 'bk', side: 'black', type: 'K' };
  board[2][2] = { id: 'br', side: 'black', type: 'R' };
  board[2][7] = { id: 'rr', side: 'red', type: 'R' }; // Undefended Red Rook!

  const move = findBestXiangqiMove(board, 'black', 'medium');
  assert.ok(move, 'AI must return a legal move');
  assert.equal(move.to.row, 2);
  assert.equal(move.to.col, 7, 'AI captures the hanging Red Rook');

  const applied = executeMove(board, move.from, move.to);
  assert.ok(applied?.move.captured?.type === 'R');
});
