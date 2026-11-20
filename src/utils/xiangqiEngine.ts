export type XiangqiSide = 'red' | 'black';

export type XiangqiPieceType = 'K' | 'A' | 'E' | 'H' | 'R' | 'C' | 'P';

export type XiangqiDifficulty = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type LegacyXiangqiDifficulty = 'easy' | 'medium' | 'hard';

export interface XiangqiLevelConfig {
  level: XiangqiDifficulty;
  name: string;
  badge: string;
  summary: string;
  depth: number;
  quiescenceDepth: number;
  timeBudgetMs: number;
  noiseCp: number;
  mistakeRate: number;
  useBook: boolean;
  useLmr: boolean;
  useNullMove: boolean;
}

export const XIANGQI_LEVELS: readonly XiangqiLevelConfig[] = [
  {
    level: 1,
    name: 'Tân Binh',
    badge: 'Cấp 1',
    summary: 'Mới làm quen · Thỉnh thoảng sơ hở để bạn tập chiếu bí',
    depth: 1,
    quiescenceDepth: 0,
    timeBudgetMs: 45,
    noiseCp: 240,
    mistakeRate: 0.28,
    useBook: false,
    useLmr: false,
    useNullMove: false,
  },
  {
    level: 2,
    name: 'Nhập Môn',
    badge: 'Cấp 2',
    summary: 'Nhận biết ăn lại quân · Không còn bỏ không Xe Pháo',
    depth: 1,
    quiescenceDepth: 2,
    timeBudgetMs: 70,
    noiseCp: 145,
    mistakeRate: 0.14,
    useBook: false,
    useLmr: false,
    useNullMove: false,
  },
  {
    level: 3,
    name: 'Học Đồ',
    badge: 'Cấp 3',
    summary: 'Nhìn trước 2 nước · Biết khai cuộc cơ bản',
    depth: 2,
    quiescenceDepth: 2,
    timeBudgetMs: 110,
    noiseCp: 90,
    mistakeRate: 0.06,
    useBook: true,
    useLmr: false,
    useNullMove: false,
  },
  {
    level: 4,
    name: 'Kỳ Sĩ',
    badge: 'Cấp 4',
    summary: 'Tính đòn đổi quân chắc chắn · Ít mắc sai lầm chiến thuật',
    depth: 2,
    quiescenceDepth: 4,
    timeBudgetMs: 160,
    noiseCp: 45,
    mistakeRate: 0,
    useBook: true,
    useLmr: false,
    useNullMove: false,
  },
  {
    level: 5,
    name: 'Kỳ Thủ',
    badge: 'Cấp 5',
    summary: 'Cân bằng công thủ · Khai cuộc Bình Phong Mã / Pháo Đầu',
    depth: 3,
    quiescenceDepth: 4,
    timeBudgetMs: 240,
    noiseCp: 16,
    mistakeRate: 0,
    useBook: true,
    useLmr: false,
    useNullMove: false,
  },
  {
    level: 6,
    name: 'Chiến Tướng',
    badge: 'Cấp 6',
    summary: 'Tính sâu 4 lớp · Ép lộ thoáng Xe Pháo Mã',
    depth: 4,
    quiescenceDepth: 4,
    timeBudgetMs: 360,
    noiseCp: 0,
    mistakeRate: 0,
    useBook: true,
    useLmr: false,
    useNullMove: false,
  },
  {
    level: 7,
    name: 'Kiện Tướng',
    badge: 'Cấp 7',
    summary: 'Đọc sâu phối hợp sát chiêu · Xử lý tàn cuộc chính xác',
    depth: 4,
    quiescenceDepth: 5,
    timeBudgetMs: 500,
    noiseCp: 0,
    mistakeRate: 0,
    useBook: true,
    useLmr: true,
    useNullMove: false,
  },
  {
    level: 8,
    name: 'Cao Thủ',
    badge: 'Cấp 8',
    summary: 'Tìm kiếm lặp sâu 5 lớp + Bảng băm Zobrist · Phản công gắt',
    depth: 5,
    quiescenceDepth: 6,
    timeBudgetMs: 680,
    noiseCp: 0,
    mistakeRate: 0,
    useBook: true,
    useLmr: true,
    useNullMove: true,
  },
  {
    level: 9,
    name: 'Đại Kiện Tướng',
    badge: 'Cấp 9',
    summary: 'Tính sâu 6 lớp · Quiescence toàn phần chống bẫy thí quân',
    depth: 6,
    quiescenceDepth: 6,
    timeBudgetMs: 900,
    noiseCp: 0,
    mistakeRate: 0,
    useBook: true,
    useLmr: true,
    useNullMove: true,
  },
  {
    level: 10,
    name: 'Kỳ Vương',
    badge: 'Cấp 10',
    summary: 'Tối đa trí tuệ · Tính sâu 7 lớp, cắt tỉa Null-Move & LMR',
    depth: 7,
    quiescenceDepth: 8,
    timeBudgetMs: 1150,
    noiseCp: 0,
    mistakeRate: 0,
    useBook: true,
    useLmr: true,
    useNullMove: true,
  },
];

export function normalizeXiangqiDifficulty(
  difficulty: XiangqiDifficulty | LegacyXiangqiDifficulty | number
): XiangqiDifficulty {
  if (difficulty === 'easy') return 2;
  if (difficulty === 'medium') return 5;
  if (difficulty === 'hard') return 8;
  const n = Math.round(Number(difficulty));
  if (Number.isNaN(n) || n < 1) return 1;
  if (n > 10) return 10;
  return n as XiangqiDifficulty;
}

