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
    if (result.action === 'noop') {
      return;
    }

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
      { id: echoId, text: result.commandEcho, toneClass: 'text-sky-400 font-bold' },
      { id: respId, text: result.responseText, toneClass: result.responseToneClass },
    ]);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    runCommand(inputValue);
    setInputValue('');
  };

  const handleSuggestedClick = (command: string) => {
    setInputValue('');
    runCommand(command);
  };

  return (
    <section id="terminal" className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-800 dark:text-dark-primary font-mono text-label-sm font-bold">
            <Terminal className="w-5 h-5" aria-hidden="true" />
            <span>LIVE INTERACTIVE CLI</span>
          </div>
          <h2 className="font-headline font-bold text-headline-lg-mobile md:text-headline-lg text-light-on-surface dark:text-dark-on-surface">
            Thử nghiệm Command Line Terminal của Thuận
          </h2>
        </div>
        <span className="hidden sm:inline font-mono text-label-sm text-light-on-surface-variant dark:text-dark-on-surface-variant font-medium">
          Gõ lệnh hoặc bấm nút gợi ý bên dưới
        </span>
      </div>

      <div
        id="terminal-box"
        className="rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 overflow-hidden font-mono shadow-2xl"
      >
        {/* Terminal Titlebar */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shrink-0" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shrink-0" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shrink-0" />
            <span className="ml-2 text-label-sm text-slate-400 truncate">
              bash — thuanle@wood-kernel: ~/portfolio
            </span>
          </div>
          <span className="text-label-sm text-emerald-400 font-bold shrink-0">
            READY (MỆNH MỘC)
          </span>
        </div>

        {/* Terminal Output Screen */}
        <div
          id="terminal-output"
          ref={outputContainerRef}
          className="p-4 sm:p-6 text-label-sm space-y-3 min-h-[220px] max-h-[380px] overflow-y-auto text-slate-300"
        >
          <p className="text-white">
            Chào mừng đến với Terminal CLI của{' '}
            <strong className="text-emerald-400">Thuận Lê (2002 - Dương Liễu Mộc)</strong>! Gõ{' '}
            <code className="text-sky-400 font-bold">help</code> để xem các lệnh khả dụng.
          </p>
          <p className="text-slate-400 font-mono overflow-hidden whitespace-nowrap">
            --------------------------------------------------------------------------------
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

        {/* Terminal Input Row */}
        <form
          onSubmit={handleSubmit}
          className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 sm:gap-3"
        >
          <label
            htmlFor="terminal-input"
            className="text-emerald-400 font-bold text-xs sm:text-label-sm shrink-0"
          >
            thuanle@portfolio:~$
          </label>
          <input
            id="terminal-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Nhập lệnh: 'dotnet --info', 'projects', 'contact', 'why-hire', 'clear'..."
            autoComplete="off"
            className="flex-1 min-w-0 bg-transparent border-none text-white placeholder:text-slate-500 focus:outline-none focus:ring-0 font-mono text-label-sm"
          />
          <button
            type="submit"
            className="px-3.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-label-sm transition cursor-pointer shrink-0"
          >
            Run
          </button>
        </form>

        {/* Quick Command Shortcuts */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-label-sm text-slate-400">
          <span>Gợi ý bấm nhanh:</span>
          {TERMINAL_SUGGESTIONS.map((item) => (
            <button
              key={item.command}
              type="button"
              onClick={() => handleSuggestedClick(item.command)}
              className={`px-2.5 py-0.5 rounded-md bg-slate-800 hover:text-emerald-400 border border-slate-700 transition cursor-pointer ${item.colorClass}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
