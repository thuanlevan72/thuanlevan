export type ChessSide = 'white' | 'black';

export type ChessPieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';

export type ChessPromotionType = 'Q' | 'R' | 'B' | 'N';

export type ChessDifficulty = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type ChessGameMode = 'ai' | 'pvp';

export interface ChessLevelConfig {
  level: ChessDifficulty;
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

export const CHESS_LEVELS: readonly ChessLevelConfig[] = [
  {
    level: 1,
    name: 'Tân Binh',
    badge: 'Cấp 1',
    summary: 'Mới làm quen · Thỉnh thoảng sơ hở để bạn tập chiếu hết',
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
    summary: 'Nhận biết ăn lại quân · Không còn bỏ không Hậu Xe',
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
    summary: 'Nhìn trước 2 nước · Biết khai cuộc cơ bản & nhập thành',
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
    summary: 'Cân bằng công thủ · Khai cuộc Ý, Tây Ban Nha & Gambit Hậu',
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
    summary: 'Tính sâu 4 lớp · Kiểm soát trung tâm & cột mở cho Xe',
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
    summary: 'Đọc sâu đòn phối hợp chiến thuật · Xử lý tàn cuộc tốt thông',
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

export function normalizeChessDifficulty(difficulty: ChessDifficulty | number): ChessDifficulty {
  const n = Math.round(Number(difficulty));
  if (Number.isNaN(n) || n < 1) return 1;
  if (n > 10) return 10;
  return n as ChessDifficulty;
}

export function getChessLevelConfig(difficulty: ChessDifficulty | number): ChessLevelConfig {
  return CHESS_LEVELS[normalizeChessDifficulty(difficulty) - 1];
}

export interface ChessPiece {
  id: string;
  side: ChessSide;
  type: ChessPieceType;
}

export type ChessBoard = (ChessPiece | null)[][];

export interface BoardCoord {
  row: number; // 0 (Rank 8, Black back rank) .. 7 (Rank 1, White back rank)
  col: number; // 0 (a) .. 7 (h)
}

export interface CastlingRights {
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
}

export interface ChessPosition {
  board: ChessBoard;
  sideToMove: ChessSide;
  castling: CastlingRights;
  enPassantTarget: BoardCoord | null;
  halfmoveClock: number;
  fullmoveNumber: number;
}

export interface ChessMove {
  from: BoardCoord;
  to: BoardCoord;
  piece: ChessPiece;
  captured: ChessPiece | null;
  promotion?: ChessPromotionType;
  isCastle?: 'kingside' | 'queenside';
  isEnPassant?: boolean;
  notation: string;
  isCheck?: boolean;
  isCheckmate?: boolean;
}

export interface ChessGameResult {
  status: 'ongoing' | 'white_win' | 'black_win' | 'draw';
  reason:
    | 'checkmate'
    | 'stalemate'
    | 'insufficient_material'
    | 'fifty_move_rule'
    | 'threefold_repetition'
    | 'resign'
    | null;
  winner: ChessSide | null;
}

export const BOARD_SIZE = 8;
export const FILE_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export const PIECE_DISPLAY_INFO: Record<
  ChessSide,
  Record<ChessPieceType, { unicode: string; viName: string; shortVi: string; san: string }>
> = {
  white: {
    K: { unicode: '♔', viName: 'Vua Trắng', shortVi: 'Vua', san: 'K' },
    Q: { unicode: '♕', viName: 'Hậu Trắng', shortVi: 'Hậu', san: 'Q' },
    R: { unicode: '♖', viName: 'Xe Trắng', shortVi: 'Xe', san: 'R' },
    B: { unicode: '♗', viName: 'Tượng Trắng', shortVi: 'Tượng', san: 'B' },
    N: { unicode: '♘', viName: 'Mã Trắng', shortVi: 'Mã', san: 'N' },
    P: { unicode: '♙', viName: 'Tốt Trắng', shortVi: 'Tốt', san: '' },
  },
  black: {
    K: { unicode: '♚', viName: 'Vua Đen', shortVi: 'Vua', san: 'K' },
    Q: { unicode: '♛', viName: 'Hậu Đen', shortVi: 'Hậu', san: 'Q' },
    R: { unicode: '♜', viName: 'Xe Đen', shortVi: 'Xe', san: 'R' },
    B: { unicode: '♝', viName: 'Tượng Đen', shortVi: 'Tượng', san: 'B' },
    N: { unicode: '♞', viName: 'Mã Đen', shortVi: 'Mã', san: 'N' },
    P: { unicode: '♟', viName: 'Tốt Đen', shortVi: 'Tốt', san: '' },
  },
};

export const PIECE_MATERIAL_VALUE: Record<ChessPieceType, number> = {
  K: 20000,
  Q: 900,
  R: 500,
  B: 330,
  N: 320,
  P: 100,
};

export function createInitialBoard(): ChessBoard {
  const board: ChessBoard = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );

  const backRank: ChessPieceType[] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];

  for (let c = 0; c < BOARD_SIZE; c++) {
    const type = backRank[c];
    board[0][c] = { id: `black-${type}-${c}`, side: 'black', type };
    board[1][c] = { id: `black-P-${c}`, side: 'black', type: 'P' };
    board[6][c] = { id: `white-P-${c}`, side: 'white', type: 'P' };
    board[7][c] = { id: `white-${type}-${c}`, side: 'white', type };
  }

  return board;
}

export function createInitialPosition(): ChessPosition {
  return {
    board: createInitialBoard(),
    sideToMove: 'white',
    castling: {
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    },
    enPassantTarget: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
  };
}

export function cloneBoard(board: ChessBoard): ChessBoard {
  return board.map((row) => row.slice());
}

export function clonePosition(pos: ChessPosition): ChessPosition {
  return {
    board: cloneBoard(pos.board),
    sideToMove: pos.sideToMove,
    castling: { ...pos.castling },
    enPassantTarget: pos.enPassantTarget ? { ...pos.enPassantTarget } : null,
    halfmoveClock: pos.halfmoveClock,
    fullmoveNumber: pos.fullmoveNumber,
  };
}

export function getOppositeSide(side: ChessSide): ChessSide {
  return side === 'white' ? 'black' : 'white';
}

export function isInsideBoard(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function coordToAlgebraic(coord: BoardCoord): string {
  return `${FILE_LABELS[coord.col]}${8 - coord.row}`;
}

export function findKingPosition(board: ChessBoard, side: ChessSide): BoardCoord | null {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.side === side && piece.type === 'K') {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

const KNIGHT_OFFSETS: readonly [number, number][] = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];

const KING_OFFSETS: readonly [number, number][] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

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

export function isSquareAttackedBy(
  board: ChessBoard,
  targetRow: number,
  targetCol: number,
  attackerSide: ChessSide
): boolean {
  // 1. Pawn attacks
  const pawnFromRow = attackerSide === 'white' ? targetRow + 1 : targetRow - 1;
  if (pawnFromRow >= 0 && pawnFromRow < BOARD_SIZE) {
    for (const dc of [-1, 1]) {
      const c = targetCol + dc;
      if (c >= 0 && c < BOARD_SIZE) {
        const p = board[pawnFromRow][c];
        if (p && p.side === attackerSide && p.type === 'P') return true;
      }
    }
  }

  // 2. Knight attacks
  for (const [dr, dc] of KNIGHT_OFFSETS) {
    const r = targetRow + dr;
    const c = targetCol + dc;
    if (isInsideBoard(r, c)) {
      const p = board[r][c];
      if (p && p.side === attackerSide && p.type === 'N') return true;
    }
  }

  // 3. King attacks
  for (const [dr, dc] of KING_OFFSETS) {
    const r = targetRow + dr;
    const c = targetCol + dc;
    if (isInsideBoard(r, c)) {
      const p = board[r][c];
      if (p && p.side === attackerSide && p.type === 'K') return true;
    }
  }

  // 4. Orthogonal sliding (Rook / Queen)
  for (const [dr, dc] of ORTHO_DIRS) {
    let r = targetRow + dr;
    let c = targetCol + dc;
    while (isInsideBoard(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.side === attackerSide && (p.type === 'R' || p.type === 'Q')) return true;
        break;
      }
      r += dr;
      c += dc;
    }
  }

  // 5. Diagonal sliding (Bishop / Queen)
  for (const [dr, dc] of DIAG_DIRS) {
    let r = targetRow + dr;
    let c = targetCol + dc;
    while (isInsideBoard(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.side === attackerSide && (p.type === 'B' || p.type === 'Q')) return true;
        break;
      }
      r += dr;
      c += dc;
    }
  }

  return false;
}

export function isSideInCheck(board: ChessBoard, side: ChessSide): boolean {
  const kingPos = findKingPosition(board, side);
  if (!kingPos) return true;
  return isSquareAttackedBy(board, kingPos.row, kingPos.col, getOppositeSide(side));
}

interface RawChessCandidate {
  from: BoardCoord;
  to: BoardCoord;
  promotion?: ChessPromotionType;
  isCastle?: 'kingside' | 'queenside';
  isEnPassant?: boolean;
}

