import type {
  AntiqueBoxTheme,
  AntiqueCoverDef,
  AntiqueItemDef,
} from '../utils/antiqueShopEngine.ts';

export function AntiqueShopEmblem() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 drop-shadow-[0_10px_22px_rgba(245,158,11,0.22)]"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="as-lantern-glow" cx="50%" cy="46%" r="50%">
          <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.88" />
          <stop offset="55%" stopColor="#D97706" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#1C1410" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="as-brass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="55%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="56" r="54" fill="url(#as-lantern-glow)" />
      {/* Hanging hook & bail */}
      <path
        d="M42 32 C42 14, 78 14, 78 32"
        fill="none"
        stroke="url(#as-brass)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="60" cy="18" r="4" fill="#FDE68A" stroke="#78350F" strokeWidth="1.5" />
      {/* Lantern cap */}
      <path d="M36 33 L84 33 L76 42 L44 42 Z" fill="url(#as-brass)" stroke="#451A03" strokeWidth="1.6" />
      {/* Glass cage */}
      <rect x="40" y="42" width="40" height="44" rx="5" fill="#2A1C12" fillOpacity="0.82" stroke="url(#as-brass)" strokeWidth="2.4" />
      {/* Warm candle flame inside */}
      <ellipse cx="60" cy="64" rx="14" ry="16" fill="#F59E0B" fillOpacity="0.26" />
      <path d="M60 50 C66 57, 66 68, 60 72 C54 68, 54 57, 60 50 Z" fill="#FEF08A" />
      <path d="M60 56 C63 60, 63 67, 60 69 C57 67, 57 60, 60 56 Z" fill="#F97316" />
      {/* Brass cage bars */}
      <line x1="51" y1="42" x2="51" y2="86" stroke="#B45309" strokeWidth="1.6" />
      <line x1="69" y1="42" x2="69" y2="86" stroke="#B45309" strokeWidth="1.6" />
      {/* Base */}
      <rect x="34" y="86" width="52" height="9" rx="3.5" fill="url(#as-brass)" stroke="#451A03" strokeWidth="1.6" />
      {/* Tiny vintage key crossed at bottom right */}
      <g transform="translate(86, 86) rotate(-32)">
        <circle cx="0" cy="0" r="6" fill="none" stroke="#FDE68A" strokeWidth="2.4" />
        <line x1="6" y1="0" x2="22" y2="0" stroke="#FDE68A" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="16" y1="0" x2="16" y2="5" stroke="#FDE68A" strokeWidth="2.2" />
        <line x1="20" y1="0" x2="20" y2="4" stroke="#FDE68A" strokeWidth="2.2" />
      </g>
    </svg>
  );
}

