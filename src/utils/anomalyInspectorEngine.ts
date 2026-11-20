import {
  ANOMALY_DAYS,
  AnomalyDayDefinition,
  AnomalyVerdict,
  DossierField,
  InspectionCase,
} from '../data/anomalyCases.ts';

export type AnomalyDifficultyId = 'trainee' | 'inspector' | 'nightmare';

export interface AnomalyDifficultyConfig {
  readonly id: AnomalyDifficultyId;
  readonly label: string;
  readonly badge: string;
  readonly description: string;
  readonly initialReputation: number;
  readonly timeLimitPerCaseSec: number | null; // null = untimed
  readonly dailyInvestigationTokens: number;
  readonly scoreMultiplier: number;
  readonly penaltyMultiplier: number;
  readonly redactNightmareFields: boolean;
}

export const ANOMALY_DIFFICULTIES: Record<AnomalyDifficultyId, AnomalyDifficultyConfig> = {
  trainee: {
    id: 'trainee',
    label: 'Tập Sự',
    badge: 'Dễ · Không giới hạn giờ',
    description: 'Phạt nhẹ (×0.75), 5 điểm điều tra/ngày, không áp lực thời gian để rèn kỹ năng soi mâu thuẫn.',
    initialReputation: 100,
    timeLimitPerCaseSec: null,
    dailyInvestigationTokens: 5,
    scoreMultiplier: 1,
    penaltyMultiplier: 0.75,
    redactNightmareFields: false,
  },
  inspector: {
    id: 'inspector',
    label: 'Kiểm Duyệt Viên',
    badge: 'Chuẩn · 45s/hồ sơ · ×1.3đ',
    description: 'Ca trực tiêu chuẩn với đồng hồ 45s mỗi hồ sơ, 3 điểm điều tra/ngày và thưởng suy luận ×1.3.',
    initialReputation: 100,
    timeLimitPerCaseSec: 45,
    dailyInvestigationTokens: 3,
    scoreMultiplier: 1.3,
    penaltyMultiplier: 1,
    redactNightmareFields: false,
  },
  nightmare: {
    id: 'nightmare',
    label: 'Hội Đồng Ác Mộng',
    badge: 'Khó · 28s · Che dữ liệu · ×1.85đ',
    description: 'Uy tín đầu ca 80, đồng hồ 28s, 1 trường CSDL bị mã hóa che mờ — buộc phải dùng UV/Thẩm vấn & trích dẫn điều luật!',
    initialReputation: 80,
    timeLimitPerCaseSec: 28,
    dailyInvestigationTokens: 2,
    scoreMultiplier: 1.85,
    penaltyMultiplier: 1.35,
    redactNightmareFields: true,
  },
};

export interface VerdictEvaluationOptions {
  readonly difficulty?: AnomalyDifficultyId;
  readonly citedRuleCodes?: readonly string[];
  readonly usedForensicAssist?: boolean;
}

export interface VerdictEvaluationResult {
  isCorrect: boolean;
  chosenVerdict: AnomalyVerdict;
  expectedVerdict: AnomalyVerdict;
  scoreDelta: number;
  clueBonus: number;
  ruleCitationBonus: number;
  matchedCluesCount: number;
  matchedRuleCodes: string[];
  reputationDelta: number;
  feedbackTitle: string;
  feedbackDetail: string;
}

export interface AnomalyProgressState {
  currentDayIndex: number; // 0-based index into ANOMALY_DAYS
  currentCaseIndex: number; // 0-based index into day.cases
  difficulty: AnomalyDifficultyId;
  score: number;
  bestScore: number;
  reputation: number; // 0..100
  investigationTokens: number;
  streak: number;
  correctCount: number;
  totalProcessed: number;
  highestUnlockedDay: number; // 1..ANOMALY_DAYS.length
}

export const INITIAL_REPUTATION = 100;
export const MAX_REPUTATION = 100;

export const VERDICT_LABELS: Record<AnomalyVerdict, { label: string; stamp: string }> = {
  approve: { label: 'Duyệt', stamp: 'ĐÃ DUYỆT' },
  reject: { label: 'Từ Chối', stamp: 'TỪ CHỐI' },
  alarm: { label: 'Báo Động', stamp: 'BÁO ĐỘNG ĐỎ' },
};