function getPseudoMovesForPiece(
  pos: ChessPosition,
  row: number,
  col: number
): RawChessCandidate[] {
  const { board, castling, enPassantTarget } = pos;
  const piece = board[row][col];
  if (!piece) return [];

  const { side, type } = piece;
  const from = { row, col };
  const candidates: RawChessCandidate[] = [];

  if (type === 'P') {
    const dir = side === 'white' ? -1 : 1;
    const startRow = side === 'white' ? 6 : 1;
    const promoRow = side === 'white' ? 0 : 7;

    const pushOrPromote = (toRow: number, toCol: number, isEp = false) => {
      if (toRow === promoRow) {
        for (const promo of ['Q', 'R', 'B', 'N'] as ChessPromotionType[]) {
          candidates.push({ from, to: { row: toRow, col: toCol }, promotion: promo });
        }
      } else {
        candidates.push({ from, to: { row: toRow, col: toCol }, isEnPassant: isEp || undefined });
      }
    };

    const oneStep = row + dir;
    if (isInsideBoard(oneStep, col) && board[oneStep][col] === null) {
      pushOrPromote(oneStep, col);
      const twoStep = row + dir * 2;
      if (row === startRow && board[twoStep][col] === null) {
        candidates.push({ from, to: { row: twoStep, col } });
      }
    }

    for (const dc of [-1, 1]) {
      const nc = col + dc;
      if (!isInsideBoard(oneStep, nc)) continue;
      const target = board[oneStep][nc];
      if (target && target.side !== side) {
        pushOrPromote(oneStep, nc);
      } else if (
        enPassantTarget &&
        enPassantTarget.row === oneStep &&
        enPassantTarget.col === nc
      ) {
        const epPawn = board[row][nc];
        if (epPawn && epPawn.side !== side && epPawn.type === 'P') {
          pushOrPromote(oneStep, nc, true);
        }
      }
    }
    return candidates;
  }

  if (type === 'N') {
    for (const [dr, dc] of KNIGHT_OFFSETS) {
      const nr = row + dr;
      const nc = col + dc;
      if (!isInsideBoard(nr, nc)) continue;
      const occ = board[nr][nc];
      if (!occ || occ.side !== side) {
        candidates.push({ from, to: { row: nr, col: nc } });
      }
    }
    return candidates;
  }

  if (type === 'B' || type === 'R' || type === 'Q') {
    const dirs =
      type === 'B' ? DIAG_DIRS : type === 'R' ? ORTHO_DIRS : [...ORTHO_DIRS, ...DIAG_DIRS];
    for (const [dr, dc] of dirs) {
      let nr = row + dr;
      let nc = col + dc;
      while (isInsideBoard(nr, nc)) {
        const occ = board[nr][nc];
        if (!occ) {
          candidates.push({ from, to: { row: nr, col: nc } });
        } else {
          if (occ.side !== side) {
            candidates.push({ from, to: { row: nr, col: nc } });
          }
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
    return candidates;
  }

  if (type === 'K') {
    for (const [dr, dc] of KING_OFFSETS) {
      const nr = row + dr;
      const nc = col + dc;
      if (!isInsideBoard(nr, nc)) continue;
      const occ = board[nr][nc];
      if (!occ || occ.side !== side) {
        candidates.push({ from, to: { row: nr, col: nc } });
      }
    }

    // Castling
    const homeRow = side === 'white' ? 7 : 0;
    const enemy = getOppositeSide(side);
    if (row === homeRow && col === 4 && !isSquareAttackedBy(board, homeRow, 4, enemy)) {
      const canK = side === 'white' ? castling.whiteKingside : castling.blackKingside;
      const rookK = board[homeRow][7];
      if (
        canK &&
        rookK &&
        rookK.side === side &&
        rookK.type === 'R' &&
        board[homeRow][5] === null &&
        board[homeRow][6] === null &&
        !isSquareAttackedBy(board, homeRow, 5, enemy) &&
        !isSquareAttackedBy(board, homeRow, 6, enemy)
      ) {
        candidates.push({ from, to: { row: homeRow, col: 6 }, isCastle: 'kingside' });
      }

      const canQ = side === 'white' ? castling.whiteQueenside : castling.blackQueenside;
      const rookQ = board[homeRow][0];
      if (
        canQ &&
        rookQ &&
        rookQ.side === side &&
        rookQ.type === 'R' &&
        board[homeRow][1] === null &&
        board[homeRow][2] === null &&
        board[homeRow][3] === null &&
        !isSquareAttackedBy(board, homeRow, 3, enemy) &&
        !isSquareAttackedBy(board, homeRow, 2, enemy)
      ) {
        candidates.push({ from, to: { row: homeRow, col: 2 }, isCastle: 'queenside' });
      }
    }
  }

  return candidates;
}

function applyCandidateToBoard(board: ChessBoard, cand: RawChessCandidate): void {
  const piece = board[cand.from.row][cand.from.col];
  if (!piece) return;

  board[cand.from.row][cand.from.col] = null;

  if (cand.isEnPassant) {
    board[cand.from.row][cand.to.col] = null;
  }

  if (cand.isCastle === 'kingside') {
    const r = cand.from.row;
    board[r][5] = board[r][7];
    board[r][7] = null;
  } else if (cand.isCastle === 'queenside') {
    const r = cand.from.row;
    board[r][3] = board[r][0];
    board[r][0] = null;
  }

  if (cand.promotion) {
    board[cand.to.row][cand.to.col] = {
      id: `${piece.id}-promo-${cand.promotion}`,
      side: piece.side,
      type: cand.promotion,
    };
  } else {
    board[cand.to.row][cand.to.col] = piece;
  }
}

function getLegalCandidatesForPiece(
  pos: ChessPosition,
  row: number,
  col: number
): RawChessCandidate[] {
  const piece = pos.board[row][col];
  if (!piece) return [];

  const pseudo = getPseudoMovesForPiece(pos, row, col);
  const legal: RawChessCandidate[] = [];

  for (const cand of pseudo) {
    const nextBoard = cloneBoard(pos.board);
    applyCandidateToBoard(nextBoard, cand);
    if (!isSideInCheck(nextBoard, piece.side)) {
      legal.push(cand);
    }
  }

  return legal;
}

export function getLegalMovesForPiece(
  pos: ChessPosition,
  fromRow: number,
  fromCol: number
): BoardCoord[] {
  const piece = pos.board[fromRow][fromCol];
  if (!piece || piece.side !== pos.sideToMove) return [];

  const cands = getLegalCandidatesForPiece(pos, fromRow, fromCol);
  const unique = new Map<string, BoardCoord>();
  for (const c of cands) {
    const k = `${c.to.row},${c.to.col}`;
    if (!unique.has(k)) unique.set(k, c.to);
  }
  return Array.from(unique.values());
}

export function isPromotionMove(
  pos: ChessPosition,
  from: BoardCoord,
  to: BoardCoord
): boolean {
  const piece = pos.board[from.row][from.col];
  if (!piece || piece.type !== 'P') return false;
  const promoRow = piece.side === 'white' ? 0 : 7;
  if (to.row !== promoRow) return false;
  return getLegalCandidatesForPiece(pos, from.row, from.col).some(
    (c) => c.to.row === to.row && c.to.col === to.col && c.promotion !== undefined
  );
}

function formatSanNotation(
  pos: ChessPosition,
  cand: RawChessCandidate,
  piece: ChessPiece,
  captured: ChessPiece | null,
  isCheck: boolean,
  isCheckmate: boolean
): string {
  const suffix = isCheckmate ? '#' : isCheck ? '+' : '';
  if (cand.isCastle === 'kingside') return `O-O${suffix}`;
  if (cand.isCastle === 'queenside') return `O-O-O${suffix}`;

  const dest = coordToAlgebraic(cand.to);
  if (piece.type === 'P') {
    const promoPart = cand.promotion ? `=${cand.promotion}` : '';
    if (captured || cand.isEnPassant) {
      return `${FILE_LABELS[cand.from.col]}x${dest}${promoPart}${suffix}`;
    }
    return `${dest}${promoPart}${suffix}`;
  }

  // Disambiguate if another same-side piece of same type can move to the same square
  let needFile = false;
  let needRank = false;
  let conflictCount = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (r === cand.from.row && c === cand.from.col) continue;
      const other = pos.board[r][c];
      if (!other || other.side !== piece.side || other.type !== piece.type) continue;
      const otherLegal = getLegalCandidatesForPiece(pos, r, c);
      if (otherLegal.some((m) => m.to.row === cand.to.row && m.to.col === cand.to.col)) {
        conflictCount++;
        if (c === cand.from.col) needRank = true;
        else needFile = true;
      }
    }
  }

  let disambig = '';
  if (conflictCount > 0) {
    if (needFile) disambig += FILE_LABELS[cand.from.col];
    if (needRank) disambig += String(8 - cand.from.row);
    if (!needFile && !needRank) disambig = FILE_LABELS[cand.from.col];
  }

  const pieceLetter = PIECE_DISPLAY_INFO[piece.side][piece.type].san;
  const captureChar = captured ? 'x' : '';
  return `${pieceLetter}${disambig}${captureChar}${dest}${suffix}`;
}

export function getAllLegalMoves(
  pos: ChessPosition,
  side: ChessSide = pos.sideToMove
): RawChessCandidate[] {
  const workPos = pos.sideToMove === side ? pos : { ...pos, sideToMove: side };
  const moves: RawChessCandidate[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = workPos.board[r][c];
      if (p && p.side === side) {
        moves.push(...getLegalCandidatesForPiece(workPos, r, c));
      }
    }
  }
  return moves;
}

