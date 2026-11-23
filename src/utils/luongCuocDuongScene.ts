import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  AbacusState,
  CellarGameState,
  computeScaleTiltNormalized,
  getDayScript,
  getGuidedNextStep,
} from './luongCuocDuongEngine.ts';

export type CellarPropId =
  | 'lamp'
  | 'pulley'
  | 'scale'
  | 'abacus'
  | 'inkpad'
  | 'seal'
  | 'ledger'
  | 'washbasin'
  | 'vent'
  | 'door';

export interface CellarSceneCallbacks {
  onPropClick: (propId: CellarPropId) => void;
  onHoverPropChange: (propId: CellarPropId | null) => void;
  onWebglError?: (msg: string) => void;
}

export interface CellarSceneController {
  syncState: (state: CellarGameState, isPlaying: boolean) => void;
  triggerFX: (kind: 'seal_slam' | 'door_pound' | 'ink_dip' | 'pulley_drop' | 'wash_ripple') => void;
  dispose: () => void;
}

function isSoftwareRendererContext(gl: WebGLRenderingContext | WebGL2RenderingContext | null): boolean {
  if (!gl) return true;
  try {
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (!dbg) return false;
    const rendererStr = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '');
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
  } catch {
    return false;
  }
}

function createWoodTexture(isBump: boolean, maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = isBump ? '#828282' : '#3a2416';
  ctx.fillRect(0, 0, 512, 512);

  for (let p = 0; p < 6; p += 1) {
    const y0 = p * 85;
    ctx.fillStyle = isBump ? '#2e2e2e' : '#180e08';
    ctx.fillRect(0, y0, 512, 4);
    for (let i = 0; i < 64; i += 1) {
      const y = y0 + 5 + ((i * 19) % 78);
      const tone = isBump
        ? 104 + ((i * 23 + p * 11) % 62)
        : 38 + ((i * 17 + p * 9) % 26);
      ctx.fillStyle = isBump
        ? `rgb(${tone},${tone},${tone})`
        : `rgb(${tone + 18},${tone + 2},${Math.max(10, tone - 14)})`;
      ctx.fillRect(0, y, 512, 1 + (i % 3));
    }
    // Wood knots & aged wear
    const kx = 85 + ((p * 137) % 340);
    const ky = y0 + 42;
    ctx.fillStyle = isBump ? 'rgba(40,40,40,0.45)' : 'rgba(20,10,6,0.42)';
    ctx.beginPath();
    ctx.ellipse(kx, ky, 22, 8, 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = maxAniso;
  if (!isBump) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStoneTexture(isBump: boolean, maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = isBump ? '#565656' : '#1b1819';
  ctx.fillRect(0, 0, 512, 512);

  const rows = 8;
  const rowH = 512 / rows;
  for (let r = 0; r < rows; r += 1) {
    const y = r * rowH;
    const offset = (r % 2) * 48;
    for (let c = -1; c < 6; c += 1) {
      const x = c * 96 + offset;
      const shade = 26 + (((r * 11 + c * 17) & 15) * 2);
      ctx.fillStyle = isBump
        ? `rgb(${115 + (shade % 55)},${115 + (shade % 55)},${115 + (shade % 55)})`
        : `rgb(${shade + 6},${shade + 3},${shade + 5})`;
      ctx.fillRect(x + 3, y + 3, 90, rowH - 6);

      // Stone surface pitting
      if (!isBump) {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x + 14 + (c % 3) * 12, y + 12, 16, 4);
      }
    }
  }

  // Damp vertical seepage & moss stains
  if (!isBump) {
    for (let s = 0; s < 5; s += 1) {
      const sx = 35 + s * 102;
      const g = ctx.createLinearGradient(sx, 0, sx, 512);
      g.addColorStop(0, 'rgba(18, 28, 18, 0.28)');
      g.addColorStop(0.5, 'rgba(10, 12, 10, 0.12)');
      g.addColorStop(1, 'rgba(22, 34, 20, 0.34)');
      ctx.fillStyle = g;
      ctx.fillRect(sx, 0, 32, 512);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.anisotropy = maxAniso;
  if (!isBump) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBurlapTexture(phase: 1 | 2 | 3, maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = phase === 1 ? '#8c7451' : phase === 2 ? '#595040' : '#6b473e';
  ctx.fillRect(0, 0, 256, 256);

  // Coarse burlap cross-hatch weave
  ctx.strokeStyle = phase === 3 ? 'rgba(38, 14, 14, 0.35)' : 'rgba(40, 30, 18, 0.25)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 256; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  if (phase === 3) {
    // Crimson soaked stains in Phase 3
    const grad = ctx.createRadialGradient(128, 132, 12, 128, 132, 92);
    grad.addColorStop(0, 'rgba(92, 8, 8, 0.92)');
    grad.addColorStop(0.65, 'rgba(65, 6, 6, 0.65)');
    grad.addColorStop(1, 'rgba(50, 5, 5, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = maxAniso;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createParchmentTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#c8b38b';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 260; i += 1) {
    const x = (i * 89) % 512;
    const y = (i * 137) % 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(92, 68, 42, 0.08)' : 'rgba(235, 220, 185, 0.09)';
    ctx.fillRect(x, y, 16, 6);
  }

  // Aged ledger border & vertical Tang ink columns
  ctx.strokeStyle = 'rgba(42, 26, 18, 0.62)';
  ctx.lineWidth = 4;
  ctx.strokeRect(32, 32, 448, 448);
  ctx.lineWidth = 2;
  for (let x = 104; x <= 416; x += 68) {
    ctx.beginPath();
    ctx.moveTo(x, 32);
    ctx.lineTo(x, 480);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(28, 18, 12, 0.78)';
  ctx.font = 'bold 34px serif';
  ctx.fillText('糧 倉 檢 簿', 152, 92);

  // Brush-stroke tally blocks
  ctx.fillStyle = 'rgba(38, 25, 18, 0.65)';
  for (let row = 0; row < 6; row += 1) {
    ctx.fillRect(62, 134 + row * 48, 22, 10);
    ctx.fillRect(132, 140 + row * 48, 28, 8);
    ctx.fillRect(202, 136 + row * 48, 20, 10);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = maxAniso;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBloodStainTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 256);

  const patches = [
    { x: 112, y: 124, r: 58, a: 0.72 },
    { x: 158, y: 98, r: 36, a: 0.62 },
    { x: 82, y: 158, r: 28, a: 0.56 },
    { x: 176, y: 162, r: 22, a: 0.48 },
    { x: 56, y: 102, r: 16, a: 0.42 },
  ];
  for (const p of patches) {
    const grad = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, p.r);
    grad.addColorStop(0, `rgba(68, 6, 6, ${p.a})`);
    grad.addColorStop(0.65, `rgba(48, 5, 5, ${p.a * 0.7})`);
    grad.addColorStop(1, 'rgba(35, 4, 4, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = maxAniso;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRadialGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 18, 64, 64, 62);
  grad.addColorStop(0, 'rgba(255, 198, 102, 0.0)');
  grad.addColorStop(0.55, 'rgba(255, 186, 82, 0.58)');
  grad.addColorStop(0.8, 'rgba(220, 128, 42, 0.24)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSoftParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 240, 210, 0.95)');
  grad.addColorStop(0.45, 'rgba(235, 210, 175, 0.45)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function mountCellarScene(
  mountEl: HTMLDivElement,
  callbacks: CellarSceneCallbacks
): CellarSceneController {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false,
    });
  } catch {
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: 'low-power',
        failIfMajorPerformanceCaveat: false,
      });
    } catch (err) {
      callbacks.onWebglError?.(err instanceof Error ? err.message : 'WebGL initialization failed');
      return {
        syncState: () => {},
        triggerFX: () => {},
        dispose: () => {},
      };
    }
  }

  const isSoftwareGl = isSoftwareRendererContext(renderer.getContext());

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(mountEl.clientWidth || 960, mountEl.clientHeight || 540);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  if (!isSoftwareGl) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  } else {
    renderer.shadowMap.enabled = false;
  }

  mountEl.innerHTML = '';
  mountEl.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';

  const maxAniso = isSoftwareGl ? 1 : Math.min(4, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  const darkBg = new THREE.Color(0x050405);
  const phase3Bg = new THREE.Color(0x0c0304);
  const brightBg = new THREE.Color(0xd9cdb2);
  scene.background = darkBg.clone();
  const fog = new THREE.FogExp2(0x050405, 0.128);
  scene.fog = fog;

  let envTex: THREE.Texture | null = null;
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    envTex = pmrem.fromScene(roomEnv, 0.04).texture;
    roomEnv.dispose();
    scene.environment = envTex;
    scene.environmentIntensity = 0.26;
    pmrem.dispose();
  } catch {
    envTex = null;
  }

  const camera = new THREE.PerspectiveCamera(
    55,
    (mountEl.clientWidth || 960) / (mountEl.clientHeight || 540),
    0.1,
    30
  );
  const baseCamPos = new THREE.Vector3(0, 1.1, 1.72);
  const baseLookAt = new THREE.Vector3(0, 0.32, -0.34);
  camera.position.copy(baseCamPos);
  camera.lookAt(baseLookAt);

  // Lighting Rig (Key warm oil lamp + cool stone vent fill + crimson horror rim + liberation sun)
  const hemiLight = new THREE.HemisphereLight(0x52678a, 0x1a120d, 0.46);
  scene.add(hemiLight);

  const lampLight = new THREE.PointLight(0xff9c42, 5.2, 8.2, 1.35);
  lampLight.position.set(-0.76, 0.45, -0.3);
  if (!isSoftwareGl) {
    lampLight.castShadow = true;
    lampLight.shadow.mapSize.set(1024, 1024);
    lampLight.shadow.bias = -0.0005;
    lampLight.shadow.normalBias = 0.02;
  }
  scene.add(lampLight);

  const ventLight = new THREE.SpotLight(0x8aa8d1, 2.2, 6.8, Math.PI / 5.2, 0.68, 1.45);
  ventLight.position.set(1.42, 1.66, -0.92);
  ventLight.target.position.set(0.22, 0.06, -0.18);
  scene.add(ventLight);
  scene.add(ventLight.target);

  const liberationSun = new THREE.DirectionalLight(0xfff1cf, 0);
  liberationSun.position.set(-2.5, 1.5, 0.4);
  scene.add(liberationSun);

  // Shared Procedural PBR Textures & Materials
  const woodMap = createWoodTexture(false, maxAniso);
  const woodBump = createWoodTexture(true, maxAniso);
  const stoneMap = createStoneTexture(false, maxAniso);
  const stoneBump = createStoneTexture(true, maxAniso);
  const parchmentMap = createParchmentTexture(maxAniso);
  const bloodMap = createBloodStainTexture(maxAniso);
  const burlap1Map = createBurlapTexture(1, maxAniso);
  const burlap2Map = createBurlapTexture(2, maxAniso);
  const burlap3Map = createBurlapTexture(3, maxAniso);
  const glowTex = createRadialGlowTexture();
  const particleTex = createSoftParticleTexture();

  const deskWoodMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: woodMap,
    bumpMap: woodBump,
    bumpScale: 0.024,
    roughness: 0.74,
    metalness: 0.04,
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x26160e,
    roughness: 0.66,
    metalness: 0.06,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: stoneMap,
    bumpMap: stoneBump,
    bumpScale: 0.04,
    roughness: 0.9,
    metalness: 0.03,
  });
  const rustedIronMat = new THREE.MeshStandardMaterial({
    color: 0x383436,
    roughness: 0.56,
    metalness: 0.78,
  });
  const agedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xc29548,
    roughness: 0.3,
    metalness: 0.84,
  });
  const crimsonWaxMat = new THREE.MeshStandardMaterial({
    color: 0x8f1414,
    roughness: 0.16,
    metalness: 0.05,
  });
  const bloodStainMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: bloodMap,
    roughness: 0.25,
    metalness: 0.08,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const glassChimneyMat = new THREE.MeshStandardMaterial({
    color: 0xffdeb0,
    roughness: 0.15,
    metalness: 0.05,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });

  const disposables: {
    geometries: THREE.BufferGeometry[];
    materials: THREE.Material[];
    textures: THREE.Texture[];
  } = {
    geometries: [],
    materials: [
      deskWoodMat,
      darkWoodMat,
      stoneMat,
      rustedIronMat,
      agedBrassMat,
      crimsonWaxMat,
      bloodStainMat,
      glassChimneyMat,
    ],
    textures: [
      woodMap,
      woodBump,
      stoneMap,
      stoneBump,
      parchmentMap,
      bloodMap,
      burlap1Map,
      burlap2Map,
      burlap3Map,
      glowTex,
      particleTex,
    ],
  };

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    disposables.materials.push(m);
    return m;
  };

  const interactables: THREE.Object3D[] = [];
  const registerHitProxy = (
    group: THREE.Group,
    propId: CellarPropId,
    size: [number, number, number],
    offset: [number, number, number] = [0, 0, 0]
  ) => {
    const proxyMat = trackMat(
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    const proxy = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(...size)), proxyMat);
    proxy.position.set(...offset);
    proxy.userData.propId = propId;
    group.add(proxy);
    interactables.push(proxy);
  };

  // --- Subterranean Granary Architecture + Atmospheric Corner Props ---
  const roomGroup = new THREE.Group();
  const floor = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(7.2, 6.2)), stoneMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.78;
  floor.receiveShadow = true;
  roomGroup.add(floor);

  const backWall = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(7.2, 4.2)), stoneMat);
  backWall.position.set(0, 1.1, -1.68);
  backWall.receiveShadow = true;
  roomGroup.add(backWall);

  const leftWall = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(6.2, 4.2)), stoneMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-2.35, 1.1, 0.4);
  leftWall.receiveShadow = true;
  roomGroup.add(leftWall);

  const rightWall = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(6.2, 4.2)), stoneMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(2.35, 1.1, 0.4);
  rightWall.receiveShadow = true;
  roomGroup.add(rightWall);

  // Structural stone pilasters along back corners
  for (const px of [-2.12, -1.1, 0.15, 1.85]) {
    const pilaster = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.26, 3.6, 0.2)), stoneMat);
    pilaster.position.set(px, 0.85, -1.58);
    roomGroup.add(pilaster);
  }

  // Heavy ceiling timber beams
  for (let bx = -1.65; bx <= 1.65; bx += 1.05) {
    const beam = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.2, 0.24, 5)), darkWoodMat);
    beam.position.set(bx, 2.38, -0.1);
    roomGroup.add(beam);
  }

  // Stacked granary storage barrels & crates flanking back corners (grounding the room)
  const addBarrel = (x: number, z: number, scale = 1) => {
    const bGroup = new THREE.Group();
    bGroup.position.set(x, -0.78, z);
    const body = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.24 * scale, 0.22 * scale, 0.68 * scale, 14)),
      darkWoodMat
    );
    body.position.y = 0.34 * scale;
    bGroup.add(body);
    for (const hy of [0.16, 0.52]) {
      const hoop = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.245 * scale, 0.245 * scale, 0.03 * scale, 14)),
        rustedIronMat
      );
      hoop.position.y = hy * scale;
      bGroup.add(hoop);
    }
    roomGroup.add(bGroup);
  };
  addBarrel(-1.72, -1.18, 1.05);
  addBarrel(-1.35, -1.32, 0.86);
  addBarrel(1.78, -1.16, 1.02);

  // Wooden rice crate on right corner
  const cornerCrate = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.56, 0.44, 0.46)), deskWoodMat);
  cornerCrate.position.set(1.56, -0.56, -1.32);
  cornerCrate.rotation.y = -0.22;
  roomGroup.add(cornerCrate);

  // Phase 3 blood-dripping stain pool beneath pulley on stone floor
  const floorBloodPool = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.75, 0.65)), bloodStainMat);
  floorBloodPool.rotation.x = -Math.PI / 2;
  floorBloodPool.position.set(-0.32, -0.775, -0.78);
  roomGroup.add(floorBloodPool);

  scene.add(roomGroup);

  // --- Wooden Inspection Desk (Multi-part bevel + trim) ---
  const deskGroup = new THREE.Group();
  const deskTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.6, 0.095, 1.28)), deskWoodMat);
  deskTop.position.set(0, -0.048, -0.15);
  deskTop.receiveShadow = true;
  deskTop.castShadow = true;
  deskGroup.add(deskTop);

  const deskTrim = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.64, 0.04, 1.32)), darkWoodMat);
  deskTrim.position.set(0, -0.095, -0.15);
  deskGroup.add(deskTrim);

  const deskApron = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.4, 0.14, 1.08)), darkWoodMat);
  deskApron.position.set(0, -0.17, -0.15);
  deskGroup.add(deskApron);

  for (const lx of [-1.12, 1.12]) {
    for (const lz of [-0.64, 0.34]) {
      const leg = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.12, 0.65, 0.12)), darkWoodMat);
      leg.position.set(lx, -0.46, lz);
      deskGroup.add(leg);
    }
  }

  // Phase 3 organic blood stain decal near pulley drop zone on desk
  const bloodSmear = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.52, 0.46)), bloodStainMat);
  bloodSmear.rotation.x = -Math.PI / 2;
  bloodSmear.position.set(-0.32, 0.004, -0.44);
  deskGroup.add(bloodSmear);
  scene.add(deskGroup);

  // --- Hover & Guided Next-Step Tabletop Beacon Halos ---
  const guidedRingMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: glowTex,
      color: 0xffb347,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  const guidedBeacon = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.42, 0.42)), guidedRingMat);
  guidedBeacon.rotation.x = -Math.PI / 2;
  guidedBeacon.position.set(-0.32, 0.008, -0.78);
  scene.add(guidedBeacon);

  const hoverRingMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: glowTex,
      color: 0xffe4a8,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  const hoverBeacon = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.46, 0.46)), hoverRingMat);
  hoverBeacon.rotation.x = -Math.PI / 2;
  hoverBeacon.position.set(0, 0.01, 0);
  scene.add(hoverBeacon);

  // --- 1. Multi-Part Brass & Glass Oil Lamp ('lamp') ---
  const lampGroup = new THREE.Group();
  lampGroup.position.set(-0.82, 0, -0.32);

  const lampBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.115, 0.145, 0.055, 16)), agedBrassMat);
  lampBase.position.y = 0.028;
  lampBase.castShadow = true;
  lampGroup.add(lampBase);

  const lampBowl = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.108, 16, 10)), agedBrassMat);
  lampBowl.scale.set(1, 0.62, 1);
  lampBowl.position.y = 0.105;
  lampBowl.castShadow = true;
  lampGroup.add(lampBowl);

  const lampSpout = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.018, 0.032, 0.11, 10)), agedBrassMat);
  lampSpout.rotation.z = -Math.PI / 3;
  lampSpout.position.set(0.105, 0.138, 0);
  lampGroup.add(lampSpout);

  const lampGlass = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.042, 0.054, 0.145, 14, 1, true)),
    glassChimneyMat
  );
  lampGlass.position.set(0.135, 0.215, 0);
  lampGroup.add(lampGlass);

  const lampHandle = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.06, 0.012, 8, 14, Math.PI)), rustedIronMat);
  lampHandle.rotation.z = Math.PI / 2;
  lampHandle.position.set(-0.11, 0.12, 0);
  lampGroup.add(lampHandle);

  const flameMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xffb347 }));
  const lampFlame = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.024, 0.082, 10)), flameMat);
  lampFlame.position.set(0.135, 0.2, 0);
  lampGroup.add(lampFlame);

  const flameCore = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.015, 8, 6)),
    trackMat(new THREE.MeshBasicMaterial({ color: 0xfff3c4 }))
  );
  flameCore.position.set(0.135, 0.175, 0);
  lampGroup.add(flameCore);

  registerHitProxy(lampGroup, 'lamp', [0.36, 0.36, 0.36], [0.02, 0.16, 0]);
  scene.add(lampGroup);

  // --- 2. Brass Balance Scale ('scale') ---
  const scaleGroup = new THREE.Group();
  scaleGroup.position.set(-0.34, 0, -0.2);

  const scalePlinth = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.26, 0.042, 0.18)), darkWoodMat);
  scalePlinth.position.y = 0.021;
  scalePlinth.castShadow = true;
  scaleGroup.add(scalePlinth);

  const scalePost = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.018, 0.028, 0.37, 12)), agedBrassMat);
  scalePost.position.y = 0.22;
  scalePost.castShadow = true;
  scaleGroup.add(scalePost);

  const scaleFinial = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.034, 0)), agedBrassMat);
  scaleFinial.position.y = 0.42;
  scaleGroup.add(scaleFinial);

  const scaleBeamPivot = new THREE.Group();
  scaleBeamPivot.position.y = 0.38;
  const scaleBeam = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.58, 0.02, 0.024)), agedBrassMat);
  scaleBeamPivot.add(scaleBeam);

  const leftPanGroup = new THREE.Group();
  leftPanGroup.position.set(-0.255, -0.18, 0);
  const leftPanDish = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.115, 0.082, 0.022, 16)), agedBrassMat);
  leftPanGroup.add(leftPanDish);
  const leftCord = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.004, 0.004, 0.18, 6)), rustedIronMat);
  leftCord.position.y = 0.09;
  leftPanGroup.add(leftCord);

  const scaleParcelMat = trackMat(
    new THREE.MeshStandardMaterial({ map: burlap1Map, roughness: 0.9, metalness: 0.02 })
  );
  const scaleParcelMesh = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.072, 1)), scaleParcelMat);
  scaleParcelMesh.scale.set(1.18, 0.78, 0.96);
  scaleParcelMesh.position.y = 0.058;
  scaleParcelMesh.visible = false;
  leftPanGroup.add(scaleParcelMesh);
  scaleBeamPivot.add(leftPanGroup);

  const rightPanGroup = new THREE.Group();
  rightPanGroup.position.set(0.255, -0.18, 0);
  const rightPanDish = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.115, 0.082, 0.022, 16)), agedBrassMat);
  rightPanGroup.add(rightPanDish);
  const rightCord = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.004, 0.004, 0.18, 6)), rustedIronMat);
  rightCord.position.y = 0.09;
  rightPanGroup.add(rightCord);

  const weightMeshes: THREE.Mesh[] = [];
  for (let w = 0; w < 8; w += 1) {
    const wm = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.022, 0.025, 0.032, 10)), agedBrassMat);
    const angle = (w / 8) * Math.PI * 2;
    wm.position.set(Math.cos(angle) * 0.044, 0.025 + Math.floor(w / 4) * 0.034, Math.sin(angle) * 0.044);
    wm.visible = false;
    rightPanGroup.add(wm);
    weightMeshes.push(wm);
  }
  scaleBeamPivot.add(rightPanGroup);
  scaleGroup.add(scaleBeamPivot);

  registerHitProxy(scaleGroup, 'scale', [0.66, 0.48, 0.3], [0, 0.24, 0]);
  scene.add(scaleGroup);

  // --- 3. Suanpan Abacus ('abacus') ---
  const abacusGroup = new THREE.Group();
  abacusGroup.position.set(0.56, 0.045, 0.05);
  abacusGroup.rotation.x = -0.34;
  abacusGroup.rotation.y = -0.22;

  const frameTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 0.028, 0.038)), darkWoodMat);
  frameTop.position.y = 0.13;
  abacusGroup.add(frameTop);
  const frameBot = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 0.028, 0.038)), darkWoodMat);
  frameBot.position.y = -0.13;
  abacusGroup.add(frameBot);
  const frameMid = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.4, 0.018, 0.034)), darkWoodMat);
  frameMid.position.y = 0.045;
  abacusGroup.add(frameMid);
  for (const sx of [-0.196, 0.196]) {
    const side = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.028, 0.28, 0.038)), darkWoodMat);
    side.position.x = sx;
    abacusGroup.add(side);
  }

  const beadMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x6f391b, roughness: 0.42, metalness: 0.08 })
  );
  const beadGeo = trackGeo(new THREE.SphereGeometry(0.021, 12, 10));
  const heavenBeadMeshes: THREE.Mesh[] = [];
  const earthBeadMeshes: THREE.Mesh[][] = [];

  const rodXPositions = [-0.11, 0, 0.11];
  for (let r = 0; r < 3; r += 1) {
    const rx = rodXPositions[r];
    const rod = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.005, 0.005, 0.24, 8)), agedBrassMat);
    rod.position.x = rx;
    abacusGroup.add(rod);

    const hBead = new THREE.Mesh(beadGeo, beadMat);
    hBead.scale.set(1.15, 0.72, 1.15);
    hBead.position.set(rx, 0.1, 0);
    abacusGroup.add(hBead);
    heavenBeadMeshes.push(hBead);

    const row: THREE.Mesh[] = [];
    for (let e = 0; e < 4; e += 1) {
      const eBead = new THREE.Mesh(beadGeo, beadMat);
      eBead.scale.set(1.15, 0.72, 1.15);
      eBead.position.set(rx, -0.1 + e * 0.031, 0);
      abacusGroup.add(eBead);
      row.push(eBead);
    }
    earthBeadMeshes.push(row);
  }

  registerHitProxy(abacusGroup, 'abacus', [0.46, 0.32, 0.14], [0, 0, 0]);
  scene.add(abacusGroup);

  // --- 4. Requisition Ledger Slip ('ledger') ---
  const ledgerGroup = new THREE.Group();
  ledgerGroup.position.set(0.08, 0.005, 0.12);
  ledgerGroup.rotation.y = 0.04;

  const slipMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: parchmentMap,
      roughness: 0.88,
      metalness: 0.02,
    })
  );
  const slipMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.38, 0.008, 0.46)), slipMat);
  slipMesh.receiveShadow = true;
  ledgerGroup.add(slipMesh);

  const stampMarkMat = trackMat(
    new THREE.MeshBasicMaterial({ color: 0xa31414, transparent: true, opacity: 0.92 })
  );
  const stampMarkMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.088, 0.004, 0.088)), stampMarkMat);
  stampMarkMesh.position.set(0.07, 0.006, 0.12);
  stampMarkMesh.visible = false;
  ledgerGroup.add(stampMarkMesh);

  registerHitProxy(ledgerGroup, 'ledger', [0.42, 0.08, 0.48], [0, 0.03, 0]);
  scene.add(ledgerGroup);

  // --- 5. Crimson Ink Pad ('inkpad') & Vermilion Seal ('seal') ---
  const inkpadGroup = new THREE.Group();
  inkpadGroup.position.set(0.45, 0, -0.34);
  const inkBox = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.088, 0.094, 0.036, 16)), darkWoodMat);
  inkBox.position.y = 0.018;
  inkBox.castShadow = true;
  inkpadGroup.add(inkBox);
  const inkPaste = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.07, 0.07, 0.014, 16)), crimsonWaxMat);
  inkPaste.position.y = 0.036;
  inkpadGroup.add(inkPaste);
  registerHitProxy(inkpadGroup, 'inkpad', [0.22, 0.14, 0.22], [0, 0.04, 0]);
  scene.add(inkpadGroup);

  const sealGroup = new THREE.Group();
  const sealRestPos = new THREE.Vector3(0.32, 0, -0.18);
  sealGroup.position.copy(sealRestPos);
  const sealMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xd9cbb0, roughness: 0.34, metalness: 0.06 })
  );
  const sealBlock = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.074, 0.095, 0.074)), sealMat);
  sealBlock.position.y = 0.048;
  sealBlock.castShadow = true;
  sealGroup.add(sealBlock);
  const sealKnob = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.026, 10, 10)), agedBrassMat);
  sealKnob.position.y = 0.11;
  sealGroup.add(sealKnob);
  const sealTip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.076, 0.012, 0.076)), crimsonWaxMat);
  sealTip.position.y = 0.006;
  sealTip.visible = false;
  sealGroup.add(sealTip);
  registerHitProxy(sealGroup, 'seal', [0.16, 0.18, 0.16], [0, 0.07, 0]);
  scene.add(sealGroup);

  // --- 6. Stone Washbasin with Ghost Cluster Reflection ('washbasin') ---
  const basinGroup = new THREE.Group();
  basinGroup.position.set(-0.76, 0, 0.18);
  const basinRim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.145, 0.028, 10, 20)), stoneMat);
  basinRim.rotation.x = Math.PI / 2;
  basinRim.position.y = 0.07;
  basinGroup.add(basinRim);

  const basinWall = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.155, 0.12, 0.075, 18)), stoneMat);
  basinWall.position.y = 0.038;
  basinWall.castShadow = true;
  basinGroup.add(basinWall);

  const waterMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x0a131a,
      roughness: 0.06,
      metalness: 0.62,
    })
  );
  const waterDisc = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.132, 20)), waterMat);
  waterDisc.rotation.x = -Math.PI / 2;
  waterDisc.position.y = 0.062;
  basinGroup.add(waterDisc);

  const ghostMat = trackMat(
    new THREE.MeshBasicMaterial({ color: 0xc2ccd6, transparent: true, opacity: 0 })
  );
  const ghostCluster = new THREE.Group();
  ghostCluster.position.y = 0.066;
  for (let g = 0; g < 5; g += 1) {
    const gx = (g - 2) * 0.036;
    const gz = g % 2 === 0 ? -0.024 : 0.018;
    const head = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.015, 10)), ghostMat);
    head.rotation.x = -Math.PI / 2;
    head.position.set(gx, 0, gz - 0.022);
    ghostCluster.add(head);
    const torso = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.026, 0.056)), ghostMat);
    torso.rotation.x = -Math.PI / 2;
    torso.position.set(gx, 0, gz + 0.016);
    ghostCluster.add(torso);
  }
  basinGroup.add(ghostCluster);
  registerHitProxy(basinGroup, 'washbasin', [0.34, 0.16, 0.34], [0, 0.06, 0]);
  scene.add(basinGroup);

  // --- 7. Iron Pulley, Rope & Woven Burlap Parcel ('pulley') ---
  const pulleyAnchor = new THREE.Group();
  pulleyAnchor.position.set(-0.32, 0, -0.78);
  const pulleyWheel = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.14, 0.025, 10, 18)), rustedIronMat);
  pulleyWheel.position.set(0, 1.38, 0);
  pulleyAnchor.add(pulleyWheel);

  const pulleyRope = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.013, 0.013, 1.65, 8)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x6f5a3f, roughness: 0.92 }))
  );
  pulleyRope.position.set(0, 1.15, 0);
  pulleyAnchor.add(pulleyRope);

  const pulleyBasket = new THREE.Group();
  pulleyBasket.position.set(0, 0.88, 0);
  const basketTray = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.22, 0.17, 0.075, 14)), darkWoodMat);
  basketTray.castShadow = true;
  pulleyBasket.add(basketTray);

  const basketParcelMat = trackMat(
    new THREE.MeshStandardMaterial({ map: burlap1Map, roughness: 0.92, metalness: 0.02 })
  );
  const basketParcel = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.135, 1)), basketParcelMat);
  basketParcel.scale.set(1.2, 0.82, 0.98);
  basketParcel.position.y = 0.105;
  basketParcel.castShadow = true;
  pulleyBasket.add(basketParcel);

  // Parcel tie collar for physical realism
  const parcelKnot = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.045, 0.012, 6, 12)), darkWoodMat);
  parcelKnot.rotation.x = Math.PI / 2;
  parcelKnot.position.y = 0.19;
  pulleyBasket.add(parcelKnot);
  pulleyAnchor.add(pulleyBasket);

  registerHitProxy(pulleyAnchor, 'pulley', [0.58, 1.32, 0.58], [0, 0.65, 0]);
  scene.add(pulleyAnchor);

  // --- 8. Heavy Riveted Iron Cellar Door ('door') ---
  const doorGroup = new THREE.Group();
  doorGroup.position.set(-2.31, 0.35, -0.45);
  doorGroup.rotation.y = Math.PI / 2;

  const doorJambL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.15, 2.2, 0.18)), stoneMat);
  doorJambL.position.set(-0.52, 0, 0);
  doorGroup.add(doorJambL);
  const doorJambR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.15, 2.2, 0.18)), stoneMat);
  doorJambR.position.set(0.52, 0, 0);
  doorGroup.add(doorJambR);

  const doorLeaf = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.92, 2.02, 0.08)), rustedIronMat);
  doorGroup.add(doorLeaf);
  const doorBar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.96, 0.09, 0.13)), darkWoodMat);
  doorBar.position.set(0, -0.05, 0.04);
  doorGroup.add(doorBar);

  // Small iron peep-slit with crimson nightmare eyes peeking in Phase 3 / blackout
  const doorEyeMat = trackMat(
    new THREE.MeshBasicMaterial({ color: 0xdc2626, transparent: true, opacity: 0 })
  );
  for (const ex of [-0.045, 0.045]) {
    const eye = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.014, 6, 6)), doorEyeMat);
    eye.position.set(ex, 0.42, 0.05);
    doorGroup.add(eye);
  }

  registerHitProxy(doorGroup, 'door', [1.1, 2.1, 0.35], [0, 0, 0]);
  scene.add(doorGroup);

  // --- 9. High Barred Air Vent + Volumetric Light Beam + Multi-part NPC Silhouette ('vent') ---
  const ventGroup = new THREE.Group();
  ventGroup.position.set(1.02, 0.96, -1.6);

  const ventFrame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.78, 0.46, 0.1)), stoneMat);
  ventFrame.position.z = -0.02;
  ventGroup.add(ventFrame);

  const ventSkyMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x3b4e69 }));
  const ventOpening = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.64, 0.34)), ventSkyMat);
  ventOpening.position.z = 0.024;
  ventGroup.add(ventOpening);

  for (let b = -2; b <= 2; b += 1) {
    const bar = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.013, 0.013, 0.36, 8)), rustedIronMat);
    bar.position.set(b * 0.12, 0, 0.042);
    ventGroup.add(bar);
  }

  // Multi-part NPC head + shoulders + gripping fingers peeking through bars
  const npcSilhouette = new THREE.Group();
  npcSilhouette.position.set(0.05, -0.04, 0.032);
  const npcMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x070607 }));
  const npcHead = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.088, 10, 10)), npcMat);
  npcHead.position.y = 0.025;
  npcSilhouette.add(npcHead);
  const npcShoulders = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.09, 0.16, 0.14, 10)), npcMat);
  npcShoulders.position.y = -0.09;
  npcSilhouette.add(npcShoulders);
  for (const fx of [-0.14, 0.14]) {
    const hand = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.024, 6, 6)), npcMat);
    hand.position.set(fx, -0.05, 0.02);
    npcSilhouette.add(hand);
  }
  npcSilhouette.visible = false;
  ventGroup.add(npcSilhouette);

  // Subtle volumetric light cone streaming down from the vent toward the desk
  const beamMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0x7b9cc7,
      transparent: true,
      opacity: 0.065,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
  );
  const ventBeam = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.62, 1.9, 14, 1, true)), beamMat);
  ventBeam.position.set(-0.34, -0.62, 0.62);
  ventBeam.rotation.z = -0.34;
  ventBeam.rotation.x = 0.56;
  ventGroup.add(ventBeam);

  registerHitProxy(ventGroup, 'vent', [0.8, 0.48, 0.32], [0, 0, 0.05]);
  scene.add(ventGroup);

  // --- 10. Floating Cellar Dust & Embers Particle Field (THREE.Points) ---
  const particleCount = 80;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleSeeds = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i += 1) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 3.8;
    particlePositions[i * 3 + 1] = -0.35 + Math.random() * 2.1;
    particlePositions[i * 3 + 2] = -1.4 + Math.random() * 2.4;
    particleSeeds[i] = Math.random() * Math.PI * 2;
  }
  const particleGeo = trackGeo(new THREE.BufferGeometry());
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMat = trackMat(
    new THREE.PointsMaterial({
      size: 0.032,
      map: particleTex,
      color: 0xe6cfa8,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  const dustPoints = new THREE.Points(particleGeo, particleMat);
  scene.add(dustPoints);

  // Table coordinates map for guided & hover beacon discs
  const PROP_BEACON_POS: Record<CellarPropId, [number, number, number]> = {
    lamp: [-0.82, 0.008, -0.32],
    pulley: [-0.32, 0.008, -0.78],
    scale: [-0.34, 0.008, -0.2],
    abacus: [0.56, 0.008, 0.05],
    inkpad: [0.45, 0.008, -0.34],
    seal: [0.32, 0.008, -0.18],
    ledger: [0.08, 0.008, 0.12],
    washbasin: [-0.76, 0.008, 0.18],
    vent: [1.02, 0.96, -1.52],
    door: [-2.18, 0.35, -0.45],
  };

  // --- Simulation & Animation State ---
  let activeState: CellarGameState | null = null;
  let playingMode = false;
  let hoveredProp: CellarPropId | null = null;
  const pointerNdc = new THREE.Vector2(0, 0);
  const raycaster = new THREE.Raycaster();
  const scratchTargetCamPos = new THREE.Vector3();
  const scratchTargetLook = new THREE.Vector3();

  let trauma = 0;
  let sealAnimTime = 0;
  let sealAnimMode: 'none' | 'dip' | 'slam' = 'none';
  let doorShakeTime = 0;
  let rippleTime = 0;
  let liberationBlend = 0;

  const updateAbacusMeshes = (abacus: AbacusState, dt: number) => {
    const k = 1 - Math.exp(-14 * dt);
    for (let r = 0; r < 3; r += 1) {
      const rod = abacus[r];
      const hTargetY = rod.heaven ? 0.072 : 0.105;
      heavenBeadMeshes[r].position.y += (hTargetY - heavenBeadMeshes[r].position.y) * k;

      for (let e = 0; e < 4; e += 1) {
        const beadIdxFromTop = 3 - e;
        const isUp = beadIdxFromTop < rod.earth;
        const targetY = isUp ? 0.021 - beadIdxFromTop * 0.025 : -0.102 + e * 0.024;
        earthBeadMeshes[r][e].position.y += (targetY - earthBeadMeshes[r][e].position.y) * k;
      }
    }
  };

  const applyStateToMeshes = (state: CellarGameState) => {
    const script = getDayScript(state.day);
    scaleParcelMesh.visible = state.parcelOnScale;
    const burlapMap = state.phase === 3 ? burlap3Map : state.phase === 2 ? burlap2Map : burlap1Map;
    if (scaleParcelMat.map !== burlapMap) {
      scaleParcelMat.map = burlapMap;
      scaleParcelMat.needsUpdate = true;
    }
    if (basketParcelMat.map !== burlapMap) {
      basketParcelMat.map = burlapMap;
      basketParcelMat.needsUpdate = true;
    }

    basketParcel.visible = !state.parcelOnScale && state.stampedDecision === null;
    parcelKnot.visible = basketParcel.visible;

    for (let i = 0; i < weightMeshes.length; i += 1) {
      weightMeshes[i].visible = i < state.scaleWeights.length;
    }

    sealTip.visible = state.sealInked;
    stampMarkMesh.visible = state.stampedDecision !== null;
    stampMarkMat.color.setHex(state.stampedDecision === 'approved' ? 0xa81616 : 0x262626);

    bloodStainMat.opacity = state.phase === 3 ? 0.88 : state.phase === 2 ? 0.24 : 0;
    npcSilhouette.visible = Boolean(script.ventEncounter && !state.ventHandled);

    if (state.phase === 3) {
      ventSkyMat.color.setHex(0x632724);
      beamMat.color.setHex(0xc9523b);
      ventLight.color.setHex(0xc96550);
      particleMat.color.setHex(0xfca5a5);
    } else if (state.phase === 2) {
      ventSkyMat.color.setHex(0x4c4a46);
      beamMat.color.setHex(0xa89b84);
      ventLight.color.setHex(0x9ca4b3);
      particleMat.color.setHex(0xd6cab4);
    } else {
      ventSkyMat.color.setHex(0x3b4e69);
      beamMat.color.setHex(0x7b9cc7);
      ventLight.color.setHex(0x8aa8d1);
      particleMat.color.setHex(0xe6cfa8);
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (!playingMode) {
      if (hoveredProp !== null) {
        hoveredProp = null;
        callbacks.onHoverPropChange(null);
      }
      return;
    }

    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(interactables, false);
    const nextProp = hits.length > 0 ? ((hits[0].object.userData.propId as CellarPropId) ?? null) : null;
    if (nextProp !== hoveredProp) {
      hoveredProp = nextProp;
      renderer.domElement.style.cursor = nextProp ? 'pointer' : 'default';
      callbacks.onHoverPropChange(nextProp);
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!playingMode || e.button !== 0) return;
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(interactables, false);
    if (hits.length > 0) {
      const propId = hits[0].object.userData.propId as CellarPropId | undefined;
      if (propId) {
        callbacks.onPropClick(propId);
      }
    }
  };

  const onResize = () => {
    const w = mountEl.clientWidth || 960;
    const h = mountEl.clientHeight || 540;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };

  let disposed = false;
  let contextLost = false;
  let rafId = 0;
  let timeoutId: number | null = null;
  let prevTime = performance.now();
  let elapsed = 0;

  const onContextLost = (e: Event) => {
    e.preventDefault();
    contextLost = true;
    cancelAnimationFrame(rafId);
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const onContextRestored = () => {
    if (disposed) return;
    contextLost = false;
    prevTime = performance.now();
    rafId = requestAnimationFrame(tick);
  };

  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
  window.addEventListener('resize', onResize);

  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(mountEl);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  const afterDraw = (fn: () => void) => {
    if (disposed || contextLost) return;
    const gl = renderer.getContext();
    const gl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext ? gl : null;
    if (gl2) {
      const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl2.flush();
      const poll = () => {
        if (disposed || contextLost) return;
        const status = sync ? gl2.clientWaitSync(sync, 0, 0) : gl2.ALREADY_SIGNALED;
        if (status === gl2.TIMEOUT_EXPIRED) {
          timeoutId = window.setTimeout(poll, 16);
          return;
        }
        if (sync) gl2.deleteSync(sync);
        timeoutId = window.setTimeout(() => {
          if (!disposed && !contextLost) rafId = requestAnimationFrame(fn);
        }, 80);
      };
      poll();
    } else {
      timeoutId = window.setTimeout(() => {
        if (!disposed && !contextLost) rafId = requestAnimationFrame(fn);
      }, 80);
    }
  };

  const tick = () => {
    if (disposed || contextLost) return;
    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - prevTime) / 1000));
    prevTime = now;
    elapsed += dt;

    const st = activeState;
    const isLit = st ? st.lampLit : true;
    const oilFactor = st ? Math.max(0.25, st.lampOil / 100) : 0.8;
    const isLib = st?.ending === 'historical_liberation';

    if (isLib) {
      liberationBlend = Math.min(1, liberationBlend + dt * 0.75);
      liberationSun.intensity = liberationBlend * 4.5;
      hemiLight.intensity = 0.46 + liberationBlend * 2.2;
      (scene.background as THREE.Color).lerpColors(darkBg, brightBg, liberationBlend);
      fog.color.copy(scene.background as THREE.Color);
      fog.density = 0.128 * (1 - liberationBlend * 0.75);
      doorGroup.rotation.y = Math.PI / 2 - liberationBlend * 1.15;
    } else {
      liberationBlend = 0;
      liberationSun.intensity = 0;
      hemiLight.intensity = isLit ? 0.46 : 0.09;
      const targetBg = st?.phase === 3 ? phase3Bg : darkBg;
      (scene.background as THREE.Color).copy(targetBg);
      fog.color.copy(targetBg);
      fog.density = isLit ? 0.128 : 0.24;
      doorGroup.rotation.y = Math.PI / 2;
    }

    if (isLit) {
      const flicker =
        Math.sin(elapsed * 9.5) * 0.24 +
        Math.sin(elapsed * 23.1) * 0.12 +
        Math.cos(elapsed * 4.3) * 0.16;
      const targetIntensity = (4.1 + oilFactor * 1.85 + flicker) * (playingMode ? 1 : 0.78);
      lampLight.intensity += (targetIntensity - lampLight.intensity) * (1 - Math.exp(-12 * dt));
      lampFlame.visible = true;
      flameCore.visible = true;
      const flameScale = 0.76 + oilFactor * 0.46 + flicker * 0.12;
      lampFlame.scale.set(flameScale, flameScale, flameScale);
    } else {
      lampLight.intensity += (0 - lampLight.intensity) * (1 - Math.exp(-10 * dt));
      lampFlame.visible = false;
      flameCore.visible = false;
    }

    // Floating dust & embers animation
    const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < particleCount; i += 1) {
      const seed = particleSeeds[i];
      let py = posAttr.getY(i) + dt * (st?.phase === 3 ? 0.08 : 0.035);
      let px = posAttr.getX(i) + Math.sin(elapsed * 0.7 + seed) * dt * 0.04;
      if (py > 1.75) py = -0.35;
      if (px > 2.0) px = -2.0;
      if (px < -2.0) px = 2.0;
      posAttr.setXY(i, px, py);
    }
    posAttr.needsUpdate = true;

    // Crimson eyes behind iron door crack in Phase 3 / blackout / low sanity
    const eyesActive = Boolean(st && (!st.lampLit || st.phase === 3 || st.sanity < 45) && !isLib);
    const targetEyeOpacity = eyesActive ? 0.55 + Math.sin(elapsed * 4.2) * 0.25 : 0;
    doorEyeMat.opacity += (targetEyeOpacity - doorEyeMat.opacity) * (1 - Math.exp(-6 * dt));

    // Scale beam damping
    const targetTilt = st ? -computeScaleTiltNormalized(st) * 0.24 : 0;
    scaleBeamPivot.rotation.z += (targetTilt - scaleBeamPivot.rotation.z) * (1 - Math.exp(-9 * dt));
    leftPanGroup.rotation.z = -scaleBeamPivot.rotation.z;
    rightPanGroup.rotation.z = -scaleBeamPivot.rotation.z;

    // Pulley basket vertical motion
    const targetPulleyY = st?.pulleyLowered ? 0.15 : 0.84;
    pulleyBasket.position.y += (targetPulleyY - pulleyBasket.position.y) * (1 - Math.exp(-6 * dt));
    pulleyRope.position.y = pulleyBasket.position.y + 0.8;

    // Abacus bead damping
    if (st) {
      updateAbacusMeshes(st.abacus, dt);
    }

    // Guided beacon & hover ring highlight
    if (playingMode && st && !st.ending) {
      const guide = getGuidedNextStep(st);
      const gp = PROP_BEACON_POS[guide.focusProp];
      guidedBeacon.position.set(gp[0], gp[1], gp[2]);
      guidedBeacon.visible = Boolean(gp);
      const pulse = 0.86 + Math.sin(elapsed * 4.2) * 0.14;
      guidedBeacon.scale.set(pulse, pulse, 1);
      guidedRingMat.opacity = 0.36 + Math.sin(elapsed * 4.2) * 0.16;

      if (hoveredProp && hoveredProp !== 'door' && hoveredProp !== 'vent') {
        const hp = PROP_BEACON_POS[hoveredProp];
        hoverBeacon.position.set(hp[0], hp[1] + 0.002, hp[2]);
        hoverRingMat.opacity += (0.85 - hoverRingMat.opacity) * (1 - Math.exp(-14 * dt));
      } else {
        hoverRingMat.opacity += (0 - hoverRingMat.opacity) * (1 - Math.exp(-14 * dt));
      }
    } else {
      guidedBeacon.visible = false;
      hoverRingMat.opacity = 0;
    }

    // Seal dip / slam animation
    if (sealAnimMode !== 'none') {
      sealAnimTime += dt * 4.2;
      if (sealAnimMode === 'dip') {
        const p = Math.min(1, sealAnimTime);
        const arc = Math.sin(p * Math.PI);
        sealGroup.position.set(
          THREE.MathUtils.lerp(sealRestPos.x, 0.45, arc),
          arc * 0.12 + 0.02 * arc,
          THREE.MathUtils.lerp(sealRestPos.z, -0.34, arc)
        );
        if (p >= 1) {
          sealAnimMode = 'none';
          sealGroup.position.copy(sealRestPos);
        }
      } else if (sealAnimMode === 'slam') {
        const p = Math.min(1, sealAnimTime);
        const arc = Math.sin(p * Math.PI);
        sealGroup.position.set(
          THREE.MathUtils.lerp(sealRestPos.x, 0.15, arc),
          arc * 0.16,
          THREE.MathUtils.lerp(sealRestPos.z, 0.22, arc)
        );
        if (p >= 1) {
          sealAnimMode = 'none';
          sealGroup.position.copy(sealRestPos);
        }
      }
    }

    // Iron door pound vibration
    if (doorShakeTime > 0) {
      doorShakeTime = Math.max(0, doorShakeTime - dt);
      doorGroup.position.x = -2.31 + Math.sin(elapsed * 65) * 0.03 * doorShakeTime;
    } else {
      doorGroup.position.x = -2.31;
    }

    // Washbasin ghost reflection opacity
    const ghostTargetOpacity =
      st && st.washbasinGhostActive
        ? !st.lampLit
          ? 0.58
          : st.sanity < 45
            ? 0.44
            : 0.24 + Math.max(0, Math.sin(elapsed * 0.9)) * 0.16
        : 0;
    ghostMat.opacity += (ghostTargetOpacity - ghostMat.opacity) * (1 - Math.exp(-3 * dt));
    if (rippleTime > 0) {
      rippleTime = Math.max(0, rippleTime - dt);
      ghostCluster.rotation.y = Math.sin(elapsed * 14) * 0.15 * rippleTime;
    }

    // Camera subtle parallax + hover inspection lean + trauma shake
    const hoverLeanX =
      playingMode && hoveredProp ? Math.max(-0.1, Math.min(0.1, PROP_BEACON_POS[hoveredProp][0] * 0.09)) : 0;
    const lookParallaxX = playingMode ? pointerNdc.x * 0.18 + hoverLeanX : Math.sin(elapsed * 0.25) * 0.14;
    const lookParallaxY = playingMode ? pointerNdc.y * 0.08 : Math.cos(elapsed * 0.2) * 0.05;

    trauma = Math.max(0, trauma - dt * 1.9);
    const shake = trauma * trauma * 0.05;
    const shakeX = shake * Math.sin(elapsed * 54);
    const shakeY = shake * Math.cos(elapsed * 61);

    scratchTargetCamPos.set(
      baseCamPos.x + lookParallaxX * 0.26 + shakeX,
      baseCamPos.y + lookParallaxY * 0.16 + shakeY,
      baseCamPos.z - (hoveredProp ? 0.05 : 0)
    );
    camera.position.lerp(scratchTargetCamPos, 1 - Math.exp(-6 * dt));
    scratchTargetLook.set(
      baseLookAt.x + lookParallaxX,
      baseLookAt.y + lookParallaxY,
      baseLookAt.z
    );
    camera.lookAt(scratchTargetLook);

    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      rafId = requestAnimationFrame(tick);
    }
  };

  rafId = requestAnimationFrame(tick);

  return {
    syncState(state: CellarGameState, isPlaying: boolean) {
      activeState = state;
      playingMode = isPlaying;
      applyStateToMeshes(state);
    },
    triggerFX(kind) {
      if (kind === 'ink_dip') {
        sealAnimMode = 'dip';
        sealAnimTime = 0;
      } else if (kind === 'seal_slam') {
        sealAnimMode = 'slam';
        sealAnimTime = 0;
        trauma = Math.min(1, trauma + 0.52);
      } else if (kind === 'door_pound') {
        doorShakeTime = 0.65;
        trauma = Math.min(1, trauma + 0.6);
      } else if (kind === 'pulley_drop') {
        trauma = Math.min(1, trauma + 0.25);
      } else if (kind === 'wash_ripple') {
        rippleTime = 1.2;
      }
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(rafId);
      if (timeoutId !== null) clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      disposables.geometries.forEach((g) => g.dispose());
      disposables.materials.forEach((m) => m.dispose());
      disposables.textures.forEach((t) => t.dispose());
      envTex?.dispose();
      renderer.dispose();
    },
  };
}
