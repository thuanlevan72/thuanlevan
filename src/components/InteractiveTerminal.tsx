import { Terminal } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { TERMINAL_SUGGESTIONS } from '../data/portfolioData.ts';
import { executeCliCommand, TerminalEntry } from '../utils/portfolioLogic.ts';

export function InteractiveTerminal() {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<TerminalEntry[]>([]);
  const outputContainerRef = useRef<HTMLDivElement>(null);
  const idCounterRef = useRef(0);

  useEffect(() => {
    const el = outputContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [history]);

  const runCommand = (rawCommand: string) => {
    const result = executeCliCommand(rawCommand);
    if (result.action === 'noop') return;

    if (result.action === 'clear') {
      setHistory([]);
      return;
    }

    idCounterRef.current += 1;
    const echoId = `cmd-${idCounterRef.current}`;
    idCounterRef.current += 1;
    const respId = `res-${idCounterRef.current}`;

    setHistory((prev) => [
      ...prev,
      { id: echoId, text: result.commandEcho, toneClass: 'text-[#38BDF8] font-semibold' },
      { id: respId, text: result.responseText, toneClass: result.responseToneClass },
    ]);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    runCommand(inputValue);
    setInputValue('');
  };

  return (
    <section id="terminal" className="scroll-mt-24 space-y-5 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div className="space-y-1.5">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0369A1] dark:text-[#38BDF8] tracking-wide">
            <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Tra Cứu Nhanh Qua Dòng Lệnh</span>
          </p>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl tracking-[-0.015em] text-[#070B14] dark:text-[#F1F5F9]">
            Terminal Hồ Sơ Kỹ Thuật &amp; Tác Phẩm
          </h2>
        </div>
        <span className="text-xs text-[#475569] dark:text-[#94A3B8]">
          Gõ lệnh hoặc chọn nhanh bên dưới
        </span>
      </div>

      <div
        id="terminal-box"
        className="rounded-3xl bg-gradient-to-b from-[#060B15] to-[#05080F] text-slate-100 border border-[#1B2B44] shadow-[0_24px_48px_-24px_rgba(5,8,15,0.6)] overflow-hidden font-mono"
      >
        <div className="px-5 py-3.5 bg-[#091324] border-b border-[#182842] flex items-center justify-between gap-3 text-xs text-slate-400">
          <span className="truncate font-medium text-slate-300">bash — thuanle@portfolio</span>
          <span className="text-[#38BDF8] font-medium shrink-0">Sẵn Sàng</span>
        </div>

        <div
          id="terminal-output"
          ref={outputContainerRef}
          className="p-5 sm:p-7 text-xs sm:text-sm space-y-3 min-h-[200px] max-h-[340px] overflow-y-auto text-slate-300"
        >
          <p className="text-slate-100 leading-relaxed">
            Chào mừng bạn đến với CLI của <strong className="text-[#38BDF8]">Thuận Lê</strong>. Gõ{' '}
            <code className="text-sky-300 font-semibold">help</code> hoặc chọn một lệnh gợi ý để
            tra cứu nhanh.
          </p>
          <div id="terminal-history" className="space-y-3">
            {history.map((entry) => (
              <pre
                key={entry.id}
                className={`${entry.toneClass} whitespace-pre-wrap font-mono leading-relaxed text-xs sm:text-sm`}
              >
                {entry.text}
              </pre>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-5 py-3.5 bg-[#091324] border-t border-[#182842] flex items-center gap-2.5 sm:gap-3"
        >
          <label
            htmlFor="terminal-input"
            className="text-[#38BDF8] font-semibold text-xs shrink-0"
          >
            thuanle:~$
          </label>
          <input
            id="terminal-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Nhập 'ai-agents', 'cv', 'gallery', 'dotnet --info', 'projects', 'clear'..."
            autoComplete="off"
            className="flex-1 min-w-0 bg-transparent border-none text-white placeholder:text-slate-500 focus:outline-none focus:ring-0 font-mono text-xs sm:text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white font-sans font-semibold text-xs transition-colors duration-200 cursor-pointer shrink-0"
          >
            Chạy Lệnh
          </button>
        </form>

        <div className="px-5 py-3 bg-[#060C18] border-t border-[#152238] flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="mr-1">Gợi ý:</span>
          {TERMINAL_SUGGESTIONS.map((item) => (
            <button
              key={item.command}
              type="button"
              onClick={() => runCommand(item.command)}
              className="px-3 py-1.5 rounded-lg bg-[#0E1A30] hover:bg-[#15284A] hover:border-[#38BDF8]/50 text-slate-200 border border-[#1E3354] transition-all duration-150 cursor-pointer whitespace-nowrap"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