export function createInitialAnomalyProgress(
  startDayNumber = 1,
  bestScore = 0,
  highestUnlockedDay = 1,
  difficulty: AnomalyDifficultyId = 'inspector'
): AnomalyProgressState {
  const safeDayIdx = Math.max(0, Math.min(ANOMALY_DAYS.length - 1, startDayNumber - 1));
  const diffCfg = ANOMALY_DIFFICULTIES[difficulty] ?? ANOMALY_DIFFICULTIES.inspector;
  return {
    currentDayIndex: safeDayIdx,
    currentCaseIndex: 0,
    difficulty,
    score: 0,
    bestScore: Math.max(0, bestScore),
    reputation: diffCfg.initialReputation,
    investigationTokens: diffCfg.dailyInvestigationTokens,
    streak: 0,
    correctCount: 0,
    totalProcessed: 0,
    highestUnlockedDay: Math.max(1, Math.min(ANOMALY_DAYS.length, highestUnlockedDay)),
  };
}

export function getActiveDay(progress: AnomalyProgressState): AnomalyDayDefinition {
  return ANOMALY_DAYS[Math.max(0, Math.min(ANOMALY_DAYS.length - 1, progress.currentDayIndex))];
}

export function getActiveCase(progress: AnomalyProgressState): InspectionCase | null {
  const day = getActiveDay(progress);
  return day.cases[progress.currentCaseIndex] ?? null;
}

/**
 * Infers which rule codes (e.g. ['QT-03']) apply to a case by analyzing rule severity
 * and case expectedVerdict/explanation keywords.
 */
export function inferExpectedRuleCodes(
  day: AnomalyDayDefinition,
  caseItem: InspectionCase
): string[] {
  if (caseItem.expectedVerdict === 'approve') return [];

  const matchedCodes: string[] = [];
  const hay = `${caseItem.explanationVi} ${caseItem.statement}`.toLowerCase();

  for (const rule of day.rules) {
    if (hay.includes(rule.code.toLowerCase())) {
      matchedCodes.push(rule.code);
    }
  }

  if (matchedCodes.length > 0) return matchedCodes;

  // Fallback by severity matching verdict tier
  if (caseItem.expectedVerdict === 'alarm') {
    const crit = day.rules.find((r) => r.severity === 'critical');
    if (crit) return [crit.code];
  }
  const nonCrit = day.rules.filter((r) => r.severity !== 'critical').map((r) => r.code);
  return nonCrit.length > 0 ? nonCrit : day.rules.map((r) => r.code);
}

