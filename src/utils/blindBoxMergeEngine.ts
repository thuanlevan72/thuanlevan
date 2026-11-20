export type SquishyFaceStyle =
  | 'happy_blush'
  | 'chirpy'
  | 'sleepy_uwu'
  | 'bunny'
  | 'kitty'
  | 'froggy'
  | 'shiba'
  | 'panda'
  | 'fox'
  | 'capybara_king';

export interface SquishyTierDef {
  tier: number; // 0..9
  name: string;
  radius: number;
  fillColor: string;
  highlightColor: string;
  accentColor: string;
  face: SquishyFaceStyle;
  mergeScore: number;
  mergeCoins: number;
}

export interface SquishyBody {
  id: number;
  tier: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  scaleX: number;
  scaleY: number;
  ageSec: number;
  mergeFlash: number;
}

export interface MergeEvent {
  tier: number; // resulting tier
  x: number;
  y: number;
  score: number;
  coins: number;
}

export type CollectibleRarity = 'common' | 'rare' | 'secret';

export type RoomItemShape =
  | 'mushroom_lamp'
  | 'fluffy_rug'
  | 'cactus_pot'
  | 'oak_bookshelf'
  | 'toast_pillow'
  | 'cloud_frame'
  | 'beanbag_chair'
  | 'milk_table'
  | 'vinyl_player'
  | 'fairy_lights'
  | 'crystal_mushroom'
  | 'capybara_throne';

export interface RoomCollectibleDef {
  id: string;
  name: string;
  rarity: CollectibleRarity;
  shape: RoomItemShape;
  primaryColor: string;
  secondaryColor: string;
  width: number;
  height: number;
  defaultX: number;
  defaultY: number;
  description: string;
}

export interface BlindBoxPackDef {
  id: string;
  name: string;
  subtitle: string;
  costCoins: number;
  foilColor: string;
  accentColor: string;
  secretChance: number;
  rareChance: number;
  poolIds: readonly string[];
}

export interface PlacedRoomDecor {
  id: string;
  x: number;
  y: number;
  flipped: boolean;
}

export const JAR_W = 360;
export const JAR_H = 440;
export const DANGER_LINE_Y = 76;
export const ROOM_W = 680;
export const ROOM_H = 420;

export const SQUISHY_TIERS: readonly SquishyTierDef[] = [
  {
    tier: 0,
    name: 'Mochi Dâu Sữa',
    radius: 17,
    fillColor: '#F8BBD0',
    highlightColor: '#FCE4EC',
    accentColor: '#EC407A',
    face: 'happy_blush',
    mergeScore: 10,
    mergeCoins: 2,
  },
  {
    tier: 1,
    name: 'Bé Gà Bông',
    radius: 22,
    fillColor: '#FFF0A5',
    highlightColor: '#FFF9D6',
    accentColor: '#F59E0B',
    face: 'chirpy',
    mergeScore: 22,
    mergeCoins: 3,
  },
  {
    tier: 2,
    name: 'Mochi Trà Xanh',
    radius: 27,
    fillColor: '#B9E2C6',
    highlightColor: '#DCF3E3',
    accentColor: '#4D9068',
    face: 'sleepy_uwu',
    mergeScore: 40,
    mergeCoins: 5,
  },
  {
    tier: 3,
    name: 'Thỏ Bông Lavender',
    radius: 33,
    fillColor: '#DCD0F7',
    highlightColor: '#EFE9FC',
    accentColor: '#9C82D8',
    face: 'bunny',
    mergeScore: 65,
    mergeCoins: 8,
  },
  {
    tier: 4,
    name: 'Mèo Kem Mây',
    radius: 39,
    fillColor: '#FFF4E6',
    highlightColor: '#FFFFFF',
    accentColor: '#E5989B',
    face: 'kitty',
    mergeScore: 100,
    mergeCoins: 12,
  },
  {
    tier: 5,
    name: 'Ếch Cốm Bạc Hà',
    radius: 46,
    fillColor: '#9EDCC5',
    highlightColor: '#CBF0E2',
    accentColor: '#3B8D70',
    face: 'froggy',
    mergeScore: 145,
    mergeCoins: 16,
  },
  {
    tier: 6,
    name: 'Shiba Bánh Mì',
    radius: 53,
    fillColor: '#F6C296',
    highlightColor: '#FBE0C8',
    accentColor: '#C87D4B',
    face: 'shiba',
    mergeScore: 210,
    mergeCoins: 24,
  },
  {
    tier: 7,
    name: 'Gấu Trúc Trà Sữa',
    radius: 61,
    fillColor: '#F3ECE4',
    highlightColor: '#FFFFFF',
    accentColor: '#4A403A',
    face: 'panda',
    mergeScore: 300,
    mergeCoins: 35,
  },
  {
    tier: 8,
    name: 'Cáo Đào Bông Xù',
    radius: 68,
    fillColor: '#F4A096',
    highlightColor: '#FAD0CB',
    accentColor: '#D66458',
    face: 'fox',
    mergeScore: 420,
    mergeCoins: 50,
  },
  {
    tier: 9,
    name: 'Vua Capybara Quýt',
    radius: 76,
    fillColor: '#D9AE88',
    highlightColor: '#EED2B8',
    accentColor: '#F59E0B',
    face: 'capybara_king',
    mergeScore: 650,
    mergeCoins: 90,
  },
];

