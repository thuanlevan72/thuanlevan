export type XiangqiSide = 'red' | 'black';

export type XiangqiPieceType = 'K' | 'A' | 'E' | 'H' | 'R' | 'C' | 'P';

export type XiangqiDifficulty = 'easy' | 'medium' | 'hard';

export interface XiangqiPiece {
  id: string;
  side: XiangqiSide;
  type: XiangqiPieceType;
}

export type XiangqiBoard = (XiangqiPiece | null)[][];

export interface BoardCoord {
  row: number; // 0 (Black baseline) .. 9 (Red baseline)
  col: number; // 0 .. 8
}

export interface XiangqiMove {
  from: BoardCoord;
  to: BoardCoord;
  piece: XiangqiPiece;
  captured: XiangqiPiece | null;
  notation: string;
  isCheck?: boolean;
}

export interface XiangqiGameResult {
  status: 'ongoing' | 'red_win' | 'black_win' | 'draw';
  reason: 'checkmate' | 'stalemate' | 'insufficient_material' | 'fifty_move_rule' | null;
  winner: XiangqiSide | null;
}

export const BOARD_ROWS = 10;
export const BOARD_COLS = 9;

export const PIECE_DISPLAY_INFO: Record<
  XiangqiSide,
  Record<XiangqiPieceType, { hanzi: string; viName: string; shortVi: string }>
> = {
  red: {
    K: { hanzi: '帥', viName: 'Tướng Đỏ (Soái)', shortVi: 'Tướng' },
    A: { hanzi: '仕', viName: 'Sĩ Đỏ', shortVi: 'Sĩ' },
    E: { hanzi: '相', viName: 'Tượng Đỏ', shortVi: 'Tượng' },
    H: { hanzi: '傌', viName: 'Mã Đỏ', shortVi: 'Mã' },
    R: { hanzi: '俥', viName: 'Xe Đỏ', shortVi: 'Xe' },
    C: { hanzi: '炮', viName: 'Pháo Đỏ', shortVi: 'Pháo' },
    P: { hanzi: '兵', viName: 'Tốt Đỏ (Binh)', shortVi: 'Tốt' },
  },
  black: {
    K: { hanzi: '將', viName: 'Tướng Đen', shortVi: 'Tướng' },
    A: { hanzi: '士', viName: 'Sĩ Đen', shortVi: 'Sĩ' },
    E: { hanzi: '象', viName: 'Tượng Đen', shortVi: 'Tượng' },
    H: { hanzi: '馬', viName: 'Mã Đen', shortVi: 'Mã' },
    R: { hanzi: '車', viName: 'Xe Đen', shortVi: 'Xe' },
    C: { hanzi: '砲', viName: 'Pháo Đen', shortVi: 'Pháo' },
    P: { hanzi: '卒', viName: 'Tốt Đen (Tốt)', shortVi: 'Tốt' },
  },
};

export const PIECE_MATERIAL_VALUE: Record<XiangqiPieceType, number> = {
  K: 10000,
  R: 900,
  C: 450,
  H: 400,
  E: 200,
  A: 200,
  P: 100,
};

