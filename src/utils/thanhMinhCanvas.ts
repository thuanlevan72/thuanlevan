// Cinematic 60fps 2.5D Paper-Cutout, Articulated Character Rigging,
// Volumetric Lighting & Monster Kill-Cutscene Renderer for:
// THANH MINH: HỌC VIỆN CÔ SƠN (清明)

import {
  findNearbyHotspot,
  type GhostEntity,
  type GhostVariant,
  SCENE_HOTSPOTS,
  SCENE_META,
  type SceneId,
  type ThanhMinhState,
} from './thanhMinhEngine.ts';
import killPaperHatImgUrl from '../assets/images/detention_kill_paperhat_1795575727125.jpg';
import killWardenImgUrl from '../assets/images/detention_kill_warden_1795575729219.jpg';
import killAuditorImgUrl from '../assets/images/detention_kill_auditor_pov_1795575748938.jpg';
import killLibrarianImgUrl from '../assets/images/detention_kill_librarian_1795575748624.jpg';

const FONT_SERIF = '"Noto Serif", "Plus Jakarta Sans", serif';
const FONT_MONO = '"JetBrains Mono", "Noto Sans", monospace';
const FONT_SANS = '"Plus Jakarta Sans", "Noto Sans", sans-serif';

interface RainDrop {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
}

interface DustMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
}

interface AshParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

interface SmokeWisp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

export class ThanhMinhCanvasRenderer {
  private rainDrops: RainDrop[] = [];
  private dustMotes: DustMote[] = [];
  private ashParticles: AshParticle[] = [];
  private smokeWisps: SmokeWisp[] = [];

  private camX = 0;
  private viewWidth = 960;
  private lastScene: SceneId | null = null;
  private shakeIntensity = 0;
  private lightningFlash = 0;
  private nextLightningIn = 5.5;
  private grainCanvas: HTMLCanvasElement | null = null;
  private grainPattern: CanvasPattern | null = null;
  private paperCanvas: HTMLCanvasElement | null = null;
  private paperPattern: CanvasPattern | null = null;
  private killPlates: Partial<Record<GhostVariant, HTMLImageElement>> = {};
  private doorTransitionTimer = 0;

