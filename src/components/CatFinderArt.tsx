import type { CatCoverDef, CatStageDef, CatWorldTheme } from '../utils/catFinderEngine.ts';

const INK = '#43312B';

export function CatItemGraphic({
  artKey,
  monochrome = false,
}: {
  artKey: string;
  monochrome?: boolean;
}) {
  return (
    <g
      style={
        monochrome
          ? { filter: 'grayscale(1) contrast(0.75) opacity(0.55)' }
          : undefined
      }
    >
      {renderItemShape(artKey)}
    </g>
  );
}

export function CatThumbnailIcon({
  artKey,
  found,
}: {
  artKey: string;
  found: boolean;
}) {
  return (
    <svg
      viewBox="-44 -44 88 88"
      className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <CatItemGraphic artKey={artKey} monochrome={!found} />
    </svg>
  );
}

function renderItemShape(artKey: string) {
  switch (artKey) {
    case 'croissant':
      return (
        <g>
          <path
            d="M-26,6 Q-18,-18 0,-18 Q18,-18 26,6 Q14,16 0,14 Q-14,16 -26,6 Z"
            fill="#F4B86A"
            stroke={INK}
            strokeWidth="2"
          />
          <path d="M-12,-14 L-8,12 M0,-17 L0,14 M12,-14 L8,12" stroke={INK} strokeWidth="1.6" fill="none" />
          <path d="M-16,-6 Q-4,-12 10,-6" stroke="#FFE3AF" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </g>
      );

    case 'tabby_flour_cat':
      return (
        <g>
          {/* Flour sack */}
          <rect x="-28" y="-4" width="56" height="36" rx="12" fill="#FFF7EB" stroke={INK} strokeWidth="2" />
          <path d="M-12,-4 Q0,-12 12,-4" fill="#F2DEC4" stroke={INK} strokeWidth="1.8" />
          {/* Sleeping tabby cat */}
          <path
            d="M16,-10 Q32,-16 30,-28"
            stroke="#DF9456"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            className="animate-cozy-tail"
          />
          <ellipse cx="0" cy="-14" rx="22" ry="14" fill="#F2A96B" stroke={INK} strokeWidth="2" />
          <circle cx="-12" cy="-18" r="12" fill="#F2A96B" stroke={INK} strokeWidth="2" />
          <polygon points="-22,-25 -18,-36 -10,-28" fill="#F2A96B" stroke={INK} strokeWidth="1.8" />
          <polygon points="-10,-28 -4,-36 -1,-25" fill="#F2A96B" stroke={INK} strokeWidth="1.8" />
          <path d="M-17,-18 Q-14,-16 -12,-18 M-9,-18 Q-6,-16 -4,-18" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M2,-20 L5,-12 M8,-20 L11,-12" stroke="#B86B38" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      );

    case 'latte_cup':
      return (
        <g>
          <path d="M-2, -26 Q4,-34 -2,-40 M8,-24 Q14,-32 8,-38" stroke="#FFFFFF" strokeWidth="2.2" fill="none" strokeLinecap="round" className="animate-cozy-steam" />
          <ellipse cx="0" cy="18" rx="26" ry="7" fill="#FFFDF9" stroke={INK} strokeWidth="2" />
          <path d="M-20,-10 L20,-10 L16,14 Q0,20 -16,14 Z" fill="#F9DDE2" stroke={INK} strokeWidth="2" />
          <path d="M20,-5 Q30,-5 29,4 Q28,11 18,10" fill="none" stroke={INK} strokeWidth="2.2" />
          <ellipse cx="0" cy="-10" rx="20" ry="6" fill="#C98D5B" stroke={INK} strokeWidth="1.8" />
          <path d="M0,-6 C-6,-12 -11,-6 0,-2 C11,-6 6,-12 0,-6 Z" fill="#FFF8EE" />
        </g>
      );

    case 'chef_hat':
      return (
        <g>
          <path
            d="M-20,-4 C-28,-16 -18,-30 -6,-26 C0,-34 14,-32 16,-24 C28,-24 28,-8 20,-4 Z"
            fill="#FFFFFF"
            stroke={INK}
            strokeWidth="2"
          />
          <rect x="-18" y="-4" width="36" height="18" rx="4" fill="#FFFDF8" stroke={INK} strokeWidth="2" />
          <path d="M-8,-14 L-8,-4 M0,-17 L0,-4 M8,-14 L8,-4" stroke="#E2D5C8" strokeWidth="1.8" />
        </g>
      );

    case 'strawberry':
      return (
        <g>
          <path d="M0,-18 C16,-18 20,2 0,24 C-20,2 -16,-18 0,-18 Z" fill="#F27285" stroke={INK} strokeWidth="2" />
          <path d="M-10,-16 L0,-24 L10,-16 L4,-12 L0,-18 L-4,-12 Z" fill="#77B97E" stroke={INK} strokeWidth="1.6" />
          <circle cx="-6" cy="-4" r="1.6" fill="#FFE6B3" />
          <circle cx="5" cy="-2" r="1.6" fill="#FFE6B3" />
          <circle cx="0" cy="7" r="1.6" fill="#FFE6B3" />
          <circle cx="-5" cy="11" r="1.5" fill="#FFE6B3" />
          <circle cx="6" cy="10" r="1.5" fill="#FFE6B3" />
        </g>
      );

    case 'vintage_scale':
      return (
        <g>
          <path d="M-22,22 L22,22 L16,-2 L-16,-2 Z" fill="#92C5BA" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="10" r="9" fill="#FFF9EE" stroke={INK} strokeWidth="1.8" />
          <line x1="0" y1="10" x2="4" y2="4" stroke="#D96B52" strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1="-2" x2="0" y2="-14" stroke={INK} strokeWidth="2.4" />
          <path d="M-24,-14 Q0,-4 24,-14 Z" fill="#E8B974" stroke={INK} strokeWidth="2" />
        </g>
      );

    case 'rolling_pin':
      return (
        <g>
          <rect x="-32" y="-5" width="64" height="10" rx="5" fill="#CE9362" stroke={INK} strokeWidth="1.8" />
          <rect x="-20" y="-9" width="40" height="18" rx="4" fill="#F3C48D" stroke={INK} strokeWidth="2" />
          <path d="M-12,-4 L10,-4" stroke="#FFF1DB" strokeWidth="2" strokeLinecap="round" />
        </g>
      );

    case 'pink_macaron':
      return (
        <g>
          <path d="M-22,-4 Q-22,-18 0,-18 Q22,-18 22,-4 Z" fill="#F7A1B5" stroke={INK} strokeWidth="2" />
          <rect x="-21" y="-4" width="42" height="8" rx="4" fill="#FFF6EA" stroke={INK} strokeWidth="1.8" />
          <path d="M-22,4 L22,4 Q20,16 0,16 Q-20,16 -22,4 Z" fill="#F7A1B5" stroke={INK} strokeWidth="2" />
          <path d="M-10,-12 Q0,-15 8,-11" stroke="#FFD6E0" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
      );

    case 'basil_pot':
      return (
        <g>
          <g className="animate-cozy-sway">
            <ellipse cx="-10" cy="-14" rx="10" ry="7" transform="rotate(-24 -10 -14)" fill="#7DC383" stroke={INK} strokeWidth="1.8" />
            <ellipse cx="10" cy="-16" rx="10" ry="7" transform="rotate(24 10 -16)" fill="#96D698" stroke={INK} strokeWidth="1.8" />
            <ellipse cx="0" cy="-22" rx="8" ry="11" fill="#6BB673" stroke={INK} strokeWidth="1.8" />
          </g>
          <path d="M-16,-4 L16,-4 L12,24 L-12,24 Z" fill="#E39774" stroke={INK} strokeWidth="2" />
          <rect x="-18" y="-8" width="36" height="7" rx="3" fill="#ECAC8C" stroke={INK} strokeWidth="1.8" />
        </g>
      );

    case 'orange_jam':
      return (
        <g>
          <rect x="-16" y="-12" width="32" height="34" rx="8" fill="#F9B052" stroke={INK} strokeWidth="2" />
          <rect x="-18" y="-20" width="36" height="9" rx="3" fill="#F4796B" stroke={INK} strokeWidth="1.8" />
          <rect x="-10" y="-2" width="20" height="14" rx="3" fill="#FFF9EE" stroke={INK} strokeWidth="1.5" />
          <circle cx="0" cy="5" r="4" fill="#F2852C" />
        </g>
      );

    case 'golden_secret_cat':
      return (
        <g>
          <circle cx="0" cy="0" r="27" fill="#FDE68A" fillOpacity="0.32" />
          <path
            d="M14,12 Q29,6 26,-10"
            stroke="#F4B73F"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            className="animate-cozy-tail"
          />
          <ellipse cx="0" cy="12" rx="16" ry="14" fill="#FCD34D" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="-8" r="14" fill="#FCD34D" stroke={INK} strokeWidth="2" />
          <polygon points="-13,-16 -10,-28 -2,-20" fill="#FCD34D" stroke={INK} strokeWidth="1.8" />
          <polygon points="2,-20 10,-28 13,-16" fill="#FCD34D" stroke={INK} strokeWidth="1.8" />
          <circle cx="-5" cy="-9" r="1.8" fill={INK} />
          <circle cx="5" cy="-9" r="1.8" fill={INK} />
          <path d="M-10,2 L10,2" stroke="#F472B6" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="0" cy="5" r="4" fill="#FEF08A" stroke={INK} strokeWidth="1.4" />
        </g>
      );

    case 'sunflower_bouquet':
      return (
        <g>
          <path d="M-12,4 L12,4 L7,28 L-7,28 Z" fill="#F2C89B" stroke={INK} strokeWidth="2" />
          <g className="animate-cozy-sway">
            <circle cx="-10" cy="-12" r="13" fill="#FBC94A" stroke={INK} strokeWidth="1.8" />
            <circle cx="-10" cy="-12" r="6" fill="#7D5338" />
            <circle cx="11" cy="-15" r="12" fill="#FDD763" stroke={INK} strokeWidth="1.8" />
            <circle cx="11" cy="-15" r="5.5" fill="#7D5338" />
            <circle cx="1" cy="-24" r="11" fill="#FBC94A" stroke={INK} strokeWidth="1.8" />
            <circle cx="1" cy="-24" r="5" fill="#7D5338" />
          </g>
        </g>
      );

    case 'watering_can':
      return (
        <g>
          <path d="M-16,-10 C-26,-16 -26,10 -14,10" fill="none" stroke={INK} strokeWidth="3" />
          <path d="M12,4 L30,-12 L34,-8 L16,12 Z" fill="#8CD0B7" stroke={INK} strokeWidth="1.8" />
          <rect x="-16" y="-8" width="30" height="28" rx="6" fill="#8CD0B7" stroke={INK} strokeWidth="2" />
          <ellipse cx="33" cy="-11" rx="4" ry="6" transform="rotate(-35 33 -11)" fill="#BCE6D4" stroke={INK} strokeWidth="1.6" />
        </g>
      );

    case 'calico_bush_cat':
      return (
        <g>
          <path
            d="M15,10 Q28,0 24,-12"
            stroke="#E59866"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
            className="animate-cozy-tail"
          />
          <ellipse cx="0" cy="10" rx="18" ry="15" fill="#FFFDF7" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="-9" r="14" fill="#FFFDF7" stroke={INK} strokeWidth="2" />
          <path d="M-12,-14 A12,12 0 0,1 -2,-21 L-4,-8 Z" fill="#EA9B65" />
          <path d="M3,-21 A12,12 0 0,1 13,-12 L6,-6 Z" fill="#635147" />
          <polygon points="-13,-16 -9,-28 -2,-20" fill="#EA9B65" stroke={INK} strokeWidth="1.8" />
          <polygon points="2,-20 9,-28 13,-16" fill="#635147" stroke={INK} strokeWidth="1.8" />
          <circle cx="-5" cy="-9" r="1.8" fill={INK} />
          <circle cx="5" cy="-9" r="1.8" fill={INK} />
          <path d="M-2,-5 Q0,-3 2,-5" stroke={INK} strokeWidth="1.5" fill="none" />
        </g>
      );

    case 'flower_bicycle':
      return (
        <g>
          <circle cx="-24" cy="14" r="14" fill="none" stroke={INK} strokeWidth="2.4" />
          <circle cx="24" cy="14" r="14" fill="none" stroke={INK} strokeWidth="2.4" />
          <path d="M-24,14 L-4,14 L12,-4 L-12,-4 Z M12,-4 L24,14 M-12,-4 L-14,-14" stroke="#E08B94" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="14" y="-14" width="16" height="12" rx="3" fill="#E3B382" stroke={INK} strokeWidth="1.8" />
          <circle cx="19" cy="-16" r="4" fill="#F48FB1" />
          <circle cx="25" cy="-16" r="4" fill="#FDD835" />
        </g>
      );

    case 'straw_hat':
      return (
        <g>
          <ellipse cx="0" cy="8" rx="30" ry="10" fill="#F6D992" stroke={INK} strokeWidth="2" />
          <path d="M-16,6 L-12,-12 Q0,-18 12,-12 L16,6 Z" fill="#FBE5AC" stroke={INK} strokeWidth="2" />
          <path d="M-15,0 Q0,4 15,0" stroke="#F08A9B" strokeWidth="4" fill="none" />
        </g>
      );

    case 'garden_shears':
      return (
        <g>
          <path d="M-4,-2 L-16,-22 L-4,-18 Z" fill="#CFD8DC" stroke={INK} strokeWidth="1.8" />
          <path d="M4,-2 L16,-22 L4,-18 Z" fill="#CFD8DC" stroke={INK} strokeWidth="1.8" />
          <circle cx="-9" cy="14" r="9" fill="none" stroke="#85BE93" strokeWidth="4" />
          <circle cx="9" cy="14" r="9" fill="none" stroke="#85BE93" strokeWidth="4" />
          <circle cx="0" cy="-2" r="3" fill={INK} />
        </g>
      );

    case 'cactus_pot':
      return (
        <g>
          <path d="M-6,4 L-6,-22 Q0,-28 6,-22 L6,4" fill="#82C78E" stroke={INK} strokeWidth="2" />
          <path d="M-6,-8 L-15,-8 Q-18,-8 -18,-16" fill="none" stroke="#82C78E" strokeWidth="7" strokeLinecap="round" />
          <circle cx="0" cy="-25" r="4" fill="#F78CA2" />
          <path d="M-14,4 L14,4 L10,24 L-10,24 Z" fill="#EA9B74" stroke={INK} strokeWidth="2" />
        </g>
      );

    case 'glass_windchime':
      return (
        <g className="animate-cozy-sway">
          <path d="M-16,-6 C-16,-24 16,-24 16,-6 Z" fill="#BDE6F1" fillOpacity="0.85" stroke={INK} strokeWidth="2" />
          <line x1="0" y1="-6" x2="0" y2="14" stroke={INK} strokeWidth="1.6" />
          <rect x="-6" y="14" width="12" height="18" rx="2" fill="#F9B4C4" stroke={INK} strokeWidth="1.6" />
        </g>
      );

    case 'seed_packet':
      return (
        <g>
          <rect x="-17" y="-22" width="34" height="44" rx="4" fill="#FFFDF6" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="-3" r="9" fill="#FDD85D" stroke={INK} strokeWidth="1.6" />
          <path d="M-10,13 L10,13" stroke="#88BC92" strokeWidth="3" strokeLinecap="round" />
        </g>
      );

    case 'daisy_vase':
      return (
        <g>
          <path d="M-12,0 L12,0 L15,24 L-15,24 Z" fill="#CBE7EC" stroke={INK} strokeWidth="2" />
          <g className="animate-cozy-sway">
            <line x1="-6" y1="0" x2="-10" y2="-18" stroke="#70AD7C" strokeWidth="2.4" />
            <line x1="6" y1="0" x2="10" y2="-16" stroke="#70AD7C" strokeWidth="2.4" />
            <circle cx="-10" cy="-20" r="8" fill="#FFFFFF" stroke={INK} strokeWidth="1.6" />
            <circle cx="-10" cy="-20" r="3.5" fill="#FBBF24" />
            <circle cx="10" cy="-18" r="7.5" fill="#FFFFFF" stroke={INK} strokeWidth="1.6" />
            <circle cx="10" cy="-18" r="3.2" fill="#FBBF24" />
          </g>
        </g>
      );

    case 'sleeping_corgi':
      return (
        <g>
          <ellipse cx="0" cy="8" rx="26" ry="15" fill="#EDA260" stroke={INK} strokeWidth="2" />
          <ellipse cx="-6" cy="14" rx="14" ry="8" fill="#FFFDF8" />
          <circle cx="-18" cy="-4" r="13" fill="#EDA260" stroke={INK} strokeWidth="2" />
          <ellipse cx="-18" cy="1" rx="7" ry="6" fill="#FFFDF8" />
          <polygon points="-28,-11 -25,-26 -17,-16" fill="#EDA260" stroke={INK} strokeWidth="1.8" />
          <polygon points="-16,-16 -9,-26 -6,-11" fill="#EDA260" stroke={INK} strokeWidth="1.8" />
          <path d="M-23,-4 Q-20,-2 -18,-4 M-15,-4 Q-12,-2 -10,-4" stroke={INK} strokeWidth="1.6" fill="none" />
          <circle cx="24" cy="2" r="5" fill="#FFFDF8" stroke={INK} strokeWidth="1.6" />
        </g>
      );

    case 'pink_yarn':
      return (
        <g>
          <circle cx="0" cy="0" r="19" fill="#F5A6B8" stroke={INK} strokeWidth="2" />
          <path d="M-14,-8 Q0,4 16,-4 M-16,4 Q2,12 14,-10 M-8,-16 Q4,2 -10,16" stroke={INK} strokeWidth="1.6" fill="none" />
          <path d="M16,12 Q28,18 32,8" stroke="#F5A6B8" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        </g>
      );

    case 'boba_tea':
      return (
        <g>
          <line x1="5" y1="-34" x2="1" y2="-16" stroke="#F2849E" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M-16,-16 L16,-16 L12,24 L-12,24 Z" fill="#F5DFC6" stroke={INK} strokeWidth="2" />
          <ellipse cx="0" cy="-16" rx="16" ry="5" fill="#FFFDF9" stroke={INK} strokeWidth="1.8" />
          <circle cx="-6" cy="16" r="3" fill={INK} />
          <circle cx="2" cy="18" r="3" fill={INK} />
          <circle cx="8" cy="14" r="3" fill={INK} />
          <circle cx="-1" cy="11" r="2.8" fill={INK} />
        </g>
      );

    case 'bread_pillow':
      return (
        <g>
          <path d="M-24,18 L-24,-4 C-24,-22 24,-22 24,-4 L24,18 Z" fill="#F3C388" stroke={INK} strokeWidth="2" />
          <rect x="-18" y="-4" width="36" height="18" rx="6" fill="#FFF4DE" />
          <circle cx="-6" cy="4" r="1.8" fill={INK} />
          <circle cx="6" cy="4" r="1.8" fill={INK} />
          <path d="M-3,8 Q0,11 3,8" stroke={INK} strokeWidth="1.6" fill="none" />
        </g>
      );

    case 'wood_doorbell':
      return (
        <g className="animate-cozy-sway">
          <path d="M-14,-20 L14,-20 L16,4 L-16,4 Z" fill="#CE9A6E" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="12" r="9" fill="#F6CA65" stroke={INK} strokeWidth="2" />
          <line x1="-4" y1="14" x2="4" y2="14" stroke={INK} strokeWidth="1.8" />
        </g>
      );

    case 'bone_cookie':
      return (
        <g>
          <path
            d="M-18,-6 C-26,-12 -28,0 -20,2 C-28,6 -22,16 -14,8 L14,8 C22,16 28,6 20,2 C28,0 26,-12 18,-6 Z"
            fill="#F4D39D"
            stroke={INK}
            strokeWidth="2"
          />
        </g>
      );

    case 'siamese_cat':
      return (
        <g>
          <path
            d="M14,16 Q28,10 26,-4"
            stroke="#7E675C"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
            className="animate-cozy-tail"
          />
          <ellipse cx="0" cy="12" rx="16" ry="16" fill="#F6ECD9" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="-9" r="13" fill="#F6ECD9" stroke={INK} strokeWidth="2" />
          <ellipse cx="0" cy="-8" rx="8" ry="6" fill="#7E675C" />
          <polygon points="-12,-17 -9,-29 -2,-21" fill="#7E675C" stroke={INK} strokeWidth="1.8" />
          <polygon points="2,-21 9,-29 12,-17" fill="#7E675C" stroke={INK} strokeWidth="1.8" />
          <circle cx="-4" cy="-9" r="1.8" fill="#7AD4F5" />
          <circle cx="4" cy="-9" r="1.8" fill="#7AD4F5" />
        </g>
      );

    case 'vinyl_record':
      return (
        <g>
          <circle cx="0" cy="0" r="24" fill="#463E4A" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="0" r="16" fill="none" stroke="#6B6072" strokeWidth="1.4" />
          <circle cx="0" cy="0" r="9" fill="#F6A2AF" stroke={INK} strokeWidth="1.6" />
          <circle cx="0" cy="0" r="2.5" fill="#FFF9F2" />
        </g>
      );

    case 'cat_ear_mug':
      return (
        <g>
          <polygon points="-16,-12 -12,-24 -4,-14" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
          <polygon points="4,-14 12,-24 16,-12" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
          <rect x="-17" y="-14" width="34" height="32" rx="10" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
          <path d="M17,-6 Q26,-6 26,4 Q26,12 17,12" fill="none" stroke={INK} strokeWidth="2.2" />
          <circle cx="-5" cy="1" r="1.8" fill={INK} />
          <circle cx="5" cy="1" r="1.8" fill={INK} />
          <path d="M-2,6 Q0,8 2,6" stroke={INK} strokeWidth="1.6" fill="none" />
        </g>
      );

    case 'polka_bowtie':
      return (
        <g>
          <polygon points="-24,-12 0,0 -24,12" fill="#E87D8F" stroke={INK} strokeWidth="2" />
          <polygon points="24,-12 0,0 24,12" fill="#E87D8F" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="0" r="5" fill="#F7A7B5" stroke={INK} strokeWidth="1.8" />
          <circle cx="-15" cy="-3" r="2" fill="#FFF7F8" />
          <circle cx="-14" cy="5" r="2" fill="#FFF7F8" />
          <circle cx="15" cy="-3" r="2" fill="#FFF7F8" />
          <circle cx="14" cy="5" r="2" fill="#FFF7F8" />
        </g>
      );

    case 'catnip_fish':
      return (
        <g>
          <path d="M-24,0 Q-6,-16 16,-6 L28,-14 L24,0 L28,14 L16,6 Q-6,16 -24,0 Z" fill="#92CFCA" stroke={INK} strokeWidth="2" />
          <circle cx="-12" cy="-3" r="2" fill={INK} />
          <path d="M0,-8 L0,8 M7,-7 L7,7" stroke="#E0F7F4" strokeWidth="2" />
        </g>
      );

    case 'carp_lantern':
      return (
        <g className="animate-cozy-sway">
          <ellipse cx="0" cy="0" rx="18" ry="26" fill="#F58D7E" stroke={INK} strokeWidth="2" />
          <ellipse cx="0" cy="-2" rx="16" ry="8" fill="#FBE6C2" fillOpacity="0.65" />
          <circle cx="-6" cy="-12" r="3" fill="#FFFDF9" stroke={INK} strokeWidth="1.4" />
          <path d="M-8,26 L0,34 L8,26" fill="#F58D7E" stroke={INK} strokeWidth="1.8" />
        </g>
      );

    case 'fishball_skewer':
      return (
        <g>
          <line x1="0" y1="-26" x2="0" y2="30" stroke="#D9A875" strokeWidth="3" strokeLinecap="round" />
          <circle cx="0" cy="-14" r="9" fill="#FCE5B0" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="0" r="9" fill="#F5C17D" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="14" r="9" fill="#FCE5B0" stroke={INK} strokeWidth="2" />
        </g>
      );

    case 'sakura_fan':
      return (
        <g>
          <path d="M-26,6 A28,28 0 0,1 26,6 L0,20 Z" fill="#FAD2DE" stroke={INK} strokeWidth="2" />
          <line x1="0" y1="20" x2="-14" y2="-10" stroke={INK} strokeWidth="1.4" />
          <line x1="0" y1="20" x2="0" y2="-16" stroke={INK} strokeWidth="1.4" />
          <line x1="0" y1="20" x2="14" y2="-10" stroke={INK} strokeWidth="1.4" />
          <circle cx="6" cy="-4" r="4" fill="#F388A4" />
        </g>
      );

    case 'mini_claw_machine':
      return (
        <g>
          <rect x="-22" y="-32" width="44" height="64" rx="8" fill="#F9B8C6" stroke={INK} strokeWidth="2" />
          <rect x="-16" y="-22" width="32" height="28" rx="4" fill="#E8F6FA" stroke={INK} strokeWidth="1.8" />
          <path d="M0,-22 L0,-10 M-5,-6 L0,-10 L5,-6" stroke={INK} strokeWidth="1.8" fill="none" />
          <circle cx="-6" cy="0" r="5" fill="#FCD34D" />
          <circle cx="7" cy="1" r="5" fill="#F48FB1" />
          <rect x="-12" y="14" width="14" height="10" rx="2" fill="#FFF7EB" stroke={INK} strokeWidth="1.6" />
          <circle cx="11" cy="18" r="4" fill="#E56B7F" />
        </g>
      );

    case 'windup_musicbox':
      return (
        <g>
          <rect x="-20" y="-10" width="40" height="28" rx="5" fill="#D49A74" stroke={INK} strokeWidth="2" />
          <path d="M-20,-10 L0,-24 L20,-10" fill="#E7B892" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="4" r="7" fill="#FFE6A7" stroke={INK} strokeWidth="1.6" />
          <path d="M20,4 L28,4 M28,-2 L28,10" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );

    case 'white_ribbon_cat':
      return (
        <g>
          <path
            d="M14,14 Q26,8 24,-6"
            stroke="#E5E0EA"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
            className="animate-cozy-tail"
          />
          <ellipse cx="0" cy="12" rx="16" ry="15" fill="#FFFDF9" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="-8" r="13" fill="#FFFDF9" stroke={INK} strokeWidth="2" />
          <polygon points="-12,-16 -9,-28 -2,-20" fill="#FFFDF9" stroke={INK} strokeWidth="1.8" />
          <polygon points="2,-20 9,-28 12,-16" fill="#FFFDF9" stroke={INK} strokeWidth="1.8" />
          <polygon points="-8,2 0,6 -8,10" fill="#F472B6" />
          <polygon points="8,2 0,6 8,10" fill="#F472B6" />
          <circle cx="-4" cy="-8" r="1.8" fill={INK} />
          <circle cx="4" cy="-8" r="1.8" fill={INK} />
        </g>
      );

    case 'egg_waffle':
      return (
        <g>
          <path d="M-20,-8 L20,-8 L12,24 L-12,24 Z" fill="#F7CE86" stroke={INK} strokeWidth="2" />
          <circle cx="-10" cy="-6" r="5" fill="#F2BA63" stroke={INK} strokeWidth="1.5" />
          <circle cx="0" cy="-8" r="5" fill="#F2BA63" stroke={INK} strokeWidth="1.5" />
          <circle cx="10" cy="-6" r="5" fill="#F2BA63" stroke={INK} strokeWidth="1.5" />
          <circle cx="-5" cy="4" r="5" fill="#F2BA63" stroke={INK} strokeWidth="1.5" />
          <circle cx="6" cy="4" r="5" fill="#F2BA63" stroke={INK} strokeWidth="1.5" />
        </g>
      );

    case 'bell_bracelet':
      return (
        <g>
          <circle cx="0" cy="0" r="17" fill="none" stroke="#F08A9B" strokeWidth="4" />
          <circle cx="0" cy="18" r="5" fill="#FDE047" stroke={INK} strokeWidth="1.6" />
          <circle cx="-14" cy="10" r="4.5" fill="#FDE047" stroke={INK} strokeWidth="1.5" />
          <circle cx="14" cy="10" r="4.5" fill="#FDE047" stroke={INK} strokeWidth="1.5" />
        </g>
      );

    case 'festival_cat_mask':
      return (
        <g>
          <circle cx="0" cy="2" r="18" fill="#FFFDF8" stroke={INK} strokeWidth="2" />
          <polygon points="-16,-8 -14,-24 -4,-15" fill="#FFFDF8" stroke={INK} strokeWidth="1.8" />
          <polygon points="4,-15 14,-24 16,-8" fill="#FFFDF8" stroke={INK} strokeWidth="1.8" />
          <path d="M-10,0 Q-6,-4 -2,0 M2,0 Q6,-4 10,0" stroke={INK} strokeWidth="2.2" fill="none" />
          <path d="M-14,7 L-7,5 M14,7 L7,5" stroke="#EC6E7C" strokeWidth="2" strokeLinecap="round" />
        </g>
      );

    case 'strawberry_shaved_ice':
      return (
        <g>
          <path d="M-18,0 C-16,-24 16,-24 18,0 Z" fill="#F99FB4" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="-22" r="5" fill="#E85A71" stroke={INK} strokeWidth="1.6" />
          <path d="M-16,0 L16,0 L11,22 L-11,22 Z" fill="#BCE3EC" stroke={INK} strokeWidth="2" />
        </g>
      );

    case 'star_garland':
      return (
        <g>
          <path d="M-34,-8 Q0,8 34,-8" stroke={INK} strokeWidth="2" fill="none" />
          <polygon points="-22,-2 -14,-2 -18,12" fill="#FBC95D" stroke={INK} strokeWidth="1.6" />
          <polygon points="-4,2 4,2 0,16" fill="#F596AB" stroke={INK} strokeWidth="1.6" />
          <polygon points="14,-2 22,-2 18,12" fill="#92D5CB" stroke={INK} strokeWidth="1.6" />
        </g>
      );

    case 'rose_firework':
      return (
        <g className="animate-cozy-float">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="0"
              y1="0"
              x2="0"
              y2="-24"
              transform={`rotate(${deg})`}
              stroke={deg % 90 === 0 ? '#FDA4AF' : '#FDE68A'}
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
          <circle cx="0" cy="0" r="6" fill="#FFF1F2" />
        </g>
      );

    case 'moon_uchiwa':
      return (
        <g>
          <circle cx="0" cy="-6" r="20" fill="#B6BCE8" stroke={INK} strokeWidth="2" />
          <circle cx="4" cy="-9" r="8" fill="#FDE68A" />
          <rect x="-3" y="14" width="6" height="18" rx="3" fill="#D4A373" stroke={INK} strokeWidth="1.6" />
        </g>
      );

    case 'tricolor_dango':
      return (
        <g>
          <line x1="0" y1="-22" x2="0" y2="30" stroke="#D9A875" strokeWidth="3" strokeLinecap="round" />
          <circle cx="0" cy="-14" r="9" fill="#F8B4C6" stroke={INK} strokeWidth="1.8" />
          <circle cx="0" cy="0" r="9" fill="#FFFDF8" stroke={INK} strokeWidth="1.8" />
          <circle cx="0" cy="14" r="9" fill="#9AD09E" stroke={INK} strokeWidth="1.8" />
        </g>
      );

    case 'stargaze_cat':
      return (
        <g>
          <path
            d="M14,14 Q28,8 26,-6"
            stroke="#D99862"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
            className="animate-cozy-tail"
          />
          <ellipse cx="0" cy="12" rx="17" ry="15" fill="#E8AD78" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="-8" r="13" fill="#E8AD78" stroke={INK} strokeWidth="2" />
          <polygon points="-12,-16 -9,-28 -2,-20" fill="#E8AD78" stroke={INK} strokeWidth="1.8" />
          <polygon points="2,-20 9,-28 12,-16" fill="#E8AD78" stroke={INK} strokeWidth="1.8" />
          <circle cx="-4" cy="-9" r="2" fill="#FEF08A" />
          <circle cx="4" cy="-9" r="2" fill="#FEF08A" />
        </g>
      );

    case 'sky_lantern':
      return (
        <g className="animate-cozy-float">
          <path d="M-16,-22 L16,-22 L20,4 L12,20 L-12,20 L-20,4 Z" fill="#FBBF77" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="12" r="5" fill="#FFFBEB" />
        </g>
      );

    case 'cotton_candy':
      return (
        <g>
          <line x1="0" y1="8" x2="0" y2="30" stroke="#E5D5C5" strokeWidth="3.5" strokeLinecap="round" />
          <path
            d="M-18,6 C-24,-6 -14,-18 -2,-16 C4,-24 18,-18 18,-6 C24,4 14,14 0,12 C-12,14 -18,12 -18,6 Z"
            fill="#F9C5D5"
            stroke={INK}
            strokeWidth="2"
          />
        </g>
      );

    case 'mini_taiko':
      return (
        <g>
          <ellipse cx="0" cy="4" rx="22" ry="18" fill="#E07A5F" stroke={INK} strokeWidth="2" />
          <ellipse cx="0" cy="-4" rx="18" ry="12" fill="#FFF3D9" stroke={INK} strokeWidth="2" />
          <line x1="-18" y1="22" x2="-8" y2="12" stroke="#8C5A3C" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="18" y1="22" x2="8" y2="12" stroke="#8C5A3C" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      );

    case 'goldfish_scoop':
      return (
        <g>
          <circle cx="-4" cy="-2" r="17" fill="#A6DCE8" fillOpacity="0.65" stroke={INK} strokeWidth="2" />
          <rect x="12" y="-3" width="16" height="5" rx="2" fill="#F294A5" stroke={INK} strokeWidth="1.6" />
          <ellipse cx="-6" cy="-2" rx="7" ry="4" fill="#FB923C" />
          <polygon points="1,-2 6,-6 6,2" fill="#FB923C" />
        </g>
      );

    case 'white_fox_mask':
      return (
        <g>
          <path d="M-18,-6 L0,22 L18,-6 L12,-22 L4,-12 L-4,-12 L-12,-22 Z" fill="#FFFDF8" stroke={INK} strokeWidth="2" />
          <path d="M-10,-2 L-4,-4 M4,-4 L10,-2" stroke="#E76F51" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="0" cy="10" r="2.2" fill={INK} />
        </g>
      );

    case 'paper_pinwheel':
      return (
        <g>
          <line x1="0" y1="0" x2="0" y2="28" stroke="#D4A373" strokeWidth="3.5" strokeLinecap="round" />
          <g className="animate-cozy-sway">
            <polygon points="0,0 -18,-10 -6,-20" fill="#F99FB4" stroke={INK} strokeWidth="1.6" />
            <polygon points="0,0 10,-18 20,-6" fill="#FDE68A" stroke={INK} strokeWidth="1.6" />
            <polygon points="0,0 18,10 6,20" fill="#A7F3D0" stroke={INK} strokeWidth="1.6" />
            <polygon points="0,0 -10,18 -20,6" fill="#BAE6FD" stroke={INK} strokeWidth="1.6" />
            <circle cx="0" cy="0" r="3.5" fill="#FFF" stroke={INK} strokeWidth="1.5" />
          </g>
        </g>
      );

    case 'ramune_soda':
      return (
        <g>
          <path d="M-9,-28 L9,-28 L9,-14 L14,-4 L14,24 L-14,24 L-14,-4 L-9,-14 Z" fill="#BAE6FD" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="-12" r="4" fill="#EFF6FF" stroke={INK} strokeWidth="1.5" />
          <rect x="-12" y="2" width="24" height="12" rx="2" fill="#FFF9EE" stroke={INK} strokeWidth="1.4" />
        </g>
      );

    case 'festival_gold_bell':
    default:
      return (
        <g className="animate-cozy-sway">
          <path d="M-18,12 C-18,-16 18,-16 18,12 L22,18 L-22,18 Z" fill="#FCD34D" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="21" r="4.5" fill="#F59E0B" stroke={INK} strokeWidth="1.6" />
          <path d="M-8,-14 L8,-14" stroke="#F472B6" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
  }
}

export function renderCatCoverProp(cover: CatCoverDef, isOpen: boolean) {
  switch (cover.kind) {
    case 'tin_lid':
    case 'stall_box':
      return (
        <g>
          <rect
            x="2"
            y="8"
            width={cover.w - 4}
            height={cover.h - 10}
            rx="12"
            fill="#F4B7C2"
            stroke={INK}
            strokeWidth="2.2"
          />
          <rect
            x="10"
            y="16"
            width={cover.w - 20}
            height={cover.h - 26}
            rx="8"
            fill="#FAD2DA"
            stroke={INK}
            strokeWidth="1.4"
            strokeDasharray="4 4"
          />
          {!isOpen && (
            <circle cx={cover.w / 2} cy={cover.h / 2} r="9" fill="#FFF7EB" stroke={INK} strokeWidth="1.8" />
          )}
        </g>
      );

    case 'curtain':
    case 'noren':
    case 'festival_curtain':
      return (
        <g>
          <rect
            x="0"
            y="0"
            width={cover.w}
            height={cover.h}
            rx="8"
            fill={
              cover.kind === 'festival_curtain'
                ? '#E97C7C'
                : cover.kind === 'noren'
                ? '#98A8D8'
                : '#F9D6CE'
            }
            stroke={INK}
            strokeWidth="2.2"
          />
          <line x1={cover.w * 0.33} y1="6" x2={cover.w * 0.33} y2={cover.h - 6} stroke={INK} strokeWidth="1.5" strokeOpacity="0.45" />
          <line x1={cover.w * 0.66} y1="6" x2={cover.w * 0.66} y2={cover.h - 6} stroke={INK} strokeWidth="1.5" strokeOpacity="0.45" />
        </g>
      );

    case 'bush':
      return (
        <g>
          <ellipse cx={cover.w * 0.3} cy={cover.h * 0.56} rx="42" ry="34" fill="#92C99A" stroke={INK} strokeWidth="2.2" />
          <ellipse cx={cover.w * 0.68} cy={cover.h * 0.54} rx="44" ry="36" fill="#82BC8B" stroke={INK} strokeWidth="2.2" />
          <ellipse cx={cover.w * 0.5} cy={cover.h * 0.4} rx="48" ry="34" fill="#9CD4A3" stroke={INK} strokeWidth="2.2" />
          <circle cx={cover.w * 0.34} cy={cover.h * 0.36} r="10" fill="#B5D8F6" stroke={INK} strokeWidth="1.4" />
          <circle cx={cover.w * 0.66} cy={cover.h * 0.44} r="9" fill="#E0C3F2" stroke={INK} strokeWidth="1.4" />
        </g>
      );

    case 'pet_tent':
    case 'tarp':
      return (
        <g>
          <path
            d={`M8,${cover.h - 6} L${cover.w / 2},8 L${cover.w - 8},${cover.h - 6} Z`}
            fill={cover.kind === 'pet_tent' ? '#F8DFAC' : '#B6C9E8'}
            stroke={INK}
            strokeWidth="2.2"
          />
          <path
            d={`M${cover.w * 0.36},${cover.h - 6} Q${cover.w / 2},${cover.h * 0.42} ${cover.w * 0.64},${cover.h - 6}`}
            fill="#EFE0CD"
            stroke={INK}
            strokeWidth="1.8"
          />
        </g>
      );

    case 'glass_door':
    case 'pastry_door':
    default:
      return (
        <g>
          <rect
            x="2"
            y="2"
            width={cover.w - 4}
            height={cover.h - 4}
            rx="10"
            fill="#E3F4F8"
            fillOpacity="0.82"
            stroke={INK}
            strokeWidth="2.2"
          />
          <line x1="16" y1="18" x2={cover.w - 30} y2={cover.h - 24} stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.7" />
          <circle cx={cover.w - 16} cy={cover.h / 2} r="5" fill="#F2B880" stroke={INK} strokeWidth="1.6" />
        </g>
      );
  }
}

export function renderCatWorldBackdrop(theme: CatWorldTheme) {
  if (theme === 'bakery') {
    return (
      <g>
        <defs>
          <linearGradient id="catBakerySky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF8EB" />
            <stop offset="100%" stopColor="#FCE7D4" />
          </linearGradient>
        </defs>
        <rect width="1360" height="680" fill="url(#catBakerySky)" />
        {/* Sunlit wall & floorboards */}
        <rect x="0" y="370" width="1360" height="310" fill="#F6D8BE" />
        <line x1="0" y1="370" x2="1360" y2="370" stroke={INK} strokeWidth="2.2" />
        {/* Striped Bakery Awning */}
        {Array.from({ length: 14 }).map((_, i) => (
          <path
            key={i}
            d={`M${i * 98},0 L${i * 98 + 98},0 L${i * 98 + 98},58 Q${i * 98 + 49},78 ${i * 98},58 Z`}
            fill={i % 2 === 0 ? '#F6A6B2' : '#FFFDF8'}
            stroke={INK}
            strokeWidth="1.8"
          />
        ))}
        {/* Sunlit Bakery Window */}
        <rect x="170" y="130" width="220" height="205" rx="16" fill="#E8F6FA" stroke={INK} strokeWidth="2.4" />
        <line x1="280" y1="130" x2="280" y2="335" stroke={INK} strokeWidth="2" />
        <line x1="170" y1="230" x2="390" y2="230" stroke={INK} strokeWidth="2" />
        {/* Bakery Bread Rack & Display Counter */}
        <rect x="440" y="165" width="440" height="170" rx="14" fill="#F4C79B" stroke={INK} strokeWidth="2.2" />
        <line x1="455" y1="252" x2="865" y2="252" stroke={INK} strokeWidth="2.2" />
        <rect x="640" y="182" width="120" height="58" rx="6" fill="#5D4942" stroke={INK} strokeWidth="1.8" />
        <path d="M662,202 Q700,194 738,202 M672,220 L728,220" stroke="#FDE6C4" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.7" />
        <rect x="260" y="390" width="840" height="200" rx="18" fill="#FFF2E2" stroke={INK} strokeWidth="2.4" />
        {/* Wooden serving boards & tablecloth trim */}
        <ellipse cx="430" cy="432" rx="66" ry="20" fill="#F3D8BA" stroke={INK} strokeWidth="1.6" opacity="0.65" />
        <ellipse cx="562" cy="442" rx="52" ry="16" fill="#F8E2EA" stroke={INK} strokeWidth="1.6" opacity="0.65" />
        <ellipse cx="892" cy="444" rx="62" ry="18" fill="#F3D8BA" stroke={INK} strokeWidth="1.6" opacity="0.65" />
        <path d="M268,548 Q340,564 412,548 T556,548 T700,548 T844,548 T988,548 T1092,548" stroke="#F2B8B5" strokeWidth="3" fill="none" opacity="0.7" />
        {/* Hanging vine */}
        <g transform="translate(1150, 90)" className="animate-cozy-sway">
          <path d="M0,0 Q-16,32 4,62 M0,0 Q18,28 2,58" stroke="#74B480" strokeWidth="3.5" fill="none" />
          <circle cx="-8" cy="24" r="8" fill="#8CD098" stroke={INK} strokeWidth="1.5" />
          <circle cx="10" cy="40" r="8" fill="#8CD098" stroke={INK} strokeWidth="1.5" />
        </g>
        {/* Shelves right */}
        <rect x="1115" y="210" width="185" height="16" rx="4" fill="#DDA97E" stroke={INK} strokeWidth="2" />
        <rect x="1115" y="305" width="185" height="16" rx="4" fill="#DDA97E" stroke={INK} strokeWidth="2" />
      </g>
    );
  }

  if (theme === 'flower_alley') {
    return (
      <g>
        <defs>
          <linearGradient id="catFlowerSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EBF9F1" />
            <stop offset="100%" stopColor="#FDF6DF" />
          </linearGradient>
        </defs>
        <rect width="1360" height="680" fill="url(#catFlowerSky)" />
        {/* Soft clouds */}
        <g className="animate-cozy-float">
          <ellipse cx="240" cy="100" rx="68" ry="26" fill="#FFFFFF" fillOpacity="0.85" />
          <ellipse cx="920" cy="90" rx="82" ry="28" fill="#FFFFFF" fillOpacity="0.85" />
        </g>
        {/* Cobblestone street */}
        <rect x="0" y="435" width="1360" height="245" fill="#E8ECE0" />
        <line x1="0" y1="435" x2="1360" y2="435" stroke={INK} strokeWidth="2.2" />
        {/* Cute Greenhouse & Flower Shop */}
        <rect x="120" y="175" width="530" height="260" rx="14" fill="#FFFDF5" stroke={INK} strokeWidth="2.2" />
        <path d="M100,180 L385,78 L670,180 Z" fill="#F2AE9C" stroke={INK} strokeWidth="2.2" />
        <rect x="740" y="150" width="490" height="285" rx="16" fill="#E1F4EE" stroke={INK} strokeWidth="2.2" />
        <path d="M720,155 L985,68 L1250,155 Z" fill="#A6D9B7" stroke={INK} strokeWidth="2.2" />
        {/* Swaying Tree on far right */}
        <g transform="translate(1285, 360)" className="animate-cozy-sway">
          <rect x="-12" y="0" width="24" height="80" fill="#C49A76" stroke={INK} strokeWidth="2" />
          <circle cx="0" cy="-24" r="56" fill="#95D0A1" stroke={INK} strokeWidth="2.2" />
        </g>
      </g>
    );
  }

  if (theme === 'pet_cafe') {
    return (
      <g>
        <rect width="1360" height="680" fill="#FDF5F6" />
        <rect x="0" y="420" width="1360" height="260" fill="#F2DFD0" />
        <line x1="0" y1="420" x2="1360" y2="420" stroke={INK} strokeWidth="2.2" />
        {/* Arched cafe window & cat shelves */}
        <path d="M190,340 L190,150 A120,120 0 0,1 430,150 L430,340 Z" fill="#E9F5FB" stroke={INK} strokeWidth="2.4" />
        <rect x="490" y="245" width="280" height="18" rx="6" fill="#DFAA82" stroke={INK} strokeWidth="2" />
        <rect x="560" y="140" width="170" height="18" rx="6" fill="#DFAA82" stroke={INK} strokeWidth="2" />
        {/* Pastry counter & sofa rug */}
        <rect x="815" y="255" width="320" height="165" rx="14" fill="#FFF8EE" stroke={INK} strokeWidth="2.2" />
        <ellipse cx="480" cy="545" rx="230" ry="52" fill="#F9CDD6" stroke={INK} strokeWidth="2" />
        {/* Gentle steam */}
        <path d="M510,330 Q520,310 510,290" stroke="#FFFFFF" strokeWidth="3" fill="none" className="animate-cozy-steam" />
      </g>
    );
  }

  if (theme === 'night_market') {
    return (
      <g>
        <defs>
          <linearGradient id="catMarketSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#353154" />
            <stop offset="100%" stopColor="#655885" />
          </linearGradient>
        </defs>
        <rect width="1360" height="680" fill="url(#catMarketSky)" />
        {/* Pastel evening stars */}
        {[120, 310, 520, 770, 990, 1210].map((sx, idx) => (
          <circle
            key={sx}
            cx={sx}
            cy={52 + (idx % 3) * 24}
            r="3"
            fill="#FDE68A"
            className="animate-cozy-float"
          />
        ))}
        {/* Cobblestone night path */}
        <rect x="0" y="440" width="1360" height="240" fill="#52466A" />
        <line x1="0" y1="440" x2="1360" y2="440" stroke="#282038" strokeWidth="2.4" />
        {/* Food & Claw Stalls */}
        <rect x="130" y="220" width="320" height="220" rx="12" fill="#FFF2E2" stroke={INK} strokeWidth="2.4" />
        <path d="M110,225 L470,225 L450,165 L130,165 Z" fill="#F4A28C" stroke={INK} strokeWidth="2.4" />
        <rect x="520" y="245" width="420" height="195" rx="12" fill="#F8E9F2" stroke={INK} strokeWidth="2.4" />
        <rect x="990" y="190" width="280" height="250" rx="12" fill="#F7E3C6" stroke={INK} strokeWidth="2.4" />
      </g>
    );
  }

  // fireworks festival
  return (
    <g>
      <defs>
        <linearGradient id="catFestSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#262A4C" />
          <stop offset="100%" stopColor="#58477A" />
        </linearGradient>
      </defs>
      <rect width="1360" height="680" fill="url(#catFestSky)" />
      {/* Full pastel moon */}
      <circle cx="210" cy="112" r="54" fill="#FEF3C7" />
      {/* Distant fireworks sparkles */}
      <g className="animate-cozy-float">
        <circle cx="420" cy="105" r="4" fill="#FDE68A" />
        <circle cx="880" cy="95" r="4" fill="#FBCFE8" />
        <circle cx="1140" cy="115" r="4" fill="#A7F3D0" />
      </g>
      {/* River & Wooden Festival Bridge */}
      <rect x="0" y="420" width="1360" height="260" fill="#463E66" />
      <rect x="180" y="220" width="380" height="220" rx="12" fill="#FDF0DF" stroke={INK} strokeWidth="2.4" />
      <rect x="650" y="240" width="490" height="200" rx="12" fill="#F6E5EF" stroke={INK} strokeWidth="2.4" />
    </g>
  );
}

export function CatTownMapSvg({
  stages,
  unlockedIds,
  clearedIds,
  secretCounts,
  activeStageId,
  onSelectStage,
}: {
  stages: readonly CatStageDef[];
  unlockedIds: Set<string>;
  clearedIds: Set<string>;
  secretCounts: Record<string, boolean>;
  activeStageId: string;
  onSelectStage: (id: string) => void;
}) {
  return (
    <svg
      viewBox="0 0 980 250"
      className="w-full h-auto block select-none"
      role="img"
      aria-label="Bản đồ thị trấn tiệm mèo pastel"
    >
      <rect width="980" height="250" fill="#FFF9F1" />
      {/* Pastel clouds & sleepy sun */}
      <circle cx="88" cy="46" r="22" fill="#FDE68A" opacity="0.85" />
      <ellipse cx="220" cy="48" rx="44" ry="16" fill="#FFFFFF" opacity="0.9" />
      <ellipse cx="585" cy="42" rx="52" ry="18" fill="#FFFFFF" opacity="0.9" />
      <ellipse cx="835" cy="54" rx="40" ry="15" fill="#FFFFFF" opacity="0.9" />
      {/* Soft pastel meadow hills */}
      <path d="M0,192 Q240,158 490,188 T980,178 L980,250 L0,250 Z" fill="#EDF6E8" />
      <path d="M0,218 Q310,198 620,222 T980,212 L980,250 L0,250 Z" fill="#FDECE8" />
      {/* Decorative pastel trees */}
      {[50, 215, 405, 595, 780, 938].map((tx, idx) => (
        <g key={tx} transform={`translate(${tx}, ${188 + (idx % 2) * 14})`} opacity="0.85">
          <rect x="-3" y="0" width="6" height="16" fill="#C49A76" />
          <circle cx="0" cy="-10" r="14" fill={idx % 2 === 0 ? '#A7D7B1' : '#F8C6CC'} stroke="#43312B" strokeWidth="1.4" />
        </g>
      ))}

      {/* Connecting Paths — colored warmly as stages are cleared! */}
      {stages.slice(0, -1).map((st, idx) => {
        const next = stages[idx + 1];
        const pathColored = clearedIds.has(st.id) && unlockedIds.has(next.id);
        const mx = (st.mapX + next.mapX) / 2;
        const my = (st.mapY + next.mapY) / 2 + (idx % 2 === 0 ? -36 : 36);
        return (
          <path
            key={st.id}
            d={`M${st.mapX},${st.mapY} Q${mx},${my} ${next.mapX},${next.mapY}`}
            fill="none"
            stroke={pathColored ? '#F4978E' : '#D5C7BA'}
            strokeWidth={pathColored ? '8' : '4'}
            strokeDasharray={pathColored ? undefined : '8 8'}
            strokeLinecap="round"
          />
        );
      })}

      {/* Town Stage Nodes */}
      {stages.map((st) => {
        const unlocked = unlockedIds.has(st.id);
        const cleared = clearedIds.has(st.id);
        const isSelected = activeStageId === st.id;
        const hasSecret = Boolean(secretCounts[st.id]);

        return (
          <g
            key={st.id}
            transform={`translate(${st.mapX}, ${st.mapY})`}
            onClick={() => unlocked && onSelectStage(st.id)}
            style={{ cursor: unlocked ? 'pointer' : 'not-allowed', opacity: unlocked ? 1 : 0.6 }}
          >
            {isSelected && (
              <circle r="44" fill="none" stroke="#EC7083" strokeWidth="3" strokeDasharray="6 4" />
            )}
            <circle
              r="34"
              fill={cleared ? '#FDE68A' : unlocked ? '#FFFDF8' : '#EFE9E2'}
              stroke={isSelected ? '#D95B72' : INK}
              strokeWidth="2.5"
            />
            <text
              y="5"
              textAnchor="middle"
              fill={INK}
              fontSize="16"
              fontWeight="700"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              {st.isSecretStage ? '★' : st.order}
            </text>
            {/* Golden cat indicator */}
            <circle
              cx="26"
              cy="-24"
              r="11"
              fill={hasSecret ? '#FBBF24' : '#F3EBE2'}
              stroke={INK}
              strokeWidth="1.6"
            />
            <text x="26" y="-20" textAnchor="middle" fontSize="11" fill={INK}>
              {hasSecret ? '★' : '•'}
            </text>
            <text
              y="54"
              textAnchor="middle"
              fill={INK}
              fontSize="12"
              fontWeight="700"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              {st.title}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
