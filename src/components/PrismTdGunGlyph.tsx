import type { GunType } from '../utils/prismTdEngine.ts';

interface PrismTdGunGlyphProps {
  type: GunType;
  color: string;
  className?: string;
}

/**
 * Lightweight, crisp tactical SVG silhouettes for all 19 towers so mobile gun cards
 * read at a glance without cramped micro-copy.
 */
export function PrismTdGunGlyph({ type, color, className = 'w-6 h-6' }: PrismTdGunGlyphProps) {
  switch (type) {
    case 'gatling':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="14" r="10.5" fill="#0B1222" stroke={color} strokeWidth="1.6" />
          <rect x="9" y="10" width="9" height="8" rx="2" fill="#1E293B" stroke={color} strokeWidth="1.2" />
          <line x1="18" y1="11.5" x2="25.5" y2="11.5" stroke="#FDE047" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="18" y1="14" x2="26.5" y2="14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="18" y1="16.5" x2="25.5" y2="16.5" stroke="#FDE047" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'shotgun':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <rect x="4.5" y="4.5" width="19" height="19" rx="5" fill="#0B1222" stroke={color} strokeWidth="1.6" />
          <polygon points="14,14 25,8.5 25,19.5" fill={color} fillOpacity="0.28" stroke={color} strokeWidth="1.3" />
          <circle cx="12" cy="14" r="4" fill="#1E293B" stroke={color} strokeWidth="1.4" />
        </svg>
      );
    case 'flamer':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="14" r="10.5" fill="#0B1222" stroke={color} strokeWidth="1.6" />
          <path d="M14 6.5 C18.5 11 19 16.5 14 20.5 C9 16.5 9.5 11 14 6.5 Z" fill={color} fillOpacity="0.88" />
          <path d="M14 11 C16 13.5 16 16.5 14 18.5 C12 16.5 12 13.5 14 11 Z" fill="#FEF08A" />
        </svg>
      );
    case 'saw':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="14" r="10.5" fill="#0B1222" stroke={color} strokeWidth="1.5" />
          <polygon
            points="14,4 16.5,8.5 21.5,7 19.5,11.5 24,14 19.5,16.5 21.5,21 16.5,19.5 14,24 11.5,19.5 6.5,21 8.5,16.5 4,14 8.5,11.5 6.5,7 11.5,8.5"
            fill={color}
            fillOpacity="0.82"
            stroke="#F8FAFC"
            strokeWidth="0.9"
          />
          <circle cx="14" cy="14" r="3" fill="#070B14" />
        </svg>
      );
    case 'mortar':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <rect x="4" y="4" width="20" height="20" rx="6" fill="#0B1222" stroke={color} strokeWidth="1.6" />
          <circle cx="14" cy="14" r="6.5" fill="#1E293B" stroke={color} strokeWidth="1.6" />
          <circle cx="14" cy="14" r="3" fill={color} />
          <line x1="14" y1="5.5" x2="14" y2="9" stroke="#F8FAFC" strokeWidth="1.4" />
          <line x1="14" y1="19" x2="14" y2="22.5" stroke="#F8FAFC" strokeWidth="1.4" />
        </svg>
      );
    case 'missile':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <rect x="4" y="4" width="20" height="20" rx="5" fill="#0B1222" stroke={color} strokeWidth="1.6" />
          <path d="M19.5 8.5 L15 20 L13 15 L8 13 Z" fill={color} stroke="#F8FAFC" strokeWidth="1" />
          <circle cx="18.5" cy="9.5" r="1.8" fill="#FEF08A" />
        </svg>
      );
    case 'railgun':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <rect x="4" y="5" width="20" height="18" rx="4" fill="#0B1222" stroke={color} strokeWidth="1.5" />
          <line x1="8" y1="11.5" x2="25" y2="11.5" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
          <line x1="8" y1="16.5" x2="25" y2="16.5" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
          <line x1="11" y1="14" x2="26" y2="14" stroke="#E0F2FE" strokeWidth="1.4" />
          <circle cx="9.5" cy="14" r="3.4" fill="#1E293B" stroke="#E0F2FE" strokeWidth="1.2" />
        </svg>
      );
    case 'orbital':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="14" r="10.5" fill="#0B1222" stroke={color} strokeWidth="1.6" />
          <circle cx="14" cy="14" r="6" fill="none" stroke="#FDE047" strokeWidth="1.3" strokeDasharray="3 2" />
          <circle cx="14" cy="14" r="3" fill={color} />
          <line x1="14" y1="2.5" x2="14" y2="7" stroke={color} strokeWidth="1.5" />
          <line x1="14" y1="21" x2="14" y2="25.5" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    case 'singularity':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="14" r="10.5" fill="#0B1222" stroke={color} strokeWidth="1.6" />
          <ellipse cx="14" cy="14" rx="9" ry="3.8" transform="rotate(-25 14 14)" fill="none" stroke="#E879F9" strokeWidth="1.4" />
          <circle cx="14" cy="14" r="4.2" fill="#030712" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    case 'mothership':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <polygon points="14,4 23,12 20,23 8,23 5,12" fill="#0B1222" stroke={color} strokeWidth="1.6" />
          <polygon points="14,7.5 18.5,14 14,19.5 9.5,14" fill={color} fillOpacity="0.8" />
          <circle cx="7" cy="9" r="1.7" fill="#38BDF8" />
          <circle cx="21" cy="9" r="1.7" fill="#38BDF8" />
        </svg>
      );
    case 'supernova':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="14" r="10.5" fill="#0B1222" stroke={color} strokeWidth="1.6" />
          <polygon points="14,4 16.4,11.6 24,14 16.4,16.4 14,24 11.6,16.4 4,14 11.6,11.6" fill={color} />
          <circle cx="14" cy="14" r="2.8" fill="#FFFFFF" />
        </svg>
      );
    case 'chronos':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="14" r="10.5" fill="#0B1222" stroke={color} strokeWidth="1.6" />
          <circle cx="14" cy="14" r="7" fill="none" stroke="#67E8F9" strokeWidth="1.2" strokeDasharray="2 2" />
          <polyline points="14,8.5 14,14 18.5,16.5" fill="none" stroke="#F8FAFC" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'astral_ark':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <polygon points="14,3 24,14 14,25 4,14" fill="#150826" stroke={color} strokeWidth="1.7" />
          <polygon points="14,7.5 19.5,14 14,20.5 8.5,14" fill={color} fillOpacity="0.85" stroke="#FDF4FF" strokeWidth="1" />
          <circle cx="14" cy="14" r="2.3" fill="#FFFFFF" />
        </svg>
      );
    case 'tesla':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="14" r="10.5" fill="#0B1222" stroke={color} strokeWidth="1.6" />
          <polygon points="15.5,5.5 9.5,15 14,15 12.5,22.5 18.5,13 14,13" fill={color} stroke="#E0F2FE" strokeWidth="0.9" />
        </svg>
      );
    case 'tempest':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="14" r="10.5" fill="#0B1222" stroke={color} strokeWidth="1.6" />
          <path d="M8 12 A6.5 6.5 0 0 1 20 12" fill="none" stroke="#BAE6FD" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M20 16 A6.5 6.5 0 0 1 8 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="14" cy="14" r="2.8" fill="#E0F2FE" />
        </svg>
      );
    case 'beacon':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="14" r="10.5" fill="#0B1222" stroke={color} strokeWidth="1.6" />
          <polygon points="14,6 19,14 14,22 9,14" fill={color} fillOpacity="0.85" />
          <circle cx="14" cy="14" r="2.5" fill="#FEF08A" />
        </svg>
      );
    case 'cryo':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="14" r="10.5" fill="#0B1222" stroke={color} strokeWidth="1.6" />
          <line x1="14" y1="6" x2="14" y2="22" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="7.1" y1="10" x2="20.9" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="20.9" y1="10" x2="7.1" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="14" cy="14" r="2.4" fill="#E0F2FE" />
        </svg>
      );
    case 'radar':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="14" r="10.5" fill="#0B1222" stroke={color} strokeWidth="1.6" />
          <circle cx="14" cy="14" r="6" fill="none" stroke={color} strokeWidth="1.2" strokeOpacity="0.7" />
          <line x1="14" y1="14" x2="21" y2="8.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="14" cy="14" r="2.2" fill="#FDE047" />
        </svg>
      );
    case 'quantum_prism':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <polygon points="14,4 23.5,20.5 4.5,20.5" fill="#071C1B" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
          <polygon points="14,9 19,18 9,18" fill={color} fillOpacity="0.78" />
          <circle cx="14" cy="15" r="2.2" fill="#FFFFFF" />
        </svg>
      );
  }
}