  constructor() {
    if (typeof Image !== 'undefined') {
      const plateUrls: Record<GhostVariant, string> = {
        paper_hat: killPaperHatImgUrl,
        tongue_warden: killWardenImgUrl,
        auditor_specter: killAuditorImgUrl,
        librarian_wraith: killLibrarianImgUrl,
      };
      (Object.keys(plateUrls) as GhostVariant[]).forEach((variant) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = plateUrls[variant];
        this.killPlates[variant] = img;
      });
    }
    for (let i = 0; i < 64; i += 1) {
      this.rainDrops.push({
        x: Math.random() * 1400,
        y: Math.random() * 760,
        len: 16 + Math.random() * 26,
        speed: 540 + Math.random() * 340,
        alpha: 0.14 + Math.random() * 0.24,
      });
    }
    for (let i = 0; i < 48; i += 1) {
      this.dustMotes.push({
        x: Math.random() * 1280,
        y: 70 + Math.random() * 390,
        vx: -8 + Math.random() * 16,
        vy: -6 + Math.random() * 11,
        radius: 1 + Math.random() * 1.9,
        phase: Math.random() * Math.PI * 2,
      });
    }
    for (let i = 0; i < 64; i += 1) {
      this.ashParticles.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        vx: -14 + Math.random() * 28,
        vy: -22 - Math.random() * 34,
        size: 1.5 + Math.random() * 2.8,
        alpha: 0.25 + Math.random() * 0.55,
      });
    }
    for (let i = 0; i < 24; i += 1) {
      this.smokeWisps.push({
        x: (Math.random() - 0.5) * 16,
        y: -Math.random() * 90,
        vx: -4 + Math.random() * 8,
        vy: -16 - Math.random() * 18,
        radius: 4 + Math.random() * 8,
        alpha: 0.16 + Math.random() * 0.26,
      });
    }
  }

  public triggerShake(amount: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, amount);
  }

  public triggerDoorTransition(): void {
    this.doorTransitionTimer = 0.62;
  }

  private ensureGrainPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    if (this.grainPattern) return this.grainPattern;
    if (typeof document === 'undefined') return null;
    if (!this.grainCanvas) {
      const tile = document.createElement('canvas');
      tile.width = 160;
      tile.height = 160;
      const tctx = tile.getContext('2d');
      if (tctx) {
        const img = tctx.createImageData(160, 160);
        for (let i = 0; i < img.data.length; i += 4) {
          const v = Math.random() > 0.5 ? 235 : 18;
          img.data[i] = v;
          img.data[i + 1] = v;
          img.data[i + 2] = v;
          img.data[i + 3] = Math.floor(Math.random() * 18);
        }
        tctx.putImageData(img, 0, 0);
      }
      this.grainCanvas = tile;
    }
    this.grainPattern = ctx.createPattern(this.grainCanvas, 'repeat');
    return this.grainPattern;
  }

  // Hand-collaged Detention-style weathered rice paper & limewash fiber texture
  private ensurePaperTexturePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    if (this.paperPattern) return this.paperPattern;
    if (typeof document === 'undefined') return null;
    if (!this.paperCanvas) {
      const tile = document.createElement('canvas');
      tile.width = 180;
      tile.height = 180;
      const pctx = tile.getContext('2d');
      if (pctx) {
        pctx.clearRect(0, 0, 180, 180);
        // Subtle water-blotch speckles
        for (let i = 0; i < 42; i += 1) {
          const bx = Math.random() * 180;
          const by = Math.random() * 180;
          const br = 8 + Math.random() * 22;
          pctx.fillStyle = i % 2 === 0 ? 'rgba(218, 206, 178, 0.06)' : 'rgba(18, 16, 12, 0.08)';
          pctx.beginPath();
          pctx.arc(bx, by, br, 0, Math.PI * 2);
          pctx.fill();
        }
        // Fine mulberry/rice-paper hair fibers
        pctx.lineWidth = 0.7;
        for (let f = 0; f < 65; f += 1) {
          const fx = Math.random() * 180;
          const fy = Math.random() * 180;
          const ang = Math.random() * Math.PI * 2;
          const len = 6 + Math.random() * 14;
          pctx.strokeStyle = f % 3 === 0 ? 'rgba(225, 214, 188, 0.12)' : 'rgba(14, 12, 10, 0.1)';
          pctx.beginPath();
          pctx.moveTo(fx, fy);
          pctx.quadraticCurveTo(
            fx + Math.cos(ang) * len * 0.5 + (Math.random() - 0.5) * 4,
            fy + Math.sin(ang) * len * 0.5 + (Math.random() - 0.5) * 4,
            fx + Math.cos(ang) * len,
            fy + Math.sin(ang) * len
          );
          pctx.stroke();
        }
      }
      this.paperCanvas = tile;
    }
    this.paperPattern = ctx.createPattern(this.paperCanvas, 'repeat');
    return this.paperPattern;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    state: ThanhMinhState,
    timeSec: number,
    dt: number
  ): void {
    const isYin = state.realm === 'yin';
    const isDawn = state.ending === 'ending_4_dawn_coson';
    const isLateQingming = state.ending === 'ending_3_late_qingming';
    const isAshes = state.ending === 'ending_2_ashes';
    const isLoopEnding = state.ending === 'ending_1_loop';
    const isDarkroom = state.scene === 'darkroom';
    const is1986 = state.scene === 'ruined_hall_1986';

    this.viewWidth = width;
    const meta = SCENE_META[state.scene];
    const worldSpan = meta.maxX - meta.minX + 160;
    const maxCam = Math.max(0, worldSpan - width);
    const targetCamX = Math.max(0, Math.min(maxCam, state.playerX - width * 0.5));

    if (this.lastScene !== state.scene) {
      this.camX = targetCamX;
      this.lastScene = state.scene;
    } else {
      this.camX += (targetCamX - this.camX) * (1 - Math.exp(-8.5 * dt));
    }

    if (!isYin && !isDawn && !isAshes && !isDarkroom) {
      this.nextLightningIn -= dt;
      if (this.nextLightningIn <= 0) {
        this.lightningFlash = 0.56;
        this.nextLightningIn = 8 + Math.random() * 11;
      }
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 1.45);
    } else {
      this.lightningFlash = 0;
    }

    if (state.gazeExposure > 55) {
      this.shakeIntensity = Math.max(this.shakeIntensity, ((state.gazeExposure - 55) / 45) * 4.5);
    }
    if (state.deathCutscene?.active && state.deathCutscene.timer < 1.2) {
      this.shakeIntensity = Math.max(this.shakeIntensity, 10);
    }
    this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 13);
    const shakeX = this.shakeIntensity > 0.1 ? (Math.random() - 0.5) * this.shakeIntensity * 2 : 0;
    const shakeY = this.shakeIntensity > 0.1 ? (Math.random() - 0.5) * this.shakeIntensity * 2 : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // 1. Detention-Inspired Desaturated Slate/Sepia/Crimson Atmosphere Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (isDawn) {
      const p = Math.min(1, state.endingTimer / 4.2);
      skyGrad.addColorStop(
        0,
        `rgb(${Math.round(35 + p * 188)}, ${Math.round(28 + p * 145)}, ${Math.round(30 + p * 95)})`
      );
      skyGrad.addColorStop(
        1,
        `rgb(${Math.round(20 + p * 98)}, ${Math.round(16 + p * 74)}, ${Math.round(18 + p * 52)})`
      );
    } else if (isLateQingming) {
      const p = Math.min(1, state.endingTimer / 3.8);
      skyGrad.addColorStop(
        0,
        `rgb(${Math.round(26 + p * 85)}, ${Math.round(32 + p * 92)}, ${Math.round(40 + p * 98)})`
      );
      skyGrad.addColorStop(1, '#12161b');
    } else if (isAshes) {
      skyGrad.addColorStop(0, '#200503');
      skyGrad.addColorStop(0.55, '#4b0f07');
      skyGrad.addColorStop(1, '#0d0202');
    } else if (isDarkroom) {
      skyGrad.addColorStop(0, '#180204');
      skyGrad.addColorStop(0.6, '#360609');
      skyGrad.addColorStop(1, '#080102');
    } else if (isYin) {
      // Stark Bone-Monochrome + Blood-Crimson Ink Sky
      skyGrad.addColorStop(0, '#121011');
      skyGrad.addColorStop(0.5, '#2b090d');
      skyGrad.addColorStop(1, '#070506');
    } else if (is1986) {
      skyGrad.addColorStop(0, '#141915');
      skyGrad.addColorStop(0.55, '#202821');
      skyGrad.addColorStop(1, '#0a0d0b');
    } else {
      // 1960s Typhoon Mountain Dusk (Detention overcast sage-slate)
      skyGrad.addColorStop(0, '#0f1617');
      skyGrad.addColorStop(0.55, '#192222');
      skyGrad.addColorStop(1, '#080b0b');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-16, -16, width + 32, height + 32);

    // 2. Parallax Exterior Vista
    this.drawExteriorVista(ctx, width, height, this.camX, state, timeSec, dt);

    // 3. Scene Interior + Characters
    const floorY = height * 0.78;
    if (state.ending === 'none' || isLoopEnding) {
      ctx.save();

      // Subtle dramatic zoom-in when caught in deathCutscene!
      if (state.deathCutscene?.active) {
        const p = Math.min(1, state.deathCutscene.timer / 0.55);
        const zoom = 1 + p * 0.28;
        const focusX = state.playerX - this.camX;
        ctx.translate(focusX, height * 0.58);
        ctx.scale(zoom, zoom);
        ctx.translate(-focusX, -height * 0.58);
      }

      ctx.translate(-this.camX, 0);

      this.drawRoomArchitecture(ctx, height, floorY, state, timeSec, dt);
      this.drawScenePropsAndHotspots(ctx, floorY, state, timeSec, dt);

      if (state.scene === 'flooded_courtyard') {
        this.drawCourtyardWaterReflections(ctx, floorY, state, timeSec);
      }

      for (const ghost of state.ghosts) {
        if (ghost.scene !== state.scene || ghost.pacified) continue;
        if (ghost.x + 160 < this.camX || ghost.x - 160 > this.camX + width) continue;
        this.drawGhostEntity(ctx, floorY, ghost, state, timeSec, isYin);
      }

      if (state.activePhantomX !== null && state.activePhantomTimer > 0) {
        this.drawPeripheralWatcher(ctx, floorY, state, timeSec);
      }

      if (state.scene === 'final_interrogation') {
        this.drawInterrogationDoppelganger(ctx, floorY, timeSec);
      }

      // Expressive Realistic Lâm Tĩnh (tracks danger + sprint/fatigue animation!)
      const activeGhost = state.ghosts.find((g) => g.scene === state.scene && !g.pacified) ?? null;
      this.drawLinJing(ctx, floorY, state, activeGhost, timeSec);

      // Low swirling ghostly ground mist across floorboards
      this.drawFloorMist(ctx, worldSpan, floorY, height, timeSec, isYin);

      // Foreground 2.5D parallax swaying funeral papers & dark foreground depth pillars
      this.drawForegroundTalismans(ctx, worldSpan, height, this.camX, timeSec, isYin);
      this.drawForegroundParallaxSilhouettes(ctx, worldSpan, width, height, this.camX, isYin);

      ctx.restore();
    } else {
      this.drawEndingTableau(ctx, width, height, floorY, state, timeSec, dt);
    }

    // 4. Volumetric Lantern Dust Motes
    if (!isDawn && !isAshes) {
      this.drawLanternDustMotes(ctx, width, height, this.camX, state, timeSec, dt);
    }

    // 5. Realistic Chiaroscuro Lantern Cone + Directional Beam & Heavy Horror Darkness
    if (isLoopEnding) {
      const sirenPulse = Math.max(0, Math.sin(timeSec * 8.5)) * 0.44;
      ctx.fillStyle = `rgba(185, 20, 20, ${sirenPulse})`;
      ctx.fillRect(0, 0, width, height);
    } else if (!isDawn && !isLateQingming && !isAshes) {
      const playerScreenX = state.playerX - this.camX;
      const lanternDead = Boolean(state.deathCutscene?.active && state.deathCutscene.timer > 0.4);
      let nearestGhostDist = Infinity;
      for (const g of state.ghosts) {
        if (g.scene !== state.scene || g.pacified) continue;
        const d = Math.abs(g.x - state.playerX);
        if (d < nearestGhostDist) nearestGhostDist = d;
      }
      const dreadTighten =
        nearestGhostDist < 230 ? 1 - ((230 - nearestGhostDist) / 230) * 0.18 : 1;
      const fatigueDim = state.exhausted ? 0.8 + Math.sin(timeSec * 9) * 0.05 : 1;
      const dreadFlicker =
        nearestGhostDist < 170 ? Math.sin(timeSec * 29) * 0.035 : 0;
      const flicker = lanternDead
        ? 0.3
        : (1 + Math.sin(timeSec * 14.3) * 0.03 + Math.cos(timeSec * 23.1) * 0.02 + dreadFlicker) *
          fatigueDim *
          dreadTighten;
      const lanternX = playerScreenX + state.playerFacing * 28;
      const lanternY = floorY - (state.exhausted ? 66 : 84);
      // Expanded (+20%) Detention-style lantern pocket: warm clear pocket around Lâm Tĩnh & nearby props while outer surroundings remain pitch-dark
      const lanternRadius = Math.max(190, width * 0.264) * flicker;

      // Soft feathered forward directional spill (no hard polygon cut edges)
      ctx.save();
      const forwardCenterX = lanternX + state.playerFacing * 68 * flicker;
      const forwardRadius = 178 * flicker;
      ctx.translate(forwardCenterX, lanternY + 4);
      ctx.scale(1.15, 0.78);
      const coneGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, forwardRadius);
      coneGrad.addColorStop(
        0,
        isYin ? 'rgba(220, 38, 38, 0.16)' : isDarkroom ? 'rgba(239, 68, 68, 0.16)' : 'rgba(246, 206, 128, 0.18)'
      );
      coneGrad.addColorStop(
        0.52,
        isYin ? 'rgba(185, 28, 28, 0.06)' : isDarkroom ? 'rgba(220, 38, 38, 0.06)' : 'rgba(242, 190, 108, 0.07)'
      );
      coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.arc(0, 0, forwardRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const lanternGrad = ctx.createRadialGradient(
        lanternX,
        lanternY,
        18,
        lanternX,
        lanternY,
        lanternRadius
      );
      if (isDarkroom) {
        lanternGrad.addColorStop(0, 'rgba(239, 68, 68, 0.14)');
        lanternGrad.addColorStop(0.4, 'rgba(20, 2, 4, 0.68)');
        lanternGrad.addColorStop(0.72, 'rgba(6, 1, 2, 0.9)');
        lanternGrad.addColorStop(1, 'rgba(2, 0, 1, 0.96)');
      } else if (isYin) {
        lanternGrad.addColorStop(0, 'rgba(185, 28, 28, 0.11)');
        lanternGrad.addColorStop(0.4, 'rgba(12, 3, 5, 0.66)');
        lanternGrad.addColorStop(0.72, 'rgba(5, 1, 2, 0.9)');
        lanternGrad.addColorStop(1, 'rgba(2, 0, 1, 0.96)');
      } else {
        lanternGrad.addColorStop(0, 'rgba(255, 204, 120, 0.14)');
        lanternGrad.addColorStop(0.4, 'rgba(6, 8, 10, 0.6)');
        lanternGrad.addColorStop(0.72, 'rgba(3, 5, 7, 0.86)');
        lanternGrad.addColorStop(1, 'rgba(2, 3, 5, 0.94)');
      }
      ctx.fillStyle = lanternGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 6. Monster Kill Cutscene Animation Overlay (when caught / sanity breaks)
    if (state.deathCutscene?.active) {
      this.drawKillAnimationCutscene(ctx, width, height, state, timeSec);
    }

    // 7. Gaze Terror Veins & Panic Vignette
    if (!state.deathCutscene?.active && (state.gazeExposure > 15 || state.sanity < 45)) {
      const bleedAlpha = Math.min(
        0.78,
        (state.gazeExposure / 100) * 0.62 + Math.max(0, (45 - state.sanity) / 45) * 0.36
      );
      const bleedGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        width * 0.18,
        width * 0.5,
        height * 0.5,
        width * 0.72
      );
      bleedGrad.addColorStop(0, 'rgba(110, 0, 0, 0)');
      bleedGrad.addColorStop(1, `rgba(135, 8, 12, ${bleedAlpha})`);
      ctx.fillStyle = bleedGrad;
      ctx.fillRect(0, 0, width, height);

      if (state.gazeExposure > 40) {
        ctx.fillStyle = `rgba(220, 38, 38, ${(state.gazeExposure - 40) * 0.003})`;
        const tearY = (timeSec * 310) % height;
        ctx.fillRect(0, tearY, width, 2);
      }
    }

    // 8. Exhaustion Tunnel-Vision Pulse + Holding Breath Frost Border
    if (state.exhausted && !state.deathCutscene?.active) {
      const pulse = 0.24 + Math.sin(timeSec * 7.5) * 0.1;
      const exhaustGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        width * 0.24,
        width * 0.5,
        height * 0.5,
        width * 0.68
      );
      exhaustGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      exhaustGrad.addColorStop(1, `rgba(10, 4, 6, ${pulse})`);
      ctx.fillStyle = exhaustGrad;
      ctx.fillRect(0, 0, width, height);
    }

    if (state.holdingBreath) {
      const breathAlpha = 0.15 + Math.sin(timeSec * 4) * 0.04;
      ctx.strokeStyle = `rgba(148, 197, 235, ${breathAlpha})`;
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, width - 10, height - 10);
    }

    // 9. Realistic Detention Door-Opening Threshold Swing & Fade
    if (this.doorTransitionTimer > 0) {
      this.doorTransitionTimer = Math.max(0, this.doorTransitionTimer - dt);
      const tNorm = 1 - this.doorTransitionTimer / 0.62;
      if (tNorm < 0.45) {
        const closeP = tNorm / 0.45;
        const leafW = width * 0.52 * closeP;
        ctx.fillStyle = `rgba(3, 2, 2, ${0.42 + closeP * 0.56})`;
        ctx.fillRect(0, 0, width, height);
        // Swinging timber door leaf & vertical brass hinge highlight
        ctx.fillStyle = '#18100c';
        ctx.fillRect(width - leafW, 0, leafW, height);
        ctx.strokeStyle = 'rgba(92, 68, 48, 0.55)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(width - leafW, 0);
        ctx.lineTo(width - leafW, height);
        ctx.stroke();
      } else {
        const openP = (tNorm - 0.45) / 0.55;
        const slitHalf = (width * 0.54) * Math.pow(openP, 1.35);
        const fadeDark = Math.max(0, 1 - openP) * 0.96;
        ctx.fillStyle = `rgba(2, 1, 2, ${fadeDark})`;
        ctx.fillRect(0, 0, Math.max(0, width * 0.5 - slitHalf), height);
        ctx.fillRect(Math.min(width, width * 0.5 + slitHalf), 0, width, height);
        ctx.fillStyle = `rgba(2, 1, 2, ${fadeDark * 0.78})`;
        ctx.fillRect(0, 0, width, height);
      }
    }

    // 10. Vintage 16mm Grain + Projector Film-Gate Corners
    this.drawOldFilmGrain(ctx, width, height, timeSec, isYin || isDarkroom);
    this.drawProjectorFilmGate(ctx, width, height);

    ctx.restore();
  }

  private wrapCanvasLines(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  private drawKillAnimationCutscene(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    state: ThanhMinhState,
    timeSec: number
  ): void {
    const dc = state.deathCutscene;
    if (!dc) return;
    const p = Math.min(1, dc.timer / dc.duration);
    const cx = width * 0.5;
    const cy = height * 0.5;

    // 1. Base Ink Blackout & Sudden Lantern Snuff Impact
    ctx.fillStyle = '#040102';
    ctx.fillRect(0, 0, width, height);

    const variantKey: GhostVariant = dc.killerVariant ?? dc.killerKind;
    const plate = this.killPlates[variantKey] ?? this.killPlates[dc.killerKind];
    const plateReady = Boolean(plate && plate.complete && plate.naturalWidth > 0);

    // Rhythmic first-person strangulation ("bóp cổ") squeeze waves (4 desperate choking spasms)
    const rawBeat = p > 0.08 && p < 0.68 ? Math.sin((p - 0.08) * Math.PI * 6.8) : 0;
    const squeeze = Math.pow(Math.max(0, rawBeat), 1.8);
    const hypoxia = Math.max(0, Math.min(1, (p - 0.08) / 0.56));
    const plateFadeOut = p > 0.56 ? Math.max(0, 1 - (p - 0.56) / 0.16) : 1;

    // Camera violent struggle & neck-snap recoil
    const ambushRecoilY = p < 0.12 ? (1 - p / 0.12) * 24 : 0;
    const snapJolt = p > 0.52 && p < 0.66 ? Math.sin((p - 0.52) * Math.PI * 14) * 0.055 : 0;
    const struggleJitterX =
      (Math.sin(timeSec * 58) * (4 + squeeze * 11) + Math.cos(timeSec * 31) * 3) * (1 - hypoxia * 0.35);
    const struggleJitterY =
      (Math.cos(timeSec * 49) * (3 + squeeze * 13) + ambushRecoilY) * (1 - hypoxia * 0.25);
    const struggleTilt = Math.sin(timeSec * 19) * (0.018 + squeeze * 0.028) + snapJolt;

    // 2. Photorealistic Detention Strangulation Plate + Dynamic Zoom & Chromatic Aberration
    if (p < 0.72) {
      const surge = p < 0.28 ? p / 0.28 : 1;
      const zoom = 1.04 + Math.pow(surge, 0.72) * 0.22 + p * 0.22 + squeeze * 0.065;

      ctx.save();
      ctx.globalAlpha = plateFadeOut;
      ctx.translate(cx + struggleJitterX, cy + struggleJitterY);
      ctx.rotate(struggleTilt);
      ctx.scale(zoom, zoom);

      if (plateReady && plate) {
        const imgAspect = plate.naturalWidth / plate.naturalHeight;
        const viewAspect = width / height;
        let drawW = width;
        let drawH = height;
        if (imgAspect > viewAspect) {
          drawH = height;
          drawW = height * imgAspect;
        } else {
          drawW = width;
          drawH = width / imgAspect;
        }

        // Main sharp 16mm photographic/charcoal chiaroscuro plate
        ctx.drawImage(plate, -drawW * 0.5, -drawH * 0.5, drawW, drawH);

        // Chromatic red terror double-exposure shudder during choke spasms
        if (squeeze > 0.18 || p < 0.16) {
          ctx.save();
          ctx.globalAlpha = plateFadeOut * (p < 0.16 ? 0.32 : squeeze * 0.26);
          ctx.globalCompositeOperation = 'screen';
          ctx.drawImage(
            plate,
            -drawW * 0.5 + Math.sin(timeSec * 72) * 14,
            -drawH * 0.5 - 4,
            drawW,
            drawH
          );
          ctx.fillStyle = 'rgba(153, 27, 27, 0.38)';
          ctx.fillRect(-width, -height, width * 2, height * 2);
          ctx.restore();
        }
      } else {
        // Fallback dark charcoal silhouette while image decodes
        const fbGrad = ctx.createRadialGradient(0, -30, 12, 0, 0, width * 0.45);
        fbGrad.addColorStop(0, '#2a2224');
        fbGrad.addColorStop(1, '#050203');
        ctx.fillStyle = fbGrad;
        ctx.fillRect(-width, -height, width * 2, height * 2);
      }

      // Live killer-specific anatomical/weapon overlay anchored to scene space
      if (dc.killerVariant === 'tongue_warden') {
        // Massive cold iron shears violently snapping across the center at p = 0.46
        const snapAngle = p < 0.46 ? Math.max(0.015, 0.62 - (p / 0.46) * 0.605) : 0.015;
        ctx.save();
        ctx.translate(0, 32);
        ctx.globalAlpha = plateFadeOut * 0.92;
        for (const dir of [-1, 1] as const) {
          ctx.save();
          ctx.rotate(dir * snapAngle);
          const bladeGrad = ctx.createLinearGradient(0, -20, dir * 240, 18);
          bladeGrad.addColorStop(0, '#1e293b');
          bladeGrad.addColorStop(0.55, '#94a3b8');
          bladeGrad.addColorStop(0.9, '#475569');
          bladeGrad.addColorStop(1, '#450a0a');
          ctx.fillStyle = bladeGrad;
          ctx.beginPath();
          ctx.moveTo(-dir * 16, -6);
          ctx.lineTo(dir * 240, -28);
          ctx.lineTo(dir * 260, 6);
          ctx.lineTo(0, 20);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(241, 245, 249, 0.55)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(0, -3);
          ctx.lineTo(dir * 238, -25);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      } else if (dc.killerVariant === 'auditor_specter') {
        // Pulsing bruised-crimson megaphone distortion waves
        const wavePhase = (timeSec * 3.1) % 1;
        ctx.strokeStyle = `rgba(185, 28, 28, ${(1 - wavePhase) * 0.48 * plateFadeOut})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(-cx * 0.14, 24, 48 + wavePhase * 220, 0, Math.PI * 2);
        ctx.stroke();
      } else if (dc.killerVariant === 'librarian_wraith') {
        // Drifting glowing embers & burnt poetry ash rising past the lens
        for (let e = 0; e < 18; e += 1) {
          const ep = (timeSec * 1.4 + e * 0.09) % 1;
          const ex = Math.sin(e * 2.3 + timeSec * 3.8) * (width * 0.34);
          const ey = height * 0.46 - ep * height * 0.92;
          ctx.fillStyle =
            e % 3 === 0
              ? `rgba(251, 146, 60, ${(1 - ep) * 0.85 * plateFadeOut})`
              : `rgba(220, 38, 38, ${(1 - ep) * 0.65 * plateFadeOut})`;
          ctx.fillRect(ex - 1.5, ey - 1.5, 3.2, 3.2);
        }
      }

      ctx.restore();

      // 3. LIVE Animated Foreground Strangulation Grip ("Bóp cổ") Clamping Around Throat
      // Two dark shadowed anatomical hands lunge from bottom corners and visibly constrict inward on every squeeze pulse
      const gripAlpha = Math.min(0.92, p * 5.2) * plateFadeOut;
      const clampX = 28 + squeeze * 54 + hypoxia * 26;
      const clampY = squeeze * -20;
      ctx.save();
      ctx.globalAlpha = gripAlpha;
      for (const side of [-1, 1] as const) {
        const palmX = side === -1 ? -40 + clampX : width + 40 - clampX;
        const palmY = height * 0.86 + clampY;

        // Forearm & wrist thrusting up from viewer's lower sides
        const armGrad = ctx.createLinearGradient(
          palmX - side * 120,
          height + 40,
          palmX + side * 70,
          palmY - 70
        );
        armGrad.addColorStop(0, 'rgba(3, 1, 2, 0.98)');
        armGrad.addColorStop(0.65, 'rgba(24, 18, 20, 0.92)');
        armGrad.addColorStop(1, 'rgba(58, 49, 46, 0.72)');
        ctx.fillStyle = armGrad;
        ctx.beginPath();
        ctx.moveTo(palmX - side * 130, height + 40);
        ctx.lineTo(palmX - side * 35, palmY - 25);
        ctx.quadraticCurveTo(palmX + side * 22, palmY - 62, palmX + side * 48, palmY - 22);
        ctx.lineTo(palmX + side * 15, height + 40);
        ctx.closePath();
        ctx.fill();

        // Curled squeezing thumb & 4 articulated fingers wrapping inward toward center throat
        for (let f = 0; f < 5; f += 1) {
          const isThumb = f === 0;
          const baseAng = isThumb ? -0.15 : -0.82 + f * 0.22;
          const reach = isThumb ? 96 : 122 - Math.abs(f - 2) * 14;
          const startX = palmX + side * (isThumb ? 38 : 16 + f * 4);
          const startY = palmY + (isThumb ? -8 : -46 + f * 18);
          const knuckleX = startX + side * Math.cos(baseAng) * (reach * 0.56 + squeeze * 18);
          const knuckleY = startY + Math.sin(baseAng) * (reach * 0.42) - squeeze * 8;
          const tipX = knuckleX + side * (isThumb ? 34 : 46 + squeeze * 22);
          const tipY = knuckleY + (isThumb ? -14 : 18 + f * 4);

          ctx.strokeStyle = 'rgba(10, 6, 8, 0.95)';
          ctx.lineCap = 'round';
          ctx.lineWidth = isThumb ? 22 : 17;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.quadraticCurveTo(knuckleX, knuckleY, tipX, tipY);
          ctx.stroke();

          // Faint corpse-pale rim shadow on upper knuckle ridge
          ctx.strokeStyle = 'rgba(168, 162, 158, 0.22)';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(startX, startY - 4);
          ctx.lineTo(knuckleX, knuckleY - 4);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 4. Hypoxic Strangulation Tunnel Vision & Throbbing Blood-Pressure Vignette
      const clearRadius = Math.max(
        width * 0.14,
        width * (0.56 - hypoxia * 0.34 - squeeze * 0.08)
      );
      const hypoxiaGrad = ctx.createRadialGradient(
        cx,
        cy - 18,
        clearRadius * 0.35,
        cx,
        cy,
        clearRadius + 165
      );
      hypoxiaGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      hypoxiaGrad.addColorStop(0.55, `rgba(69, 8, 12, ${0.28 + squeeze * 0.36 + hypoxia * 0.25})`);
      hypoxiaGrad.addColorStop(1, `rgba(2, 1, 2, ${0.86 + hypoxia * 0.12})`);
      ctx.fillStyle = hypoxiaGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle throbbing ocular capillaries around peripheral vision during choke
      if (squeeze > 0.12 || hypoxia > 0.25) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.55, squeeze * 0.45 + hypoxia * 0.25) * plateFadeOut;
        ctx.strokeStyle = 'rgba(127, 29, 29, 0.72)';
        ctx.lineWidth = 1.4;
        for (let v = 0; v < 12; v += 1) {
          const ang = (v * Math.PI * 2) / 12 + 0.15;
          const rStart = width * 0.56;
          const rEnd = rStart - (85 + squeeze * 55 + hypoxia * 40);
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ang) * rStart, cy + Math.sin(ang) * rStart);
          ctx.quadraticCurveTo(
            cx + Math.cos(ang + 0.08) * ((rStart + rEnd) * 0.5),
            cy + Math.sin(ang + 0.08) * ((rStart + rEnd) * 0.5),
            cx + Math.cos(ang - 0.04) * rEnd,
            cy + Math.sin(ang - 0.04) * rEnd
          );
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // 5. Abrupt Photochemical Ambush Flash (p < 0.14) & Fallen Lantern Sparks
    if (p < 0.14) {
      const flashAlpha = (0.14 - p) / 0.14;
      const strobe = Math.sin(timeSec * 88) > 0 ? 0.58 : 0.2;
      ctx.fillStyle = `rgba(127, 17, 20, ${flashAlpha * 0.45})`;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = `rgba(231, 229, 228, ${flashAlpha * strobe * 0.68})`;
      ctx.fillRect(0, 0, width, height);
    }

    if (p > 0.08 && p < 0.54) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.72)';
      for (let i = 0; i < 10; i += 1) {
        const sx = cx - 90 + Math.cos(i * 0.85) * (p * 195);
        const sy = height * 0.82 + Math.sin(i * 1.1) * (p * 48);
        ctx.fillRect(sx, sy, 3, 3);
      }
    }

    // 6. Hairline Lens Fractures on Fatal Snap / Shear Impact (p > 0.46)
    if (p > 0.46) {
      const impactAge = p - 0.46;
      const crackAlpha = Math.max(0.14, Math.min(0.55, 0.55 - impactAge * 0.65));
      ctx.save();
      ctx.globalAlpha = crackAlpha;
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.36)';
      ctx.lineWidth = 1.1;
      const crackCenterX = cx + (dc.killerKind === 'tongue_warden' ? 0 : -14);
      const crackCenterY = cy + 4;
      for (let c = 0; c < 7; c += 1) {
        const ang = (c * Math.PI * 2) / 7 + 0.32;
        const len = 110 + (c % 3) * 75;
        ctx.beginPath();
        ctx.moveTo(crackCenterX, crackCenterY);
        ctx.lineTo(
          crackCenterX + Math.cos(ang) * len * 0.48,
          crackCenterY + Math.sin(ang) * len * 0.48 + 12
        );
        ctx.lineTo(
          crackCenterX + Math.cos(ang + 0.14) * len,
          crackCenterY + Math.sin(ang + 0.14) * len
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    // 7. Authentic Detention "亡" Death Card & Extinguished Lantern Aftermath (p > 0.56)
    if (p > 0.56) {
      const cardFade = Math.min(1, (p - 0.56) * 3.2);
      const burnGrad = ctx.createRadialGradient(cx, cy, width * 0.2, cx, cy, width * 0.68);
      burnGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      burnGrad.addColorStop(0.76, `rgba(105, 18, 12, ${cardFade * 0.32})`);
      burnGrad.addColorStop(1, `rgba(155, 52, 16, ${cardFade * 0.45})`);
      ctx.fillStyle = burnGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = cardFade;

      // Tipped extinguished brass oil lantern at bottom center with curling smoke
      const lanY = height * 0.82;
      ctx.save();
      ctx.translate(cx, lanY);
      ctx.rotate(-0.42);
      ctx.fillStyle = '#44403c';
      ctx.fillRect(-12, -8, 24, 16);
      ctx.fillStyle = '#78716c';
      ctx.fillRect(-14, 6, 28, 5);
      ctx.restore();
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.24)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx - 8, lanY - 12);
      ctx.bezierCurveTo(
        cx - 20 + Math.sin(timeSec * 2.4) * 8,
        lanY - 42,
        cx + 12 + Math.cos(timeSec * 2.1) * 9,
        lanY - 72,
        cx - 4,
        lanY - 108
      );
      ctx.stroke();

      // Atmospheric dark plate framing the Detention verdict
      const boxW = Math.min(680, width - 64);
      ctx.fillStyle = 'rgba(5, 2, 3, 0.84)';
      ctx.fillRect(cx - boxW * 0.5, height * 0.34, boxW, 148);
      ctx.strokeStyle = 'rgba(153, 27, 27, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - boxW * 0.5, height * 0.34, boxW, 148);

      // Vermilion carved ink-seal stamp (亡)
      ctx.fillStyle = 'rgba(153, 27, 27, 0.9)';
      ctx.fillRect(cx - 16, height * 0.36, 32, 32);
      ctx.strokeStyle = 'rgba(254, 202, 202, 0.55)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 14, height * 0.36 + 2, 28, 28);
      ctx.fillStyle = '#fef2f2';
      ctx.font = `700 17px ${FONT_SERIF}`;
      ctx.textAlign = 'center';
      ctx.fillText('亡', cx, height * 0.36 + 22);

      // Killer nameplate in clean Vietnamese-safe JetBrains Mono
      ctx.fillStyle = '#fca5a5';
      ctx.font = `700 12px ${FONT_MONO}`;
      ctx.fillText(dc.killerName.toUpperCase(), cx, height * 0.455);

      // Thin crimson divider rule
      ctx.fillStyle = 'rgba(220, 38, 38, 0.52)';
      ctx.fillRect(cx - 110, height * 0.47, 220, 1);

      // Crisp wrapped Vietnamese italic verdict using Noto Serif (zero split diacritics)
      ctx.fillStyle = '#fef3c7';
      ctx.font = `italic 18px ${FONT_SERIF}`;
      const wrapped = this.wrapCanvasLines(ctx, dc.storyWhisper, boxW - 56);
      const startY = wrapped.length > 1 ? height * 0.515 : height * 0.535;
      wrapped.slice(0, 2).forEach((line, idx) => {
        ctx.fillText(line, cx, startY + idx * 25);
      });

      ctx.restore();
    }
  }

  private drawExteriorVista(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camX: number,
    state: ThanhMinhState,
    timeSec: number,
    dt: number
  ): void {
    const isYin = state.realm === 'yin';
    const isDawn = state.ending === 'ending_4_dawn_coson';
    const isAshes = state.ending === 'ending_2_ashes';

    ctx.save();

    if (
      !isDawn &&
      (state.scene === 'flooded_courtyard' || state.scene === 'roof_belltower' || isYin)
    ) {
      const moonX = width * 0.78 - camX * 0.06;
      const moonY = height * 0.18;
      const moonGrad = ctx.createRadialGradient(moonX, moonY, 6, moonX, moonY, 76);
      moonGrad.addColorStop(0, isYin ? 'rgba(220, 38, 38, 0.55)' : 'rgba(203, 213, 225, 0.38)');
      moonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = moonGrad;
      ctx.fillRect(moonX - 80, moonY - 80, 160, 160);
    }

    ctx.fillStyle = isDawn ? '#5c4636' : isAshes ? '#2f0b08' : isYin ? '#210608' : '#0e151d';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.68);
    for (let x = 0; x <= width + 80; x += 64) {
      const ridge =
        Math.sin((x + camX * 0.14) * 0.007) * 44 + Math.cos((x + camX * 0.14) * 0.019) * 20;
      ctx.lineTo(x, height * 0.39 + ridge);
    }
    ctx.lineTo(width, height * 0.76);
    ctx.lineTo(0, height * 0.76);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isDawn ? '#3d2f24' : isAshes ? '#1d0605' : isYin ? '#140305' : '#090d12';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.72);
    for (let x = 0; x <= width + 40; x += 36) {
      const pine = Math.abs(Math.sin((x + camX * 0.25) * 0.06)) * 22;
      ctx.lineTo(x, height * 0.54 - pine);
    }
    ctx.lineTo(width, height * 0.76);
    ctx.lineTo(0, height * 0.76);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isDawn ? '#665042' : isYin ? '#55090d' : '#2e1013';
    ctx.fillRect(0, height * 0.64, width, height * 0.14);
    ctx.strokeStyle = isYin ? 'rgba(248, 113, 113, 0.24)' : 'rgba(180, 90, 90, 0.18)';
    ctx.lineWidth = 1.5;
    for (let wx = 0; wx < width; wx += 90) {
      const wy = height * 0.67 + Math.sin(timeSec * 2.4 + wx * 0.05) * 3;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + 42, wy);
      ctx.stroke();
    }

    if (state.scene === 'classroom_12b' || state.scene === 'flooded_courtyard') {
      ctx.fillStyle = '#1b1410';
      ctx.fillRect(width * 0.14, height * 0.59, 68, 12);
      ctx.fillRect(width * 0.72, height * 0.59, 62, 12);
    }

    if (!isDawn && !isAshes && state.scene !== 'darkroom') {
      ctx.lineWidth = 1;
      for (const d of this.rainDrops) {
        d.x -= d.speed * 0.24 * dt;
        d.y += d.speed * dt;
        if (d.y > height * 0.78) {
          d.y = -24;
          d.x = Math.random() * (width + 180);
        }
        ctx.strokeStyle = isYin
          ? `rgba(215, 65, 70, ${d.alpha})`
          : `rgba(186, 206, 226, ${d.alpha})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 5, d.y + d.len);
        ctx.stroke();
      }
    }

    if (this.lightningFlash > 0) {
      // Jagged storm lightning fork across mountain ridge
      ctx.strokeStyle = `rgba(218, 234, 255, ${this.lightningFlash * 0.92})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      const boltX = width * 0.28 + Math.sin(timeSec * 7) * 20;
      ctx.moveTo(boltX, 0);
      ctx.lineTo(boltX - 18, height * 0.14);
      ctx.lineTo(boltX + 12, height * 0.24);
      ctx.lineTo(boltX - 8, height * 0.42);
      ctx.stroke();

      ctx.fillStyle = `rgba(218, 234, 255, ${this.lightningFlash * 0.55})`;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }

  private drawRoomArchitecture(
    ctx: CanvasRenderingContext2D,
    height: number,
    floorY: number,
    state: ThanhMinhState,
    timeSec: number,
    dt: number
  ): void {
    const meta = SCENE_META[state.scene];
    const roomW = meta.maxX + 180;
    const viewLeft = Math.max(0, this.camX - 180);
    const viewRight = Math.min(roomW, this.camX + this.viewWidth + 180);
    const viewW = Math.max(1, viewRight - viewLeft);
    const isYin = state.realm === 'yin';
    const isCourtyard = state.scene === 'flooded_courtyard';
    const isRooftop = state.scene === 'roof_belltower';
    const isOffice = state.scene === 'teachers_office';
    const isInfirmary = state.scene === 'infirmary_wing';
    const isLibrary = state.scene === 'library_archive';
    const isAuditorium = state.scene === 'auditorium';
    const isMusicRoom = state.scene === 'music_classroom';
    const isPrison = state.scene === 'prison_cells';
    const is1986 = state.scene === 'ruined_hall_1986';
    const isDarkroom = state.scene === 'darkroom';
    const isDorm = state.scene === 'dorm_hall';

    if (isRooftop) {
      // Storm-swept concrete rooftop parapet balustrade above crimson flood valley
      ctx.fillStyle = isYin ? '#270a0d' : '#24292e';
      ctx.fillRect(viewLeft, floorY - 58, viewW, 10);
      for (let bx = 30; bx < viewRight; bx += 54) {
        if (bx + 20 < viewLeft) continue;
        ctx.fillStyle = isYin ? '#380e12' : '#2c3338';
        ctx.fillRect(bx, floorY - 48, 14, 48);
      }
      ctx.fillStyle = isYin ? '#140507' : '#161a1e';
      ctx.fillRect(viewLeft, floorY - 8, viewW, 8);
    } else if (!isCourtyard) {
      // A. Detention 1960s Institutional Upper Plaster Wall (Desaturated Olive/Sepia in Yang; Bleached Bone/Ink in Yin)
      const wallGrad = ctx.createLinearGradient(0, height * 0.14, 0, height * 0.56);
      if (isDarkroom) {
        wallGrad.addColorStop(0, '#2a0709');
        wallGrad.addColorStop(1, '#170405');
      } else if (isYin) {
        wallGrad.addColorStop(0, '#6b655a');
        wallGrad.addColorStop(0.55, '#46413b');
        wallGrad.addColorStop(1, '#262120');
      } else if (is1986) {
        wallGrad.addColorStop(0, '#2b3329');
        wallGrad.addColorStop(1, '#1a211b');
      } else if (isInfirmary) {
        wallGrad.addColorStop(0, '#3a4239');
        wallGrad.addColorStop(1, '#272d28');
      } else {
        wallGrad.addColorStop(0, '#3e3a2f');
        wallGrad.addColorStop(0.6, '#2d2b24');
        wallGrad.addColorStop(1, '#1f1e1a');
      }
      ctx.fillStyle = wallGrad;
      ctx.fillRect(viewLeft, height * 0.14, viewW, height * 0.42);

      // Ceiling beam & heavy overhanging cornice shadow
      ctx.fillStyle = isDarkroom ? '#1a0304' : isYin ? '#120f0f' : '#141311';
      ctx.fillRect(viewLeft, 0, viewW, height * 0.16);
      ctx.fillStyle = isYin ? '#7f1d1d' : '#291f17';
      ctx.fillRect(viewLeft, height * 0.148, viewW, 6);

      // B. Lower Institutional Dado Wainscoting (Jade-Teal Painted Tile / Dark Timber)
      const dadoGrad = ctx.createLinearGradient(0, height * 0.56, 0, floorY);
      if (isDarkroom) {
        dadoGrad.addColorStop(0, '#1e0507');
        dadoGrad.addColorStop(1, '#100203');
      } else if (isYin) {
        dadoGrad.addColorStop(0, '#2c1012');
        dadoGrad.addColorStop(1, '#140607');
      } else if (is1986) {
        dadoGrad.addColorStop(0, '#1a2721');
        dadoGrad.addColorStop(1, '#101815');
      } else {
        dadoGrad.addColorStop(0, '#1e322d');
        dadoGrad.addColorStop(0.5, '#172723');
        dadoGrad.addColorStop(1, '#0e1916');
      }
      ctx.fillStyle = dadoGrad;
      ctx.fillRect(viewLeft, height * 0.56, viewW, floorY - height * 0.56);

      // Institutional ceramic tile grid lines along lower dado (batched single path, viewport culled)
      if (!isDarkroom && !isAuditorium) {
        ctx.strokeStyle = isYin ? 'rgba(153, 27, 27, 0.24)' : 'rgba(10, 18, 16, 0.42)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let ty = height * 0.56; ty < floorY; ty += 22) {
          ctx.moveTo(viewLeft, ty);
          ctx.lineTo(viewRight, ty);
        }
        const txStart = Math.floor(viewLeft / 38) * 38;
        for (let tx = txStart; tx < viewRight; tx += 38) {
          ctx.moveTo(tx, height * 0.56);
          ctx.lineTo(tx, floorY);
        }
        ctx.stroke();
      }

      // Chair-rail timber molding separating plaster wall & dado
      ctx.fillStyle = isYin ? '#3f1215' : '#2d2016';
      ctx.fillRect(viewLeft, height * 0.552, viewW, 8);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(viewLeft, height * 0.566, viewW, 4);

      // Hand-collaged Detention rice-paper texture overlay across visible viewport walls only
      const paperPat = this.ensurePaperTexturePattern(ctx);
      if (paperPat) {
        ctx.save();
        ctx.globalAlpha = isYin ? 0.48 : 0.32;
        ctx.fillStyle = paperPat;
        ctx.fillRect(viewLeft, height * 0.14, viewW, floorY - height * 0.14);
        ctx.restore();
      }

      // C. Architectural Bays, Peeling Plaster, Cracked Brick, Wooden Louver Windows & Moon/Rain Shafts
      for (let x = 40; x < viewRight; x += 220) {
        if (x + 220 < viewLeft) continue;
        const skew = isDorm ? Math.sin(x * 0.02 + timeSec * 0.6) * 5 : 0;

        // Vertical structural timber pilaster with paper-cutout shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
        ctx.fillRect(x + 42, height * 0.14 + skew, 9, floorY - height * 0.14);
        ctx.fillStyle = isDarkroom
          ? '#160405'
          : isYin
            ? '#1d1616'
            : is1986
              ? '#141914'
              : '#1b1611';
        ctx.fillRect(x, height * 0.14 + skew, 44, floorY - height * 0.14);

        // Exposed cracked red brick & damp water-leak plaster blotches
        ctx.fillStyle = isYin ? 'rgba(135, 18, 22, 0.46)' : 'rgba(92, 42, 34, 0.48)';
        ctx.fillRect(x + 12, height * 0.34, 18, 26);
        ctx.fillRect(x + 210, height * 0.44, 24, 16);
        ctx.fillStyle = isYin ? 'rgba(105, 10, 14, 0.5)' : 'rgba(12, 16, 15, 0.42)';
        ctx.fillRect(x + 6, height * 0.15, 8, 150 + (x % 48));
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.62)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(x + 28, height * 0.18);
        ctx.lineTo(x + 18, height * 0.31);
        ctx.lineTo(x + 32, height * 0.44);
        ctx.lineTo(x + 22, height * 0.56);
        ctx.stroke();

        // Corner ceiling cobwebs
        ctx.strokeStyle = 'rgba(220, 218, 206, 0.16)';
        for (let w = 0; w < 4; w += 1) {
          ctx.beginPath();
          ctx.moveTo(x + 44, height * 0.16);
          ctx.quadraticCurveTo(x + 62 + w * 4, height * 0.19 + w * 4, x + 76 + w * 5, height * 0.16);
          ctx.stroke();
        }

        // Swaying dying tungsten bulb hanging from ceiling every other bay
        if (!isDarkroom && (x / 220) % 2 === 1) {
          const swing = Math.sin(timeSec * 1.9 + x) * 0.08;
          const bulbFlicker = Math.sin(timeSec * 31 + x) > 0.88 ? 0.14 : 0.55;
          ctx.save();
          ctx.translate(x + 130, height * 0.15);
          ctx.rotate(swing);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 34);
          ctx.stroke();
          ctx.fillStyle = isYin
            ? `rgba(239, 68, 68, ${bulbFlicker})`
            : `rgba(253, 224, 128, ${bulbFlicker})`;
          ctx.beginPath();
          ctx.arc(0, 36, 4.2, 0, Math.PI * 2);
          ctx.fill();
          const cone = ctx.createRadialGradient(0, 36, 2, 0, 105, 130);
          cone.addColorStop(
            0,
            isYin ? `rgba(220, 38, 38, ${bulbFlicker * 0.28})` : `rgba(253, 224, 138, ${bulbFlicker * 0.3})`
          );
          cone.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = cone;
          ctx.fillRect(-120, 30, 240, 175);
          ctx.restore();
        }

        // Iconic 1960s Recessed Wooden Casement & Louver Storm Windows (Cửa sổ chớp gỗ Cô Sơn)
        if (!isDarkroom && !isPrison) {
          const winX = x + 56;
          const winY = height * 0.175 + skew;
          const winW = 148;
          const winH = height * 0.345;
          const transH = 52;

          // Outer recessed wall reveal shadow + weathered wooden casing
          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          ctx.fillRect(winX - 6, winY - 4, winW + 12, winH + 14);

          // Deep stormy night exterior glass backdrop
          const skyGrad = ctx.createLinearGradient(winX, winY, winX, winY + winH);
          if (isYin) {
            skyGrad.addColorStop(0, '#1a0406');
            skyGrad.addColorStop(1, '#31090e');
          } else {
            skyGrad.addColorStop(0, this.lightningFlash > 0.1 ? '#334155' : '#090e12');
            skyGrad.addColorStop(1, this.lightningFlash > 0.1 ? '#1e293b' : '#131d21');
          }
          ctx.fillStyle = skyGrad;
          ctx.fillRect(winX, winY, winW, winH);

          // Distant & mid-ground misty mountain pines swaying outside glass
          ctx.fillStyle = isYin ? '#29070b' : '#0b1214';
          ctx.beginPath();
          ctx.moveTo(winX, winY + winH);
          ctx.lineTo(winX + 28, winY + winH * 0.55);
          ctx.lineTo(winX + 64, winY + winH * 0.78);
          ctx.lineTo(winX + 102, winY + winH * 0.42);
          ctx.lineTo(winX + 132, winY + winH * 0.65);
          ctx.lineTo(winX + winW, winY + winH);
          ctx.closePath();
          ctx.fill();

          // Swaying rain-soaked tree branch shadow pressed behind lower glass pane
          const branchSway = Math.sin(timeSec * 2.2 + x * 0.03) * 6;
          ctx.strokeStyle = 'rgba(4, 6, 8, 0.78)';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(winX, winY + winH * 0.75);
          ctx.quadraticCurveTo(winX + 48, winY + winH * 0.58 + branchSway, winX + 94, winY + winH * 0.44 + branchSway);
          ctx.stroke();

          // Rain streaks sliding diagonally down weathered window glass
          ctx.save();
          ctx.beginPath();
          ctx.rect(winX + 4, winY + transH + 6, winW - 8, winH - transH - 10);
          ctx.clip();
          ctx.strokeStyle = isYin ? 'rgba(252, 165, 165, 0.18)' : 'rgba(203, 213, 225, 0.16)';
          ctx.lineWidth = 1;
          for (let r = 0; r < 9; r += 1) {
            const rx = winX + 12 + r * 15;
            const ry = winY + transH + 8 + ((timeSec * (58 + (r % 3) * 18) + r * 29) % (winH - transH));
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 4, ry + 13);
            ctx.stroke();
          }
          // Subtle aged glass corner dust & condensation frost
          const glassGrime = ctx.createRadialGradient(
            winX + winW * 0.5,
            winY + transH + (winH - transH) * 0.5,
            12,
            winX + winW * 0.5,
            winY + transH + (winH - transH) * 0.5,
            winW * 0.65
          );
          glassGrime.addColorStop(0, 'rgba(200, 215, 210, 0.04)');
          glassGrime.addColorStop(1, 'rgba(6, 8, 10, 0.44)');
          ctx.fillStyle = glassGrime;
          ctx.fillRect(winX, winY + transH, winW, winH - transH);
          ctx.restore();

          // Diagonal eerie light shaft falling across floorboards
          const shaftAlpha = (isYin ? 0.06 : 0.05) + this.lightningFlash * 0.2;
          const beamGrad = ctx.createLinearGradient(x + 120, winY, x + 36, floorY);
          beamGrad.addColorStop(
            0,
            isYin ? `rgba(220, 45, 55, ${shaftAlpha * 1.4})` : `rgba(196, 214, 212, ${shaftAlpha})`
          );
          beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(winX + 4, winY + transH);
          ctx.lineTo(winX + winW - 4, winY + transH);
          ctx.lineTo(x + 120, floorY);
          ctx.lineTo(x - 20, floorY);
          ctx.closePath();
          ctx.fill();

          // Upper transom slanted 3D beveled wooden louver slats
          for (let ly = winY + 8; ly < winY + transH - 2; ly += 8.5) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.fillRect(winX + 3, ly + 4, winW - 6, 2.5);
            ctx.fillStyle = isYin ? '#321417' : '#35251a';
            ctx.fillRect(winX + 3, ly, winW - 6, 4.5);
          }

          // Divided 2x2 wooden casement mullions + rusted latch + deep projecting wooden windowsill
          const woodCol = isYin ? '#2a1214' : '#2a1d14';
          ctx.fillStyle = woodCol;
          ctx.fillRect(winX, winY + transH, winW, 8);
          ctx.fillRect(winX + winW * 0.5 - 3.5, winY, 7, winH);
          ctx.fillRect(winX, winY + transH + (winH - transH) * 0.52, winW, 5);
          ctx.strokeStyle = isYin ? '#42161a' : '#3d2c1e';
          ctx.lineWidth = 5;
          ctx.strokeRect(winX, winY, winW, winH);
          // Tarnished window center lock latch
          ctx.fillStyle = '#78716c';
          ctx.fillRect(winX + winW * 0.5 - 2, winY + winH * 0.72, 4, 10);
          // Projecting timber windowsill ledge & shadow beneath
          ctx.fillStyle = isYin ? '#381519' : '#3b291c';
          ctx.fillRect(winX - 7, winY + winH - 2, winW + 14, 7);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          ctx.fillRect(winX - 5, winY + winH + 5, winW + 10, 5);
        }

        if (is1986) {
          ctx.fillStyle = 'rgba(46, 82, 56, 0.62)';
          ctx.fillRect(x + 4, height * 0.14, 14, 92 + (x % 60));
          ctx.fillRect(x + 30, height * 0.14, 10, 68 + (x % 40));
          ctx.strokeStyle = 'rgba(62, 104, 72, 0.65)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 130, height * 0.14);
          ctx.quadraticCurveTo(
            x + 130 + Math.sin(timeSec * 1.3 + x) * 14,
            height * 0.34,
            x + 126 + Math.sin(timeSec * 1.5 + x) * 18,
            height * 0.52
          );
          ctx.stroke();
        }
      }

      if (!isDarkroom && !is1986) {
        const uncanny = isYin || state.sanity < 70 || state.activePhantomX !== null;
        for (let x = 160; x < viewRight; x += 310) {
          if (x + 120 < viewLeft) continue;
          ctx.save();
          ctx.translate(x, height * 0.21);
          ctx.rotate(Math.sin(timeSec * 1.4 + x) * 0.04);
          ctx.fillStyle = isYin ? '#6b1218' : '#581f1b';
          ctx.fillRect(-44, 0, 88, 30);
          ctx.strokeStyle = 'rgba(20, 12, 10, 0.7)';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(-44, 0, 88, 30);
          ctx.fillStyle = 'rgba(235, 225, 205, 0.8)';
          ctx.font = `bold 10px ${FONT_SERIF}`;
          ctx.textAlign = 'center';
          ctx.fillText(uncanny ? 'ĐỪNG QUAY LẠI' : isOffice ? 'TÔN SƯ TRỌNG ĐẠO' : 'TỰ KIỂM ĐIỂM', 0, 19);
          ctx.restore();

          ctx.save();
          ctx.translate(x + 95, height * 0.15);
          ctx.rotate(Math.sin(timeSec * 2.1 + x) * 0.09);
          ctx.fillStyle = isYin ? 'rgba(210, 180, 180, 0.58)' : 'rgba(232, 224, 205, 0.66)';
          ctx.fillRect(-5, 0, 10, 50);
          ctx.restore();
        }
      }
    }

    // Teachers' Office bookshelves & hanging calligraphy scroll spread across expanded 1640px room
    if (isOffice) {
      for (const sx of [250, 520, 860, 1140, 1460]) {
        ctx.fillStyle = '#241811';
        ctx.fillRect(sx - 44, floorY - 196, 88, 196);
        ctx.strokeStyle = '#3b281c';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx - 44, floorY - 196, 88, 196);
        for (let sy = floorY - 160; sy < floorY - 24; sy += 38) {
          ctx.fillStyle = '#150d08';
          ctx.fillRect(sx - 38, sy, 76, 6);
          for (let b = 0; b < 6; b += 1) {
            ctx.fillStyle = b % 2 === 0 ? '#443225' : '#31231b';
            ctx.fillRect(sx - 35 + b * 12, sy - 22, 9, 22);
          }
        }
      }
      ctx.fillStyle = '#d6ccb8';
      ctx.fillRect(618, height * 0.21, 44, 98);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(614, height * 0.21, 52, 5);
      ctx.fillRect(614, height * 0.21 + 96, 52, 6);
      ctx.font = `bold 12px ${FONT_SERIF}`;
      ctx.textAlign = 'center';
      ctx.fillText('清', 640, height * 0.21 + 36);
      ctx.fillText('明', 640, height * 0.21 + 66);
    }

    // Classroom 12B: Widened Blackboard (680) + Wooden Student Desks across 1680px
    if (state.scene === 'classroom_12b') {
      const eerieBoard = isYin || state.sanity < 70 || state.activePhantomX !== null;
      ctx.fillStyle = '#182b22';
      ctx.fillRect(570, height * 0.24, 230, 98);
      ctx.strokeStyle = '#4e3726';
      ctx.lineWidth = 4;
      ctx.strokeRect(570, height * 0.24, 230, 98);
      ctx.fillStyle = eerieBoard ? 'rgba(252, 165, 165, 0.88)' : 'rgba(226, 232, 240, 0.82)';
      ctx.font = `bold 12px ${FONT_SERIF}`;
      ctx.textAlign = 'center';
      ctx.fillText(eerieBoard ? 'NÓ ĐANG ĐỨNG SAU LƯNG' : 'ĐẢ ĐẢO TRÍ THỨC', 685, height * 0.32);
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(595, height * 0.27);
      ctx.lineTo(775, height * 0.39);
      ctx.moveTo(775, height * 0.27);
      ctx.lineTo(595, height * 0.39);
      ctx.stroke();

      // Neat & overturned 1960s desks spread down the widened classroom
      for (const dx of [350, 510, 880, 1280, 1430]) {
        ctx.fillStyle = '#2c1f16';
        ctx.fillRect(dx - 24, floorY - 38, 48, 7);
        ctx.fillRect(dx - 20, floorY - 31, 6, 31);
        ctx.fillRect(dx + 14, floorY - 31, 6, 31);
      }
      ctx.save();
      ctx.translate(970, floorY);
      ctx.rotate(-0.32);
      ctx.fillStyle = '#251a13';
      ctx.fillRect(-26, -34, 52, 8);
      ctx.fillRect(-20, -26, 6, 26);
      ctx.fillRect(14, -26, 6, 26);
      ctx.restore();
    }

    // Infirmary Wing: Iron Hospital Cots, Privacy Curtains & Red Cross Wall Plaque
    if (isInfirmary) {
      for (const cx of [360, 740, 1320]) {
        // Iron bed frame + crumpled olive wool blanket
        ctx.fillStyle = '#334155';
        ctx.fillRect(cx - 52, floorY - 46, 5, 46);
        ctx.fillRect(cx + 47, floorY - 36, 5, 36);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx - 50, floorY - 24, 100, 7);
        ctx.fillStyle = isYin ? '#3f1518' : '#3a463b';
        ctx.fillRect(cx - 46, floorY - 31, 90, 10);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(cx - 44, floorY - 37, 18, 7);
      }
      // Red Cross porcelain sign above cabinet
      ctx.fillStyle = '#d6cfc2';
      ctx.fillRect(996, height * 0.24, 48, 36);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(1016, height * 0.24 + 8, 8, 20);
      ctx.fillRect(1010, height * 0.24 + 14, 20, 8);
    }

    // Library Archive: Towering Double-Tier Bookshelves & Rolling Ladder
    if (isLibrary) {
      for (const lx of [240, 620, 1020, 1380]) {
        ctx.fillStyle = '#1f150f';
        ctx.fillRect(lx - 52, floorY - 225, 104, 225);
        ctx.strokeStyle = '#38251a';
        ctx.lineWidth = 2;
        ctx.strokeRect(lx - 52, floorY - 225, 104, 225);
        for (let sy = floorY - 190; sy < floorY - 20; sy += 34) {
          ctx.fillStyle = '#120b07';
          ctx.fillRect(lx - 46, sy, 92, 5);
          for (let b = 0; b < 7; b += 1) {
            ctx.fillStyle = b % 3 === 0 ? '#4d221f' : b % 2 === 0 ? '#3a2c20' : '#262b26';
            ctx.fillRect(lx - 42 + b * 12, sy - 20, 9, 20);
          }
        }
      }
      // Wooden library ladder leaning against shelves
      ctx.save();
      ctx.translate(780, floorY);
      ctx.rotate(-0.18);
      ctx.strokeStyle = '#4a3322';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-12, -210);
      ctx.moveTo(12, 0);
      ctx.lineTo(12, -210);
      for (let r = -24; r > -200; r -= 24) {
        ctx.moveTo(-12, r);
        ctx.lineTo(12, r);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Auditorium: Crimson Tattered Stage Curtains & Wooden Seating Rows
    if (isAuditorium) {
      for (const sx of [260, 560, 960, 1140, 1340]) {
        ctx.fillStyle = '#251a14';
        ctx.fillRect(sx - 24, floorY - 34, 48, 34);
        ctx.fillStyle = '#3d281e';
        ctx.fillRect(sx - 22, floorY - 46, 44, 12);
      }
      // Heavy crimson velvet curtains framing Puppet Stage around x = 1620
      ctx.fillStyle = isYin ? '#5e0a10' : '#4a1216';
      ctx.fillRect(1430, height * 0.14, 34, floorY - height * 0.14);
      ctx.fillRect(1776, height * 0.14, 34, floorY - height * 0.14);
      ctx.fillRect(1430, height * 0.14, 380, 32);
    }

    // Music Classroom: Chalkboard Staves + Scattered Wooden Music Stands
    if (isMusicRoom) {
      ctx.fillStyle = '#15251d';
      ctx.fillRect(420, height * 0.25, 210, 92);
      ctx.strokeStyle = '#4a3423';
      ctx.lineWidth = 4;
      ctx.strokeRect(420, height * 0.25, 210, 92);
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
      ctx.lineWidth = 1;
      for (let st = 0; st < 5; st += 1) {
        const sy = height * 0.29 + st * 8;
        ctx.beginPath();
        ctx.moveTo(435, sy);
        ctx.lineTo(615, sy);
        ctx.stroke();
      }
      for (const mx of [740, 1380]) {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(mx - 2, floorY - 58, 4, 58);
        ctx.fillRect(mx - 14, floorY - 62, 28, 12);
      }
    }

    // Prison Cells: Heavy Vertical Iron Cell Grates & Archways
    if (isPrison) {
      for (let cx = 220; cx < roomW - 140; cx += 310) {
        ctx.fillStyle = '#0d1014';
        ctx.fillRect(cx - 56, floorY - 196, 112, 196);
        ctx.fillStyle = '#334155';
        for (let bx = cx - 44; bx <= cx + 44; bx += 18) {
          ctx.fillRect(bx, floorY - 192, 5, 192);
        }
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx - 58, floorY - 200, 116, 10);
      }
    }

    if (isDarkroom) {
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, height * 0.22);
      ctx.lineTo(roomW - 60, height * 0.22);
      ctx.stroke();
      for (let fx = 160; fx < roomW - 140; fx += 140) {
        ctx.save();
        ctx.translate(fx + 17, height * 0.22);
        ctx.rotate(Math.sin(timeSec * 1.5 + fx) * 0.04);
        ctx.fillStyle = 'rgba(24, 4, 6, 0.92)';
        ctx.fillRect(-17, 0, 34, 68);
        ctx.strokeStyle = '#991b1b';
        ctx.strokeRect(-17, 0, 34, 68);
        ctx.fillStyle = 'rgba(254, 202, 202, 0.35)';
        ctx.beginPath();
        ctx.arc(0, 26, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      for (const lx of [280, 660, 1080, 1460]) {
        const bulbGrad = ctx.createRadialGradient(lx, height * 0.14, 4, lx, height * 0.14, 86);
        bulbGrad.addColorStop(0, 'rgba(239, 68, 68, 0.62)');
        bulbGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = bulbGrad;
        ctx.fillRect(lx - 86, height * 0.14 - 86, 172, 172);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(lx, height * 0.14, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (isCourtyard) {
      const waterGrad = ctx.createLinearGradient(0, floorY, 0, height);
      waterGrad.addColorStop(0, isYin ? '#1f080b' : '#131d24');
      waterGrad.addColorStop(1, '#06090e');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(viewLeft, floorY, viewW, height - floorY);
      ctx.strokeStyle = isYin ? 'rgba(220, 38, 38, 0.28)' : 'rgba(148, 163, 184, 0.28)';
      ctx.lineWidth = 1;
      for (let rx = 90; rx < viewRight; rx += 130) {
        if (rx + 40 < viewLeft) continue;
        const rad = 8 + ((timeSec * 22 + rx) % 26);
        ctx.beginPath();
        ctx.ellipse(rx, floorY + 26, rad, rad * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      const floorGrad = ctx.createLinearGradient(0, floorY, 0, height);
      floorGrad.addColorStop(0, isDarkroom ? '#170405' : isYin ? '#1b0709' : '#18130f');
      floorGrad.addColorStop(0.45, '#0b0807');
      floorGrad.addColorStop(1, '#040304');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(viewLeft, floorY, viewW, height - floorY);

      ctx.strokeStyle = isYin ? 'rgba(120, 18, 22, 0.45)' : 'rgba(72, 56, 44, 0.42)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const plankStart = Math.max(0, Math.floor(viewLeft / 68) * 68);
      for (let x = plankStart; x < viewRight + 68; x += 68) {
        ctx.moveTo(x, floorY);
        ctx.lineTo(x - 42, height);
      }
      ctx.stroke();
      ctx.fillStyle = isYin ? 'rgba(140, 20, 24, 0.1)' : 'rgba(148, 163, 184, 0.06)';
      for (let px = 110; px < viewRight; px += 220) {
        if (px + 60 < viewLeft) continue;
        ctx.beginPath();
        ctx.ellipse(px, floorY + 26, 48, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    void dt;
  }

  private drawFloorMist(
    ctx: CanvasRenderingContext2D,
    worldSpan: number,
    floorY: number,
    height: number,
    timeSec: number,
    isYin: boolean
  ): void {
    const viewLeft = Math.max(0, this.camX - 100);
    const viewRight = Math.min(worldSpan + 200, this.camX + this.viewWidth + 100);
    const mistGrad = ctx.createLinearGradient(0, floorY - 38, 0, floorY + 22);
    mistGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    mistGrad.addColorStop(
      0.6,
      isYin ? 'rgba(127, 29, 29, 0.14)' : 'rgba(148, 163, 184, 0.08)'
    );
    mistGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(viewLeft, floorY - 38, Math.max(1, viewRight - viewLeft), 62);

    // Slow drifting mist ribbons along floor
    ctx.fillStyle = isYin ? 'rgba(153, 27, 27, 0.08)' : 'rgba(203, 213, 225, 0.05)';
    for (let x = 0; x < worldSpan; x += 220) {
      const drift = (x + timeSec * 18) % worldSpan;
      if (drift + 100 < viewLeft || drift - 100 > viewRight) continue;
      ctx.beginPath();
      ctx.ellipse(drift, floorY - 4, 88, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    void height;
  }

  private drawCourtyardWaterReflections(
    ctx: CanvasRenderingContext2D,
    floorY: number,
    state: ThanhMinhState,
    timeSec: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.26;
    const wave = Math.sin(timeSec * 4) * 3;
    ctx.fillStyle = '#64748b';
    ctx.fillRect(1140 - 3 + wave, floorY + 2, 6, 86);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(state.playerX - 9 + wave, floorY + 4, 18, 56);
    const glow = ctx.createRadialGradient(
      state.playerX + state.playerFacing * 18,
      floorY + 24,
      2,
      state.playerX + state.playerFacing * 18,
      floorY + 24,
      36
    );
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
    glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(state.playerX - 40, floorY, 90, 60);
    ctx.restore();
  }

  private drawScenePropsAndHotspots(
    ctx: CanvasRenderingContext2D,
    floorY: number,
    state: ThanhMinhState,
    timeSec: number,
    dt: number
  ): void {
    const nearest = findNearbyHotspot(state);

    for (const hs of SCENE_HOTSPOTS) {
      if (hs.scene !== state.scene) continue;
      if (hs.realm !== 'both' && hs.realm !== state.realm) continue;
      if (hs.x + 170 < this.camX || hs.x - 170 > this.camX + this.viewWidth) continue;
      const isActive = nearest?.id === hs.id;

      ctx.save();
      ctx.translate(hs.x, floorY);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.44)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 44, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hs.kind === 'door' || hs.kind === 'illogical_door') {
        const locked = Boolean(
          (hs.requiredFlag && !state.flags[hs.requiredFlag]) ||
            (hs.requiredItem && !state.inventory.includes(hs.requiredItem))
        );
        // Deep doorway threshold step & outer 3D molded timber jamb (authentic tall 2.2m colonial school doorway)
        ctx.fillStyle = '#090706';
        ctx.fillRect(-47, -214, 94, 214);
        ctx.fillStyle = '#2b1e15';
        ctx.fillRect(-44, -210, 88, 210);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(-40, -204, 80, 204);

        // Weathered timber door leaf with wood grain & bevel shading
        const doorGrad = ctx.createLinearGradient(-38, -202, 38, 0);
        if (hs.kind === 'illogical_door') {
          doorGrad.addColorStop(0, '#3e181e');
          doorGrad.addColorStop(0.5, '#290f14');
          doorGrad.addColorStop(1, '#140709');
        } else {
          doorGrad.addColorStop(0, '#36261a');
          doorGrad.addColorStop(0.55, '#271b13');
          doorGrad.addColorStop(1, '#150e09');
        }
        ctx.fillStyle = doorGrad;
        ctx.fillRect(-38, -202, 76, 202);

        // Subtle vertical timber grain & hinge pins on left jamb
        ctx.strokeStyle = 'rgba(10, 6, 4, 0.45)';
        ctx.lineWidth = 1;
        for (let gx = -30; gx <= 30; gx += 12) {
          ctx.beginPath();
          ctx.moveTo(gx, -200);
          ctx.lineTo(gx, -2);
          ctx.stroke();
        }
        ctx.fillStyle = '#475569';
        ctx.fillRect(-38, -172, 4, 12);
        ctx.fillRect(-38, -48, 4, 12);

        // Upper frosted wire-glass door pane revealing dark corridor/red void behind
        ctx.fillStyle = hs.kind === 'illogical_door' ? '#240509' : '#0a0f12';
        ctx.fillRect(-27, -189, 54, 46);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -189);
        ctx.lineTo(0, -143);
        ctx.moveTo(-27, -166);
        ctx.lineTo(27, -166);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(72, 52, 38, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-27, -189, 54, 46);

        // Beveled lower recessed timber panels
        for (const [py, ph] of [
          [-128, 52],
          [-64, 52],
        ] as const) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.fillRect(-26, py, 52, ph);
          ctx.strokeStyle = 'rgba(87, 67, 52, 0.65)';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(-26, py, 52, ph);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.beginPath();
          ctx.moveTo(-25, py + ph - 1);
          ctx.lineTo(-25, py + 1);
          ctx.lineTo(25, py + 1);
          ctx.stroke();
        }

        // Tarnished brass escutcheon lockplate, keyhole & doorknob
        ctx.fillStyle = '#57432a';
        ctx.fillRect(21, -104, 9, 26);
        ctx.fillStyle = '#09090b';
        ctx.fillRect(24.5, -86, 2, 5);
        ctx.fillStyle = isActive ? '#fbbf24' : '#b45309';
        ctx.beginPath();
        ctx.arc(25.5, -96, 4.2, 0, Math.PI * 2);
        ctx.fill();

        // Peeling room nameplate plaque above door window
        ctx.fillStyle = '#d6cab2';
        ctx.fillRect(-19, -223, 38, 11);
        ctx.strokeStyle = '#3f2e21';
        ctx.lineWidth = 1;
        ctx.strokeRect(-19, -223, 38, 11);
        ctx.fillStyle = '#1c1917';
        ctx.font = `bold 6.5px ${FONT_MONO}`;
        ctx.textAlign = 'center';
        const tagText = hs.kind === 'illogical_door' ? 'CẤM' : hs.targetScene === 'teachers_office' ? 'GV' : hs.targetScene === 'infirmary_wing' ? 'Y TẾ' : 'CỬA';
        ctx.fillText(tagText, 0, -215.5);

        // Active frame highlight (subtle warm rim instead of harsh neon box)
        ctx.strokeStyle = isActive ? 'rgba(245, 158, 11, 0.78)' : '#3c2b1e';
        ctx.lineWidth = isActive ? 2 : 1.5;
        ctx.strokeRect(-38, -202, 76, 202);

        if (locked) {
          // Realistic nailed weathered barricade planks + torn crimson/yellow paper talisman seal
          for (const [ang, py] of [
            [-0.14, -122],
            [0.12, -74],
          ] as const) {
            ctx.save();
            ctx.translate(0, py);
            ctx.rotate(ang);
            ctx.fillStyle = '#3d281a';
            ctx.fillRect(-40, -6, 80, 12);
            ctx.strokeStyle = '#1a1009';
            ctx.lineWidth = 1;
            ctx.strokeRect(-40, -6, 80, 12);
            // Iron nail heads
            ctx.fillStyle = '#64748b';
            ctx.fillRect(-34, -1.5, 3, 3);
            ctx.fillRect(31, -1.5, 3, 3);
            ctx.restore();
          }
          // Hanging paper seal talisman & rusted padlock on handle
          ctx.fillStyle = '#d6b665';
          ctx.fillRect(-7, -110, 14, 34);
          ctx.fillStyle = '#991b1b';
          ctx.font = `bold 8px ${FONT_SERIF}`;
          ctx.textAlign = 'center';
          ctx.fillText('封', 0, -90);
          ctx.fillStyle = '#475569';
          ctx.fillRect(21, -86, 9, 10);
        }
      } else if (hs.kind === 'wuxing_altar') {
        const solved = Boolean(state.flags.wuxing_solved);
        ctx.fillStyle = '#331d14';
        ctx.fillRect(-48, -68, 96, 68);
        ctx.fillStyle = '#47281c';
        ctx.fillRect(-54, -74, 108, 10);
        ctx.fillStyle = '#1c120d';
        ctx.fillRect(-12, -118, 24, 44);
        ctx.fillStyle = solved ? '#f59e0b' : '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -124 + Math.sin(timeSec * 5) * 2, solved ? 8 : 4.5, 0, Math.PI * 2);
        ctx.fill();

        for (const w of this.smokeWisps) {
          w.y += w.vy * dt;
          w.x += Math.sin(timeSec * 2 + w.y * 0.08) * 10 * dt;
          if (w.y < -180) {
            w.y = -82;
            w.x = (Math.random() - 0.5) * 14;
          }
          ctx.fillStyle = solved
            ? `rgba(253, 230, 138, ${w.alpha * 0.85})`
            : `rgba(203, 213, 225, ${w.alpha * 0.55})`;
          ctx.beginPath();
          ctx.arc(w.x, w.y, w.radius * 0.65, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (hs.kind === 'flagpole_corpse') {
        // Steel Flagpole + Concrete Plinth + Detailed Inverted Corpse of Trương Vệ Quốc
        ctx.fillStyle = '#334155';
        ctx.fillRect(-30, -22, 60, 22);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-30, -22, 60, 22);
        const poleGrad = ctx.createLinearGradient(-6, 0, 6, 0);
        poleGrad.addColorStop(0, '#1e293b');
        poleGrad.addColorStop(0.5, '#64748b');
        poleGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = poleGrad;
        ctx.fillRect(-5, -275, 10, 255);

        const swing = Math.sin(timeSec * 1.9) * 0.05;
        ctx.save();
        ctx.translate(18, -220);
        ctx.rotate(swing);
        // Pulley rope bound around ankles
        ctx.strokeStyle = '#856547';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-16, -24);
        ctx.lineTo(0, 26);
        ctx.stroke();

        // Bound trousers/legs hanging upside-down
        ctx.fillStyle = '#1e242b';
        ctx.beginPath();
        ctx.moveTo(-7, 24);
        ctx.lineTo(7, 24);
        ctx.lineTo(11, 60);
        ctx.lineTo(-11, 60);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#090d12';
        ctx.fillRect(-6, 18, 12, 8);

        // Inverted 1960s Guard Tunic Torso + Dangling Crimson Armband
        const tunicGrad = ctx.createLinearGradient(-13, 60, 13, 106);
        tunicGrad.addColorStop(0, '#2c362e');
        tunicGrad.addColorStop(1, '#141a16');
        ctx.fillStyle = tunicGrad;
        ctx.beginPath();
        ctx.moveTo(-12, 58);
        ctx.lineTo(12, 58);
        ctx.lineTo(15, 104);
        ctx.lineTo(-15, 104);
        ctx.closePath();
        ctx.fill();

        // Slack dangling arms & torn red guard armband
        ctx.strokeStyle = '#242c26';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-13, 100);
        ctx.lineTo(-17, 130);
        ctx.moveTo(13, 100);
        ctx.lineTo(18, 128);
        ctx.stroke();
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(12, 104, 7, 12);

        // Pale inverted head with wet soaked hair & crumpled newspaper stuffed in mouth
        ctx.fillStyle = '#9ca3af';
        ctx.beginPath();
        ctx.ellipse(0, 117, 10.5, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(0, 124, 11, 0, Math.PI);
        ctx.fill();
        // Crumpled wet newspaper jutting from mouth
        ctx.fillStyle = '#d6d3d1';
        ctx.fillRect(-5, 110, 10, 7);

        // Dripping storm blood/water drop into flooded courtyard
        const drip = (timeSec * 1.2) % 1;
        ctx.fillStyle = `rgba(185, 28, 28, ${1 - drip * 0.7})`;
        ctx.beginPath();
        ctx.ellipse(0, 136 + drip * 72, 1.8, 3.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (hs.kind === 'lore') {
        const uncollected = Boolean(hs.loreId && !state.collectedLoreIds.includes(hs.loreId));
        // Distinct props per lore object
        if (hs.id === 'hs-12b-lore1') {
          // Chalk tray & folded note below blackboard
          ctx.fillStyle = '#3b281c';
          ctx.fillRect(-26, -34, 52, 6);
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(-10, -39, 10, 4);
        } else if (hs.id === 'hs-dorm-lore4') {
          // Dorm wooden bunk & red knitted scarf
          ctx.fillStyle = '#2d1e15';
          ctx.fillRect(-34, -54, 68, 54);
          ctx.fillStyle = '#991b1b';
          ctx.beginPath();
          ctx.ellipse(0, -56, 20, 7, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (hs.id === 'hs-dorm-lore5') {
          // Levitating bloodied torn accusation drafts in Yin realm
          for (let p = -1; p <= 1; p += 1) {
            ctx.save();
            ctx.translate(p * 14, -56 + Math.sin(timeSec * 3.4 + p) * 6);
            ctx.rotate(p * 0.25 + Math.sin(timeSec * 2 + p) * 0.1);
            ctx.fillStyle = '#d6c7b2';
            ctx.fillRect(-8, -11, 16, 22);
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(-5, -4, 10, 2);
            ctx.restore();
          }
        } else if (hs.id === 'hs-dark-lore7') {
          // Locked steel ledger cabinet with keyhole
          ctx.fillStyle = '#27272a';
          ctx.fillRect(-26, -86, 52, 86);
          ctx.strokeStyle = state.flags.darkroom_drawer_opened ? '#f59e0b' : '#52525b';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-22, -80, 44, 34);
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.arc(0, -63, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Small wooden stool/archive pile with weathered journal sheet
          ctx.fillStyle = '#2c2017';
          ctx.fillRect(-22, -32, 44, 32);
          ctx.fillStyle = '#e7dcc8';
          ctx.fillRect(-13, -36, 26, 5);
        }

        if (uncollected) {
          const glowR = 13 + Math.sin(timeSec * 4.2) * 3;
          const glint = ctx.createRadialGradient(0, -56, 1, 0, -56, glowR);
          glint.addColorStop(0, 'rgba(253, 224, 71, 0.92)');
          glint.addColorStop(1, 'rgba(253, 224, 71, 0)');
          ctx.fillStyle = glint;
          ctx.fillRect(-glowR, -56 - glowR, glowR * 2, glowR * 2);
        }
      } else if (hs.kind === 'memorial_1986') {
        // Mossy Qingming Stone Tablet + White Chrysanthemum + Tô Viễn (1986) NPC
        ctx.fillStyle = '#2c352f';
        ctx.beginPath();
        ctx.moveTo(-24, 0);
        ctx.lineTo(-19, -76);
        ctx.quadraticCurveTo(0, -88, 19, -76);
        ctx.lineTo(24, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#4d5c52';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Carved Qingming inscription on stone
        ctx.fillStyle = '#94a3b8';
        ctx.font = `bold 12px ${FONT_SERIF}`;
        ctx.textAlign = 'center';
        ctx.fillText('清明', 0, -48);
        ctx.font = `9px ${FONT_SERIF}`;
        ctx.fillText('1967', 0, -30);

        // White Qingming chrysanthemum blossoms at base of stone
        for (const fx of [-10, 0, 9]) {
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(fx, -8, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(fx, -8, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Tribute glow if player offered wine/spirit money
        if (state.flags.offered_qingming_tribute) {
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(-20, -14, 7, 6);
          const emberGlow = ctx.createRadialGradient(-16, -24, 1, -16, -24, 22);
          emberGlow.addColorStop(0, 'rgba(251, 191, 36, 0.85)');
          emberGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
          ctx.fillStyle = emberGlow;
          ctx.fillRect(-38, -46, 44, 44);
        }

        // Render Tô Viễn (1986) standing solemnly beside the memorial stone
        this.drawDetailedHuman(ctx, 38, 0, 1.0, {
          role: 'tovien',
          facing: -1,
          timeSec,
          alpha: 0.96,
        });
      } else if (hs.kind === 'radio') {
        ctx.fillStyle = '#2d251d';
        ctx.fillRect(-38, -56, 76, 56);
        ctx.fillStyle = '#5c4b37';
        ctx.fillRect(-28, -90, 56, 34);
        ctx.fillStyle = state.radioTunedAct2 ? '#f59e0b' : '#94a3b8';
        ctx.fillRect(-18, -78, 36, 8);
      } else if (hs.kind === 'darkroom_tray') {
        ctx.fillStyle = '#291616';
        ctx.fillRect(-44, -56, 88, 56);
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-34, -64, 68, 10);
        ctx.fillStyle = state.flags.act2_climax_seen ? '#fca5a5' : '#dc2626';
        ctx.fillRect(-16, -63, 32, 6);
      } else if (hs.kind === 'puppet_stage') {
        ctx.fillStyle = '#291712';
        ctx.fillRect(-76, -158, 152, 158);
        ctx.fillStyle = state.puppetsSolved ? '#fef3c7' : '#d6c7a9';
        ctx.fillRect(-62, -142, 124, 76);
        ctx.fillStyle = '#17110e';
        for (const px of [-34, -10, 14, 38]) {
          ctx.fillRect(px - 5, -106 + Math.sin(timeSec * 3 + px) * 2, 10, 32);
          ctx.beginPath();
          ctx.arc(px, -114 + Math.sin(timeSec * 3 + px) * 2, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (hs.kind === 'prison_crack') {
        ctx.fillStyle = '#141b26';
        ctx.fillRect(-50, -174, 100, 174);
        ctx.fillStyle = '#475569';
        for (let bx = -38; bx <= 38; bx += 19) {
          ctx.fillRect(bx, -170, 4.5, 168);
        }
        ctx.fillStyle = `rgba(251, 191, 36, ${0.55 + Math.sin(timeSec * 4) * 0.25})`;
        ctx.fillRect(-8, -82, 16, 6);
      } else if (hs.kind === 'mirror_1980') {
        ctx.fillStyle = '#332820';
        ctx.fillRect(-28, -142, 56, 92);
        ctx.fillStyle = '#53626e';
        ctx.fillRect(-22, -136, 44, 80);
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-20, -120);
        ctx.lineTo(12, -88);
        ctx.lineTo(-4, -64);
        ctx.stroke();
      } else if (hs.kind === 'clock_puzzle') {
        // Antique Grandfather Clock (02:15) + Locked Infirmary Medicine Cabinet
        ctx.fillStyle = '#241710';
        ctx.fillRect(-38, -172, 46, 172);
        ctx.strokeStyle = '#4a3222';
        ctx.lineWidth = 2;
        ctx.strokeRect(-38, -172, 46, 172);
        // Clock Face
        ctx.fillStyle = '#e7dcc4';
        ctx.beginPath();
        ctx.arc(-15, -142, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Hour & minute hands
        const hrAng = ((state.clockHour % 12) / 12) * Math.PI * 2 - Math.PI / 2;
        const minAng = (state.clockMinute / 60) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(-15, -142);
        ctx.lineTo(-15 + Math.cos(hrAng) * 8, -142 + Math.sin(hrAng) * 8);
        ctx.moveTo(-15, -142);
        ctx.lineTo(-15 + Math.cos(minAng) * 12, -142 + Math.sin(minAng) * 12);
        ctx.stroke();
        // Brass pendulum inside glass belly
        ctx.fillStyle = '#140c08';
        ctx.fillRect(-29, -114, 28, 74);
        const pendSwing = state.clockSolved ? Math.sin(timeSec * 3.1) * 8 : 0;
        ctx.strokeStyle = '#b45309';
        ctx.beginPath();
        ctx.moveTo(-15, -112);
        ctx.lineTo(-15 + pendSwing, -54);
        ctx.stroke();
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(-15 + pendSwing, -54, 5, 0, Math.PI * 2);
        ctx.fill();
        // Adjoining white medicine cabinet
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(16, -124, 34, 52);
        ctx.fillStyle = state.clockSolved ? '#f59e0b' : '#991b1b';
        ctx.fillRect(30, -108, 6, 18);
        ctx.fillRect(24, -102, 18, 6);
      } else if (hs.kind === 'bookshelf_cipher') {
        // Forbidden Library Secret Shelf with 3 Banned Books
        ctx.fillStyle = '#291a12';
        ctx.fillRect(-46, -162, 92, 162);
        ctx.strokeStyle = state.bookshelfSolved ? '#f59e0b' : '#4a3222';
        ctx.lineWidth = 2;
        ctx.strokeRect(-46, -162, 92, 162);
        ctx.fillStyle = '#140c08';
        ctx.fillRect(-38, -124, 76, 44);
        const spineColors = ['#991b1b', '#1e3a8a', '#b45309'];
        for (let i = 0; i < 3; i += 1) {
          const bookId = state.bookshelfOrder[i];
          ctx.fillStyle = spineColors[bookId] ?? '#57534e';
          ctx.fillRect(-28 + i * 22, -120, 14, 38);
          ctx.fillStyle = '#fef3c7';
          ctx.font = `bold 8px ${FONT_SERIF}`;
          ctx.textAlign = 'center';
          ctx.fillText(bookId === 0 ? 'I' : bookId === 1 ? 'II' : 'III', -21 + i * 22, -100);
        }
        if (state.bookshelfSolved) {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
          ctx.beginPath();
          ctx.arc(0, -142, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (hs.kind === 'piano_puzzle') {
        // Weathered 1960s Black Upright Parlor Piano + Sheet Music + Candle
        ctx.fillStyle = '#111113';
        ctx.fillRect(-58, -126, 116, 126);
        ctx.strokeStyle = '#332419';
        ctx.lineWidth = 2;
        ctx.strokeRect(-58, -126, 116, 126);
        // Music desk & torn sheet music
        ctx.fillStyle = '#e7dcc8';
        ctx.fillRect(-22, -112, 44, 24);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-16, -105, 32, 1.5);
        ctx.fillRect(-16, -98, 32, 1.5);
        // Ivory & ebony keyboard fallboard
        ctx.fillStyle = '#f5f0e6';
        ctx.fillRect(-52, -74, 104, 14);
        ctx.fillStyle = '#09090b';
        for (let k = -44; k < 44; k += 12) {
          ctx.fillRect(k, -74, 5, 8);
        }
        // Brass foot pedals
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-10, -8, 6, 5);
        ctx.fillRect(4, -8, 6, 5);
        // Warm wax candle on top
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(36, -140, 6, 14);
        ctx.fillStyle = state.pianoSolved ? '#fbbf24' : '#f97316';
        ctx.beginPath();
        ctx.arc(39, -144 + Math.sin(timeSec * 8) * 1, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (hs.kind === 'sanity_shrine') {
        const used = Boolean(state.flags[`shrine_${hs.id}`]);
        ctx.fillStyle = '#291c14';
        ctx.fillRect(-28, -46, 56, 46);
        ctx.fillStyle = '#57534e';
        ctx.fillRect(-10, -58, 20, 12);
        if (!used) {
          const glowR = 16 + Math.sin(timeSec * 5) * 3;
          const halo = ctx.createRadialGradient(0, -68, 2, 0, -68, glowR);
          halo.addColorStop(0, 'rgba(251, 191, 36, 0.92)');
          halo.addColorStop(1, 'rgba(251, 191, 36, 0)');
          ctx.fillStyle = halo;
          ctx.fillRect(-glowR, -68 - glowR, glowR * 2, glowR * 2);
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, -66, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (hs.kind === 'cipher_box') {
        // Teacher Trần Mặc's mahogany grading desk + 3-digit Thanh Minh keepsake lockbox
        ctx.fillStyle = '#2d1e15';
        ctx.fillRect(-46, -54, 92, 54);
        ctx.fillStyle = '#3f2b1e';
        ctx.fillRect(-52, -60, 104, 8);
        // Wooden keepsake box on desktop
        ctx.fillStyle = state.cipherSolved ? '#451a03' : '#291509';
        ctx.fillRect(-20, -76, 40, 16);
        ctx.strokeStyle = state.cipherSolved ? '#f59e0b' : '#b45309';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(-20, -76, 40, 16);
        // Brass 3-dial plate
        ctx.fillStyle = state.cipherSolved ? '#fef08a' : '#d97706';
        ctx.fillRect(-10, -71, 5, 6);
        ctx.fillRect(-2.5, -71, 5, 6);
        ctx.fillRect(5, -71, 5, 6);
        if (!state.cipherSolved) {
          const glowR = 11 + Math.sin(timeSec * 4) * 3;
          const glint = ctx.createRadialGradient(0, -82, 1, 0, -82, glowR);
          glint.addColorStop(0, 'rgba(251, 191, 36, 0.9)');
          glint.addColorStop(1, 'rgba(251, 191, 36, 0)');
          ctx.fillStyle = glint;
          ctx.fillRect(-glowR, -82 - glowR, glowR * 2, glowR * 2);
        }
      } else if (hs.kind === 'bronze_bell') {
        // Rooftop Heavy Timber Belltower A-Frame + Oxidized Cracked Bronze Bell
        ctx.fillStyle = '#291c13';
        ctx.fillRect(-56, -238, 12, 238);
        ctx.fillRect(44, -238, 12, 238);
        ctx.fillStyle = '#3b281c';
        ctx.fillRect(-66, -246, 132, 14);
        ctx.fillStyle = '#1c140e';
        ctx.fillRect(-62, -16, 124, 16);

        // Bell swing tied to bellRings & wind tremor
        const bellSwing =
          Math.sin(timeSec * (state.bellRings > 0 ? 3.2 + state.bellRings * 0.8 : 1.5)) *
          (0.03 + state.bellRings * 0.045);
        ctx.save();
        ctx.translate(0, -232);
        ctx.rotate(bellSwing);
        ctx.fillStyle = '#18181b';
        ctx.fillRect(-4, 0, 8, 26);

        const bellGrad = ctx.createLinearGradient(-32, 26, 32, 114);
        bellGrad.addColorStop(0, '#57534e');
        bellGrad.addColorStop(0.45, '#3f6212');
        bellGrad.addColorStop(1, '#292524');
        ctx.fillStyle = bellGrad;
        ctx.beginPath();
        ctx.moveTo(-22, 26);
        ctx.quadraticCurveTo(0, 18, 22, 26);
        ctx.quadraticCurveTo(31, 74, 38, 110);
        ctx.lineTo(-38, 110);
        ctx.quadraticCurveTo(-31, 74, -22, 26);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Jagged hairline bell crack + hanging rope
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(6, 52);
        ctx.lineTo(-2, 74);
        ctx.lineTo(8, 104);
        ctx.stroke();

        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(0, 112, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Harmonic chime progress pips (0..3) & acoustic ripple
        for (let r = 0; r < 3; r += 1) {
          ctx.fillStyle = r < state.bellRings ? '#fbbf24' : '#334155';
          ctx.beginPath();
          ctx.arc(-18 + r * 18, -26, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        if (state.bellRings > 0 && state.bellRings < 3) {
          const ringP = (timeSec * 1.4) % 1;
          ctx.strokeStyle = `rgba(251, 191, 36, ${(1 - ringP) * 0.45})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(0, -155, 42 + ringP * 65, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (hs.kind === 'interrogation_chair') {
        ctx.fillStyle = '#2a221c';
        ctx.fillRect(-22, -52, 44, 52);
        ctx.fillStyle = '#40342b';
        ctx.fillRect(-18, -94, 36, 42);
      } else {
        // Detailed 1960s weathered wooden table / cabinet + bespoke miniature artifact art
        ctx.fillStyle = '#1f150f';
        ctx.fillRect(-30, -48, 7, 48);
        ctx.fillRect(23, -48, 7, 48);
        ctx.fillStyle = '#291c13';
        ctx.fillRect(-26, -48, 52, 22);
        ctx.strokeStyle = '#140c08';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-22, -44, 44, 14);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-4, -38, 8, 2.5);
        // Table top plank overhang with wood rim
        ctx.fillStyle = '#3a271a';
        ctx.fillRect(-34, -52, 68, 6);

        const uncollected =
          (hs.kind === 'pickup' && hs.itemReward && !state.inventory.includes(hs.itemReward.id)) ||
          (hs.kind === 'keepsake' &&
            hs.keepsakeId &&
            !state.collectedKeepsakeIds.includes(hs.keepsakeId));

        if (uncollected) {
          const itemId = hs.itemReward?.id;
          if (itemId === 'incense_bundle') {
            // Red-paper wrapped bamboo incense sticks + gold joss paper packet (Vàng Mã)
            for (let s = -4; s <= 4; s += 2) {
              ctx.strokeStyle = '#a16207';
              ctx.lineWidth = 1.3;
              ctx.beginPath();
              ctx.moveTo(-9 + s * 0.6, -52);
              ctx.lineTo(-11 + s * 1.1, -70);
              ctx.stroke();
              ctx.fillStyle = '#dc2626';
              ctx.fillRect(-11.8 + s * 1.1, -72, 1.8, 3);
            }
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(-15, -62, 12, 10);
            // Gold joss paper stack beside incense
            ctx.fillStyle = '#ca8a04';
            ctx.fillRect(4, -59, 18, 7);
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(10, -58, 6, 5);
          } else if (itemId === 'teachers_key' || itemId === 'darkroom_key') {
            // Ornate brass/iron skeleton key + red cord & wooden key tag
            ctx.strokeStyle = itemId === 'darkroom_key' ? '#b91c1c' : '#d97706';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(-8, -58, 4.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = itemId === 'darkroom_key' ? '#cbd5e1' : '#f59e0b';
            ctx.fillRect(-4, -59, 15, 2.2);
            ctx.fillRect(6, -57, 2, 4);
            ctx.fillRect(10, -57, 2, 3);
            // Wooden room key tag
            ctx.fillStyle = '#78350f';
            ctx.fillRect(-20, -57, 8, 5);
          } else if (itemId === 'lantern_oil') {
            // Ribbed vintage glass kerosene bottle with amber oil & cork stopper
            ctx.fillStyle = '#57534e';
            ctx.fillRect(-2, -73, 4, 4);
            ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
            ctx.fillRect(-6, -69, 12, 17);
            ctx.fillStyle = '#d97706';
            ctx.fillRect(-5, -61, 10, 8);
            ctx.fillStyle = '#e7dcc8';
            ctx.fillRect(-4, -65, 8, 5);
            ctx.strokeStyle = 'rgba(241, 245, 249, 0.55)';
            ctx.lineWidth = 1;
            ctx.strokeRect(-6, -69, 12, 17);
          } else if (itemId === 'radio_battery') {
            // 1960s heavy twin-cell dry battery box with brass terminals
            ctx.fillStyle = '#7f1d1d';
            ctx.fillRect(-10, -68, 20, 16);
            ctx.fillStyle = '#d6d3d1';
            ctx.fillRect(-10, -61, 20, 4);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(-6, -71, 3, 3);
            ctx.fillRect(3, -71, 3, 3);
          } else if (itemId === 'bell_mallet') {
            // Carved dark wood temple mallet wrapped in crimson ritual cord
            ctx.save();
            ctx.translate(0, -56);
            ctx.rotate(-0.2);
            ctx.fillStyle = '#573b26';
            ctx.fillRect(-16, -2, 22, 4);
            ctx.fillStyle = '#3f2718';
            ctx.fillRect(4, -6, 11, 12);
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(-6, -2.5, 5, 5);
            ctx.restore();
          } else if (itemId === 'wine_cup') {
            // Pale celadon Qingming offering cup on dark lacquered tray
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(-10, -54, 20, 2.5);
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.moveTo(-6, -63);
            ctx.lineTo(6, -63);
            ctx.lineTo(4, -54);
            ctx.lineTo(-4, -54);
            ctx.closePath();
            ctx.fill();
          } else {
            // Keepsakes: open yellowed diary, tied scroll, tarnished bronze badge & fountain pen
            ctx.fillStyle = '#e7dcc4';
            ctx.fillRect(-14, -59, 16, 7);
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(-10, -58, 5, 2);
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.arc(10, -56, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#991b1b';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(6, -54);
            ctx.lineTo(14, -59);
            ctx.stroke();
          }

          // Subtle warm cross-sparkle glint above uncollected item
          const pulse = 0.55 + Math.sin(timeSec * 4.2) * 0.35;
          const glowR = 13 + Math.sin(timeSec * 4) * 2.5;
          const glint = ctx.createRadialGradient(0, -64, 1, 0, -64, glowR);
          glint.addColorStop(0, `rgba(253, 224, 71, ${0.42 * pulse})`);
          glint.addColorStop(1, 'rgba(253, 224, 71, 0)');
          ctx.fillStyle = glint;
          ctx.fillRect(-glowR, -64 - glowR, glowR * 2, glowR * 2);

          ctx.strokeStyle = `rgba(254, 240, 138, ${0.72 * pulse})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-5, -64);
          ctx.lineTo(5, -64);
          ctx.moveTo(0, -69);
          ctx.lineTo(0, -59);
          ctx.stroke();
        }
      }

      if (isActive && !state.deathCutscene?.active) {
        const bob = Math.sin(timeSec * 4.5) * 2.5;
        ctx.fillStyle = 'rgba(14, 11, 10, 0.94)';
        ctx.fillRect(-94, -214 + bob, 188, 25);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.25;
        ctx.strokeRect(-94, -214 + bob, 188, 25);
        ctx.fillStyle = '#fef3c7';
        ctx.font = `bold 11px ${FONT_SANS}`;
        ctx.textAlign = 'center';
        ctx.fillText('[E] Kiểm tra / Tương tác', 0, -197 + bob);
      }

      ctx.restore();
    }
  }

  private drawInterrogationDoppelganger(
    ctx: CanvasRenderingContext2D,
    floorY: number,
    timeSec: number
  ): void {
    ctx.save();
    ctx.translate(1235, floorY);

    // Overhead swinging interrogation lamp cone
    const lampGrad = ctx.createLinearGradient(0, -245, 0, 0);
    lampGrad.addColorStop(0, 'rgba(254, 240, 138, 0.28)');
    lampGrad.addColorStop(1, 'rgba(254, 240, 138, 0.04)');
    ctx.fillStyle = lampGrad;
    ctx.beginPath();
    ctx.moveTo(0, -245);
    ctx.lineTo(-108, 0);
    ctx.lineTo(108, 0);
    ctx.closePath();
    ctx.fill();

    // Detailed seated Lâm Tĩnh Doppelgänger behind wooden desk
    const tremble = Math.sin(timeSec * 31) > 0.94 ? 2.2 : 0;
    this.drawDetailedHuman(ctx, 44 + tremble, 0, 1.0, {
      role: 'doppelganger',
      facing: -1,
      timeSec,
      seated: true,
    });

    // Heavy wooden interrogation table + bloodstained confession sheet on top
    ctx.fillStyle = '#2b1e16';
    ctx.fillRect(-48, -56, 96, 56);
    ctx.fillStyle = '#3b291e';
    ctx.fillRect(-52, -62, 104, 8);
    ctx.fillStyle = '#e7dcc8';
    ctx.fillRect(-16, -65, 32, 4);
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-4, -65, 9, 2);
    ctx.restore();
  }

  // Atmospheric, Articulated 2.5D Psychological Horror Ghosts (Towering ~185-198px Realistic Chiaroscuro Rigs)
  private drawGhostEntity(
    ctx: CanvasRenderingContext2D,
    floorY: number,
    ghost: GhostEntity,
    state: ThanhMinhState,
    timeSec: number,
    isYin: boolean
  ): void {
    const dist = Math.abs(ghost.x - state.playerX);
    const proximity = Math.max(0, 1 - dist / 260);
    const dread = ghost.alerted ? Math.max(0.76, proximity) : proximity * 0.78;
    const isTwitch =
      Math.sin(timeSec * 31 + ghost.x * 0.13) > (ghost.alerted ? 0.8 : 0.92);
    const neckSnap = isTwitch ? Math.sin(timeSec * 73) * 0.42 : 0;
    const strideBob = Math.sin(timeSec * (ghost.alerted ? 4.4 : 2.3)) * 2.1;
    const crouchHunch = 0.1 + dread * 0.14;
    const lanternSide = state.playerX < ghost.x ? -1 : 1;
    const paperPat = this.ensurePaperTexturePattern(ctx);

    ctx.save();
    ctx.translate(ghost.x, floorY);

    // 1. Towering Distorted Wall Shadow Cast by Lâm Tĩnh's Lantern
    const shadowDir = Math.sign(ghost.x - state.playerX) || ghost.facing;
    const shadowReach = shadowDir * (48 + proximity * 64);
    const shadowAlpha = isYin ? 0.54 : 0.42 + proximity * 0.28;
    ctx.save();
    ctx.fillStyle = `rgba(2, 1, 4, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.quadraticCurveTo(
      shadowReach * 0.45,
      -175,
      shadowReach + Math.sin(timeSec * 3.1) * 9,
      ghost.kind === 'paper_hat' ? -330 : -295
    );
    ctx.lineTo(shadowReach + shadowDir * 28, -235);
    ctx.lineTo(shadowReach + shadowDir * (68 + dread * 32), -190 + Math.sin(timeSec * 5) * 10);
    ctx.lineTo(shadowReach + shadowDir * 28, -155);
    ctx.lineTo(30, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Cold Ground Fog + Dark Ash / Wet Blood Pool Shadow under Lingerer
    const groundShadow = ctx.createRadialGradient(0, 2, 4, 0, 2, 52);
    groundShadow.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
    groundShadow.addColorStop(0.6, 'rgba(32, 4, 7, 0.48)');
    groundShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = groundShadow;
    ctx.fillRect(-56, -12, 112, 28);

    const renderArticulatedGhost = (isAfterimage: boolean) => {
      ctx.save();
      if (isAfterimage) {
        const glitchX = Math.sin(timeSec * 41) * (ghost.alerted ? 9.5 : 5.0);
        const glitchY = Math.cos(timeSec * 33) * 3.0;
        ctx.translate(glitchX, glitchY);
        ctx.globalAlpha = ghost.alerted ? 0.42 : 0.24;
      }

      ctx.scale(ghost.facing, 1);

      const flowBack = -18 - Math.sin(timeSec * 4.2) * 5.5;
      const upperSway = Math.sin(timeSec * 2.1 + ghost.x * 0.02) * 2.6;

      // Gaunt Pale Exposed Bare Feet / Shriveled Ankles
      if (!isAfterimage) {
        ctx.fillStyle = '#474c54';
        ctx.fillRect(-8, -12, 4.2, 12);
        ctx.fillRect(5, -10, 4.2, 10);
      }

      // A. Tall Emaciated Detention Lingerer Funeral Coat / Shroud (-188px shoulder height)
      const shroudBaseGrad = ctx.createLinearGradient(-22, -194, 22, 0);
      if (isAfterimage) {
        shroudBaseGrad.addColorStop(0, '#7f1d1d');
        shroudBaseGrad.addColorStop(1, '#1a0406');
      } else if (isYin) {
        shroudBaseGrad.addColorStop(0, '#2e070b');
        shroudBaseGrad.addColorStop(0.55, '#130406');
        shroudBaseGrad.addColorStop(1, '#040102');
      } else {
        shroudBaseGrad.addColorStop(0, ghost.kind === 'tongue_warden' ? '#1c181d' : '#1b1f24');
        shroudBaseGrad.addColorStop(0.6, '#0c0e11');
        shroudBaseGrad.addColorStop(1, '#030406');
      }

      // Ragged trailing strips blowing behind in storm draft
      for (let r = 0; r < 3; r += 1) {
        const wave = Math.sin(timeSec * (4.6 + r) + r * 1.3) * (7 + r * 2.2);
        ctx.fillStyle = isAfterimage
          ? 'rgba(127, 29, 29, 0.35)'
          : r === 0
            ? 'rgba(10, 12, 16, 0.9)'
            : 'rgba(24, 18, 20, 0.72)';
        ctx.beginPath();
        ctx.moveTo(-13 + r * 4, -182 + r * 24);
        ctx.quadraticCurveTo(flowBack - r * 5 + wave * 0.5, -96, flowBack - 13 + wave, -6 - r * 3);
        ctx.lineTo(-4 + r * 5, -15);
        ctx.closePath();
        ctx.fill();
      }

      // Tall gaunt layered body silhouette
      ctx.fillStyle = shroudBaseGrad;
      ctx.beginPath();
      ctx.moveTo(-19 + upperSway, -188 + strideBob);
      ctx.quadraticCurveTo(21 + upperSway, -182 + strideBob, 21, -92);
      ctx.lineTo(25 + Math.sin(timeSec * 3.8) * 3.2, -5);
      ctx.quadraticCurveTo(10, -16, 2, -2);
      ctx.quadraticCurveTo(-11, -17, -25 + Math.cos(timeSec * 3.4) * 3.2, -5);
      ctx.lineTo(-22, -100);
      ctx.closePath();
      ctx.fill();

      // Tactile rice-paper / charcoal collage grain directly over shroud
      if (paperPat && !isAfterimage) {
        ctx.save();
        ctx.clip();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = paperPat;
        ctx.fillRect(-35, -200, 70, 205);
        ctx.restore();
      }

      if (!isAfterimage) {
        // Deep chiaroscuro vertical coat folds
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-6 + upperSway, -178 + strideBob);
        ctx.quadraticCurveTo(-11, -96, -13, -15);
        ctx.moveTo(7 + upperSway, -174 + strideBob);
        ctx.quadraticCurveTo(10, -90, 9, -15);
        ctx.stroke();

        // Harsh side lantern rim-light along edge facing player
        if (proximity > 0.1) {
          const rimX = lanternSide * ghost.facing > 0 ? 19 : -19;
          ctx.strokeStyle = isYin
            ? `rgba(220, 38, 38, ${proximity * 0.48})`
            : `rgba(251, 191, 36, ${proximity * 0.36})`;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(rimX, -178 + strideBob);
          ctx.quadraticCurveTo(rimX * 1.12, -92, rimX * 1.1, -14);
          ctx.stroke();
        }
      }

      const drawHollowSocketEye = (ex: number, ey: number, radius: number, crimson = false) => {
        ctx.fillStyle = '#030203';
        ctx.beginPath();
        ctx.ellipse(ex, ey, radius * 1.15, radius * 1.35, 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = crimson ? '#dc2626' : '#f1f5f9';
        ctx.beginPath();
        ctx.arc(ex + 0.8, ey, radius * 0.32, 0, Math.PI * 2);
        ctx.fill();
      };

      if (ghost.kind === 'paper_hat' && ghost.variant !== 'librarian_wraith') {
        // B. Gaunt Stretched Neck & Asymmetrical Sunken Skull + Tall Soiled Paper Cone Cap
        ctx.strokeStyle = isAfterimage ? '#7f1d1d' : '#4b5059';
        ctx.lineWidth = 4.6;
        ctx.beginPath();
        ctx.moveTo(2 + upperSway, -188 + strideBob);
        ctx.lineTo(7 + upperSway, -198 + strideBob);
        ctx.stroke();

        ctx.save();
        ctx.translate(7 + upperSway, -200 + strideBob);
        ctx.rotate(crouchHunch + neckSnap);

        const skullGrad = ctx.createRadialGradient(4, -2, 2, 0, 0, 19);
        skullGrad.addColorStop(0, isAfterimage ? '#991b1b' : '#9ca3af');
        skullGrad.addColorStop(0.58, isAfterimage ? '#450a0a' : '#3f444c');
        skullGrad.addColorStop(1, '#0d0e12');
        ctx.fillStyle = skullGrad;
        ctx.beginPath();
        ctx.moveTo(-11, -15);
        ctx.quadraticCurveTo(13, -17, 15, -2);
        ctx.quadraticCurveTo(13, 15, 2, 18);
        ctx.quadraticCurveTo(-12, 13, -11, -15);
        ctx.closePath();
        ctx.fill();

        // Hollow bruised socket + pinpoint unblinking staring eye + weeping blood streak
        drawHollowSocketEye(7.4, -3.5, 4.2, ghost.alerted);
        ctx.fillStyle = 'rgba(127, 29, 29, 0.88)';
        ctx.fillRect(6.4, 2, 1.8, 10);

        // Shadowed unhinged jaw with faint pale teeth slits
        ctx.fillStyle = '#050203';
        ctx.beginPath();
        ctx.ellipse(7.5, 10.5, 4.2, 6.2, 0, 0, Math.PI * 2);
        ctx.fill();
        if (!isAfterimage) {
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(5.5, 5.2, 1.4, 2.2);
          ctx.fillRect(8.2, 5.4, 1.4, 2.2);
          ctx.fillRect(6.5, 13.8, 1.4, 2.0);
        }

        // Clumping wet black hair strands hanging over brow & cheeks
        ctx.strokeStyle = '#050507';
        ctx.lineWidth = 1.6;
        for (const hx of [-6, -2, 2, 9]) {
          ctx.beginPath();
          ctx.moveTo(hx, -14);
          ctx.quadraticCurveTo(hx + Math.sin(timeSec * 4 + hx) * 2, 2, hx - 2, 17);
          ctx.stroke();
        }

        // Tall crumpled burial paper cone hat + smudged red ink stamp
        const capGrad = ctx.createLinearGradient(-16, -114, 16, -9);
        capGrad.addColorStop(0, isAfterimage ? '#7f1d1d' : '#a8a095');
        capGrad.addColorStop(0.7, isAfterimage ? '#450a0a' : '#6e675e');
        capGrad.addColorStop(1, '#2b2421');
        ctx.fillStyle = capGrad;
        ctx.beginPath();
        ctx.moveTo(-16, -10);
        ctx.lineTo(-2, -114);
        ctx.lineTo(3, -112);
        ctx.lineTo(16, -10);
        ctx.closePath();
        ctx.fill();
        if (paperPat && !isAfterimage) {
          ctx.save();
          ctx.clip();
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = paperPat;
          ctx.fillRect(-18, -116, 36, 110);
          ctx.restore();
        }

        const tagSwing = Math.sin(timeSec * 5.2) * 4.5;
        ctx.fillStyle = 'rgba(214, 211, 209, 0.72)';
        ctx.beginPath();
        ctx.moveTo(-14, -10);
        ctx.lineTo(-16 + tagSwing, 16);
        ctx.lineTo(-11 + tagSwing, 16);
        ctx.closePath();
        ctx.fill();

        if (!isAfterimage) {
          ctx.fillStyle = 'rgba(127, 29, 29, 0.9)';
          ctx.font = `bold 9px ${FONT_SERIF}`;
          ctx.textAlign = 'center';
          ctx.fillText('TỘI', 0, -40);
        }
        ctx.restore();

        // C. Scarred Wooden Guilt Placard hanging on frayed hemp rope
        ctx.strokeStyle = '#6b5740';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-6 + upperSway, -182);
        ctx.lineTo(-15, -162);
        ctx.moveTo(10 + upperSway, -182);
        ctx.lineTo(15, -162);
        ctx.stroke();
        ctx.fillStyle = isAfterimage ? '#450a0a' : '#4a3220';
        ctx.fillRect(-19, -163, 40, 21);
        ctx.strokeStyle = '#1f140d';
        ctx.lineWidth = 1;
        ctx.strokeRect(-19, -163, 40, 21);
        if (!isAfterimage) {
          ctx.fillStyle = '#09090b';
          ctx.font = `bold 7px ${FONT_SERIF}`;
          ctx.textAlign = 'center';
          ctx.fillText(ghost.placardText, 1, -150);
        }

        // D. Unnaturally Long Hanging & Lunging Skeletal Arm + Multi-Fingered Claws (Lingerer silhouette!)
        const armLift = dread * 0.92;
        const shoulderX = 5 + upperSway;
        const shoulderY = -172 + strideBob;
        const elbowX = shoulderX + 6 + armLift * 24;
        const elbowY = shoulderY + 52 - armLift * 36;
        const handX = elbowX + 8 + armLift * 28;
        const handY = elbowY + 54 - armLift * 36 + Math.sin(timeSec * 6) * 2.5;

        ctx.strokeStyle = isAfterimage ? '#7f1d1d' : '#16181d';
        ctx.lineWidth = 6.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(handX, handY);
        ctx.stroke();

        ctx.strokeStyle = isAfterimage ? '#991b1b' : '#717882';
        ctx.lineWidth = 1.6;
        for (let f = -1.5; f <= 1.5; f += 1) {
          ctx.beginPath();
          ctx.moveTo(handX, handY);
          ctx.lineTo(handX + 9 + armLift * 6, handY + f * 3.6 + 6);
          ctx.stroke();
        }
      } else if (ghost.variant === 'librarian_wraith') {
        // Thủ Thư Đốt Sách (~202px tall gaunt burnt scholar, cracked round spectacles, drifting embers)
        ctx.save();
        ctx.translate(5 + upperSway, -198 + strideBob);
        ctx.rotate(crouchHunch * 0.8 + neckSnap);
        const libFace = ctx.createRadialGradient(2, -2, 2, 0, 0, 17);
        libFace.addColorStop(0, isAfterimage ? '#991b1b' : '#afa798');
        libFace.addColorStop(0.68, isAfterimage ? '#450a0a' : '#3d3732');
        libFace.addColorStop(1, '#0e0c0c');
        ctx.fillStyle = libFace;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12.5, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        drawHollowSocketEye(5.5, -2.5, 3.8, true);
        // Cracked circular horn-rimmed glasses
        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.arc(5.5, -2.5, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#050203';
        ctx.beginPath();
        ctx.ellipse(5, 9, 3.8, 5.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (!isAfterimage) {
          for (let p = 0; p < 3; p += 1) {
            const ang = timeSec * 2.1 + (p * Math.PI * 2) / 3;
            const px = Math.cos(ang) * 26;
            const py = -142 + Math.sin(ang * 1.4) * 14;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(Math.sin(timeSec * 3 + p) * 0.4);
            ctx.fillStyle = '#cfc3ad';
            ctx.fillRect(-5, -7, 10, 14);
            ctx.fillStyle = '#7f1d1d';
            ctx.fillRect(-3, -2, 6, 2);
            ctx.restore();
          }
        }

        const libReach = dread * 0.85;
        const lShX = 4 + upperSway;
        const lShY = -170 + strideBob;
        const lHandX = lShX + 20 + libReach * 38;
        const lHandY = lShY + 78 - libReach * 52 + Math.sin(timeSec * 5.2) * 3;
        ctx.strokeStyle = isAfterimage ? '#7f1d1d' : '#181412';
        ctx.lineWidth = 5.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(lShX, lShY);
        ctx.lineTo(lShX + 10 + libReach * 18, lShY + 42 - libReach * 24);
        ctx.lineTo(lHandX, lHandY);
        ctx.stroke();
        ctx.strokeStyle = isAfterimage ? '#991b1b' : '#9ca3af';
        ctx.lineWidth = 1.5;
        for (let f = -1.5; f <= 1.5; f += 1) {
          ctx.beginPath();
          ctx.moveTo(lHandX, lHandY);
          ctx.lineTo(lHandX + 8 + libReach * 4, lHandY + f * 3.4 + 4);
          ctx.stroke();
        }
      } else if (ghost.variant === 'auditor_specter') {
        // Ác Linh Tự Vệ (~205px tall, violently 70° snapped neck, Red Guard cap, dented megaphone)
        if (!isAfterimage) {
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(-16 + upperSway, -166 + strideBob, 11, 16);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-14 + upperSway, -161 + strideBob, 7, 2.2);
        }

        ctx.save();
        ctx.translate(7 + upperSway, -202 + strideBob);
        ctx.rotate(0.72 + neckSnap * 0.6);
        const auditorFace = ctx.createRadialGradient(2, -2, 2, 0, 0, 18);
        auditorFace.addColorStop(0, isAfterimage ? '#991b1b' : '#9aa1ac');
        auditorFace.addColorStop(0.68, isAfterimage ? '#450a0a' : '#333a45');
        auditorFace.addColorStop(1, '#09090b');
        ctx.fillStyle = auditorFace;
        ctx.beginPath();
        ctx.ellipse(0, 0, 13.5, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        drawHollowSocketEye(6.2, -1.5, 3.8, true);

        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(0, -6, 14.5, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-5, -11, 22, 4.2);
        ctx.restore();

        const megaX = 18 + upperSway;
        const megaY = -172 + strideBob;
        ctx.fillStyle = isAfterimage ? '#7f1d1d' : '#475569';
        ctx.beginPath();
        ctx.moveTo(megaX - 7, megaY - 5.5);
        ctx.lineTo(megaX + 20, megaY - 13);
        ctx.lineTo(megaX + 20, megaY + 13);
        ctx.lineTo(megaX - 7, megaY + 5.5);
        ctx.closePath();
        ctx.fill();

        const armThrust = Math.sin(timeSec * (ghost.alerted ? 6 : 3)) * 5.5;
        ctx.strokeStyle = isAfterimage ? '#7f1d1d' : '#1e2420';
        ctx.lineWidth = 6.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0 + upperSway, -166 + strideBob);
        ctx.lineTo(14, -112);
        ctx.lineTo(24 + armThrust, -74);
        ctx.stroke();

        ctx.strokeStyle = isAfterimage ? '#991b1b' : '#4a321e';
        ctx.lineWidth = 4.6;
        ctx.beginPath();
        ctx.moveTo(24 + armThrust, -76);
        ctx.lineTo(42 + armThrust * 0.8, -2);
        ctx.stroke();
      } else {
        // Quỷ Sai Cắt Lưỡi (~208px tall stooped executioner, rusted iron collar & chain, snapping heavy tailor shears)
        const chainSwing = Math.sin(timeSec * 3.6) * 7.5;
        ctx.strokeStyle = isAfterimage ? '#7f1d1d' : '#574236';
        ctx.lineWidth = 2.8;
        ctx.setLineDash([4.5, 2.2]);
        ctx.beginPath();
        ctx.moveTo(-13, -132);
        ctx.quadraticCurveTo(-24 + chainSwing, -62, -20 + chainSwing * 1.2, -2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.save();
        ctx.translate(5 + upperSway, -204 + strideBob);
        ctx.rotate(crouchHunch * 0.85 + neckSnap);

        const wardenFaceGrad = ctx.createRadialGradient(3, -3, 2, 0, 0, 19);
        wardenFaceGrad.addColorStop(0, isAfterimage ? '#991b1b' : '#848a94');
        wardenFaceGrad.addColorStop(0.68, isAfterimage ? '#450a0a' : '#2e3138');
        wardenFaceGrad.addColorStop(1, '#0d0d10');
        ctx.fillStyle = wardenFaceGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 17.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Soaked execution blindfold + bleeding vertical slit over sunken eye
        ctx.fillStyle = '#080608';
        ctx.fillRect(-14, -10, 29, 7.5);
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(5.2, -4, 2.5, 14);
        drawHollowSocketEye(6.5, -5.5, 3.5, true);
        ctx.restore();

        const snipCycle = Math.sin(timeSec * (ghost.alerted ? 7.2 : 4.8));
        const thrust = Math.max(0, snipCycle) * (10 + dread * 12);
        const snipAngle = Math.abs(snipCycle) * 0.34;
        const shearPivotX = 22 + thrust;
        const shearPivotY = -132 + strideBob;

        ctx.strokeStyle = isAfterimage ? '#7f1d1d' : '#1f1215';
        ctx.lineWidth = 6.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(2 + upperSway, -172 + strideBob);
        ctx.lineTo(14, -148);
        ctx.lineTo(shearPivotX, shearPivotY);
        ctx.stroke();

        ctx.save();
        ctx.translate(shearPivotX, shearPivotY);
        for (const dir of [-1, 1] as const) {
          ctx.save();
          ctx.rotate(dir * snipAngle);
          const bladeGrad = ctx.createLinearGradient(0, 0, 52, 0);
          bladeGrad.addColorStop(0, '#334155');
          bladeGrad.addColorStop(0.7, '#94a3b8');
          bladeGrad.addColorStop(1, '#7f1d1d');
          ctx.fillStyle = isAfterimage ? '#7f1d1d' : bladeGrad;
          ctx.beginPath();
          ctx.moveTo(-2, 0);
          ctx.lineTo(52, dir * 6.8);
          ctx.lineTo(0, dir * 5.8);
          ctx.closePath();
          ctx.fill();
          if (!isAfterimage) {
            ctx.strokeStyle = 'rgba(241, 245, 249, 0.55)';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(0, dir * 1.2);
            ctx.lineTo(50, dir * 6.2);
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.restore();

        ctx.fillStyle = isAfterimage ? '#450a0a' : '#4a3220';
        ctx.fillRect(-19, -166, 40, 21);
        if (!isAfterimage) {
          ctx.fillStyle = '#09090b';
          ctx.font = `bold 7px ${FONT_SERIF}`;
          ctx.textAlign = 'center';
          ctx.fillText(ghost.placardText, 1, -153);
        }
      }

      ctx.restore();
    };

    if (isTwitch || ghost.alerted || proximity > 0.45) {
      renderArticulatedGhost(true);
    }
    renderArticulatedGhost(false);

    ctx.restore();
  }

  // Restrained peripheral apparition standing silently just outside direct oil-lantern gaze
  private drawPeripheralWatcher(
    ctx: CanvasRenderingContext2D,
    floorY: number,
    state: ThanhMinhState,
    timeSec: number
  ): void {
    if (state.activePhantomX === null) return;
    const isChild = state.activePhantomKind === 'shadow_child';
    const fade = Math.min(1, state.activePhantomTimer / 0.8);
    const facingPlayer: 1 | -1 = state.playerX >= state.activePhantomX ? 1 : -1;
    const twitch = Math.sin(timeSec * 37) > 0.94 ? 1.8 : 0;

    ctx.save();
    ctx.translate(state.activePhantomX + twitch, floorY);
    ctx.scale(facingPlayer * (isChild ? 0.82 : 1.08), isChild ? 0.82 : 1.08);
    ctx.globalAlpha = 0.72 * fade;

    // Gaunt silent silhouette in the gloom
    ctx.fillStyle = '#07060a';
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(-14, -158);
    ctx.quadraticCurveTo(0, -172, 14, -158);
    ctx.lineTo(18, 0);
    ctx.closePath();
    ctx.fill();

    // Faint pale oval face & tiny unblinking eyes staring from darkness
    ctx.fillStyle = 'rgba(203, 213, 225, 0.45)';
    ctx.beginPath();
    ctx.ellipse(2, -168, 9.5, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#030305';
    ctx.beginPath();
    ctx.ellipse(4.5, -170, 2.2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(248, 250, 252, 0.75)';
    ctx.beginPath();
    ctx.arc(4.8, -170, 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Lifelike 1960s–1980s Realistic Anatomical Human Rig Helper (7.2-head proportions)
  // Used for Lâm Tĩnh (Endings), Thầy Trần Mặc, Tô Dao, Tô Viễn (1986), & Interrogation Doppelgänger
  private drawDetailedHuman(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    opts: {
      role: 'linjing' | 'tranmac' | 'todao' | 'tovien' | 'doppelganger';
      facing: 1 | -1;
      timeSec: number;
      alpha?: number;
      seated?: boolean;
      kneeling?: boolean;
    }
  ): void {
    const breathe = Math.sin(opts.timeSec * 2.0 + x * 0.03) * 1.0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale * opts.facing, scale);
    ctx.globalAlpha = opts.alpha ?? 1;

    if (!opts.seated) {
      const groundShadow = ctx.createRadialGradient(0, 3, 2, 0, 3, 24);
      groundShadow.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      groundShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = groundShadow;
      ctx.beginPath();
      ctx.ellipse(0, 3, 23, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const baseLift = opts.kneeling ? 34 : 0;
    ctx.translate(0, baseLift + breathe);

    if (opts.role === 'tranmac') {
      // Thầy Trần Mặc (34 tuổi) — ~166px refined adult male proportions
      if (!opts.seated && !opts.kneeling) {
        for (const [idx, lx] of [-4.2, 4.2].entries()) {
          const legGrad = ctx.createLinearGradient(lx - 5, -90, lx + 5, 0);
          legGrad.addColorStop(0, idx === 0 ? '#181a1f' : '#272a33');
          legGrad.addColorStop(1, '#0d0f14');
          ctx.fillStyle = legGrad;
          ctx.beginPath();
          ctx.moveTo(lx - 5, -88);
          ctx.lineTo(lx + 5, -88);
          ctx.quadraticCurveTo(lx + 4.8, -46, lx + 3.4, -5);
          ctx.lineTo(lx - 3.6, -5);
          ctx.quadraticCurveTo(lx - 4.5, -46, lx - 5, -88);
          ctx.closePath();
          ctx.fill();

          // Creased leather oxford shoe
          ctx.fillStyle = '#090a0d';
          ctx.beginPath();
          ctx.moveTo(lx - 4, -5);
          ctx.lineTo(lx + 9, -2.5);
          ctx.quadraticCurveTo(lx + 10.5, 0, lx + 6, 0.5);
          ctx.lineTo(lx - 4.5, 0.5);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Tailored 1960s Charcoal Wool Zhongshan Long Coat with lapel & drape shadows
      const coatGrad = ctx.createLinearGradient(-15, -138, 16, -40);
      coatGrad.addColorStop(0, '#44403c');
      coatGrad.addColorStop(0.5, '#292524');
      coatGrad.addColorStop(1, '#141210');
      ctx.fillStyle = coatGrad;
      ctx.beginPath();
      ctx.moveTo(-12, -138);
      ctx.quadraticCurveTo(0, -141, 12, -137);
      ctx.quadraticCurveTo(15, -104, 17, -42);
      ctx.quadraticCurveTo(0, -37, -17, -43);
      ctx.quadraticCurveTo(-15, -104, -12, -138);
      ctx.closePath();
      ctx.fill();

      // Coat lapel crease + warm knit scarf + brass buttons
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.14)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(11, -136);
      ctx.quadraticCurveTo(14, -92, 16, -44);
      ctx.stroke();

      ctx.fillStyle = '#d6c7b2';
      ctx.beginPath();
      ctx.moveTo(-6, -138);
      ctx.lineTo(7, -138);
      ctx.lineTo(2, -118);
      ctx.lineTo(-4, -120);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#b45309';
      for (const by of [-110, -96, -82, -68]) {
        ctx.beginPath();
        ctx.arc(3.5, by, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sculpted arm + articulated hand holding bound poetry volume
      ctx.fillStyle = '#332f2c';
      ctx.beginPath();
      ctx.moveTo(2, -133);
      ctx.lineTo(13, -108);
      ctx.lineTo(18, -94);
      ctx.lineTo(11, -91);
      ctx.lineTo(-3, -125);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#dfc3ad';
      ctx.beginPath();
      ctx.ellipse(16, -91, 3.2, 2.4, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(10, -103, 12, 17);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(11, -102, 10, 15);

      // Realistic adult male neck, sculpted jawline & wire-frame spectacles
      ctx.fillStyle = '#cfb098';
      ctx.fillRect(-3.2, -146, 6.4, 10);
      const faceGrad = ctx.createRadialGradient(2.5, -156, 1.5, 0, -155, 11.5);
      faceGrad.addColorStop(0, '#edd4bf');
      faceGrad.addColorStop(0.75, '#cfa98e');
      faceGrad.addColorStop(1, '#9e7a64');
      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.moveTo(-8.5, -162);
      ctx.quadraticCurveTo(0, -168, 8.8, -161);
      ctx.quadraticCurveTo(10, -152, 7.6, -146);
      ctx.quadraticCurveTo(3, -143, -4, -144.5);
      ctx.quadraticCurveTo(-9.5, -149, -8.5, -162);
      ctx.closePath();
      ctx.fill();

      // Detailed parted dark hair with subtle temple silver
      ctx.fillStyle = '#14151a';
      ctx.beginPath();
      ctx.moveTo(-9.5, -155);
      ctx.quadraticCurveTo(-11, -170, 0, -170);
      ctx.quadraticCurveTo(10.5, -169, 9.5, -159);
      ctx.quadraticCurveTo(4, -163, -4, -158);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-7, -158);
      ctx.lineTo(-4, -152);
      ctx.stroke();

      // Detailed eye, nose contour, mouth & silver-rimmed spectacles
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(4.8, -156, 2.2, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(5.1, -156, 1.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(4.8, -156, 3.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(1.6, -156);
      ctx.lineTo(-4, -157);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(110, 65, 55, 0.6)';
      ctx.beginPath();
      ctx.moveTo(3.5, -148.5);
      ctx.lineTo(6.2, -148.8);
      ctx.stroke();
    } else if (opts.role === 'tovien') {
      // Tô Viễn (1986) — ~168px mature male in 1980s olive trench coat & umbrella
      for (const [idx, lx] of [-4.4, 4.4].entries()) {
        ctx.fillStyle = idx === 0 ? '#161d29' : '#242f40';
        ctx.beginPath();
        ctx.moveTo(lx - 5, -90);
        ctx.lineTo(lx + 5, -90);
        ctx.lineTo(lx + 3.5, -5);
        ctx.lineTo(lx - 3.5, -5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#090b10';
        ctx.beginPath();
        ctx.ellipse(lx + 2.5, -1.8, 7.2, 2.8, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      const coatGrad = ctx.createLinearGradient(-15, -140, 16, -42);
      coatGrad.addColorStop(0, '#536055');
      coatGrad.addColorStop(0.55, '#333d35');
      coatGrad.addColorStop(1, '#1b221c');
      ctx.fillStyle = coatGrad;
      ctx.beginPath();
      ctx.moveTo(-12.5, -140);
      ctx.lineTo(12.5, -140);
      ctx.lineTo(17.5, -42);
      ctx.quadraticCurveTo(0, -37, -17.5, -42);
      ctx.closePath();
      ctx.fill();

      // Trench waist belt + storm lapel
      ctx.fillStyle = '#202721';
      ctx.fillRect(-14.5, -96, 29, 4.5);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(2, -96, 3.5, 4.5);
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(-5.5, -140);
      ctx.lineTo(5.5, -140);
      ctx.lineTo(0, -124);
      ctx.closePath();
      ctx.fill();

      // Folded black storm umbrella resting over shoulder
      ctx.strokeStyle = '#090d14';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(9, -104);
      ctx.lineTo(-18, -168);
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-34, -164);
      ctx.quadraticCurveTo(-18, -184, 2, -162);
      ctx.closePath();
      ctx.fill();

      // Tailored coat sleeve & hand
      ctx.fillStyle = '#3f4b41';
      ctx.beginPath();
      ctx.moveTo(2, -134);
      ctx.lineTo(13, -112);
      ctx.lineTo(11, -102);
      ctx.lineTo(5, -102);
      ctx.lineTo(-2, -126);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#dfc3ad';
      ctx.beginPath();
      ctx.arc(9, -104, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Sculpted face & windswept dark hair
      ctx.fillStyle = '#cfaea0';
      ctx.fillRect(-3, -148, 6, 9);
      const faceGrad = ctx.createRadialGradient(2.5, -157, 1.5, 0, -156, 11);
      faceGrad.addColorStop(0, '#ebd1bc');
      faceGrad.addColorStop(1, '#a9856d');
      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.moveTo(-8.2, -163);
      ctx.quadraticCurveTo(0, -169, 8.6, -162);
      ctx.quadraticCurveTo(9.8, -152, 7.4, -147);
      ctx.quadraticCurveTo(1, -144, -8, -148);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-9, -157);
      ctx.quadraticCurveTo(-11, -172, 1, -171);
      ctx.quadraticCurveTo(10, -170, 9.5, -161);
      ctx.quadraticCurveTo(3, -164, -5, -158);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(4.8, -157, 1.35, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Tô Dao (17), Lâm Tĩnh (Endings/Kneeling), or Interrogation Doppelgänger (~156px slender girl anatomy)
      const isDoppel = opts.role === 'doppelganger';
      const isToDao = opts.role === 'todao';

      if (!opts.seated && !opts.kneeling) {
        for (const [idx, lx] of [-4, 4].entries()) {
          // Anatomical tapered leg (thigh -> knee -> calf -> ankle)
          ctx.fillStyle = isDoppel ? '#94a3b8' : idx === 0 ? '#cdb09c' : '#ebd4c3';
          ctx.beginPath();
          ctx.moveTo(lx - 3.6, -54);
          ctx.lineTo(lx + 3.6, -54);
          ctx.quadraticCurveTo(lx + 4.2, -31, lx + 2.1, -6);
          ctx.lineTo(lx - 2.1, -6);
          ctx.quadraticCurveTo(lx - 3.8, -31, lx - 3.6, -54);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = isDoppel ? '#cbd5e1' : '#f1f5f9';
          ctx.fillRect(lx - 2.3, -16, 4.6, 11);
          ctx.fillStyle = '#09090b';
          ctx.beginPath();
          ctx.ellipse(lx + 2, -2, 6.4, 2.7, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!opts.seated) {
        const skirtGrad = ctx.createLinearGradient(-13, -92, 13, -46);
        skirtGrad.addColorStop(0, isDoppel ? '#0f172a' : isToDao ? '#1e293b' : '#1e3a8a');
        skirtGrad.addColorStop(1, '#090d16');
        ctx.fillStyle = skirtGrad;
        ctx.beginPath();
        ctx.moveTo(-9.5, -92);
        ctx.lineTo(9.5, -92);
        ctx.lineTo(15.5, -46);
        ctx.quadraticCurveTo(0, -42, -15.5, -46);
        ctx.closePath();
        ctx.fill();
      }

      // Sculpted Blouse / Knit Cardigan
      const topGrad = ctx.createLinearGradient(-11, -134, 11, -92);
      if (isDoppel) {
        topGrad.addColorStop(0, '#94a3b8');
        topGrad.addColorStop(1, '#475569');
      } else if (isToDao) {
        topGrad.addColorStop(0, '#f5e8d3');
        topGrad.addColorStop(1, '#c9b190');
      } else {
        topGrad.addColorStop(0, '#f1f5f9');
        topGrad.addColorStop(1, '#94a3b8');
      }
      ctx.fillStyle = topGrad;
      ctx.beginPath();
      ctx.moveTo(-9.5, -134);
      ctx.quadraticCurveTo(0, -136, 9.5, -134);
      ctx.quadraticCurveTo(11, -112, 9.5, -92);
      ctx.lineTo(-9.5, -92);
      ctx.quadraticCurveTo(-11, -112, -9.5, -134);
      ctx.closePath();
      ctx.fill();

      // Sailor collar + crimson silk tie
      ctx.fillStyle = isDoppel ? '#1e293b' : '#334155';
      ctx.beginPath();
      ctx.moveTo(-9.5, -134);
      ctx.lineTo(0, -117);
      ctx.lineTo(9.5, -134);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = isDoppel ? '#7f1d1d' : '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(0, -118);
      ctx.lineTo(-3, -110);
      ctx.lineTo(2, -109);
      ctx.closePath();
      ctx.fill();

      // Tapered sleeve + sculpted hand
      ctx.fillStyle = isDoppel ? '#64748b' : isToDao ? '#d6c1a3' : '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(2, -130);
      ctx.lineTo(13, opts.seated ? -104 : -108);
      ctx.lineTo(opts.seated ? 20 : 10, opts.seated ? -88 : -94);
      ctx.lineTo(opts.seated ? 16 : 6, opts.seated ? -88 : -95);
      ctx.lineTo(-2, -124);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = isDoppel ? '#cbd5e1' : '#edd4c0';
      ctx.beginPath();
      ctx.arc(opts.seated ? 19 : 8.5, opts.seated ? -87 : -93, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Neck & flowing twin braids with silk ribbon
      ctx.fillStyle = isDoppel ? '#cbd5e1' : '#e0c1ac';
      ctx.fillRect(-2.6, -143, 5.2, 10);

      const braidSway = Math.sin(opts.timeSec * 2.2) * 2.0;
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 4.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-7, -150);
      ctx.quadraticCurveTo(-12 - braidSway, -130, -10 - braidSway, -110);
      ctx.stroke();
      ctx.fillStyle = isDoppel ? '#7f1d1d' : '#dc2626';
      ctx.fillRect(-12 - braidSway, -114, 4.2, 2.4);

      // Sculpted realistic female portrait head
      const skinGrad = ctx.createRadialGradient(2.5, -153, 1.5, 0, -152, 11);
      skinGrad.addColorStop(0, isDoppel ? '#cbd5e1' : '#f5e2d3');
      skinGrad.addColorStop(0.75, isDoppel ? '#94a3b8' : '#d8b69e');
      skinGrad.addColorStop(1, isDoppel ? '#475569' : '#ad8870');
      ctx.fillStyle = skinGrad;
      ctx.beginPath();
      ctx.moveTo(-8, -159);
      ctx.quadraticCurveTo(0, -165, 8.2, -158);
      ctx.quadraticCurveTo(9.4, -149, 7.2, -143.5);
      ctx.quadraticCurveTo(3, -140.5, -3.5, -142);
      ctx.quadraticCurveTo(-9, -147, -8, -159);
      ctx.closePath();
      ctx.fill();

      // Glossy bangs & crown hair
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.moveTo(-9, -151);
      ctx.quadraticCurveTo(-10.5, -166, 0, -166);
      ctx.quadraticCurveTo(9.5, -165, 9, -156);
      ctx.quadraticCurveTo(3.5, -160, -4, -153);
      ctx.closePath();
      ctx.fill();

      // Plum-blossom hairpin for Tô Dao
      if (isToDao) {
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(-5, -160, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(-5, -160, 1.0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Layered realistic eye, lashes, soft mouth & Doppelgänger blood tear streaks
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(4.8, -153, 2.2, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isDoppel ? '#dc2626' : '#0f172a';
      ctx.beginPath();
      ctx.arc(5.1, -153, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(5.4, -153.8, 0.7, 0.7);
      if (isDoppel) {
        ctx.fillStyle = 'rgba(127, 29, 29, 0.78)';
        ctx.fillRect(4.5, -150.5, 1.4, 6.5);
      }
      ctx.strokeStyle = isDoppel ? '#7f1d1d' : 'rgba(145, 75, 70, 0.65)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(3.6, -145.5);
      ctx.lineTo(6.0, -145.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Lifelike, Expressive 7.2-Head Articulated Lâm Tĩnh Rig with Walk, Sprint & Exhausted-Fatigue Animations
  private drawLinJing(
    ctx: CanvasRenderingContext2D,
    floorY: number,
    state: ThanhMinhState,
    nearestGhost: GhostEntity | null,
    timeSec: number
  ): void {
    const isMoving = state.isMoving;
    const isRunning = state.isRunning;
    const isExhausted = state.exhausted;
    const stride = isMoving ? Math.sin(state.walkPhase * Math.PI) : 0;

    // Realistic 1960s high-school girl (~174px tall, 1:6.5 human proportions inspired by Fang Ray-Shin in Detention)
    const walkBob = isExhausted
      ? Math.abs(stride) * 2.0 + Math.max(0, Math.sin(timeSec * 8.2)) * 2.0
      : isRunning
        ? Math.abs(stride) * 4.4
        : Math.abs(stride) * 2.4;
    const idleBreathe = isExhausted
      ? Math.sin(timeSec * 8.2) * 1.6
      : Math.sin(timeSec * 2.0) * 0.85;

    const torsoLean = isExhausted
      ? 0.19 + Math.sin(timeSec * 8.2) * 0.025
      : state.holdingBreath
        ? 0.09
        : isRunning
          ? 0.13
          : state.gazeExposure > 35
            ? 0.06
            : 0.015;
    const panicTremble = state.sanity < 50 ? Math.sin(timeSec * 34) * 0.75 : 0;

    ctx.save();
    ctx.translate(state.playerX, floorY);

    // Anchored elliptical floor shadow
    const shadowGrad = ctx.createRadialGradient(0, 3, 2, 0, 3, isRunning ? 26 : 22);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.76)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(0, 3.5, isRunning ? 24 : 19, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(panicTremble, (isExhausted ? 3.2 : 0) - walkBob + idleBreathe);
    const PLAYER_SCALE = 0.87;
    ctx.scale(state.playerFacing * PLAYER_SCALE, PLAYER_SCALE);

    // 1. Slender Natural Schoolgirl Legs (Hip -> Knee -> Ankle -> Mid-calf White Socks & Dark Leather Loafers)
    const strideSpan = isRunning ? 17.5 : isExhausted ? 7.5 : 12.2;
    const swingA = stride * strideSpan;
    const swingB = -stride * strideSpan;
    const kneeBendDrop = isExhausted ? 3.0 : 0;

    for (const [legIdx, hipSwing] of [
      [0, swingB],
      [1, swingA],
    ] as const) {
      const kneeX = hipSwing * 0.54 + (isRunning ? 3.5 : 1.5);
      const kneeY = -34 + kneeBendDrop;
      const footX = hipSwing;
      const footLift = isRunning ? Math.max(0, -hipSwing * 0.22) : isExhausted ? 0 : Math.max(0, -hipSwing * 0.09);
      const footY = -3 - footLift;

      // Slender calf & knee taper
      ctx.fillStyle = legIdx === 0 ? '#b79782' : '#d6b7a2';
      ctx.beginPath();
      ctx.moveTo((legIdx === 0 ? -3 : 1.5) - 3.6, -68);
      ctx.lineTo((legIdx === 0 ? -3 : 1.5) + 3.6, -68);
      ctx.quadraticCurveTo(kneeX + 3.1, kneeY, footX + 1.9, footY);
      ctx.lineTo(footX - 1.9, footY);
      ctx.quadraticCurveTo(kneeX - 2.9, kneeY, (legIdx === 0 ? -3 : 1.5) - 3.6, -68);
      ctx.closePath();
      ctx.fill();

      // Fold-over school socks & realistic dark leather loafers
      ctx.fillStyle = legIdx === 0 ? '#94a3b8' : '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(footX - 2.4, footY - 15);
      ctx.lineTo(footX + 2.4, footY - 15);
      ctx.lineTo(footX + 2.0, footY);
      ctx.lineTo(footX - 2.0, footY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#090b10';
      ctx.beginPath();
      ctx.ellipse(footX + 2.5, footY + 1.2, 6.5, 2.5, isRunning ? -0.08 : 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Upper Body Pivot (Natural 1960s Student Proportions from Waist -68 up to Shoulder -118)
    ctx.save();
    ctx.translate(0, -68);
    ctx.rotate(torsoLean);

    // Back arm (slender sleeve + hand)
    if (!state.holdingBreath) {
      const backArmAngle = isExhausted
        ? -0.22 + stride * 0.14
        : isRunning
          ? -stride * 0.78
          : -stride * 0.32;
      ctx.save();
      ctx.translate(-3, -46);
      ctx.rotate(backArmAngle);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(-2.4, 0);
      ctx.lineTo(2.4, 0);
      ctx.lineTo(1.9, 34);
      ctx.lineTo(-1.8, 34);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#caa792';
      ctx.beginPath();
      ctx.arc(0, 35.5, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Below-knee Pleated Dark Navy Schoolgirl Skirt (-46 down to +22 relative to hip = midi length!)
    const skirtFlare = isRunning ? 7.5 : Math.abs(stride) * 3.5;
    const skirtGrad = ctx.createLinearGradient(-12, -46, 12, 22);
    skirtGrad.addColorStop(0, '#162033');
    skirtGrad.addColorStop(0.6, '#111a2e');
    skirtGrad.addColorStop(1, '#070b14');
    ctx.fillStyle = skirtGrad;
    ctx.beginPath();
    ctx.moveTo(-8.5, -46);
    ctx.lineTo(8.5, -46);
    ctx.quadraticCurveTo(13.5 + skirtFlare, -12, 15.5 + skirtFlare, 22);
    ctx.quadraticCurveTo(0, 26, -15.5 - skirtFlare, 22);
    ctx.quadraticCurveTo(-13.5, -12, -8.5, -46);
    ctx.closePath();
    ctx.fill();

    // Accordion skirt pleats
    ctx.strokeStyle = 'rgba(2, 6, 16, 0.8)';
    ctx.lineWidth = 1;
    for (const px of [-5, 0, 5]) {
      ctx.beginPath();
      ctx.moveTo(px * 0.65, -44);
      ctx.lineTo(px * 1.5, 23);
      ctx.stroke();
    }

    // Tailored 1960s Long-Sleeved Ivory Student Blouse (-96 to -46) + Dark Sailor Collar & Tie
    const blouseGrad = ctx.createLinearGradient(-9, -96, 10, -46);
    blouseGrad.addColorStop(0, '#e2e8f0');
    blouseGrad.addColorStop(0.55, '#cbd5e1');
    blouseGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = blouseGrad;
    ctx.beginPath();
    ctx.moveTo(-8.5, -46);
    ctx.quadraticCurveTo(-10.5, -72, -8, -96);
    ctx.lineTo(8, -96);
    ctx.quadraticCurveTo(10.5, -72, 8.5, -46);
    ctx.closePath();
    ctx.fill();

    // Classic 1960s Taiwanese/Vietnamese school uniform navy collar & dark tie
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-8.5, -96);
    ctx.lineTo(0, -76);
    ctx.lineTo(8.5, -96);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(0, -78);
    ctx.lineTo(-2.5, -66);
    ctx.lineTo(2.0, -65);
    ctx.closePath();
    ctx.fill();

    // 3. Slender Realistic Girl Head (-108 pivot, smaller ~1:6.5 human proportion + dark shoulder-length hair!)
    ctx.save();
    ctx.translate(1, -106);
    const headPitch = isExhausted
      ? 0.16 + Math.sin(timeSec * 8.2) * 0.032
      : state.holdingBreath
        ? 0.06
        : -0.02;
    ctx.rotate(headPitch);

    // Slender human neck
    ctx.fillStyle = '#cba892';
    ctx.fillRect(-2.4, 4, 4.8, 10);

    // Flowing dark shoulder-length bob / back hair swaying softly behind neck & collar
    const hairBackPull = isRunning ? -9 : isExhausted ? -2 : 0;
    const hairWave = Math.sin(timeSec * (isRunning ? 8.5 : 3.6) + state.walkPhase * 2) * (isMoving ? 3.5 : 1.1);
    ctx.fillStyle = '#09090d';
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.quadraticCurveTo(-11 + hairBackPull * 0.5, 4, -10 + hairBackPull - hairWave, 20);
    ctx.quadraticCurveTo(-4, 21, 2, 16);
    ctx.lineTo(3, -6);
    ctx.closePath();
    ctx.fill();

    // Realistic contoured oval profile face (NO giant doll face!)
    const faceGrad = ctx.createRadialGradient(2.2, -1.8, 1, 0, -1, 9.5);
    faceGrad.addColorStop(0, '#ecd2be');
    faceGrad.addColorStop(0.7, '#d1ad94');
    faceGrad.addColorStop(1, '#9f7b65');
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.moveTo(-6.2, -7.5);
    ctx.quadraticCurveTo(0, -12, 6.8, -6.5);
    ctx.quadraticCurveTo(7.8, 0.5, 6.2, 5.5);
    ctx.quadraticCurveTo(2.4, 7.8, -2.5, 6.8);
    ctx.quadraticCurveTo(-7, 2.5, -6.2, -7.5);
    ctx.closePath();
    ctx.fill();

    // Subtle realistic nose shadow & closed/parted lips
    if (isExhausted) {
      ctx.fillStyle = '#5c2626';
      ctx.beginPath();
      ctx.ellipse(4.8, 4.8, 1.3, 0.9 + Math.sin(timeSec * 8.2) * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(110, 62, 52, 0.65)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(3.5, 4.8);
      ctx.lineTo(5.6, 4.6);
      ctx.stroke();
    }

    // Refined natural human eye (small expressive gaze, NOT huge anime doll eye)
    const ghostBehind =
      nearestGhost &&
      Math.abs(nearestGhost.x - state.playerX) < 260 &&
      (nearestGhost.x - state.playerX) * state.playerFacing < 0;
    const irisX = ghostBehind ? 3.1 : 4.4;
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(4.1, -1.2, 1.8, 1.0, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(irisX, -1.2, 0.95, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(2.3, -2.0);
    ctx.lineTo(5.8, -1.7);
    ctx.stroke();

    // Subtle eyebrow
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 0.95;
    ctx.beginPath();
    if (isExhausted || state.holdingBreath || state.gazeExposure > 25) {
      ctx.moveTo(2.0, -3.9);
      ctx.lineTo(6.0, -5.0);
    } else {
      ctx.moveTo(2.2, -4.1);
      ctx.lineTo(5.8, -4.0);
    }
    ctx.stroke();

    // Natural parted 1960s student hair crown, ear-tuck strand & soft wispy bangs
    ctx.fillStyle = '#09090d';
    ctx.beginPath();
    ctx.moveTo(-7.2, -1);
    ctx.quadraticCurveTo(-8.5, -13, 0, -13.2);
    ctx.quadraticCurveTo(7.8, -12.6, 7.2, -4.8);
    ctx.quadraticCurveTo(3.2, -8, -1.8, -3);
    ctx.quadraticCurveTo(-2.5, 4, -4.5, 11);
    ctx.lineTo(-7.5, 11);
    ctx.closePath();
    ctx.fill();
    // Subtle warm lantern rim highlight on hair edge
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(-0.5, -5, 6.8, Math.PI * 1.2, Math.PI * 1.75);
    ctx.stroke();

    if (isExhausted) {
      const sweatPhase = (timeSec * 1.35) % 1;
      ctx.fillStyle = `rgba(186, 230, 253, ${(1 - sweatPhase) * 0.85})`;
      ctx.beginPath();
      ctx.ellipse(2.0, -3 + sweatPhase * 9, 0.9, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 4. Front Arm & Held Brass Storm Oil Lantern
    if (state.holdingBreath) {
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(2, -91);
      ctx.lineTo(11, -80);
      ctx.lineTo(8, -104);
      ctx.lineTo(4, -104);
      ctx.lineTo(6, -82);
      ctx.lineTo(-1, -88);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e6c6af';
      ctx.beginPath();
      ctx.arc(6.5, -104, 2.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (isExhausted) {
      const heave = Math.sin(timeSec * 8.2) * 2.2;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(3, -90);
      ctx.lineTo(10, -64);
      ctx.lineTo(14, -42 + heave * 0.4);
      ctx.stroke();

      ctx.fillStyle = '#e5c6b0';
      ctx.beginPath();
      ctx.arc(14, -41 + heave * 0.4, 2.2, 0, Math.PI * 2);
      ctx.fill();

      const lanternX = 14.5 + Math.sin(timeSec * 6.5) * 1.6;
      const lanternY = -39 + heave * 0.4;
      const halo = ctx.createRadialGradient(lanternX, lanternY + 8, 2, lanternX, lanternY + 8, 24);
      halo.addColorStop(0, 'rgba(251, 191, 36, 0.78)');
      halo.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(lanternX - 24, lanternY - 16, 48, 48);

      ctx.fillStyle = '#78350f';
      ctx.fillRect(lanternX - 4.5, lanternY, 9, 3);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(lanternX - 4, lanternY + 3, 8, 11);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(lanternX - 2.6, lanternY + 4.5, 5.2, 8);

      for (let pIdx = 0; pIdx < 2; pIdx += 1) {
        const puff = (timeSec * 2.4 + pIdx * 0.5) % 1;
        ctx.fillStyle = `rgba(226, 232, 240, ${(1 - puff) * 0.42})`;
        ctx.beginPath();
        ctx.arc(12 + puff * 20, -101 - puff * 6, 3 + puff * 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const armSwing = isRunning ? stride * 5.0 : Math.sin(timeSec * 3.5) * 1.6;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(3, -90);
      ctx.lineTo(13, -72);
      ctx.lineTo(19, -62 + armSwing * 0.4);
      ctx.stroke();

      ctx.fillStyle = '#e5c6b0';
      ctx.beginPath();
      ctx.arc(19, -61 + armSwing * 0.4, 2.2, 0, Math.PI * 2);
      ctx.fill();

      const lanternX = 20 + Math.sin(timeSec * (isRunning ? 10 : 4)) * (isRunning ? 3.2 : 1.8);
      const lanternY = -61 + armSwing * 0.4;
      const halo = ctx.createRadialGradient(lanternX, lanternY + 8, 2, lanternX, lanternY + 8, 32);
      halo.addColorStop(0, 'rgba(251, 191, 36, 0.96)');
      halo.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(lanternX - 32, lanternY - 24, 64, 64);

      ctx.fillStyle = '#78350f';
      ctx.fillRect(lanternX - 5, lanternY, 10, 3);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(lanternX - 4.5, lanternY + 3, 9, 12);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(lanternX - 3, lanternY + 4.5, 6, 9);

      const puff = (timeSec * 1.1) % 1;
      ctx.fillStyle = `rgba(226, 232, 240, ${(1 - puff) * 0.25})`;
      ctx.beginPath();
      ctx.arc(13 + puff * 15, -103 - puff * 6, 2.6 + puff * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }

  private drawForegroundTalismans(
    ctx: CanvasRenderingContext2D,
    worldSpan: number,
    height: number,
    camX: number,
    timeSec: number,
    isYin: boolean
  ): void {
    ctx.save();
    for (let x = 140; x < worldSpan; x += 380) {
      const fx = x + camX * 0.14;
      const sx = fx - camX;
      if (sx < -40 || sx > this.viewWidth + 40) continue;
      ctx.save();
      ctx.translate(fx, height * 0.03);
      ctx.rotate(Math.sin(timeSec * 1.9 + x) * 0.15);
      ctx.fillStyle = isYin ? 'rgba(180, 95, 95, 0.26)' : 'rgba(225, 222, 212, 0.24)';
      ctx.fillRect(-8, 0, 16, 84);
      ctx.fillStyle = isYin ? 'rgba(220, 38, 38, 0.45)' : 'rgba(127, 29, 29, 0.35)';
      ctx.font = `bold 9px ${FONT_SERIF}`;
      ctx.textAlign = 'center';
      ctx.fillText('清明', 0, 26);
      ctx.fillText('冤', 0, 52);
      ctx.restore();
    }
    ctx.restore();
  }

  private drawForegroundParallaxSilhouettes(
    ctx: CanvasRenderingContext2D,
    worldSpan: number,
    width: number,
    height: number,
    camX: number,
    isYin: boolean
  ): void {
    ctx.save();
    ctx.fillStyle = isYin ? 'rgba(10, 2, 3, 0.72)' : 'rgba(3, 4, 6, 0.78)';
    for (let x = 260; x < worldSpan + width; x += 640) {
      const fgX = x - camX * 0.28;
      if (fgX < -40 || fgX > width + 40) continue;
      ctx.fillRect(fgX, 0, 24, height);
    }
    ctx.restore();
  }

  private drawLanternDustMotes(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camX: number,
    state: ThanhMinhState,
    timeSec: number,
    dt: number
  ): void {
    const playerScreenX = state.playerX - camX;
    for (const m of this.dustMotes) {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.x < 0) m.x = width;
      if (m.x > width) m.x = 0;
      if (m.y < 40) m.y = height * 0.78;
      if (m.y > height * 0.8) m.y = 50;

      const dist = Math.hypot(m.x - playerScreenX, m.y - height * 0.56);
      if (dist > 260) continue;
      const alpha = (1 - dist / 260) * (0.28 + Math.sin(timeSec * 2.5 + m.phase) * 0.15);
      ctx.fillStyle =
        state.realm === 'yin'
          ? `rgba(252, 165, 165, ${alpha})`
          : `rgba(253, 230, 138, ${alpha})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawEndingTableau(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    floorY: number,
    state: ThanhMinhState,
    timeSec: number,
    dt: number
  ): void {
    ctx.fillStyle = state.ending === 'ending_4_dawn_coson' ? '#2c221b' : '#121011';
    ctx.fillRect(0, floorY, width, height - floorY);

    if (state.ending === 'ending_2_ashes') {
      // Charred ruined pillars + Lâm Tĩnh kneeling among rising crimson embers
      ctx.fillStyle = '#090404';
      ctx.fillRect(width * 0.22, floorY - 210, 24, 210);
      ctx.fillRect(width * 0.76, floorY - 220, 26, 220);
      for (const p of this.ashParticles) {
        p.x += p.vx * dt;
        p.y += p.vy * 1.6 * dt;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        ctx.fillStyle = `rgba(249, 115, 22, ${p.alpha})`;
        ctx.fillRect(p.x, p.y, p.size * 1.4, p.size * 1.4);
      }
      this.drawDetailedHuman(ctx, width * 0.5, floorY, 1.15, {
        role: 'linjing',
        facing: 1,
        timeSec,
        kneeling: true,
      });
    } else if (state.ending === 'ending_3_late_qingming') {
      // Two pine-shaded Qingming graves + wooden spirit tablets + burning brazier + kneeling Lâm Tĩnh
      for (const [idx, gx] of [width * 0.41, width * 0.59].entries()) {
        ctx.fillStyle = '#1e2420';
        ctx.beginPath();
        ctx.arc(gx, floorY, 44, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#3b2d22';
        ctx.fillRect(gx - 8, floorY - 76, 16, 40);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = `9px ${FONT_SERIF}`;
        ctx.textAlign = 'center';
        ctx.fillText(idx === 0 ? 'Trần Mặc' : 'Tô Dao', gx, floorY - 52);
      }
      const fireGlow = ctx.createRadialGradient(
        width * 0.5,
        floorY - 8,
        2,
        width * 0.5,
        floorY - 8,
        42
      );
      fireGlow.addColorStop(0, 'rgba(251, 146, 60, 0.86)');
      fireGlow.addColorStop(1, 'rgba(251, 146, 60, 0)');
      ctx.fillStyle = fireGlow;
      ctx.fillRect(width * 0.5 - 42, floorY - 50, 84, 52);

      this.drawDetailedHuman(ctx, width * 0.5, floorY, 1.1, {
        role: 'linjing',
        facing: -1,
        timeSec,
        kneeling: true,
      });
    } else if (state.ending === 'ending_4_dawn_coson') {
      // Warm Golden Dawn Halo behind Thầy Trần Mặc (left), Lâm Tĩnh (center), and Tô Dao (right)
      const cx = width * 0.5;
      const dawnHalo = ctx.createRadialGradient(cx, floorY - 95, 16, cx, floorY - 95, 220);
      dawnHalo.addColorStop(0, 'rgba(254, 240, 138, 0.34)');
      dawnHalo.addColorStop(0.55, 'rgba(245, 158, 11, 0.14)');
      dawnHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = dawnHalo;
      ctx.fillRect(cx - 220, floorY - 315, 440, 320);

      // Gentle forgiving spirits of Thầy Trần Mặc & Tô Dao flanking Lâm Tĩnh
      this.drawDetailedHuman(ctx, cx - 72, floorY, 1.12, {
        role: 'tranmac',
        facing: 1,
        timeSec,
        alpha: 0.78,
      });
      this.drawDetailedHuman(ctx, cx + 72, floorY, 1.1, {
        role: 'todao',
        facing: -1,
        timeSec,
        alpha: 0.78,
      });
      this.drawDetailedHuman(ctx, cx, floorY, 1.15, {
        role: 'linjing',
        facing: 1,
        timeSec,
        alpha: 1,
      });

      for (const p of this.ashParticles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        ctx.fillStyle = `rgba(254, 243, 199, ${p.alpha})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    }
  }

  private drawOldFilmGrain(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    timeSec: number,
    isYin: boolean
  ): void {
    const pat = this.ensureGrainPattern(ctx);
    if (pat) {
      const ox = (timeSec * 97) % 160;
      const oy = (timeSec * 131) % 160;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.fillStyle = pat;
      ctx.fillRect(-ox, -oy, width, height);
      ctx.restore();
    }

    if (Math.sin(timeSec * 19) > 0.72) {
      const sx = (timeSec * 417) % width;
      ctx.strokeStyle = isYin ? 'rgba(220, 60, 60, 0.14)' : 'rgba(235, 235, 225, 0.11)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();
    }
  }

  private drawProjectorFilmGate(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    // 16mm subtle cinema frame vignette border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.68)';
    ctx.lineWidth = 14;
    ctx.strokeRect(0, 0, width, height);
  }
}
