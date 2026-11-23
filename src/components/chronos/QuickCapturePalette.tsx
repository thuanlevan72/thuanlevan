import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Plus, CalendarPlus, X, Zap } from 'lucide-react';
import type { ChronosTask, CognitiveLoad, Project } from '../../utils/chronosTypes.ts';
import { parseQuickCaptureInput } from '../../utils/chronosEngine.ts';

interface QuickCapturePaletteProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  defaultAssigneeId: string;
  onCreateTask: (task: ChronosTask, autoSchedule: boolean) => void;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export const QuickCapturePalette: React.FC<QuickCapturePaletteProps> = ({
  open,
  onClose,
  projects,
  defaultAssigneeId,
  onCreateTask,
}) => {
  const [rawText, setRawText] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(true);
  const [cognitiveLoad, setCognitiveLoad] = useState<CognitiveLoad>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
      if (!projectId && projects[0]) {
        setProjectId(projects[0].id);
      }
    } else {
      recognitionRef.current?.stop();
      setListening(false);
      setVoiceNote(null);
    }
  }, [open, projectId, projects]);

  if (!open) return null;

  const handleToggleVoice = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Rec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Rec) {
      setVoiceNote('Trình duyệt hiện tại chưa hỗ trợ Web Speech API. Bạn có thể gõ trực tiếp với cú pháp #45p !khan.');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const rec = new Rec();
    rec.lang = 'vi-VN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      if (transcript) {
        setRawText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    rec.onerror = () => {
      setVoiceNote('Không thể truy cập micro hoặc không nhận được giọng nói.');
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
    };
    recognitionRef.current = rec;
    setVoiceNote(null);
    setListening(true);
    rec.start();
  };

  const submit = (autoSchedule: boolean) => {
    if (!rawText.trim()) return;
    const parsed = parseQuickCaptureInput(rawText);
    const hasInlineOverride = /#|\!|@/.test(rawText);

    const finalTask: ChronosTask = {
      id: `tsk-${Date.now()}`,
      projectId: projectId || projects[0]?.id || 'prj-core',
      title: parsed.title,
      urgent: hasInlineOverride ? parsed.urgent || urgent : urgent,
      important: hasInlineOverride ? parsed.important && important : important,
      cognitiveLoad: hasInlineOverride && /@(cao|deep|high|thap|nhe|low)/i.test(rawText)
        ? parsed.cognitiveLoad
        : cognitiveLoad,
      estimatedMinutes: /(?:#|@)\d{1,3}/.test(rawText) ? parsed.estimatedMinutes : estimatedMinutes,
      actualMinutes: 0,
      status: autoSchedule ? 'scheduled' : 'inbox',
      assigneeId: defaultAssigneeId,
      subtasks: [],
      createdAt: new Date().toISOString(),
    };

    onCreateTask(finalTask, autoSchedule);
    setRawText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/55 pt-16 px-4 backdrop-blur-xs">
      <div
        className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Thu thập nhanh công việc"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Zap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Quick Capture · Thu thập dưới 3 giây</span>
            <span className="font-mono text-[11px] text-slate-400">⌘K / Esc</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(false);
          }}
          className="p-4 space-y-4"
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Ví dụ: Tối ưu SQL báo cáo tuần #60p !khan @cao"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`shrink-0 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                listening
                  ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Nhập bằng giọng nói (Tiếng Việt)"
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>

          {voiceNote && (
            <p className="text-xs text-amber-600 dark:text-amber-400">{voiceNote}</p>
          )}

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Mẹo gõ nhanh: <code className="font-mono text-slate-700 dark:text-slate-300">#45p</code> đặt thời lượng ·{' '}
            <code className="font-mono text-slate-700 dark:text-slate-300">!khan</code> đánh dấu khẩn cấp ·{' '}
            <code className="font-mono text-slate-700 dark:text-slate-300">@cao</code> / <code className="font-mono text-slate-700 dark:text-slate-300">@thap</code> mức trí lực
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Dự án
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Tải trí lực
              </label>
              <select
                value={cognitiveLoad}
                onChange={(e) => setCognitiveLoad(e.target.value as CognitiveLoad)}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="high">Cao (Deep Work)</option>
                <option value="medium">Trung bình</option>
                <option value="low">Thấp (Shallow / Admin)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Dự kiến (phút)
              </label>
              <select
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-800 dark:text-slate-200"
              >
                <option value={15}>15 phút</option>
                <option value={30}>30 phút</option>
                <option value={45}>45 phút</option>
                <option value={60}>60 phút</option>
                <option value={90}>90 phút</option>
                <option value={120}>120 phút</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={important}
                  onChange={(e) => setImportant(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Quan trọng</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span>Khẩn cấp</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Lưu vào Inbox</span>
              </button>
              <button
                type="button"
                onClick={() => submit(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                <span>Xếp lịch thông minh ngay</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
