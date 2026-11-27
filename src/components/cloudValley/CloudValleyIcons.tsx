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
  const drop = 'drop-shadow-[0_2px_1px_rgba(0,0,0,0.4)]';
  if (tool === 'auto') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path
          d="M14 2L17.3 9.2L25 10.3L19.4 15.6L20.8 23.5L14 19.6L7.2 23.5L8.6 15.6L3 10.3L10.7 9.2Z"
          fill="#FDE047"
          stroke="#1E120A"
          strokeWidth="2.1"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="13.5" r="3.2" fill="#FFFBEB" />
      </svg>
    );
  }
  if (tool === 'hoe') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path d="M4.5 23.5L17.5 10.5" stroke="#1E120A" strokeWidth="5.6" strokeLinecap="round" />
        <path d="M4.5 23.5L17.5 10.5" stroke="#D97706" strokeWidth="3.2" strokeLinecap="round" />
        <path
          d="M12.5 5.5L24 3.5L22.2 14.5L16.5 11.5Z"
          fill="#E2E8F0"
          stroke="#1E120A"
          strokeWidth="2.1"
          strokeLinejoin="round"
        />
        <path d="M15.5 7.2L21.8 6" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (tool === 'water') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path d="M7.5 11H18.5V22.5H7.5Z" fill="#0EA5E9" stroke="#1E120A" strokeWidth="2.1" strokeLinejoin="round" />
        <path d="M9 12.5H15V15H9Z" fill="#7DD3FC" />
        <path d="M18.5 17L24.5 10.5L26 12L19.5 20Z" fill="#0284C7" stroke="#1E120A" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M8.5 11C8.5 6.5 17.5 6.5 17.5 11" fill="none" stroke="#1E120A" strokeWidth="2.4" />
        <path d="M24.5 5.2C24.5 5.2 26.8 7.5 26.8 8.8A2.3 2.3 0 1 1 22.2 8.8C22.2 7.5 24.5 5.2 24.5 5.2Z" fill="#38BDF8" stroke="#1E120A" strokeWidth="1.3" />
      </svg>
    );
  }
  if (tool === 'seed') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path
          d="M9 8L11 3.8H17L19 8C22.2 10.2 22.2 22 19 23.8H9C5.8 22 5.8 10.2 9 8Z"
          fill="#F59E0B"
          stroke="#1E120A"
          strokeWidth="2.1"
          strokeLinejoin="round"
        />
        <path d="M9.5 8.5H18.5" stroke="#EF4444" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M14 19.5V13" stroke="#14532D" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 15.5C10.2 15.5 9.2 12.2 11.4 10.6C13.6 10.6 14 12.8 14 15.5Z" fill="#22C55E" stroke="#14532D" strokeWidth="1.4" />
        <path d="M14 14.2C17.8 14.2 18.8 11 16.6 9.4C14.4 9.4 14 11.6 14 14.2Z" fill="#86EFAC" stroke="#14532D" strokeWidth="1.4" />
      </svg>
    );
  }
  if (tool === 'harvest') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path d="M5.5 22.5L12 16" stroke="#1E120A" strokeWidth="5.6" strokeLinecap="round" />
        <path d="M5.5 22.5L12 16" stroke="#16A34A" strokeWidth="3.2" strokeLinecap="round" />
        <path
          d="M11 17C14 10.5 20 7.5 24.5 5.5C23.5 13 18.2 18.2 12.5 18.8Z"
          fill="#FACC15"
          stroke="#1E120A"
          strokeWidth="2.1"
          strokeLinejoin="round"
        />
        <path d="M14.5 14C17 11 20 9.5 22 8.5" stroke="#FEF9C3" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (tool === 'compost') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <rect x="6" y="7" width="16" height="16" rx="3" fill="#D97706" stroke="#1E120A" strokeWidth="2.1" />
        <path d="M10 7L12 3.8H16L18 7" fill="#FDE047" stroke="#1E120A" strokeWidth="1.9" />
        <circle cx="14" cy="15" r="4" fill="#84CC16" stroke="#1E120A" strokeWidth="1.5" />
      </svg>
    );
  }
  if (tool === 'mutagen') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path
          d="M10 4H18V9L22.5 18.5C23.4 20.6 21.8 23.2 19.3 23.2H8.7C6.2 23.2 4.6 20.6 5.5 18.5L10 9V4Z"
          fill="#D946EF"
          stroke="#1E120A"
          strokeWidth="2.1"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="16.5" r="2" fill="#FEF08A" />
        <circle cx="16.5" cy="18.5" r="1.6" fill="#FFFFFF" />
      </svg>
    );
  }
  if (tool === 'build') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path
          d="M4 13L14 5L24 13V23H4V13Z"
          fill="#FDE047"
          stroke="#1E120A"
          strokeWidth="2.1"
          strokeLinejoin="round"
        />
        <path d="M2.8 13L14 3.8L25.2 13" fill="none" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
        <rect x="11.5" y="15" width="5" height="8" fill="#9A3412" stroke="#1E120A" strokeWidth="1.6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
      <circle cx="12" cy="12" r="7.2" fill="#38BDF8" stroke="#1E120A" strokeWidth="2.2" />
      <circle cx="10" cy="10" r="2.2" fill="#E0F2FE" />
      <path d="M17.5 17.5L23.5 23.5" stroke="#1E120A" strokeWidth="4.6" strokeLinecap="round" />
      <path d="M17.5 17.5L23.5 23.5" stroke="#F59E0B" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Bold Cartoon Crop/Seed Inventory Slot Icons (with thick 1.8px dark outlines)
 */
