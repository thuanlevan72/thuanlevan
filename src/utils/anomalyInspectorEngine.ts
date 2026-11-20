import {
  ANOMALY_DAYS,
  AnomalyDayDefinition,
  AnomalyVerdict,
  InspectionCase,
} from '../data/anomalyCases.ts';

export interface VerdictEvaluationResult {
  isCorrect: boolean;
  chosenVerdict: AnomalyVerdict;
  expectedVerdict: AnomalyVerdict;
  scoreDelta: number;
  clueBonus: number;
  matchedCluesCount: number;
  reputationDelta: number;
  feedbackTitle: string;
  feedbackDetail: string;
}

export interface AnomalyProgressState {
  currentDayIndex: number; // 0-based index into ANOMALY_DAYS
  currentCaseIndex: number; // 0-based index into day.cases
  score: number;
  bestScore: number;
  reputation: number; // 0..100
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
  highestUnlockedDay = 1
): AnomalyProgressState {
  const safeDayIdx = Math.max(0, Math.min(ANOMALY_DAYS.length - 1, startDayNumber - 1));
  return {
    currentDayIndex: safeDayIdx,
    currentCaseIndex: 0,
    score: 0,
    bestScore: Math.max(0, bestScore),
    reputation: INITIAL_REPUTATION,
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

export function evaluateInspectionVerdict(
  caseItem: InspectionCase,
  chosenVerdict: AnomalyVerdict,
  flaggedClueIds: readonly string[],
  currentStreak = 0
): VerdictEvaluationResult {
  const isCorrect = chosenVerdict === caseItem.expectedVerdict;

  const validCluesSet = new Set(caseItem.validClueIds);
  let matchedCluesCount = 0;
  for (const id of new Set(flaggedClueIds)) {
    if (validCluesSet.has(id)) {
      matchedCluesCount++;
    }
  }

  if (isCorrect) {
    const basePoints = caseItem.expectedVerdict === 'alarm' ? 140 : 100;
    const streakBonus = Math.min(80, currentStreak * 20);
    const clueBonus = matchedCluesCount * 25;
    const scoreDelta = basePoints + streakBonus + clueBonus;
    const reputationDelta = caseItem.expectedVerdict === 'alarm' ? 8 : 4;

    return {
      isCorrect: true,
      chosenVerdict,
      expectedVerdict: caseItem.expectedVerdict,
      scoreDelta,
      clueBonus,
      matchedCluesCount,
      reputationDelta,
      feedbackTitle: `Phán quyết chính xác · ${VERDICT_LABELS[chosenVerdict].stamp}`,
      feedbackDetail: caseItem.explanationVi,
    };
  }

  // Heavier reputation penalty if an ALARM threat slipped through!
  let reputationDelta = -25;
  if (caseItem.expectedVerdict === 'alarm' && chosenVerdict === 'approve') {
    reputationDelta = -45;
  } else if (caseItem.expectedVerdict === 'alarm' && chosenVerdict === 'reject') {
    reputationDelta = -30;
  } else if (chosenVerdict === 'alarm' && caseItem.expectedVerdict === 'approve') {
    reputationDelta = -30;
  }

  return {
    isCorrect: false,
    chosenVerdict,
    expectedVerdict: caseItem.expectedVerdict,
    scoreDelta: 0,
    clueBonus: 0,
    matchedCluesCount,
    reputationDelta,
    feedbackTitle: `Sai quy tắc · Đáp án đúng: ${VERDICT_LABELS[caseItem.expectedVerdict].label}`,
    feedbackDetail: caseItem.explanationVi,
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
  return {
    ...prev,
    currentDayIndex: nextDayIdx,
    currentCaseIndex: 0,
  };
}