export function executeMove(
  pos: ChessPosition,
  from: BoardCoord,
  to: BoardCoord,
  promotion?: ChessPromotionType
): { nextPosition: ChessPosition; move: ChessMove } | null {
  const piece = pos.board[from.row][from.col];
  if (!piece || piece.side !== pos.sideToMove) return null;

  const legal = getLegalCandidatesForPiece(pos, from.row, from.col);
  const matching = legal.filter((m) => m.to.row === to.row && m.to.col === to.col);
  if (matching.length === 0) return null;

  const chosen =
    matching.find((m) => (promotion ? m.promotion === promotion : m.promotion === 'Q' || !m.promotion)) ??
    matching[0];

  const nextPos = clonePosition(pos);
  const captured = chosen.isEnPassant
    ? nextPos.board[from.row][to.col]
    : nextPos.board[to.row][to.col];

  applyCandidateToBoard(nextPos.board, chosen);

  // Update castling rights
  if (piece.type === 'K') {
    if (piece.side === 'white') {
      nextPos.castling.whiteKingside = false;
      nextPos.castling.whiteQueenside = false;
    } else {
      nextPos.castling.blackKingside = false;
      nextPos.castling.blackQueenside = false;
    }
  } else if (piece.type === 'R') {
    if (piece.side === 'white' && from.row === 7) {
      if (from.col === 0) nextPos.castling.whiteQueenside = false;
      if (from.col === 7) nextPos.castling.whiteKingside = false;
    } else if (piece.side === 'black' && from.row === 0) {
      if (from.col === 0) nextPos.castling.blackQueenside = false;
      if (from.col === 7) nextPos.castling.blackKingside = false;
    }
  }

  // Capturing opponent's corner rook strips castling right
  if (captured && captured.type === 'R') {
    if (captured.side === 'white' && to.row === 7) {
      if (to.col === 0) nextPos.castling.whiteQueenside = false;
      if (to.col === 7) nextPos.castling.whiteKingside = false;
    } else if (captured.side === 'black' && to.row === 0) {
      if (to.col === 0) nextPos.castling.blackQueenside = false;
      if (to.col === 7) nextPos.castling.blackKingside = false;
    }
  }

  // En passant target
  if (piece.type === 'P' && Math.abs(to.row - from.row) === 2) {
    nextPos.enPassantTarget = {
      row: (from.row + to.row) / 2,
      col: from.col,
    };
  } else {
    nextPos.enPassantTarget = null;
  }

  // Clocks & turn
  nextPos.halfmoveClock = piece.type === 'P' || captured !== null ? 0 : pos.halfmoveClock + 1;
  if (pos.sideToMove === 'black') {
    nextPos.fullmoveNumber = pos.fullmoveNumber + 1;
  }
  const enemySide = getOppositeSide(piece.side);
  nextPos.sideToMove = enemySide;

  const isCheck = isSideInCheck(nextPos.board, enemySide);
  const enemyHasMoves = getAllLegalMoves(nextPos, enemySide).length > 0;
  const isCheckmate = isCheck && !enemyHasMoves;

  const move: ChessMove = {
    from,
    to,
    piece,
    captured,
    promotion: chosen.promotion,
    isCastle: chosen.isCastle,
    isEnPassant: chosen.isEnPassant,
    isCheck,
    isCheckmate,
    notation: formatSanNotation(pos, chosen, piece, captured, isCheck, isCheckmate),
  };

  return { nextPosition: nextPos, move };
}

export function hasInsufficientMaterial(board: ChessBoard): boolean {
  const whiteMinors: Array<{ type: 'B' | 'N'; squareColor: number }> = [];
  const blackMinors: Array<{ type: 'B' | 'N'; squareColor: number }> = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (!p || p.type === 'K') continue;
      if (p.type === 'P' || p.type === 'R' || p.type === 'Q') return false;
      const minor = { type: p.type, squareColor: (r + c) % 2 };
      if (p.side === 'white') whiteMinors.push(minor);
      else blackMinors.push(minor);
    }
  }

  if (whiteMinors.length === 0 && blackMinors.length === 0) return true;
  if (whiteMinors.length <= 1 && blackMinors.length === 0) return true;
  if (blackMinors.length <= 1 && whiteMinors.length === 0) return true;
  if (
    whiteMinors.length === 1 &&
    blackMinors.length === 1 &&
    whiteMinors[0].type === 'B' &&
    blackMinors[0].type === 'B' &&
    whiteMinors[0].squareColor === blackMinors[0].squareColor
  ) {
    return true;
  }

  return false;
}

export function getPositionRepetitionKey(pos: ChessPosition): string {
  let key = pos.sideToMove === 'white' ? 'w:' : 'b:';
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = pos.board[r][c];
      if (!p) key += '.';
      else key += p.side === 'white' ? p.type : p.type.toLowerCase();
    }
  }
  const cMask =
    (pos.castling.whiteKingside ? 'K' : '') +
    (pos.castling.whiteQueenside ? 'Q' : '') +
    (pos.castling.blackKingside ? 'k' : '') +
    (pos.castling.blackQueenside ? 'q' : '');
  const ep = pos.enPassantTarget ? coordToAlgebraic(pos.enPassantTarget) : '-';
  return `${key}:${cMask || '-'}:${ep}`;
}

export function evaluateGameResult(
  pos: ChessPosition,
  positionCounts?: ReadonlyMap<string, number> | readonly string[]
): ChessGameResult {
  const legalMoves = getAllLegalMoves(pos, pos.sideToMove);

  if (legalMoves.length === 0) {
    const inCheck = isSideInCheck(pos.board, pos.sideToMove);
    if (inCheck) {
      const winner = getOppositeSide(pos.sideToMove);
      return {
        status: winner === 'white' ? 'white_win' : 'black_win',
        reason: 'checkmate',
        winner,
      };
    }
    return { status: 'draw', reason: 'stalemate', winner: null };
  }

  if (pos.halfmoveClock >= 100) {
    return { status: 'draw', reason: 'fifty_move_rule', winner: null };
  }

  if (hasInsufficientMaterial(pos.board)) {
    return { status: 'draw', reason: 'insufficient_material', winner: null };
  }

  if (positionCounts) {
    const key = getPositionRepetitionKey(pos);
    let count = 0;
    if (Array.isArray(positionCounts)) {
      for (let i = 0; i < positionCounts.length; i++) {
        if (positionCounts[i] === key) count++;
      }
    } else {
      count = (positionCounts as ReadonlyMap<string, number>).get(key) ?? 0;
    }
    if (count >= 3) {
      return { status: 'draw', reason: 'threefold_repetition', winner: null };
    }
  }

  return { status: 'ongoing', reason: null, winner: null };
}

// ============================================================================
// High-Performance Int8 Chess Search Engine (Zobrist TT + Quiescence + LMR + NMP)
// ============================================================================

const CODE_EMPTY = 0;
const W_P = 1;
const W_N = 2;
const W_B = 3;
const W_R = 4;
const W_Q = 5;
const W_K = 6;
const B_K = -6;

const TYPE_TO_CODE: Record<ChessPieceType, number> = {
  P: 1,
  N: 2,
  B: 3,
  R: 4,
  Q: 5,
  K: 6,
};

const CODE_TO_PROMO: Record<number, ChessPromotionType> = {
  2: 'N',
  3: 'B',
  4: 'R',
  5: 'Q',
};

const CODE_VALUES = [0, 100, 320, 330, 500, 900, 20000];

// Piece-square tables from White's perspective (row 0 = rank 8, row 7 = rank 1)
const PAWN_PST: readonly number[] = [
  0, 0, 0, 0, 0, 0, 0, 0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5, 5, 10, 27, 27, 10, 5, 5,
  0, 0, 0, 24, 24, 0, 0, 0,
  5, -5, -10, 0, 0, -10, -5, 5,
  5, 10, 10, -24, -24, 10, 10, 5,
  0, 0, 0, 0, 0, 0, 0, 0,
];

const KNIGHT_PST: readonly number[] = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20, 0, 0, 0, 0, -20, -40,
  -30, 0, 12, 16, 16, 12, 0, -30,
  -30, 5, 16, 22, 22, 16, 5, -30,
  -30, 0, 16, 22, 22, 16, 0, -30,
  -30, 6, 12, 16, 16, 12, 6, -30,
  -40, -20, 0, 5, 5, 0, -20, -40,
  -50, -35, -30, -30, -30, -30, -35, -50,
];

const BISHOP_PST: readonly number[] = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 8, 12, 12, 8, 0, -10,
  -10, 6, 6, 12, 12, 6, 6, -10,
  -10, 0, 12, 12, 12, 12, 0, -10,
  -10, 10, 10, 10, 10, 10, 10, -10,
  -10, 8, 0, 0, 0, 0, 8, -10,
  -20, -10, -10, -10, -10, -10, -10, -20,
];