export const ROOM_COLLECTIBLES: readonly RoomCollectibleDef[] = [
  {
    id: 'dec-mushroom-lamp',
    name: 'Đèn Ngủ Nấm Pastel',
    rarity: 'common',
    shape: 'mushroom_lamp',
    primaryColor: '#F7B2BD',
    secondaryColor: '#FFF5E9',
    width: 66,
    height: 78,
    defaultX: 525,
    defaultY: 280,
    description: 'Đèn ngủ chấm bi tỏa ánh sáng dịu nhẹ bên góc bàn.',
  },
  {
    id: 'dec-fluffy-rug',
    name: 'Thảm Lông Tròn Kem',
    rarity: 'common',
    shape: 'fluffy_rug',
    primaryColor: '#F4EAE0',
    secondaryColor: '#E8C5CE',
    width: 185,
    height: 68,
    defaultX: 345,
    defaultY: 365,
    description: 'Thảm lông cừu mềm mịn lót giữa căn phòng mini.',
  },
  {
    id: 'dec-cactus-pot',
    name: 'Chậu Xương Rồng Mini',
    rarity: 'common',
    shape: 'cactus_pot',
    primaryColor: '#A7D3B1',
    secondaryColor: '#E5B293',
    width: 58,
    height: 78,
    defaultX: 165,
    defaultY: 222,
    description: 'Cây xương rồng nhỏ nở hoa hồng xinh trên bậu cửa.',
  },
  {
    id: 'dec-oak-bookshelf',
    name: 'Kệ Sách Gỗ Sồi',
    rarity: 'common',
    shape: 'oak_bookshelf',
    primaryColor: '#DEC3A5',
    secondaryColor: '#B8D4E3',
    width: 112,
    height: 138,
    defaultX: 110,
    defaultY: 270,
    description: 'Giá sách nhỏ đựng truyện tranh và lọ gốm pastel.',
  },
  {
    id: 'dec-toast-pillow',
    name: 'Gối Ôm Bánh Mì',
    rarity: 'common',
    shape: 'toast_pillow',
    primaryColor: '#F4CE9B',
    secondaryColor: '#C58D56',
    width: 68,
    height: 62,
    defaultX: 290,
    defaultY: 334,
    description: 'Chiếc gối hình lát bánh mì nướng có má hồng.',
  },
  {
    id: 'dec-cloud-frame',
    name: 'Khung Tranh Mây Hồng',
    rarity: 'common',
    shape: 'cloud_frame',
    primaryColor: '#F4D5DF',
    secondaryColor: '#C4DDF2',
    width: 82,
    height: 66,
    defaultX: 460,
    defaultY: 132,
    description: 'Bức tranh bầu trời mây pastel treo tường.',
  },
  {
    id: 'dec-beanbag-chair',
    name: 'Ghế Lười Đậu Bông',
    rarity: 'rare',
    shape: 'beanbag_chair',
    primaryColor: '#D4C5EE',
    secondaryColor: '#B39EDB',
    width: 114,
    height: 92,
    defaultX: 240,
    defaultY: 318,
    description: 'Ghế lười màu tím oải hương ôm trọn dáng ngồi chill.',
  },
  {
    id: 'dec-milk-table',
    name: 'Bàn Trà Tròn Sữa',
    rarity: 'rare',
    shape: 'milk_table',
    primaryColor: '#FFF8F0',
    secondaryColor: '#D8BD9E',
    width: 120,
    height: 76,
    defaultX: 465,
    defaultY: 332,
    description: 'Bàn gỗ tròn thấp đặt tách dâu sữa nóng.',
  },
  {
    id: 'dec-vinyl-player',
    name: 'Máy Đĩa Than Lo-Fi',
    rarity: 'rare',
    shape: 'vinyl_player',
    primaryColor: '#B8DDD1',
    secondaryColor: '#4A433E',
    width: 84,
    height: 58,
    defaultX: 465,
    defaultY: 286,
    description: 'Chiếc máy phát nhạc lo-fi dịu êm buổi tối.',
  },
  {
    id: 'dec-fairy-lights',
    name: 'Dây Đèn Fairy Lights',
    rarity: 'rare',
    shape: 'fairy_lights',
    primaryColor: '#FDE68A',
    secondaryColor: '#C5B5A2',
    width: 240,
    height: 46,
    defaultX: 340,
    defaultY: 56,
    description: 'Chuỗi đèn đom đóm ấm áp giăng ngang đầu tường.',
  },
  {
    id: 'dec-crystal-mushroom',
    name: 'Đèn Nấm Pha Lê (Secret)',
    rarity: 'secret',
    shape: 'crystal_mushroom',
    primaryColor: '#FBCFE8',
    secondaryColor: '#A7F3D0',
    width: 78,
    height: 94,
    defaultX: 572,
    defaultY: 295,
    description: 'Phiên bản Secret phát sáng cầu vồng lấp lánh cực hiếm!',
  },
  {
    id: 'dec-capybara-throne',
    name: 'Ghế Capybara Hoàng Gia (Secret)',
    rarity: 'secret',
    shape: 'capybara_throne',
    primaryColor: '#E5BE9E',
    secondaryColor: '#FBBF24',
    width: 122,
    height: 108,
    defaultX: 350,
    defaultY: 306,
    description: 'Phiên bản Secret ghế nhung Capybara đội vương miện quýt!',
  },
];