export function evaluateInspectionVerdict(
  caseItem: InspectionCase,
  chosenVerdict: AnomalyVerdict,
  flaggedClueIds: readonly string[],
  currentStreak = 0,
  options?: VerdictEvaluationOptions
): VerdictEvaluationResult {
  const isCorrect = chosenVerdict === caseItem.expectedVerdict;
  const difficulty = options?.difficulty;
  const diffCfg = difficulty ? ANOMALY_DIFFICULTIES[difficulty] : null;
  const scoreMult = diffCfg ? diffCfg.scoreMultiplier : 1;
  const penaltyMult = diffCfg ? diffCfg.penaltyMultiplier : 1;

  const validCluesSet = new Set(caseItem.validClueIds);
  let matchedCluesCount = 0;
  for (const id of new Set(flaggedClueIds)) {
    if (validCluesSet.has(id)) {
      matchedCluesCount++;
    }
  }

  // Rule citation evaluation
  const dayDef = ANOMALY_DAYS.find((d) => d.cases.some((c) => c.id === caseItem.id));
  const expectedRuleCodes = dayDef ? inferExpectedRuleCodes(dayDef, caseItem) : [];
  const cited = Array.from(new Set(options?.citedRuleCodes ?? []));
  const matchedRuleCodes =
    caseItem.expectedVerdict === 'approve'
      ? []
      : cited.filter((code) => expectedRuleCodes.includes(code));

  if (isCorrect) {
    const basePoints = caseItem.expectedVerdict === 'alarm' ? 140 : 100;
    const streakBonus = Math.min(80, currentStreak * 20);
    const clueBonus = matchedCluesCount * 25;
    const ruleCitationBonus = matchedRuleCodes.length > 0 ? 35 : 0;
    const rawScore = basePoints + streakBonus + clueBonus + ruleCitationBonus;
    const scoreDelta = Math.round(rawScore * scoreMult);
    const reputationDelta = caseItem.expectedVerdict === 'alarm' ? 8 : 4;

    return {
      isCorrect: true,
      chosenVerdict,
      expectedVerdict: caseItem.expectedVerdict,
      scoreDelta,
      clueBonus,
      ruleCitationBonus,
      matchedCluesCount,
      matchedRuleCodes,
      reputationDelta,
      feedbackTitle: `Phán quyết chính xác · ${VERDICT_LABELS[chosenVerdict].stamp}`,
      feedbackDetail: caseItem.explanationVi,
    };
  }

  // Heavier reputation penalty if an ALARM threat slipped through!
  let basePenalty = -25;
  if (caseItem.expectedVerdict === 'alarm' && chosenVerdict === 'approve') {
    basePenalty = -45;
  } else if (caseItem.expectedVerdict === 'alarm' && chosenVerdict === 'reject') {
    basePenalty = -30;
  } else if (chosenVerdict === 'alarm' && caseItem.expectedVerdict === 'approve') {
    basePenalty = -30;
  }

  const reputationDelta = Math.round(basePenalty * penaltyMult);

  return {
    isCorrect: false,
    chosenVerdict,
    expectedVerdict: caseItem.expectedVerdict,
    scoreDelta: 0,
    clueBonus: 0,
    ruleCitationBonus: 0,
    matchedCluesCount,
    matchedRuleCodes: [],
    reputationDelta,
    feedbackTitle: `Sai quy tắc · Đáp án đúng: ${VERDICT_LABELS[caseItem.expectedVerdict].label}`,
    feedbackDetail: caseItem.explanationVi,
  };
}

export function evaluateTimeoutFailure(
  caseItem: InspectionCase,
  difficulty: AnomalyDifficultyId
): VerdictEvaluationResult {
  const diffCfg = ANOMALY_DIFFICULTIES[difficulty];
  const repLoss = Math.round(-20 * diffCfg.penaltyMultiplier);
  return {
    isCorrect: false,
    chosenVerdict: 'reject',
    expectedVerdict: caseItem.expectedVerdict,
    scoreDelta: 0,
    clueBonus: 0,
    ruleCitationBonus: 0,
    matchedCluesCount: 0,
    matchedRuleCodes: [],
    reputationDelta: repLoss,
    feedbackTitle: `Hết giờ kiểm duyệt! · Đáp án đúng: ${VERDICT_LABELS[caseItem.expectedVerdict].label}`,
    feedbackDetail: caseItem.explanationVi,
  };
}

// ============================================================================
// FORENSIC & DEDUCTION SYSTEM (CROSS-CHECK DIFF, UV SCAN, INTERROGATION)
// ============================================================================

export interface InterrogationTurn {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly suspicionCue: string;
  readonly exposesDeception: boolean;
}

export interface ForensicDossierIntel {
  readonly redactedDbKeys: string[];
  readonly biometricSummary: string;
  readonly inkAndSealAudit: string;
  readonly uvScanFinding: string;
  readonly interrogationTurns: readonly InterrogationTurn[];
}

