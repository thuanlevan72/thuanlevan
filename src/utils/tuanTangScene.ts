// Three.js WebGL First-Person Mausoleum Renderer for:
// TUẪN TÁNG: ĐỊA CUNG LY SƠN (殉葬)

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CrawlerEntity,
  TerracottaStatueEntity,
  TuanTangGameState,
} from './tuanTangEngine.ts';

export interface TuanTangSceneCallbacks {
  onWebglError?: (msg: string) => void;
}

export interface TuanTangSceneController {
  syncState: (state: TuanTangGameState, isPlaying: boolean) => void;
  dispose: () => void;
}

function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    const isSoft = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return isSoft;
  } catch {
    return true;
  }
}

function createTombStoneTexture(isBump: boolean, maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = isBump ? '#787878' : '#1b1a1e';
  ctx.fillRect(0, 0, 256, 256);

  const rows = 8;
  const rowH = 256 / rows;
  for (let r = 0; r < rows; r += 1) {
    const y = r * rowH;
    const offset = (r % 2) * 32;
    for (let c = -1; c < 5; c += 1) {
      const x = c * 64 + offset;
      const v = 22 + (((r * 11 + c * 17) & 15) * 2);
      ctx.fillStyle = isBump
        ? `rgb(${100 + (v % 48)},${100 + (v % 48)},${100 + (v % 48)})`
        : `rgb(${v + 2},${v + 1},${v + 4})`;
      ctx.fillRect(x + 2, y + 2, 60, rowH - 4);
    }
  }

  if (!isBump) {
    // Damp moss & ancient soot streaks
    ctx.fillStyle = 'rgba(18, 28, 22, 0.3)';
    ctx.fillRect(10, 40, 80, 120);
    ctx.fillRect(150, 110, 90, 130);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = maxAniso;
  if (!isBump) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createMercuryTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#7c909c');
  grad.addColorStop(0.5, '#c2d8e4');
  grad.addColorStop(1, '#5d7380');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 65; i += 1) {
    const x = (i * 47) % 256;
    const y = (i * 83) % 256;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(220, 245, 255, 0.24)' : 'rgba(40, 62, 74, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y, 22, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.anisotropy = maxAniso;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTerracottaTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#5a4d44';
  ctx.fillRect(0, 0, 128, 128);

  // Lamellar armor grid + dried mud cracks
  ctx.strokeStyle = 'rgba(26, 20, 17, 0.65)';
  ctx.lineWidth = 2;
  for (let y = 8; y < 128; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y);
    ctx.stroke();
    for (let x = 8; x < 128; x += 16) {
      ctx.strokeRect(x, y, 12, 12);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAniso;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Composite 8-part Terracotta Warrior (with hidden wide human eyes when Mimic is awake)
function buildTerracottaWarriorGroup(
  terraMat: THREE.Material,
  darkClayMat: THREE.Material,
  bronzeMat: THREE.Material,
  isMimic: boolean
): { group: THREE.Group; eyesGroup: THREE.Group } {
  const group = new THREE.Group();

  // 1. Stone plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.14, 0.78), darkClayMat);
  plinth.position.y = 0.07;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // 2. Legs / armored robe skirt
  const lowerRobe = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.78, 10), terraMat);
  lowerRobe.position.y = 0.53;
  lowerRobe.castShadow = true;
  group.add(lowerRobe);

  // 3. Armored lamellar torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.32), terraMat);
  torso.position.y = 1.22;
  torso.castShadow = true;
  group.add(torso);

  // 4. Layered shoulder pauldrons
  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.16, 0.34), darkClayMat);
  shoulders.position.y = 1.48;
  group.add(shoulders);

  // 5. Left & right arms
  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.54, 8), terraMat);
  leftArm.position.set(-0.34, 1.22, 0.08);
  leftArm.rotation.x = -0.35;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.54, 8), terraMat);
  rightArm.position.set(0.34, 1.24, 0.14);
  rightArm.rotation.x = -0.75;
  group.add(rightArm);

  // 6. Bronze halberd/spear
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 2.05, 6), darkClayMat);
  shaft.position.set(0.36, 1.08, 0.25);
  group.add(shaft);
  const spearHead = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.24, 4), bronzeMat);
  spearHead.position.set(0.36, 2.18, 0.25);
  group.add(spearHead);

  // 7. Sculpted head + Qin topknot bun
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 10, 10), terraMat);
  head.scale.set(0.88, 1.12, 0.94);
  head.position.y = 1.72;
  group.add(head);

  const topknot = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.058, 0.11, 8), darkClayMat);
  topknot.position.set(0.04, 1.9, -0.02);
  group.add(topknot);

  // 8. Living human wide-staring eyes (only visible on awakened mimics!)
  const eyesGroup = new THREE.Group();
  eyesGroup.position.set(0, 1.74, 0.13);
  eyesGroup.visible = false;

  if (isMimic) {
    const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffe8e0 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x120202 });
    for (const sx of [-0.05, 0.05]) {
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), scleraMat);
      sclera.position.set(sx, 0, 0);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.013, 6, 6), pupilMat);
      pupil.position.set(sx, 0, 0.02);
      eyesGroup.add(sclera, pupil);
    }
  }
  group.add(eyesGroup);

  return { group, eyesGroup };
}

