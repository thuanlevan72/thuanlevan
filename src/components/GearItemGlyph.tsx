import { useId } from 'react';
import type { GearItemId } from '../utils/gearArenaEngine';

interface GearItemGlyphProps {
  itemId: GearItemId;
  color: string;
  accent: string;
  className?: string;
}

export function GearItemGlyph({ itemId, color, accent, className = 'w-7 h-7' }: GearItemGlyphProps) {
  const uid = useId().replace(/:/g, '');
  const steelId = `st-${uid}`;
  const brassId = `br-${uid}`;
  const coreId = `cr-${uid}`;
  const glowId = `gl-${uid}`;

  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={steelId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="45%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id={brassId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <radialGradient id={coreId} cx="42%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="42%" stopColor={accent} />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
        <linearGradient id={glowId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} />
          <stop offset="60%" stopColor={accent} />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>

      {/* Subtle recessed ambient glow behind heavy machined hardware */}
      <circle cx="20" cy="20" r="16" fill={color} fillOpacity="0.12" />

      {/* 1. Pulse Laser */}
      {itemId === 'pulse_laser' && (
        <g>
          <path d="M8 23l-3 10h6l2.5-10z" fill={`url(#${steelId})`} stroke="#475569" strokeWidth="1" />
          <rect x="5" y="13" width="21" height="10" rx="2.5" fill={`url(#${steelId})`} stroke={accent} strokeWidth="1.2" />
          <rect x="7" y="14.5" width="16" height="2" rx="1" fill="#CBD5E1" fillOpacity="0.45" />
          <rect x="26" y="15" width="10" height="2.4" rx="1" fill={accent} />
          <rect x="26" y="19" width="7" height="2" rx="1" fill="#64748B" />
          <circle cx="15" cy="18.5" r="3.4" fill={`url(#${coreId})`} stroke="#0F172A" strokeWidth="1" />
          <circle cx="35.5" cy="16.2" r="1.8" fill="#FFFFFF" />
          <circle cx="8" cy="15.5" r="0.9" fill="#94A3B8" />
          <circle cx="8" cy="21" r="0.9" fill="#94A3B8" />
        </g>
      )}

      {/* 2. Twin SMG */}
      {itemId === 'twin_smg' && (
        <g>
          <path d="M12 24l-2 9h4.5l1.8-9z" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          <rect x="4" y="10.5" width="18" height="7" rx="1.8" fill={`url(#${steelId})`} stroke={accent} strokeWidth="1.1" />
          <rect x="7" y="18.5" width="19" height="7" rx="1.8" fill={`url(#${steelId})`} stroke={accent} strokeWidth="1.1" />
          <rect x="22" y="12.5" width="13" height="2.6" rx="1" fill="#94A3B8" stroke="#334155" strokeWidth="0.7" />
          <rect x="26" y="20.5" width="11" height="2.6" rx="1" fill="#CBD5E1" stroke="#334155" strokeWidth="0.7" />
          <rect x="9" y="12.5" width="7" height="2.5" rx="1" fill={color} />
          <rect x="12" y="20.5" width="8" height="2.5" rx="1" fill={accent} />
          <circle cx="35.5" cy="13.8" r="1.4" fill="#FDE047" />
          <circle cx="37" cy="21.8" r="1.4" fill="#FDE047" />
        </g>
      )}

      {/* 3. Frost Rifle */}
      {itemId === 'frost_rifle' && (
        <g>
          <path d="M9 24l-2 9h5l2-9z" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
          <rect x="4" y="14" width="22" height="9" rx="2.5" fill={`url(#${steelId})`} stroke="#7DD3FC" strokeWidth="1.2" />
          <rect x="26" y="16.5" width="11" height="4" rx="1.2" fill="#0284C7" stroke="#BAE6FD" strokeWidth="0.9" />
          <rect x="9" y="16" width="12" height="5" rx="1.5" fill={`url(#${coreId})`} />
          <path d="M13 10l2 4m4-4l-1.5 4M13 27l2-4m4 4l-1.5-4" stroke="#E0F2FE" strokeWidth="1.4" strokeLinecap="round" />
          <polygon points="38,18.5 33,15.2 33,21.8" fill="#E0F2FE" />
        </g>
      )}

      {/* 4. Chain Saw */}
      {itemId === 'chain_saw' && (
        <g>
          <circle cx="20" cy="20" r="13" fill="none" stroke={accent} strokeWidth="2.5" strokeDasharray="3.2 2" />
          <circle cx="20" cy="20" r="10.8" fill={`url(#${steelId})`} stroke="#CBD5E1" strokeWidth="1.2" />
          <path d="M20 9.5v21M9.5 20h21M12.6 12.6l14.8 14.8M27.4 12.6L12.6 27.4" stroke="#0F172A" strokeWidth="2" />
          <circle cx="20" cy="20" r="5.2" fill={`url(#${brassId})`} stroke="#FEF3C7" strokeWidth="1" />
          <circle cx="20" cy="20" r="2" fill="#0F172A" />
        </g>
      )}

      {/* 5. Shotgun Blaster */}
      {itemId === 'shotgun_blaster' && (
        <g>
          <path d="M4 22l5-7h20v8H11.5l-3.5 9H3.5z" fill={`url(#${steelId})`} stroke={accent} strokeWidth="1.2" strokeLinejoin="round" />
          <rect x="29" y="15.5" width="8" height="2.8" rx="0.8" fill="#CBD5E1" />
          <rect x="29" y="19.5" width="8" height="2.8" rx="0.8" fill="#94A3B8" />
          <rect x="16" y="22.5" width="11" height="3.2" rx="1.2" fill={`url(#${brassId})`} />
          <circle cx="13" cy="18.5" r="2.1" fill={color} stroke="#FEF3C7" strokeWidth="0.8" />
        </g>
      )}

      {/* 6. Flamethrower */}
      {itemId === 'flamethrower' && (
        <g>
          <rect x="8" y="8" width="9" height="8" rx="2.5" fill={`url(#${brassId})`} stroke="#FDBA74" strokeWidth="1.1" />
          <rect x="4" y="15" width="18" height="10" rx="2.5" fill={`url(#${steelId})`} stroke="#F97316" strokeWidth="1.2" />
          <rect x="22" y="17.5" width="7" height="5" rx="1" fill="#475569" stroke="#FB923C" strokeWidth="1" />
          <path d="M29 20c2.5-6 8-5.5 9 0-1 5.5-6.5 6-9 0z" fill="#F97316" />
          <path d="M29.5 20c1.8-3.4 5.2-3 6 0-.8 3-4.2 3.4-6 0z" fill="#FEF08A" />
          <rect x="7" y="18" width="10" height="3.5" rx="1" fill="#EA580C" />
        </g>
      )}

      {/* 7. Grenade Launcher */}
      {itemId === 'grenade_launcher' && (
        <g>
          <path d="M8 25l-2 8h5l2-8z" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          <rect x="5" y="11" width="19" height="14" rx="3.5" fill={`url(#${steelId})`} stroke={accent} strokeWidth="1.2" />
          <circle cx="14.5" cy="18" r="5" fill="#0F172A" stroke={accent} strokeWidth="1.2" />
          <circle cx="14.5" cy="15.2" r="1.4" fill={`url(#${brassId})`} />
          <circle cx="17.3" cy="18" r="1.4" fill={`url(#${brassId})`} />
          <circle cx="14.5" cy="20.8" r="1.4" fill={`url(#${brassId})`} />
          <circle cx="11.7" cy="18" r="1.4" fill={`url(#${brassId})`} />
          <rect x="24" y="14" width="12" height="8" rx="1.8" fill={`url(#${brassId})`} stroke="#FEF3C7" strokeWidth="1" />
        </g>
      )}

      {/* 8. Homing Missile */}
      {itemId === 'homing_missile' && (
        <g>
          <rect x="5" y="8" width="22" height="24" rx="3" fill={`url(#${steelId})`} stroke={accent} strokeWidth="1.2" />
          <rect x="8" y="11" width="16" height="5" rx="1.5" fill="#0F172A" stroke="#64748B" strokeWidth="0.9" />
          <rect x="8" y="24" width="16" height="5" rx="1.5" fill="#0F172A" stroke="#64748B" strokeWidth="0.9" />
          <path d="M9 17h18l6 3-6 3H9z" fill={`url(#${glowId})`} stroke="#FFFFFF" strokeWidth="0.8" />
          <circle cx="11" cy="13.5" r="1.6" fill="#F43F5E" />
          <circle cx="11" cy="26.5" r="1.6" fill="#FDE047" />
        </g>
      )}

      {/* 9. Tesla Coil */}
      {itemId === 'tesla_coil' && (
        <g>
          <rect x="10" y="26" width="20" height="8" rx="2" fill={`url(#${steelId})`} stroke={accent} strokeWidth="1.2" />
          <rect x="15" y="12" width="10" height="14" fill={`url(#${brassId})`} stroke="#FDE68A" strokeWidth="1" />
          <path d="M14 15h12M14 19h12M14 23h12" stroke="#0F172A" strokeWidth="1.4" />
          <ellipse cx="20" cy="11" rx="9" ry="3.2" fill={`url(#${steelId})`} stroke="#7DD3FC" strokeWidth="1.1" />
          <circle cx="20" cy="9.5" r="4.2" fill={`url(#${coreId})`} />
          <path d="M8 15l4-5-3-4M32 15l-4-5 3-4" stroke="#E0F2FE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      )}

      {/* 10. Railgun */}
      {itemId === 'railgun' && (
        <g>
          <rect x="4" y="12.5" width="32" height="4" rx="1.2" fill={`url(#${steelId})`} stroke="#A5B4FC" strokeWidth="1" />
          <rect x="4" y="23.5" width="32" height="4" rx="1.2" fill={`url(#${steelId})`} stroke="#A5B4FC" strokeWidth="1" />
          <rect x="6" y="16.5" width="16" height="7" fill="#1E1B4B" stroke="#818CF8" strokeWidth="1" />
          <rect x="8" y="18.2" width="28" height="3.6" rx="1.8" fill={`url(#${glowId})`} />
          <rect x="12" y="19.3" width="24" height="1.4" fill="#FFFFFF" />
          <circle cx="10" cy="14.5" r="1" fill="#E0E7FF" />
          <circle cx="16" cy="14.5" r="1" fill="#E0E7FF" />
          <circle cx="10" cy="25.5" r="1" fill="#E0E7FF" />
          <circle cx="16" cy="25.5" r="1" fill="#E0E7FF" />
        </g>
      )}

      {/* 11. Gatling Vulcan */}
      {itemId === 'gatling_vulcan' && (
        <g>
          <rect x="4" y="11" width="13" height="18" rx="2.5" fill={`url(#${steelId})`} stroke={accent} strokeWidth="1.2" />
          <rect x="6.5" y="14" width="7" height="12" rx="1.2" fill={`url(#${brassId})`} />
          <rect x="17" y="12.5" width="19" height="2.6" rx="1" fill="#CBD5E1" />
          <rect x="17" y="16.5" width="20" height="2.6" rx="1" fill="#F8FAFC" />
          <rect x="17" y="20.5" width="20" height="2.6" rx="1" fill="#CBD5E1" />
          <rect x="17" y="24.5" width="19" height="2.6" rx="1" fill="#94A3B8" />
          <rect x="26" y="11.5" width="4" height="17" rx="1" fill="#0F172A" stroke="#F59E0B" strokeWidth="1" />
        </g>
      )}

      {/* 12. Nova Cannon */}
      {itemId === 'nova_cannon' && (
        <g>
          <circle cx="20" cy="20" r="14.5" fill={`url(#${steelId})`} stroke={accent} strokeWidth="1.5" />
          <circle cx="20" cy="20" r="10.5" fill="#1E1B4B" stroke="#C084FC" strokeWidth="1.2" strokeDasharray="5 3" />
          <circle cx="20" cy="20" r="7" fill={`url(#${coreId})`} />
          <circle cx="20" cy="20" r="3" fill="#FFFFFF" />
          <path d="M20 3v5M20 32v5M3 20h5M32 20h5" stroke="#F5D0FE" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}

      {/* 13. Overclock Core */}
      {itemId === 'overclock_core' && (
        <g>
          <polygon points="20,4 33,12 33,28 20,36 7,28 7,12" fill={`url(#${steelId})`} stroke={accent} strokeWidth="1.5" />
          <polygon points="20,8 29,14 29,26 20,32 11,26 11,14" fill={color} fillOpacity="0.35" stroke="#FCA5A5" strokeWidth="1" />
          <path d="M21 11l-6 9h5l-2 9 7-10h-5z" fill="#FEF08A" stroke="#FFFFFF" strokeWidth="0.6" />
        </g>
      )}

      {/* 14. Nuclear Battery */}
      {itemId === 'nuclear_battery' && (
        <g>
          <rect x="14" y="5" width="12" height="4" rx="1.5" fill={`url(#${brassId})`} />
          <rect x="9" y="8.5" width="22" height="25" rx="3.5" fill={`url(#${steelId})`} stroke={accent} strokeWidth="1.4" />
          <rect x="13" y="13" width="14" height="16" rx="2" fill="#064E3B" stroke="#34D399" strokeWidth="1" />
          <circle cx="20" cy="21" r="5" fill={`url(#${coreId})`} />
          <path d="M16 16h8M16 26h8" stroke="#6EE7B7" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}

      {/* 15. Conductor Wire */}
      {itemId === 'conductor_wire' && (
        <g>
          <rect x="4" y="15" width="32" height="10" rx="5" fill="#082F49" stroke="#0EA5E9" strokeWidth="1" />
          <path d="M7 20h7l3.5-6.5 5 13L26 20h7" stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="7" cy="20" r="3" fill={`url(#${brassId})`} stroke="#E0F2FE" strokeWidth="1" />
          <circle cx="33" cy="20" r="3" fill={`url(#${brassId})`} stroke="#E0F2FE" strokeWidth="1" />
        </g>
      )}

      {/* 16. Gear Haste */}
      {itemId === 'gear_haste' && (
        <g>
          <circle cx="20" cy="20" r="11" fill={`url(#${brassId})`} stroke="#FEF3C7" strokeWidth="1.2" />
          <path d="M20 5v5M20 30v5M5 20h5M30 20h5M9.5 9.5l3.5 3.5M27 27l3.5 3.5M30.5 9.5L27 13M13 27l-3.5 3.5" stroke={accent} strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="20" cy="20" r="5.5" fill={`url(#${steelId})`} stroke="#FDE68A" strokeWidth="1.2" />
          <circle cx="20" cy="20" r="2.2" fill="#FEF08A" />
        </g>
      )}

      {/* 17. Plasma Crit */}
      {itemId === 'plasma_crit' && (
        <g>
          <circle cx="20" cy="20" r="13" fill="#1E1B4B" stroke={accent} strokeWidth="1.5" strokeDasharray="5 2.5" />
          <circle cx="20" cy="20" r="8" fill={`url(#${coreId})`} fillOpacity="0.6" stroke="#FFFFFF" strokeWidth="1" />
          <path d="M20 4v6M20 30v6M4 20h6M30 20h6" stroke="#F5D0FE" strokeWidth="2" strokeLinecap="round" />
          <circle cx="20" cy="20" r="2.5" fill="#FFFFFF" />
        </g>
      )}

      {/* 18. Laser Sight */}
      {itemId === 'laser_sight' && (
        <g>
          <rect x="6" y="13" width="20" height="14" rx="3" fill={`url(#${steelId})`} stroke={accent} strokeWidth="1.2" />
          <circle cx="16" cy="20" r="4.8" fill="#4C0519" stroke="#FB7185" strokeWidth="1.4" />
          <circle cx="16" cy="20" r="2" fill="#FDA4AF" />
          <path d="M26 20h11" stroke="#F43F5E" strokeWidth="2" strokeDasharray="3 1.5" strokeLinecap="round" />
          <circle cx="36" cy="20" r="2" fill="#FFFFFF" />
        </g>
      )}

      {/* 19. Extended Mag */}
      {itemId === 'extended_mag' && (
        <g>
          <path d="M12 7h13l3 24-11 3-5-27z" fill={`url(#${steelId})`} stroke={accent} strokeWidth="1.3" strokeLinejoin="round" />
          <rect x="14" y="10" width="9" height="3" rx="1" fill={`url(#${brassId})`} />
          <rect x="15" y="15.5" width="9" height="3" rx="1" fill={`url(#${brassId})`} />
          <rect x="16" y="21" width="9" height="3" rx="1" fill={`url(#${brassId})`} />
        </g>
      )}

      {/* 20. Vampire Module */}
      {itemId === 'vampire_module' && (
        <g>
          <path d="M20 5c6.5 8.5 10 13.5 10 18.5a10 10 0 0 1-20 0C10 18.5 13.5 13.5 20 5z" fill={`url(#${coreId})`} stroke="#FDA4AF" strokeWidth="1.5" />
          <circle cx="20" cy="23" r="4.5" fill="#4C0519" stroke="#FFE4E6" strokeWidth="1" />
          <path d="M20 20v6M17 23h6" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}

      {/* 21. Cryo Cell */}
      {itemId === 'cryo_cell' && (
        <g>
          <circle cx="20" cy="20" r="13" fill="#082F49" stroke="#7DD3FC" strokeWidth="1.2" />
          <path d="M20 6v28M8 13l24 14M32 13L8 27" stroke="#E0F2FE" strokeWidth="2" strokeLinecap="round" />
          <circle cx="20" cy="20" r="5.5" fill={`url(#${coreId})`} stroke="#FFFFFF" strokeWidth="1" />
        </g>
      )}

      {/* 22. Stun Capacitor */}
      {itemId === 'stun_capacitor' && (
        <g>
          <rect x="8" y="9" width="24" height="22" rx="4" fill={`url(#${steelId})`} stroke={accent} strokeWidth="1.4" />
          <rect x="11" y="12" width="18" height="16" rx="2.5" fill="#1E1B4B" stroke="#818CF8" strokeWidth="1" />
          <path d="M22 13l-6 7h4.5l-2.5 7 7-8h-4.5z" fill="#FDE047" stroke="#FFFFFF" strokeWidth="0.6" />
        </g>
      )}

      {/* 23 & 24. Armor Plate / Reactive Armor */}
      {(itemId === 'armor_plate' || itemId === 'reactive_armor') && (
        <g>
          <path
            d="M20 5l13 5v10c0 8-5.5 13-13 15.5C12.5 33 7 28 7 20V10z"
            fill={`url(#${steelId})`}
            stroke={itemId === 'reactive_armor' ? '#38BDF8' : accent}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M20 9.5l9 3.5v7c0 5.5-3.8 9-9 11-5.2-2-9-5.5-9-11V13z"
            fill={color}
            fillOpacity="0.32"
            stroke={itemId === 'reactive_armor' ? '#7DD3FC' : '#CBD5E1'}
            strokeWidth="1"
          />
          <path
            d="M20 12.5v15M13.5 18.5h13"
            stroke={itemId === 'reactive_armor' ? '#E0F2FE' : '#F8FAFC'}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* 25. Nano Repair */}
      {itemId === 'nano_repair' && (
        <g>
          <rect x="7" y="7" width="26" height="26" rx="5.5" fill={`url(#${steelId})`} stroke={accent} strokeWidth="1.5" />
          <rect x="11" y="11" width="18" height="18" rx="3.5" fill="#064E3B" stroke="#34D399" strokeWidth="1" />
          <path d="M20 14v12M14 20h12" stroke="#A7F3D0" strokeWidth="3.2" strokeLinecap="round" />
        </g>
      )}

      {/* 26. Reflector Shield */}
      {itemId === 'reflector_shield' && (
        <g>
          <polygon points="20,5 33,12 30,27 20,35 10,27 7,12" fill={`url(#${steelId})`} stroke={accent} strokeWidth="1.5" />
          <polygon points="20,10 28,15 26,24 20,30 14,24 12,15" fill={`url(#${coreId})`} fillOpacity="0.48" stroke="#E0F2FE" strokeWidth="1.2" />
          <circle cx="20" cy="20" r="3.2" fill="#FFFFFF" />
        </g>
      )}
    </svg>
  );
}