export const BLIND_BOX_PACKS: readonly BlindBoxPackDef[] = [
  {
    id: 'pack-pastel-sweet',
    name: 'Túi Mù Ngọt Ngào',
    subtitle: 'Chứa đèn nấm, gối bánh mì, ghế lười & 1 Secret',
    costCoins: 70,
    foilColor: '#F8C8DC',
    accentColor: '#EC709B',
    secretChance: 0.08,
    rareChance: 0.32,
    poolIds: [
      'dec-mushroom-lamp',
      'dec-fluffy-rug',
      'dec-toast-pillow',
      'dec-beanbag-chair',
      'dec-fairy-lights',
      'dec-crystal-mushroom',
    ],
  },
  {
    id: 'pack-cozy-studio',
    name: 'Túi Mù Góc Chill',
    subtitle: 'Chứa kệ sách, đĩa than lo-fi, bàn trà & Secret Capybara',
    costCoins: 95,
    foilColor: '#C6E2F5',
    accentColor: '#5B9BD5',
    secretChance: 0.12,
    rareChance: 0.38,
    poolIds: [
      'dec-cactus-pot',
      'dec-oak-bookshelf',
      'dec-cloud-frame',
      'dec-milk-table',
      'dec-vinyl-player',
      'dec-capybara-throne',
    ],
  },
];