export function renderSceneBackdrop(theme: AntiqueBoxTheme) {
  if (theme === 'midnight_station') {
    return (
      <g aria-hidden="true">
        <defs>
          <linearGradient id="ms-table" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B1512" />
            <stop offset="100%" stopColor="#110D0A" />
          </linearGradient>
          <radialGradient id="ms-lamp" cx="50%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.18" />
            <stop offset="65%" stopColor="#92400E" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#0D0907" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ms-case-shell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5C3A28" />
            <stop offset="100%" stopColor="#3B2317" />
          </linearGradient>
          <linearGradient id="ms-felt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#26201C" />
            <stop offset="100%" stopColor="#1D1714" />
          </linearGradient>
        </defs>

        {/* Quiet nocturnal mahogany counter */}
        <rect x="0" y="0" width="1000" height="620" fill="url(#ms-table)" />
        {/* Wood grain lines */}
        <path
          d="M0 44 Q250 38 500 46 T1000 42 M0 578 Q300 584 650 574 T1000 580"
          fill="none"
          stroke="#2C211B"
          strokeWidth="2"
          opacity="0.7"
        />

        {/* Open vintage brown leather suitcase outer shell */}
        <rect x="52" y="56" width="896" height="516" rx="28" fill="url(#ms-case-shell)" stroke="#7C5138" strokeWidth="3.5" />
        {/* Corner leather protectors */}
        <path d="M52 104 L52 72 Q52 56 68 56 L104 56 Q80 86 52 104 Z" fill="#2A1910" stroke="#9A6848" strokeWidth="1.5" />
        <path d="M948 104 L948 72 Q948 56 932 56 L896 56 Q920 86 948 104 Z" fill="#2A1910" stroke="#9A6848" strokeWidth="1.5" />
        <path d="M52 524 L52 556 Q52 572 68 572 L104 572 Q80 542 52 524 Z" fill="#2A1910" stroke="#9A6848" strokeWidth="1.5" />
        <path d="M948 524 L948 556 Q948 572 932 572 L896 572 Q920 542 948 524 Z" fill="#2A1910" stroke="#9A6848" strokeWidth="1.5" />

        {/* Brass clasps along bottom rim */}
        <rect x="278" y="561" width="44" height="14" rx="3" fill="#D4A34C" stroke="#5C3A16" strokeWidth="1.5" />
        <rect x="678" y="561" width="44" height="14" rx="3" fill="#D4A34C" stroke="#5C3A16" strokeWidth="1.5" />
        {/* Top leather handle */}
        <path d="M430 56 C430 30, 570 30, 570 56" fill="none" stroke="#4D2E1E" strokeWidth="12" strokeLinecap="round" />
        <path d="M430 56 C430 32, 570 32, 570 56" fill="none" stroke="#85563B" strokeWidth="5" strokeLinecap="round" />

        {/* Inner velvet/canvas lining with subtle dashed stitching */}
        <rect x="78" y="82" width="844" height="464" rx="18" fill="url(#ms-felt)" stroke="#A7835B" strokeOpacity="0.32" strokeWidth="1.5" strokeDasharray="7 5" />

        {/* Suitcase center divider seam + elastic strap */}
        <line x1="78" y1="316" x2="922" y2="316" stroke="#120E0C" strokeWidth="4" />
        <line x1="78" y1="318" x2="922" y2="318" stroke="#8A6547" strokeOpacity="0.35" strokeWidth="1.2" />
        <rect x="190" y="96" width="16" height="214" rx="3" fill="#47382E" opacity="0.5" />
        <rect x="794" y="96" width="16" height="214" rx="3" fill="#47382E" opacity="0.5" />

        {/* Soft stitched pocket zone left bottom */}
        <rect x="104" y="336" width="238" height="184" rx="12" fill="#231D19" stroke="#5C4434" strokeWidth="1.8" />
        {/* Folded dark wool sweater texture bottom-center */}
        <rect x="372" y="348" width="222" height="172" rx="16" fill="#2A2F38" stroke="#475569" strokeOpacity="0.45" strokeWidth="1.5" />
        {/* Warm lamplight wash */}
        <rect x="0" y="0" width="1000" height="620" fill="url(#ms-lamp)" />
      </g>
    );
  }

  if (theme === 'vintage_vanity') {
    return (
      <g aria-hidden="true">
        <defs>
          <linearGradient id="vv-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#261F24" />
            <stop offset="100%" stopColor="#1B1519" />
          </linearGradient>
          <linearGradient id="vv-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E6D7C5" />
            <stop offset="100%" stopColor="#CBB49B" />
          </linearGradient>
          <linearGradient id="vv-mirror" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3B4254" />
            <stop offset="50%" stopColor="#2A2F3D" />
            <stop offset="100%" stopColor="#1F2430" />
          </linearGradient>
          <radialGradient id="vv-glow" cx="50%" cy="28%" r="60%">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#1B1519" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft muted twilight room wall */}
        <rect x="0" y="0" width="1000" height="620" fill="url(#vv-wall)" />
        {/* Subtle vertical wallpaper stripes */}
        <path
          d="M120 0 V200 M240 0 V200 M760 0 V200 M880 0 V200"
          stroke="#FFFFFF"
          strokeOpacity="0.03"
          strokeWidth="22"
        />

        {/* Oval Vintage Gilt Mirror centered top */}
        <ellipse cx="500" cy="116" rx="145" ry="96" fill="#9A723A" stroke="#D4A34C" strokeWidth="4" />
        <ellipse cx="500" cy="116" rx="133" ry="85" fill="url(#vv-mirror)" stroke="#FDE68A" strokeOpacity="0.4" strokeWidth="1.5" />
        {/* Subtle mirror light reflection diagonal */}
        <path d="M412 68 L452 44 L518 164 L478 186 Z" fill="#FFFFFF" fillOpacity="0.06" />

        {/* Cream-painted wooden vanity tabletop */}
        <path d="M36 168 L964 168 L982 562 L18 562 Z" fill="url(#vv-wood)" stroke="#8B6F56" strokeWidth="3" />
        {/* Front wooden trim & drawer recess */}
        <rect x="24" y="552" width="952" height="34" rx="6" fill="#A68B70" stroke="#6E5642" strokeWidth="2" />
        {/* Porcelain tray top-left for jewelry box */}
        <rect x="136" y="182" width="215" height="148" rx="18" fill="#F4EDE2" fillOpacity="0.55" stroke="#B69D82" strokeWidth="1.5" />
        {/* Ceramic dish bottom-left */}
        <ellipse cx="132" cy="382" rx="44" ry="30" fill="#FAF6F0" stroke="#C5B097" strokeWidth="2" />
        <ellipse cx="132" cy="382" rx="34" ry="21" fill="none" stroke="#E2D4C0" strokeWidth="1.2" />
        {/* Right wooden drawer cavity */}
        <rect x="684" y="346" width="236" height="168" rx="10" fill="#5D4432" stroke="#85654C" strokeWidth="2" />
        {/* Warm lamplight wash */}
        <rect x="0" y="0" width="1000" height="620" fill="url(#vv-glow)" />
      </g>
    );
  }

  // exam_desk
  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id="ed-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#141B29" />
          <stop offset="100%" stopColor="#0E141F" />
        </linearGradient>
        <linearGradient id="ed-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5C3F2B" />
          <stop offset="100%" stopColor="#3F291B" />
        </linearGradient>
        <radialGradient id="ed-lamp-cone" cx="22%" cy="18%" r="72%">
          <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.34" />
          <stop offset="48%" stopColor="#F59E0B" stopOpacity="0.11" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 2AM quiet dorm wall & rainy window pane hint top-right */}
      <rect x="0" y="0" width="1000" height="620" fill="url(#ed-wall)" />
      <rect x="756" y="18" width="210" height="118" rx="6" fill="#0B1324" stroke="#334155" strokeWidth="3" />
      <line x1="861" y1="18" x2="861" y2="136" stroke="#334155" strokeWidth="2.5" />
      <line x1="756" y1="77" x2="966" y2="77" stroke="#334155" strokeWidth="2.5" />
      {/* Rain streaks outside window */}
      <path d="M780 34 L772 58 M822 44 L814 70 M910 30 L900 62 M942 84 L933 114" stroke="#64748B" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />

      {/* Corkboard pinned notes hint top-center */}
      <rect x="330" y="16" width="380" height="92" rx="6" fill="#7C583A" stroke="#4D3421" strokeWidth="3" />
      <rect x="352" y="28" width="76" height="58" rx="2" fill="#FEF3C7" transform="rotate(-3 390 57)" />
      <circle cx="390" cy="34" r="3.5" fill="#DC2626" />
      <rect x="462" y="26" width="96" height="64" rx="2" fill="#E0F2FE" transform="rotate(2 510 58)" />
      <circle cx="510" cy="32" r="3.5" fill="#0284C7" />

      {/* Warm walnut desk surface */}
      <path d="M26 106 L974 106 L992 590 L8 590 Z" fill="url(#ed-desk)" stroke="#2A1B11" strokeWidth="3" />
      {/* Green self-healing cutting/desk mat in middle */}
      <rect x="260" y="152" width="490" height="352" rx="10" fill="#1E3F35" stroke="#3B6E5C" strokeWidth="2" />
      <path
        d="M280 202 H730 M280 252 H730 M280 302 H730 M280 352 H730 M280 402 H730 M280 452 H730
           M330 170 V486 M405 170 V486 M480 170 V486 M555 170 V486 M630 170 V486 M705 170 V486"
        stroke="#6EE7B7"
        strokeOpacity="0.12"
        strokeWidth="1"
      />

      {/* Swing-arm study lamp silhouette top-left */}
      <g>
        <path d="M46 116 L84 42 L152 60" fill="none" stroke="#94A3B8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M128 52 L176 58 L188 86 L124 80 Z" fill="#1E293B" stroke="#CBD5E1" strokeWidth="1.8" />
        <ellipse cx="156" cy="83" rx="22" ry="6" fill="#FEF08A" />
      </g>

      {/* Pencil tin base interior */}
      <rect x="404" y="382" width="212" height="106" rx="12" fill="#334155" stroke="#64748B" strokeWidth="2" />

      {/* Warm golden lamp pool over the desk */}
      <rect x="0" y="0" width="1000" height="620" fill="url(#ed-lamp-cone)" />
    </g>
  );
}

