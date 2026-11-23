import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Flame,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Shield,
  Snowflake,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type {
  ChronosDatabase,
  FocusPresetId,
  RpgUpgradeLevels,
  SoundscapeId,
} from '../../utils/chronosTypes.ts';
import {
  FOCUS_PRESETS,
  RPG_UPGRADE_COSTS,
  activateStreakFreeze,
  applyFocusSessionToRpg,
  upgradeRpgItem,
} from '../../utils/chronosEngine.ts';
import { chronosAudio } from '../../utils/chronosAudio.ts';

interface DeepWorkStudioViewProps {
  db: ChronosDatabase;
  onUpdateDb: (updater: (prev: ChronosDatabase) => ChronosDatabase) => void;
  selectedTaskId?: string;
  presetOverride?: FocusPresetId;
  timerRunning: boolean;
  secondsLeft: number;
  activePreset: FocusPresetId;
  onChangePreset: (preset: FocusPresetId) => void;
  onToggleRunning: () => void;
  onResetTimer: () => void;
  onSelectTask: (taskId?: string) => void;
  onCompleteSession: (actualMinutes: number, idleSubtracted: number) => void;
}

const SOUNDSCAPES: Array<{ id: SoundscapeId; label: string; desc: string }> = [
  { id: 'none', label: 'Yên tĩnh', desc: 'Không phát âm thanh nền' },
  { id: 'white', label: 'White Noise', desc: 'Lọc tạp âm môi trường' },
  { id: 'brown', label: 'Brown Noise', desc: 'Âm trầm ấm dịu thần kinh' },
  { id: 'rain', label: 'Tiếng mưa rơi', desc: 'Mưa rào thư giãn đều nhịp' },
  { id: 'binaural40', label: 'Binaural 40Hz', desc: 'Sóng Gamma tăng tập trung sâu' },
];