export function computeTearProgress(startX: number, currentX: number, stripWidth: number): number {
  if (stripWidth <= 0) return 0;
  const delta = Math.max(0, currentX - startX);
  return Math.max(0, Math.min(1, delta / stripWidth));
}

export interface BlindBoxRollResult {
  item: RoomCollectibleDef;
  isNew: boolean;
  duplicateRefundCoins: number;
}

export function rollBlindBoxDrop(
  pack: BlindBoxPackDef,
  rarityRoll: number,
  itemPickRoll: number,
  unlockedIds: readonly string[]
): BlindBoxRollResult {
  const pool = ROOM_COLLECTIBLES.filter((c) => pack.poolIds.includes(c.id));
  let targetRarity: CollectibleRarity = 'common';
  if (rarityRoll < pack.secretChance) {
    targetRarity = 'secret';
  } else if (rarityRoll < pack.secretChance + pack.rareChance) {
    targetRarity = 'rare';
  }

  let candidates = pool.filter((c) => c.rarity === targetRarity);
  if (candidates.length === 0) candidates = pool;
  const idx = Math.min(candidates.length - 1, Math.floor(Math.max(0, itemPickRoll) * candidates.length));
  const picked = candidates[idx];
  const isNew = !unlockedIds.includes(picked.id);
  const duplicateRefundCoins = isNew
    ? 0
    : picked.rarity === 'secret'
      ? 60
      : picked.rarity === 'rare'
        ? 35
        : 22;

  return {
    item: picked,
    isNew,
    duplicateRefundCoins,
  };
}

export interface PhysicsStepOutput {
  bodies: SquishyBody[];
  merges: MergeEvent[];
  scoreDelta: number;
  coinDelta: number;
  overflowed: boolean;
}

/**
 * Pure 2D squishy circle physics solver with sub-stepping, restitution bounce,
 * squash-and-stretch impulse, and Suika-style same-tier merging.
 */