const ROOK_PST: readonly number[] = [
  0, 0, 0, 0, 0, 0, 0, 0,
  6, 14, 14, 14, 14, 14, 14, 6,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  0, 0, 0, 6, 6, 0, 0, 0,
];

const QUEEN_PST: readonly number[] = [
  -20, -10, -10, -5, -5, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 5, 5, 5, 0, -10,
  -5, 0, 5, 5, 5, 5, 0, -5,
  0, 0, 5, 5, 5, 5, 0, -5,
  -10, 5, 5, 5, 5, 5, 0, -10,
  -10, 0, 5, 0, 0, 0, 0, -10,
  -20, -10, -10, -5, -5, -10, -10, -20,
];

const KING_MG_PST: readonly number[] = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
  20, 20, 0, 0, 0, 0, 20, 20,
  20, 32, 10, 0, 0, 10, 32, 20,
];

const KING_EG_PST: readonly number[] = [
  -50, -40, -30, -20, -20, -30, -40, -50,
  -30, -20, -10, 0, 0, -10, -20, -30,
  -30, -10, 20, 30, 30, 20, -10, -30,
  -30, -10, 30, 40, 40, 30, -10, -30,
  -30, -10, 30, 40, 40, 30, -10, -30,
  -30, -10, 20, 30, 30, 20, -10, -30,
  -30, -30, 0, 0, 0, 0, -30, -30,
  -50, -30, -30, -30, -30, -30, -30, -50,
];

const PST_BY_ABS: readonly (readonly number[] | null)[] = [
  null,
  PAWN_PST,
  KNIGHT_PST,
  BISHOP_PST,
  ROOK_PST,
  QUEEN_PST,
  KING_MG_PST,
];

// Castling mask bits: 1=WK, 2=WQ, 4=BK, 8=BQ
const CASTLE_WK = 1;
const CASTLE_WQ = 2;
const CASTLE_BK = 4;
const CASTLE_BQ = 8;

// Castling mask reduction table per square
const CASTLE_MASK_UPDATE = new Uint8Array(64).fill(15);
CASTLE_MASK_UPDATE[0] = 15 ^ CASTLE_BQ; // a8
CASTLE_MASK_UPDATE[4] = 15 ^ (CASTLE_BK | CASTLE_BQ); // e8
CASTLE_MASK_UPDATE[7] = 15 ^ CASTLE_BK; // h8
CASTLE_MASK_UPDATE[56] = 15 ^ CASTLE_WQ; // a1
CASTLE_MASK_UPDATE[60] = 15 ^ (CASTLE_WK | CASTLE_WQ); // e1
CASTLE_MASK_UPDATE[63] = 15 ^ CASTLE_WK; // h1

// Move bit-packing (fits cleanly in signed 32-bit int):
// bits 0..5:   fromIdx (0..63)
// bits 6..11:  toIdx (0..63)
// bits 12..14: promoAbsCode (0 = none, 2..5 = N,B,R,Q)
// bits 15..16: flags (0=normal, 1=ep, 2=castleK, 3=castleQ)
// bits 17..20: capturedAbsCode (0..6)
const FLAG_NORMAL = 0;
const FLAG_EP = 1;
const FLAG_CASTLE_K = 2;
const FLAG_CASTLE_Q = 3;

const packMove = (
  fromIdx: number,
  toIdx: number,
  promo: number,
  flag: number,
  capAbs: number
): number => fromIdx | (toIdx << 6) | (promo << 12) | (flag << 15) | (capAbs << 17);

const moveFrom = (m: number): number => m & 63;
const moveTo = (m: number): number => (m >>> 6) & 63;
const movePromo = (m: number): number => (m >>> 12) & 7;
const moveFlag = (m: number): number => (m >>> 15) & 3;
const moveCapAbs = (m: number): number => (m >>> 17) & 15;

function makeZobristTables() {
  let seed = 0x517cc1b7;
  const nextU32 = () => {
    seed ^= seed << 13;
    seed >>>= 0;
    seed ^= seed >>> 17;
    seed >>>= 0;
    seed ^= seed << 5;
    seed >>>= 0;
    return seed;
  };
  // 13 piece slots (-6..+6 shifted by +6 => 0..12) * 64 squares
  const pieceHi = new Uint32Array(13 * 64);
  const pieceLo = new Uint32Array(13 * 64);
  for (let i = 0; i < pieceHi.length; i++) {
    pieceHi[i] = nextU32();
    pieceLo[i] = nextU32();
  }
  const castleHi = new Uint32Array(16);
  const castleLo = new Uint32Array(16);
  for (let i = 0; i < 16; i++) {
    castleHi[i] = nextU32();
    castleLo[i] = nextU32();
  }
  const epHi = new Uint32Array(9); // 0..7 file, 8=none
  const epLo = new Uint32Array(9);
  for (let i = 0; i < 9; i++) {
    epHi[i] = nextU32();
    epLo[i] = nextU32();
  }
  const sideHi = nextU32();
  const sideLo = nextU32();
  return { pieceHi, pieceLo, castleHi, castleLo, epHi, epLo, sideHi, sideLo };
}

const ZOBRIST = makeZobristTables();

const TT_SIZE = 1 << 16;
const TT_MASK = TT_SIZE - 1;
const TT_EXACT = 1;
const TT_LOWER = 2;
const TT_UPPER = 3;

const MATE_SCORE = 30000;
const MATE_BOUND = 28000;
const INF = 1000000;
const MAX_PLY = 32;

interface FastSearchState {
  cells: Int8Array;
  wkIdx: number;
  bkIdx: number;
  castleMask: number;
  epIdx: number; // -1 if none
  hashHi: number;
  hashLo: number;
  side: 1 | -1; // 1 = white, -1 = black
  ttKeyHi: Uint32Array;
  ttKeyLo: Uint32Array;
  ttDepth: Int8Array;
  ttFlag: Uint8Array;
  ttScore: Int32Array;
  ttMove: Int32Array;
  killers: Int32Array;
  history: Int32Array; // 2 * 64 * 64
  pathHashSet: number[];
  nodes: number;
  deadlineMs: number;
  aborted: boolean;
  levelConfig: ChessLevelConfig;
}

function positionToFastState(
  pos: ChessPosition,
  deadlineMs: number,
  levelConfig: ChessLevelConfig
): FastSearchState {
  const cells = new Int8Array(64);
  let wkIdx = -1;
  let bkIdx = -1;
  let hashHi = 0;
  let hashLo = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = pos.board[r][c];
      if (!p) continue;
      const idx = r * 8 + c;
      const sign = p.side === 'white' ? 1 : -1;
      const code = sign * TYPE_TO_CODE[p.type];
      cells[idx] = code;
      if (code === W_K) wkIdx = idx;
      else if (code === B_K) bkIdx = idx;

      const zIdx = (code + 6) * 64 + idx;
      hashHi = (hashHi ^ ZOBRIST.pieceHi[zIdx]) >>> 0;
      hashLo = (hashLo ^ ZOBRIST.pieceLo[zIdx]) >>> 0;
    }
  }

  let castleMask = 0;
  if (pos.castling.whiteKingside) castleMask |= CASTLE_WK;
  if (pos.castling.whiteQueenside) castleMask |= CASTLE_WQ;
  if (pos.castling.blackKingside) castleMask |= CASTLE_BK;
  if (pos.castling.blackQueenside) castleMask |= CASTLE_BQ;

  hashHi = (hashHi ^ ZOBRIST.castleHi[castleMask]) >>> 0;
  hashLo = (hashLo ^ ZOBRIST.castleLo[castleMask]) >>> 0;

  const epIdx = pos.enPassantTarget
    ? pos.enPassantTarget.row * 8 + pos.enPassantTarget.col
    : -1;
  const epFile = epIdx >= 0 ? epIdx & 7 : 8;
  hashHi = (hashHi ^ ZOBRIST.epHi[epFile]) >>> 0;
  hashLo = (hashLo ^ ZOBRIST.epLo[epFile]) >>> 0;

  const side: 1 | -1 = pos.sideToMove === 'white' ? 1 : -1;
  if (side === -1) {
    hashHi = (hashHi ^ ZOBRIST.sideHi) >>> 0;
    hashLo = (hashLo ^ ZOBRIST.sideLo) >>> 0;
  }

  return {
    cells,
    wkIdx,
    bkIdx,
    castleMask,
    epIdx,
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
    history: new Int32Array(2 * 64 * 64),
    pathHashSet: [],
    nodes: 0,
    deadlineMs,
    aborted: false,
    levelConfig,
  };
}