// Composite 9-part Pale Mercury-Ulcered Blind Crawler (four-limb predator)
function buildCrawlerGroup(
  skinMat: THREE.Material,
  ulcerMat: THREE.Material,
  darkHoleMat: THREE.Material
): {
  group: THREE.Group;
  limbs: THREE.Group[];
  headGroup: THREE.Group;
} {
  const group = new THREE.Group();

  // 1. Hunched gaunt torso & ribcage
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), skinMat);
  torso.scale.set(0.95, 0.72, 1.65);
  torso.position.set(0, 0.42, 0);
  group.add(torso);

  // 2. Mercury ulcer patches along spine
  for (let i = 0; i < 3; i += 1) {
    const blister = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), ulcerMat);
    blister.position.set((i % 2 === 0 ? 1 : -1) * 0.08, 0.54, -0.2 + i * 0.2);
    group.add(blister);
  }

  // 3. Hairless skull-like head with sunken blind sockets & gaping jaw
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.48, 0.48);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 10), skinMat);
  skull.scale.set(0.86, 0.92, 1.12);
  headGroup.add(skull);

  for (const sx of [-0.06, 0.06]) {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.036, 6, 6), darkHoleMat);
    socket.position.set(sx, 0.03, 0.16);
    headGroup.add(socket);
  }
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.14), darkHoleMat);
  jaw.position.set(0, -0.09, 0.14);
  headGroup.add(jaw);
  group.add(headGroup);

  // 4-7. Four multi-segment crawling limbs
  const limbs: THREE.Group[] = [];
  const limbAnchors = [
    { x: -0.24, z: 0.28 },
    { x: 0.24, z: 0.28 },
    { x: -0.24, z: -0.28 },
    { x: 0.24, z: -0.28 },
  ];

  for (const anchor of limbAnchors) {
    const limb = new THREE.Group();
    limb.position.set(anchor.x, 0.42, anchor.z);

    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.42, 6), skinMat);
    upper.position.set(anchor.x < 0 ? -0.14 : 0.14, 0.06, 0);
    upper.rotation.z = anchor.x < 0 ? 1.0 : -1.0;

    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.02, 0.48, 6), ulcerMat);
    lower.position.set(anchor.x < 0 ? -0.32 : 0.32, -0.18, 0.06);
    lower.rotation.z = anchor.x < 0 ? -0.15 : 0.15;

    limb.add(upper, lower);
    group.add(limb);
    limbs.push(limb);
  }

  return { group, limbs, headGroup };
}