export function buildForensicDossier(
  caseItem: InspectionCase,
  difficulty: AnomalyDifficultyId
): ForensicDossierIntel {
  const diffCfg = ANOMALY_DIFFICULTIES[difficulty];

  // In Nightmare mode, redact 1-2 DB fields (prioritizing suspect DB fields to force UV scan or interrogation!)
  const redactedDbKeys: string[] = [];
  if (diffCfg.redactNightmareFields && caseItem.databaseFields.length > 0) {
    const suspectDb = caseItem.databaseFields.find((f) => Boolean(f.suspectId));
    if (suspectDb) {
      redactedDbKeys.push(suspectDb.key);
    } else {
      redactedDbKeys.push(caseItem.databaseFields[0].key);
    }
  }

  const hasAlarm = caseItem.expectedVerdict === 'alarm';
  const hasReject = caseItem.expectedVerdict === 'reject';

  const biometricSummary = hasAlarm
    ? 'Nhiễu sóng sinh học biên độ cao · Phát hiện bất thường nghiêm trọng ở chữ ký thực thể.'
    : hasReject
      ? 'Sinh trắc ổn định mức người bình thường, nhưng hồ sơ hành chính có điểm không khớp.'
      : 'Chỉ số sinh trắc & phản xạ đồng tử hoàn toàn khớp hồ sơ lưu trữ.';

  const inkAndSealAudit = hasAlarm
    ? `Mã ấn "${caseItem.sealNumber}" có dấu hiệu sao chép / phản xạ mực đen bất thường dưới phổ UV.`
    : `Mực con dấu "${caseItem.sealNumber}" đúng chuẩn phôi hành chính Sở Kiểm Duyệt.`;

  const uvScanFinding =
    caseItem.validClueIds.length > 0
      ? `Quét UV xác định ${caseItem.validClueIds.length} điểm mâu thuẫn cốt lõi cần đối chiếu kỹ với Sổ Quy Tắc (${hasAlarm ? 'NGUY CƠ AN NINH CAO' : 'SAI LỆCH THỦ TỤC'}).`
      : 'Quét UV toàn trang: Không phát hiện mực tẩy xóa, không thấy dấu vết dị thường.';

  const suspectCount = caseItem.validClueIds.length;
  const firstDocVal = caseItem.documentFields[0]?.value ?? 'thông tin khai báo';
  const firstDbVal = caseItem.databaseFields[0]?.value ?? 'CSDL lưu trữ';

  const interrogationTurns: InterrogationTurn[] = [
    {
      id: 'q-verify-record',
      question: 'Hỏi gắt: Tại sao thông tin đệ trình lại có điểm khác biệt hoặc cần kiểm tra chéo với CSDL gốc?',
      answer: hasAlarm
        ? `"Tôi... hệ thống của các anh bị lỗi rồi! Đừng nhìn vào mục ${firstDbVal}, cứ đóng dấu cho tôi qua ngay lập tức!" (Giọng nói bị méo tần số)`
        : hasReject
          ? `"Thành thật xin lỗi, hồ sơ ghi '${firstDocVal}' là do khâu nhập liệu trước đó chưa kịp cập nhật lại..."`
          : `"Mọi mục trên giấy (${firstDocVal}) đều khớp 100% với bản gốc trên CSDL (${firstDbVal}), cán bộ cứ kiểm tra thoải mái."`,
      suspicionCue: hasAlarm
        ? 'Lộ thái độ né tránh kiểm tra CSDL & méo tần số âm thanh'
        : hasReject
          ? 'Thừa nhận có sai sót/quá hạn giấy tờ hành chính'
          : 'Khớp logic, không có dấu hiệu quanh co',
      exposesDeception: hasAlarm || hasReject,
    },
    {
      id: 'q-forensic-alibi',
      question: 'Đối chất hiện trường: Xác nhận lại hành trình di chuyển & nguồn gốc mã ấn trước khi tới bàn trực?',
      answer: hasAlarm
        ? `"Mã ấn ${caseItem.sealNumber} do... người quen ở tầng ngầm đưa lúc nửa đêm. Không cần quét UV thêm nữa đâu!"`
        : hasReject
          ? `"Tôi tới đúng quầy bằng giấy cũ mang theo (${caseItem.sealNumber}), không mang vật cấm hay giả danh ai cả."`
          : `"Tôi xuất phát đúng tuyến lúc ${caseItem.submittedAt}, mang mã ấn ${caseItem.sealNumber} hợp lệ từ cổng chính."`,
      suspicionCue:
        suspectCount > 0
          ? hasAlarm
            ? 'Nguồn gốc mã ấn bất minh · Cảnh báo thực thể xâm nhập'
            : 'Lỗi thủ tục hành chính đơn thuần, không có yếu tố dị biệt'
          : 'Lịch trình nhất quán với thời gian trình diện',
      exposesDeception: hasAlarm,
    },
  ];

  return {
    redactedDbKeys,
    biometricSummary,
    inkAndSealAudit,
    uvScanFinding,
    interrogationTurns,
  };
}