function isSquareAttackedFast(
  cells: Int8Array,
  sq: number,
  attackerSide: 1 | -1
): boolean {
  const r = sq >> 3;
  const c = sq & 7;

  // 1. Pawn
  const pRow = attackerSide === 1 ? r + 1 : r - 1;
  if (pRow >= 0 && pRow < 8) {
    const enemyPawn = attackerSide; // 1 or -1
    if (c > 0 && cells[(pRow << 3) | (c - 1)] === enemyPawn) return true;
    if (c < 7 && cells[(pRow << 3) | (c + 1)] === enemyPawn) return true;
  }

  // 2. Knight
  const enemyKnight = attackerSide * 2;
  for (let i = 0; i < 8; i++) {
    const nr = r + KNIGHT_OFFSETS[i][0];
    const nc = c + KNIGHT_OFFSETS[i][1];
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      if (cells[(nr << 3) | nc] === enemyKnight) return true;
    }
  }

  // 3. King
  const enemyKing = attackerSide * 6;
  for (let i = 0; i < 8; i++) {
    const nr = r + KING_OFFSETS[i][0];
    const nc = c + KING_OFFSETS[i][1];
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      if (cells[(nr << 3) | nc] === enemyKing) return true;
    }
  }

  // 4. Orthogonal Rook / Queen
  const enemyRook = attackerSide * 4;
  const enemyQueen = attackerSide * 5;
  for (let d = 0; d < 4; d++) {
    const dr = ORTHO_DIRS[d][0];
    const dc = ORTHO_DIRS[d][1];
    let nr = r + dr;
    let nc = c + dc;
    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      const occ = cells[(nr << 3) | nc];
      if (occ !== 0) {
        if (occ === enemyRook || occ === enemyQueen) return true;
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  // 5. Diagonal Bishop / Queen
  const enemyBishop = attackerSide * 3;
  for (let d = 0; d < 4; d++) {
    const dr = DIAG_DIRS[d][0];
    const dc = DIAG_DIRS[d][1];
    let nr = r + dr;
    let nc = c + dc;
    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      const occ = cells[(nr << 3) | nc];
      if (occ !== 0) {
        if (occ === enemyBishop || occ === enemyQueen) return true;
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  return false;
}

function isSideInCheckFast(state: FastSearchState, side: 1 | -1): boolean {
  const kIdx = side === 1 ? state.wkIdx : state.bkIdx;
  if (kIdx < 0) return true;
  return isSquareAttackedFast(state.cells, kIdx, (side === 1 ? -1 : 1) as 1 | -1);
}

function generatePseudoMovesFast(
  state: FastSearchState,
  capturesOnly: boolean,
  outMoves: number[]
): number {
  outMoves.length = 0;
  const { cells, side, castleMask, epIdx } = state;
  const enemy: 1 | -1 = side === 1 ? -1 : 1;

  for (let idx = 0; idx < 64; idx++) {
    const code = cells[idx];
    if (code === 0 || (side === 1 ? code < 0 : code > 0)) continue;

    const r = idx >> 3;
    const c = idx & 7;
    const absCode = code > 0 ? code : -code;

    if (absCode === 1) {
      // Pawn
      const dir = side === 1 ? -1 : 1;
      const startRow = side === 1 ? 6 : 1;
      const promoRow = side === 1 ? 0 : 7;
      const oneRow = r + dir;

      if (oneRow >= 0 && oneRow < 8) {
        const fwdIdx = (oneRow << 3) | c;
        if (cells[fwdIdx] === 0) {
          if (oneRow === promoRow) {
            outMoves.push(packMove(idx, fwdIdx, 5, FLAG_NORMAL, 0));
            if (!capturesOnly) {
              outMoves.push(packMove(idx, fwdIdx, 4, FLAG_NORMAL, 0));
              outMoves.push(packMove(idx, fwdIdx, 3, FLAG_NORMAL, 0));
              outMoves.push(packMove(idx, fwdIdx, 2, FLAG_NORMAL, 0));
            }
          } else if (!capturesOnly) {
            outMoves.push(packMove(idx, fwdIdx, 0, FLAG_NORMAL, 0));
            if (r === startRow) {
              const twoIdx = ((r + dir * 2) << 3) | c;
              if (cells[twoIdx] === 0) {
                outMoves.push(packMove(idx, twoIdx, 0, FLAG_NORMAL, 0));
              }
            }
          }
        }

        // Captures + En Passant
        for (let k = -1; k <= 1; k += 2) {
          const nc = c + k;
          if (nc < 0 || nc > 7) continue;
          const capIdx = (oneRow << 3) | nc;
          const occ = cells[capIdx];
          if (occ !== 0 && (occ > 0 ? 1 : -1) === enemy) {
            const capAbs = occ > 0 ? occ : -occ;
            if (oneRow === promoRow) {
              outMoves.push(packMove(idx, capIdx, 5, FLAG_NORMAL, capAbs));
              outMoves.push(packMove(idx, capIdx, 4, FLAG_NORMAL, capAbs));
              outMoves.push(packMove(idx, capIdx, 3, FLAG_NORMAL, capAbs));
              outMoves.push(packMove(idx, capIdx, 2, FLAG_NORMAL, capAbs));
            } else {
              outMoves.push(packMove(idx, capIdx, 0, FLAG_NORMAL, capAbs));
            }
          } else if (capIdx === epIdx) {
            outMoves.push(packMove(idx, capIdx, 0, FLAG_EP, 1));
          }
        }
      }
    } else if (absCode === 2) {
      // Knight
      for (let i = 0; i < 8; i++) {
        const nr = r + KNIGHT_OFFSETS[i][0];
        const nc = c + KNIGHT_OFFSETS[i][1];
        if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
        const toIdx = (nr << 3) | nc;
        const occ = cells[toIdx];
        if (occ === 0) {
          if (!capturesOnly) outMoves.push(packMove(idx, toIdx, 0, FLAG_NORMAL, 0));
        } else if ((occ > 0 ? 1 : -1) === enemy) {
          outMoves.push(packMove(idx, toIdx, 0, FLAG_NORMAL, occ > 0 ? occ : -occ));
        }
      }
    } else if (absCode === 3 || absCode === 4 || absCode === 5) {
      // Sliding (B=3, R=4, Q=5)
      if (absCode === 4 || absCode === 5) {
        for (let d = 0; d < 4; d++) {
          const dr = ORTHO_DIRS[d][0];
          const dc = ORTHO_DIRS[d][1];
          let nr = r + dr;
          let nc = c + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const toIdx = (nr << 3) | nc;
            const occ = cells[toIdx];
            if (occ === 0) {
              if (!capturesOnly) outMoves.push(packMove(idx, toIdx, 0, FLAG_NORMAL, 0));
            } else {
              if ((occ > 0 ? 1 : -1) === enemy) {
                outMoves.push(packMove(idx, toIdx, 0, FLAG_NORMAL, occ > 0 ? occ : -occ));
              }
              break;
            }
            nr += dr;
            nc += dc;
          }
        }
      }
      if (absCode === 3 || absCode === 5) {
        for (let d = 0; d < 4; d++) {
          const dr = DIAG_DIRS[d][0];
          const dc = DIAG_DIRS[d][1];
          let nr = r + dr;
          let nc = c + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const toIdx = (nr << 3) | nc;
            const occ = cells[toIdx];
            if (occ === 0) {
              if (!capturesOnly) outMoves.push(packMove(idx, toIdx, 0, FLAG_NORMAL, 0));
            } else {
              if ((occ > 0 ? 1 : -1) === enemy) {
                outMoves.push(packMove(idx, toIdx, 0, FLAG_NORMAL, occ > 0 ? occ : -occ));
              }
              break;
            }
            nr += dr;
            nc += dc;
          }
        }
      }
    } else {
      // King (6)
      for (let i = 0; i < 8; i++) {
        const nr = r + KING_OFFSETS[i][0];
        const nc = c + KING_OFFSETS[i][1];
        if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
        const toIdx = (nr << 3) | nc;
        const occ = cells[toIdx];
        if (occ === 0) {
          if (!capturesOnly) outMoves.push(packMove(idx, toIdx, 0, FLAG_NORMAL, 0));
        } else if ((occ > 0 ? 1 : -1) === enemy) {
          outMoves.push(packMove(idx, toIdx, 0, FLAG_NORMAL, occ > 0 ? occ : -occ));
        }
      }

      if (!capturesOnly) {
        const homeRow = side === 1 ? 7 : 0;
        if (r === homeRow && c === 4 && !isSquareAttackedFast(cells, idx, enemy)) {
          const canK = side === 1 ? (castleMask & CASTLE_WK) !== 0 : (castleMask & CASTLE_BK) !== 0;
          const kRook = cells[(homeRow << 3) | 7];
          if (
            canK &&
            kRook === side * 4 &&
            cells[(homeRow << 3) | 5] === 0 &&
            cells[(homeRow << 3) | 6] === 0 &&
            !isSquareAttackedFast(cells, (homeRow << 3) | 5, enemy) &&
            !isSquareAttackedFast(cells, (homeRow << 3) | 6, enemy)
          ) {
            outMoves.push(packMove(idx, (homeRow << 3) | 6, 0, FLAG_CASTLE_K, 0));
          }

          const canQ = side === 1 ? (castleMask & CASTLE_WQ) !== 0 : (castleMask & CASTLE_BQ) !== 0;
          const qRook = cells[(homeRow << 3) | 0];
          if (
            canQ &&
            qRook === side * 4 &&
            cells[(homeRow << 3) | 1] === 0 &&
            cells[(homeRow << 3) | 2] === 0 &&
            cells[(homeRow << 3) | 3] === 0 &&
            !isSquareAttackedFast(cells, (homeRow << 3) | 3, enemy) &&
            !isSquareAttackedFast(cells, (homeRow << 3) | 2, enemy)
          ) {
            outMoves.push(packMove(idx, (homeRow << 3) | 2, 0, FLAG_CASTLE_Q, 0));
          }
        }
      }
    }
  }

  return outMoves.length;
}

interface FastUndo {
  movedCode: number;
  capCode: number;
  prevWk: number;
  prevBk: number;
  prevCastle: number;
  prevEp: number;
  prevHi: number;
  prevLo: number;
}

function makeFastMove(state: FastSearchState, move: number): FastUndo {
  const fromIdx = moveFrom(move);
  const toIdx = moveTo(move);
  const promo = movePromo(move);
  const flag = moveFlag(move);

  const movedCode = state.cells[fromIdx];
  const prevWk = state.wkIdx;
  const prevBk = state.bkIdx;
  const prevCastle = state.castleMask;
  const prevEp = state.epIdx;
  const prevHi = state.hashHi;
  const prevLo = state.hashLo;

  let capCode = state.cells[toIdx];
  let hi = prevHi;
  let lo = prevLo;

  // Remove old ep & castle from hash
  const oldEpFile = prevEp >= 0 ? prevEp & 7 : 8;
  hi = (hi ^ ZOBRIST.epHi[oldEpFile] ^ ZOBRIST.castleHi[prevCastle]) >>> 0;
  lo = (lo ^ ZOBRIST.epLo[oldEpFile] ^ ZOBRIST.castleLo[prevCastle]) >>> 0;

  // Remove moving piece from fromIdx
  const fromZ = (movedCode + 6) * 64 + fromIdx;
  hi = (hi ^ ZOBRIST.pieceHi[fromZ]) >>> 0;
  lo = (lo ^ ZOBRIST.pieceLo[fromZ]) >>> 0;
  state.cells[fromIdx] = CODE_EMPTY;

  if (flag === FLAG_EP) {
    const epCapIdx = (fromIdx & 56) | (toIdx & 7);
    capCode = state.cells[epCapIdx];
    const epCapZ = (capCode + 6) * 64 + epCapIdx;
    hi = (hi ^ ZOBRIST.pieceHi[epCapZ]) >>> 0;
    lo = (lo ^ ZOBRIST.pieceLo[epCapZ]) >>> 0;
    state.cells[epCapIdx] = CODE_EMPTY;
  } else if (capCode !== CODE_EMPTY) {
    const capZ = (capCode + 6) * 64 + toIdx;
    hi = (hi ^ ZOBRIST.pieceHi[capZ]) >>> 0;
    lo = (lo ^ ZOBRIST.pieceLo[capZ]) >>> 0;
    if (capCode === W_K) state.wkIdx = -1;
    else if (capCode === B_K) state.bkIdx = -1;
  }

  // Place final piece at toIdx
  const placedCode = promo > 0 ? state.side * promo : movedCode;
  const toZ = (placedCode + 6) * 64 + toIdx;
  hi = (hi ^ ZOBRIST.pieceHi[toZ]) >>> 0;
  lo = (lo ^ ZOBRIST.pieceLo[toZ]) >>> 0;
  state.cells[toIdx] = placedCode;

  if (movedCode === W_K) state.wkIdx = toIdx;
  else if (movedCode === B_K) state.bkIdx = toIdx;

  // Handle Castling Rook shift
  if (flag === FLAG_CASTLE_K) {
    const rowBase = fromIdx & 56;
    const rFrom = rowBase | 7;
    const rTo = rowBase | 5;
    const rookCode = state.cells[rFrom];
    state.cells[rTo] = rookCode;
    state.cells[rFrom] = CODE_EMPTY;
    const zRF = (rookCode + 6) * 64 + rFrom;
    const zRT = (rookCode + 6) * 64 + rTo;
    hi = (hi ^ ZOBRIST.pieceHi[zRF] ^ ZOBRIST.pieceHi[zRT]) >>> 0;
    lo = (lo ^ ZOBRIST.pieceLo[zRF] ^ ZOBRIST.pieceLo[zRT]) >>> 0;
  } else if (flag === FLAG_CASTLE_Q) {
    const rowBase = fromIdx & 56;
    const rFrom = rowBase;
    const rTo = rowBase | 3;
    const rookCode = state.cells[rFrom];
    state.cells[rTo] = rookCode;
    state.cells[rFrom] = CODE_EMPTY;
    const zRF = (rookCode + 6) * 64 + rFrom;
    const zRT = (rookCode + 6) * 64 + rTo;
    hi = (hi ^ ZOBRIST.pieceHi[zRF] ^ ZOBRIST.pieceHi[zRT]) >>> 0;
    lo = (lo ^ ZOBRIST.pieceLo[zRF] ^ ZOBRIST.pieceLo[zRT]) >>> 0;
  }

  // Update castling mask
  const nextCastle = prevCastle & CASTLE_MASK_UPDATE[fromIdx] & CASTLE_MASK_UPDATE[toIdx];
  state.castleMask = nextCastle;
  hi = (hi ^ ZOBRIST.castleHi[nextCastle]) >>> 0;
  lo = (lo ^ ZOBRIST.castleLo[nextCastle]) >>> 0;

  // Update en passant square
  let nextEp = -1;
  if ((movedCode === W_P || movedCode === -1) && Math.abs((toIdx >> 3) - (fromIdx >> 3)) === 2) {
    nextEp = (fromIdx + toIdx) >> 1;
  }
  state.epIdx = nextEp;
  const nextEpFile = nextEp >= 0 ? nextEp & 7 : 8;
  hi = (hi ^ ZOBRIST.epHi[nextEpFile] ^ ZOBRIST.sideHi) >>> 0;
  lo = (lo ^ ZOBRIST.epLo[nextEpFile] ^ ZOBRIST.sideLo) >>> 0;

  state.hashHi = hi;
  state.hashLo = lo;
  state.side = state.side === 1 ? -1 : 1;

  return { movedCode, capCode, prevWk, prevBk, prevCastle, prevEp, prevHi, prevLo };
}

function unmakeFastMove(state: FastSearchState, move: number, undo: FastUndo): void {
  const fromIdx = moveFrom(move);
  const toIdx = moveTo(move);
  const flag = moveFlag(move);

  state.cells[fromIdx] = undo.movedCode;

  if (flag === FLAG_EP) {
    const epCapIdx = (fromIdx & 56) | (toIdx & 7);
    state.cells[toIdx] = CODE_EMPTY;
    state.cells[epCapIdx] = undo.capCode;
  } else {
    state.cells[toIdx] = undo.capCode;
  }

  if (flag === FLAG_CASTLE_K) {
    const rowBase = fromIdx & 56;
    state.cells[rowBase | 7] = state.cells[rowBase | 5];
    state.cells[rowBase | 5] = CODE_EMPTY;
  } else if (flag === FLAG_CASTLE_Q) {
    const rowBase = fromIdx & 56;
    state.cells[rowBase] = state.cells[rowBase | 3];
    state.cells[rowBase | 3] = CODE_EMPTY;
  }

  state.wkIdx = undo.prevWk;
  state.bkIdx = undo.prevBk;
  state.castleMask = undo.prevCastle;
  state.epIdx = undo.prevEp;
  state.hashHi = undo.prevHi;
  state.hashLo = undo.prevLo;
  state.side = state.side === 1 ? -1 : 1;
}

function evaluateFast(state: FastSearchState): number {
  const { cells, wkIdx, bkIdx } = state;

  let whiteScore = 0;
  let blackScore = 0;
  let whiteBishops = 0;
  let blackBishops = 0;
  let nonPawnMaterial = 0;

  const whitePawnsPerFile = new Uint8Array(8);
  const blackPawnsPerFile = new Uint8Array(8);
  const whiteMostAdvPawnRow = new Int8Array(8).fill(8);
  const blackMostAdvPawnRow = new Int8Array(8).fill(-1);

  for (let idx = 0; idx < 64; idx++) {
    const code = cells[idx];
    if (code === 0) continue;

    const r = idx >> 3;
    const c = idx & 7;
    const isWhite = code > 0;
    const absCode = isWhite ? code : -code;
    const pstIdx = isWhite ? idx : ((7 - r) << 3) | c;

    let val = CODE_VALUES[absCode];
    if (absCode >= 2 && absCode <= 5) {
      nonPawnMaterial += CODE_VALUES[absCode];
    }

    if (absCode !== 6) {
      const pst = PST_BY_ABS[absCode];
      if (pst) val += pst[pstIdx];
    }

    if (absCode === 1) {
      if (isWhite) {
        whitePawnsPerFile[c]++;
        if (r < whiteMostAdvPawnRow[c]) whiteMostAdvPawnRow[c] = r;
      } else {
        blackPawnsPerFile[c]++;
        if (r > blackMostAdvPawnRow[c]) blackMostAdvPawnRow[c] = r;
      }
    } else if (absCode === 3) {
      if (isWhite) whiteBishops++;
      else blackBishops++;
    } else if (absCode === 4) {
      // Rook on open/semi-open file bonus calculated below
    }

    if (isWhite) whiteScore += val;
    else blackScore += val;
  }

  // Tapered King PST (middlegame safety vs endgame centralization)
  const isEndgame = nonPawnMaterial <= 2600;
  if (wkIdx >= 0) {
    whiteScore += isEndgame ? KING_EG_PST[wkIdx] : KING_MG_PST[wkIdx];
  }
  if (bkIdx >= 0) {
    const bMirror = ((7 - (bkIdx >> 3)) << 3) | (bkIdx & 7);
    blackScore += isEndgame ? KING_EG_PST[bMirror] : KING_MG_PST[bMirror];
  }

  // Bishop pair synergy
  if (whiteBishops >= 2) whiteScore += 36;
  if (blackBishops >= 2) blackScore += 36;

  // Pawn structure & passed pawns + Rook open/semi-open files
  for (let c = 0; c < 8; c++) {
    if (whitePawnsPerFile[c] > 1) {
      whiteScore -= 14 * (whitePawnsPerFile[c] - 1);
    }
    if (blackPawnsPerFile[c] > 1) {
      blackScore -= 14 * (blackPawnsPerFile[c] - 1);
    }

    const leftEmptyW = c === 0 || whitePawnsPerFile[c - 1] === 0;
    const rightEmptyW = c === 7 || whitePawnsPerFile[c + 1] === 0;
    if (whitePawnsPerFile[c] > 0 && leftEmptyW && rightEmptyW) {
      whiteScore -= 12; // Isolated pawn
    }

    const leftEmptyB = c === 0 || blackPawnsPerFile[c - 1] === 0;
    const rightEmptyB = c === 7 || blackPawnsPerFile[c + 1] === 0;
    if (blackPawnsPerFile[c] > 0 && leftEmptyB && rightEmptyB) {
      blackScore -= 12;
    }

    // Passed pawn detection
    if (whiteMostAdvPawnRow[c] < 7) {
      const wr = whiteMostAdvPawnRow[c];
      const blockedByBlack =
        blackMostAdvPawnRow[c] >= wr ||
        (c > 0 && blackMostAdvPawnRow[c - 1] >= wr) ||
        (c < 7 && blackMostAdvPawnRow[c + 1] >= wr);
      if (!blockedByBlack) {
        whiteScore += (7 - wr) * (isEndgame ? 18 : 10);
      }
    }
    if (blackMostAdvPawnRow[c] > 0) {
      const br = blackMostAdvPawnRow[c];
      const blockedByWhite =
        whiteMostAdvPawnRow[c] <= br ||
        (c > 0 && whiteMostAdvPawnRow[c - 1] <= br) ||
        (c < 7 && whiteMostAdvPawnRow[c + 1] <= br);
      if (!blockedByWhite) {
        blackScore += br * (isEndgame ? 18 : 10);
      }
    }
  }

  // Rook open/semi-open files & 7th rank
  for (let idx = 0; idx < 64; idx++) {
    const code = cells[idx];
    if (code === 4) {
      const r = idx >> 3;
      const c = idx & 7;
      if (whitePawnsPerFile[c] === 0) {
        whiteScore += blackPawnsPerFile[c] === 0 ? 22 : 12;
      }
      if (r === 1) whiteScore += 20;
    } else if (code === -4) {
      const r = idx >> 3;
      const c = idx & 7;
      if (blackPawnsPerFile[c] === 0) {
        blackScore += whitePawnsPerFile[c] === 0 ? 22 : 12;
      }
      if (r === 6) blackScore += 20;
    }
  }

  const diff = whiteScore - blackScore;
  return state.side === 1 ? diff : -diff;
}

function scoreMovesForOrdering(
  state: FastSearchState,
  moves: number[],
  ttMove: number,
  ply: number
): Int32Array {
  const scores = new Int32Array(moves.length);
  const sideOffset = state.side === 1 ? 0 : 4096;

  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    if (m === ttMove) {
      scores[i] = 2000000;
      continue;
    }

    const capAbs = moveCapAbs(m);
    const promo = movePromo(m);
    if (capAbs > 0) {
      const mover = state.cells[moveFrom(m)];
      const absMover = mover > 0 ? mover : -mover;
      scores[i] = 1000000 + CODE_VALUES[capAbs] * 10 - CODE_VALUES[absMover];
    } else if (promo > 0) {
      scores[i] = 900000 + CODE_VALUES[promo];
    } else if (ply < MAX_PLY) {
      if (state.killers[ply * 2] === m) {
        scores[i] = 800000;
      } else if (state.killers[ply * 2 + 1] === m) {
        scores[i] = 750000;
      } else {
        scores[i] = state.history[sideOffset + moveFrom(m) * 64 + moveTo(m)];
      }
    }
  }
  return scores;
}