export function renderItemArtwork(item: AntiqueItemDef) {
  switch (item.artKind) {
    case 'train_ticket':
      return (
        <g>
          <rect x="-38" y="-21" width="76" height="42" rx="4" fill="#F3E5AB" stroke="#854D0E" strokeWidth="1.6" />
          <line x1="-22" y1="-21" x2="-22" y2="21" stroke="#A16207" strokeDasharray="3 2" strokeWidth="1.2" />
          <rect x="-14" y="-12" width="42" height="8" rx="2" fill="#991B1B" fillOpacity="0.82" />
          <line x1="-14" y1="4" x2="26" y2="4" stroke="#78350F" strokeWidth="2" />
          <line x1="-14" y1="12" x2="14" y2="12" stroke="#92400E" strokeWidth="1.5" />
          <circle cx="38" cy="0" r="4.5" fill="#1D1714" />
        </g>
      );
    case 'eye_drops':
      return (
        <g>
          <rect x="-12" y="-10" width="24" height="32" rx="6" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
          <rect x="-8" y="2" width="16" height="16" rx="3" fill="#60A5FA" fillOpacity="0.45" />
          <path d="M-7 -10 L-4 -24 L4 -24 L7 -10 Z" fill="#F8FAFC" stroke="#1E40AF" strokeWidth="1.4" />
          <rect x="-10" y="-4" width="20" height="9" rx="1.5" fill="#FFFFFF" />
          <circle cx="0" cy="0.5" r="2.2" fill="#2563EB" />
        </g>
      );
    case 'hairpin':
      return (
        <g>
          <path d="M-28 4 C-16 -12, 16 -12, 28 4 C14 10, -14 10, -28 4 Z" fill="#B45309" stroke="#FDE68A" strokeWidth="1.2" />
          <ellipse cx="-10" cy="-1" rx="5" ry="2.5" fill="#78350F" />
          <ellipse cx="6" cy="0" rx="6" ry="2.6" fill="#451A03" />
          <ellipse cx="18" cy="2" rx="3.5" ry="1.8" fill="#FBBF24" />
        </g>
      );
    case 'torn_photo':
      return (
        <g>
          <path d="M-36 -28 L12 -28 L4 -14 L15 0 L6 14 L14 28 L-36 28 Z" fill="#F5EFE6" stroke="#78716C" strokeWidth="1.5" />
          <rect x="-29" y="-21" width="33" height="39" fill="#475569" />
          <circle cx="-13" cy="-7" r="6" fill="#FDBA74" />
          <path d="M-23 18 C-23 7, -3 7, -3 18 Z" fill="#93C5FD" />
          <path d="M-29 -21 Q-10 -24 4 -15" fill="none" stroke="#CBD5E1" strokeWidth="1.2" />
        </g>
      );
    case 'cafe_receipt':
      return (
        <g>
          <path d="M-24 -36 L24 -36 L24 34 L18 30 L12 35 L6 30 L0 35 L-6 30 L-12 35 L-18 30 L-24 34 Z" fill="#FAF7F2" stroke="#A8A29E" strokeWidth="1.4" />
          <line x1="-15" y1="-22" x2="15" y2="-22" stroke="#57534E" strokeWidth="2.4" />
          <line x1="-16" y1="-11" x2="16" y2="-11" stroke="#78716C" strokeWidth="1.5" />
          <line x1="-16" y1="-2" x2="12" y2="-2" stroke="#78716C" strokeWidth="1.5" />
          <line x1="-16" y1="7" x2="15" y2="7" stroke="#78716C" strokeWidth="1.5" />
          <line x1="-16" y1="18" x2="16" y2="18" stroke="#1C1917" strokeWidth="2" />
        </g>
      );
    case 'brass_key':
    case 'dorm_key':
      return (
        <g>
          <circle cx="-18" cy="0" r="11" fill="none" stroke={item.tintColor} strokeWidth="4" />
          <circle cx="-18" cy="0" r="5" fill="#1C1410" />
          <rect x="-7" y="-2.5" width="35" height="5" rx="2" fill={item.tintColor} />
          <rect x="14" y="2.5" width="4.5" height="7" fill={item.tintColor} />
          <rect x="22" y="2.5" width="4.5" height="9" fill={item.tintColor} />
          {item.artKind === 'brass_key' && (
            <rect x="-34" y="-8" width="13" height="16" rx="3" fill="#991B1B" stroke="#FDE68A" strokeWidth="1" />
          )}
        </g>
      );
    case 'spare_button':
      return (
        <g>
          <circle cx="0" cy="0" r="17" fill={item.tintColor} stroke="#FFFBEB" strokeOpacity="0.65" strokeWidth="2" />
          <circle cx="0" cy="0" r="12" fill="none" stroke="#1E293B" strokeOpacity="0.28" strokeWidth="1.4" />
          <circle cx="-4" cy="-4" r="2" fill="#1E293B" />
          <circle cx="4" cy="-4" r="2" fill="#1E293B" />
          <circle cx="-4" cy="4" r="2" fill="#1E293B" />
          <circle cx="4" cy="4" r="2" fill="#1E293B" />
          <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      );
    case 'folded_notebook':
      return (
        <g>
          <rect x="-34" y="-28" width="68" height="56" rx="5" fill="#78350F" stroke="#FDE68A" strokeOpacity="0.45" strokeWidth="1.6" />
          <rect x="-34" y="-28" width="11" height="56" rx="3" fill="#451A03" />
          <rect x="-12" y="-18" width="34" height="14" rx="2" fill="#FEF3C7" />
          <line x1="16" y1="-28" x2="16" y2="28" stroke="#D97706" strokeWidth="2.5" />
          <polygon points="8,-34 22,-34 22,-22 15,-26 8,-22" fill="#F59E0B" />
        </g>
      );
    case 'ginger_tin':
      return (
        <g>
          <circle cx="0" cy="0" r="23" fill="#3F6256" stroke="#A7F3D0" strokeOpacity="0.5" strokeWidth="2" />
          <circle cx="0" cy="0" r="17" fill="#52796F" stroke="#FDE68A" strokeWidth="1.2" />
          <path d="M-7 3 C-3 -7, 4 -7, 7 3 C2 7, -3 7, -7 3 Z" fill="#FBBF24" />
          <circle cx="0" cy="-2" r="2.2" fill="#78350F" />
        </g>
      );
    case 'postmark_stamp':
      return (
        <g>
          <rect x="-34" y="-22" width="68" height="44" rx="3" fill="#FEF3C7" stroke="#92400E" strokeWidth="1.5" />
          <rect x="13" y="-17" width="15" height="18" fill="#F97316" stroke="#FFFBEB" strokeDasharray="2 1" strokeWidth="1.2" />
          <circle cx="11" cy="-8" r="9" fill="none" stroke="#991B1B" strokeOpacity="0.68" strokeWidth="1.2" />
          <line x1="-26" y1="-8" x2="-2" y2="-8" stroke="#78350F" strokeWidth="1.5" />
          <line x1="-26" y1="2" x2="16" y2="2" stroke="#92400E" strokeOpacity="0.55" strokeWidth="1.4" />
          <line x1="-26" y1="11" x2="8" y2="11" stroke="#92400E" strokeOpacity="0.55" strokeWidth="1.4" />
        </g>
      );
    case 'pocket_watch':
      return (
        <g>
          <rect x="-4" y="-33" width="8" height="8" rx="2" fill="#D97706" />
          <circle cx="0" cy="-35" r="5" fill="none" stroke="#FDE68A" strokeWidth="2" />
          <circle cx="0" cy="0" r="24" fill="#B45309" stroke="#FDE68A" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="18" fill="#FFFBEB" stroke="#78350F" strokeWidth="1.2" />
          <line x1="0" y1="0" x2="-2" y2="-11" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="0" y1="0" x2="10" y2="-4" stroke="#DC2626" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="0" cy="0" r="2.2" fill="#1E293B" />
        </g>
      );
    case 'lipstick':
      return (
        <g>
          <rect x="-9" y="0" width="18" height="28" rx="3" fill="#D4A34C" stroke="#78350F" strokeWidth="1.4" />
          <rect x="-7" y="-11" width="14" height="12" rx="1" fill="#FDE68A" />
          <path d="M-6 -11 L-6 -22 L6 -27 L6 -11 Z" fill="#BE123C" stroke="#881337" strokeWidth="1.1" />
        </g>
      );
    case 'silver_ring':
      return (
        <g>
          <ellipse cx="0" cy="3" rx="16" ry="12" fill="none" stroke="#E2E8F0" strokeWidth="4.5" />
          <ellipse cx="0" cy="3" rx="16" ry="12" fill="none" stroke="#94A3B8" strokeWidth="1.2" />
          <polygon points="0,-13 5,-8 0,-4 -5,-8" fill="#BAE6FD" stroke="#FFFFFF" strokeWidth="1" />
        </g>
      );
    case 'perfume_bottle':
      return (
        <g>
          <rect x="-22" y="-12" width="44" height="44" rx="10" fill="#FEF3C7" fillOpacity="0.45" stroke="#FDE68A" strokeWidth="2" />
          <rect x="-18" y="8" width="36" height="20" rx="6" fill="#F59E0B" fillOpacity="0.72" />
          <rect x="-7" y="-22" width="14" height="11" rx="2" fill="#D4A34C" />
          <polygon points="-9,-34 9,-34 11,-22 -11,-22" fill="#F8FAFC" fillOpacity="0.8" stroke="#CBD5E1" strokeWidth="1.2" />
          <rect x="-13" y="-3" width="26" height="14" rx="2" fill="#FFFBEB" />
        </g>
      );
    case 'wifi_note':
    case 'mirror_sticky':
      return (
        <g>
          <rect x="-28" y="-24" width="56" height="48" rx="3" fill={item.tintColor} stroke="#CA8A04" strokeWidth="1.4" />
          <rect x="-11" y="-28" width="22" height="7" rx="1" fill="#F59E0B" fillOpacity="0.55" />
          <line x1="-18" y1="-10" x2="16" y2="-10" stroke="#78350F" strokeWidth="1.8" />
          <line x1="-18" y1="0" x2="18" y2="0" stroke="#78350F" strokeWidth="1.6" />
          <line x1="-18" y1="10" x2="9" y2="10" stroke="#78350F" strokeWidth="1.6" />
        </g>
      );
    case 'blank_card':
      return (
        <g>
          <rect x="-36" y="-22" width="72" height="44" rx="4" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.5" />
          <path d="M-36 -22 L0 6 L36 -22" fill="none" stroke="#D97706" strokeWidth="1.5" />
          <circle cx="0" cy="5" r="5.5" fill="#BE123C" />
        </g>
      );
    case 'wood_comb':
      return (
        <g>
          <rect x="-44" y="-12" width="88" height="11" rx="5" fill="#92400E" stroke="#FDE68A" strokeOpacity="0.4" strokeWidth="1.2" />
          {[-36, -28, -20, -12, -4, 4, 12, 20, 36].map((tx) => (
            <line key={tx} x1={tx} y1="-1" x2={tx} y2="15" stroke="#B45309" strokeWidth="3.2" strokeLinecap="round" />
          ))}
        </g>
      );
    case 'music_box':
      return (
        <g>
          <rect x="-30" y="-20" width="60" height="42" rx="6" fill="#78350F" stroke="#FDE68A" strokeWidth="1.8" />
          <rect x="-24" y="-14" width="48" height="30" rx="3" fill="#451A03" />
          <circle cx="0" cy="1" r="8" fill="#D4A34C" />
          <path d="M30 0 H40 M38 -7 V7" stroke="#FCD34D" strokeWidth="2.8" strokeLinecap="round" />
        </g>
      );
    case 'pearl_earring':
      return (
        <g>
          <path d="M-5 -16 C-5 -24, 6 -24, 6 -14 L2 -4" fill="none" stroke="#E2E8F0" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="0" cy="5" r="10" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
          <circle cx="-3" cy="2" r="3" fill="#FFFFFF" />
        </g>
      );
    case 'parking_stub':
      return (
        <g>
          <rect x="-22" y="-28" width="44" height="56" rx="4" fill="#FBCFE8" stroke="#BE185D" strokeWidth="1.4" />
          <circle cx="0" cy="-19" r="3.5" fill="#1B1519" />
          <line x1="-14" y1="-5" x2="14" y2="-5" stroke="#831843" strokeWidth="2.4" />
          <line x1="-14" y1="6" x2="10" y2="6" stroke="#9D174D" strokeWidth="1.6" />
          <line x1="-14" y1="15" x2="14" y2="15" stroke="#9D174D" strokeWidth="1.6" />
        </g>
      );
    case 'highlighter':
      return (
        <g>
          <rect x="-36" y="-9" width="54" height="18" rx="4" fill="#FACC15" stroke="#854D0E" strokeWidth="1.5" />
          <rect x="18" y="-7" width="14" height="14" rx="2" fill="#FEF08A" stroke="#854D0E" strokeWidth="1.2" />
          <polygon points="32,-5 42,-2 42,4 32,5" fill="#FDE047" />
          <rect x="-26" y="-5" width="28" height="10" rx="2" fill="#1E293B" fillOpacity="0.2" />
        </g>
      );
    case 'dented_thermos':
      return (
        <g>
          <path d="M-21 -26 L21 -26 L23 30 Q23 38 15 38 L-15 38 Q-23 38 -23 30 L-19 20 L-22 12 Z" fill="#0F766E" stroke="#99F6E4" strokeOpacity="0.6" strokeWidth="1.6" />
          <rect x="-18" y="-40" width="36" height="14" rx="4" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
          <rect x="-14" y="-6" width="28" height="18" rx="3" fill="#134E4A" />
        </g>
      );
    case 'broken_earbuds':
      return (
        <g>
          <path d="M-32 16 C-26 -8, -4 -22, 10 -6 C20 6, 32 -10, 26 -24" fill="none" stroke="#F8FAFC" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="-32" cy="18" r="7" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
          <circle cx="25" cy="-24" r="7" fill="#CBD5E1" stroke="#EF4444" strokeWidth="1.8" />
          <line x1="21" y1="-28" x2="29" y2="-20" stroke="#EF4444" strokeWidth="1.6" />
        </g>
      );
    case 'cram_notebook':
      return (
        <g>
          <rect x="-38" y="-32" width="76" height="64" rx="6" fill="#FEF3C7" stroke="#92400E" strokeWidth="1.8" />
          {[-24, -14, -4, 6, 16, 26].map((sy) => (
            <circle key={sy} cx="-38" cy={sy} r="3.5" fill="none" stroke="#475569" strokeWidth="2" />
          ))}
          <rect x="34" y="-22" width="12" height="10" rx="1.5" fill="#FDE047" />
          <rect x="34" y="-4" width="14" height="10" rx="1.5" fill="#38BDF8" />
          <rect x="34" y="14" width="11" height="10" rx="1.5" fill="#FB7185" />
          <line x1="-22" y1="-16" x2="22" y2="-16" stroke="#475569" strokeWidth="2" />
          <line x1="-22" y1="-4" x2="18" y2="-4" stroke="#64748B" strokeWidth="1.5" />
          <line x1="-22" y1="8" x2="24" y2="8" stroke="#64748B" strokeWidth="1.5" />
        </g>
      );
    case 'unripped_ticket':
      return (
        <g>
          <rect x="-36" y="-19" width="72" height="38" rx="4" fill="#FB7185" stroke="#FFE4E6" strokeWidth="1.6" />
          <line x1="16" y1="-19" x2="16" y2="19" stroke="#FFE4E6" strokeDasharray="3 2" strokeWidth="1.5" />
          <rect x="-28" y="-11" width="36" height="22" rx="2" fill="#FFF1F2" />
          <circle cx="-10" cy="0" r="5" fill="#E11D48" />
        </g>
      );
    case 'library_card':
      return (
        <g>
          <rect x="-36" y="-22" width="72" height="44" rx="5" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.8" />
          <rect x="-36" y="-22" width="72" height="12" rx="3" fill="#0369A1" />
          <rect x="-28" y="-3" width="18" height="20" rx="2" fill="#BAE6FD" />
          <line x1="-2" y1="0" x2="28" y2="0" stroke="#0F172A" strokeWidth="2" />
          <line x1="-2" y1="8" x2="24" y2="8" stroke="#334155" strokeWidth="1.6" />
          <line x1="-2" y1="15" x2="20" y2="15" stroke="#0284C7" strokeWidth="3" strokeDasharray="2 2" />
        </g>
      );
    case 'ginger_tea':
      return (
        <g>
          <rect x="-28" y="-24" width="56" height="48" rx="6" fill="#F97316" stroke="#FFEDD5" strokeWidth="1.5" />
          <circle cx="0" cy="-2" r="12" fill="#FFF7ED" />
          <path d="M-5 2 Q0 -9 5 2 Q0 6 -5 2 Z" fill="#D97706" />
        </g>
      );
    case 'worn_eraser':
      return (
        <g>
          <rect x="-24" y="-14" width="48" height="28" rx="4" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="-10" y="-14" width="34" height="28" rx="2" fill="#2563EB" />
          <line x1="-4" y1="-4" x2="16" y2="-4" stroke="#DBEAFE" strokeWidth="2" />
          <line x1="-4" y1="4" x2="12" y2="4" stroke="#DBEAFE" strokeWidth="1.5" />
        </g>
      );
    case 'cracked_ruler':
      return (
        <g>
          <rect x="-56" y="-12" width="112" height="24" rx="3" fill="#BAE6FD" fillOpacity="0.45" stroke="#E0F2FE" strokeWidth="1.5" />
          {[-44, -32, -20, -8, 4, 16, 28, 40].map((rx) => (
            <line key={rx} x1={rx} y1="-12" x2={rx} y2="-4" stroke="#F8FAFC" strokeWidth="1.5" />
          ))}
          <path d="M10 -12 L15 -2 L8 6 L14 12" fill="none" stroke="#F8FAFC" strokeWidth="1.6" />
        </g>
      );
    case 'pressed_daisy':
      return (
        <g>
          <rect x="-28" y="-34" width="56" height="68" rx="4" fill="#D6B88D" stroke="#78350F" strokeWidth="1.4" />
          <line x1="0" y1="-2" x2="0" y2="24" stroke="#3F6212" strokeWidth="2.5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
            <ellipse
              key={ang}
              cx="0"
              cy="-14"
              rx="4"
              ry="9"
              fill="#FFFBEB"
              transform={`rotate(${ang} 0 -4)`}
            />
          ))}
          <circle cx="0" cy="-4" r="5" fill="#F59E0B" />
        </g>
      );
    case 'id_photo':
      return (
        <g>
          <rect x="-21" y="-26" width="42" height="52" rx="3" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="-16" y="-21" width="32" height="42" fill="#38BDF8" />
          <circle cx="0" cy="-6" r="7" fill="#FDBA74" />
          <path d="M-12 20 C-12 6, 12 6, 12 20 Z" fill="#FFFFFF" />
        </g>
      );
    default:
      return <circle cx="0" cy="0" r="18" fill={item.tintColor} />;
  }
}