const PAWN_PST_RED: readonly number[][] = [
  [0, 3, 6, 9, 12, 9, 6, 3, 0],
  [18, 36, 56, 80, 96, 80, 56, 36, 18],
  [14, 26, 42, 60, 74, 60, 42, 26, 14],
  [10, 20, 30, 36, 44, 36, 30, 20, 10],
  [6, 12, 18, 22, 26, 22, 18, 12, 6],
  [2, 0, 4, 0, 8, 0, 4, 0, 2],
  [0, 0, -2, 0, 4, 0, -2, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const CHARIOT_PST_RED: readonly number[][] = [
  [14, 14, 12, 18, 16, 18, 12, 14, 14],
  [16, 20, 18, 24, 26, 24, 18, 20, 16],
  [12, 12, 12, 18, 18, 18, 12, 12, 12],
  [12, 18, 16, 22, 22, 22, 16, 18, 12],
  [12, 14, 12, 18, 18, 18, 12, 14, 12],
  [12, 16, 14, 20, 20, 20, 14, 16, 12],
  [6, 10, 8, 14, 14, 14, 8, 10, 6],
  [4, 8, 6, 14, 12, 14, 6, 8, 4],
  [8, 4, 8, 16, 8, 16, 8, 4, 8],
  [-2, 10, 6, 14, 12, 14, 6, 10, -2],
];

const HORSE_PST_RED: readonly number[][] = [
  [4, 8, 16, 12, 4, 12, 16, 8, 4],
  [4, 10, 28, 16, 8, 16, 28, 10, 4],
  [12, 14, 16, 20, 18, 20, 16, 14, 12],
  [8, 24, 18, 24, 20, 24, 18, 24, 8],
  [6, 16, 14, 18, 16, 18, 14, 16, 6],
  [4, 12, 16, 14, 12, 14, 16, 12, 4],
  [2, 6, 8, 6, 10, 6, 8, 6, 2],
  [4, 2, 8, 8, 4, 8, 8, 2, 4],
  [0, 2, 4, 4, -4, 4, 4, 2, 0],
  [0, -4, 0, 0, 0, 0, 0, -4, 0],
];

const CANNON_PST_RED: readonly number[][] = [
  [6, 4, 0, -10, -12, -10, 0, 4, 6],
  [2, 2, 0, -4, -14, -4, 0, 2, 2],
  [2, 2, 0, -10, -8, -10, 0, 2, 2],
  [0, 0, -2, 4, 10, 4, -2, 0, 0],
  [0, 0, 0, 2, 8, 2, 0, 0, 0],
  [-2, 0, 4, 2, 6, 2, 4, 0, -2],
  [0, 0, 0, 2, 4, 2, 0, 0, 0],
  [4, 0, 8, 6, 12, 6, 8, 0, 4],
  [0, 2, 4, 6, 6, 6, 4, 2, 0],
  [0, 0, 2, 6, 6, 6, 2, 0, 0],
];

export function createInitialBoard(): XiangqiBoard {
  const board: XiangqiBoard = Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => null)
  );

  const place = (row: number, col: number, side: XiangqiSide, type: XiangqiPieceType, tag: string) => {
    board[row][col] = { id: `${side}-${type}-${tag}`, side, type };
  };

  // Black (top, rows 0..3)
  place(0, 0, 'black', 'R', 'l');
  place(0, 1, 'black', 'H', 'l');
  place(0, 2, 'black', 'E', 'l');
  place(0, 3, 'black', 'A', 'l');
  place(0, 4, 'black', 'K', 'c');
  place(0, 5, 'black', 'A', 'r');
  place(0, 6, 'black', 'E', 'r');
  place(0, 7, 'black', 'H', 'r');
  place(0, 8, 'black', 'R', 'r');
  place(2, 1, 'black', 'C', 'l');
  place(2, 7, 'black', 'C', 'r');
  place(3, 0, 'black', 'P', '1');
  place(3, 2, 'black', 'P', '2');
  place(3, 4, 'black', 'P', '3');
  place(3, 6, 'black', 'P', '4');
  place(3, 8, 'black', 'P', '5');

  // Red (bottom, rows 6..9)
  place(9, 0, 'red', 'R', 'l');
  place(9, 1, 'red', 'H', 'l');
  place(9, 2, 'red', 'E', 'l');
  place(9, 3, 'red', 'A', 'l');
  place(9, 4, 'red', 'K', 'c');
  place(9, 5, 'red', 'A', 'r');
  place(9, 6, 'red', 'E', 'r');
  place(9, 7, 'red', 'H', 'r');
  place(9, 8, 'red', 'R', 'r');
  place(7, 1, 'red', 'C', 'l');
  place(7, 7, 'red', 'C', 'r');
  place(6, 0, 'red', 'P', '1');
  place(6, 2, 'red', 'P', '2');
  place(6, 4, 'red', 'P', '3');
  place(6, 6, 'red', 'P', '4');
  place(6, 8, 'red', 'P', '5');

  return board;
}

export function cloneBoard(board: XiangqiBoard): XiangqiBoard {
  return board.map((row) => row.slice());
}

export function isInsideBoard(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS;
}

export function isInsidePalace(row: number, col: number, side: XiangqiSide): boolean {
  if (col < 3 || col > 5) return false;
  return side === 'red' ? row >= 7 && row <= 9 : row >= 0 && row <= 2;
}

export function isSameSideHalf(row: number, side: XiangqiSide): boolean {
  return side === 'red' ? row >= 5 : row <= 4;
}

