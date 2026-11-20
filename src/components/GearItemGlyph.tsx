import type { GearItemId } from '../utils/gearArenaEngine';

interface GearItemGlyphProps {
  itemId: GearItemId;
  color: string;
  accent: string;
  className?: string;
}

export function GearItemGlyph({ itemId, color, accent, className = 'w-7 h-7' }: GearItemGlyphProps) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      {/* Pulse Laser / Twin SMG / Gatling */}
      {itemId === 'pulse_laser' && (
        <g stroke={accent} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="13" width="18" height="8" rx="2" fill={color} fillOpacity="0.3" />
          <path d="M24 15h7M24 19h5M10 21l-2 7h5l2-7" fill={color} fillOpacity="0.2" />
          <circle cx="15" cy="17" r="2" fill="#E0F2FE" stroke="none" />
        </g>
      )}
      {itemId === 'twin_smg' && (
        <g stroke={accent} strokeWidth="1.5" fill="none" strokeLinecap="round">
          <rect x="5" y="11" width="16" height="6" rx="1.5" fill={color} fillOpacity="0.3" />
          <rect x="8" y="18" width="16" height="6" rx="1.5" fill={color} fillOpacity="0.3" />
          <path d="M21 14h10M24 21h7M11 24l-2 6" />
        </g>
      )}
      {itemId === 'frost_rifle' && (
        <g stroke={accent} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="14" width="20" height="7" rx="2" fill={color} fillOpacity="0.3" />
          <path d="M24 17.5h8M15 10l2 4m-2 11l2-4M19 11l-2 3m2 10l-2-3" />
          <polygon points="31,17.5 27,15 27,20" fill="#E0F2FE" stroke="none" />
        </g>
      )}
      {itemId === 'chain_saw' && (
        <g stroke={accent} strokeWidth="1.5" fill="none">
          <circle cx="18" cy="18" r="9.5" fill={color} fillOpacity="0.25" strokeDasharray="3 2" />
          <circle cx="18" cy="18" r="5" fill="#1E293B" />
          <path d="M18 8v20M8 18h20" stroke="#FDE68A" strokeWidth="1.2" />
        </g>
      )}
      {itemId === 'shotgun_blaster' && (
        <g stroke={accent} strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M5 19l5-5h17v6H11l-3 7H4z" fill={color} fillOpacity="0.3" />
          <path d="M27 15h6M27 18h6M16 20h7" />
        </g>
      )}
      {itemId === 'flamethrower' && (
        <g stroke={accent} strokeWidth="1.5" fill="none" strokeLinecap="round">
          <rect x="5" y="15" width="15" height="8" rx="2" fill={color} fillOpacity="0.3" />
          <rect x="9" y="9" width="7" height="6" rx="1.5" fill="#F97316" fillOpacity="0.45" />
          <path d="M20 19h5c2-4 6-3 7 0-2 3-5 3-7 0z" fill="#FDE047" fillOpacity="0.85" />
        </g>
      )}
      {itemId === 'grenade_launcher' && (
        <g stroke={accent} strokeWidth="1.5" fill="none">
          <rect x="6" y="12" width="16" height="11" rx="2.5" fill={color} fillOpacity="0.3" />
          <circle cx="14" cy="17.5" r="4" strokeDasharray="2.5 2" />
          <rect x="22" y="14" width="9" height="6" rx="1" fill={color} fillOpacity="0.4" />
        </g>
      )}
      {itemId === 'homing_missile' && (
        <g stroke={accent} strokeWidth="1.5" fill="none" strokeLinejoin="round">
          <rect x="6" y="10" width="18" height="16" rx="2" fill={color} fillOpacity="0.25" />
          <path d="M10 15h14l4 3-4 3H10z" fill={color} fillOpacity="0.55" />
          <circle cx="12" cy="14" r="1.5" fill="#FEF08A" stroke="none" />
          <circle cx="12" cy="22" r="1.5" fill="#FEF08A" stroke="none" />
        </g>
      )}
      {itemId === 'tesla_coil' && (
        <g stroke={accent} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="12" y="22" width="12" height="7" rx="1.5" fill={color} fillOpacity="0.35" />
          <path d="M15 22v-9h6v9M11 11h14" />
          <path d="M8 14l4-5-3-4M28 14l-4-5 3-4" stroke="#E0F2FE" />
          <circle cx="18" cy="9" r="3" fill="#38BDF8" />
        </g>
      )}
      {itemId === 'railgun' && (
        <g stroke={accent} strokeWidth="1.5" fill="none" strokeLinecap="round">
          <path d="M4 14h26M4 21h26" strokeWidth="2" />
          <rect x="6" y="15.5" width="14" height="4" fill={color} fillOpacity="0.4" />
          <path d="M20 17.5h12" stroke="#FFFFFF" strokeWidth="1.8" />
        </g>
      )}
      {itemId === 'gatling_vulcan' && (
        <g stroke={accent} strokeWidth="1.4" fill="none">
          <rect x="5" y="12" width="11" height="12" rx="2" fill={color} fillOpacity="0.35" />
          <path d="M16 13.5h15M16 17.5h16M16 21.5h15" strokeWidth="1.8" />
          <rect x="24" y="12" width="3" height="11" fill="#0F172A" />
        </g>
      )}
      {itemId === 'nova_cannon' && (
        <g stroke={accent} strokeWidth="1.6" fill="none">
          <circle cx="18" cy="18" r="11" fill={color} fillOpacity="0.25" />
          <circle cx="18" cy="18" r="6" fill="#E9D5FF" fillOpacity="0.45" />
          <circle cx="18" cy="18" r="2.5" fill="#FFFFFF" stroke="none" />
          <path d="M18 4v5M18 27v5M4 18h5M27 18h5" />
        </g>
      )}

      {/* Cores & Conductors */}
      {itemId === 'overclock_core' && (
        <g stroke={accent} strokeWidth="1.6" fill="none">
          <polygon points="18,6 28,12 28,24 18,30 8,24 8,12" fill={color} fillOpacity="0.3" />
          <path d="M19 11l-5 7h5l-2 7 6-8h-5z" fill="#FEF08A" stroke="none" />
        </g>
      )}
      {itemId === 'nuclear_battery' && (
        <g stroke={accent} strokeWidth="1.5" fill="none">
          <rect x="10" y="9" width="16" height="20" rx="2.5" fill={color} fillOpacity="0.3" />
          <rect x="14" y="6" width="8" height="3" rx="1" fill={accent} />
          <circle cx="18" cy="19" r="4" fill="#A7F3D0" fillOpacity="0.5" />
        </g>
      )}
      {itemId === 'conductor_wire' && (
        <g stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M6 18h7l3-6 4 12 3-6h7" />
          <circle cx="6" cy="18" r="2.2" fill="#BAE6FD" />
          <circle cx="30" cy="18" r="2.2" fill="#BAE6FD" />
        </g>
      )}
      {itemId === 'gear_haste' && (
        <g stroke={accent} strokeWidth="1.6" fill="none">
          <circle cx="18" cy="18" r="7" fill={color} fillOpacity="0.3" />
          <circle cx="18" cy="18" r="2.5" fill="#0F172A" />
          <path d="M18 7v4M18 25v4M7 18h4M25 18h4M10.5 10.5l2.8 2.8M22.7 22.7l2.8 2.8M25.5 10.5l-2.8 2.8M13.3 22.7l-2.8 2.8" />
        </g>
      )}
      {itemId === 'plasma_crit' && (
        <g stroke={accent} strokeWidth="1.6" fill="none">
          <circle cx="18" cy="18" r="9" fill={color} fillOpacity="0.2" />
          <circle cx="18" cy="18" r="4" />
          <path d="M18 6v5M18 25v5M6 18h5M25 18h5" />
        </g>
      )}

      {/* Tactical Accessories */}
      {itemId === 'laser_sight' && (
        <g stroke={accent} strokeWidth="1.6" fill="none">
          <rect x="8" y="13" width="16" height="10" rx="2" fill={color} fillOpacity="0.3" />
          <circle cx="16" cy="18" r="3" stroke="#FB7185" />
          <path d="M24 18h8" stroke="#FB7185" strokeDasharray="2 1.5" />
        </g>
      )}
      {itemId === 'extended_mag' && (
        <g stroke={accent} strokeWidth="1.5" fill="none">
          <path d="M12 8h10l2 19-9 2-3-21z" fill={color} fillOpacity="0.3" />
          <path d="M15 13h5M15.5 18h5M16 23h5" />
        </g>
      )}
      {itemId === 'vampire_module' && (
        <g stroke={accent} strokeWidth="1.5" fill="none">
          <path d="M18 7c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15z" fill={color} fillOpacity="0.35" />
          <path d="M18 16v8M14 20h8" stroke="#FFE4E6" />
        </g>
      )}
      {itemId === 'cryo_cell' && (
        <g stroke={accent} strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M18 6v24M7.6 12l20.8 12M28.4 12L7.6 24" />
          <circle cx="18" cy="18" r="4" fill={color} fillOpacity="0.4" />
        </g>
      )}
      {itemId === 'stun_capacitor' && (
        <g stroke={accent} strokeWidth="1.6" fill="none">
          <rect x="9" y="10" width="18" height="16" rx="3" fill={color} fillOpacity="0.3" />
          <path d="M20 12l-5 6h4l-2 6 6-7h-4z" fill="#FDE047" stroke="none" />
        </g>
      )}

      {/* Defense Modules */}
      {(itemId === 'armor_plate' || itemId === 'reactive_armor') && (
        <g stroke={accent} strokeWidth="1.6" fill="none" strokeLinejoin="round">
          <path d="M18 6l10 4v8c0 6.5-4.3 10.8-10 13-5.7-2.2-10-6.5-10-13v-8z" fill={color} fillOpacity="0.32" />
          <path d="M18 11v14M13 16h10" stroke={itemId === 'reactive_armor' ? '#38BDF8' : accent} />
        </g>
      )}
      {itemId === 'nano_repair' && (
        <g stroke={accent} strokeWidth="1.6" fill="none">
          <rect x="8" y="8" width="20" height="20" rx="4" fill={color} fillOpacity="0.28" />
          <path d="M18 13v10M13 18h10" stroke="#A7F3D0" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      )}
      {itemId === 'reflector_shield' && (
        <g stroke={accent} strokeWidth="1.6" fill="none">
          <polygon points="18,6 28,11 26,23 18,30 10,23 8,11" fill={color} fillOpacity="0.28" />
          <polygon points="18,11 23,14 22,21 18,25 14,21 13,14" stroke="#E0F2FE" />
        </g>
      )}
    </svg>
  );
}