export const DeepWorkStudioView: React.FC<DeepWorkStudioViewProps> = ({
  db,
  onUpdateDb,
  selectedTaskId,
  timerRunning,
  secondsLeft,
  activePreset,
  onChangePreset,
  onToggleRunning,
  onResetTimer,
  onSelectTask,
  onCompleteSession,
}) => {
  const [soundMode, setSoundMode] = useState<SoundscapeId>('none');
  const [volume, setVolume] = useState(0.35);
  const [newSite, setNewSite] = useState('');
  const [idlePromptMinutes, setIdlePromptMinutes] = useState<number | null>(null);

  useEffect(() => {
    chronosAudio.setVolume(volume);
  }, [volume]);

  // Real tab-visibility idle tracker when timer is running
  useEffect(() => {
    let hiddenAt: number | null = null;
    const onVisibility = () => {
      if (!timerRunning) return;
      if (document.hidden) {
        hiddenAt = Date.now();
      } else if (hiddenAt) {
        const awayMin = Math.round((Date.now() - hiddenAt) / 60000);
        hiddenAt = null;
        if (awayMin >= 2) {
          setIdlePromptMinutes(awayMin);
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [timerRunning]);

  const handleSelectSound = (mode: SoundscapeId) => {
    setSoundMode(mode);
    chronosAudio.play(mode, volume);
  };

  const presetMeta = FOCUS_PRESETS[activePreset];
  const totalPresetSeconds = presetMeta.focusMin * 60;
  const elapsedSeconds = Math.max(0, totalPresetSeconds - secondsLeft);
  const progressPct = Math.min(100, Math.round((elapsedSeconds / totalPresetSeconds) * 100));

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const openTasks = db.tasks.filter((t) => t.status !== 'done');
  const currentTask = db.tasks.find((t) => t.id === selectedTaskId);

  const handleFinishNow = (subtractIdle = 0) => {
    const loggedMinutes = Math.max(5, Math.round(elapsedSeconds / 60) || presetMeta.focusMin);
    const netMinutes = Math.max(1, loggedMinutes - subtractIdle);
    chronosAudio.playChime();
    onCompleteSession(netMinutes, subtractIdle);
    setIdlePromptMinutes(null);
  };

  const handleAddBlockedSite = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newSite.trim().toLowerCase().replace(/^https?:\/\//, '');
    if (!cleaned || db.focusShield.blockedSites.includes(cleaned)) return;
    onUpdateDb((prev) => ({
      ...prev,
      focusShield: {
        ...prev.focusShield,
        blockedSites: [...prev.focusShield.blockedSites, cleaned],
      },
    }));
    setNewSite('');
  };

  const handleUpgradeRpg = (key: keyof RpgUpgradeLevels) => {
    onUpdateDb((prev) => ({
      ...prev,
      rpg: upgradeRpgItem(prev.rpg, key),
    }));
  };

  const handleQuickLogDemoSession = () => {
    const mins = 25;
    chronosAudio.playChime();
    onUpdateDb((prev) => ({
      ...prev,
      rpg: applyFocusSessionToRpg(prev.rpg, mins),
      focusLogs: [
        {
          id: `log-${Date.now()}`,
          taskId: currentTask?.id,
          taskTitle: currentTask?.title ?? 'Phiên tập trung sâu 25p',
          preset: activePreset,
          plannedMinutes: mins,
          actualMinutes: mins,
          idleSubtractedMinutes: 0,
          crystalsEarned: Math.round(mins * 0.6),
          completedAt: new Date().toISOString(),
        },
        ...prev.focusLogs,
      ],
    }));
  };

  const circleRadius = 88;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="space-y-4">
      {/* Idle Detection Banner */}
      {idlePromptMinutes !== null && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Phát hiện bạn rời máy / không thao tác khoảng{' '}
              <strong className="font-mono tabular-nums">{idlePromptMinutes} phút</strong>. Bạn muốn trừ khoảng thời gian rỗi này khỏi báo cáo thực tế không?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFinishNow(idlePromptMinutes)}
              className="rounded-md bg-amber-600 px-3 py-1 font-medium text-white hover:bg-amber-700"
            >
              Trừ {idlePromptMinutes}p rỗi &amp; Lưu phiên
            </button>
            <button
              type="button"
              onClick={() => setIdlePromptMinutes(null)}
              className="rounded-md border border-amber-300 dark:border-amber-700 px-2.5 py-1 text-amber-900 dark:text-amber-200"
            >
              Giữ nguyên (Tôi đọc tài liệu)
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left: Timer, Task Binding, Soundscapes */}
        <div className="xl:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-5">
            {/* Cycle Preset Switcher */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(['pomodoro', 'deep50', 'ultradian90'] as FocusPresetId[]).map((pid) => {
                const p = FOCUS_PRESETS[pid];
                const active = activePreset === pid;
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => onChangePreset(pid)}
                    className={`rounded-lg border p-2.5 text-left transition-colors ${
                      active
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-500/15'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{p.label}</div>
                    <div className="mt-0.5 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {p.focusMin}p làm / {p.breakMin}p nghỉ
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Task Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Đầu việc đang tập trung:
              </label>
              <select
                value={selectedTaskId ?? ''}
                onChange={(e) => onSelectTask(e.target.value || undefined)}
                className="flex-1 min-w-[240px] rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="">— Tập trung tự do (Chưa gắn Task) —</option>
                {openTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.estimatedMinutes}p)
                  </option>
                ))}
              </select>
            </div>

            {/* Circular Dial */}
            <div className="flex flex-col items-center py-2">
              <div className="relative h-52 w-52 flex items-center justify-center">
                <svg className="h-52 w-52 -rotate-90" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r={circleRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r={circleRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={`transition-all duration-500 ${
                      timerRunning ? 'text-emerald-500' : 'text-blue-600 dark:text-blue-400'
                    }`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                    {mm}:{ss}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {timerRunning ? 'Focus Shield đang kích hoạt' : presetMeta.label}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={onToggleRunning}
                  className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-semibold text-white transition-colors ${
                    timerRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{timerRunning ? 'Tạm dừng' : 'Bắt đầu Deep Work'}</span>
                </button>

                <button
                  type="button"
                  onClick={onResetTimer}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Đặt lại</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFinishNow(0)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Hoàn tất &amp; Lưu phiên</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIdlePromptMinutes(12)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-2 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  title="Kiểm tra cơ chế phát hiện rỗi Idle Detection"
                >
                  <span>Mô phỏng Idle 12p</span>
                </button>
              </div>
            </div>
          </div>

          {/* Built-in Web Audio Focus Soundscapes */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {soundMode === 'none' ? (
                  <VolumeX className="h-4 w-4 text-slate-400" />
                ) : (
                  <Volume2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
                <h3 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Âm Thanh Tăng Tập Trung (Web Audio Synthesizer)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Âm lượng</span>
                <input
                  type="range"
                  min={0.05}
                  max={0.9}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-24 accent-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {SOUNDSCAPES.map((s) => {
                const active = soundMode === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSound(s.id)}
                    className={`rounded-lg border p-2 text-left transition-colors ${
                      active
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-500/15'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{s.label}</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{s.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Focus Shield + Constructive Focus RPG Studio */}
        <div className="xl:col-span-5 space-y-4">
          {/* Constructive Focus RPG Workspace */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Phòng Focus Kiến Tạo · Lv.{db.rpg.level}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mỗi phút Deep Work biến thành tinh thể nâng cấp góc làm việc
                </p>
              </div>
              <div className="text-right font-mono tabular-nums">
                <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {db.rpg.crystals} tinh thể
                </div>
                <div className="text-[11px] text-slate-500">{db.rpg.totalDeepMinutes}p tích lũy</div>
              </div>
            </div>

            {/* Custom Architectural Studio SVG */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-900 overflow-hidden">
              <svg viewBox="0 0 420 190" className="w-full h-44 block">
                {/* Wall & Window Sky */}
                <rect x="0" y="0" width="420" height="190" fill="#0F172A" />
                <rect x="0" y="142" width="420" height="48" fill="#1E293B" />

                {/* Window Frame (Upgrades 1..3) */}
                <rect x="24" y="20" width="136" height="92" rx="4" fill={db.rpg.upgrades.windowView >= 3 ? '#1E3A8A' : db.rpg.upgrades.windowView === 2 ? '#1E293B' : '#0B1120'} stroke="#475569" strokeWidth="3" />
                {db.rpg.upgrades.windowView >= 2 && (
                  <path d="M26 98 L68 62 L100 84 L132 52 L158 98 Z" fill="#334155" />
                )}
                {db.rpg.upgrades.windowView >= 3 && (
                  <>
                    <circle cx="132" cy="40" r="10" fill="#FDE68A" opacity="0.85" />
                    <path d="M26 105 L75 76 L112 96 L158 70 L158 110 L26 110 Z" fill="#0F766E" opacity="0.45" />
                  </>
                )}
                <line x1="92" y1="20" x2="92" y2="112" stroke="#475569" strokeWidth="2" />

                {/* Bookshelf (Right wall) */}
                <rect x="292" y="26" width="104" height="114" rx="2" fill="#334155" stroke="#475569" strokeWidth="2" />
                <line x1="294" y1="64" x2="394" y2="64" stroke="#1E293B" strokeWidth="3" />
                <line x1="294" y1="102" x2="394" y2="102" stroke="#1E293B" strokeWidth="3" />
                <rect x="302" y="38" width="10" height="24" fill="#3B82F6" />
                <rect x="315" y="42" width="9" height="20" fill="#10B981" />
                {db.rpg.upgrades.bookshelf >= 2 && (
                  <>
                    <rect x="328" y="36" width="11" height="26" fill="#F59E0B" />
                    <rect x="302" y="74" width="12" height="26" fill="#6366F1" />
                    <rect x="318" y="78" width="10" height="22" fill="#EC4899" />
                  </>
                )}
                {db.rpg.upgrades.bookshelf >= 3 && (
                  <>
                    <rect x="345" y="72" width="14" height="28" fill="#14B8A6" />
                    <rect x="304" y="112" width="38" height="16" rx="2" fill="#94A3B8" />
                  </>
                )}

                {/* Desk (Upgrades 1..3) */}
                <rect
                  x="96"
                  y="116"
                  width="180"
                  height="12"
                  rx="2"
                  fill={db.rpg.upgrades.desk >= 3 ? '#B45309' : db.rpg.upgrades.desk === 2 ? '#92400E' : '#475569'}
                />
                <rect x="110" y="128" width="10" height="40" fill="#334155" />
                <rect x="252" y="128" width="10" height="40" fill="#334155" />

                {/* Monitor on Desk */}
                <rect x="150" y="74" width="74" height="38" rx="3" fill="#020617" stroke="#64748B" strokeWidth="2" />
                <rect x="156" y="79" width="62" height="26" fill={timerRunning ? '#064E3B' : '#1E3A8A'} />
                <rect x="182" y="112" width="10" height="5" fill="#64748B" />

                {/* Architect Lamp */}
                <path d="M122 116 L116 86 L134 76" stroke="#94A3B8" strokeWidth="3" fill="none" />
                <polygon points="128,72 142,78 134,86" fill="#E2E8F0" />
                {db.rpg.upgrades.lamp >= 2 && (
                  <polygon
                    points="134,84 114,116 156,116"
                    fill="#FDE68A"
                    opacity={db.rpg.upgrades.lamp >= 3 ? '0.26' : '0.14'}
                  />
                )}

                {/* Bonsai / Tea Plant */}
                <rect x="236" y="102" width="22" height="14" rx="2" fill="#78350F" />
                <circle cx="247" cy="94" r={db.rpg.upgrades.bonsai >= 2 ? 12 : 8} fill="#10B981" />
                {db.rpg.upgrades.bonsai >= 3 && <circle cx="256" cy="90" r="8" fill="#059669" />}
              </svg>
            </div>

            <div className="space-y-1.5">
              {(Object.keys(RPG_UPGRADE_COSTS) as Array<keyof RpgUpgradeLevels>).map((key) => {
                const lvl = db.rpg.upgrades[key];
                const meta = RPG_UPGRADE_COSTS[key];
                const nextCost = lvl < 3 ? meta.costs[lvl - 1] : null;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between text-xs border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1.5"
                  >
                    <span>
                      {meta.label}{' '}
                      <span className="font-mono text-[11px] text-slate-500">Lv.{lvl}/3</span>
                    </span>
                    {nextCost !== null ? (
                      <button
                        type="button"
                        disabled={db.rpg.crystals < nextCost}
                        onClick={() => handleUpgradeRpg(key)}
                        className="rounded bg-amber-500/15 px-2 py-0.5 font-mono text-[11px] font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 disabled:opacity-45"
                      >
                        Nâng cấp ({nextCost})
                      </button>
                    ) : (
                      <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">Tối đa</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>
                  Chuỗi <strong className="font-mono tabular-nums">{db.rpg.streakDays}</strong> ngày
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickLogDemoSession}
                  className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>+25p Ghi nhận nhanh</span>
                </button>
                <button
                  type="button"
                  disabled={db.rpg.streakFreezeActiveToday || db.rpg.streakFreezeTokens <= 0}
                  onClick={() =>
                    onUpdateDb((prev) => ({
                      ...prev,
                      rpg: activateStreakFreeze(prev.rpg),
                    }))
                  }
                  className="inline-flex items-center gap-1 rounded border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/30 px-2 py-1 text-[11px] font-medium text-sky-700 dark:text-sky-300 disabled:opacity-50"
                >
                  <Snowflake className="h-3 w-3" />
                  <span>
                    {db.rpg.streakFreezeActiveToday
                      ? 'Đã đóng băng hôm nay'
                      : `Streak Freeze (${db.rpg.streakFreezeTokens})`}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Focus Shield & Auto DND */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className={`h-4 w-4 ${db.focusShield.enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                <h3 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Focus Shield &amp; Trạng thái Tự động
                </h3>
              </div>
              <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={db.focusShield.enabled}
                  onChange={() =>
                    onUpdateDb((prev) => ({
                      ...prev,
                      focusShield: { ...prev.focusShield, enabled: !prev.focusShield.enabled },
                    }))
                  }
                  className="rounded border-slate-300 text-emerald-600"
                />
                <span>{timerRunning && db.focusShield.enabled ? 'Đang khóa xao nhãng' : 'Bật khi chạy'}</span>
              </label>
            </div>

            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-2.5 text-xs space-y-2">
              <div className="text-[11px] text-slate-500">
                Tự động chuyển trạng thái &ldquo;{db.focusShield.activeDndMessage}&rdquo; trên:
              </div>
              <div className="flex flex-wrap gap-3">
                {(['slack', 'teams', 'zalo'] as const).map((appKey) => (
                  <label key={appKey} className="inline-flex items-center gap-1.5 text-xs capitalize cursor-pointer">
                    <input
                      type="checkbox"
                      checked={db.focusShield.autoDndApps[appKey]}
                      onChange={() =>
                        onUpdateDb((prev) => ({
                          ...prev,
                          focusShield: {
                            ...prev.focusShield,
                            autoDndApps: {
                              ...prev.focusShield.autoDndApps,
                              [appKey]: !prev.focusShield.autoDndApps[appKey],
                            },
                          },
                        }))
                      }
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>{appKey === 'teams' ? 'MS Teams' : appKey}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <form onSubmit={handleAddBlockedSite} className="flex gap-2">
                <input
                  type="text"
                  value={newSite}
                  onChange={(e) => setNewSite(e.target.value)}
                  placeholder="Thêm trang web/ứng dụng cần chặn (vd: x.com)"
                  className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 text-xs"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Chặn</span>
                </button>
              </form>

              <div className="flex flex-wrap gap-1.5">
                {db.focusShield.blockedSites.map((site) => (
                  <span
                    key={site}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-slate-700 dark:text-slate-300"
                  >
                    <span>{site}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateDb((prev) => ({
                          ...prev,
                          focusShield: {
                            ...prev.focusShield,
                            blockedSites: prev.focusShield.blockedSites.filter((s) => s !== site),
                          },
                        }))
                      }
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
