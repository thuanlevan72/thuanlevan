import { Camera, Feather, LayoutGrid, Minimize2, Sparkles, Zap } from 'lucide-react';
import { TemplateOption } from '../utils/portfolioLogic.ts';

interface TemplateSwitcherBarProps<T extends string> {
  id: string;
  label: string;
  ariaLabel: string;
  options: TemplateOption<T>[];
  activeId: T;
  onChange: (nextId: T) => void;
}

function getTemplateIcon(id: string) {
  switch (id) {
    case 'modern':
      return <LayoutGrid className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
    case 'classical':
      return <Feather className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
    case 'introvert':
      return <Minimize2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
    case 'extrovert':
      return <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
    case 'youthful':
      return <Zap className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
    case 'retro':
      return <Camera className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
    default:
      return <LayoutGrid className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
  }
}

function getActiveAccentClasses(id: string): string {
  switch (id) {
    case 'classical':
      return 'bg-[#FBF6EC] dark:bg-[#231912] text-[#8B2324] dark:text-[#F4B860] border border-[#D7C3A1] dark:border-[#6B4E2E] shadow-xs font-semibold';
    case 'introvert':
      return 'bg-white dark:bg-[#141A23] text-[#1E293B] dark:text-[#E2E8F0] border border-[#CBD5E1] dark:border-[#2B3748] shadow-xs font-semibold';
    case 'extrovert':
      return 'bg-[#0A192F] dark:bg-[#0284C7] text-white border border-transparent shadow-[0_6px_16px_-6px_rgba(2,132,199,0.55)] font-semibold';
    case 'youthful':
      return 'bg-[#2563EB] dark:bg-[#0D9488] text-white border border-transparent shadow-[0_6px_16px_-6px_rgba(37,99,235,0.5)] font-semibold';
    case 'retro':
      return 'bg-[#F4ECD8] dark:bg-[#261E16] text-[#6B3F1D] dark:text-[#FBBF24] border border-dashed border-[#B45309]/50 dark:border-[#F59E0B]/50 shadow-xs font-semibold';
    default:
      return 'bg-white dark:bg-[#14233E] text-[#070B14] dark:text-[#F1F5F9] border border-[#CBD8E6] dark:border-[#243B61] shadow-[0_2px_8px_-2px_rgba(10,25,47,0.14)] font-semibold';
  }
}

export function TemplateSwitcherBar<T extends string>({
  id,
  label,
  ariaLabel,
  options,
  activeId,
  onChange,
}: TemplateSwitcherBarProps<T>) {
  const activeOption = options.find((opt) => opt.id === activeId);

  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-[#475569] dark:text-[#94A3B8] min-w-0">
        <span className="font-mono uppercase tracking-wider font-semibold text-[#0369A1] dark:text-[#38BDF8] shrink-0">
          {label}
        </span>
        {activeOption && (
          <>
            <span aria-hidden="true" className="text-[#CBD8E6] dark:text-[#1E3250] shrink-0">
              ·
            </span>
            <span className="truncate font-medium text-[#334155] dark:text-[#CBD5E1]">
              {activeOption.shortDesc}
            </span>
          </>
        )}
      </div>

      <div
        id={id}
        role="tablist"
        aria-label={ariaLabel}
        className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:inline-flex sm:flex-wrap items-center gap-1 p-1.5 rounded-2xl bg-[#E8F0F9] dark:bg-[#0B1426] border border-[#DCE6F2] dark:border-[#182740] w-full sm:w-auto"
      >
        {options.map((option) => {
          const isActive = option.id === activeId;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              title={option.shortDesc}
              onClick={() => onChange(option.id)}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[38px] rounded-xl text-[11px] sm:text-xs transition-all duration-200 whitespace-nowrap cursor-pointer ${
                isActive
                  ? getActiveAccentClasses(option.id)
                  : 'border border-transparent text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-[#F1F5F9] font-medium'
              }`}
            >
              {getTemplateIcon(option.id)}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
