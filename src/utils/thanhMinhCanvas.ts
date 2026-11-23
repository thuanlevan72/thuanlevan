// Cinematic 60fps 2.5D Paper-Cutout, Articulated Character Rigging,
// Volumetric Lighting & Monster Kill-Cutscene Renderer for:
// THANH MINH: HỌC VIỆN CÔ SƠN (清明)

import {
  findNearbyHotspot,
  type GhostEntity,
  SCENE_HOTSPOTS,
  SCENE_META,
  type SceneId,
  type ThanhMinhState,
} from './thanhMinhEngine.ts';

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
  private lastScene: SceneId | null = null;
  private shakeIntensity = 0;
  private lightningFlash = 0;
  private nextLightningIn = 5.5;
  private grainCanvas: HTMLCanvasElement | null = null;
  private grainPattern: CanvasPattern | null = null;

  constructor() {
    for (let i = 0; i < 120; i += 1) {
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

    // 1. Deep Oppressive Horror Sky Gradient
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
      skyGrad.addColorStop(0, '#140103');
      skyGrad.addColorStop(0.6, '#2b0407');
      skyGrad.addColorStop(1, '#060001');
    } else if (isYin) {
      skyGrad.addColorStop(0, '#0a0102');
      skyGrad.addColorStop(0.55, '#220307');
      skyGrad.addColorStop(1, '#040001');
    } else if (is1986) {
      skyGrad.addColorStop(0, '#090d0b');
      skyGrad.addColorStop(0.55, '#101814');
      skyGrad.addColorStop(1, '#040605');
    } else {
      skyGrad.addColorStop(0, '#030407');
      skyGrad.addColorStop(0.55, '#090d13');
      skyGrad.addColorStop(1, '#020204');
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
      const lanternY = height * (state.exhausted ? 0.65 : 0.61);
      const lanternRadius = Math.max(210, width * 0.38) * flicker;

      // Directional subtle lantern cone forward
      ctx.save();
      const beamEndX = lanternX + state.playerFacing * 250 * flicker;
      const coneGrad = ctx.createLinearGradient(lanternX, lanternY, beamEndX, lanternY + 28);
      coneGrad.addColorStop(
        0,
        isYin ? 'rgba(220, 38, 38, 0.16)' : isDarkroom ? 'rgba(239, 68, 68, 0.18)' : 'rgba(253, 211, 130, 0.14)'
      );
      coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(lanternX, lanternY - 12);
      ctx.lineTo(beamEndX, lanternY - 108);
      ctx.lineTo(beamEndX, lanternY + 122);
      ctx.lineTo(lanternX, lanternY + 14);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const lanternGrad = ctx.createRadialGradient(
        lanternX,
        lanternY,
        12,
        playerScreenX,
        height * 0.58,
        lanternRadius
      );
      if (isDarkroom) {
        lanternGrad.addColorStop(0, 'rgba(239, 68, 68, 0.14)');
        lanternGrad.addColorStop(0.4, 'rgba(26, 2, 4, 0.62)');
        lanternGrad.addColorStop(1, 'rgba(4, 0, 1, 0.96)');
      } else {
        lanternGrad.addColorStop(
          0,
          isYin ? 'rgba(185, 28, 28, 0.08)' : 'rgba(255, 198, 112, 0.1)'
        );
        lanternGrad.addColorStop(0.38, 'rgba(3, 4, 8, 0.56)');
        lanternGrad.addColorStop(0.76, 'rgba(2, 2, 5, 0.84)');
        lanternGrad.addColorStop(1, 'rgba(1, 1, 3, 0.97)');
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

    // 9. Vintage 16mm Grain + Projector Film-Gate Corners
    this.drawOldFilmGrain(ctx, width, height, timeSec, isYin || isDarkroom);
    this.drawProjectorFilmGate(ctx, width, height);

    ctx.restore();
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

    // 1. Darkening nightmare shroud & 16mm photo-negative impact flash
    const darkness = p < 0.22 ? 0.48 + p * 1.9 : p > 0.72 ? 0.96 : 0.84;
    ctx.fillStyle = `rgba(9, 2, 3, ${Math.min(0.97, darkness)})`;
    ctx.fillRect(0, 0, width, height);

    if (p < 0.14) {
      // Negative film exposure flash + crimson shockwave
      const strobe = Math.sin(timeSec * 82) > 0 ? 0.52 : 0.24;
      ctx.fillStyle = `rgba(185, 22, 26, ${(0.14 - p) * 3.4})`;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = `rgba(226, 232, 240, ${(0.14 - p) * strobe * 1.6})`;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Monster Lunge Close-Up with Double Exposure & Clawed Hands Gripping Borders
    if (p < 0.8) {
      const surge = p < 0.36 ? p / 0.36 : 1;
      const lungeScale = 0.62 + Math.pow(surge, 0.72) * 0.76 + Math.max(0, p - 0.36) * 0.28;
      const shakeDecay = Math.max(0.22, 1 - p);
      const jitterX = Math.sin(timeSec * 58) * shakeDecay * 11;
      const jitterY = Math.cos(timeSec * 51) * shakeDecay * 8;
      const fadeOut = p > 0.62 ? Math.max(0, (0.8 - p) / 0.18) : 1;

      const drawMonsterFace = (ghostPass: boolean, alpha: number) => {
        ctx.save();
        ctx.globalAlpha = alpha * fadeOut;
        ctx.translate(
          cx + jitterX + (ghostPass ? Math.sin(timeSec * 37) * 14 : 0),
          cy + 22 + jitterY + (ghostPass ? Math.cos(timeSec * 31) * 7 : 0)
        );
        ctx.scale(lungeScale, lungeScale);
        if (ghostPass) {
          ctx.rotate(Math.sin(timeSec * 29) * 0.045);
        }

        // Shredded ink-black funeral shroud rising behind face
        const shroudGrad = ctx.createLinearGradient(0, -80, 0, 220);
        shroudGrad.addColorStop(0, ghostPass ? 'rgba(140, 14, 18, 0.5)' : '#12080a');
        shroudGrad.addColorStop(1, '#040203');
        ctx.fillStyle = shroudGrad;
        ctx.beginPath();
        ctx.moveTo(-145, 230);
        ctx.quadraticCurveTo(-125, 10, -45, -45);
        ctx.lineTo(45, -45);
        ctx.quadraticCurveTo(125, 10, 145, 230);
        ctx.closePath();
        ctx.fill();

        if (dc.killerKind === 'paper_hat') {
          // Towering stained parchment dunce cap
          const hatGrad = ctx.createLinearGradient(-50, -295, 55, -55);
          hatGrad.addColorStop(0, ghostPass ? '#7f1d1d' : '#a8a29e');
          hatGrad.addColorStop(0.55, ghostPass ? '#450a0a' : '#78716c');
          hatGrad.addColorStop(1, '#292524');
          ctx.fillStyle = hatGrad;
          ctx.beginPath();
          ctx.moveTo(-76, -54);
          ctx.lineTo(-8, -295);
          ctx.lineTo(6, -288);
          ctx.lineTo(74, -54);
          ctx.closePath();
          ctx.fill();

          // Crease & dangling torn paper talisman strips
          ctx.strokeStyle = 'rgba(20, 12, 10, 0.55)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-4, -285);
          ctx.lineTo(-10, -56);
          ctx.stroke();

          for (const stripX of [-58, 52]) {
            const whip = Math.sin(timeSec * 19 + stripX) * 14;
            ctx.fillStyle = 'rgba(214, 211, 209, 0.72)';
            ctx.beginPath();
            ctx.moveTo(stripX, -58);
            ctx.lineTo(stripX + whip - 7, 18);
            ctx.lineTo(stripX + whip + 6, 12);
            ctx.closePath();
            ctx.fill();
          }

          // Vertical crooked blood inscription on dunce hat
          ctx.save();
          ctx.fillStyle = 'rgba(127, 29, 29, 0.92)';
          ctx.font = 'bold 26px serif';
          ctx.textAlign = 'center';
          ctx.fillText('TỘI', -2, -168);
          ctx.fillText('NHÂN', 2, -132);
          ctx.restore();

          // Chiaroscuro gaunt decayed skull
          const skullGrad = ctx.createRadialGradient(-10, -34, 8, 0, -14, 82);
          skullGrad.addColorStop(0, ghostPass ? '#991b1b' : '#b8b2aa');
          skullGrad.addColorStop(0.55, ghostPass ? '#450a0a' : '#65605c');
          skullGrad.addColorStop(1, '#1c181a');
          ctx.fillStyle = skullGrad;
          ctx.beginPath();
          ctx.moveTo(-54, -58);
          ctx.quadraticCurveTo(-64, -10, -44, 34);
          ctx.quadraticCurveTo(0, 62, 44, 34);
          ctx.quadraticCurveTo(64, -10, 54, -58);
          ctx.closePath();
          ctx.fill();

          // Hollowed cheekbone shadows
          ctx.fillStyle = 'rgba(10, 6, 8, 0.55)';
          ctx.beginPath();
          ctx.ellipse(-34, 2, 13, 20, 0.35, 0, Math.PI * 2);
          ctx.ellipse(34, 2, 13, 20, -0.35, 0, Math.PI * 2);
          ctx.fill();

          // Deep sunken orbital sockets + dilated staring pinpoint pupils
          for (const side of [-1, 1] as const) {
            ctx.fillStyle = '#050304';
            ctx.beginPath();
            ctx.ellipse(side * 24, -24, 15, 19, side * 0.12, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(side * 23, -23, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef2f2';
            ctx.beginPath();
            ctx.arc(side * 23, -23, 1.3, 0, Math.PI * 2);
            ctx.fill();

            // Dried ink/blood tears
            ctx.strokeStyle = 'rgba(127, 29, 29, 0.85)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(side * 23, -6);
            ctx.lineTo(side * 25, 22);
            ctx.stroke();
          }

          // Unhinged screaming mouth + wet coiling crimson tongue with specular slime sheen
          ctx.fillStyle = '#050203';
          ctx.beginPath();
          ctx.ellipse(0, 26, 22, 34, 0, 0, Math.PI * 2);
          ctx.fill();

          const tongueExtend = Math.min(1.05, p * 2.5);
          const sway = Math.sin(timeSec * 16) * 32;
          ctx.strokeStyle = '#5c0a0e';
          ctx.lineWidth = 26;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(0, 24);
          ctx.bezierCurveTo(-58 * tongueExtend, 78, 72 * tongueExtend, 134, sway, 198 * tongueExtend);
          ctx.stroke();

          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 17;
          ctx.stroke();

          ctx.strokeStyle = 'rgba(248, 113, 113, 0.42)';
          ctx.lineWidth = 4;
          ctx.stroke();
        } else if (dc.killerVariant === 'auditor_specter') {
          // Ác Linh Tự Vệ — Trương Vệ Quốc close-up: snapped neck tilt, bruised face, cracked tin megaphone
          ctx.save();
          ctx.rotate(0.28 + Math.sin(timeSec * 21) * 0.04);
          // Bruised swollen water-pale face
          const guardGrad = ctx.createRadialGradient(-8, -28, 8, 0, -18, 86);
          guardGrad.addColorStop(0, ghostPass ? '#991b1b' : '#9ca3af');
          guardGrad.addColorStop(0.6, ghostPass ? '#450a0a' : '#4b5563');
          guardGrad.addColorStop(1, '#111827');
          ctx.fillStyle = guardGrad;
          ctx.beginPath();
          ctx.ellipse(0, -24, 54, 68, 0, 0, Math.PI * 2);
          ctx.fill();

          // Red Guard peaked cloth cap with broken visor
          ctx.fillStyle = '#1f2937';
          ctx.beginPath();
          ctx.moveTo(-58, -56);
          ctx.quadraticCurveTo(0, -112, 58, -56);
          ctx.lineTo(48, -42);
          ctx.lineTo(-48, -42);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#7f1d1d';
          ctx.beginPath();
          ctx.arc(0, -68, 7, 0, Math.PI * 2);
          ctx.fill();

          // Bloodshot staring eyes + water-logged bruises
          for (const side of [-1, 1] as const) {
            ctx.fillStyle = '#09090b';
            ctx.beginPath();
            ctx.ellipse(side * 22, -26, 13, 15, side * -0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(side * 21, -26, 3.8, 0, Math.PI * 2);
            ctx.fill();
          }

          // Fused cracked tin megaphone screaming acoustic crimson rings
          const megaPulse = 1 + Math.sin(timeSec * 28) * 0.08;
          ctx.save();
          ctx.translate(0, 32);
          ctx.scale(megaPulse, megaPulse);
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.moveTo(-22, -16);
          ctx.lineTo(22, -16);
          ctx.lineTo(68, 42);
          ctx.lineTo(-68, 42);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#090507';
          ctx.beginPath();
          ctx.ellipse(0, 42, 66, 18, 0, 0, Math.PI * 2);
          ctx.fill();
          // Wet propaganda paper tatters stuffed behind megaphone rim
          ctx.fillStyle = '#d6d3d1';
          ctx.fillRect(-28, 22, 18, 24);
          ctx.fillRect(10, 20, 20, 26);
          ctx.restore();
          ctx.restore();
        } else {
          // Quỷ Sai Cắt Lưỡi close-up: Rusted iron chain collar, weeping mask skull, giant notched shears
          const hoodGrad = ctx.createRadialGradient(0, -32, 10, 0, -24, 86);
          hoodGrad.addColorStop(0, ghostPass ? '#991b1b' : '#9499a0');
          hoodGrad.addColorStop(0.58, ghostPass ? '#3b0709' : '#4a4e54');
          hoodGrad.addColorStop(1, '#121013');
          ctx.fillStyle = hoodGrad;
          ctx.beginPath();
          ctx.ellipse(0, -34, 58, 74, 0, 0, Math.PI * 2);
          ctx.fill();

          // Dark blind-cloth & jagged blood-tear gashes
          ctx.fillStyle = '#090608';
          ctx.fillRect(-54, -56, 108, 22);
          for (const side of [-1, 1] as const) {
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(side * 24 - 3, -44, 6, 56);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(side * 24, -45, 3.6, 0, Math.PI * 2);
            ctx.fill();
          }

          // Heavy rusted shackle chain draped across neck
          ctx.strokeStyle = '#574238';
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(-75, 42);
          ctx.quadraticCurveTo(0, 86, 75, 42);
          ctx.stroke();

          // Massive notched rusted iron scissor blades violently slamming shut at p = 0.36
          const snapAngle = p < 0.36 ? Math.max(0.03, 0.56 - (p / 0.36) * 0.53) : 0.03;
          for (const dir of [-1, 1] as const) {
            ctx.save();
            ctx.translate(0, 48);
            ctx.rotate(dir * snapAngle);
            const bladeGrad = ctx.createLinearGradient(0, -18, dir * 195, 16);
            bladeGrad.addColorStop(0, '#475569');
            bladeGrad.addColorStop(0.55, '#94a3b8');
            bladeGrad.addColorStop(1, '#7f1d1d');
            ctx.fillStyle = bladeGrad;
            ctx.beginPath();
            ctx.moveTo(-dir * 12, -4);
            ctx.lineTo(dir * 195, -24);
            ctx.lineTo(dir * 212, 5);
            ctx.lineTo(0, 17);
            ctx.closePath();
            ctx.fill();

            // Cold steel highlight edge
            ctx.strokeStyle = 'rgba(241, 245, 249, 0.55)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(dir * 194, -22);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Whipping tangled wet black hair strands across forehead/cheeks
        ctx.strokeStyle = ghostPass ? 'rgba(69, 10, 10, 0.55)' : 'rgba(6, 5, 7, 0.88)';
        ctx.lineWidth = 3.2;
        for (let h = -3; h <= 3; h += 1) {
          const sx = h * 17;
          const hairWave = Math.sin(timeSec * 22 + h * 1.4) * 18;
          ctx.beginPath();
          ctx.moveTo(sx, -78);
          ctx.quadraticCurveTo(sx + hairWave * 0.5, -18, sx + hairWave, 55);
          ctx.stroke();
        }

        ctx.restore();
      };

      // Chromatic double-exposure afterimage + sharp main nightmare face
      drawMonsterFace(true, 0.38);
      drawMonsterFace(false, 0.96);

      // Clawed skeletal fingers gripping left & right viewport edges
      const clawReach = Math.min(1, p * 2.2) * fadeOut;
      if (clawReach > 0.05) {
        for (const side of [-1, 1] as const) {
          const baseX = side === -1 ? -14 + clawReach * 52 : width + 14 - clawReach * 52;
          const handY = height * 0.56 + Math.sin(timeSec * 26 + side) * 6;
          ctx.save();
          ctx.globalAlpha = 0.85 * fadeOut;
          ctx.strokeStyle = '#52525b';
          ctx.lineWidth = 7;
          ctx.lineCap = 'round';
          for (let f = -2; f <= 2; f += 1) {
            ctx.beginPath();
            ctx.moveTo(baseX - side * 40, handY + f * 18);
            ctx.quadraticCurveTo(
              baseX + side * 12,
              handY + f * 20 - 8,
              baseX + side * 34,
              handY + f * 24 + 6
            );
            ctx.stroke();
            // Crimson bloodstained claw tip
            ctx.fillStyle = '#991b1b';
            ctx.beginPath();
            ctx.arc(baseX + side * 35, handY + f * 24 + 6, 3.2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // Impact blood slash / crimson lens splatter around the snap/lunge peak
      if (p > 0.34 && p < 0.72) {
        const slashAlpha = Math.max(0, 1 - (p - 0.34) / 0.38) * 0.68;
        ctx.save();
        ctx.globalAlpha = slashAlpha;
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx - 170, cy - 110);
        ctx.lineTo(cx + 170, cy + 110);
        if (dc.killerKind === 'tongue_warden') {
          ctx.moveTo(cx + 165, cy - 105);
          ctx.lineTo(cx - 165, cy + 105);
        }
        ctx.stroke();

        ctx.fillStyle = '#7f1d1d';
        for (let b = 0; b < 9; b += 1) {
          const bx = cx + Math.sin(b * 2.4) * 195;
          const by = cy + Math.cos(b * 1.9) * 120 + (p - 0.34) * 110;
          ctx.beginPath();
          ctx.ellipse(bx, by, 3.5 + (b % 3), 8 + (b % 4) * 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // 3. Fallen Oil Lantern Sparks near bottom-left
    if (p > 0.12 && p < 0.62) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.78)';
      for (let i = 0; i < 10; i += 1) {
        const sx = cx - 95 + Math.cos(i * 0.85) * (p * 160);
        const sy = height * 0.78 + Math.sin(i * 1.1) * (p * 42);
        ctx.fillRect(sx, sy, 3.5, 3.5);
      }
    }

    // 4. 16mm Celluloid Film Burn Edges & Story Horror Verdict Subtitle
    if (p > 0.44) {
      const burn = Math.min(1, (p - 0.44) * 2.2);
      const burnGrad = ctx.createRadialGradient(cx, cy, width * 0.22, cx, cy, width * 0.68);
      burnGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      burnGrad.addColorStop(0.78, `rgba(120, 20, 12, ${burn * 0.32})`);
      burnGrad.addColorStop(1, `rgba(180, 65, 18, ${burn * 0.48})`);
      ctx.fillStyle = burnGrad;
      ctx.fillRect(0, 0, width, height);

      const textAlpha = Math.min(1, (p - 0.44) * 3.4);
      ctx.save();
      ctx.globalAlpha = textAlpha;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
      ctx.fillRect(cx - 320, height * 0.39, 640, 88);

      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(dc.killerName.toUpperCase(), cx, height * 0.44);

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'italic 20px Georgia, serif';
      ctx.fillText(dc.storyWhisper, cx, height * 0.52);
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
    const isYin = state.realm === 'yin';
    const isCourtyard = state.scene === 'flooded_courtyard';
    const isRooftop = state.scene === 'roof_belltower';
    const isOffice = state.scene === 'teachers_office';
    const is1986 = state.scene === 'ruined_hall_1986';
    const isDarkroom = state.scene === 'darkroom';
    const isDorm = state.scene === 'dorm_hall';

    if (isRooftop) {
      // Storm-swept concrete rooftop parapet balustrade above crimson flood valley
      ctx.fillStyle = isYin ? '#1d090b' : '#1b2028';
      ctx.fillRect(0, floorY - 56, roomW, 10);
      for (let bx = 30; bx < roomW; bx += 54) {
        ctx.fillStyle = isYin ? '#2a0c10' : '#242b35';
        ctx.fillRect(bx, floorY - 46, 14, 46);
      }
      ctx.fillStyle = isYin ? '#140507' : '#11161d';
      ctx.fillRect(0, floorY - 8, roomW, 8);
    } else if (!isCourtyard) {
      ctx.fillStyle = isDarkroom
        ? '#240507'
        : isYin
          ? '#210709'
          : is1986
            ? '#161b18'
            : '#171a1e';
      ctx.fillRect(0, 0, roomW, height * 0.16);

      for (let x = 40; x < roomW; x += 220) {
        const skew = isDorm ? Math.sin(x * 0.02 + timeSec * 0.6) * 5 : 0;
        ctx.fillStyle = isDarkroom
          ? '#100203'
          : isYin
            ? '#120304'
            : is1986
              ? '#0b100d'
              : '#0b0e12';
        ctx.fillRect(x, height * 0.14 + skew, 46, floorY - height * 0.14);

        // Exposed cracked red brick & damp mold stains peeling through old limewash
        ctx.fillStyle = isYin ? 'rgba(110, 12, 16, 0.42)' : 'rgba(65, 28, 24, 0.45)';
        ctx.fillRect(x + 12, height * 0.34, 18, 26);
        ctx.fillStyle = isYin ? 'rgba(90, 8, 12, 0.48)' : 'rgba(6, 8, 12, 0.48)';
        ctx.fillRect(x + 6, height * 0.15, 8, 150 + (x % 48));
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x + 28, height * 0.18);
        ctx.lineTo(x + 18, height * 0.31);
        ctx.lineTo(x + 32, height * 0.44);
        ctx.lineTo(x + 22, height * 0.56);
        ctx.stroke();

        // Corner ceiling cobwebs
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.14)';
        for (let w = 0; w < 4; w += 1) {
          ctx.beginPath();
          ctx.moveTo(x + 46, height * 0.16);
          ctx.quadraticCurveTo(x + 62 + w * 4, height * 0.19 + w * 4, x + 76 + w * 5, height * 0.16);
          ctx.stroke();
        }

        // Swaying dying tungsten bulb hanging from ceiling every other bay
        if (!isDarkroom && (x / 220) % 2 === 1) {
          const swing = Math.sin(timeSec * 1.9 + x) * 0.08;
          const bulbFlicker = Math.sin(timeSec * 31 + x) > 0.88 ? 0.12 : 0.45;
          ctx.save();
          ctx.translate(x + 130, height * 0.15);
          ctx.rotate(swing);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 34);
          ctx.stroke();
          ctx.fillStyle = `rgba(253, 224, 71, ${bulbFlicker})`;
          ctx.beginPath();
          ctx.arc(0, 36, 4, 0, Math.PI * 2);
          ctx.fill();
          // Soft ceiling cone cast by swaying bulb
          const cone = ctx.createRadialGradient(0, 36, 2, 0, 95, 110);
          cone.addColorStop(0, `rgba(253, 224, 71, ${bulbFlicker * 0.25})`);
          cone.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = cone;
          ctx.fillRect(-100, 30, 200, 140);
          ctx.restore();
        }

        if (!isDarkroom) {
          ctx.strokeStyle = isYin ? '#381214' : '#24292e';
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 56, height * 0.18 + skew, 148, height * 0.36);

          const shaftAlpha = (isYin ? 0.06 : 0.045) + this.lightningFlash * 0.19;
          const beamGrad = ctx.createLinearGradient(x + 120, height * 0.18, x + 40, floorY);
          beamGrad.addColorStop(
            0,
            isYin
              ? `rgba(220, 45, 55, ${shaftAlpha * 1.4})`
              : `rgba(186, 210, 235, ${shaftAlpha})`
          );
          beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(x + 60, height * 0.18 + skew);
          ctx.lineTo(x + 200, height * 0.18 + skew);
          ctx.lineTo(x + 120, floorY);
          ctx.lineTo(x - 20, floorY);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#2d2118';
          ctx.fillRect(x + 58, height * 0.29 + skew, 144, 12);
          ctx.fillRect(x + 58, height * 0.41 + skew, 144, 12);
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

      ctx.fillStyle = isDarkroom
        ? '#1a0406'
        : isYin
          ? '#2b0b0d'
          : is1986
            ? '#18211b'
            : '#201a16';
      ctx.fillRect(0, height * 0.56, roomW, floorY - height * 0.56);

      if (!isDarkroom && !is1986) {
        const uncanny = isYin || state.sanity < 70 || state.activePhantomX !== null;
        for (let x = 160; x < roomW - 120; x += 310) {
          ctx.save();
          ctx.translate(x, height * 0.21);
          ctx.rotate(Math.sin(timeSec * 1.4 + x) * 0.04);
          ctx.fillStyle = isYin ? '#5c0e12' : '#4a1b19';
          ctx.fillRect(-40, 0, 80, 30);
          ctx.fillStyle = 'rgba(235, 225, 205, 0.72)';
          ctx.font = 'bold 10px serif';
          ctx.textAlign = 'center';
          ctx.fillText(uncanny ? 'ĐỪNG QUAY LẠI' : isOffice ? 'TÔN SƯ TRỌNG ĐẠO' : 'TỰ KIỂM ĐIỂM', 0, 19);
          ctx.restore();

          ctx.save();
          ctx.translate(x + 95, height * 0.15);
          ctx.rotate(Math.sin(timeSec * 2.1 + x) * 0.09);
          ctx.fillStyle = isYin ? 'rgba(210, 180, 180, 0.5)' : 'rgba(230, 230, 224, 0.6)';
          ctx.fillRect(-5, 0, 10, 50);
          ctx.restore();
        }
      }
    }

    // Teachers' Office bookshelves, vintage pendulum clock & hanging calligraphy scroll
    if (isOffice) {
      for (const sx of [190, 470, 770]) {
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
      // Hanging ink scroll beside grading desk
      ctx.fillStyle = '#d6ccb8';
      ctx.fillRect(618, height * 0.21, 44, 98);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(614, height * 0.21, 52, 5);
      ctx.fillRect(614, height * 0.21 + 96, 52, 6);
      ctx.font = 'bold 12px serif';
      ctx.textAlign = 'center';
      ctx.fillText('清', 640, height * 0.21 + 36);
      ctx.fillText('明', 640, height * 0.21 + 66);
    }

    // Overturned school desks & bloody handprints in Classroom 12B
    if (state.scene === 'classroom_12b') {
      const eerieBoard = isYin || state.sanity < 70 || state.activePhantomX !== null;
      ctx.fillStyle = '#14261d';
      ctx.fillRect(310, height * 0.25, 220, 96);
      ctx.strokeStyle = '#4e3726';
      ctx.lineWidth = 4;
      ctx.strokeRect(310, height * 0.25, 220, 96);
      ctx.fillStyle = eerieBoard ? 'rgba(252, 165, 165, 0.86)' : 'rgba(226, 232, 240, 0.78)';
      ctx.font = 'bold 12px serif';
      ctx.textAlign = 'center';
      ctx.fillText(eerieBoard ? 'NÓ ĐANG ĐỨNG SAU LƯNG' : 'ĐẢ ĐẢO TRÍ THỨC', 420, height * 0.33);
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(335, height * 0.28);
      ctx.lineTo(505, height * 0.4);
      ctx.moveTo(505, height * 0.28);
      ctx.lineTo(335, height * 0.4);
      ctx.stroke();

      // Overturned desk silhouette at x=360 & x=705
      ctx.save();
      ctx.translate(365, floorY);
      ctx.rotate(-0.28);
      ctx.fillStyle = '#251a13';
      ctx.fillRect(-26, -34, 52, 8);
      ctx.fillRect(-20, -26, 6, 26);
      ctx.fillRect(14, -26, 6, 26);
      ctx.restore();
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
        // Eerie white negative head silhouette inside hanging film strip
        ctx.fillStyle = 'rgba(254, 202, 202, 0.35)';
        ctx.beginPath();
        ctx.arc(0, 26, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      for (const lx of [260, 520, 760]) {
        const bulbGrad = ctx.createRadialGradient(lx, height * 0.14, 4, lx, height * 0.14, 72);
        bulbGrad.addColorStop(0, 'rgba(239, 68, 68, 0.58)');
        bulbGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = bulbGrad;
        ctx.fillRect(lx - 72, height * 0.14 - 72, 144, 144);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(lx, height * 0.14, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (isCourtyard) {
      const waterGrad = ctx.createLinearGradient(0, floorY, 0, height);
      waterGrad.addColorStop(0, '#0e1721');
      waterGrad.addColorStop(1, '#06090e');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, floorY, roomW, height - floorY);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.24)';
      ctx.lineWidth = 1;
      for (let rx = 90; rx < roomW; rx += 130) {
        const rad = 8 + ((timeSec * 22 + rx) % 26);
        ctx.beginPath();
        ctx.ellipse(rx, floorY + 26, rad, rad * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      const floorGrad = ctx.createLinearGradient(0, floorY, 0, height);
      floorGrad.addColorStop(0, isDarkroom ? '#120304' : isYin ? '#190608' : '#120e0c');
      floorGrad.addColorStop(0.45, '#090707');
      floorGrad.addColorStop(1, '#040304');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, floorY, roomW, height - floorY);

      // Perspective damp floorboards + subtle rainwater sheen near window bays
      ctx.strokeStyle = isYin ? 'rgba(110, 16, 20, 0.42)' : 'rgba(65, 52, 42, 0.36)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < roomW; x += 68) {
        ctx.beginPath();
        ctx.moveTo(x, floorY);
        ctx.lineTo(x - 42, height);
        ctx.stroke();
      }
      ctx.fillStyle = isYin ? 'rgba(140, 20, 24, 0.08)' : 'rgba(148, 163, 184, 0.05)';
      for (let px = 110; px < roomW; px += 220) {
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
    const mistGrad = ctx.createLinearGradient(0, floorY - 38, 0, floorY + 22);
    mistGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    mistGrad.addColorStop(
      0.6,
      isYin ? 'rgba(127, 29, 29, 0.14)' : 'rgba(148, 163, 184, 0.08)'
    );
    mistGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, floorY - 38, worldSpan + 200, 62);

    // Slow drifting mist ribbons along floor
    ctx.fillStyle = isYin ? 'rgba(153, 27, 27, 0.08)' : 'rgba(203, 213, 225, 0.05)';
    for (let x = 0; x < worldSpan; x += 220) {
      const drift = (x + timeSec * 18) % worldSpan;
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
    ctx.fillRect(540 - 3 + wave, floorY + 2, 6, 86);
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
        // Outer wooden doorframe & threshold step (towering ~186px above 156px Lâm Tĩnh)
        ctx.fillStyle = '#18110c';
        ctx.fillRect(-43, -192, 86, 192);
        const doorGrad = ctx.createLinearGradient(-37, -184, 37, 0);
        if (hs.kind === 'illogical_door') {
          doorGrad.addColorStop(0, '#3a181e');
          doorGrad.addColorStop(1, '#1a0a0d');
        } else {
          doorGrad.addColorStop(0, '#332419');
          doorGrad.addColorStop(1, '#1b120d');
        }
        ctx.fillStyle = doorGrad;
        ctx.fillRect(-37, -184, 74, 184);
        ctx.strokeStyle = isActive ? '#f59e0b' : '#4a382b';
        ctx.lineWidth = isActive ? 2.5 : 2;
        ctx.strokeRect(-37, -184, 74, 184);

        // Recessed upper/lower wooden panels & glass transom window
        ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
        ctx.fillRect(-29, -174, 58, 34);
        ctx.strokeStyle = 'rgba(87, 67, 52, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-27, -128, 54, 48);
        ctx.strokeRect(-27, -70, 54, 58);

        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(25, -88, 3.8, 0, Math.PI * 2);
        ctx.fill();

        if (locked) {
          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(-34, -138);
          ctx.lineTo(34, -56);
          ctx.moveTo(34, -138);
          ctx.lineTo(-34, -56);
          ctx.stroke();
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
        ctx.font = 'bold 12px serif';
        ctx.textAlign = 'center';
        ctx.fillText('清明', 0, -48);
        ctx.font = '9px serif';
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
        ctx.fillStyle = '#332419';
        ctx.fillRect(-28, -48, 56, 48);
        const uncollected =
          (hs.kind === 'pickup' && hs.itemReward && !state.inventory.includes(hs.itemReward.id)) ||
          (hs.kind === 'keepsake' &&
            hs.keepsakeId &&
            !state.collectedKeepsakeIds.includes(hs.keepsakeId));
        if (uncollected) {
          const glowR = 11 + Math.sin(timeSec * 4) * 3;
          const glint = ctx.createRadialGradient(0, -60, 1, 0, -60, glowR);
          glint.addColorStop(0, 'rgba(251, 191, 36, 0.95)');
          glint.addColorStop(1, 'rgba(251, 191, 36, 0)');
          ctx.fillStyle = glint;
          ctx.fillRect(-glowR, -60 - glowR, glowR * 2, glowR * 2);
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
        ctx.font = 'bold 11px sans-serif';
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
    ctx.translate(675, floorY);

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
      Math.sin(timeSec * 31 + ghost.x * 0.13) > (ghost.alerted ? 0.82 : 0.93);
    const neckSnap = isTwitch ? Math.sin(timeSec * 73) * 0.4 : 0;
    const strideBob = Math.sin(timeSec * (ghost.alerted ? 4.6 : 2.6)) * 2.4;
    const crouchHunch = 0.08 + dread * 0.13;
    const lanternSide = state.playerX < ghost.x ? -1 : 1;

    ctx.save();
    ctx.translate(ghost.x, floorY);

    // 1. Towering Distorted Wall Shadow Cast by Lâm Tĩnh's Lantern
    const shadowDir = Math.sign(ghost.x - state.playerX) || ghost.facing;
    const shadowReach = shadowDir * (46 + proximity * 60);
    const shadowAlpha = isYin ? 0.48 : 0.36 + proximity * 0.25;
    ctx.save();
    ctx.fillStyle = `rgba(2, 1, 4, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.quadraticCurveTo(
      shadowReach * 0.45,
      -155,
      shadowReach + Math.sin(timeSec * 3.1) * 9,
      ghost.kind === 'paper_hat' ? -305 : -270
    );
    ctx.lineTo(shadowReach + shadowDir * 28, -215);
    ctx.lineTo(shadowReach + shadowDir * (64 + dread * 28), -178 + Math.sin(timeSec * 5) * 10);
    ctx.lineTo(shadowReach + shadowDir * 28, -148);
    ctx.lineTo(30, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Cold Ground Fog + Dark Ash / Wet Blood Pool Shadow under Ghost
    const groundShadow = ctx.createRadialGradient(0, 2, 4, 0, 2, 48);
    groundShadow.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    groundShadow.addColorStop(0.6, 'rgba(38, 4, 7, 0.42)');
    groundShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = groundShadow;
    ctx.fillRect(-52, -12, 104, 28);

    for (let w = 0; w < 5; w += 1) {
      const phase = (timeSec * 0.85 + w * 0.2) % 1;
      const wx = Math.sin(timeSec * 2.2 + w * 2.1) * 20 - ghost.facing * phase * 26;
      const wy = -8 - phase * 76;
      ctx.fillStyle = `rgba(${ghost.alerted ? '96, 10, 14' : '12, 16, 22'}, ${(1 - phase) * 0.38})`;
      ctx.beginPath();
      ctx.arc(wx, wy, 7 + phase * 12, 0, Math.PI * 2);
      ctx.fill();
    }

    const renderArticulatedGhost = (isAfterimage: boolean) => {
      ctx.save();
      if (isAfterimage) {
        const glitchX = Math.sin(timeSec * 41) * (ghost.alerted ? 8.5 : 4.5);
        const glitchY = Math.cos(timeSec * 33) * 2.8;
        ctx.translate(glitchX, glitchY);
        ctx.globalAlpha = ghost.alerted ? 0.4 : 0.24;
      }

      ctx.scale(ghost.facing, 1);

      const flowBack = -16 - Math.sin(timeSec * 4.2) * 5.5;
      const upperSway = Math.sin(timeSec * 2.3 + ghost.x * 0.02) * 2.8;

      // Gaunt Pale Exposed Feet / Tattered Trouser Hem under Shroud
      if (!isAfterimage) {
        ctx.fillStyle = '#525760';
        ctx.fillRect(-8, -11, 5, 11);
        ctx.fillRect(5, -9, 5, 9);
      }

      // A. Layered Wet Tattered Funeral Shroud / Guard Uniform (Towering up to -168 shoulder height)
      const shroudBaseGrad = ctx.createLinearGradient(-24, -172, 24, 0);
      if (isAfterimage) {
        shroudBaseGrad.addColorStop(0, '#7f1d1d');
        shroudBaseGrad.addColorStop(1, '#1a0406');
      } else if (isYin) {
        shroudBaseGrad.addColorStop(0, '#31070c');
        shroudBaseGrad.addColorStop(0.55, '#160406');
        shroudBaseGrad.addColorStop(1, '#060102');
      } else {
        shroudBaseGrad.addColorStop(0, ghost.kind === 'tongue_warden' ? '#201b20' : '#1b2029');
        shroudBaseGrad.addColorStop(0.6, '#0d0f14');
        shroudBaseGrad.addColorStop(1, '#040507');
      }

      for (let r = 0; r < 3; r += 1) {
        const wave = Math.sin(timeSec * (4.6 + r) + r * 1.3) * (7 + r * 2.2);
        ctx.fillStyle = isAfterimage
          ? 'rgba(127, 29, 29, 0.35)'
          : r === 0
            ? 'rgba(12, 15, 22, 0.86)'
            : 'rgba(28, 19, 22, 0.68)';
        ctx.beginPath();
        ctx.moveTo(-14 + r * 4, -162 + r * 20);
        ctx.quadraticCurveTo(flowBack - r * 5 + wave * 0.5, -88, flowBack - 12 + wave, -5 - r * 3);
        ctx.lineTo(-4 + r * 5, -14);
        ctx.closePath();
        ctx.fill();
      }

      // Main Draped Shroud with Fold Creases & Muddy Torn Hem
      ctx.fillStyle = shroudBaseGrad;
      ctx.beginPath();
      ctx.moveTo(-21 + upperSway, -168 + strideBob);
      ctx.quadraticCurveTo(23 + upperSway, -162 + strideBob, 23, -82);
      ctx.lineTo(27 + Math.sin(timeSec * 3.8) * 3.5, -6);
      ctx.quadraticCurveTo(11, -15, 2, -3);
      ctx.quadraticCurveTo(-11, -16, -26 + Math.cos(timeSec * 3.4) * 3.5, -5);
      ctx.lineTo(-24, -90);
      ctx.closePath();
      ctx.fill();

      // Subtle Chiaroscuro Cloth Fold & Bloodstain Streaks on Torso
      if (!isAfterimage) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-6 + upperSway, -160 + strideBob);
        ctx.quadraticCurveTo(-10, -90, -12, -16);
        ctx.moveTo(7 + upperSway, -156 + strideBob);
        ctx.quadraticCurveTo(10, -84, 9, -15);
        ctx.stroke();

        // Oil-lantern rim highlight along facing silhouette
        if (proximity > 0.12) {
          const rimX = lanternSide * ghost.facing > 0 ? 20 : -20;
          ctx.strokeStyle = isYin
            ? `rgba(220, 38, 38, ${proximity * 0.42})`
            : `rgba(251, 191, 36, ${proximity * 0.32})`;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(rimX, -158 + strideBob);
          ctx.quadraticCurveTo(rimX * 1.15, -82, rimX * 1.12, -14);
          ctx.stroke();
        }
      }

      if (ghost.kind === 'paper_hat') {
        // B. Gaunt Skeletal Neck & Hunched Realistic Haunted Skull + Tall Dunce Cap (~194px head, cap tip -295)
        ctx.strokeStyle = isAfterimage ? '#7f1d1d' : '#636873';
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.moveTo(2 + upperSway, -168 + strideBob);
        ctx.lineTo(7 + upperSway, -176 + strideBob);
        ctx.stroke();

        ctx.save();
        ctx.translate(7 + upperSway, -178 + strideBob);
        ctx.rotate(crouchHunch + neckSnap);

        const skullGrad = ctx.createRadialGradient(4, -2, 2, 0, 0, 18);
        skullGrad.addColorStop(0, isAfterimage ? '#991b1b' : '#9aa0aa');
        skullGrad.addColorStop(0.6, isAfterimage ? '#450a0a' : '#434852');
        skullGrad.addColorStop(1, '#101217');
        ctx.fillStyle = skullGrad;
        ctx.beginPath();
        ctx.moveTo(-12, -15);
        ctx.quadraticCurveTo(13, -17, 15, -2);
        ctx.quadraticCurveTo(14, 14, 3, 17);
        ctx.quadraticCurveTo(-13, 12, -12, -15);
        ctx.closePath();
        ctx.fill();

        // Sunken cheekbone shadow + hollow orbital socket + pinpoint crimson pupil + dried blood tear
        ctx.fillStyle = '#050406';
        ctx.beginPath();
        ctx.ellipse(7.2, -3.2, 4.6, 5.4, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(8.2, -2.8, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fecaca';
        ctx.fillRect(7.9, -3.4, 0.9, 0.9);

        ctx.fillStyle = 'rgba(127, 29, 29, 0.9)';
        ctx.fillRect(6.2, 1.8, 2.0, 10);
        ctx.fillStyle = '#070304';
        ctx.beginPath();
        ctx.ellipse(7.5, 9.8, 4.4, 5.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Weathered yellowed dunce cap with blood-ink characters & fluttering paper strips
        const capGrad = ctx.createLinearGradient(-17, -108, 17, -9);
        capGrad.addColorStop(0, isAfterimage ? '#7f1d1d' : '#a8a29e');
        capGrad.addColorStop(0.7, isAfterimage ? '#450a0a' : '#78716c');
        capGrad.addColorStop(1, '#3b2b28');
        ctx.fillStyle = capGrad;
        ctx.beginPath();
        ctx.moveTo(-17, -10);
        ctx.lineTo(-3, -110);
        ctx.lineTo(2, -108);
        ctx.lineTo(16, -10);
        ctx.closePath();
        ctx.fill();

        const tagSwing = Math.sin(timeSec * 5.2) * 4.5;
        ctx.fillStyle = 'rgba(214, 211, 209, 0.74)';
        ctx.beginPath();
        ctx.moveTo(-14, -10);
        ctx.lineTo(-16 + tagSwing, 14);
        ctx.lineTo(-11 + tagSwing, 14);
        ctx.closePath();
        ctx.fill();

        if (!isAfterimage) {
          ctx.fillStyle = 'rgba(127, 29, 29, 0.92)';
          ctx.font = 'bold 9.5px serif';
          ctx.textAlign = 'center';
          ctx.fillText('TỘI', 0, -38);
        }
        ctx.restore();

        // C. Wet Glossy Crimson Tongue + Dripping Drops
        const tongueWhip = Math.sin(timeSec * (ghost.alerted ? 7.5 : 4.2)) * (9 + dread * 10);
        const tongueBaseX = 15 + upperSway;
        const tongueBaseY = -165 + strideBob;
        const tongueTipX = 30 + Math.cos(timeSec * 3.8) * 14 + dread * 10;
        const tongueTipY = -3;

        ctx.strokeStyle = isAfterimage ? 'rgba(127, 29, 29, 0.45)' : '#5c0a0e';
        ctx.lineWidth = 8.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tongueBaseX, tongueBaseY);
        ctx.bezierCurveTo(
          38 + dread * 9,
          -116,
          6 + tongueWhip,
          -52,
          tongueTipX,
          tongueTipY
        );
        ctx.stroke();

        if (!isAfterimage) {
          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 4.5;
          ctx.stroke();
          ctx.strokeStyle = 'rgba(248, 113, 113, 0.42)';
          ctx.lineWidth = 1.3;
          ctx.stroke();

          const dropPhase = (timeSec * 1.45) % 1;
          ctx.fillStyle = `rgba(153, 27, 27, ${1 - dropPhase * 0.5})`;
          ctx.beginPath();
          ctx.ellipse(24, -74 + dropPhase * 72, 1.9, 3.6, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // D. Scarred Wooden Guilt Placard hanging from frayed hemp cord
        ctx.strokeStyle = '#786248';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-6 + upperSway, -162);
        ctx.lineTo(-15, -143);
        ctx.moveTo(10 + upperSway, -162);
        ctx.lineTo(15, -143);
        ctx.stroke();

        ctx.fillStyle = isAfterimage ? '#450a0a' : '#573c26';
        ctx.fillRect(-19, -144, 40, 22);
        ctx.strokeStyle = '#291b10';
        ctx.lineWidth = 1;
        ctx.strokeRect(-19, -144, 40, 22);
        if (!isAfterimage) {
          ctx.fillStyle = '#09090b';
          ctx.font = 'bold 7px serif';
          ctx.textAlign = 'center';
          ctx.fillText(ghost.placardText, 1, -130);
        }

        // E. Reaching Articulated Skeletal Forearm & Gaunt Clawed Fingers
        const armLift = dread * 0.82;
        const shoulderX = 5 + upperSway;
        const shoulderY = -152 + strideBob;
        const elbowX = shoulderX + 7 + armLift * 20;
        const elbowY = shoulderY + 38 - armLift * 26;
        const handX = elbowX + 6 + armLift * 24;
        const handY = elbowY + 36 - armLift * 24 + Math.sin(timeSec * 6) * 2.5;

        ctx.fillStyle = isAfterimage ? '#7f1d1d' : '#1b1e24';
        ctx.beginPath();
        ctx.moveTo(shoulderX - 3.8, shoulderY);
        ctx.lineTo(shoulderX + 3.8, shoulderY);
        ctx.lineTo(elbowX + 2.6, elbowY);
        ctx.lineTo(handX + 1.8, handY);
        ctx.lineTo(handX - 1.8, handY);
        ctx.lineTo(elbowX - 2.6, elbowY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isAfterimage ? '#991b1b' : '#94a3b8';
        ctx.lineWidth = 1.6;
        for (let f = -1; f <= 1; f += 1) {
          ctx.beginPath();
          ctx.moveTo(handX, handY);
          ctx.lineTo(handX + 9 + armLift * 5, handY + f * 3.8 + 4.5);
          ctx.stroke();
        }
      } else if (ghost.variant === 'auditor_specter') {
        // Ác Linh Tự Vệ — Trương Vệ Quốc (~188px tall, 70° snapped neck, Red Guard armband, cracked megaphone & heavy spiked ruler)
        if (!isAfterimage) {
          ctx.fillStyle = '#881337';
          ctx.fillRect(-17 + upperSway, -148 + strideBob, 12, 16);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-15 + upperSway, -143 + strideBob, 8, 2.2);
        }

        ctx.save();
        ctx.translate(7 + upperSway, -182 + strideBob);
        ctx.rotate(0.68 + neckSnap * 0.6);
        const auditorFace = ctx.createRadialGradient(2, -2, 2, 0, 0, 18);
        auditorFace.addColorStop(0, isAfterimage ? '#991b1b' : '#a1a8b3');
        auditorFace.addColorStop(0.68, isAfterimage ? '#450a0a' : '#374151');
        auditorFace.addColorStop(1, '#09090b');
        ctx.fillStyle = auditorFace;
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(0, -6, 15, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-5, -11, 22, 4.2);
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(6.5, -1, 2.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const megaX = 18 + upperSway;
        const megaY = -156 + strideBob;
        ctx.fillStyle = isAfterimage ? '#7f1d1d' : '#475569';
        ctx.beginPath();
        ctx.moveTo(megaX - 7, megaY - 5.5);
        ctx.lineTo(megaX + 20, megaY - 13);
        ctx.lineTo(megaX + 20, megaY + 13);
        ctx.lineTo(megaX - 7, megaY + 5.5);
        ctx.closePath();
        ctx.fill();

        if (!isAfterimage) {
          const waveP = (timeSec * 1.9) % 1;
          ctx.strokeStyle = `rgba(220, 38, 38, ${(1 - waveP) * 0.58})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(megaX + 21, megaY, 8 + waveP * 28, -0.7, 0.7);
          ctx.stroke();
        }

        const armThrust = Math.sin(timeSec * (ghost.alerted ? 6 : 3)) * 5.5;
        ctx.strokeStyle = isAfterimage ? '#7f1d1d' : '#262b27';
        ctx.lineWidth = 6.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0 + upperSway, -148 + strideBob);
        ctx.lineTo(14, -100);
        ctx.lineTo(24 + armThrust, -66);
        ctx.stroke();

        ctx.strokeStyle = isAfterimage ? '#991b1b' : '#573b24';
        ctx.lineWidth = 4.8;
        ctx.beginPath();
        ctx.moveTo(24 + armThrust, -68);
        ctx.lineTo(42 + armThrust * 0.8, -2);
        ctx.stroke();

        ctx.fillStyle = isAfterimage ? '#450a0a' : '#573c26';
        ctx.fillRect(-19, -138, 40, 21);
        if (!isAfterimage) {
          ctx.fillStyle = '#09090b';
          ctx.font = 'bold 7px serif';
          ctx.textAlign = 'center';
          ctx.fillText(ghost.placardText, 1, -124);
        }
      } else {
        // Quỷ Sai Cắt Lưỡi (~192px tall Stooped Prison Warden, Rusted Shackle Chains, Thrusting Notched Shears)
        const chainSwing = Math.sin(timeSec * 3.6) * 7.5;
        ctx.strokeStyle = isAfterimage ? '#7f1d1d' : '#574236';
        ctx.lineWidth = 2.8;
        ctx.setLineDash([4.5, 2.2]);
        ctx.beginPath();
        ctx.moveTo(-13, -114);
        ctx.quadraticCurveTo(-24 + chainSwing, -54, -20 + chainSwing * 1.2, -2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.save();
        ctx.translate(5 + upperSway, -184 + strideBob);
        ctx.rotate(crouchHunch * 0.8 + neckSnap);

        const wardenFaceGrad = ctx.createRadialGradient(3, -3, 2, 0, 0, 19);
        wardenFaceGrad.addColorStop(0, isAfterimage ? '#991b1b' : '#848a94');
        wardenFaceGrad.addColorStop(0.68, isAfterimage ? '#450a0a' : '#31343b');
        wardenFaceGrad.addColorStop(1, '#101014');
        ctx.fillStyle = wardenFaceGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#09090b';
        ctx.fillRect(-14, -16, 31, 7.5);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(5.5, -3, 2.8, 14);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(7.0, -4.5, 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const snipCycle = Math.sin(timeSec * (ghost.alerted ? 7.2 : 4.8));
        const thrust = Math.max(0, snipCycle) * (8 + dread * 10);
        const snipAngle = Math.abs(snipCycle) * 0.34;
        const shearPivotX = 20 + thrust;
        const shearPivotY = -120 + strideBob;

        ctx.strokeStyle = isAfterimage ? '#7f1d1d' : '#261417';
        ctx.lineWidth = 6.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(2 + upperSway, -154 + strideBob);
        ctx.lineTo(13, -132);
        ctx.lineTo(shearPivotX, shearPivotY);
        ctx.stroke();

        ctx.save();
        ctx.translate(shearPivotX, shearPivotY);
        for (const dir of [-1, 1] as const) {
          ctx.save();
          ctx.rotate(dir * snipAngle);
          const bladeGrad = ctx.createLinearGradient(0, 0, 48, 0);
          bladeGrad.addColorStop(0, '#475569');
          bladeGrad.addColorStop(0.7, '#94a3b8');
          bladeGrad.addColorStop(1, '#7f1d1d');
          ctx.fillStyle = isAfterimage ? '#7f1d1d' : bladeGrad;
          ctx.beginPath();
          ctx.moveTo(-2, 0);
          ctx.lineTo(48, dir * 6.5);
          ctx.lineTo(0, dir * 5.6);
          ctx.closePath();
          ctx.fill();
          if (!isAfterimage) {
            ctx.strokeStyle = 'rgba(241, 245, 249, 0.55)';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(0, dir * 1.2);
            ctx.lineTo(46, dir * 6.0);
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.restore();

        ctx.fillStyle = isAfterimage ? '#450a0a' : '#573c26';
        ctx.fillRect(-19, -150, 40, 21);
        if (!isAfterimage) {
          ctx.fillStyle = '#09090b';
          ctx.font = 'bold 7px serif';
          ctx.textAlign = 'center';
          ctx.fillText(ghost.placardText, 1, -136);
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

    // Distinct posture & cadence by state: Running -> Upright/Agile, Exhausted -> Heavy Slumped Limp + Panting!
    const walkBob = isExhausted
      ? Math.abs(stride) * 2.1 + Math.max(0, Math.sin(timeSec * 8.2)) * 2.2 // Heavy downward sag & rapid panting heave
      : isRunning
        ? Math.abs(stride) * 5.2
        : Math.abs(stride) * 3.0;
    const idleBreathe = isExhausted
      ? Math.sin(timeSec * 8.2) * 1.9
      : Math.sin(timeSec * 2.1) * 1.1;

    const torsoLean = isExhausted
      ? 0.22 + Math.sin(timeSec * 8.2) * 0.025 // Visibly hunched forward with fatigue!
      : state.holdingBreath
        ? 0.1
        : isRunning
          ? 0.15
          : state.gazeExposure > 35
            ? 0.07
            : 0.02;
    const panicTremble = state.sanity < 50 ? Math.sin(timeSec * 34) * 0.85 : 0;

    ctx.save();
    ctx.translate(state.playerX, floorY);

    // Anchored soft elliptical ground shadow (widens slightly during sprint)
    const shadowGrad = ctx.createRadialGradient(0, 3, 2, 0, 3, isRunning ? 26 : 22);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(0, 3.5, isRunning ? 24 : 20, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(panicTremble, (isExhausted ? 3.5 : 0) - walkBob + idleBreathe);
    ctx.scale(state.playerFacing, 1);

    // 1. Sculpted Anatomical Legs (Thigh -> Knee -> Calf -> Ankle, Sock Cuffs & Mary-Jane Shoes)
    const strideSpan = isRunning ? 17.5 : isExhausted ? 7.2 : 11.8;
    const swingA = stride * strideSpan;
    const swingB = -stride * strideSpan;
    const kneeBendDrop = isExhausted ? 3.5 : 0;

    for (const [legIdx, hipSwing] of [
      [0, swingB],
      [1, swingA],
    ] as const) {
      const kneeX = hipSwing * 0.56 + (isRunning ? 4 : isExhausted ? 3.5 : 2);
      const kneeY = -27 + kneeBendDrop;
      const footX = hipSwing;
      const footLift = isRunning ? Math.max(0, -hipSwing * 0.22) : isExhausted ? 0 : Math.max(0, -hipSwing * 0.1);
      const footY = -3 - footLift;

      // Upper thigh + lower calf with realistic anatomical taper
      ctx.fillStyle = legIdx === 0 ? '#c3a48f' : '#e6cbb7';
      ctx.beginPath();
      ctx.moveTo((legIdx === 0 ? -3.5 : 1.5) - 4.2, -52);
      ctx.lineTo((legIdx === 0 ? -3.5 : 1.5) + 4.2, -52);
      ctx.quadraticCurveTo(kneeX + 3.6, kneeY, footX + 2.1, footY);
      ctx.lineTo(footX - 2.1, footY);
      ctx.quadraticCurveTo(kneeX - 3.2, kneeY, (legIdx === 0 ? -3.5 : 1.5) - 4.2, -52);
      ctx.closePath();
      ctx.fill();

      // Knee-sock cuff & Mary-Jane buckled leather shoe
      ctx.fillStyle = legIdx === 0 ? '#cbd5e1' : '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(footX - 2.8, footY - 12);
      ctx.lineTo(footX + 2.8, footY - 12);
      ctx.lineTo(footX + 2.2, footY);
      ctx.lineTo(footX - 2.2, footY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.ellipse(footX + 2.4, footY + 1.2, 6.8, 2.8, isRunning ? -0.1 : 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(footX - 0.5, footY - 0.8, 2.5, 1.0);
    }

    // 2. Upper Body Pivot (Waist up — leans forward naturally on sprint or slumps heavily when exhausted)
    ctx.save();
    ctx.translate(0, -52);
    ctx.rotate(torsoLean);

    // Back swinging arm (visible behind skirt/torso during walk & sprint!)
    if (!state.holdingBreath) {
      const backArmAngle = isExhausted
        ? -0.25 + stride * 0.14
        : isRunning
          ? -stride * 0.85
          : -stride * 0.35;
      ctx.save();
      ctx.translate(-3, -38);
      ctx.rotate(backArmAngle);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(-2.5, 0);
      ctx.lineTo(2.5, 0);
      ctx.lineTo(1.8, 28);
      ctx.lineTo(-2.0, 28);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#cfaea0';
      ctx.beginPath();
      ctx.arc(0, 29, 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Flowing pleated navy Cô Sơn uniform skirt with realistic lighting pleats
    const skirtFlare = (isRunning ? 8 : Math.abs(stride) * 3.8);
    const skirtGrad = ctx.createLinearGradient(-13, -39, 13, 3);
    skirtGrad.addColorStop(0, '#1e293b');
    skirtGrad.addColorStop(0.6, '#172554');
    skirtGrad.addColorStop(1, '#0b1120');
    ctx.fillStyle = skirtGrad;
    ctx.beginPath();
    ctx.moveTo(-9.5, -39);
    ctx.lineTo(9.5, -39);
    ctx.quadraticCurveTo(15 + skirtFlare, -18, 16 + skirtFlare, 3);
    ctx.quadraticCurveTo(0, 7, -16 - skirtFlare, 3);
    ctx.quadraticCurveTo(-14, -18, -9.5, -39);
    ctx.closePath();
    ctx.fill();

    // Crisp accordion pleat shadows + waist band
    ctx.strokeStyle = 'rgba(2, 6, 23, 0.78)';
    ctx.lineWidth = 1.1;
    for (const px of [-5.5, 0, 5.5]) {
      ctx.beginPath();
      ctx.moveTo(px * 0.7, -37);
      ctx.lineTo(px * 1.45, 3.5);
      ctx.stroke();
    }

    // Tailored 1960s Student Blouse with contoured waist & oil-lantern cloth rim
    const blouseGrad = ctx.createLinearGradient(-10, -82, 11, -39);
    blouseGrad.addColorStop(0, '#f1f5f9');
    blouseGrad.addColorStop(0.55, '#cbd5e1');
    blouseGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = blouseGrad;
    ctx.beginPath();
    ctx.moveTo(-9.5, -39);
    ctx.quadraticCurveTo(-11.5, -62, -9, -82);
    ctx.lineTo(9, -82);
    ctx.quadraticCurveTo(11.5, -62, 9.5, -39);
    ctx.closePath();
    ctx.fill();

    // Sailor collar flap, crimson silk ribbon & Cô Sơn stitched badge
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-9, -82);
    ctx.lineTo(0, -64);
    ctx.lineTo(9, -82);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(0, -65);
    ctx.lineTo(-3.2, -56);
    ctx.lineTo(2, -55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(3.5, -64, 4.5, 2.2);

    // 3. Sculpted Realistic Head, Jawline, Tracking Eye, Sweat Drops (when Exhausted) & Flowing Braids
    ctx.save();
    ctx.translate(1, -93);
    const headPitch = isExhausted
      ? 0.16 + Math.sin(timeSec * 8.2) * 0.035 // Exhausted head hangs low & heaves!
      : state.holdingBreath
        ? 0.07
        : -0.02;
    ctx.rotate(headPitch);

    // Slender neck
    ctx.fillStyle = '#d3b49d';
    ctx.fillRect(-2.8, 5, 5.6, 9);

    // Twin dynamic braided pigtails with crimson silk ties (billow back strongly when sprinting!)
    const braidPullBack = isRunning ? -14 : isExhausted ? -2 : 0;
    const hairSwing = Math.sin(timeSec * (isRunning ? 9 : 4.2) + state.walkPhase * 2) * (isMoving ? 5 : 1.5);
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 5.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-7, -3);
    ctx.quadraticCurveTo(-13 + braidPullBack * 0.5 - hairSwing * 0.5, 11, -11 + braidPullBack - hairSwing, 26);
    ctx.stroke();
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-13 + braidPullBack - hairSwing * 0.85, 20, 4.5, 2.4);

    // Realistic contoured jawline & soft subsurface-lit face
    const faceGrad = ctx.createRadialGradient(2.5, -2.5, 1.5, 0, -1, 11.5);
    faceGrad.addColorStop(0, '#f6e4d5');
    faceGrad.addColorStop(0.7, '#dfbfa8');
    faceGrad.addColorStop(1, '#b18b73');
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.moveTo(-8.2, -9);
    ctx.quadraticCurveTo(0, -15, 8.6, -8);
    ctx.quadraticCurveTo(9.8, 1, 7.4, 7.2);
    ctx.quadraticCurveTo(3.2, 10.2, -3.5, 8.8);
    ctx.quadraticCurveTo(-9, 3, -8.2, -9);
    ctx.closePath();
    ctx.fill();

    // Cheek tint + parted mouth when exhausted/panting
    ctx.fillStyle = isExhausted ? 'rgba(225, 105, 105, 0.28)' : 'rgba(225, 135, 135, 0.18)';
    ctx.beginPath();
    ctx.ellipse(4.2, 3.2, 2.6, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (isExhausted) {
      // Open panting mouth silhouette
      ctx.fillStyle = '#5c2626';
      ctx.beginPath();
      ctx.ellipse(5.5, 6.2, 1.7, 1.1 + Math.sin(timeSec * 8.2) * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(130, 75, 65, 0.65)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(4.0, 6.2);
      ctx.lineTo(6.4, 5.9);
      ctx.stroke();
    }

    // Layered expressive eye tracking nearest ghost danger
    const ghostBehind =
      nearestGhost &&
      Math.abs(nearestGhost.x - state.playerX) < 260 &&
      (nearestGhost.x - state.playerX) * state.playerFacing < 0;
    const irisX = ghostBehind ? 3.8 : 5.5;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(5.1, -1.5, 2.4, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(irisX, -1.5, 1.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(irisX + 0.3, -2.2, 0.75, 0.75);
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.arc(5.1, -1.6, 2.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Exhausted / terrified brow furrow
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    if (isExhausted || state.holdingBreath || state.gazeExposure > 25) {
      ctx.moveTo(2.4, -4.8);
      ctx.lineTo(7.4, -6.2);
    } else {
      ctx.moveTo(2.6, -5.2);
      ctx.lineTo(7.2, -5.0);
    }
    ctx.stroke();

    // Glossy bangs & crown highlight
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(-9, -2);
    ctx.quadraticCurveTo(-10.8, -16, 0, -16.2);
    ctx.quadraticCurveTo(9.8, -15.5, 9.2, -6);
    ctx.quadraticCurveTo(3.5, -10, -4, -3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(-1, -6, 8, Math.PI * 1.15, Math.PI * 1.65);
    ctx.stroke();

    // Glistening cold sweat droplets rolling down temple when exhausted!
    if (isExhausted) {
      const sweatPhase = (timeSec * 1.35) % 1;
      ctx.fillStyle = `rgba(186, 230, 253, ${(1 - sweatPhase) * 0.9})`;
      ctx.beginPath();
      ctx.ellipse(2.2, -4 + sweatPhase * 11, 1.0, 1.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 4. Front Arm & Ornate Brass Oil Lantern / Exhausted Chest Clutch / Breath-Hold Pose
    if (state.holdingBreath) {
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(2, -77);
      ctx.lineTo(13, -68);
      ctx.lineTo(10, -90);
      ctx.lineTo(5, -90);
      ctx.lineTo(8, -70);
      ctx.lineTo(-1, -74);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#edd4c0';
      ctx.beginPath();
      ctx.arc(8.5, -90, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (isExhausted) {
      // Exhausted pose: lantern hangs low & slackly near knees while body heaves for air
      const heave = Math.sin(timeSec * 8.2) * 2.5;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(4, -77);
      ctx.lineTo(11, -56);
      ctx.lineTo(14, -36 + heave * 0.4);
      ctx.stroke();

      ctx.fillStyle = '#ecd8c7';
      ctx.beginPath();
      ctx.arc(14, -35 + heave * 0.4, 2.6, 0, Math.PI * 2);
      ctx.fill();

      const lanternX = 14.5 + Math.sin(timeSec * 6.5) * 1.8;
      const lanternY = -34 + heave * 0.4;
      const halo = ctx.createRadialGradient(lanternX, lanternY + 8, 2, lanternX, lanternY + 8, 26);
      halo.addColorStop(0, 'rgba(251, 191, 36, 0.72)');
      halo.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(lanternX - 26, lanternY - 18, 52, 52);

      ctx.fillStyle = '#78350f';
      ctx.fillRect(lanternX - 4.5, lanternY, 9, 3);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(lanternX - 4, lanternY + 3, 8, 11);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(lanternX - 2.6, lanternY + 4.5, 5.2, 8);

      // Rapid heavy panting breath puffs!
      for (let pIdx = 0; pIdx < 2; pIdx += 1) {
        const puff = (timeSec * 2.4 + pIdx * 0.5) % 1;
        ctx.fillStyle = `rgba(226, 232, 240, ${(1 - puff) * 0.42})`;
        ctx.beginPath();
        ctx.arc(13 + puff * 22, -88 - puff * 6, 3.2 + puff * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const armSwing = isRunning ? stride * 5.5 : Math.sin(timeSec * 3.5) * 1.8;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(4, -77);
      ctx.lineTo(14, -62);
      ctx.lineTo(19, -54 + armSwing * 0.4);
      ctx.stroke();

      ctx.fillStyle = '#ecd8c7';
      ctx.beginPath();
      ctx.arc(19, -53 + armSwing * 0.4, 2.6, 0, Math.PI * 2);
      ctx.fill();

      const lanternX = 20 + Math.sin(timeSec * (isRunning ? 10 : 4)) * (isRunning ? 3.5 : 2.0);
      const lanternY = -53 + armSwing * 0.4;
      const halo = ctx.createRadialGradient(lanternX, lanternY + 8, 2, lanternX, lanternY + 8, 34);
      halo.addColorStop(0, 'rgba(251, 191, 36, 0.94)');
      halo.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(lanternX - 34, lanternY - 26, 68, 68);

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
      ctx.arc(14 + puff * 16, -90 - puff * 7, 2.8 + puff * 3.8, 0, Math.PI * 2);
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
      ctx.save();
      ctx.translate(fx, height * 0.03);
      ctx.rotate(Math.sin(timeSec * 1.9 + x) * 0.15);
      ctx.fillStyle = isYin ? 'rgba(180, 95, 95, 0.26)' : 'rgba(225, 222, 212, 0.24)';
      ctx.fillRect(-8, 0, 16, 84);
      ctx.fillStyle = isYin ? 'rgba(220, 38, 38, 0.45)' : 'rgba(127, 29, 29, 0.35)';
      ctx.font = 'bold 9px serif';
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
        ctx.font = '9px serif';
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
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.clip();
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
