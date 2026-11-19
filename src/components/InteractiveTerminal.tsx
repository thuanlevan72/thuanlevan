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
    <section id="terminal" className="space-y-4 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0369A1] dark:text-[#38BDF8]">
            <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Tra Cứu Nhanh Qua Dòng Lệnh</span>
          </p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#070B14] dark:text-[#F1F5F9]">
            Terminal Hồ Sơ Kỹ Thuật &amp; Tác Phẩm
          </h2>
        </div>
        <span className="text-xs text-[#475569] dark:text-[#94A3B8]">
          Gõ lệnh hoặc chọn nhanh bên dưới
        </span>
      </div>

      <div
        id="terminal-box"
        className="rounded-2xl bg-[#05080F] text-slate-100 border border-[#1B2B44] overflow-hidden font-mono"
      >
        <div className="px-4 py-3 bg-[#091221] border-b border-[#1B2B44] flex items-center justify-between gap-3 text-xs text-slate-400">
          <span className="truncate">bash — thuanle@portfolio</span>
          <span className="text-[#38BDF8] font-medium shrink-0">Sẵn Sàng</span>
        </div>

        <div
          id="terminal-output"
          ref={outputContainerRef}
          className="p-5 sm:p-6 text-xs sm:text-sm space-y-3 min-h-[200px] max-h-[340px] overflow-y-auto text-slate-300"
        >
          <p className="text-slate-100">
            Chào mừng bạn đến với CLI của <strong className="text-[#38BDF8]">Thuận Lê</strong>. Gõ{' '}
            <code className="text-blue-300 font-semibold">help</code> hoặc chọn một lệnh gợi ý để
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
          className="px-4 py-3 bg-[#091221] border-t border-[#1B2B44] flex items-center gap-2 sm:gap-3"
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
            placeholder="Nhập 'gallery', 'dotnet --info', 'projects', 'why-hire', 'clear'..."
            autoComplete="off"
            className="flex-1 min-w-0 bg-transparent border-none text-white placeholder:text-slate-500 focus:outline-none focus:ring-0 font-mono text-xs sm:text-sm"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-md bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-sans font-semibold text-xs transition-colors cursor-pointer shrink-0"
          >
            Chạy Lệnh
          </button>
        </form>

        <div className="px-4 py-2.5 bg-[#060C18] border-t border-[#162339] flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>Gợi ý:</span>
          {TERMINAL_SUGGESTIONS.map((item) => (
            <button
              key={item.command}
              type="button"
              onClick={() => runCommand(item.command)}
              className="px-2.5 py-1 rounded bg-[#0E1A30] hover:bg-[#16294B] text-slate-200 border border-[#1E3354] transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