// Composite Stone Sarcophagus / Hiding Niche
function buildHidingSpotGroup(
  kind: 'coffin' | 'niche',
  stoneMat: THREE.Material,
  darkMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  if (kind === 'coffin') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.85, 2.45), stoneMat);
    base.position.y = 0.425;
    base.castShadow = true;
    base.receiveShadow = true;
    const hollow = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.35, 2.05), darkMat);
    hollow.position.y = 0.72;
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.2, 2.52), stoneMat);
    lid.position.set(0.28, 0.96, 0);
    lid.rotation.y = 0.12; // Slightly ajar stone lid leaving peeking slit!
    g.add(base, hollow, lid);
  } else {
    const archBack = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.35, 1.15), stoneMat);
    archBack.position.y = 1.175;
    const recess = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.95, 0.92), darkMat);
    recess.position.set(0, 1.0, 0.15);
    g.add(archBack, recess);
  }
  return g;
}

// Composite Bronze Crossbow Trap + Tripwire
function buildCrossbowTrapGroup(
  bronzeMat: THREE.Material,
  stoneMat: THREE.Material,
  wireMat: THREE.Material,
  halfWidth: number
): THREE.Group {
  const g = new THREE.Group();
  for (const sx of [-halfWidth, halfWidth]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.85, 0.32), stoneMat);
    post.position.set(sx, 0.425, 0);
    const prod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 6), bronzeMat);
    prod.rotation.z = Math.PI * 0.5;
    prod.position.set(sx, 0.78, 0);
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.5, 5), bronzeMat);
    bolt.rotation.z = Math.PI * 0.5;
    bolt.position.set(sx * 0.88, 0.78, 0);
    g.add(post, prod, bolt);
  }
  const wire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, halfWidth * 2, 4),
    wireMat
  );
  wire.rotation.z = Math.PI * 0.5;
  wire.position.y = 0.28;
  g.add(wire);
  return g;
}