function pickBestMoveAt(moves: number[], scores: Int32Array, index: number): number {
  let bestIdx = index;
  let bestScore = scores[index];
  for (let j = index + 1; j < moves.length; j++) {
    if (scores[j] > bestScore) {
      bestScore = scores[j];
      bestIdx = j;
    }
  }
  if (bestIdx !== index) {
    const tm = moves[index];
    moves[index] = moves[bestIdx];
    moves[bestIdx] = tm;

    const ts = scores[index];
    scores[index] = scores[bestIdx];
    scores[bestIdx] = ts;
  }
  return moves[index];
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

  const inCheck = isSideInCheckFast(state, state.side);

  if (!inCheck) {
    const standPat = evaluateFast(state);
    if (standPat >= beta) return standPat;
    if (standPat > alpha) alpha = standPat;
    if (qDepth <= 0 || ply >= MAX_PLY - 1) return alpha;

    const rawMoves: number[] = [];
    generatePseudoMovesFast(state, true, rawMoves);
    const scores = scoreMovesForOrdering(state, rawMoves, 0, ply);

    for (let i = 0; i < rawMoves.length; i++) {
      const m = pickBestMoveAt(rawMoves, scores, i);
      const capAbs = moveCapAbs(m);
      const promo = movePromo(m);

      if (capAbs !== 6 && promo === 0 && standPat + CODE_VALUES[capAbs] + 180 < alpha) {
        continue;
      }

      const movedSide = state.side;
      const undo = makeFastMove(state, m);
      if (isSideInCheckFast(state, movedSide)) {
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
    if (ply >= MAX_PLY - 1) return evaluateFast(state);
    const rawMoves: number[] = [];
    generatePseudoMovesFast(state, false, rawMoves);
    const scores = scoreMovesForOrdering(state, rawMoves, 0, ply);
    let legalCount = 0;

    for (let i = 0; i < rawMoves.length; i++) {
      const m = pickBestMoveAt(rawMoves, scores, i);
      const movedSide = state.side;
      const undo = makeFastMove(state, m);
      if (isSideInCheckFast(state, movedSide)) {
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

    if (legalCount === 0) return -MATE_SCORE + ply;
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

  const pathKey = (state.hashHi ^ (state.hashLo * 0x9e3779b1)) >>> 0;
  if (ply > 0) {
    for (let i = state.pathHashSet.length - 1; i >= 0; i--) {
      if (state.pathHashSet[i] === pathKey) {
        return 0; // Draw by repetition on search path
      }
    }
  }

  const inCheck = isSideInCheckFast(state, state.side);
  let effectiveDepth = depth;
  if (inCheck && ply < MAX_PLY - 4 && state.levelConfig.level >= 4) {
    effectiveDepth += 1;
  }

  if (effectiveDepth <= 0) {
    return quiesce(state, alpha, beta, state.levelConfig.quiescenceDepth, ply);
  }

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

  // Null-Move Pruning (skip if in check or pawn-only endgame risk)
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
    const prevEp = state.epIdx;
    const oldEpFile = prevEp >= 0 ? prevEp & 7 : 8;

    state.side = prevSide === 1 ? -1 : 1;
    state.epIdx = -1;
    state.hashHi = (prevHi ^ ZOBRIST.sideHi ^ ZOBRIST.epHi[oldEpFile] ^ ZOBRIST.epHi[8]) >>> 0;
    state.hashLo = (prevLo ^ ZOBRIST.sideLo ^ ZOBRIST.epLo[oldEpFile] ^ ZOBRIST.epLo[8]) >>> 0;

    const R = effectiveDepth >= 6 ? 3 : 2;
    const nullScore = -negamax(state, effectiveDepth - 1 - R, -beta, -beta + 1, ply + 1, false);

    state.side = prevSide;
    state.epIdx = prevEp;
    state.hashHi = prevHi;
    state.hashLo = prevLo;

    if (state.aborted) return 0;
    if (nullScore >= beta) return beta;
  }

  const rawMoves: number[] = [];
  generatePseudoMovesFast(state, false, rawMoves);
  const scores = scoreMovesForOrdering(state, rawMoves, ttMove, ply);

  const origAlpha = alpha;
  let bestScore = -INF;
  let bestMove = 0;
  let legalCount = 0;

  state.pathHashSet.push(pathKey);

  for (let i = 0; i < rawMoves.length; i++) {
    const m = pickBestMoveAt(rawMoves, scores, i);
    const movedSide = state.side;
    const isQuiet = moveCapAbs(m) === 0 && movePromo(m) === 0;
    const undo = makeFastMove(state, m);

    if (isSideInCheckFast(state, movedSide)) {
      unmakeFastMove(state, m, undo);
      continue;
    }

    legalCount++;
    let score: number;

    if (legalCount === 1) {
      score = -negamax(state, effectiveDepth - 1, -beta, -alpha, ply + 1, true);
    } else {
      let reduction = 0;
      if (
        state.levelConfig.useLmr &&
        effectiveDepth >= 3 &&
        legalCount >= 4 &&
        isQuiet &&
        !inCheck
      ) {
        const givesCheck = isSideInCheckFast(state, state.side);
        if (!givesCheck) {
          reduction = legalCount >= 8 && effectiveDepth >= 5 ? 2 : 1;
        }
      }

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
          const sideOffset = state.side === 1 ? 0 : 4096;
          const hIdx = sideOffset + moveFrom(m) * 64 + moveTo(m);
          state.history[hIdx] = Math.min(200000, state.history[hIdx] + effectiveDepth * effectiveDepth);
        }
        break;
      }
    }
  }

  state.pathHashSet.pop();

  if (legalCount === 0) {
    return inCheck ? -MATE_SCORE + ply : 0; // Checkmate vs Stalemate
  }

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

// ============================================================================
// Curated Classical Chess Opening Book
// ============================================================================

interface BookMoveCandidate {
  from: BoardCoord;
  to: BoardCoord;
  weight: number;
}

function algebraicToCoord(sq: string): BoardCoord {
  const col = FILE_LABELS.indexOf(sq[0] as (typeof FILE_LABELS)[number]);
  const row = 8 - Number(sq[1]);
  return { row, col };
}

function buildOpeningBook(): Map<string, BookMoveCandidate[]> {
  const book = new Map<string, BookMoveCandidate[]>();

  const registerFromMoves = (
    plies: Array<[string, string]>,
    candidates: Array<{ from: string; to: string; weight: number }>
  ) => {
    let pos = createInitialPosition();
    for (const [f, t] of plies) {
      const res = executeMove(pos, algebraicToCoord(f), algebraicToCoord(t));
      if (!res) return;
      pos = res.nextPosition;
    }
    const key = getPositionRepetitionKey(pos);
    book.set(
      key,
      candidates.map((c) => ({
        from: algebraicToCoord(c.from),
        to: algebraicToCoord(c.to),
        weight: c.weight,
      }))
    );
  };

  // White 1st move
  registerFromMoves([], [
    { from: 'e2', to: 'e4', weight: 46 },
    { from: 'd2', to: 'd4', weight: 36 },
    { from: 'c2', to: 'c4', weight: 10 },
    { from: 'g1', to: 'f3', weight: 8 },
  ]);

  // 1. e4 -> Black responses (Open Game, Sicilian, French, Caro-Kann)
  registerFromMoves([['e2', 'e4']], [
    { from: 'e7', to: 'e5', weight: 40 },
    { from: 'c7', to: 'c5', weight: 32 },
    { from: 'e7', to: 'e6', weight: 16 },
    { from: 'c7', to: 'c6', weight: 12 },
  ]);

  // 1. d4 -> Black responses (Queen's Gambit Declined / King's Indian / Slav)
  registerFromMoves([['d2', 'd4']], [
    { from: 'd7', to: 'd5', weight: 44 },
    { from: 'g8', to: 'f6', weight: 42 },
    { from: 'e7', to: 'e6', weight: 14 },
  ]);

  // 1. e4 e5 -> 2. Nf3
  registerFromMoves(
    [
      ['e2', 'e4'],
      ['e7', 'e5'],
    ],
    [
      { from: 'g1', to: 'f3', weight: 75 },
      { from: 'f1', to: 'c4', weight: 15 },
      { from: 'b1', to: 'c3', weight: 10 },
    ]
  );

  // 1. e4 e5 2. Nf3 -> 2... Nc6
  registerFromMoves(
    [
      ['e2', 'e4'],
      ['e7', 'e5'],
      ['g1', 'f3'],
    ],
    [
      { from: 'b8', to: 'c6', weight: 76 },
      { from: 'g8', to: 'f6', weight: 24 },
    ]
  );

  // 1. e4 e5 2. Nf3 Nc6 -> 3. Bb5 (Ruy Lopez) / 3. Bc4 (Italian) / 3. d4 (Scotch)
  registerFromMoves(
    [
      ['e2', 'e4'],
      ['e7', 'e5'],
      ['g1', 'f3'],
      ['b8', 'c6'],
    ],
    [
      { from: 'f1', to: 'b5', weight: 45 },
      { from: 'f1', to: 'c4', weight: 40 },
      { from: 'd2', to: 'd4', weight: 15 },
    ]
  );

  // 1. e4 c5 -> 2. Nf3
  registerFromMoves(
    [
      ['e2', 'e4'],
      ['c7', 'c5'],
    ],
    [
      { from: 'g1', to: 'f3', weight: 78 },
      { from: 'b1', to: 'c3', weight: 22 },
    ]
  );

  // 1. d4 d5 -> 2. c4 (Queen's Gambit)
  registerFromMoves(
    [
      ['d2', 'd4'],
      ['d7', 'd5'],
    ],
    [
      { from: 'c2', to: 'c4', weight: 72 },
      { from: 'g1', to: 'f3', weight: 28 },
    ]
  );

  // 1. d4 Nf6 -> 2. c4
  registerFromMoves(
    [
      ['d2', 'd4'],
      ['g8', 'f6'],
    ],
    [
      { from: 'c2', to: 'c4', weight: 70 },
      { from: 'g1', to: 'f3', weight: 30 },
    ]
  );

  return book;
}

const OPENING_BOOK = buildOpeningBook();

function lookupOpeningBookMove(
  pos: ChessPosition,
  config: ChessLevelConfig
): ChessMove | null {
  if (!config.useBook) return null;
  const key = getPositionRepetitionKey(pos);
  const entries = OPENING_BOOK.get(key);
  if (!entries || entries.length === 0) return null;

  const pool =
    config.level >= 8 ? entries.slice(0, Math.min(2, entries.length)) : entries;
  const totalW = pool.reduce((acc, e) => acc + e.weight, 0);
  let r = Math.random() * totalW;
  for (const candidate of pool) {
    r -= candidate.weight;
    if (r <= 0) {
      const res = executeMove(pos, candidate.from, candidate.to);
      if (res) return res.move;
    }
  }
  return executeMove(pos, pool[0].from, pool[0].to)?.move ?? null;
}

export function findBestChessMove(
  pos: ChessPosition,
  difficulty: ChessDifficulty | number
): ChessMove | null {
  const config = getChessLevelConfig(difficulty);

  const bookMove = lookupOpeningBookMove(pos, config);
  if (bookMove) return bookMove;

  const startMs = Date.now();
  const deadlineMs = startMs + config.timeBudgetMs;
  const state = positionToFastState(pos, deadlineMs, config);

  const pseudoMoves: number[] = [];
  generatePseudoMovesFast(state, false, pseudoMoves);
  const legalRootMoves: number[] = [];

  for (let i = 0; i < pseudoMoves.length; i++) {
    const m = pseudoMoves[i];
    const movedSide = state.side;
    const undo = makeFastMove(state, m);
    if (!isSideInCheckFast(state, movedSide)) {
      legalRootMoves.push(m);
    }
    unmakeFastMove(state, m, undo);
  }

  if (legalRootMoves.length === 0) return null;
  if (legalRootMoves.length === 1) {
    const m = legalRootMoves[0];
    const from = { row: moveFrom(m) >> 3, col: moveFrom(m) & 7 };
    const to = { row: moveTo(m) >> 3, col: moveTo(m) & 7 };
    const p = movePromo(m);
    return executeMove(pos, from, to, p > 0 ? CODE_TO_PROMO[p] : undefined)?.move ?? null;
  }

  let bestScoredList: { move: number; score: number }[] = legalRootMoves.map((m) => ({
    move: m,
    score: 0,
  }));
  let bestMoveOverall = legalRootMoves[0];

  for (let iterDepth = 1; iterDepth <= config.depth; iterDepth++) {
    if (iterDepth > 1 && Date.now() >= deadlineMs) break;

    state.aborted = false;
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
        score = -negamax(state, iterDepth - 1, -INF, INF, 1, true);
      } else if (i === 0) {
        score = -negamax(state, iterDepth - 1, -beta, -alpha, 1, true);
      } else {
        score = -negamax(state, iterDepth - 1, -alpha - 1, -alpha, 1, true);
        if (!state.aborted && score > alpha) {
          score = -negamax(state, iterDepth - 1, -beta, -alpha, 1, true);
        } else if (score <= alpha) {
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
      break;
    }
  }

  let chosenPacked = bestMoveOverall;

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
  const promoCode = movePromo(chosenPacked);
  const from = { row: fIdx >> 3, col: fIdx & 7 };
  const to = { row: tIdx >> 3, col: tIdx & 7 };
  const executed = executeMove(pos, from, to, promoCode > 0 ? CODE_TO_PROMO[promoCode] : undefined);
  if (executed) return executed.move;

  const fallbackMoves = getAllLegalMoves(pos, pos.sideToMove);
  if (fallbackMoves.length === 0) return null;
  const fb = fallbackMoves[0];
  return executeMove(pos, fb.from, fb.to, fb.promotion)?.move ?? null;
}
