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

  private ensureGrainTexture(): HTMLCanvasElement | null {
    if (this.grainCanvas || typeof document === 'undefined') return this.grainCanvas;
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
        img.data[i + 3] = Math.floor(Math.random() * 20);
      }
      tctx.putImageData(img, 0, 0);
    }
    this.grainCanvas = tile;
    return this.grainCanvas;
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

    // 1. Atmospheric Sky Gradient
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
      skyGrad.addColorStop(0, '#2a0805');
      skyGrad.addColorStop(0.55, '#591309');
      skyGrad.addColorStop(1, '#140403');
    } else if (isDarkroom) {
      skyGrad.addColorStop(0, '#1e0204');
      skyGrad.addColorStop(0.6, '#380609');
      skyGrad.addColorStop(1, '#0c0102');
    } else if (isYin) {
      skyGrad.addColorStop(0, '#120204');
      skyGrad.addColorStop(0.6, '#2b0509');
      skyGrad.addColorStop(1, '#080102');
    } else if (is1986) {
      skyGrad.addColorStop(0, '#101513');
      skyGrad.addColorStop(0.55, '#17201b');
      skyGrad.addColorStop(1, '#080b09');
    } else {
      skyGrad.addColorStop(0, '#07090d');
      skyGrad.addColorStop(0.55, '#11161d');
      skyGrad.addColorStop(1, '#050608');
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

      if (state.scene === 'final_interrogation') {
        this.drawInterrogationDoppelganger(ctx, floorY, timeSec);
      }

      // Expressive Articulated Lâm Tĩnh (eyes track nearest ghost danger!)
      const activeGhost = state.ghosts.find((g) => g.scene === state.scene && !g.pacified) ?? null;
      this.drawLinJing(ctx, floorY, state, activeGhost, timeSec);

      // Low swirling ghostly ground mist across floorboards
      this.drawFloorMist(ctx, worldSpan, floorY, height, timeSec, isYin);

      // Foreground 2.5D parallax swaying funeral papers
      this.drawForegroundTalismans(ctx, worldSpan, height, this.camX, timeSec, isYin);

      ctx.restore();
    } else {
      this.drawEndingTableau(ctx, width, height, floorY, state, timeSec, dt);
    }

    // 4. Volumetric Lantern Dust Motes
    if (!isDawn && !isAshes) {
      this.drawLanternDustMotes(ctx, width, height, this.camX, state, timeSec, dt);
    }

    // 5. Realistic Flickering Lantern Spotlight Cone
    if (isLoopEnding) {
      const sirenPulse = Math.max(0, Math.sin(timeSec * 8.5)) * 0.44;
      ctx.fillStyle = `rgba(185, 20, 20, ${sirenPulse})`;
      ctx.fillRect(0, 0, width, height);
    } else if (!isDawn && !isLateQingming && !isAshes) {
      const playerScreenX = state.playerX - this.camX;
      const lanternDead = Boolean(state.deathCutscene?.active && state.deathCutscene.timer > 0.4);
      const flicker = lanternDead
        ? 0.35
        : 1 + Math.sin(timeSec * 14.3) * 0.025 + Math.cos(timeSec * 23.1) * 0.015;
      const lanternX = playerScreenX + state.playerFacing * 28;
      const lanternY = height * 0.62;
      const lanternRadius = Math.max(245, width * 0.43) * flicker;

      const lanternGrad = ctx.createRadialGradient(
        lanternX,
        lanternY,
        14,
        playerScreenX,
        height * 0.58,
        lanternRadius
      );
      if (isDarkroom) {
        lanternGrad.addColorStop(0, 'rgba(239, 68, 68, 0.16)');
        lanternGrad.addColorStop(0.45, 'rgba(38, 3, 5, 0.5)');
        lanternGrad.addColorStop(1, 'rgba(7, 1, 2, 0.94)');
      } else {
        lanternGrad.addColorStop(
          0,
          isYin ? 'rgba(200, 38, 38, 0.07)' : 'rgba(255, 202, 122, 0.12)'
        );
        lanternGrad.addColorStop(0.42, 'rgba(5, 6, 10, 0.48)');
        lanternGrad.addColorStop(1, 'rgba(2, 3, 5, 0.95)');
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

    // 8. Holding Breath Frost Border Vignette
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

    if (!isDawn && (state.scene === 'flooded_courtyard' || isYin)) {
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
      ctx.fillStyle = `rgba(218, 234, 255, ${this.lightningFlash * 0.68})`;
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
    const is1986 = state.scene === 'ruined_hall_1986';
    const isDarkroom = state.scene === 'darkroom';
    const isDorm = state.scene === 'dorm_hall';

    if (!isCourtyard) {
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
          ? '#160304'
          : isYin
            ? '#170506'
            : is1986
              ? '#111613'
              : '#101317';
        ctx.fillRect(x, height * 0.14 + skew, 46, floorY - height * 0.14);

        // Damp wall water-stain drip streaks & plaster cracks
        ctx.fillStyle = isYin ? 'rgba(90, 8, 12, 0.38)' : 'rgba(8, 10, 14, 0.35)';
        ctx.fillRect(x + 8, height * 0.15, 7, 130 + (x % 45));
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 28, height * 0.18);
        ctx.lineTo(x + 19, height * 0.31);
        ctx.lineTo(x + 31, height * 0.44);
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
        for (let x = 160; x < roomW - 120; x += 310) {
          ctx.save();
          ctx.translate(x, height * 0.21);
          ctx.rotate(Math.sin(timeSec * 1.4 + x) * 0.04);
          ctx.fillStyle = isYin ? '#5c0e12' : '#4a1b19';
          ctx.fillRect(-40, 0, 80, 30);
          ctx.fillStyle = 'rgba(235, 225, 205, 0.72)';
          ctx.font = 'bold 10px serif';
          ctx.textAlign = 'center';
          ctx.fillText(isYin ? 'TỘI NHÂN' : 'TỰ KIỂM ĐIỂM', 0, 19);
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

    // Overturned school desks & bloody handprints in Classroom 12B
    if (state.scene === 'classroom_12b') {
      ctx.fillStyle = '#14261d';
      ctx.fillRect(310, height * 0.25, 220, 96);
      ctx.strokeStyle = '#4e3726';
      ctx.lineWidth = 4;
      ctx.strokeRect(310, height * 0.25, 220, 96);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.78)';
      ctx.font = 'bold 12px serif';
      ctx.textAlign = 'center';
      ctx.fillText('ĐẢ ĐẢO TRÍ THỨC', 420, height * 0.33);
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
      floorGrad.addColorStop(0, isDarkroom ? '#180506' : isYin ? '#21090a' : '#1b1612');
      floorGrad.addColorStop(1, '#070606');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, floorY, roomW, height - floorY);

      ctx.strokeStyle = isYin ? 'rgba(120, 18, 22, 0.35)' : 'rgba(75, 60, 48, 0.32)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < roomW; x += 72) {
        ctx.beginPath();
        ctx.moveTo(x, floorY);
        ctx.lineTo(x - 36, height);
        ctx.stroke();
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
        const locked = Boolean(hs.requiredFlag && !state.flags[hs.requiredFlag]);
        ctx.fillStyle = hs.kind === 'illogical_door' ? '#2f191d' : '#2b2019';
        ctx.fillRect(-34, -148, 68, 148);
        ctx.strokeStyle = isActive ? '#f59e0b' : '#4a382b';
        ctx.lineWidth = isActive ? 2.5 : 2;
        ctx.strokeRect(-34, -148, 68, 148);

        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(22, -74, 3.5, 0, Math.PI * 2);
        ctx.fill();

        if (locked) {
          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(-30, -110);
          ctx.lineTo(30, -45);
          ctx.moveTo(30, -110);
          ctx.lineTo(-30, -45);
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
        ctx.fillStyle = '#475569';
        ctx.fillRect(-5, -270, 10, 270);
        ctx.fillStyle = '#334155';
        ctx.fillRect(-28, -22, 56, 22);

        const swing = Math.sin(timeSec * 1.9) * 0.045;
        ctx.save();
        ctx.translate(16, -210);
        ctx.rotate(swing);
        ctx.strokeStyle = '#78573a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 36);
        ctx.stroke();
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-11, 36, 22, 58);
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(0, 104, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-4, 104, 8, 10);
        ctx.restore();
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
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(-48, -148, 96, 148);
        ctx.fillStyle = '#475569';
        for (let bx = -36; bx <= 36; bx += 18) {
          ctx.fillRect(bx, -144, 4, 142);
        }
        ctx.fillStyle = `rgba(251, 191, 36, ${0.55 + Math.sin(timeSec * 4) * 0.25})`;
        ctx.fillRect(-8, -70, 16, 6);
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
        ctx.fillRect(-94, -190 + bob, 188, 25);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.25;
        ctx.strokeRect(-94, -190 + bob, 188, 25);
        ctx.fillStyle = '#fef3c7';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('[E] Kiểm tra / Tương tác', 0, -173 + bob);
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
    ctx.fillStyle = '#2b1e16';
    ctx.fillRect(-44, -56, 88, 56);

    const lampGrad = ctx.createLinearGradient(0, -240, 0, 0);
    lampGrad.addColorStop(0, 'rgba(254, 240, 138, 0.24)');
    lampGrad.addColorStop(1, 'rgba(254, 240, 138, 0.04)');
    ctx.fillStyle = lampGrad;
    ctx.beginPath();
    ctx.moveTo(0, -240);
    ctx.lineTo(-96, 0);
    ctx.lineTo(96, 0);
    ctx.closePath();
    ctx.fill();

    // Spectral Doppelganger silhouette seated across desk with unsettling face shadow
    const tremble = Math.sin(timeSec * 29) > 0.94 ? 2.5 : 0;
    ctx.translate(45 + tremble, Math.sin(timeSec * 1.8) * 1.4);
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.moveTo(-16, -50);
    ctx.quadraticCurveTo(-18, -112, 0, -118);
    ctx.quadraticCurveTo(18, -112, 16, -50);
    ctx.closePath();
    ctx.fill();

    const skullShade = ctx.createRadialGradient(-3, -128, 2, 0, -126, 15);
    skullShade.addColorStop(0, '#94a3b8');
    skullShade.addColorStop(0.65, '#475569');
    skullShade.addColorStop(1, '#0f172a');
    ctx.fillStyle = skullShade;
    ctx.beginPath();
    ctx.ellipse(0, -126, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sunken eye hollows with faint pinpoint glint
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(-4.5, -127, 2.8, 3.4, 0, 0, Math.PI * 2);
    ctx.ellipse(4.5, -127, 2.8, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220, 38, 38, 0.72)';
    ctx.fillRect(-5, -127.5, 1.5, 1.5);
    ctx.fillRect(4, -127.5, 1.5, 1.5);
    ctx.restore();
  }

  // Atmospheric, Articulated 2.5D Psychological Horror Ghosts
  private drawGhostEntity(
    ctx: CanvasRenderingContext2D,
    floorY: number,
    ghost: GhostEntity,
    state: ThanhMinhState,
    timeSec: number,
    isYin: boolean
  ): void {
    const dist = Math.abs(ghost.x - state.playerX);
    const proximity = Math.max(0, 1 - dist / 240);
    const dread = ghost.alerted ? Math.max(0.72, proximity) : proximity * 0.75;
    const isTwitch =
      Math.sin(timeSec * 31 + ghost.x * 0.13) > (ghost.alerted ? 0.84 : 0.93);
    const neckSnap = isTwitch ? Math.sin(timeSec * 73) * 0.38 : 0;
    const strideBob = Math.sin(timeSec * (ghost.alerted ? 4.4 : 2.6)) * 2.2;
    const crouchHunch = 0.08 + dread * 0.14;
    const lanternSide = state.playerX < ghost.x ? -1 : 1; // Side facing Lâm Tĩnh's lantern

    ctx.save();
    ctx.translate(ghost.x, floorY);

    // 1. Towering Distorted Wall Shadow Cast by Lâm Tĩnh's Lantern (Signature Detention Dread)
    const shadowDir = Math.sign(ghost.x - state.playerX) || ghost.facing;
    const shadowReach = shadowDir * (42 + proximity * 55);
    const shadowAlpha = isYin ? 0.44 : 0.34 + proximity * 0.24;
    ctx.save();
    ctx.fillStyle = `rgba(3, 2, 4, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.quadraticCurveTo(
      shadowReach * 0.45,
      -125,
      shadowReach + Math.sin(timeSec * 3.1) * 8,
      ghost.kind === 'paper_hat' ? -275 : -245
    );
    ctx.lineTo(shadowReach + shadowDir * 24, -195);
    // Reaching clawed shadow arm
    ctx.lineTo(shadowReach + shadowDir * (56 + dread * 26), -165 + Math.sin(timeSec * 5) * 9);
    ctx.lineTo(shadowReach + shadowDir * 26, -140);
    ctx.lineTo(28, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Cold Ground Fog + Dark Ash / Blood Pool Shadow under Ghost
    const groundShadow = ctx.createRadialGradient(0, 2, 4, 0, 2, 42);
    groundShadow.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
    groundShadow.addColorStop(0.6, 'rgba(30, 5, 8, 0.35)');
    groundShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = groundShadow;
    ctx.fillRect(-46, -12, 92, 26);

    // Ghostly dark ink-smoke wisps rising near floorboards
    for (let w = 0; w < 4; w += 1) {
      const phase = (timeSec * 0.8 + w * 0.25) % 1;
      const wx = Math.sin(timeSec * 2.2 + w * 2.1) * 18 - ghost.facing * phase * 24;
      const wy = -8 - phase * 64;
      ctx.fillStyle = `rgba(${ghost.alerted ? '90, 10, 14' : '15, 18, 24'}, ${(1 - phase) * 0.35})`;
      ctx.beginPath();
      ctx.arc(wx, wy, 7 + phase * 11, 0, Math.PI * 2);
      ctx.fill();
    }

    // Helper draws one full articulated silhouette pass (for double-exposure nightmare & sharp pass)
    const renderArticulatedGhost = (isAfterimage: boolean) => {
      ctx.save();
      if (isAfterimage) {
        const glitchX = Math.sin(timeSec * 41) * (ghost.alerted ? 7.5 : 4.2);
        const glitchY = Math.cos(timeSec * 33) * 2.5;
        ctx.translate(glitchX, glitchY);
        ctx.globalAlpha = ghost.alerted ? 0.38 : 0.22;
      }

      ctx.scale(ghost.facing, 1);

      const flowBack = -14 - Math.sin(timeSec * 4.2) * 5;
      const upperSway = Math.sin(timeSec * 2.3 + ghost.x * 0.02) * 2.5;

      // A. Layered Tattered Funeral Shroud / Uniform (Anchored at Floor, NOT stiff-tilted)
      const shroudBaseGrad = ctx.createLinearGradient(-22, -155, 22, 0);
      if (isAfterimage) {
        shroudBaseGrad.addColorStop(0, '#7f1d1d');
        shroudBaseGrad.addColorStop(1, '#1a0406');
      } else if (isYin) {
        shroudBaseGrad.addColorStop(0, '#2a080c');
        shroudBaseGrad.addColorStop(0.55, '#140406');
        shroudBaseGrad.addColorStop(1, '#070203');
      } else {
        shroudBaseGrad.addColorStop(0, ghost.kind === 'tongue_warden' ? '#1c191c' : '#191d24');
        shroudBaseGrad.addColorStop(0.6, '#0d0f14');
        shroudBaseGrad.addColorStop(1, '#050608');
      }

      // Back trailing tattered fabric ribbons streaming behind patrol motion
      for (let r = 0; r < 3; r += 1) {
        const wave = Math.sin(timeSec * (4.6 + r) + r * 1.3) * (6 + r * 2);
        ctx.fillStyle = isAfterimage
          ? 'rgba(127, 29, 29, 0.35)'
          : r === 0
            ? 'rgba(14, 16, 22, 0.82)'
            : 'rgba(26, 20, 22, 0.65)';
        ctx.beginPath();
        ctx.moveTo(-12 + r * 4, -138 + r * 18);
        ctx.quadraticCurveTo(flowBack - r * 5 + wave * 0.5, -75, flowBack - 10 + wave, -6 - r * 3);
        ctx.lineTo(-4 + r * 5, -14);
        ctx.closePath();
        ctx.fill();
      }

      // Main draped garment contour
      ctx.fillStyle = shroudBaseGrad;
      ctx.beginPath();
      ctx.moveTo(-19 + upperSway, -144 + strideBob);
      ctx.quadraticCurveTo(22 + upperSway, -138 + strideBob, 21, -70);
      ctx.lineTo(25 + Math.sin(timeSec * 3.8) * 3, -5);
      ctx.quadraticCurveTo(10, -13, 2, -3);
      ctx.quadraticCurveTo(-10, -14, -24 + Math.cos(timeSec * 3.4) * 3, -5);
      ctx.lineTo(-22, -78);
      ctx.closePath();
      ctx.fill();

      // Subtle oil-lantern rim highlight along facing edge when player is near
      if (!isAfterimage && proximity > 0.15) {
        const rimX = lanternSide * ghost.facing > 0 ? 18 : -18;
        ctx.strokeStyle = isYin
          ? `rgba(220, 38, 38, ${proximity * 0.38})`
          : `rgba(251, 191, 36, ${proximity * 0.28})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(rimX, -136 + strideBob);
        ctx.quadraticCurveTo(rimX * 1.15, -72, rimX * 1.1, -14);
        ctx.stroke();
      }

      if (ghost.kind === 'paper_hat') {
        // B. Hunched Head & Dislocated Snapping Neck + Weathered Dunce Cap
        ctx.save();
        ctx.translate(6 + upperSway, -146 + strideBob);
        ctx.rotate(crouchHunch + neckSnap);

        // Gaunt clearly-shaded decaying skull (no flat pale oval)
        const skullGrad = ctx.createRadialGradient(4, -2, 2, 0, 0, 17);
        skullGrad.addColorStop(0, isAfterimage ? '#991b1b' : '#8b9098');
        skullGrad.addColorStop(0.65, isAfterimage ? '#450a0a' : '#3d4149');
        skullGrad.addColorStop(1, '#121318');
        ctx.fillStyle = skullGrad;
        ctx.beginPath();
        ctx.moveTo(-11, -14);
        ctx.quadraticCurveTo(13, -15, 14, -1);
        ctx.quadraticCurveTo(13, 14, 2, 16);
        ctx.quadraticCurveTo(-12, 12, -11, -14);
        ctx.closePath();
        ctx.fill();

        // Deep sunken black orbital socket + pinpoint glowing red pupil tracking player
        ctx.fillStyle = '#050406';
        ctx.beginPath();
        ctx.ellipse(6.5, -3, 4.4, 5.2, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(7.6, -2.6, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fecaca';
        ctx.fillRect(7.3, -3.1, 0.9, 0.9);

        // Dried crimson tear streak & unhinged dark mouth
        ctx.fillStyle = 'rgba(127, 29, 29, 0.85)';
        ctx.fillRect(5.8, 1.5, 1.8, 9);
        ctx.fillStyle = '#070304';
        ctx.beginPath();
        ctx.ellipse(7, 9, 4.2, 5.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Weathered yellowed parchment dunce cap with bloodstains & hanging talisman strips
        const capGrad = ctx.createLinearGradient(-16, -98, 16, -8);
        capGrad.addColorStop(0, isAfterimage ? '#7f1d1d' : '#a8a29e');
        capGrad.addColorStop(0.7, isAfterimage ? '#450a0a' : '#78716c');
        capGrad.addColorStop(1, '#3f2e2b');
        ctx.fillStyle = capGrad;
        ctx.beginPath();
        ctx.moveTo(-16, -9);
        ctx.lineTo(-3, -102);
        ctx.lineTo(1, -100);
        ctx.lineTo(15, -9);
        ctx.closePath();
        ctx.fill();

        // Dangling paper talismans from cap brim
        const tagSwing = Math.sin(timeSec * 5.2) * 4;
        ctx.fillStyle = 'rgba(214, 211, 209, 0.72)';
        ctx.beginPath();
        ctx.moveTo(-13, -9);
        ctx.lineTo(-15 + tagSwing, 12);
        ctx.lineTo(-11 + tagSwing, 12);
        ctx.closePath();
        ctx.fill();

        // Crooked dried blood character on cap
        if (!isAfterimage) {
          ctx.fillStyle = 'rgba(127, 29, 29, 0.88)';
          ctx.font = 'bold 9px serif';
          ctx.textAlign = 'center';
          ctx.fillText('TỘI', 0, -34);
        }
        ctx.restore();

        // C. Multi-Segmented Wet Glossy Crimson Tongue + Dripping Drops
        const tongueWhip = Math.sin(timeSec * (ghost.alerted ? 7.5 : 4.2)) * (9 + dread * 9);
        const tongueBaseX = 14 + upperSway;
        const tongueBaseY = -135 + strideBob;
        const tongueTipX = 28 + Math.cos(timeSec * 3.8) * 14 + dread * 10;
        const tongueTipY = -3;

        ctx.strokeStyle = isAfterimage ? 'rgba(127, 29, 29, 0.45)' : '#5c0a0e';
        ctx.lineWidth = 7.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tongueBaseX, tongueBaseY);
        ctx.bezierCurveTo(
          36 + dread * 8,
          -98,
          6 + tongueWhip,
          -44,
          tongueTipX,
          tongueTipY
        );
        ctx.stroke();

        if (!isAfterimage) {
          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 4.2;
          ctx.stroke();
          ctx.strokeStyle = 'rgba(248, 113, 113, 0.38)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Falling blood drop from tongue bend
          const dropPhase = (timeSec * 1.45) % 1;
          ctx.fillStyle = `rgba(153, 27, 27, ${1 - dropPhase * 0.5})`;
          ctx.beginPath();
          ctx.ellipse(22, -62 + dropPhase * 60, 1.8, 3.4, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // D. Scarred Wooden Guilt Placard hanging from frayed rope
        ctx.strokeStyle = '#786248';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-6 + upperSway, -136);
        ctx.lineTo(-14, -121);
        ctx.moveTo(10 + upperSway, -136);
        ctx.lineTo(14, -121);
        ctx.stroke();

        ctx.fillStyle = isAfterimage ? '#450a0a' : '#573c26';
        ctx.fillRect(-18, -122, 38, 21);
        ctx.strokeStyle = '#291b10';
        ctx.lineWidth = 1;
        ctx.strokeRect(-18, -122, 38, 21);
        if (!isAfterimage) {
          ctx.fillStyle = '#09090b';
          ctx.font = 'bold 6.8px serif';
          ctx.textAlign = 'center';
          ctx.fillText(ghost.placardText, 1, -109);
        }

        // E. Reaching Skeletal Arm & Clawed Fingers (Limply hanging -> reaching forward on dread)
        const armLift = dread * 0.78;
        const shoulderX = 4 + upperSway;
        const shoulderY = -126 + strideBob;
        const elbowX = shoulderX + 6 + armLift * 18;
        const elbowY = shoulderY + 34 - armLift * 24;
        const handX = elbowX + 5 + armLift * 22;
        const handY = elbowY + 32 - armLift * 22 + Math.sin(timeSec * 6) * 2.5;

        ctx.strokeStyle = isAfterimage ? '#7f1d1d' : '#1e2026';
        ctx.lineWidth = 5.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(handX, handY);
        ctx.stroke();

        // Pale bony claw fingers
        ctx.strokeStyle = isAfterimage ? '#991b1b' : '#71717a';
        ctx.lineWidth = 1.6;
        for (let f = -1; f <= 1; f += 1) {
          ctx.beginPath();
          ctx.moveTo(handX, handY);
          ctx.lineTo(handX + 8 + armLift * 5, handY + f * 3.5 + 4);
          ctx.stroke();
        }
      } else {
        // Quỷ Sai Cắt Lưỡi: Stooped Prison Warden, Rusted Shackle Chains, Thrusting Notched Shears
        // Heavy swinging rusted iron chains scraping the floor
        const chainSwing = Math.sin(timeSec * 3.6) * 7;
        ctx.strokeStyle = isAfterimage ? '#7f1d1d' : '#574236';
        ctx.lineWidth = 2.6;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(-12, -98);
        ctx.quadraticCurveTo(-22 + chainSwing, -46, -18 + chainSwing * 1.2, -2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Hunched skull/mask with snapping tilt
        ctx.save();
        ctx.translate(4 + upperSway, -158 + strideBob);
        ctx.rotate(crouchHunch * 0.8 + neckSnap);

        const wardenFaceGrad = ctx.createRadialGradient(3, -3, 2, 0, 0, 18);
        wardenFaceGrad.addColorStop(0, isAfterimage ? '#991b1b' : '#7b8088');
        wardenFaceGrad.addColorStop(0.68, isAfterimage ? '#450a0a' : '#31343b');
        wardenFaceGrad.addColorStop(1, '#101014');
        ctx.fillStyle = wardenFaceGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 17, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dark warden cap visor + bleeding vertical tear gashes
        ctx.fillStyle = '#09090b';
        ctx.fillRect(-13, -15, 29, 7);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(5, -3, 2.5, 13);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(6.5, -4.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Articulated Lunging Arm + Giant Notched Iron Shears
        const snipCycle = Math.sin(timeSec * (ghost.alerted ? 7.2 : 4.8));
        const thrust = Math.max(0, snipCycle) * (7 + dread * 9);
        const snipAngle = Math.abs(snipCycle) * 0.34;
        const shearPivotX = 18 + thrust;
        const shearPivotY = -104 + strideBob;

        ctx.strokeStyle = isAfterimage ? '#7f1d1d' : '#261417';
        ctx.lineWidth = 6.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(2 + upperSway, -134 + strideBob);
        ctx.lineTo(12, -114);
        ctx.lineTo(shearPivotX, shearPivotY);
        ctx.stroke();

        ctx.save();
        ctx.translate(shearPivotX, shearPivotY);
        for (const dir of [-1, 1] as const) {
          ctx.save();
          ctx.rotate(dir * snipAngle);
          const bladeGrad = ctx.createLinearGradient(0, 0, 44, 0);
          bladeGrad.addColorStop(0, '#475569');
          bladeGrad.addColorStop(0.7, '#94a3b8');
          bladeGrad.addColorStop(1, '#7f1d1d');
          ctx.fillStyle = isAfterimage ? '#7f1d1d' : bladeGrad;
          ctx.beginPath();
          ctx.moveTo(-2, 0);
          ctx.lineTo(44, dir * 6);
          ctx.lineTo(0, dir * 5.2);
          ctx.closePath();
          ctx.fill();
          if (!isAfterimage) {
            ctx.strokeStyle = 'rgba(241, 245, 249, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, dir * 1.2);
            ctx.lineTo(42, dir * 5.6);
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.restore();

        ctx.fillStyle = isAfterimage ? '#450a0a' : '#573c26';
        ctx.fillRect(-18, -132, 38, 20);
        if (!isAfterimage) {
          ctx.fillStyle = '#09090b';
          ctx.font = 'bold 6.8px serif';
          ctx.textAlign = 'center';
          ctx.fillText(ghost.placardText, 1, -119);
        }
      }

      ctx.restore();
    };

    // Draw chromatic fever-dream afterimage whenever twitching, alerted, or player is close
    if (isTwitch || ghost.alerted || proximity > 0.45) {
      renderArticulatedGhost(true);
    }
    renderArticulatedGhost(false);

    ctx.restore();
  }

  // Expressive, Fluid Articulated Lâm Tĩnh Rig
  private drawLinJing(
    ctx: CanvasRenderingContext2D,
    floorY: number,
    state: ThanhMinhState,
    nearestGhost: GhostEntity | null,
    timeSec: number
  ): void {
    const isWalking = Math.abs(Math.sin(state.walkPhase * Math.PI)) > 0.08;
    const stride = Math.sin(state.walkPhase * Math.PI);
    const walkBob = Math.abs(stride) * 3.8;
    const idleBreathe = Math.sin(timeSec * 2.2) * 1.3;
    const fearHunch = state.holdingBreath ? 0.09 : state.gazeExposure > 35 ? 0.06 : 0.015;
    const panicTremble = state.sanity < 50 ? Math.sin(timeSec * 34) * 0.9 : 0;

    ctx.save();
    ctx.translate(state.playerX, floorY);

    // Soft anchored contact shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.54)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 20, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(panicTremble, -walkBob + idleBreathe);
    ctx.scale(state.playerFacing, 1);

    // 1. Articulated Legs (Back leg then Front leg with knee bend & shoes)
    const swingA = stride * 12;
    const swingB = -stride * 12;
    for (const [legIdx, hipSwing] of [
      [0, swingB],
      [1, swingA],
    ] as const) {
      const kneeX = hipSwing * 0.55 + 2;
      const footX = hipSwing;
      ctx.strokeStyle = legIdx === 0 ? '#d6bfb0' : '#e7d5c5';
      ctx.lineWidth = 6.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(legIdx === 0 ? -3 : 3, -38);
      ctx.lineTo(kneeX, -19);
      ctx.lineTo(footX, -3);
      ctx.stroke();

      // 1960s black student shoe & white sock
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(footX - 3, -10, 6, 6);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(footX + 2, -2.5, 7, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Upper Body Lean & Swaying Pleated Skirt
    ctx.save();
    ctx.translate(0, -38);
    ctx.rotate(fearHunch);

    // Flowing pleated navy school skirt
    const skirtFlare = Math.abs(stride) * 4;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-11, -36);
    ctx.lineTo(11, -36);
    ctx.quadraticCurveTo(18 + skirtFlare, -16, 17 + skirtFlare, 3);
    ctx.quadraticCurveTo(0, 7, -18 - skirtFlare, 3);
    ctx.quadraticCurveTo(-16, -16, -11, -36);
    ctx.closePath();
    ctx.fill();

    // Pleat shading lines
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.lineWidth = 1.2;
    for (const px of [-6, 0, 6]) {
      ctx.beginPath();
      ctx.moveTo(px * 0.7, -34);
      ctx.lineTo(px * 1.4, 3);
      ctx.stroke();
    }

    // 1960s Collared White/Slate Student Blouse
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(-12, -36);
    ctx.quadraticCurveTo(-14, -56, -10, -72);
    ctx.lineTo(10, -72);
    ctx.quadraticCurveTo(13, -56, 11, -36);
    ctx.closePath();
    ctx.fill();

    // Subtle navy collar flap & red scarf detail
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(-10, -72);
    ctx.lineTo(0, -58);
    ctx.lineTo(10, -72);
    ctx.closePath();
    ctx.fill();

    // 3. Expressive Head, Eyes & Multi-segment Flowing Hair Braids
    ctx.save();
    ctx.translate(1, -85);
    ctx.rotate(state.holdingBreath ? 0.08 : -0.02);

    // Neck
    ctx.fillStyle = '#dfc8b7';
    ctx.fillRect(-3.5, 8, 7, 9);

    // Back flowing twin hair braid with velocity trail
    const hairSwing = Math.sin(timeSec * 4.5 + state.walkPhase * 2) * (isWalking ? 5.5 : 1.5);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-9, -4);
    ctx.quadraticCurveTo(-15 - hairSwing * 0.6, 12, -14 - hairSwing, 28);
    ctx.stroke();

    // Face oval
    ctx.fillStyle = '#ecd8c7';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 13.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Expressive Eye tracking nearest danger
    const ghostBehind =
      nearestGhost &&
      Math.abs(nearestGhost.x - state.playerX) < 260 &&
      (nearestGhost.x - state.playerX) * state.playerFacing < 0;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(ghostBehind ? 3.5 : 6.2, -1, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Subtle brow tension when terrified
    if (state.holdingBreath || state.gazeExposure > 25) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(3, -5);
      ctx.lineTo(8, -6.5);
      ctx.stroke();
    }

    // Bobbed bangs & crown hair
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-1.5, -2.5, 13, Math.PI * 0.68, Math.PI * 2.04);
    ctx.quadraticCurveTo(9, -6, 3, -9);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // 4. Articulated Lantern Arm / Breath-Hold Pose
    if (state.holdingBreath) {
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(5, -66);
      ctx.lineTo(13, -58);
      ctx.lineTo(10, -79);
      ctx.stroke();

      ctx.fillStyle = '#ecd8c7';
      ctx.beginPath();
      ctx.arc(10, -80, 3.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const armSwing = Math.sin(timeSec * 3.5) * 2;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(5, -66);
      ctx.lineTo(15, -52);
      ctx.lineTo(20, -45 + armSwing * 0.3);
      ctx.stroke();

      // Ornate swaying brass oil lantern
      const lanternX = 21 + Math.sin(timeSec * 4) * 2.2;
      const lanternY = -44;
      const halo = ctx.createRadialGradient(lanternX, lanternY + 8, 2, lanternX, lanternY + 8, 32);
      halo.addColorStop(0, 'rgba(251, 191, 36, 0.92)');
      halo.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(lanternX - 32, lanternY - 24, 64, 64);

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(lanternX - 4.5, lanternY + 2, 9, 13);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(lanternX - 3, lanternY + 4, 6, 9);

      // Cold air breath puff
      const puff = (timeSec * 1.1) % 1;
      ctx.fillStyle = `rgba(226, 232, 240, ${(1 - puff) * 0.28})`;
      ctx.beginPath();
      ctx.arc(15 + puff * 18, -82 - puff * 8, 3 + puff * 4, 0, Math.PI * 2);
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
    for (let x = 140; x < worldSpan; x += 420) {
      const fx = x + camX * 0.12;
      ctx.save();
      ctx.translate(fx, height * 0.04);
      ctx.rotate(Math.sin(timeSec * 1.8 + x) * 0.14);
      ctx.fillStyle = isYin ? 'rgba(200, 140, 140, 0.22)' : 'rgba(235, 232, 224, 0.24)';
      ctx.fillRect(-8, 0, 16, 78);
      ctx.restore();
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
      ctx.fillStyle = '#090505';
      ctx.fillRect(width * 0.48, floorY - 120, 26, 120);
    } else if (state.ending === 'ending_3_late_qingming') {
      for (const gx of [width * 0.42, width * 0.58]) {
        ctx.fillStyle = '#1e2420';
        ctx.beginPath();
        ctx.arc(gx, floorY, 44, Math.PI, 0);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(251, 146, 60, 0.78)';
      ctx.beginPath();
      ctx.arc(width * 0.5, floorY - 6 + Math.sin(timeSec * 5) * 2, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (state.ending === 'ending_4_dawn_coson') {
      const cx = width * 0.5;
      for (const offset of [-58, 0, 58]) {
        ctx.fillStyle = offset === 0 ? '#1e293b' : 'rgba(254, 243, 199, 0.58)';
        ctx.fillRect(cx + offset - 12, floorY - 110, 24, 110);
        ctx.beginPath();
        ctx.arc(cx + offset, floorY - 124, 12, 0, Math.PI * 2);
        ctx.fill();
      }
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
    const grain = this.ensureGrainTexture();
    if (grain) {
      const pat = ctx.createPattern(grain, 'repeat');
      if (pat) {
        ctx.save();
        ctx.translate((timeSec * 97) % 160, (timeSec * 131) % 160);
        ctx.fillStyle = pat;
        ctx.fillRect(-160, -160, width + 320, height + 320);
        ctx.restore();
      }
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