export interface CrossCheckResult {
  readonly hasMismatch: boolean;
  readonly title: string;
  readonly detail: string;
}

export function evaluateCrossCheckPair(
  caseItem: InspectionCase,
  docField: DossierField,
  dbField: DossierField
): CrossCheckResult {
  const docSuspect = Boolean(docField.suspectId && caseItem.validClueIds.includes(docField.suspectId));
  const dbSuspect = Boolean(dbField.suspectId && caseItem.validClueIds.includes(dbField.suspectId));

  if (docSuspect || dbSuspect) {
    return {
      hasMismatch: true,
      title: 'PHÁT HIỆN MÂU THUẪN LOGIC!',
      detail: `Cặp [${docField.label}: "${docField.value}"] ↔ [${dbField.label}: "${dbField.value}"] chứa dấu hiệu bất thường cần đánh dấu NGHI VẤN và đối chiếu Sổ Quy Tắc.`,
    };
  }

  return {
    hasMismatch: false,
    title: 'Cặp dữ liệu bình thường / Không mâu thuẫn trực tiếp',
    detail: `[${docField.label}] và [${dbField.label}] hiện chưa lộ xung đột logic. Hãy thử ghép các cặp trường khác nếu vẫn nghi ngờ.`,
  };
}

export type PostVerdictTransition = 'next_case' | 'day_complete' | 'victory' | 'fired';

export function applyVerdictToProgress(
  prev: AnomalyProgressState,
  evaluation: VerdictEvaluationResult
): { nextProgress: AnomalyProgressState; transition: PostVerdictTransition } {
  const nextReputation = Math.max(
    0,
    Math.min(MAX_REPUTATION, prev.reputation + evaluation.reputationDelta)
  );
  const nextScore = Math.max(0, prev.score + evaluation.scoreDelta);
  const nextBestScore = Math.max(prev.bestScore, nextScore);
  const nextStreak = evaluation.isCorrect ? prev.streak + 1 : 0;
  const nextCorrectCount = prev.correctCount + (evaluation.isCorrect ? 1 : 0);
  const nextTotalProcessed = prev.totalProcessed + 1;

  const updatedBase: AnomalyProgressState = {
    ...prev,
    score: nextScore,
    bestScore: nextBestScore,
    reputation: nextReputation,
    streak: nextStreak,
    correctCount: nextCorrectCount,
    totalProcessed: nextTotalProcessed,
  };

  if (nextReputation <= 0) {
    return {
      nextProgress: updatedBase,
      transition: 'fired',
    };
  }

  const day = getActiveDay(prev);
  const hasMoreCasesInDay = prev.currentCaseIndex + 1 < day.cases.length;
  if (hasMoreCasesInDay) {
    return {
      nextProgress: updatedBase,
      transition: 'next_case',
    };
  }

  const isLastDay = prev.currentDayIndex + 1 >= ANOMALY_DAYS.length;
  if (isLastDay) {
    return {
      nextProgress: {
        ...updatedBase,
        highestUnlockedDay: ANOMALY_DAYS.length,
      },
      transition: 'victory',
    };
  }

  const nextUnlocked = Math.max(prev.highestUnlockedDay, prev.currentDayIndex + 2);
  return {
    nextProgress: {
      ...updatedBase,
      highestUnlockedDay: Math.min(ANOMALY_DAYS.length, nextUnlocked),
    },
    transition: 'day_complete',
  };
}

export function advanceAfterVerdict(prev: AnomalyProgressState): AnomalyProgressState {
  const day = getActiveDay(prev);
  if (prev.currentCaseIndex + 1 < day.cases.length) {
    return {
      ...prev,
      currentCaseIndex: prev.currentCaseIndex + 1,
    };
  }
  return prev;
}

export function advanceToNextDay(prev: AnomalyProgressState): AnomalyProgressState {
  const nextDayIdx = Math.min(ANOMALY_DAYS.length - 1, prev.currentDayIndex + 1);
  const diffCfg = ANOMALY_DIFFICULTIES[prev.difficulty] ?? ANOMALY_DIFFICULTIES.inspector;
  return {
    ...prev,
    currentDayIndex: nextDayIdx,
    currentCaseIndex: 0,
    investigationTokens: diffCfg.dailyInvestigationTokens,
  };
}