export function getXiangqiLevelConfig(
  difficulty: XiangqiDifficulty | LegacyXiangqiDifficulty | number
): XiangqiLevelConfig {
  const lvl = normalizeXiangqiDifficulty(difficulty);
  return XIANGQI_LEVELS[lvl - 1];
}

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
  [4, 8, 12, 16, 20, 16, 12, 8, 4],
  [22, 42, 66, 92, 108, 92, 66, 42, 22],
  [18, 34, 52, 72, 86, 72, 52, 34, 18],
  [12, 24, 36, 44, 54, 44, 36, 24, 12],
  [8, 16, 22, 28, 34, 28, 22, 16, 8],
  [2, 0, 6, 0, 12, 0, 6, 0, 2],
  [0, 0, -2, 0, 6, 0, -2, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const CHARIOT_PST_RED: readonly number[][] = [
  [14, 16, 14, 20, 18, 20, 14, 16, 14],
  [18, 24, 22, 28, 30, 28, 22, 24, 18],
  [14, 16, 16, 22, 22, 22, 16, 16, 14],
  [14, 22, 20, 26, 26, 26, 20, 22, 14],
  [12, 16, 14, 20, 20, 20, 14, 16, 12],
  [12, 18, 16, 22, 22, 22, 16, 18, 12],
  [6, 12, 10, 16, 16, 16, 10, 12, 6],
  [4, 10, 8, 16, 14, 16, 8, 10, 4],
  [8, 6, 10, 18, 10, 18, 10, 6, 8],
  [-6, 10, 8, 16, 12, 16, 8, 10, -6],
];

const HORSE_PST_RED: readonly number[][] = [
  [4, 10, 18, 14, 4, 14, 18, 10, 4],
  [4, 14, 30, 18, 10, 18, 30, 14, 4],
  [10, 18, 20, 24, 22, 24, 20, 18, 10],
  [8, 26, 22, 28, 24, 28, 22, 26, 8],
  [6, 18, 18, 22, 20, 22, 18, 18, 6],
  [2, 14, 18, 16, 14, 16, 18, 14, 2],
  [0, 8, 12, 8, 12, 8, 12, 8, 0],
  [2, 4, 14, 10, 4, 10, 14, 4, 2],
  [-4, 2, 6, 6, -6, 6, 6, 2, -4],
  [-6, -8, 0, 0, 0, 0, 0, -8, -6],
];

const CANNON_PST_RED: readonly number[][] = [
  [6, 4, 0, -8, -10, -8, 0, 4, 6],
  [2, 4, 0, -2, -10, -2, 0, 4, 2],
  [2, 4, 2, -6, -6, -6, 2, 4, 2],
  [0, 2, 0, 6, 14, 6, 0, 2, 0],
  [0, 2, 2, 4, 10, 4, 2, 2, 0],
  [-2, 2, 6, 4, 8, 4, 6, 2, -2],
  [0, 2, 2, 4, 6, 4, 2, 2, 0],
  [4, 2, 10, 8, 18, 8, 10, 2, 4],
  [0, 2, 4, 6, 8, 6, 4, 2, 0],
  [0, 0, 2, 6, 8, 6, 2, 0, 0],
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

// ============================================================================
// High-Performance Int8 Search Engine (Zobrist TT + Quiescence + ID + LMR + NMP)
// ============================================================================

// Piece codes: 1..7 Red (K,A,E,H,R,C,P), -1..-7 Black (K,A,E,H,R,C,P)
const CODE_EMPTY = 0;
const RED_K = 1;
const RED_A = 2;
const RED_E = 3;
const RED_H = 4;
const RED_R = 5;
const RED_C = 6;
const RED_P = 7;
const BLACK_K = -1;
const BLACK_A = -2;
const BLACK_E = -3;
const BLACK_H = -4;
const BLACK_R = -5;
const BLACK_C = -6;
const BLACK_P = -7;

const CODE_VALUES = [0, 10000, 210, 210, 410, 920, 455, 100]; // indexed by abs(code)

const TYPE_TO_CODE: Record<XiangqiPieceType, number> = {
  K: 1,
  A: 2,
  E: 3,
  H: 4,
  R: 5,
  C: 6,
  P: 7,
};

const PST_BY_ABS_CODE: Record<number, readonly number[][] | undefined> = {
  4: HORSE_PST_RED,
  5: CHARIOT_PST_RED,
  6: CANNON_PST_RED,
  7: PAWN_PST_RED,
};

// Move bit-packing:
// bits 0..6:   fromIdx (0..89)
// bits 7..13:  toIdx (0..89)
// bits 14..18: capturedCode + 8 (1..15)
const packMove = (fromIdx: number, toIdx: number, capCode: number): number =>
  fromIdx | (toIdx << 7) | ((capCode + 8) << 14);
const moveFrom = (m: number): number => m & 127;
const moveTo = (m: number): number => (m >>> 7) & 127;
const moveCap = (m: number): number => ((m >>> 14) & 31) - 8;

// Deterministic PRNG for Zobrist keys
function makeZobristTables() {
  let seed = 0x9e3779b9;
  const nextU32 = () => {
    seed ^= seed << 13;
    seed >>>= 0;
    seed ^= seed >>> 17;
    seed >>>= 0;
    seed ^= seed << 5;
    seed >>>= 0;
    return seed;
  };
  // 15 piece slots (-7..+7 shifted by +7 => 0..14) * 90 squares
  const pieceHi = new Uint32Array(15 * 90);
  const pieceLo = new Uint32Array(15 * 90);
  for (let i = 0; i < pieceHi.length; i++) {
    pieceHi[i] = nextU32();
    pieceLo[i] = nextU32();
  }
  const sideHi = nextU32();
  const sideLo = nextU32();
  return { pieceHi, pieceLo, sideHi, sideLo };
}

const ZOBRIST = makeZobristTables();

const TT_SIZE = 1 << 16; // 65,536 slots (~1.5 MB flat arrays)
const TT_MASK = TT_SIZE - 1;
const TT_EXACT = 1;
const TT_LOWER = 2;
const TT_UPPER = 3;

const MATE_SCORE = 30000;
const MATE_BOUND = 28000;
const INF = 1000000;

interface FastSearchState {
  cells: Int8Array;
  rkIdx: number;
  bkIdx: number;
  hashHi: number;
  hashLo: number;
  side: 1 | -1; // 1 = red, -1 = black
  ttKeyHi: Uint32Array;
  ttKeyLo: Uint32Array;
  ttDepth: Int8Array;
  ttFlag: Uint8Array;
  ttScore: Int32Array;
  ttMove: Int32Array;
  killers: Int32Array; // MAX_PLY * 2
  history: Int32Array; // 2 * 90 * 90
  pathHashSet: number[];
  nodes: number;
  deadlineMs: number;
  aborted: boolean;
  levelConfig: XiangqiLevelConfig;
}

const MAX_PLY = 32;

function boardToFastState(
  board: XiangqiBoard,
  sideToMove: XiangqiSide,
  deadlineMs: number,
  levelConfig: XiangqiLevelConfig
): FastSearchState {
  const cells = new Int8Array(90);
  let rkIdx = -1;
  let bkIdx = -1;
  let hashHi = 0;
  let hashLo = 0;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (!p) continue;
      const idx = r * 9 + c;
      const sign = p.side === 'red' ? 1 : -1;
      const code = sign * TYPE_TO_CODE[p.type];
      cells[idx] = code;
      if (code === RED_K) rkIdx = idx;
      else if (code === BLACK_K) bkIdx = idx;

      const zIdx = (code + 7) * 90 + idx;
      hashHi = (hashHi ^ ZOBRIST.pieceHi[zIdx]) >>> 0;
      hashLo = (hashLo ^ ZOBRIST.pieceLo[zIdx]) >>> 0;
    }
  }

  const side: 1 | -1 = sideToMove === 'red' ? 1 : -1;
  if (side === -1) {
    hashHi = (hashHi ^ ZOBRIST.sideHi) >>> 0;
    hashLo = (hashLo ^ ZOBRIST.sideLo) >>> 0;
  }

  return {
    cells,
    rkIdx,
    bkIdx,
    hashHi,
    hashLo,
    side,
    ttKeyHi: new Uint32Array(TT_SIZE),
    ttKeyLo: new Uint32Array(TT_SIZE),
    ttDepth: new Int8Array(TT_SIZE),
    ttFlag: new Uint8Array(TT_SIZE),
    ttScore: new Int32Array(TT_SIZE),
    ttMove: new Int32Array(TT_SIZE),
    killers: new Int32Array(MAX_PLY * 2),
    history: new Int32Array(2 * 90 * 90),
    pathHashSet: [],
    nodes: 0,
    deadlineMs,
    aborted: false,
    levelConfig,
  };
}