export function getOppositeSide(side: XiangqiSide): XiangqiSide {
  return side === 'red' ? 'black' : 'red';
}

export function findKingPosition(board: XiangqiBoard, side: XiangqiSide): BoardCoord | null {
  const rowStart = side === 'red' ? 7 : 0;
  const rowEnd = side === 'red' ? 9 : 2;
  for (let r = rowStart; r <= rowEnd; r++) {
    for (let c = 3; c <= 5; c++) {
      const piece = board[r][c];
      if (piece && piece.side === side && piece.type === 'K') {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

export function areKingsFacing(board: XiangqiBoard): boolean {
  const redKing = findKingPosition(board, 'red');
  const blackKing = findKingPosition(board, 'black');
  if (!redKing || !blackKing || redKing.col !== blackKing.col) {
    return false;
  }
  const col = redKing.col;
  for (let r = blackKing.row + 1; r < redKing.row; r++) {
    if (board[r][col] !== null) {
      return false;
    }
  }
  return true;
}

export function formatMoveNotation(
  piece: XiangqiPiece,
  from: BoardCoord,
  to: BoardCoord,
  captured: XiangqiPiece | null
): string {
  const name = PIECE_DISPLAY_INFO[piece.side][piece.type].shortVi;
  // Standard Xiangqi file numbering from each player's right (1..9)
  const fileNum = (col: number) => (piece.side === 'red' ? 9 - col : col + 1);
  const f1 = fileNum(from.col);
  const f2 = fileNum(to.col);

  let action: string;
  let targetStr: string;

  if (from.row === to.row) {
    action = 'bình';
    targetStr = String(f2);
  } else {
    const advancing = piece.side === 'red' ? to.row < from.row : to.row > from.row;
    action = advancing ? 'tấn' : 'thoái';
    if (piece.type === 'H' || piece.type === 'E' || piece.type === 'A') {
      targetStr = String(f2);
    } else {
      targetStr = String(Math.abs(to.row - from.row));
    }
  }

  return `${name} ${f1} ${action} ${targetStr}${captured ? ' (ăn)' : ''}`;
}

function getPseudoMovesForPiece(board: XiangqiBoard, row: number, col: number): BoardCoord[] {
  const piece = board[row][col];
  if (!piece) return [];
  const moves: BoardCoord[] = [];
  const { side, type } = piece;

  const canLand = (r: number, c: number): boolean => {
    if (!isInsideBoard(r, c)) return false;
    const target = board[r][c];
    return target === null || target.side !== side;
  };

  if (type === 'K') {
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const [dr, dc] of dirs) {
      const nr = row + dr;
      const nc = col + dc;
      if (isInsidePalace(nr, nc, side) && canLand(nr, nc)) {
        moves.push({ row: nr, col: nc });
      }
    }
  } else if (type === 'A') {
    const dirs = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    for (const [dr, dc] of dirs) {
      const nr = row + dr;
      const nc = col + dc;
      if (isInsidePalace(nr, nc, side) && canLand(nr, nc)) {
        moves.push({ row: nr, col: nc });
      }
    }
  } else if (type === 'E') {
    const dirs = [
      [-2, -2],
      [-2, 2],
      [2, -2],
      [2, 2],
    ];
    for (const [dr, dc] of dirs) {
      const nr = row + dr;
      const nc = col + dc;
      const eyeR = row + dr / 2;
      const eyeC = col + dc / 2;
      if (
        isInsideBoard(nr, nc) &&
        isSameSideHalf(nr, side) &&
        board[eyeR][eyeC] === null &&
        canLand(nr, nc)
      ) {
        moves.push({ row: nr, col: nc });
      }
    }
  } else if (type === 'H') {
    const jumps: readonly [number, number, number, number][] = [
      [-2, -1, -1, 0],
      [-2, 1, -1, 0],
      [2, -1, 1, 0],
      [2, 1, 1, 0],
      [-1, -2, 0, -1],
      [1, -2, 0, -1],
      [-1, 2, 0, 1],
      [1, 2, 0, 1],
    ];
    for (const [dr, dc, lr, lc] of jumps) {
      const nr = row + dr;
      const nc = col + dc;
      const legR = row + lr;
      const legC = col + lc;
      if (isInsideBoard(nr, nc) && board[legR][legC] === null && canLand(nr, nc)) {
        moves.push({ row: nr, col: nc });
      }
    }
  } else if (type === 'R') {
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const [dr, dc] of dirs) {
      let nr = row + dr;
      let nc = col + dc;
      while (isInsideBoard(nr, nc)) {
        const occ = board[nr][nc];
        if (occ === null) {
          moves.push({ row: nr, col: nc });
        } else {
          if (occ.side !== side) {
            moves.push({ row: nr, col: nc });
          }
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  } else if (type === 'C') {
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const [dr, dc] of dirs) {
      let nr = row + dr;
      let nc = col + dc;
      let jumped = false;
      while (isInsideBoard(nr, nc)) {
        const occ = board[nr][nc];
        if (!jumped) {
          if (occ === null) {
            moves.push({ row: nr, col: nc });
          } else {
            jumped = true;
          }
        } else if (occ !== null) {
          if (occ.side !== side) {
            moves.push({ row: nr, col: nc });
          }
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  } else if (type === 'P') {
    const forwardDr = side === 'red' ? -1 : 1;
    if (canLand(row + forwardDr, col)) {
      moves.push({ row: row + forwardDr, col });
    }
    const crossedRiver = side === 'red' ? row <= 4 : row >= 5;
    if (crossedRiver) {
      if (canLand(row, col - 1)) moves.push({ row, col: col - 1 });
      if (canLand(row, col + 1)) moves.push({ row, col: col + 1 });
    }
  }

  return moves;
}

export function isSquareAttackedBy(
  board: XiangqiBoard,
  targetRow: number,
  targetCol: number,
  attackerSide: XiangqiSide
): boolean {
  // Check orthogonal rays for Rooks, Cannons, and enemy Kings (flying general)
  const orthoDirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dr, dc] of orthoDirs) {
    let nr = targetRow + dr;
    let nc = targetCol + dc;
    let blockers = 0;
    while (isInsideBoard(nr, nc)) {
      const occ = board[nr][nc];
      if (occ !== null) {
        if (blockers === 0) {
          if (occ.side === attackerSide && (occ.type === 'R' || occ.type === 'K')) {
            return true;
          }
          blockers = 1;
        } else {
          if (occ.side === attackerSide && occ.type === 'C') {
            return true;
          }
          break;
        }
      }
      nr += dr;
      nc += dc;
    }
  }

  // Check Horse attacks (reverse-check attacker's horse leg!)
  const horseChecks: readonly [number, number, number, number][] = [
    [-2, -1, -1, -1],
    [-2, 1, -1, 1],
    [2, -1, 1, -1],
    [2, 1, 1, 1],
    [-1, -2, -1, -1],
    [1, -2, 1, -1],
    [-1, 2, -1, 1],
    [1, 2, 1, 1],
  ];
  for (const [dr, dc, lr, lc] of horseChecks) {
    const hr = targetRow + dr;
    const hc = targetCol + dc;
    if (!isInsideBoard(hr, hc)) continue;
    const piece = board[hr][hc];
    if (piece && piece.side === attackerSide && piece.type === 'H') {
      if (board[targetRow + lr][targetCol + lc] === null) {
        return true;
      }
    }
  }

  // Check Pawn attacks
  const pawnOriginDr = attackerSide === 'red' ? 1 : -1;
  const checkPawnAt = (r: number, c: number) => {
    if (!isInsideBoard(r, c)) return false;
    const p = board[r][c];
    return p !== null && p.side === attackerSide && p.type === 'P';
  };
  if (checkPawnAt(targetRow + pawnOriginDr, targetCol)) return true;
  if (!isSameSideHalf(targetRow, attackerSide)) {
    if (checkPawnAt(targetRow, targetCol - 1) || checkPawnAt(targetRow, targetCol + 1)) {
      return true;
    }
  }

  return false;
}

export function isSideInCheck(board: XiangqiBoard, side: XiangqiSide): boolean {
  const kingPos = findKingPosition(board, side);
  if (!kingPos) return true;
  if (areKingsFacing(board)) return true;
  return isSquareAttackedBy(board, kingPos.row, kingPos.col, getOppositeSide(side));
}

export function applyBoardMoveInPlace(
  board: XiangqiBoard,
  from: BoardCoord,
  to: BoardCoord
): XiangqiPiece | null {
  const moving = board[from.row][from.col];
  const captured = board[to.row][to.col];
  board[to.row][to.col] = moving;
  board[from.row][from.col] = null;
  return captured;
}

export function revertBoardMoveInPlace(
  board: XiangqiBoard,
  from: BoardCoord,
  to: BoardCoord,
  captured: XiangqiPiece | null
): void {
  board[from.row][from.col] = board[to.row][to.col];
  board[to.row][to.col] = captured;
}

export function getLegalMovesForPiece(
  board: XiangqiBoard,
  fromRow: number,
  fromCol: number
): BoardCoord[] {
  const piece = board[fromRow][fromCol];
  if (!piece) return [];

  const pseudo = getPseudoMovesForPiece(board, fromRow, fromCol);
  const legal: BoardCoord[] = [];
  const work = cloneBoard(board);
  const from = { row: fromRow, col: fromCol };

  for (const to of pseudo) {
    const cap = applyBoardMoveInPlace(work, from, to);
    if (!isSideInCheck(work, piece.side)) {
      legal.push(to);
    }
    revertBoardMoveInPlace(work, from, to, cap);
  }
  return legal;
}

export function getAllLegalMoves(board: XiangqiBoard, side: XiangqiSide): XiangqiMove[] {
  const moves: XiangqiMove[] = [];
  const work = cloneBoard(board);

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = work[r][c];
      if (!piece || piece.side !== side) continue;
      const pseudo = getPseudoMovesForPiece(work, r, c);
      const from = { row: r, col: c };
      for (const to of pseudo) {
        const cap = applyBoardMoveInPlace(work, from, to);
        if (!isSideInCheck(work, side)) {
          moves.push({
            from,
            to,
            piece,
            captured: cap,
            notation: '',
          });
        }
        revertBoardMoveInPlace(work, from, to, cap);
      }
    }
  }
  return moves;
}

export function hasInsufficientMaterial(board: XiangqiBoard): boolean {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (p.type === 'R' || p.type === 'H' || p.type === 'C' || p.type === 'P') {
        return false;
      }
    }
  }
  return true;
}

export function evaluateGameResult(
  board: XiangqiBoard,
  sideToMove: XiangqiSide,
  pliesWithoutCapture = 0
): XiangqiGameResult {
  if (pliesWithoutCapture >= 100) {
    return { status: 'draw', reason: 'fifty_move_rule', winner: null };
  }
  if (hasInsufficientMaterial(board)) {
    return { status: 'draw', reason: 'insufficient_material', winner: null };
  }

  const legalMoves = getAllLegalMoves(board, sideToMove);
  if (legalMoves.length === 0) {
    const inCheck = isSideInCheck(board, sideToMove);
    const winner = getOppositeSide(sideToMove);
    return {
      status: winner === 'red' ? 'red_win' : 'black_win',
      reason: inCheck ? 'checkmate' : 'stalemate',
      winner,
    };
  }

  return { status: 'ongoing', reason: null, winner: null };
}

export function executeMove(
  board: XiangqiBoard,
  from: BoardCoord,
  to: BoardCoord
): { nextBoard: XiangqiBoard; move: XiangqiMove } | null {
  const piece = board[from.row][from.col];
  if (!piece) return null;
  const legal = getLegalMovesForPiece(board, from.row, from.col);
  if (!legal.some((m) => m.row === to.row && m.col === to.col)) {
    return null;
  }

  const nextBoard = cloneBoard(board);
  const captured = nextBoard[to.row][to.col];
  nextBoard[to.row][to.col] = piece;
  nextBoard[from.row][from.col] = null;

  const enemyInCheck = isSideInCheck(nextBoard, getOppositeSide(piece.side));
  const move: XiangqiMove = {
    from,
    to,
    piece,
    captured,
    notation: formatMoveNotation(piece, from, to, captured),
    isCheck: enemyInCheck,
  };

  return { nextBoard, move };
}

function getPiecePstBonus(piece: XiangqiPiece, row: number, col: number): number {
  const r = piece.side === 'red' ? row : 9 - row;
  switch (piece.type) {
    case 'P':
      return PAWN_PST_RED[r][col];
    case 'R':
      return CHARIOT_PST_RED[r][col];
    case 'H':
      return HORSE_PST_RED[r][col];
    case 'C':
      return CANNON_PST_RED[r][col];
    case 'A':
      return r === 8 && col === 4 ? 12 : 4;
    case 'E':
      return r === 7 && (col === 4 || col === 0 || col === 8) ? 8 : 4;
    default:
      return 0;
  }
}

export function evaluateBoardScore(board: XiangqiBoard, perspective: XiangqiSide): number {
  let score = 0;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const p = board[r][c];
      if (!p) continue;
      const val = PIECE_MATERIAL_VALUE[p.type] + getPiecePstBonus(p, r, c);
      if (p.side === perspective) {
        score += val;
      } else {
        score -= val;
      }
    }
  }
  return score;
}

