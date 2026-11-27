import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOARD_SIZE,
  CHESS_LEVELS,
  ChessBoard,
  ChessDifficulty,
  ChessPosition,
  createInitialPosition,
  evaluateGameResult,
  executeMove,
  findBestChessMove,
  getAllLegalMoves,
  getLegalMovesForPiece,
  getPositionRepetitionKey,
  isPromotionMove,
  isSideInCheck,
} from './chessEngine';

function createEmptyPosition(sideToMove: 'white' | 'black' = 'white'): ChessPosition {
  const board: ChessBoard = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );
  return {
    board,
    sideToMove,
    castling: {
      whiteKingside: false,
      whiteQueenside: false,
      blackKingside: false,
      blackQueenside: false,
    },
    enPassantTarget: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
  };
}

test('Initial Chess board spawns 32 pieces and 20 legal White opening moves', () => {
  const pos = createInitialPosition();
  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (pos.board[r][c]) count++;
    }
  }
  assert.equal(count, 32);
  assert.equal(getAllLegalMoves(pos, 'white').length, 20);
});

test('Castling respects empty path, check, and attacked transit squares', () => {
  const pos = createEmptyPosition('white');
  pos.board[7][4] = { id: 'wk', side: 'white', type: 'K' };
  pos.board[7][7] = { id: 'wrh', side: 'white', type: 'R' };
  pos.board[7][0] = { id: 'wra', side: 'white', type: 'R' };
  pos.board[0][4] = { id: 'bk', side: 'black', type: 'K' };
  pos.castling.whiteKingside = true;
  pos.castling.whiteQueenside = true;

  // Both O-O (7,6) and O-O-O (7,2) are legal when unobstructed & unattacked
  let kingMoves = getLegalMovesForPiece(pos, 7, 4);
  assert.equal(kingMoves.some((m) => m.row === 7 && m.col === 6), true);
  assert.equal(kingMoves.some((m) => m.row === 7 && m.col === 2), true);

  // Put Black Rook attacking f1 (7,5) -> blocks kingside castling only
  pos.board[2][5] = { id: 'br', side: 'black', type: 'R' };
  kingMoves = getLegalMovesForPiece(pos, 7, 4);
  assert.equal(kingMoves.some((m) => m.row === 7 && m.col === 6), false);
  assert.equal(kingMoves.some((m) => m.row === 7 && m.col === 2), true);

  // Execute queenside castling and verify Rook moves to d1 (7,3)
  const castled = executeMove(pos, { row: 7, col: 4 }, { row: 7, col: 2 });
  assert.ok(castled);
  assert.equal(castled.move.notation, 'O-O-O');
  assert.equal(castled.nextPosition.board[7][2]?.type, 'K');
  assert.equal(castled.nextPosition.board[7][3]?.type, 'R');
  assert.equal(castled.nextPosition.castling.whiteKingside, false);
  assert.equal(castled.nextPosition.castling.whiteQueenside, false);
});

test('En passant capture removes enemy pawn and clears target next turn', () => {
  let pos = createInitialPosition();
  pos = executeMove(pos, { row: 6, col: 4 }, { row: 4, col: 4 })!.nextPosition; // e4
  pos = executeMove(pos, { row: 1, col: 0 }, { row: 2, col: 0 })!.nextPosition; // a6
  pos = executeMove(pos, { row: 4, col: 4 }, { row: 3, col: 4 })!.nextPosition; // e5
  pos = executeMove(pos, { row: 1, col: 3 }, { row: 3, col: 3 })!.nextPosition; // d5

  assert.deepEqual(pos.enPassantTarget, { row: 2, col: 3 });
  const epLegal = getLegalMovesForPiece(pos, 3, 4);
  assert.equal(epLegal.some((m) => m.row === 2 && m.col === 3), true);

  const epRes = executeMove(pos, { row: 3, col: 4 }, { row: 2, col: 3 });
  assert.ok(epRes);
  assert.equal(epRes.move.isEnPassant, true);
  assert.equal(epRes.move.notation, 'exd6');
  assert.equal(epRes.nextPosition.board[3][3], null);
  assert.equal(epRes.nextPosition.board[2][3]?.side, 'white');
  assert.equal(epRes.nextPosition.enPassantTarget, null);
});

