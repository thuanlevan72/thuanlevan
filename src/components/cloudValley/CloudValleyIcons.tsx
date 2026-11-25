import type { ToolId } from '../../utils/cloudValleyData.ts';

export function CloudValleyTitleLockup() {
  return (
    <div className="select-none flex flex-col items-start gap-2">
      <svg
        viewBox="0 0 360 96"
        className="w-[290px] sm:w-[350px] h-auto drop-shadow-[0_4px_14px_rgba(45,30,15,0.16)]"
        aria-label="Thung Lũng Mây — Cloud Valley Homestead"
      >
        <defs>
          <linearGradient id="cvCrestSun" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="cvCrestLeaf" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#2E7D32" />
          </linearGradient>
        </defs>
        {/* Crest badge */}
        <g transform="translate(8, 12)">
          <circle cx="36" cy="36" r="32" fill="#FFFBF2" stroke="#5C3A21" strokeWidth="2.5" />
          <circle cx="36" cy="30" r="16" fill="url(#cvCrestSun)" />
          {/* Terrace arc */}
          <path d="M12 46 Q36 36 60 46 L56 56 Q36 64 16 56 Z" fill="#65A30D" stroke="#365314" strokeWidth="1.5" />
          {/* Cloud puffs */}
          <path
            d="M14 55 Q20 48 28 53 Q36 47 45 53 Q53 48 58 55 Q48 63 36 63 Q22 63 14 55 Z"
            fill="#FFFFFF"
            stroke="#94A3B8"
            strokeWidth="1.2"
          />
          {/* Sprout */}
          <path d="M36 44 L36 22" stroke="#365314" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M36 27 Q23 19 25 32 Q31 35 36 27 Z" fill="url(#cvCrestLeaf)" stroke="#14532D" strokeWidth="1.3" />
          <path d="M36 23 Q49 15 47 28 Q41 31 36 23 Z" fill="url(#cvCrestLeaf)" stroke="#14532D" strokeWidth="1.3" />
        </g>

        {/* Display Title Typography */}
        <text
          x="92"
          y="46"
          fill="#2D1E12"
          stroke="#FFFDF9"
          strokeWidth="5"
          paintOrder="stroke fill"
          style={{
            fontFamily: '"Noto Serif", "Cormorant Garamond", serif',
            fontSize: '30px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          Thung Lũng Mây
        </text>
        <text
          x="94"
          y="70"
          fill="#6E4726"
          stroke="#FFFDF9"
          strokeWidth="3.5"
          paintOrder="stroke fill"
          style={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '12.5px',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          CLOUD VALLEY HOMESTEAD
        </text>
      </svg>
    </div>
  );
}

export function ToolSvgIcon({ tool, className = 'w-5 h-5' }: { tool: ToolId; className?: string }) {
  if (tool === 'hoe') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="M5 19L15 9" stroke="#5C3A21" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M12 6L19 4L18 11L14 9Z" fill="#CBD5E1" stroke="#1E293B" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }
  if (tool === 'water') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="M12 3C12 3 6 10.5 6 14.5C6 17.8 8.7 20.5 12 20.5C15.3 20.5 18 17.8 18 14.5C18 10.5 12 3 12 3Z" fill="#38BDF8" stroke="#0C4A6E" strokeWidth="1.7" />
        <path d="M10 14.5C10 16 11 17 12 17" stroke="#E0F2FE" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (tool === 'seed') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="M12 20V11" stroke="#365314" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 13C8 13 6 9 8 6C11 6 12 9 12 13Z" fill="#84CC16" stroke="#365314" strokeWidth="1.4" />
        <path d="M12 11C16 11 18 7 16 4C13 4 12 7 12 11Z" fill="#4ADE80" stroke="#14532D" strokeWidth="1.4" />
      </svg>
    );
  }
  if (tool === 'harvest') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="M6 12H18L16.5 19H7.5L6 12Z" fill="#D97706" stroke="#451A03" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 12C9 8.5 10.5 6 12 6C13.5 6 15 8.5 15 12" fill="none" stroke="#78350F" strokeWidth="1.8" />
        <circle cx="12" cy="10" r="2.2" fill="#EF4444" />
      </svg>
    );
  }
  if (tool === 'compost') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect x="6" y="7" width="12" height="13" rx="2.5" fill="#92400E" stroke="#451A03" strokeWidth="1.6" />
        <path d="M9 7L10.5 4H13.5L15 7" fill="#D97706" stroke="#451A03" strokeWidth="1.4" />
        <circle cx="12" cy="13.5" r="2.5" fill="#84CC16" />
      </svg>
    );
  }
  if (tool === 'mutagen') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="M9 4H15V8L18.5 15.5C19.3 17.2 18.1 19 16.2 19H7.8C5.9 19 4.7 17.2 5.5 15.5L9 8V4Z" fill="#C084FC" stroke="#4C1D95" strokeWidth="1.6" />
        <circle cx="11" cy="14" r="1.5" fill="#FEF08A" />
        <circle cx="14.5" cy="15.5" r="1.2" fill="#FFFFFF" />
      </svg>
    );
  }
  if (tool === 'build') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="M4 11L12 4L20 11V19H4V11Z" fill="#FDE68A" stroke="#78350F" strokeWidth="1.6" strokeLinejoin="round" />
        <rect x="10" y="13" width="4" height="6" fill="#B45309" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="6" fill="#E0F2FE" stroke="#0369A1" strokeWidth="1.8" />
      <path d="M15.5 15.5L20 20" stroke="#0369A1" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