function isSideInCheckFast(
  cells: Int8Array,
  side: 1 | -1,
  rkIdx: number,
  bkIdx: number
): boolean {
  const kIdx = side === 1 ? rkIdx : bkIdx;
  if (kIdx < 0) return true;

  // 1. Flying general check
  if (rkIdx >= 0 && bkIdx >= 0) {
    const rc = rkIdx % 9;
    const bc = bkIdx % 9;
    if (rc === bc) {
      let blocked = false;
      for (let idx = bkIdx + 9; idx < rkIdx; idx += 9) {
        if (cells[idx] !== 0) {
          blocked = true;
          break;
        }
      }
      if (!blocked) return true;
    }
  }

  const kr = (kIdx / 9) | 0;
  const kc = kIdx % 9;
  const enemy = -side;

  // 2. Orthogonal Rooks and Cannons
  // Up
  let blockers = 0;
  for (let r = kr - 1; r >= 0; r--) {
    const occ = cells[r * 9 + kc];
    if (occ !== 0) {
      if (blockers === 0) {
        if (occ === enemy * 5) return true; // Enemy Rook
        blockers = 1;
      } else {
        if (occ === enemy * 6) return true; // Enemy Cannon
        break;
      }
    }
  }
  // Down
  blockers = 0;
  for (let r = kr + 1; r < 10; r++) {
    const occ = cells[r * 9 + kc];
    if (occ !== 0) {
      if (blockers === 0) {
        if (occ === enemy * 5) return true;
        blockers = 1;
      } else {
        if (occ === enemy * 6) return true;
        break;
      }
    }
  }
  // Left
  blockers = 0;
  for (let c = kc - 1; c >= 0; c--) {
    const occ = cells[kr * 9 + c];
    if (occ !== 0) {
      if (blockers === 0) {
        if (occ === enemy * 5) return true;
        blockers = 1;
      } else {
        if (occ === enemy * 6) return true;
        break;
      }
    }
  }
  // Right
  blockers = 0;
  for (let c = kc + 1; c < 9; c++) {
    const occ = cells[kr * 9 + c];
    if (occ !== 0) {
      if (blockers === 0) {
        if (occ === enemy * 5) return true;
        blockers = 1;
      } else {
        if (occ === enemy * 6) return true;
        break;
      }
    }
  }

  // 3. Horse attacks (reverse-check attacker's horse leg)
  const enemyHorse = enemy * 4;
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
  for (let i = 0; i < 8; i++) {
    const [dr, dc, lr, lc] = horseChecks[i];
    const hr = kr + dr;
    const hc = kc + dc;
    if (hr >= 0 && hr < 10 && hc >= 0 && hc < 9) {
      if (cells[hr * 9 + hc] === enemyHorse && cells[(kr + lr) * 9 + (kc + lc)] === 0) {
        return true;
      }
    }
  }

  // 4. Enemy Pawn attacks
  const enemyPawn = enemy * 7;
  const pawnFromRow = kr + (enemy === 1 ? 1 : -1);
  if (pawnFromRow >= 0 && pawnFromRow < 10 && cells[pawnFromRow * 9 + kc] === enemyPawn) {
    return true;
  }
  // Sideways Pawn only if Pawn crossed river (meaning kr is on our side)
  if (kc > 0 && cells[kr * 9 + kc - 1] === enemyPawn) return true;
  if (kc < 8 && cells[kr * 9 + kc + 1] === enemyPawn) return true;

  return false;
}

const ORTHO_DIRS: readonly [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const DIAG_DIRS: readonly [number, number][] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];
const HORSE_JUMPS: readonly [number, number, number, number][] = [
  [-2, -1, -1, 0],
  [-2, 1, -1, 0],
  [2, -1, 1, 0],
  [2, 1, 1, 0],
  [-1, -2, 0, -1],
  [1, -2, 0, -1],
  [-1, 2, 0, 1],
  [1, 2, 0, 1],
];