export function mountTuanTangScene(
  mountEl: HTMLDivElement,
  callbacks: TuanTangSceneCallbacks
): TuanTangSceneController {
  const isSoftwareGl = detectSoftwareWebGL();
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: isSoftwareGl ? 'low-power' : 'high-performance',
    });
  } catch (err) {
    callbacks.onWebglError?.(err instanceof Error ? err.message : 'WebGL initialization failed');
    return { syncState: () => {}, dispose: () => {} };
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(mountEl.clientWidth || 960, mountEl.clientHeight || 540);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  mountEl.innerHTML = '';
  mountEl.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';

  const maxAniso = isSoftwareGl ? 1 : Math.min(4, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  const pitchBlack = new THREE.Color(0x020203);
  scene.background = pitchBlack.clone();
  const fog = new THREE.FogExp2(0x020203, 0.145);
  scene.fog = fog;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.14;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(
    72,
    (mountEl.clientWidth || 960) / (mountEl.clientHeight || 540),
    0.05,
    110
  );
  scene.add(camera);

  // Near-total darkness baseline (95% pitch black unless match is lit!)
  const hemiLight = new THREE.HemisphereLight(0x16222c, 0x050507, 0.055);
  scene.add(hemiLight);

  // Faint cold sliver of moonlight/surface air way up at the North Dome ventilation shaft
  const ventLight = new THREE.SpotLight(0xfff1d6, 0, 28, Math.PI / 5, 0.65, 1.2);
  ventLight.position.set(0, 15.5, -94.5);
  ventLight.target.position.set(0, 0, -90);
  scene.add(ventLight, ventLight.target);

  // Procedural Materials
  const stoneTex = createTombStoneTexture(false, maxAniso);
  const stoneBump = createTombStoneTexture(true, maxAniso);
  const mercuryTex = createMercuryTexture(maxAniso);
  const terraTex = createTerracottaTexture(maxAniso);

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    bumpMap: stoneBump,
    bumpScale: 0.08,
    roughness: 0.9,
    metalness: 0.05,
  });
  const darkStoneMat = new THREE.MeshStandardMaterial({
    color: 0x101014,
    roughness: 0.95,
    metalness: 0.05,
  });
  const terraMat = new THREE.MeshStandardMaterial({
    map: terraTex,
    roughness: 0.88,
    metalness: 0.06,
  });
  const darkClayMat = new THREE.MeshStandardMaterial({
    color: 0x362d27,
    roughness: 0.92,
    metalness: 0.08,
  });
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0x8f7241,
    roughness: 0.34,
    metalness: 0.85,
  });
  const tripwireMat = new THREE.MeshStandardMaterial({
    color: 0xc9a96e,
    roughness: 0.25,
    metalness: 0.9,
  });
  const mercuryMat = new THREE.MeshStandardMaterial({
    map: mercuryTex,
    color: 0xb7d1de,
    emissive: 0x163848,
    emissiveIntensity: 0.55,
    roughness: 0.12,
    metalness: 0.96,
  });
  const crawlerSkinMat = new THREE.MeshStandardMaterial({
    color: 0xc9c2b8,
    roughness: 0.72,
    metalness: 0.08,
  });
  const ulcerMat = new THREE.MeshStandardMaterial({
    color: 0x70262a,
    roughness: 0.48,
    metalness: 0.12,
  });
  const matchWoodMat = new THREE.MeshStandardMaterial({ color: 0x8c6d46, roughness: 0.85 });
  const flameGlowMat = new THREE.MeshBasicMaterial({ color: 0xffaa3b });
  const mudHandMat = new THREE.MeshStandardMaterial({
    color: 0x5d4c3e,
    roughness: 0.92,
    metalness: 0.04,
  });

  // Build Tomb Floor, Ceiling & Stone Walls
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 112), stoneMat);
  floor.rotation.x = -Math.PI * 0.5;
  floor.position.set(0, 0, -44);
  floor.receiveShadow = true;
  scene.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(26, 112), darkStoneMat);
  ceiling.rotation.x = Math.PI * 0.5;
  ceiling.position.set(0, 5.2, -44);
  scene.add(ceiling);

  // Initial static state reference to construct architecture
  const initSnap = { walls: [] as TuanTangGameState['walls'] };
  const builtWallsGroup = new THREE.Group();
  scene.add(builtWallsGroup);

  // Build North Dome Ascent Ramp & Ventilation Slit
  const domeGroup = new THREE.Group();
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.6, 10.5), stoneMat);
  ramp.position.set(0, 4.6, -90.5);
  ramp.rotation.x = 0.78;
  domeGroup.add(ramp);

  // Narrow horizontal sunlight slit high at the north wall
  const slitBacking = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.24, 0.3),
    new THREE.MeshBasicMaterial({ color: 0xfff7dc })
  );
  slitBacking.position.set(0, 11.4, -95.4);
  domeGroup.add(slitBacking);

  const godRayMat = new THREE.MeshBasicMaterial({
    color: 0xfff0c2,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const godRay = new THREE.Mesh(new THREE.ConeGeometry(2.8, 9.5, 16, 1, true), godRayMat);
  godRay.position.set(0, 7.6, -93.2);
  godRay.rotation.x = 0.35;
  domeGroup.add(godRay);
  scene.add(domeGroup);

  // First-person Viewmodel: Right hand Matchstick + PointLight & Two Mud-Covered Hands to clamp over mouth
  const matchHandGroup = new THREE.Group();
  const matchStick = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.14, 0.014), matchWoodMat);
  matchStick.position.set(0.24, -0.21, -0.42);
  matchStick.rotation.x = -0.3;
  const matchFlame = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), flameGlowMat);
  matchFlame.scale.set(0.75, 1.5, 0.75);
  matchFlame.position.set(0.24, -0.135, -0.44);
  matchFlame.visible = false;

  const matchLight = new THREE.PointLight(0xff8c2b, 0, 15.5, 1.7);
  matchLight.position.set(0.24, -0.1, -0.46);
  if (!isSoftwareGl) {
    matchLight.castShadow = true;
    matchLight.shadow.mapSize.set(512, 512);
    matchLight.shadow.bias = -0.002;
  }

  // Faint ember aura even when dark so immediate 1m silhouette isn't broken on WebGL
  const closeAuraLight = new THREE.PointLight(0x3a4a5e, 0.24, 3.2, 2);
  closeAuraLight.position.set(0, 0, -0.15);

  matchHandGroup.add(matchStick, matchFlame, matchLight, closeAuraLight);
  camera.add(matchHandGroup);

  // Mud-stained hands that rise to cover mouth & nose when Left Mouse Button is held
  const mouthHandsGroup = new THREE.Group();
  mouthHandsGroup.position.set(0, -0.55, -0.28);
  for (const sx of [-0.07, 0.07]) {
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.045), mudHandMat);
    palm.position.set(sx, 0, 0);
    palm.rotation.z = sx < 0 ? -0.25 : 0.25;
    mouthHandsGroup.add(palm);
    for (let f = 0; f < 4; f += 1) {
      const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.075, 5), mudHandMat);
      finger.position.set(sx * 0.55 + (f - 1.5) * 0.02, 0.09, -0.01);
      finger.rotation.x = 0.28;
      mouthHandsGroup.add(finger);
    }
  }
  camera.add(mouthHandsGroup);

  // Dropped rolling match ember for Uncut Death Scene
  const droppedEmber = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), flameGlowMat);
  const droppedLight = new THREE.PointLight(0xff551a, 0, 9, 1.6);
  droppedEmber.add(droppedLight);
  droppedEmber.visible = false;
  scene.add(droppedEmber);

  // Dynamic entity pools keyed by ID
  const statueMeshes = new Map<string, { group: THREE.Group; eyesGroup: THREE.Group }>();
  const crawlerMeshes = new Map<
    string,
    { group: THREE.Group; limbs: THREE.Group[]; headGroup: THREE.Group }
  >();
  const pickupMeshes = new Map<string, THREE.Mesh>();
  const trapMeshes = new Map<string, THREE.Group>();
  const mercuryMeshes: THREE.Mesh[] = [];
  let worldPopulated = false;

  // Desperate ending silhouette swarm pool
  const swarmGroup = new THREE.Group();
  swarmGroup.visible = false;
  for (let i = 0; i < 14; i += 1) {
    const cr = buildCrawlerGroup(crawlerSkinMat, ulcerMat, darkStoneMat);
    cr.group.position.set(((i % 5) - 2) * 1.4, (Math.floor(i / 5) * 2.1), -86 - (i % 4) * 1.6);
    cr.group.rotation.x = -0.85;
    swarmGroup.add(cr.group);
  }
  scene.add(swarmGroup);

  let latestState: TuanTangGameState | null = null;
  let isGamePlaying = false;
  let frameId = 0;
  let disposed = false;
  const clock = new THREE.Clock();

  function populateWorldOnce(state: TuanTangGameState) {
    if (worldPopulated) return;
    worldPopulated = true;
    initSnap.walls = state.walls;

    for (const w of state.walls) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w.xMax - w.xMin, w.yMax, w.zMax - w.zMin),
        stoneMat
      );
      mesh.position.set((w.xMin + w.xMax) * 0.5, w.yMax * 0.5, (w.zMin + w.zMax) * 0.5);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      builtWallsGroup.add(mesh);
    }

    for (const r of state.mercuryRivers) {
      const mMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(r.xMax - r.xMin, r.zMax - r.zMin),
        mercuryMat
      );
      mMesh.rotation.x = -Math.PI * 0.5;
      mMesh.position.set((r.xMin + r.xMax) * 0.5, 0.03, (r.zMin + r.zMax) * 0.5);
      scene.add(mMesh);
      mercuryMeshes.push(mMesh);

      if (r.hasBridge) {
        const bridge = new THREE.Mesh(
          new THREE.BoxGeometry(r.bridgeXMax - r.bridgeXMin, 0.24, r.zMax - r.zMin + 0.6),
          stoneMat
        );
        bridge.position.set((r.bridgeXMin + r.bridgeXMax) * 0.5, 0.12, (r.zMin + r.zMax) * 0.5);
        bridge.receiveShadow = true;
        scene.add(bridge);
      }
    }

    for (const spot of state.hidingSpots) {
      const hg = buildHidingSpotGroup(spot.kind, stoneMat, darkStoneMat);
      hg.position.set(spot.x, spot.y, spot.z);
      hg.rotation.y = spot.peekYaw;
      scene.add(hg);
    }

    for (const t of state.traps) {
      const tg = buildCrossbowTrapGroup(bronzeMat, stoneMat, tripwireMat, t.halfWidth);
      tg.position.set(t.x, 0, t.z);
      scene.add(tg);
      trapMeshes.set(t.id, tg);
    }

    for (const p of state.matchPickups) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.08, 0.16),
        new THREE.MeshStandardMaterial({ color: 0xb54b38, roughness: 0.7 })
      );
      box.position.set(p.x, 0.08, p.z);
      scene.add(box);
      pickupMeshes.set(p.id, box);
    }

    for (const s of state.statues) {
      const built = buildTerracottaWarriorGroup(terraMat, darkClayMat, bronzeMat, s.isMimic);
      built.group.position.set(s.x, s.y, s.z);
      built.group.rotation.y = s.yaw;
      built.group.scale.setScalar(s.scale);
      scene.add(built.group);
      statueMeshes.set(s.id, built);
    }

    for (const c of state.crawlers) {
      const built = buildCrawlerGroup(crawlerSkinMat, ulcerMat, darkStoneMat);
      built.group.position.set(c.x, c.y, c.z);
      scene.add(built.group);
      crawlerMeshes.set(c.id, built);
    }
  }

  function afterDraw(cb: () => void) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (disposed) return;
      const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (status === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  const euler = new THREE.Euler(0, 0, 0, 'YXZ');

  function renderTick() {
    if (disposed) return;
    const dt = Math.min(0.06, clock.getDelta());
    const t = clock.getElapsedTime();

    if (latestState) {
      const st = latestState;

      // Animate flowing liquid mercury texture
      mercuryTex.offset.x = (t * 0.08) % 1;

      // Match flicker & darkness control
      if (st.matchLit) {
        const flicker = 1 + Math.sin(t * 26) * 0.14 + Math.cos(t * 41) * 0.1;
        matchLight.intensity = 4.8 * flicker;
        matchFlame.visible = true;
        matchFlame.scale.set(0.75 * flicker, 1.45 * flicker, 0.75 * flicker);
        fog.density = 0.082;
      } else {
        matchLight.intensity = 0;
        matchFlame.visible = false;
        fog.density = st.hidingSpotId ? 0.19 : 0.145;
      }

      // Mud-stained hands rise up to clamp over mouth/nose
      const targetHandY = st.holdingMouth ? -0.1 : -0.55;
      mouthHandsGroup.position.y = THREE.MathUtils.damp(
        mouthHandsGroup.position.y,
        targetHandY,
        14,
        dt
      );
      matchHandGroup.visible = !st.hidingSpotId && st.ending === 'none';

      // Vent slit sunlight intensity increases as player enters north dome
      const nearDome = st.playerZ < -72 || st.ending === 'desperate_slit';
      ventLight.intensity = st.ending === 'desperate_slit' ? 18.0 : nearDome ? 4.5 : 0.4;
      godRayMat.opacity = st.ending === 'desperate_slit' ? 0.36 : nearDome ? 0.16 : 0.04;

      // Pickups visibility
      for (const p of st.matchPickups) {
        const mesh = pickupMeshes.get(p.id);
        if (mesh) mesh.visible = !p.collected;
      }

      // Sync Terracotta Warriors & Living Mimics
      for (const s of st.statues as TerracottaStatueEntity[]) {
        const m = statueMeshes.get(s.id);
        if (!m) continue;
        m.group.position.set(s.x, s.y, s.z);
        m.group.rotation.y = s.yaw;
        m.eyesGroup.visible = s.isMimic && s.awake;
      }

      // Sync Blind Crawlers
      for (const c of st.crawlers as CrawlerEntity[]) {
        const m = crawlerMeshes.get(c.id);
        if (!m) continue;
        m.group.position.set(c.x, c.y, c.z);
        m.group.rotation.y = c.yaw;
        m.group.rotation.x = c.onCeiling ? Math.PI : 0;
        for (let i = 0; i < m.limbs.length; i += 1) {
          m.limbs[i].rotation.x = Math.sin(c.limbPhase + i * 1.55) * 0.45;
        }
        if (c.mode === 'sniffing_slit') {
          m.headGroup.rotation.z = Math.sin(t * 7) * 0.14;
        } else {
          m.headGroup.rotation.z = 0;
        }
      }

      // Camera Choreography: Normal FPS vs Uncut Death vs Desperate Slit Ending
      if (st.ending === 'desperate_slit') {
        swarmGroup.visible = true;
        swarmGroup.position.y = Math.min(8.2, st.endingTimer * 1.15);
        camera.position.set(0, 10.6, -93.8);
        euler.set(0.32 + Math.sin(t * 2.5) * 0.03, 0, Math.sin(t * 1.7) * 0.03);
        camera.quaternion.setFromEuler(euler);
        mouthHandsGroup.position.y = -0.14; // Reaching mud-stained hands toward sunlight
        mouthHandsGroup.position.z = -0.36;
      } else if (st.ending !== 'none') {
        // UNCUT FIRST-PERSON DEATH: Dragged backwards across stone floor while dropped match flickers
        swarmGroup.visible = false;
        const dp = st.deathTimer;
        const dragBack = Math.min(4.5, dp * 1.45);
        camera.position.set(
          st.playerX + Math.sin(dp * 12) * 0.14,
          0.32 + Math.abs(Math.sin(dp * 18)) * 0.08,
          st.playerZ + dragBack
        );
        euler.set(0.28 + Math.sin(dp * 9) * 0.08, st.yaw + Math.sin(dp * 6) * 0.2, 0.36 * Math.sin(dp * 5));
        camera.quaternion.setFromEuler(euler);

        droppedEmber.visible = true;
        droppedEmber.position.set(
          st.playerX + 0.35 + Math.sin(dp * 2) * 0.25,
          0.06,
          st.playerZ + dragBack - 0.95
        );
        droppedLight.intensity = dp < 3.4 ? 3.2 * (0.5 + 0.5 * Math.sin(t * 32)) : 0;
      } else {
        swarmGroup.visible = false;
        droppedEmber.visible = false;
        const baseEyeY = st.hidingSpotId
          ? 0.92
          : st.playerY + (st.crouching ? 0.96 : 1.62);
        const bob =
          isGamePlaying && !st.hidingSpotId
            ? Math.sin(st.stepPhase * Math.PI * 2) * (st.sprinting ? 0.065 : 0.03)
            : 0;
        const coughShake = st.coughActive && !st.holdingMouth ? Math.sin(t * 42) * 0.045 : 0;
        const toxRoll = (st.mercuryToxicity / 100) * Math.sin(t * 1.6) * 0.025;

        camera.position.set(st.playerX + coughShake, baseEyeY + bob, st.playerZ);
        euler.set(st.pitch + coughShake * 0.6, st.yaw, toxRoll);
        camera.quaternion.setFromEuler(euler);
      }
    }

    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(renderTick);
    } else {
      frameId = requestAnimationFrame(renderTick);
    }
  }

  const handleResize = () => {
    if (disposed) return;
    const w = mountEl.clientWidth || 960;
    const h = mountEl.clientHeight || 540;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', handleResize);

  frameId = requestAnimationFrame(renderTick);

  return {
    syncState(state: TuanTangGameState, isPlaying: boolean) {
      populateWorldOnce(state);
      latestState = state;
      isGamePlaying = isPlaying;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      stoneTex.dispose();
      stoneBump.dispose();
      mercuryTex.dispose();
      terraTex.dispose();
      renderer.dispose();
    },
  };
}