function scoreMoveOrdering(move: XiangqiMove): number {
  let s = 0;
  if (move.captured) {
    s += PIECE_MATERIAL_VALUE[move.captured.type] * 10 - PIECE_MATERIAL_VALUE[move.piece.type];
  }
  // Center column bias
  s += 12 - Math.abs(4 - move.to.col) * 2;
  return s;
}

function alphaBeta(
  board: XiangqiBoard,
  depth: number,
  alpha: number,
  beta: number,
  maximizingSide: XiangqiSide,
  currentSide: XiangqiSide,
  deadlineMs: number
): number {
  if (depth <= 0 || Date.now() >= deadlineMs) {
    return evaluateBoardScore(board, maximizingSide);
  }

  const moves = getAllLegalMoves(board, currentSide);
  if (moves.length === 0) {
    // Side to move lost
    return currentSide === maximizingSide ? -20000 - depth * 50 : 20000 + depth * 50;
  }

  moves.sort((a, b) => scoreMoveOrdering(b) - scoreMoveOrdering(a));

  const isMax = currentSide === maximizingSide;
  const nextSide = getOppositeSide(currentSide);

  if (isMax) {
    let best = -Infinity;
    for (const move of moves) {
      const cap = applyBoardMoveInPlace(board, move.from, move.to);
      const val = alphaBeta(board, depth - 1, alpha, beta, maximizingSide, nextSide, deadlineMs);
      revertBoardMoveInPlace(board, move.from, move.to, cap);
      if (val > best) best = val;
      if (best > alpha) alpha = best;
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const cap = applyBoardMoveInPlace(board, move.from, move.to);
      const val = alphaBeta(board, depth - 1, alpha, beta, maximizingSide, nextSide, deadlineMs);
      revertBoardMoveInPlace(board, move.from, move.to, cap);
      if (val < best) best = val;
      if (best < beta) beta = best;
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function findBestXiangqiMove(
  board: XiangqiBoard,
  aiSide: XiangqiSide,
  difficulty: XiangqiDifficulty
): XiangqiMove | null {
  const legalMoves = getAllLegalMoves(board, aiSide);
  if (legalMoves.length === 0) return null;

  legalMoves.sort((a, b) => scoreMoveOrdering(b) - scoreMoveOrdering(a));

  const depth = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
  const timeBudgetMs = difficulty === 'hard' ? 380 : difficulty === 'medium' ? 180 : 60;
  const deadlineMs = Date.now() + timeBudgetMs;

  const work = cloneBoard(board);
  const opponentSide = getOppositeSide(aiSide);

  let bestScore = -Infinity;
  let scoredMoves: { move: XiangqiMove; score: number }[] = [];

  for (const move of legalMoves) {
    const cap = applyBoardMoveInPlace(work, move.from, move.to);
    const val = alphaBeta(work, depth - 1, -Infinity, Infinity, aiSide, opponentSide, deadlineMs);
    revertBoardMoveInPlace(work, move.from, move.to, cap);
    scoredMoves.push({ move, score: val });
    if (val > bestScore) {
      bestScore = val;
    }
    if (Date.now() >= deadlineMs && scoredMoves.length >= 4) {
      break;
    }
  }

  scoredMoves.sort((a, b) => b.score - a.score);

  let chosen = scoredMoves[0].move;
  // On 'easy', occasionally pick between top 3 close tactical moves for humanlike variety
  if (difficulty === 'easy' && scoredMoves.length > 1) {
    const topPool = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
    const threshold = topPool[0].score - 180;
    const candidates = topPool.filter((item) => item.score >= threshold);
    chosen = candidates[Math.floor(Math.random() * candidates.length)].move;
  }

  const executed = executeMove(board, chosen.from, chosen.to);
  return executed ? executed.move : chosen;
}