export function renderCoverArtwork(cover: AntiqueCoverDef, isOpen: boolean) {
  const { w, h, kind, accentColor } = cover;
  if (kind === 'papers') {
    return (
      <g>
        <rect x={4} y={6} width={w} height={h} rx={8} fill="#000000" fillOpacity="0.28" />
        <rect x={0} y={0} width={w} height={h} rx={8} fill={accentColor} stroke="#78716C" strokeWidth="2" />
        <line x1={18} y1={26} x2={w - 22} y2={26} stroke="#44403C" strokeWidth="6" />
        <line x1={18} y1={46} x2={w * 0.68} y2={46} stroke="#57534E" strokeWidth="3" />
        <rect x={18} y={64} width={w * 0.42} height={h - 86} rx={3} fill="#A8A29E" fillOpacity="0.45" />
        <line x1={w * 0.52} y1={68} x2={w - 22} y2={68} stroke="#57534E" strokeWidth="2.5" />
        <line x1={w * 0.52} y1={84} x2={w - 28} y2={84} stroke="#57534E" strokeWidth="2.5" />
        <line x1={w * 0.52} y1={100} x2={w - 20} y2={100} stroke="#57534E" strokeWidth="2.5" />
        {!isOpen && (
          <path d={`M${w - 28} ${h} L${w} ${h - 28} L${w} ${h} Z`} fill="#A8A29E" opacity="0.6" />
        )}
      </g>
    );
  }
  if (kind === 'flap') {
    return (
      <g>
        <rect x={4} y={6} width={w} height={h} rx={14} fill="#000000" fillOpacity="0.32" />
        <rect x={0} y={0} width={w} height={h} rx={14} fill={accentColor} stroke="#A87958" strokeWidth="2.2" />
        <rect x={12} y={12} width={w - 24} height={h - 24} rx={10} fill="none" stroke="#D6B18D" strokeOpacity="0.45" strokeDasharray="6 4" strokeWidth="1.4" />
        <circle cx={w / 2} cy={h - 24} r={10} fill="#D4A34C" stroke="#451A03" strokeWidth="2" />
      </g>
    );
  }
  if (kind === 'curtain') {
    return (
      <g>
        <rect x={4} y={6} width={w} height={h} rx={16} fill="#000000" fillOpacity="0.25" />
        <rect x={0} y={0} width={w} height={h} rx={16} fill={accentColor} stroke="#CBD5E1" strokeOpacity="0.65" strokeWidth="2" strokeDasharray="4 4" />
        <path
          d={`M20 28 Q${w / 2} 10 ${w - 20} 28 M20 ${h / 2} Q${w / 2} ${h / 2 - 18} ${w - 20} ${h / 2} M20 ${h - 28} Q${w / 2} ${h - 46} ${w - 20} ${h - 28}`}
          fill="none"
          stroke="#94A3B8"
          strokeOpacity="0.45"
          strokeWidth="2"
        />
      </g>
    );
  }
  if (kind === 'drawer') {
    return (
      <g>
        <rect x={4} y={6} width={w} height={h} rx={8} fill="#000000" fillOpacity="0.35" />
        <rect x={0} y={0} width={w} height={h} rx={8} fill="#E6D2B8" stroke="#855E42" strokeWidth="2.5" />
        <rect x={16} y={16} width={w - 32} height={h - 32} rx={4} fill="#D6BA98" stroke="#A17A5A" strokeWidth="1.5" />
        <circle cx={w / 2} cy={h / 2} r={11} fill="#D4A34C" stroke="#5C3A16" strokeWidth="2" />
      </g>
    );
  }
  if (kind === 'book') {
    return (
      <g>
        <rect x={5} y={7} width={w} height={h} rx={8} fill="#000000" fillOpacity="0.36" />
        <rect x={0} y={0} width={w} height={h} rx={8} fill={accentColor} stroke="#93C5FD" strokeOpacity="0.4" strokeWidth="2" />
        <rect x={0} y={0} width={24} height={h} rx={4} fill="#0F172A" fillOpacity="0.55" />
        <rect x={44} y={32} width={w - 68} height={36} rx={4} fill="#F8FAFC" fillOpacity="0.16" />
        <line x1={52} y1={46} x2={w - 36} y2={46} stroke="#FDE68A" strokeWidth="3" />
        <line x1={52} y1={58} x2={w - 58} y2={58} stroke="#CBD5E1" strokeWidth="2" />
      </g>
    );
  }
  // lid
  return (
    <g>
      <rect x={4} y={6} width={w} height={h} rx={12} fill="#000000" fillOpacity="0.34" />
      <rect x={0} y={0} width={w} height={h} rx={12} fill={accentColor} stroke="#FDE68A" strokeOpacity="0.45" strokeWidth="2.2" />
      <rect x={14} y={14} width={w - 28} height={h - 28} rx={7} fill="none" stroke="#FDE68A" strokeOpacity="0.35" strokeWidth="1.4" />
      <rect x={w / 2 - 16} y={h - 10} width={32} height={8} rx={3} fill="#D4A34C" />
    </g>
  );
}

