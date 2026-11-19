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
      { id: echoId, text: result.commandEcho, toneClass: 'text-amber-300 font-semibold' },
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
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9F1239] dark:text-[#FB7185]">
            <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Tra Cứu Nhanh Qua Dòng Lệnh</span>
          </p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#181615] dark:text-[#F4F1EC]">
            Terminal Hồ Sơ Kỹ Thuật &amp; Tác Phẩm
          </h2>
        </div>
        <span className="text-xs text-[#5E5852] dark:text-[#A8A29E]">
          Gõ lệnh hoặc chọn nhanh bên dưới
        </span>
      </div>

      <div
        id="terminal-box"
        className="rounded-2xl bg-[#121114] text-stone-100 border border-[#2C2A30] overflow-hidden font-mono"
      >
        <div className="px-4 py-3 bg-[#0C0B0D] border-b border-[#27262B] flex items-center justify-between gap-3 text-xs text-stone-400">
          <span className="truncate">bash — thuanle@portfolio</span>
          <span className="text-amber-300 font-medium shrink-0">Sẵn Sàng</span>
        </div>

        <div
          id="terminal-output"
          ref={outputContainerRef}
          className="p-5 sm:p-6 text-xs sm:text-sm space-y-3 min-h-[200px] max-h-[340px] overflow-y-auto text-stone-300"
        >
          <p className="text-stone-100">
            Chào mừng bạn đến với CLI của <strong className="text-amber-300">Thuận Lê</strong>. Gõ{' '}
            <code className="text-rose-300 font-semibold">help</code> hoặc chọn một lệnh gợi ý để
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
          className="px-4 py-3 bg-[#0C0B0D] border-t border-[#27262B] flex items-center gap-2 sm:gap-3"
        >
          <label
            htmlFor="terminal-input"
            className="text-rose-400 font-semibold text-xs shrink-0"
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
            className="flex-1 min-w-0 bg-transparent border-none text-white placeholder:text-stone-500 focus:outline-none focus:ring-0 font-mono text-xs sm:text-sm"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-md bg-[#9F1239] hover:bg-[#BE123C] text-white font-sans font-semibold text-xs transition-colors cursor-pointer shrink-0"
          >
            Chạy Lệnh
          </button>
        </form>

        <div className="px-4 py-2.5 bg-[#09080A] border-t border-[#232227] flex flex-wrap items-center gap-2 text-xs text-stone-400">
          <span>Gợi ý:</span>
          {TERMINAL_SUGGESTIONS.map((item) => (
            <button
              key={item.command}
              type="button"
              onClick={() => runCommand(item.command)}
              className="px-2.5 py-1 rounded bg-[#1B1A1F] hover:bg-[#27262C] text-stone-200 border border-[#2E2D35] transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
