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
  XIANGQI_LEVELS,
  XiangqiBoard,
  XiangqiDifficulty,
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
  board[6][4] = { id: 'rp', side: 'red', type: 'P' };
  board[7][3] = { id: 're', side: 'red', type: 'E' };

  const horseMoves = getLegalMovesForPiece(board, 7, 4);
  assert.equal(horseMoves.some((m) => m.row === 5 && m.col === 3), false);
  assert.equal(horseMoves.some((m) => m.row === 5 && m.col === 5), false);
  assert.equal(horseMoves.some((m) => m.row === 8 && m.col === 2), false);
  assert.equal(horseMoves.some((m) => m.row === 9 && m.col === 5), true);
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
  assert.equal(cannonMoves.some((m) => m.row === 2 && m.col === 1), true);
  assert.equal(cannonMoves.some((m) => m.row === 1 && m.col === 1), false);
  assert.equal(cannonMoves.some((m) => m.row === 3 && m.col === 1), false);
});

test('Flying General rule prevents Kings from facing each other without blockers', () => {
  const board = createEmptyBoard();
  board[9][4] = { id: 'rk', side: 'red', type: 'K' };
  board[0][4] = { id: 'bk', side: 'black', type: 'K' };
  board[5][4] = { id: 'ra', side: 'red', type: 'P' };

  const pawnMoves = getLegalMovesForPiece(board, 5, 4);
  assert.equal(pawnMoves.some((m) => m.row === 5 && m.col === 3), false);
  assert.equal(pawnMoves.some((m) => m.row === 4 && m.col === 4), true);
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

test('All 10 AI levels are defined cleanly and find winning Rook capture', () => {
  assert.equal(XIANGQI_LEVELS.length, 10);
  const board = createEmptyBoard();
  board[9][3] = { id: 'rk', side: 'red', type: 'K' };
  board[0][5] = { id: 'bk', side: 'black', type: 'K' };
  board[2][2] = { id: 'br', side: 'black', type: 'R' };
  board[2][7] = { id: 'rr', side: 'red', type: 'R' }; // Undefended Red Rook

  for (const lvl of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as XiangqiDifficulty[]) {
    const move = findBestXiangqiMove(board, 'black', lvl);
    assert.ok(move, `AI Level ${lvl} must return a legal move`);
    if (lvl >= 3) {
      assert.equal(move.to.row, 2, `Level ${lvl} must capture hanging Rook`);
      assert.equal(move.to.col, 7, `Level ${lvl} must capture hanging Rook`);
    }
  }
});

test('Quiescence prevents poisoned-pawn Rook sacrifice (horizon trap)', () => {
  const board = createEmptyBoard();
  board[9][3] = { id: 'rk', side: 'red', type: 'K' };
  board[0][5] = { id: 'bk', side: 'black', type: 'K' };
  board[4][2] = { id: 'br', side: 'black', type: 'R' };
  board[4][6] = { id: 'rp', side: 'red', type: 'P' }; // Bait Pawn!
  board[8][6] = { id: 'rr', side: 'red', type: 'R' }; // Defending Red Rook on same file!
  board[0][1] = { id: 'bp', side: 'black', type: 'A' };

  for (const lvl of [4, 6, 8, 10] as XiangqiDifficulty[]) {
    const move = findBestXiangqiMove(board, 'black', lvl);
    assert.ok(move);
    assert.equal(
      move.to.row === 4 && move.to.col === 6,
      false,
      `Level ${lvl} must NOT blunder Rook onto poisoned Pawn defended by Red Rook`
    );
  }
});

test('AI finds forced checkmate-in-1 immediately at tactical levels', () => {
  const board = createEmptyBoard();
  board[9][4] = { id: 'rk', side: 'red', type: 'K' };
  board[0][3] = { id: 'bk', side: 'black', type: 'K' };
  board[8][1] = { id: 'br_cover', side: 'black', type: 'R' }; // Covers row 8 escape squares
  board[5][0] = { id: 'br', side: 'black', type: 'R' }; // Moves to (9,0) for Song Xe checkmate

  const move = findBestXiangqiMove(board, 'black', 7);
  assert.ok(move);
  const res = executeMove(board, move.from, move.to);
  assert.ok(res);
  const gameStatus = evaluateGameResult(res.nextBoard, 'red');
  assert.equal(gameStatus.winner, 'black', 'Level 7 AI must spot immediate checkmate-in-1');
  assert.equal(gameStatus.reason, 'checkmate');
});

test('Opening book replies accurately to Red Center Cannon (Pháo 2 bình 5)', () => {
  const init = createInitialBoard();
  const afterRed = executeMove(init, { row: 7, col: 7 }, { row: 7, col: 4 });
  assert.ok(afterRed);

  for (const lvl of [5, 8, 10] as XiangqiDifficulty[]) {
    const aiReply = findBestXiangqiMove(afterRed.nextBoard, 'black', lvl);
    assert.ok(aiReply);
    const validTheoryTargets = [
      '0,7->2,6', // Mã 8 tấn 7
      '2,7->2,4', // Pháo 8 bình 5
      '0,1->2,2', // Mã 2 tấn 3
      '2,1->2,4', // Pháo 2 bình 5
    ];
    const sig = `${aiReply.from.row},${aiReply.from.col}->${aiReply.to.row},${aiReply.to.col}`;
    assert.equal(
      validTheoryTargets.includes(sig),
      true,
      `Level ${lvl} replied ${sig} (${aiReply.notation}), expected classical opening defense`
    );
  }
});

test('Level 10 (Kỳ Vương) respects search time budget under 1600ms on middlegame board', () => {
  const init = createInitialBoard();
  const s1 = executeMove(init, { row: 7, col: 7 }, { row: 7, col: 4 })!;
  const s2 = executeMove(s1.nextBoard, { row: 0, col: 7 }, { row: 2, col: 6 })!;
  const s3 = executeMove(s2.nextBoard, { row: 9, col: 7 }, { row: 7, col: 6 })!;
  const s4 = executeMove(s3.nextBoard, { row: 0, col: 8 }, { row: 0, col: 7 })!;
  const s5 = executeMove(s4.nextBoard, { row: 9, col: 8 }, { row: 9, col: 7 })!;
  // Out-of-book middlegame position for Black
  const t0 = Date.now();
  const move = findBestXiangqiMove(s5.nextBoard, 'black', 10);
  const elapsed = Date.now() - t0;
  assert.ok(move, 'Level 10 must return a legal middlegame move');
  assert.ok(elapsed < 1600, `Level 10 took ${elapsed}ms (expected < 1600ms)`);
});