export function renderTeaDecorArtwork(kind: 'station_lantern' | 'lavender_vase' | 'ceramic_mug') {
  if (kind === 'station_lantern') {
    return (
      <svg viewBox="0 0 64 64" className="w-12 h-12 shrink-0" aria-hidden="true">
        <path d="M22 18 C22 8, 42 8, 42 18" fill="none" stroke="#FBBF24" strokeWidth="2.5" />
        <rect x="20" y="18" width="24" height="28" rx="4" fill="#292018" stroke="#D97706" strokeWidth="2.5" />
        <path d="M32 24 C36 29, 36 37, 32 40 C28 37, 28 29, 32 24 Z" fill="#FEF08A" />
        <rect x="17" y="46" width="30" height="6" rx="2.5" fill="#B45309" />
      </svg>
    );
  }
  if (kind === 'lavender_vase') {
    return (
      <svg viewBox="0 0 64 64" className="w-12 h-12 shrink-0" aria-hidden="true">
        <path d="M26 30 L21 52 Q21 56 32 56 Q43 56 43 52 L38 30 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
        <line x1="32" y1="30" x2="25" y2="12" stroke="#4D7C0F" strokeWidth="2" />
        <line x1="32" y1="30" x2="32" y2="9" stroke="#4D7C0F" strokeWidth="2" />
        <line x1="32" y1="30" x2="39" y2="13" stroke="#4D7C0F" strokeWidth="2" />
        <ellipse cx="25" cy="14" rx="4" ry="7" fill="#A855F7" />
        <ellipse cx="32" cy="11" rx="4" ry="8" fill="#C084FC" />
        <ellipse cx="39" cy="15" rx="4" ry="7" fill="#9333EA" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className="w-12 h-12 shrink-0" aria-hidden="true">
      <path d="M16 26 L44 26 L41 50 Q41 55 30 55 Q19 55 19 50 Z" fill="#F5E6D3" stroke="#9A6B4A" strokeWidth="2.2" />
      <path d="M44 30 C53 30, 53 44, 42 44" fill="none" stroke="#9A6B4A" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M25 18 Q23 13 26 9 M33 19 Q35 14 32 10" fill="none" stroke="#FDE68A" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