export function CropSeedSvgIcon({ cropId, className = 'w-7 h-7' }: { cropId: string; className?: string }) {
  const drop = 'drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.3)]';
  if (cropId === 'lua_mi' || cropId === 'lua_mach_tim') {
    const grainFill = cropId === 'lua_mach_tim' ? '#A855F7' : '#FACC15';
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path d="M14 24V7" stroke="#65A30D" strokeWidth="2.4" strokeLinecap="round" />
        <ellipse cx="14" cy="6.5" rx="3" ry="4" fill={grainFill} stroke="#1E120A" strokeWidth="1.6" />
        <ellipse cx="9.5" cy="11" rx="2.8" ry="3.8" transform="rotate(-28 9.5 11)" fill={grainFill} stroke="#1E120A" strokeWidth="1.6" />
        <ellipse cx="18.5" cy="11" rx="2.8" ry="3.8" transform="rotate(28 18.5 11)" fill={grainFill} stroke="#1E120A" strokeWidth="1.6" />
        <ellipse cx="9.5" cy="16.5" rx="2.8" ry="3.8" transform="rotate(-28 9.5 16.5)" fill={grainFill} stroke="#1E120A" strokeWidth="1.6" />
        <ellipse cx="18.5" cy="16.5" rx="2.8" ry="3.8" transform="rotate(28 18.5 16.5)" fill={grainFill} stroke="#1E120A" strokeWidth="1.6" />
      </svg>
    );
  }
  if (cropId === 'ca_chua' || cropId === 'ca_chua_lua') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <circle cx="14" cy="15.5" r="8.5" fill={cropId === 'ca_chua_lua' ? '#F97316' : '#EF4444'} stroke="#1E120A" strokeWidth="1.9" />
        <path d="M10 9L14 6L18 9L14 11Z" fill="#22C55E" stroke="#1E120A" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="11" cy="13.5" r="2" fill="#FFFFFF" opacity="0.85" />
      </svg>
    );
  }
  if (cropId === 'ot_chuong') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path d="M14 5V8.5" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="7" y="8.5" width="14" height="14" rx="5.5" fill="#F59E0B" stroke="#1E120A" strokeWidth="1.9" />
        <path d="M12 9V22M16 9V22" stroke="#B45309" strokeWidth="1.2" opacity="0.65" />
        <circle cx="10.5" cy="12.5" r="1.8" fill="#FEF9C3" />
      </svg>
    );
  }
  if (cropId === 'dau_ha_lan') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path d="M6 19C8 10 15 6 22 7C21 15 15 21 6 19Z" fill="#22C55E" stroke="#1E120A" strokeWidth="1.9" strokeLinejoin="round" />
        <circle cx="11" cy="16" r="2.2" fill="#BBF7D0" stroke="#14532D" strokeWidth="1.2" />
        <circle cx="15" cy="13" r="2.2" fill="#BBF7D0" stroke="#14532D" strokeWidth="1.2" />
        <circle cx="18.5" cy="10" r="1.8" fill="#BBF7D0" stroke="#14532D" strokeWidth="1.2" />
      </svg>
    );
  }
  if (cropId === 'khoai_tay') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <ellipse cx="14" cy="15" rx="9" ry="6.8" transform="rotate(-15 14 15)" fill="#D99B58" stroke="#1E120A" strokeWidth="1.9" />
        <circle cx="10" cy="14" r="1.1" fill="#78350F" />
        <circle cx="16.5" cy="16.5" r="1.1" fill="#78350F" />
        <circle cx="15" cy="12" r="0.9" fill="#78350F" />
      </svg>
    );
  }
  if (cropId === 'bi_ngo' || cropId === 'bi_khong_lo') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path d="M14 5V8.5" stroke="#3F6212" strokeWidth="2.8" strokeLinecap="round" />
        <ellipse cx="14" cy="16" rx="9.5" ry="7.2" fill="#EA580C" stroke="#1E120A" strokeWidth="1.9" />
        <ellipse cx="14" cy="16" rx="4.2" ry="7" fill="#FB923C" stroke="#1E120A" strokeWidth="1.4" />
      </svg>
    );
  }
  if (cropId === 'dau_tay') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path d="M8 11C8 7 20 7 20 11C20 17 16 23 14 23C12 23 8 17 8 11Z" fill="#E11D48" stroke="#1E120A" strokeWidth="1.9" />
        <path d="M9.5 8.5L14 5.5L18.5 8.5L14 10Z" fill="#4ADE80" stroke="#1E120A" strokeWidth="1.5" />
        <circle cx="12" cy="14" r="0.9" fill="#FEF08A" />
        <circle cx="16" cy="14" r="0.9" fill="#FEF08A" />
        <circle cx="14" cy="18" r="0.9" fill="#FEF08A" />
      </svg>
    );
  }
  if (cropId === 'hoa_oai_huong') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path d="M14 24V9" stroke="#15803D" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="14" cy="7" r="3.2" fill="#8B5CF6" stroke="#1E120A" strokeWidth="1.5" />
        <circle cx="11" cy="11.5" r="2.8" fill="#A78BFA" stroke="#1E120A" strokeWidth="1.5" />
        <circle cx="17" cy="11.5" r="2.8" fill="#A78BFA" stroke="#1E120A" strokeWidth="1.5" />
        <circle cx="14" cy="15.5" r="2.6" fill="#C4B5FD" stroke="#1E120A" strokeWidth="1.5" />
      </svg>
    );
  }
  if (cropId === 'nho_tim') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path d="M14 4V8" stroke="#65A30D" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="11" cy="11.5" r="3.3" fill="#9333EA" stroke="#1E120A" strokeWidth="1.5" />
        <circle cx="17" cy="11.5" r="3.3" fill="#9333EA" stroke="#1E120A" strokeWidth="1.5" />
        <circle cx="10" cy="16" r="3.2" fill="#7E22CE" stroke="#1E120A" strokeWidth="1.5" />
        <circle cx="14" cy="15.5" r="3.3" fill="#A855F7" stroke="#1E120A" strokeWidth="1.5" />
        <circle cx="18" cy="16" r="3.2" fill="#7E22CE" stroke="#1E120A" strokeWidth="1.5" />
        <circle cx="14" cy="20.5" r="3.1" fill="#9333EA" stroke="#1E120A" strokeWidth="1.5" />
      </svg>
    );
  }
  if (cropId === 'thanh_long') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <ellipse cx="14" cy="15" rx="7.2" ry="8.5" fill="#EC4899" stroke="#1E120A" strokeWidth="1.9" />
        <path d="M10 7L14 4L18 7" fill="#84CC16" stroke="#1E120A" strokeWidth="1.5" />
        <path d="M6.5 14L9.5 12.5M21.5 14L18.5 12.5" stroke="#84CC16" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (cropId === 'bong_vai') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <circle cx="10.5" cy="14" r="4.8" fill="#FFFFFF" stroke="#1E120A" strokeWidth="1.7" />
        <circle cx="17.5" cy="14" r="4.8" fill="#FFFFFF" stroke="#1E120A" strokeWidth="1.7" />
        <circle cx="14" cy="10.5" r="5" fill="#FFFFFF" stroke="#1E120A" strokeWidth="1.7" />
        <path d="M10 19L14 23L18 19" fill="#65A30D" stroke="#1E120A" strokeWidth="1.6" />
      </svg>
    );
  }
  if (cropId === 'khe_ngot') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path
          d="M14 3.5L17.2 10.2L24.5 11.2L19.1 16.2L20.5 23.5L14 19.9L7.5 23.5L8.9 16.2L3.5 11.2L10.8 10.2Z"
          fill="#FACC15"
          stroke="#1E120A"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="14" r="2.3" fill="#FEF9C3" />
      </svg>
    );
  }
  if (cropId === 'tao_do') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path d="M14 5.5V9.5" stroke="#78350F" strokeWidth="2.4" strokeLinecap="round" />
        <ellipse cx="17.5" cy="7" rx="3.4" ry="1.8" transform="rotate(-22 17.5 7)" fill="#4ADE80" stroke="#1E120A" strokeWidth="1.3" />
        <path
          d="M14 9.5C10.5 8 5.5 10.5 6 15.8C6.5 20.8 10.5 23.5 14 22.5C17.5 23.5 21.5 20.8 22 15.8C22.5 10.5 17.5 8 14 9.5Z"
          fill="#EF4444"
          stroke="#1E120A"
          strokeWidth="1.9"
        />
        <circle cx="10.2" cy="14" r="1.9" fill="#FFFFFF" opacity="0.85" />
      </svg>
    );
  }
  if (cropId === 'hoa_hong') {
    return (
      <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
        <path d="M14 24V14" stroke="#15803D" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="14" cy="10.5" r="6.5" fill="#E11D48" stroke="#1E120A" strokeWidth="1.8" />
        <circle cx="14" cy="10.5" r="2.8" fill="#FDA4AF" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 28 28" className={`${className} ${drop}`} aria-hidden="true">
      <circle cx="14" cy="14" r="7.5" fill="#4ADE80" stroke="#1E120A" strokeWidth="1.8" />
    </svg>
  );
}