export function stepSquishyPhysics(
  inputBodies: readonly SquishyBody[],
  dt: number,
  nextIdRef: { current: number },
  jarW: number = JAR_W,
  jarH: number = JAR_H
): PhysicsStepOutput {
  const bodies: SquishyBody[] = inputBodies.map((b) => ({ ...b }));
  const merges: MergeEvent[] = [];
  let scoreDelta = 0;
  let coinDelta = 0;

  const subSteps = 3;
  const subDt = Math.min(0.032, Math.max(0.001, dt)) / subSteps;
  const gravity = 820;

  for (let step = 0; step < subSteps; step++) {
    // 1. Integrate gravity & damping + recover squash-stretch
    for (const b of bodies) {
      b.vy += gravity * subDt;
      b.vx *= 0.992;
      b.vy *= 0.996;
      b.x += b.vx * subDt;
      b.y += b.vy * subDt;
      b.ageSec += subDt;
      b.mergeFlash = Math.max(0, b.mergeFlash - subDt * 2.5);
      b.scaleX += (1 - b.scaleX) * Math.min(1, subDt * 14);
      b.scaleY += (1 - b.scaleY) * Math.min(1, subDt * 14);

      // Left / Right walls
      const padWall = 8;
      if (b.x - b.radius < padWall) {
        b.x = padWall + b.radius;
        if (Math.abs(b.vx) > 45) {
          b.scaleX = 0.88;
          b.scaleY = 1.12;
        }
        b.vx = Math.abs(b.vx) * 0.42;
      } else if (b.x + b.radius > jarW - padWall) {
        b.x = jarW - padWall - b.radius;
        if (Math.abs(b.vx) > 45) {
          b.scaleX = 0.88;
          b.scaleY = 1.12;
        }
        b.vx = -Math.abs(b.vx) * 0.42;
      }

      // Jar Floor
      const floorY = jarH - 10;
      if (b.y + b.radius > floorY) {
        b.y = floorY - b.radius;
        if (b.vy > 75) {
          b.scaleX = 1.16;
          b.scaleY = 0.84;
        }
        b.vy = -Math.abs(b.vy) * 0.25;
        b.vx *= 0.92;
      }
    }

    // 2. Circle-circle collision + same-tier merge check
    const removedIds = new Set<number>();
    const spawned: SquishyBody[] = [];

    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      if (removedIds.has(a.id)) continue;

      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        if (removedIds.has(b.id)) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius;

        if (dist < minDist) {
          // Check same-tier merge (up to penultimate tier -> Boss tier 9)
          if (a.tier === b.tier && a.tier < SQUISHY_TIERS.length - 1) {
            const nextTierDef = SQUISHY_TIERS[a.tier + 1];
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            removedIds.add(a.id);
            removedIds.add(b.id);

            const mergedBody: SquishyBody = {
              id: nextIdRef.current++,
              tier: nextTierDef.tier,
              x: Math.max(nextTierDef.radius + 8, Math.min(jarW - nextTierDef.radius - 8, mx)),
              y: Math.min(jarH - 10 - nextTierDef.radius, my),
              vx: (a.vx + b.vx) * 0.35,
              vy: -95, // joyful tiny pop!
              radius: nextTierDef.radius,
              scaleX: 1.24,
              scaleY: 0.78,
              ageSec: 0,
              mergeFlash: 1,
            };
            spawned.push(mergedBody);
            merges.push({
              tier: nextTierDef.tier,
              x: mergedBody.x,
              y: mergedBody.y,
              score: nextTierDef.mergeScore,
              coins: nextTierDef.mergeCoins,
            });
            scoreDelta += nextTierDef.mergeScore;
            coinDelta += nextTierDef.mergeCoins;
            break;
          }

          // Elastic squishy collision separation
          const nx = dist > 0.0001 ? dx / dist : 0;
          const ny = dist > 0.0001 ? dy / dist : -1;
          const overlap = minDist - dist;

          const massA = a.radius * a.radius;
          const massB = b.radius * b.radius;
          const totalMass = massA + massB;

          a.x -= nx * overlap * (massB / totalMass) * 0.85;
          a.y -= ny * overlap * (massB / totalMass) * 0.85;
          b.x += nx * overlap * (massA / totalMass) * 0.85;
          b.y += ny * overlap * (massA / totalMass) * 0.85;

          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const velAlongNormal = rvx * nx + rvy * ny;
          if (velAlongNormal < 0) {
            const restitution = 0.28;
            const jImp = (-(1 + restitution) * velAlongNormal) / (1 / massA + 1 / massB);
            a.vx -= (jImp / massA) * nx;
            a.vy -= (jImp / massA) * ny;
            b.vx += (jImp / massB) * nx;
            b.vy += (jImp / massB) * ny;

            if (Math.abs(velAlongNormal) > 70) {
              a.scaleX = 1.1;
              a.scaleY = 0.9;
              b.scaleX = 1.1;
              b.scaleY = 0.9;
            }
          }
        }
      }
    }

    if (removedIds.size > 0 || spawned.length > 0) {
      const kept = bodies.filter((b) => !removedIds.has(b.id));
      bodies.length = 0;
      bodies.push(...kept, ...spawned);
    }
  }

  // Overflow check: any settled squishy (> 1.4s old) resting above DANGER_LINE_Y
  const overflowed = bodies.some(
    (b) => b.ageSec > 1.4 && b.y - b.radius < DANGER_LINE_Y - 12 && Math.abs(b.vy) < 40
  );

  return {
    bodies,
    merges,
    scoreDelta,
    coinDelta,
    overflowed,
  };
}
