import type { FarmerHatId, ToolId } from '../../utils/cloudValleyData.ts';

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
        <g transform="translate(8, 12)">
          <circle cx="36" cy="36" r="32" fill="#FFFBF2" stroke="#5C3A21" strokeWidth="2.5" />
          <circle cx="36" cy="30" r="16" fill="url(#cvCrestSun)" />
          <path d="M12 46 Q36 36 60 46 L56 56 Q36 64 16 56 Z" fill="#65A30D" stroke="#365314" strokeWidth="1.5" />
          <path
            d="M14 55 Q20 48 28 53 Q36 47 45 53 Q53 48 58 55 Q48 63 36 63 Q22 63 14 55 Z"
            fill="#FFFFFF"
            stroke="#94A3B8"
            strokeWidth="1.2"
          />
          <path d="M36 44 L36 22" stroke="#365314" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M36 27 Q23 19 25 32 Q31 35 36 27 Z" fill="url(#cvCrestLeaf)" stroke="#14532D" strokeWidth="1.3" />
          <path d="M36 23 Q49 15 47 28 Q41 31 36 23 Z" fill="url(#cvCrestLeaf)" stroke="#14532D" strokeWidth="1.3" />
        </g>

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

/**
 * Classic Avatar Top-Left Character Portrait Frame (close-up face + hat + shirt)
 */
export function FarmerPortraitSvg({
  hat,
  shirtColor,
  className = 'w-11 h-11',
}: {
  hat: FarmerHatId;
  shirtColor: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="avatarPortBg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#60A5FA" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#avatarPortBg)" stroke="#1E120A" strokeWidth="2.5" />
      {/* Shoulders */}
      <path d="M14 58 C16 46 48 46 50 58 Z" fill={shirtColor} stroke="#1E120A" strokeWidth="2.2" />
      <rect x="23" y="49" width="18" height="10" rx="2" fill="#2563EB" stroke="#1E120A" strokeWidth="1.6" />
      {/* Head */}
      <circle cx="32" cy="35" r="15" fill="#FDE2C4" stroke="#1E120A" strokeWidth="2.2" />
      {/* Hair bangs */}
      <path d="M17 32 C18 20 46 20 47 32 L40 27 L32 30 L24 27 Z" fill="#4A2E1A" stroke="#1E120A" strokeWidth="1.6" />
      {/* Glossy Eyes */}
      <ellipse cx="26.5" cy="35.5" rx="2.7" ry="3.4" fill="#1E120A" />
      <circle cx="25.5" cy="34.2" r="1.1" fill="#FFFFFF" />
      <ellipse cx="37.5" cy="35.5" rx="2.7" ry="3.4" fill="#1E120A" />
      <circle cx="36.5" cy="34.2" r="1.1" fill="#FFFFFF" />
      {/* Rosy cheeks & smile */}
      <ellipse cx="22.5" cy="39.5" rx="2.8" ry="1.6" fill="#F472B6" opacity="0.5" />
      <ellipse cx="41.5" cy="39.5" rx="2.8" ry="1.6" fill="#F472B6" opacity="0.5" />
      <path d="M29 41 Q32 44 35 41" fill="none" stroke="#9A3412" strokeWidth="1.8" strokeLinecap="round" />

      {/* Hat */}
      {hat === 'straw' && (
        <g>
          <ellipse cx="32" cy="23" rx="21" ry="5.5" fill="#FACC15" stroke="#1E120A" strokeWidth="2" />
          <path d="M21 22 C21 12 43 12 43 22 Z" fill="#EAB308" stroke="#1E120A" strokeWidth="2" />
          <rect x="21" y="19.5" width="22" height="3" fill="#DC2626" />
        </g>
      )}
      {hat === 'bandana' && (
        <g>
          <path d="M16 29 C16 17 48 17 48 29 Z" fill="#DC2626" stroke="#1E120A" strokeWidth="2" />
          <path d="M45 25 L54 29 L46 31 Z" fill="#EF4444" stroke="#1E120A" strokeWidth="1.5" />
        </g>
      )}
      {hat === 'bunny' && (
        <g>
          <ellipse cx="25" cy="14" rx="4" ry="9" transform="rotate(-10 25 14)" fill="#FFFDF9" stroke="#1E120A" strokeWidth="1.8" />
          <ellipse cx="39" cy="14" rx="4" ry="9" transform="rotate(10 39 14)" fill="#FFFDF9" stroke="#1E120A" strokeWidth="1.8" />
          <ellipse cx="25" cy="14" rx="2" ry="5.5" transform="rotate(-10 25 14)" fill="#FBCFE8" />
          <ellipse cx="39" cy="14" rx="2" ry="5.5" transform="rotate(10 39 14)" fill="#FBCFE8" />
        </g>
      )}
    </svg>
  );
}

/**
 * Bold Cartoon Game Icons with Dark Outlines & Drop Shadows
 */
export function ToolSvgIcon({ tool, className = 'w-6 h-6' }: { tool: ToolId | 'auto'; className?: string }) {
  const drop = 'drop-shadow-[0_2px_1px_rgba(0,0,0,0.35)]';
  if (tool === 'auto') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path
          d="M14 2.5L17 9.5L24.5 10.5L19 15.6L20.4 23L14 19.3L7.6 23L9 15.6L3.5 10.5L11 9.5Z"
          fill="#FACC15"
          stroke="#1E120A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="13.5" r="2.5" fill="#FFFDF5" />
      </svg>
    );
  }
  if (tool === 'hoe') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path d="M5 23L17.5 10.5" stroke="#1E120A" strokeWidth="5.2" strokeLinecap="round" />
        <path d="M5 23L17.5 10.5" stroke="#9C6238" strokeWidth="2.8" strokeLinecap="round" />
        <path
          d="M13 6L23 4L21.5 14L16.5 11.5Z"
          fill="#CBD5E1"
          stroke="#1E120A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M16 7.5L21 6.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (tool === 'water') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        {/* Watering Can */}
        <path d="M8 11H18V22H8Z" fill="#38BDF8" stroke="#1E120A" strokeWidth="2" strokeLinejoin="round" />
        <path d="M18 17L24 11L25.5 12.5L19 20Z" fill="#0284C7" stroke="#1E120A" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 11C9 7 17 7 17 11" fill="none" stroke="#1E120A" strokeWidth="2.2" />
        <circle cx="24.5" cy="8" r="2" fill="#BAE6FD" stroke="#0369A1" strokeWidth="1.2" />
      </svg>
    );
  }
  if (tool === 'seed') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        {/* Burlap Seed Pouch with Sprout */}
        <path
          d="M9 8L11 4H17L19 8C22 10 22 22 19 23.5H9C6 22 6 10 9 8Z"
          fill="#DEB887"
          stroke="#1E120A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M9.5 8.5H18.5" stroke="#DC2626" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M14 19V13" stroke="#14532D" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 15C10.5 15 9.5 12 11.5 10.5C13.5 10.5 14 12.5 14 15Z" fill="#4ADE80" stroke="#14532D" strokeWidth="1.3" />
        <path d="M14 14C17.5 14 18.5 11 16.5 9.5C14.5 9.5 14 11.5 14 14Z" fill="#86EFAC" stroke="#14532D" strokeWidth="1.3" />
      </svg>
    );
  }
  if (tool === 'harvest') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        {/* Golden Curved Harvesting Sickle */}
        <path d="M6 22L12 16" stroke="#1E120A" strokeWidth="5.2" strokeLinecap="round" />
        <path d="M6 22L12 16" stroke="#9C6238" strokeWidth="2.8" strokeLinecap="round" />
        <path
          d="M11 17C14 11 20 8 24 6C23 13 18 18 12.5 18.5Z"
          fill="#FDE047"
          stroke="#1E120A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (tool === 'compost') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <rect x="6" y="7" width="16" height="16" rx="3" fill="#B45309" stroke="#1E120A" strokeWidth="2" />
        <path d="M10 7L12 4H16L18 7" fill="#FACC15" stroke="#1E120A" strokeWidth="1.8" />
        <circle cx="14" cy="15" r="3.5" fill="#84CC16" stroke="#1E120A" strokeWidth="1.4" />
      </svg>
    );
  }
  if (tool === 'mutagen') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path
          d="M10 4H18V9L22 18.5C23 20.5 21.5 23 19.2 23H8.8C6.5 23 5 20.5 6 18.5L10 9V4Z"
          fill="#C084FC"
          stroke="#1E120A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="16.5" r="1.8" fill="#FEF08A" />
        <circle cx="16.5" cy="18.5" r="1.4" fill="#FFFFFF" />
      </svg>
    );
  }
  if (tool === 'build') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path
          d="M4 13L14 5L24 13V23H4V13Z"
          fill="#FDE68A"
          stroke="#1E120A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M3 13L14 4L25 13" fill="none" stroke="#D93829" strokeWidth="3.2" strokeLinecap="round" />
        <rect x="11.5" y="15" width="5" height="8" fill="#8C5225" stroke="#1E120A" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
      <circle cx="12" cy="12" r="7" fill="#BAE6FD" stroke="#1E120A" strokeWidth="2.2" />
      <path d="M17.5 17.5L23.5 23.5" stroke="#1E120A" strokeWidth="4.4" strokeLinecap="round" />
      <path d="M17.5 17.5L23.5 23.5" stroke="#9C6238" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