function generatePseudoMovesFast(
  cells: Int8Array,
  side: 1 | -1,
  capturesOnly: boolean,
  outMoves: number[]
): number {
  outMoves.length = 0;

  for (let idx = 0; idx < 90; idx++) {
    const code = cells[idx];
    if (code === 0 || (side === 1 ? code < 0 : code > 0)) continue;

    const r = (idx / 9) | 0;
    const c = idx % 9;
    const absCode = code > 0 ? code : -code;

    if (absCode === 1) {
      // King
      const minR = side === 1 ? 7 : 0;
      const maxR = side === 1 ? 9 : 2;
      for (let d = 0; d < 4; d++) {
        const nr = r + ORTHO_DIRS[d][0];
        const nc = c + ORTHO_DIRS[d][1];
        if (nr >= minR && nr <= maxR && nc >= 3 && nc <= 5) {
          const toIdx = nr * 9 + nc;
          const occ = cells[toIdx];
          if (occ === 0) {
            if (!capturesOnly) outMoves.push(packMove(idx, toIdx, 0));
          } else if ((occ > 0 ? 1 : -1) !== side) {
            outMoves.push(packMove(idx, toIdx, occ));
          }
        }
      }
    } else if (absCode === 2) {
      // Advisor
      const minR = side === 1 ? 7 : 0;
      const maxR = side === 1 ? 9 : 2;
      for (let d = 0; d < 4; d++) {
        const nr = r + DIAG_DIRS[d][0];
        const nc = c + DIAG_DIRS[d][1];
        if (nr >= minR && nr <= maxR && nc >= 3 && nc <= 5) {
          const toIdx = nr * 9 + nc;
          const occ = cells[toIdx];
          if (occ === 0) {
            if (!capturesOnly) outMoves.push(packMove(idx, toIdx, 0));
          } else if ((occ > 0 ? 1 : -1) !== side) {
            outMoves.push(packMove(idx, toIdx, occ));
          }
        }
      }
    } else if (absCode === 3) {
      // Elephant
      const minR = side === 1 ? 5 : 0;
      const maxR = side === 1 ? 9 : 4;
      for (let d = 0; d < 4; d++) {
        const dr = DIAG_DIRS[d][0];
        const dc = DIAG_DIRS[d][1];
        const nr = r + dr * 2;
        const nc = c + dc * 2;
        if (nr >= minR && nr <= maxR && nc >= 0 && nc < 9) {
          if (cells[(r + dr) * 9 + (c + dc)] === 0) {
            const toIdx = nr * 9 + nc;
            const occ = cells[toIdx];
            if (occ === 0) {
              if (!capturesOnly) outMoves.push(packMove(idx, toIdx, 0));
            } else if ((occ > 0 ? 1 : -1) !== side) {
              outMoves.push(packMove(idx, toIdx, occ));
            }
          }
        }
      }
    } else if (absCode === 4) {
      // Horse
      for (let d = 0; d < 8; d++) {
        const [dr, dc, lr, lc] = HORSE_JUMPS[d];
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 10 && nc >= 0 && nc < 9) {
          if (cells[(r + lr) * 9 + (c + lc)] === 0) {
            const toIdx = nr * 9 + nc;
            const occ = cells[toIdx];
            if (occ === 0) {
              if (!capturesOnly) outMoves.push(packMove(idx, toIdx, 0));
            } else if ((occ > 0 ? 1 : -1) !== side) {
              outMoves.push(packMove(idx, toIdx, occ));
            }
          }
        }
      }
    } else if (absCode === 5) {
      // Rook
      for (let d = 0; d < 4; d++) {
        const dr = ORTHO_DIRS[d][0];
        const dc = ORTHO_DIRS[d][1];
        let nr = r + dr;
        let nc = c + dc;
        while (nr >= 0 && nr < 10 && nc >= 0 && nc < 9) {
          const toIdx = nr * 9 + nc;
          const occ = cells[toIdx];
          if (occ === 0) {
            if (!capturesOnly) outMoves.push(packMove(idx, toIdx, 0));
          } else {
            if ((occ > 0 ? 1 : -1) !== side) {
              outMoves.push(packMove(idx, toIdx, occ));
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
    } else if (absCode === 6) {
      // Cannon
      for (let d = 0; d < 4; d++) {
        const dr = ORTHO_DIRS[d][0];
        const dc = ORTHO_DIRS[d][1];
        let nr = r + dr;
        let nc = c + dc;
        let jumped = false;
        while (nr >= 0 && nr < 10 && nc >= 0 && nc < 9) {
          const toIdx = nr * 9 + nc;
          const occ = cells[toIdx];
          if (!jumped) {
            if (occ === 0) {
              if (!capturesOnly) outMoves.push(packMove(idx, toIdx, 0));
            } else {
              jumped = true;
            }
          } else if (occ !== 0) {
            if ((occ > 0 ? 1 : -1) !== side) {
              outMoves.push(packMove(idx, toIdx, occ));
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
    } else {
      // Pawn (7)
      const forwardR = r + (side === 1 ? -1 : 1);
      if (forwardR >= 0 && forwardR < 10) {
        const toIdx = forwardR * 9 + c;
        const occ = cells[toIdx];
        if (occ === 0) {
          if (!capturesOnly) outMoves.push(packMove(idx, toIdx, 0));
        } else if ((occ > 0 ? 1 : -1) !== side) {
          outMoves.push(packMove(idx, toIdx, occ));
        }
      }
      const crossed = side === 1 ? r <= 4 : r >= 5;
      if (crossed) {
        if (c > 0) {
          const toIdx = idx - 1;
          const occ = cells[toIdx];
          if (occ === 0) {
            if (!capturesOnly) outMoves.push(packMove(idx, toIdx, 0));
          } else if ((occ > 0 ? 1 : -1) !== side) {
            outMoves.push(packMove(idx, toIdx, occ));
          }
        }
        if (c < 8) {
          const toIdx = idx + 1;
          const occ = cells[toIdx];
          if (occ === 0) {
            if (!capturesOnly) outMoves.push(packMove(idx, toIdx, 0));
          } else if ((occ > 0 ? 1 : -1) !== side) {
            outMoves.push(packMove(idx, toIdx, occ));
          }
        }
      }
    }
  }

  return outMoves.length;
}

function makeFastMove(
  state: FastSearchState,
  move: number
): {
  movedCode: number;
  capCode: number;
  prevRk: number;
  prevBk: number;
  prevHi: number;
  prevLo: number;
} {
  const fromIdx = moveFrom(move);
  const toIdx = moveTo(move);
  const movedCode = state.cells[fromIdx];
  const capCode = state.cells[toIdx];
  const prevRk = state.rkIdx;
  const prevBk = state.bkIdx;
  const prevHi = state.hashHi;
  const prevLo = state.hashLo;

  // Update hash: remove moving from old square
  const fromZ = (movedCode + 7) * 90 + fromIdx;
  let hi = (prevHi ^ ZOBRIST.pieceHi[fromZ]) >>> 0;
  let lo = (prevLo ^ ZOBRIST.pieceLo[fromZ]) >>> 0;

  // Remove captured if any
  if (capCode !== CODE_EMPTY) {
    const capZ = (capCode + 7) * 90 + toIdx;
    hi = (hi ^ ZOBRIST.pieceHi[capZ]) >>> 0;
    lo = (lo ^ ZOBRIST.pieceLo[capZ]) >>> 0;
    if (capCode === RED_K) state.rkIdx = -1;
    else if (capCode === BLACK_K) state.bkIdx = -1;
  }

  // Place moving at target square
  const toZ = (movedCode + 7) * 90 + toIdx;
  hi = (hi ^ ZOBRIST.pieceHi[toZ] ^ ZOBRIST.sideHi) >>> 0;
  lo = (lo ^ ZOBRIST.pieceLo[toZ] ^ ZOBRIST.sideLo) >>> 0;

  state.cells[toIdx] = movedCode;
  state.cells[fromIdx] = CODE_EMPTY;
  if (movedCode === RED_K) state.rkIdx = toIdx;
  else if (movedCode === BLACK_K) state.bkIdx = toIdx;

  state.hashHi = hi;
  state.hashLo = lo;
  state.side = state.side === 1 ? -1 : 1;

  return { movedCode, capCode, prevRk, prevBk, prevHi, prevLo };
}

function unmakeFastMove(
  state: FastSearchState,
  move: number,
  undo: {
    movedCode: number;
    capCode: number;
    prevRk: number;
    prevBk: number;
    prevHi: number;
    prevLo: number;
  }
): void {
  const fromIdx = moveFrom(move);
  const toIdx = moveTo(move);
  state.cells[fromIdx] = undo.movedCode;
  state.cells[toIdx] = undo.capCode;
  state.rkIdx = undo.prevRk;
  state.bkIdx = undo.prevBk;
  state.hashHi = undo.prevHi;
  state.hashLo = undo.prevLo;
  state.side = state.side === 1 ? -1 : 1;
}

function evaluateFast(state: FastSearchState): number {
  const { cells, rkIdx, bkIdx } = state;

  let redScore = 0;
  let blackScore = 0;
  let totalOffensiveMaterial = 0;

  let redAdvisors = 0;
  let blackAdvisors = 0;
  let redElephants = 0;
  let blackElephants = 0;

  const redRookCols: number[] = [];
  const blackRookCols: number[] = [];
  let redCenterCannon = false;
  let blackCenterCannon = false;

  const redPawnOnCol = new Uint8Array(9);
  const blackPawnOnCol = new Uint8Array(9);

  for (let idx = 0; idx < 90; idx++) {
    const code = cells[idx];
    if (code === 0) continue;

    const r = (idx / 9) | 0;
    const c = idx % 9;
    const isRed = code > 0;
    const absCode = isRed ? code : -code;
    const mirR = isRed ? r : 9 - r;

    let val = CODE_VALUES[absCode];
    const pst = PST_BY_ABS_CODE[absCode];
    if (pst) {
      val += pst[mirR][c];
    }

    if (absCode === 2) {
      // Advisor
      val += mirR === 8 && c === 4 ? 14 : 4;
      if (isRed) redAdvisors++;
      else blackAdvisors++;
    } else if (absCode === 3) {
      // Elephant
      val += mirR === 7 && (c === 0 || c === 4 || c === 8) ? 10 : 4;
      if (isRed) redElephants++;
      else blackElephants++;
    } else if (absCode === 4) {
      // Horse: penalty if forward leg is blocked or trapped on edge
      totalOffensiveMaterial += 410;
      if (c === 0 || c === 8) val -= 14;
      const forwardRow = isRed ? r - 1 : r + 1;
      if (forwardRow >= 0 && forwardRow < 10 && cells[forwardRow * 9 + c] !== 0) {
        val -= 10;
      }
    } else if (absCode === 5) {
      // Rook
      totalOffensiveMaterial += 920;
      if (isRed) {
        redRookCols.push(c);
        if (r === 9 && (c === 0 || c === 8)) val -= 16; // undeveloped corner Rook
      } else {
        blackRookCols.push(c);
        if (r === 0 && (c === 0 || c === 8)) val -= 16;
      }
    } else if (absCode === 6) {
      // Cannon
      totalOffensiveMaterial += 455;
      if (c === 4) {
        if (isRed && r >= 4) {
          redCenterCannon = true;
          val += 18;
        } else if (!isRed && r <= 5) {
          blackCenterCannon = true;
          val += 18;
        }
      }
    } else if (absCode === 7) {
      // Pawn
      totalOffensiveMaterial += 100;
      if (isRed) {
        redPawnOnCol[c] = 1;
        if (r <= 4) {
          // Crossed river Pawn: bonus for mutual horizontal support
          if ((c > 0 && cells[idx - 1] === RED_P) || (c < 8 && cells[idx + 1] === RED_P)) {
            val += 16;
          }
          if (c >= 3 && c <= 5) val += 14;
        }
      } else {
        blackPawnOnCol[c] = 1;
        if (r >= 5) {
          if ((c > 0 && cells[idx - 1] === BLACK_P) || (c < 8 && cells[idx + 1] === BLACK_P)) {
            val += 16;
          }
          if (c >= 3 && c <= 5) val += 14;
        }
      }
    }

    if (isRed) redScore += val;
    else blackScore += val;
  }

  // Endgame phase scaling: Cannons slightly weaker, Horses & Crossed Pawns stronger when simplified
  if (totalOffensiveMaterial < 2600) {
    // Reward full defense less critically, boost Pawns implicitly already via PST + slight shift
    for (let idx = 0; idx < 90; idx++) {
      const code = cells[idx];
      if (code === RED_H) redScore += 28;
      else if (code === BLACK_H) blackScore += 28;
      else if (code === RED_C) redScore -= 24;
      else if (code === BLACK_C) blackScore -= 24;
      else if (code === RED_P && ((idx / 9) | 0) <= 4) redScore += 28;
      else if (code === BLACK_P && ((idx / 9) | 0) >= 5) blackScore += 28;
    }
  }

  // Full defense synergy ("Sĩ Tượng toàn")
  if (redAdvisors === 2) redScore += 20;
  if (blackAdvisors === 2) blackScore += 20;
  if (redElephants === 2) redScore += 16;
  if (blackElephants === 2) blackScore += 16;

  // Chariot open / semi-open file bonuses
  for (let i = 0; i < redRookCols.length; i++) {
    const col = redRookCols[i];
    if (!redPawnOnCol[col]) {
      redScore += blackPawnOnCol[col] ? 16 : 26;
    }
  }
  for (let i = 0; i < blackRookCols.length; i++) {
    const col = blackRookCols[i];
    if (!blackPawnOnCol[col]) {
      blackScore += redPawnOnCol[col] ? 16 : 26;
    }
  }

  // Hollow-palace Cannon threat check
  if (blackCenterCannon && redAdvisors === 0) {
    blackScore += 45;
  }
  if (redCenterCannon && blackAdvisors === 0) {
    redScore += 45;
  }

  // Exposed King out of home row during middlegame
  if (totalOffensiveMaterial >= 2400) {
    if (rkIdx >= 0 && ((rkIdx / 9) | 0) !== 9) redScore -= 22;
    if (bkIdx >= 0 && ((bkIdx / 9) | 0) !== 0) blackScore -= 22;
  }

  // Small tempo bonus for side to move
  const tempo = state.side === 1 ? 8 : -8;
  const raw = redScore - blackScore + tempo;
  return state.side === 1 ? raw : -raw;
}

function scoreMovesForOrdering(
  state: FastSearchState,
  moves: number[],
  ttMove: number,
  ply: number
): Int32Array {
  const scores = new Int32Array(moves.length);
  const k1 = ply < MAX_PLY ? state.killers[ply * 2] : 0;
  const k2 = ply < MAX_PLY ? state.killers[ply * 2 + 1] : 0;
  const sideOffset = state.side === 1 ? 0 : 8100;

  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    if (m === ttMove) {
      scores[i] = 10000000;
      continue;
    }
    const cap = moveCap(m);
    const from = moveFrom(m);
    const to = moveTo(m);
    const moved = state.cells[from];
    const absMoved = moved > 0 ? moved : -moved;

    if (cap !== 0) {
      const absCap = cap > 0 ? cap : -cap;
      scores[i] = 1000000 + CODE_VALUES[absCap] * 16 - CODE_VALUES[absMoved];
    } else if (m === k1) {
      scores[i] = 900000;
    } else if (m === k2) {
      scores[i] = 800000;
    } else {
      const colBias = 10 - Math.abs(4 - (to % 9)) * 2;
      scores[i] = state.history[sideOffset + from * 90 + to] + colBias;
    }
  }
  return scores;
}

function pickBestMoveAt(moves: number[], scores: Int32Array, startIdx: number): number {
  let bestIdx = startIdx;
  let bestScore = scores[startIdx];
  for (let i = startIdx + 1; i < moves.length; i++) {
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      bestIdx = i;
    }
  }
  if (bestIdx !== startIdx) {
    const tm = moves[startIdx];
    moves[startIdx] = moves[bestIdx];
    moves[bestIdx] = tm;
    const ts = scores[startIdx];
    scores[startIdx] = scores[bestIdx];
    scores[bestIdx] = ts;
  }
  return moves[startIdx];
}

function quiesce(
  state: FastSearchState,
  alpha: number,
  beta: number,
  qDepth: number,
  ply: number
): number {
  if ((++state.nodes & 1023) === 0 && Date.now() >= state.deadlineMs) {
    state.aborted = true;
    return 0;
  }
  if (state.aborted) return 0;

  const inCheck = isSideInCheckFast(state.cells, state.side, state.rkIdx, state.bkIdx);

  if (!inCheck) {
    const standPat = evaluateFast(state);
    if (standPat >= beta) return standPat;
    if (standPat > alpha) alpha = standPat;
    if (qDepth <= 0 || ply >= MAX_PLY - 1) return alpha;

    const rawMoves: number[] = [];
    generatePseudoMovesFast(state.cells, state.side, true, rawMoves);
    const scores = scoreMovesForOrdering(state, rawMoves, 0, ply);

    for (let i = 0; i < rawMoves.length; i++) {
      const m = pickBestMoveAt(rawMoves, scores, i);
      const cap = moveCap(m);
      const absCap = cap > 0 ? cap : -cap;

      // Delta pruning for clearly hopeless captures (skip if capturing King)
      if (absCap !== 1 && standPat + CODE_VALUES[absCap] + 160 < alpha) {
        continue;
      }

      const movedSide = state.side;
      const undo = makeFastMove(state, m);
      if (isSideInCheckFast(state.cells, movedSide, state.rkIdx, state.bkIdx)) {
        unmakeFastMove(state, m, undo);
        continue;
      }

      const score = -quiesce(state, -beta, -alpha, qDepth - 1, ply + 1);
      unmakeFastMove(state, m, undo);
      if (state.aborted) return 0;

      if (score >= beta) return score;
      if (score > alpha) alpha = score;
    }
    return alpha;
  } else {
    // In check: must search all legal evasions instead of standing pat
    if (ply >= MAX_PLY - 1) {
      return evaluateFast(state);
    }
    const rawMoves: number[] = [];
    generatePseudoMovesFast(state.cells, state.side, false, rawMoves);
    const scores = scoreMovesForOrdering(state, rawMoves, 0, ply);
    let legalCount = 0;

    for (let i = 0; i < rawMoves.length; i++) {
      const m = pickBestMoveAt(rawMoves, scores, i);
      const movedSide = state.side;
      const undo = makeFastMove(state, m);
      if (isSideInCheckFast(state.cells, movedSide, state.rkIdx, state.bkIdx)) {
        unmakeFastMove(state, m, undo);
        continue;
      }
      legalCount++;
      const score = -quiesce(state, -beta, -alpha, Math.max(0, qDepth - 1), ply + 1);
      unmakeFastMove(state, m, undo);
      if (state.aborted) return 0;

      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }

    if (legalCount === 0) {
      return -MATE_SCORE + ply;
    }
    return alpha;
  }
}

function negamax(
  state: FastSearchState,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
  allowNull: boolean
): number {
  if ((++state.nodes & 1023) === 0 && Date.now() >= state.deadlineMs) {
    state.aborted = true;
    return 0;
  }
  if (state.aborted) return 0;

  // Repetition avoidance on current search path (non-root)
  const pathKey = (state.hashHi ^ (state.hashLo * 0x9e3779b1)) >>> 0;
  if (ply > 0) {
    for (let i = state.pathHashSet.length - 2; i >= 0; i -= 2) {
      if (state.pathHashSet[i] === pathKey) {
        return -25; // Discourage useless back-and-forth loops
      }
    }
  }

  const inCheck = isSideInCheckFast(state.cells, state.side, state.rkIdx, state.bkIdx);

  // Check extension (up to a safe ply limit)
  let effectiveDepth = depth;
  if (inCheck && ply < MAX_PLY - 4 && state.levelConfig.level >= 4) {
    effectiveDepth += 1;
  }

  if (effectiveDepth <= 0) {
    return quiesce(state, alpha, beta, state.levelConfig.quiescenceDepth, ply);
  }

  // Probe Transposition Table
  const ttIdx = state.hashLo & TT_MASK;
  let ttMove = 0;
  if (state.ttKeyHi[ttIdx] === state.hashHi && state.ttKeyLo[ttIdx] === state.hashLo) {
    ttMove = state.ttMove[ttIdx];
    if (state.ttDepth[ttIdx] >= effectiveDepth && ply > 0) {
      let ttVal = state.ttScore[ttIdx];
      if (ttVal >= MATE_BOUND) ttVal -= ply;
      else if (ttVal <= -MATE_BOUND) ttVal += ply;

      const flag = state.ttFlag[ttIdx];
      if (flag === TT_EXACT) return ttVal;
      if (flag === TT_LOWER && ttVal >= beta) return ttVal;
      if (flag === TT_UPPER && ttVal <= alpha) return ttVal;
    }
  }

  // Null-Move Pruning (skip if in check or low depth or endgame risk)
  if (
    state.levelConfig.useNullMove &&
    allowNull &&
    !inCheck &&
    ply > 0 &&
    effectiveDepth >= 3 &&
    beta < MATE_BOUND
  ) {
    const prevSide = state.side;
    const prevHi = state.hashHi;
    const prevLo = state.hashLo;
    state.side = prevSide === 1 ? -1 : 1;
    state.hashHi = (prevHi ^ ZOBRIST.sideHi) >>> 0;
    state.hashLo = (prevLo ^ ZOBRIST.sideLo) >>> 0;

    const R = effectiveDepth >= 6 ? 3 : 2;
    const nullScore = -negamax(state, effectiveDepth - 1 - R, -beta, -beta + 1, ply + 1, false);

    state.side = prevSide;
    state.hashHi = prevHi;
    state.hashLo = prevLo;

    if (state.aborted) return 0;
    if (nullScore >= beta) {
      return beta;
    }
  }

  const rawMoves: number[] = [];
  generatePseudoMovesFast(state.cells, state.side, false, rawMoves);
  const scores = scoreMovesForOrdering(state, rawMoves, ttMove, ply);

  const origAlpha = alpha;
  let bestScore = -INF;
  let bestMove = 0;
  let legalCount = 0;

  state.pathHashSet.push(pathKey);

  for (let i = 0; i < rawMoves.length; i++) {
    const m = pickBestMoveAt(rawMoves, scores, i);
    const movedSide = state.side;
    const isQuiet = moveCap(m) === 0;
    const undo = makeFastMove(state, m);

    if (isSideInCheckFast(state.cells, movedSide, state.rkIdx, state.bkIdx)) {
      unmakeFastMove(state, m, undo);
      continue;
    }

    legalCount++;
    let score: number;

    if (legalCount === 1) {
      score = -negamax(state, effectiveDepth - 1, -beta, -alpha, ply + 1, true);
    } else {
      // Late Move Reduction for late quiet moves at high depths
      let reduction = 0;
      if (
        state.levelConfig.useLmr &&
        effectiveDepth >= 3 &&
        legalCount >= 4 &&
        isQuiet &&
        !inCheck
      ) {
        const givesCheck = isSideInCheckFast(state.cells, state.side, state.rkIdx, state.bkIdx);
        if (!givesCheck) {
          reduction = legalCount >= 8 && effectiveDepth >= 5 ? 2 : 1;
        }
      }

      // PVS zero-window probe
      score = -negamax(
        state,
        effectiveDepth - 1 - reduction,
        -alpha - 1,
        -alpha,
        ply + 1,
        true
      );
      if (!state.aborted && score > alpha && reduction > 0) {
        score = -negamax(state, effectiveDepth - 1, -alpha - 1, -alpha, ply + 1, true);
      }
      if (!state.aborted && score > alpha && score < beta) {
        score = -negamax(state, effectiveDepth - 1, -beta, -alpha, ply + 1, true);
      }
    }

    unmakeFastMove(state, m, undo);
    if (state.aborted) {
      state.pathHashSet.pop();
      return 0;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = m;
    }
    if (score > alpha) {
      alpha = score;
      if (alpha >= beta) {
        if (isQuiet && ply < MAX_PLY) {
          if (state.killers[ply * 2] !== m) {
            state.killers[ply * 2 + 1] = state.killers[ply * 2];
            state.killers[ply * 2] = m;
          }
          const sideOffset = state.side === 1 ? 0 : 8100;
          const hIdx = sideOffset + moveFrom(m) * 90 + moveTo(m);
          state.history[hIdx] = Math.min(200000, state.history[hIdx] + effectiveDepth * effectiveDepth);
        }
        break;
      }
    }
  }

  state.pathHashSet.pop();

  if (legalCount === 0) {
    return -MATE_SCORE + ply;
  }

  // Store in Transposition Table
  let storeScore = bestScore;
  if (storeScore >= MATE_BOUND) storeScore += ply;
  else if (storeScore <= -MATE_BOUND) storeScore -= ply;

  const flag = bestScore <= origAlpha ? TT_UPPER : bestScore >= beta ? TT_LOWER : TT_EXACT;
  if (state.ttDepth[ttIdx] <= effectiveDepth || state.ttKeyLo[ttIdx] !== state.hashLo) {
    state.ttKeyHi[ttIdx] = state.hashHi;
    state.ttKeyLo[ttIdx] = state.hashLo;
    state.ttDepth[ttIdx] = effectiveDepth;
    state.ttFlag[ttIdx] = flag;
    state.ttScore[ttIdx] = storeScore;
    if (bestMove !== 0) state.ttMove[ttIdx] = bestMove;
  }

  return bestScore;
}

export function evaluateBoardScore(board: XiangqiBoard, perspective: XiangqiSide): number {
  const state = boardToFastState(board, perspective, Infinity, XIANGQI_LEVELS[4]);
  return evaluateFast(state);
}

// ============================================================================
// Curated Classical Xiangqi Opening Book
// ============================================================================

interface BookMoveCandidate {
  from: BoardCoord;
  to: BoardCoord;
  weight: number;
}

function getBoardOpeningKey(cells: Int8Array, side: 1 | -1): string {
  // Compact 90-char key representing current piece arrangement + side
  let key = side === 1 ? 'R:' : 'B:';
  for (let i = 0; i < 90; i++) {
    const c = cells[i];
    if (c === 0) key += '.';
    else if (c > 0) key += String.fromCharCode(64 + c); // A..G
    else key += String.fromCharCode(96 - c); // a..g
  }
  return key;
}

function buildOpeningBook(): Map<string, BookMoveCandidate[]> {
  const book = new Map<string, BookMoveCandidate[]>();

  const registerFromPlies = (
    plies: Array<[number, number, number, number]>,
    sideToMove: XiangqiSide,
    candidates: BookMoveCandidate[]
  ) => {
    const b = createInitialBoard();
    for (const [fr, fc, tr, tc] of plies) {
      b[tr][tc] = b[fr][fc];
      b[fr][fc] = null;
    }
    const fast = boardToFastState(b, sideToMove, Infinity, XIANGQI_LEVELS[4]);
    const key = getBoardOpeningKey(fast.cells, fast.side);
    book.set(key, candidates);
  };

  // 1. Initial position -> Red first move (Pháo đầu, Tiên nhân chỉ lộ, Phi tượng, Khởi mã)
  registerFromPlies([], 'red', [
    { from: { row: 7, col: 7 }, to: { row: 7, col: 4 }, weight: 45 }, // Pháo 2 bình 5
    { from: { row: 7, col: 1 }, to: { row: 7, col: 4 }, weight: 25 }, // Pháo 8 bình 5
    { from: { row: 6, col: 2 }, to: { row: 5, col: 2 }, weight: 12 }, // Tiên nhân chỉ lộ (Tốt 7 tấn 1)
    { from: { row: 9, col: 6 }, to: { row: 7, col: 4 }, weight: 10 }, // Phi tượng (Tượng 3 tấn 5)
    { from: { row: 9, col: 7 }, to: { row: 7, col: 6 }, weight: 8 },  // Khởi mã (Mã 2 tấn 3)
  ]);

  // 2. Red plays Pháo 2 bình 5 -> Black classical counters (Bình Phong Mã, Thuận Pháo, Nghịch Pháo)
  registerFromPlies([[7, 7, 7, 4]], 'black', [
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, weight: 46 }, // Mã 8 tấn 7
    { from: { row: 2, col: 7 }, to: { row: 2, col: 4 }, weight: 26 }, // Pháo 8 bình 5 (Thuận pháo)
    { from: { row: 0, col: 1 }, to: { row: 2, col: 2 }, weight: 16 }, // Mã 2 tấn 3
    { from: { row: 2, col: 1 }, to: { row: 2, col: 4 }, weight: 12 }, // Pháo 2 bình 5 (Nghịch pháo)
  ]);

  // 3. Red plays Pháo 8 bình 5 -> Black classical counters
  registerFromPlies([[7, 1, 7, 4]], 'black', [
    { from: { row: 0, col: 1 }, to: { row: 2, col: 2 }, weight: 46 }, // Mã 2 tấn 3
    { from: { row: 2, col: 1 }, to: { row: 2, col: 4 }, weight: 26 }, // Pháo 2 bình 5 (Thuận pháo)
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, weight: 16 }, // Mã 8 tấn 7
    { from: { row: 2, col: 7 }, to: { row: 2, col: 4 }, weight: 12 }, // Pháo 8 bình 5
  ]);

  // 4. Pháo đầu vs Mã 8 tấn 7 -> Red plays Mã 2 tấn 3 -> Black completes Bình Phong Mã or pushes Pawn 7
  registerFromPlies(
    [
      [7, 7, 7, 4],
      [0, 7, 2, 6],
      [9, 7, 7, 6],
    ],
    'black',
    [
      { from: { row: 0, col: 1 }, to: { row: 2, col: 2 }, weight: 45 }, // Mã 2 tấn 3 (Bình phong mã)
      { from: { row: 3, col: 6 }, to: { row: 4, col: 6 }, weight: 35 }, // Tốt 7 tấn 1
      { from: { row: 0, col: 8 }, to: { row: 0, col: 7 }, weight: 20 }, // Xe 9 bình 8
    ]
  );

  // 5. Mirrored Pháo 8 bình 5 -> Mã 2 tấn 3 -> Mã 8 tấn 7 -> Black completes Bình Phong Mã
  registerFromPlies(
    [
      [7, 1, 7, 4],
      [0, 1, 2, 2],
      [9, 1, 7, 2],
    ],
    'black',
    [
      { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, weight: 45 },
      { from: { row: 3, col: 2 }, to: { row: 4, col: 2 }, weight: 35 },
      { from: { row: 0, col: 0 }, to: { row: 0, col: 1 }, weight: 20 },
    ]
  );

  // 6. Red plays Tiên nhân chỉ lộ (6,2 -> 5,2) -> Black responds Đối binh or Tốt để pháo
  registerFromPlies([[6, 2, 5, 2]], 'black', [
    { from: { row: 2, col: 1 }, to: { row: 2, col: 2 }, weight: 40 }, // Pháo 2 bình 3 (Tốt để pháo)
    { from: { row: 3, col: 6 }, to: { row: 4, col: 6 }, weight: 35 }, // Tốt 7 tấn 1 (Đối binh)
    { from: { row: 0, col: 2 }, to: { row: 2, col: 4 }, weight: 25 }, // Phi tượng
  ]);

  registerFromPlies([[6, 6, 5, 6]], 'black', [
    { from: { row: 2, col: 7 }, to: { row: 2, col: 6 }, weight: 40 },
    { from: { row: 3, col: 2 }, to: { row: 4, col: 2 }, weight: 35 },
    { from: { row: 0, col: 6 }, to: { row: 2, col: 4 }, weight: 25 },
  ]);

  // 7. Red plays Phi tượng (9,6 -> 7,4) or (9,2 -> 7,4) -> Black Quá cung pháo or Mã 8 tấn 7
  registerFromPlies([[9, 6, 7, 4]], 'black', [
    { from: { row: 2, col: 1 }, to: { row: 2, col: 3 }, weight: 45 }, // Quá cung pháo
    { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, weight: 35 },
    { from: { row: 3, col: 2 }, to: { row: 4, col: 2 }, weight: 20 },
  ]);

  registerFromPlies([[9, 2, 7, 4]], 'black', [
    { from: { row: 2, col: 7 }, to: { row: 2, col: 5 }, weight: 45 },
    { from: { row: 0, col: 1 }, to: { row: 2, col: 2 }, weight: 35 },
    { from: { row: 3, col: 6 }, to: { row: 4, col: 6 }, weight: 20 },
  ]);

  return book;
}

const OPENING_BOOK = buildOpeningBook();

function lookupOpeningBookMove(
  board: XiangqiBoard,
  aiSide: XiangqiSide,
  config: XiangqiLevelConfig
): XiangqiMove | null {
  if (!config.useBook) return null;
  const fast = boardToFastState(board, aiSide, Infinity, config);
  const key = getBoardOpeningKey(fast.cells, fast.side);
  const entries = OPENING_BOOK.get(key);
  if (!entries || entries.length === 0) return null;

  // Higher levels strongly favor top master theory; mid levels mix repertoire
  if (config.level >= 8) {
    const topTwo = entries.slice(0, Math.min(2, entries.length));
    const totalW = topTwo.reduce((acc, e) => acc + e.weight, 0);
    let r = Math.random() * totalW;
    for (const candidate of topTwo) {
      r -= candidate.weight;
      if (r <= 0) {
        const res = executeMove(board, candidate.from, candidate.to);
        if (res) return res.move;
      }
    }
  } else {
    const totalW = entries.reduce((acc, e) => acc + e.weight, 0);
    let r = Math.random() * totalW;
    for (const candidate of entries) {
      r -= candidate.weight;
      if (r <= 0) {
        const res = executeMove(board, candidate.from, candidate.to);
        if (res) return res.move;
      }
    }
  }

  const fallback = executeMove(board, entries[0].from, entries[0].to);
  return fallback ? fallback.move : null;
}

export function findBestXiangqiMove(
  board: XiangqiBoard,
  aiSide: XiangqiSide,
  difficulty: XiangqiDifficulty | LegacyXiangqiDifficulty | number
): XiangqiMove | null {
  const config = getXiangqiLevelConfig(difficulty);

  // Check Opening Book first for levels 3..10
  const bookMove = lookupOpeningBookMove(board, aiSide, config);
  if (bookMove) {
    return bookMove;
  }

  const startMs = Date.now();
  const deadlineMs = startMs + config.timeBudgetMs;
  const state = boardToFastState(board, aiSide, deadlineMs, config);

  // Generate root legal moves
  const pseudoMoves: number[] = [];
  generatePseudoMovesFast(state.cells, state.side, false, pseudoMoves);
  const legalRootMoves: number[] = [];

  for (let i = 0; i < pseudoMoves.length; i++) {
    const m = pseudoMoves[i];
    const movedSide = state.side;
    const undo = makeFastMove(state, m);
    if (!isSideInCheckFast(state.cells, movedSide, state.rkIdx, state.bkIdx)) {
      legalRootMoves.push(m);
    }
    unmakeFastMove(state, m, undo);
  }

  if (legalRootMoves.length === 0) return null;
  if (legalRootMoves.length === 1) {
    const m = legalRootMoves[0];
    const from = { row: (moveFrom(m) / 9) | 0, col: moveFrom(m) % 9 };
    const to = { row: (moveTo(m) / 9) | 0, col: moveTo(m) % 9 };
    return executeMove(board, from, to)?.move ?? null;
  }

  // Track best full iteration results across Iterative Deepening
  let bestScoredList: { move: number; score: number }[] = legalRootMoves.map((m) => ({
    move: m,
    score: 0,
  }));
  let bestMoveOverall = legalRootMoves[0];

  for (let iterDepth = 1; iterDepth <= config.depth; iterDepth++) {
    if (iterDepth > 1 && Date.now() >= deadlineMs) break;

    state.aborted = false;
    // Order root moves by previous iteration's best move + scores
    const orderedRoot = bestScoredList.map((x) => x.move);
    const currentScored: { move: number; score: number }[] = [];

    const useFullRootWindow = config.noiseCp > 0;
    let alpha = -INF;
    const beta = INF;
    let iterBestMove = orderedRoot[0];
    let iterBestScore = -INF;
    let iterationCompleted = true;

    for (let i = 0; i < orderedRoot.length; i++) {
      const m = orderedRoot[i];
      const undo = makeFastMove(state, m);

      let score: number;
      if (useFullRootWindow) {
        // Compute exact minimax score per root move so calibrated noise pools never pick fail-low blunders
        score = -negamax(state, iterDepth - 1, -INF, INF, 1, true);
      } else if (i === 0) {
        score = -negamax(state, iterDepth - 1, -beta, -alpha, 1, true);
      } else {
        score = -negamax(state, iterDepth - 1, -alpha - 1, -alpha, 1, true);
        if (!state.aborted && score > alpha) {
          score = -negamax(state, iterDepth - 1, -beta, -alpha, 1, true);
        } else if (score <= alpha) {
          // Ensure fail-low bounds strictly sort below the true best alpha
          score = Math.min(score, alpha - 1);
        }
      }

      unmakeFastMove(state, m, undo);

      if (state.aborted) {
        iterationCompleted = false;
        break;
      }

      currentScored.push({ move: m, score });
      if (score > iterBestScore) {
        iterBestScore = score;
        iterBestMove = m;
      }
      if (!useFullRootWindow && score > alpha) {
        alpha = score;
      }
      // Instant mate found at root — no need to search deeper
      if (iterBestScore >= MATE_SCORE - 20) {
        break;
      }
    }

    if (iterationCompleted && currentScored.length > 0) {
      currentScored.sort((a, b) => b.score - a.score);
      bestScoredList = currentScored;
      bestMoveOverall = iterBestMove;
      if (iterBestScore >= MATE_SCORE - 20) {
        break;
      }
    } else {
      // Partial iteration aborted cleanly — keep full result from previous completed depth!
      break;
    }
  }

  let chosenPacked = bestMoveOverall;

  // Apply calibrated human-like inaccuracy ONLY on low levels (1..5) and never throw away forced mate
  if (
    config.noiseCp > 0 &&
    bestScoredList.length > 1 &&
    bestScoredList[0].score < MATE_BOUND
  ) {
    if (Math.random() < config.mistakeRate) {
      const limit = Math.min(5, bestScoredList.length);
      const pool = bestScoredList
        .slice(0, limit)
        .filter((item) => item.score >= bestScoredList[0].score - config.noiseCp * 2);
      if (pool.length > 1) {
        chosenPacked = pool[Math.floor(Math.random() * pool.length)].move;
      }
    } else {
      const pool = bestScoredList
        .slice(0, Math.min(3, bestScoredList.length))
        .filter((item) => item.score >= bestScoredList[0].score - config.noiseCp);
      if (pool.length > 1) {
        chosenPacked = pool[Math.floor(Math.random() * pool.length)].move;
      }
    }
  }

  const fIdx = moveFrom(chosenPacked);
  const tIdx = moveTo(chosenPacked);
  const from = { row: (fIdx / 9) | 0, col: fIdx % 9 };
  const to = { row: (tIdx / 9) | 0, col: tIdx % 9 };
  const executed = executeMove(board, from, to);
  if (executed) return executed.move;

  // Safety fallback to any legal move if ever needed
  const fallbackMoves = getAllLegalMoves(board, aiSide);
  if (fallbackMoves.length === 0) return null;
  return executeMove(board, fallbackMoves[0].from, fallbackMoves[0].to)?.move ?? null;
}