test('Pawn promotion detects promotion square and supports Q/N underpromotion', () => {
  const pos = createEmptyPosition('white');
  pos.board[7][4] = { id: 'wk', side: 'white', type: 'K' };
  pos.board[0][0] = { id: 'bk', side: 'black', type: 'K' };
  pos.board[1][4] = { id: 'wp', side: 'white', type: 'P' };

  assert.equal(isPromotionMove(pos, { row: 1, col: 4 }, { row: 0, col: 4 }), true);
  const knightPromo = executeMove(pos, { row: 1, col: 4 }, { row: 0, col: 4 }, 'N');
  assert.ok(knightPromo);
  assert.equal(knightPromo.nextPosition.board[0][4]?.type, 'N');
  assert.equal(knightPromo.move.notation, 'e8=N');
});

test('Pinned piece cannot expose own King to check', () => {
  const pos = createEmptyPosition('white');
  pos.board[7][4] = { id: 'wk', side: 'white', type: 'K' };
  pos.board[5][4] = { id: 'wr', side: 'white', type: 'R' };
  pos.board[0][4] = { id: 'br', side: 'black', type: 'R' };
  pos.board[0][0] = { id: 'bk', side: 'black', type: 'K' };

  const rookMoves = getLegalMovesForPiece(pos, 5, 4);
  assert.equal(rookMoves.some((m) => m.row === 5 && m.col === 5), false);
  assert.equal(rookMoves.some((m) => m.row === 0 && m.col === 4), true);
});

test('Checkmate, Stalemate, Insufficient Material, and Threefold Repetition evaluate accurately', () => {
  // Fool's mate
  let pos = createInitialPosition();
  pos = executeMove(pos, { row: 6, col: 5 }, { row: 5, col: 5 })!.nextPosition; // f3
  pos = executeMove(pos, { row: 1, col: 4 }, { row: 3, col: 4 })!.nextPosition; // e5
  pos = executeMove(pos, { row: 6, col: 6 }, { row: 4, col: 6 })!.nextPosition; // g4
  const mateStep = executeMove(pos, { row: 0, col: 3 }, { row: 4, col: 7 })!; // Qh4#
  assert.equal(mateStep.move.isCheckmate, true);
  assert.equal(mateStep.move.notation, 'Qh4#');
  assert.equal(isSideInCheck(mateStep.nextPosition.board, 'white'), true);
  const mateResult = evaluateGameResult(mateStep.nextPosition);
  assert.equal(mateResult.status, 'black_win');
  assert.equal(mateResult.reason, 'checkmate');

  // Stalemate
  const stalePos = createEmptyPosition('black');
  stalePos.board[0][7] = { id: 'bk', side: 'black', type: 'K' };
  stalePos.board[1][5] = { id: 'wq', side: 'white', type: 'Q' };
  stalePos.board[2][6] = { id: 'wk', side: 'white', type: 'K' };
  const staleRes = evaluateGameResult(stalePos);
  assert.equal(staleRes.status, 'draw');
  assert.equal(staleRes.reason, 'stalemate');

  // Insufficient material (K+B vs K)
  const insPos = createEmptyPosition('white');
  insPos.board[7][4] = { id: 'wk', side: 'white', type: 'K' };
  insPos.board[7][5] = { id: 'wb', side: 'white', type: 'B' };
  insPos.board[0][4] = { id: 'bk', side: 'black', type: 'K' };
  assert.equal(evaluateGameResult(insPos).reason, 'insufficient_material');

  // Threefold repetition
  const repPos = createEmptyPosition('white');
  repPos.board[7][4] = { id: 'wk', side: 'white', type: 'K' };
  repPos.board[7][0] = { id: 'wr', side: 'white', type: 'R' };
  repPos.board[0][4] = { id: 'bk', side: 'black', type: 'K' };
  const k = getPositionRepetitionKey(repPos);
  assert.equal(evaluateGameResult(repPos, [k, k, k]).reason, 'threefold_repetition');
});

test('All 10 Chess AI levels are defined cleanly and capture hanging Queen', () => {
  assert.equal(CHESS_LEVELS.length, 10);
  const pos = createEmptyPosition('black');
  pos.board[0][4] = { id: 'bk', side: 'black', type: 'K' };
  pos.board[7][4] = { id: 'wk', side: 'white', type: 'K' };
  pos.board[3][3] = { id: 'br', side: 'black', type: 'R' };
  pos.board[3][6] = { id: 'wq', side: 'white', type: 'Q' }; // Undefended White Queen

  for (const lvl of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as ChessDifficulty[]) {
    const move = findBestChessMove(pos, lvl);
    assert.ok(move, `AI Level ${lvl} must return a legal move`);
    if (lvl >= 3) {
      assert.equal(move.to.row, 3, `Level ${lvl} must capture hanging Queen`);
      assert.equal(move.to.col, 6, `Level ${lvl} must capture hanging Queen`);
    }
  }
});

test('Quiescence prevents poisoned-pawn Queen sacrifice (horizon trap)', () => {
  const pos = createEmptyPosition('black');
  pos.board[0][4] = { id: 'bk', side: 'black', type: 'K' };
  pos.board[7][4] = { id: 'wk', side: 'white', type: 'K' };
  pos.board[2][2] = { id: 'bq', side: 'black', type: 'Q' };
  pos.board[4][4] = { id: 'wp', side: 'white', type: 'P' }; // Defended by White Rook on e1
  pos.board[7][3] = { id: 'wr', side: 'white', type: 'R' };
  pos.board[5][3] = { id: 'wb', side: 'white', type: 'B' }; // Bishop defends e4 (4,4)!

  for (const lvl of [4, 6, 8, 10] as ChessDifficulty[]) {
    const move = findBestChessMove(pos, lvl);
    assert.ok(move);
    assert.equal(
      move.to.row === 4 && move.to.col === 4,
      false,
      `Level ${lvl} must NOT blunder Queen onto defended Pawn`
    );
  }
});

test('AI finds forced checkmate-in-1 immediately at tactical levels', () => {
  const pos = createEmptyPosition('black');
  pos.board[7][7] = { id: 'wk', side: 'white', type: 'K' };
  pos.board[6][6] = { id: 'wp1', side: 'white', type: 'P' };
  pos.board[6][7] = { id: 'wp2', side: 'white', type: 'P' };
  pos.board[0][4] = { id: 'bk', side: 'black', type: 'K' };
  pos.board[4][0] = { id: 'br', side: 'black', type: 'R' }; // Ra1# back-rank mate

  const move = findBestChessMove(pos, 7);
  assert.ok(move);
  assert.equal(move.isCheckmate, true);
  assert.equal(move.to.row, 7);
  assert.equal(move.to.col, 0);
});

test('Opening book replies accurately to 1. e4', () => {
  const init = createInitialPosition();
  const afterE4 = executeMove(init, { row: 6, col: 4 }, { row: 4, col: 4 })!;
  for (const lvl of [5, 8, 10] as ChessDifficulty[]) {
    const reply = findBestChessMove(afterE4.nextPosition, lvl);
    assert.ok(reply);
    assert.equal(
      ['e5', 'c5', 'e6', 'c6'].includes(reply.notation),
      true,
      `Level ${lvl} replied ${reply.notation}, expected standard 1.e4 defense`
    );
  }
});

test('Level 10 (Kỳ Vương) respects search time budget under 1600ms on middlegame board', () => {
  let pos = createInitialPosition();
  pos = executeMove(pos, { row: 6, col: 4 }, { row: 4, col: 4 })!.nextPosition; // e4
  pos = executeMove(pos, { row: 1, col: 4 }, { row: 3, col: 4 })!.nextPosition; // e5
  pos = executeMove(pos, { row: 7, col: 6 }, { row: 5, col: 5 })!.nextPosition; // Nf3
  pos = executeMove(pos, { row: 0, col: 1 }, { row: 2, col: 2 })!.nextPosition; // Nc6
  pos = executeMove(pos, { row: 7, col: 5 }, { row: 4, col: 2 })!.nextPosition; // Bc4
  pos = executeMove(pos, { row: 0, col: 5 }, { row: 3, col: 2 })!.nextPosition; // Bc5

  const t0 = Date.now();
  const move = findBestChessMove(pos, 10);
  const elapsed = Date.now() - t0;
  assert.ok(move, 'Level 10 must return a legal middlegame move');
  assert.ok(elapsed < 1600, `Level 10 took ${elapsed}ms (expected < 1600ms)`);
});
