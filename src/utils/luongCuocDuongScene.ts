import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  AbacusState,
  CellarGameState,
  computeScaleTiltNormalized,
  getDayScript,
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

function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    const isSoft = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
    const loseExt = gl.getExtension('WEBGL_lose_context');
    loseExt?.loseContext();
    return isSoft;
  } catch {
    return true;
  }
}

function createWoodTexture(isBump: boolean, maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = isBump ? '#808080' : '#3a2618';
  ctx.fillRect(0, 0, 256, 256);

  // Plank seams & grain streaks (PS1 low-res wood look)
  for (let p = 0; p < 4; p += 1) {
    const y0 = p * 64;
    ctx.fillStyle = isBump ? '#3a3a3a' : '#1b1009';
    ctx.fillRect(0, y0, 256, 3);
    for (let i = 0; i < 42; i += 1) {
      const y = y0 + 4 + ((i * 17) % 58);
      const tone = isBump
        ? 110 + ((i * 23) % 55)
        : 42 + ((i * 19 + p * 7) % 24);
      ctx.fillStyle = isBump
        ? `rgb(${tone},${tone},${tone})`
        : `rgb(${tone + 14},${tone},${Math.max(12, tone - 14)})`;
      ctx.fillRect(0, y, 256, 1 + (i % 2));
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = maxAniso;
  if (!isBump) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  return tex;
}

function createStoneTexture(isBump: boolean, maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = isBump ? '#6c6c6c' : '#232022';
  ctx.fillRect(0, 0, 256, 256);

  const rows = 6;
  const rowH = 256 / rows;
  for (let r = 0; r < rows; r += 1) {
    const y = r * rowH;
    const offset = (r % 2) * 32;
    for (let c = -1; c < 5; c += 1) {
      const x = c * 64 + offset;
      const shade = 30 + (((r * 7 + c * 13) & 15) * 2);
      ctx.fillStyle = isBump
        ? `rgb(${105 + (shade % 40)},${105 + (shade % 40)},${105 + (shade % 40)})`
        : `rgb(${shade + 4},${shade + 2},${shade + 5})`;
      ctx.fillRect(x + 2, y + 2, 60, rowH - 4);
    }
  }

  // Damp moss patches
  if (!isBump) {
    ctx.fillStyle = 'rgba(26, 38, 25, 0.25)';
    ctx.fillRect(16, 150, 70, 90);
    ctx.fillRect(165, 180, 65, 70);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.anisotropy = maxAniso;
  if (!isBump) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  return tex;
}

function createParchmentTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#c8b48c';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle fiber mottling
  for (let i = 0; i < 180; i += 1) {
    const x = (i * 53) % 256;
    const y = (i * 97) % 256;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(92, 68, 42, 0.08)' : 'rgba(235, 220, 185, 0.08)';
    ctx.fillRect(x, y, 10, 4);
  }

  // Ink ledger lines & archaic columns
  ctx.strokeStyle = 'rgba(42, 30, 22, 0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, 220, 220);
  for (let x = 58; x <= 208; x += 38) {
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, 238);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(32, 22, 16, 0.72)';
  ctx.font = 'bold 18px serif';
  ctx.fillText('糧 倉 簿', 78, 52);
  ctx.fillRect(36, 76, 16, 8);
  ctx.fillRect(74, 92, 18, 8);
  ctx.fillRect(112, 108, 14, 8);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = maxAniso;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBloodStainTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 128, 128);

  const patches = [
    { x: 56, y: 62, r: 28, a: 0.65 },
    { x: 78, y: 50, r: 18, a: 0.55 },
    { x: 40, y: 78, r: 15, a: 0.5 },
    { x: 86, y: 80, r: 10, a: 0.45 },
    { x: 28, y: 52, r: 7, a: 0.4 },
  ];
  for (const p of patches) {
    const grad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.r);
    grad.addColorStop(0, `rgba(68, 7, 7, ${p.a})`);
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

export function mountCellarScene(
  mountEl: HTMLDivElement,
  callbacks: CellarSceneCallbacks
): CellarSceneController {
  const isSoftwareGl = detectSoftwareWebGL();
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: isSoftwareGl ? 'low-power' : 'high-performance',
    });
  } catch (err) {
    callbacks.onWebglError?.(err instanceof Error ? err.message : 'WebGL initialization failed');
    return {
      syncState: () => {},
      triggerFX: () => {},
      dispose: () => {},
    };
  }

  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(mountEl.clientWidth || 960, mountEl.clientHeight || 540);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
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
  const darkBg = new THREE.Color(0x060405);
  const brightBg = new THREE.Color(0xd9cdb2);
  scene.background = darkBg.clone();
  const fog = new THREE.FogExp2(0x060405, 0.135);
  scene.fog = fog;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.22;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(
    58,
    (mountEl.clientWidth || 960) / (mountEl.clientHeight || 540),
    0.1,
    30
  );
  const baseCamPos = new THREE.Vector3(0, 1.12, 1.74);
  const baseLookAt = new THREE.Vector3(0, 0.34, -0.36);
  camera.position.copy(baseCamPos);
  camera.lookAt(baseLookAt);

  // Lighting
  const hemiLight = new THREE.HemisphereLight(0x4f6285, 0x1a120d, 0.42);
  scene.add(hemiLight);

  const lampLight = new THREE.PointLight(0xff9c42, 4.8, 7.5, 1.4);
  lampLight.position.set(-0.78, 0.44, -0.32);
  if (!isSoftwareGl) {
    lampLight.castShadow = true;
    lampLight.shadow.mapSize.set(1024, 1024);
    lampLight.shadow.bias = -0.0005;
  }
  scene.add(lampLight);

  const ventLight = new THREE.SpotLight(0x88a4cc, 1.9, 6.5, Math.PI / 5, 0.65, 1.5);
  ventLight.position.set(1.45, 1.65, -0.9);
  ventLight.target.position.set(0.25, 0.1, -0.2);
  scene.add(ventLight);
  scene.add(ventLight.target);

  const liberationSun = new THREE.DirectionalLight(0xfff1cf, 0);
  liberationSun.position.set(-2.5, 1.5, 0.4);
  scene.add(liberationSun);

  // Shared Textures & Materials
  const woodMap = createWoodTexture(false, maxAniso);
  const woodBump = createWoodTexture(true, maxAniso);
  const stoneMap = createStoneTexture(false, maxAniso);
  const stoneBump = createStoneTexture(true, maxAniso);
  const parchmentMap = createParchmentTexture(maxAniso);
  const bloodMap = createBloodStainTexture(maxAniso);

  const deskWoodMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: woodMap,
    bumpMap: woodBump,
    bumpScale: 0.02,
    roughness: 0.78,
    metalness: 0.04,
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x2a1810,
    roughness: 0.68,
    metalness: 0.06,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: stoneMap,
    bumpMap: stoneBump,
    bumpScale: 0.035,
    roughness: 0.92,
    metalness: 0.02,
  });
  const rustedIronMat = new THREE.MeshStandardMaterial({
    color: 0x353234,
    roughness: 0.62,
    metalness: 0.72,
  });
  const agedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xb58b42,
    roughness: 0.34,
    metalness: 0.78,
  });
  const crimsonWaxMat = new THREE.MeshStandardMaterial({
    color: 0x8f1414,
    roughness: 0.16,
    metalness: 0.05,
  });
  const bloodStainMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: bloodMap,
    roughness: 0.94,
    metalness: 0.0,
    transparent: true,
    opacity: 0,
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
    ],
    textures: [woodMap, woodBump, stoneMap, stoneBump, parchmentMap, bloodMap],
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
  const registerHitProxy = (group: THREE.Group, propId: CellarPropId, size: [number, number, number], offset: [number, number, number] = [0, 0, 0]) => {
    const proxyMat = trackMat(
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    const proxy = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(...size)), proxyMat);
    proxy.position.set(...offset);
    proxy.userData.propId = propId;
    group.add(proxy);
    interactables.push(proxy);
  };

  // --- Cellar Architecture (Enclosed Stone Room) ---
  const roomGroup = new THREE.Group();
  const floor = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(7, 6)), stoneMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.78;
  floor.receiveShadow = true;
  roomGroup.add(floor);

  const backWall = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(7, 4)), stoneMat);
  backWall.position.set(0, 1.1, -1.65);
  backWall.receiveShadow = true;
  roomGroup.add(backWall);

  const leftWall = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(6, 4)), stoneMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-2.35, 1.1, 0.4);
  leftWall.receiveShadow = true;
  roomGroup.add(leftWall);

  const rightWall = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(6, 4)), stoneMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(2.35, 1.1, 0.4);
  rightWall.receiveShadow = true;
  roomGroup.add(rightWall);

  // Ceiling timber beams
  for (let bx = -1.6; bx <= 1.6; bx += 1.05) {
    const beam = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.22, 4.8)), darkWoodMat);
    beam.position.set(bx, 2.38, -0.1);
    roomGroup.add(beam);
  }
  scene.add(roomGroup);

  // --- Wooden Inspection Desk (Multi-part) ---
  const deskGroup = new THREE.Group();
  const deskTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.55, 0.09, 1.25)), deskWoodMat);
  deskTop.position.set(0, -0.045, -0.15);
  deskTop.receiveShadow = true;
  deskTop.castShadow = true;
  deskGroup.add(deskTop);

  const deskApron = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.38, 0.14, 1.08)), darkWoodMat);
  deskApron.position.set(0, -0.15, -0.15);
  deskGroup.add(deskApron);

  for (const lx of [-1.1, 1.1]) {
    for (const lz of [-0.62, 0.34]) {
      const leg = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.12, 0.65, 0.12)), darkWoodMat);
      leg.position.set(lx, -0.46, lz);
      deskGroup.add(leg);
    }
  }

  // Phase 3 organic blood stain decal near pulley drop zone
  const bloodSmear = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.46, 0.42)), bloodStainMat);
  bloodSmear.rotation.x = -Math.PI / 2;
  bloodSmear.position.set(-0.32, 0.004, -0.36);
  deskGroup.add(bloodSmear);
  scene.add(deskGroup);

  // --- 1. Oil Lamp ('lamp') ---
  const lampGroup = new THREE.Group();
  lampGroup.position.set(-0.82, 0, -0.32);
  const lampBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.14, 0.06, 12)), agedBrassMat);
  lampBase.position.y = 0.03;
  lampGroup.add(lampBase);

  const lampBowl = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.11, 12, 8)), agedBrassMat);
  lampBowl.scale.set(1, 0.65, 1);
  lampBowl.position.y = 0.11;
  lampGroup.add(lampBowl);

  const lampSpout = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.018, 0.032, 0.11, 8)), agedBrassMat);
  lampSpout.rotation.z = -Math.PI / 3;
  lampSpout.position.set(0.11, 0.14, 0);
  lampGroup.add(lampSpout);

  const lampHandle = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.06, 0.012, 6, 12, Math.PI)), rustedIronMat);
  lampHandle.rotation.z = Math.PI / 2;
  lampHandle.position.set(-0.11, 0.12, 0);
  lampGroup.add(lampHandle);

  const flameMat = trackMat(
    new THREE.MeshBasicMaterial({ color: 0xffb347 })
  );
  const lampFlame = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.026, 0.085, 8)), flameMat);
  lampFlame.position.set(0.14, 0.2, 0);
  lampGroup.add(lampFlame);

  const flameCore = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.016, 8, 6)),
    trackMat(new THREE.MeshBasicMaterial({ color: 0xfff3c4 }))
  );
  flameCore.position.set(0.14, 0.175, 0);
  lampGroup.add(flameCore);

  registerHitProxy(lampGroup, 'lamp', [0.34, 0.34, 0.34], [0.02, 0.16, 0]);
  scene.add(lampGroup);

  // --- 2. Brass Balance Scale ('scale') ---
  const scaleGroup = new THREE.Group();
  scaleGroup.position.set(-0.34, 0, -0.22);

  const scalePlinth = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.04, 0.16)), darkWoodMat);
  scalePlinth.position.y = 0.02;
  scaleGroup.add(scalePlinth);

  const scalePost = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.018, 0.026, 0.36, 10)), agedBrassMat);
  scalePost.position.y = 0.22;
  scaleGroup.add(scalePost);

  const scaleFinial = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.032, 0)), agedBrassMat);
  scaleFinial.position.y = 0.41;
  scaleGroup.add(scaleFinial);

  const scaleBeamPivot = new THREE.Group();
  scaleBeamPivot.position.y = 0.37;
  const scaleBeam = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.56, 0.018, 0.022)), agedBrassMat);
  scaleBeamPivot.add(scaleBeam);

  const leftPanGroup = new THREE.Group();
  leftPanGroup.position.set(-0.25, -0.18, 0);
  const leftPanDish = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.08, 0.02, 12)), agedBrassMat);
  leftPanGroup.add(leftPanDish);
  const leftCord = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.004, 0.004, 0.18, 6)), rustedIronMat);
  leftCord.position.y = 0.09;
  leftPanGroup.add(leftCord);

  // Visual parcel sitting on left pan when placed
  const scaleParcelMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x9b825e, roughness: 0.88, metalness: 0.02 })
  );
  const scaleParcelMesh = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.068, 0)), scaleParcelMat);
  scaleParcelMesh.scale.set(1.15, 0.78, 0.95);
  scaleParcelMesh.position.y = 0.055;
  scaleParcelMesh.visible = false;
  leftPanGroup.add(scaleParcelMesh);
  scaleBeamPivot.add(leftPanGroup);

  const rightPanGroup = new THREE.Group();
  rightPanGroup.position.set(0.25, -0.18, 0);
  const rightPanDish = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.08, 0.02, 12)), agedBrassMat);
  rightPanGroup.add(rightPanDish);
  const rightCord = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.004, 0.004, 0.18, 6)), rustedIronMat);
  rightCord.position.y = 0.09;
  rightPanGroup.add(rightCord);

  // Up to 8 visible brass counterweight cylinders on right pan
  const weightMeshes: THREE.Mesh[] = [];
  for (let w = 0; w < 8; w += 1) {
    const wm = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.022, 0.025, 0.032, 8)), agedBrassMat);
    const angle = (w / 8) * Math.PI * 2;
    wm.position.set(Math.cos(angle) * 0.042, 0.025 + Math.floor(w / 4) * 0.034, Math.sin(angle) * 0.042);
    wm.visible = false;
    rightPanGroup.add(wm);
    weightMeshes.push(wm);
  }
  scaleBeamPivot.add(rightPanGroup);
  scaleGroup.add(scaleBeamPivot);

  registerHitProxy(scaleGroup, 'scale', [0.64, 0.48, 0.28], [0, 0.24, 0]);
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
    new THREE.MeshStandardMaterial({ color: 0x6f391b, roughness: 0.45, metalness: 0.08 })
  );
  const beadGeo = trackGeo(new THREE.SphereGeometry(0.021, 10, 8));
  const heavenBeadMeshes: THREE.Mesh[] = [];
  const earthBeadMeshes: THREE.Mesh[][] = [];

  const rodXPositions = [-0.11, 0, 0.11];
  for (let r = 0; r < 3; r += 1) {
    const rx = rodXPositions[r];
    const rod = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.005, 0.005, 0.24, 6)), agedBrassMat);
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
  const stampMarkMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.085, 0.004, 0.085)), stampMarkMat);
  stampMarkMesh.position.set(0.07, 0.006, 0.12);
  stampMarkMesh.visible = false;
  ledgerGroup.add(stampMarkMesh);

  registerHitProxy(ledgerGroup, 'ledger', [0.42, 0.08, 0.48], [0, 0.03, 0]);
  scene.add(ledgerGroup);

  // --- 5. Crimson Ink Pad ('inkpad') & Vermilion Seal ('seal') ---
  const inkpadGroup = new THREE.Group();
  inkpadGroup.position.set(0.45, 0, -0.34);
  const inkBox = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.085, 0.09, 0.036, 12)), darkWoodMat);
  inkBox.position.y = 0.018;
  inkpadGroup.add(inkBox);
  const inkPaste = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.068, 0.068, 0.014, 12)), crimsonWaxMat);
  inkPaste.position.y = 0.036;
  inkpadGroup.add(inkPaste);
  registerHitProxy(inkpadGroup, 'inkpad', [0.22, 0.14, 0.22], [0, 0.04, 0]);
  scene.add(inkpadGroup);

  const sealGroup = new THREE.Group();
  const sealRestPos = new THREE.Vector3(0.32, 0, -0.18);
  sealGroup.position.copy(sealRestPos);
  const sealMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xd9cbb0, roughness: 0.35, metalness: 0.06 })
  );
  const sealBlock = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.072, 0.095, 0.072)), sealMat);
  sealBlock.position.y = 0.048;
  sealGroup.add(sealBlock);
  const sealKnob = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.026, 8, 8)), agedBrassMat);
  sealKnob.position.y = 0.11;
  sealGroup.add(sealKnob);
  const sealTip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.074, 0.012, 0.074)), crimsonWaxMat);
  sealTip.position.y = 0.006;
  sealTip.visible = false;
  sealGroup.add(sealTip);
  registerHitProxy(sealGroup, 'seal', [0.16, 0.18, 0.16], [0, 0.07, 0]);
  scene.add(sealGroup);

  // --- 6. Stone Washbasin with Ghost Reflection ('washbasin') ---
  const basinGroup = new THREE.Group();
  basinGroup.position.set(-0.76, 0, 0.18);
  const basinRim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.145, 0.028, 8, 16)), stoneMat);
  basinRim.rotation.x = Math.PI / 2;
  basinRim.position.y = 0.07;
  basinGroup.add(basinRim);

  const basinWall = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.155, 0.12, 0.075, 14)), stoneMat);
  basinWall.position.y = 0.038;
  basinGroup.add(basinWall);

  const waterMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x0b1218,
      roughness: 0.08,
      metalness: 0.52,
    })
  );
  const waterDisc = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.132, 16)), waterMat);
  waterDisc.rotation.x = -Math.PI / 2;
  waterDisc.position.y = 0.062;
  basinGroup.add(waterDisc);

  // Ghostly silhouettes reflected inside water
  const ghostMat = trackMat(
    new THREE.MeshBasicMaterial({ color: 0xb9c4cf, transparent: true, opacity: 0 })
  );
  const ghostCluster = new THREE.Group();
  ghostCluster.position.y = 0.065;
  for (let g = 0; g < 4; g += 1) {
    const gx = (g - 1.5) * 0.042;
    const gz = (g % 2 === 0 ? -0.02 : 0.015);
    const head = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.016, 8)), ghostMat);
    head.rotation.x = -Math.PI / 2;
    head.position.set(gx, 0, gz - 0.02);
    ghostCluster.add(head);
    const torso = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.028, 0.055)), ghostMat);
    torso.rotation.x = -Math.PI / 2;
    torso.position.set(gx, 0, gz + 0.018);
    ghostCluster.add(torso);
  }
  basinGroup.add(ghostCluster);
  registerHitProxy(basinGroup, 'washbasin', [0.34, 0.16, 0.34], [0, 0.06, 0]);
  scene.add(basinGroup);

  // --- 7. Iron Pulley & Rope Basket ('pulley') ---
  const pulleyAnchor = new THREE.Group();
  pulleyAnchor.position.set(-0.32, 0, -0.78);
  const pulleyWheel = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.14, 0.025, 8, 14)), rustedIronMat);
  pulleyWheel.position.set(0, 1.38, 0);
  pulleyAnchor.add(pulleyWheel);

  const pulleyRope = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.012, 0.012, 1.6, 6)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x6f5a3f, roughness: 0.92 }))
  );
  pulleyRope.position.set(0, 1.15, 0);
  pulleyAnchor.add(pulleyRope);

  const pulleyBasket = new THREE.Group();
  pulleyBasket.position.set(0, 0.88, 0);
  const basketTray = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.22, 0.17, 0.075, 10)), darkWoodMat);
  pulleyBasket.add(basketTray);
  const basketParcelMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x8f7752, roughness: 0.9, metalness: 0.02 })
  );
  const basketParcel = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.13, 0)), basketParcelMat);
  basketParcel.scale.set(1.18, 0.8, 0.98);
  basketParcel.position.y = 0.1;
  pulleyBasket.add(basketParcel);
  pulleyAnchor.add(pulleyBasket);

  registerHitProxy(pulleyAnchor, 'pulley', [0.56, 1.3, 0.56], [0, 0.65, 0]);
  scene.add(pulleyAnchor);

  // --- 8. Heavy Iron Cellar Door ('door') ---
  const doorGroup = new THREE.Group();
  doorGroup.position.set(-2.31, 0.35, -0.45);
  doorGroup.rotation.y = Math.PI / 2;

  const doorJambL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 2.15, 0.16)), stoneMat);
  doorJambL.position.set(-0.52, 0, 0);
  doorGroup.add(doorJambL);
  const doorJambR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 2.15, 0.16)), stoneMat);
  doorJambR.position.set(0.52, 0, 0);
  doorGroup.add(doorJambR);

  const doorLeaf = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.92, 2.02, 0.08)), rustedIronMat);
  doorGroup.add(doorLeaf);
  const doorBar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.96, 0.08, 0.12)), darkWoodMat);
  doorBar.position.set(0, -0.05, 0.04);
  doorGroup.add(doorBar);

  registerHitProxy(doorGroup, 'door', [1.1, 2.1, 0.35], [0, 0, 0]);
  scene.add(doorGroup);

  // --- 9. High Barred Air Vent ('vent') ---
  const ventGroup = new THREE.Group();
  ventGroup.position.set(1.02, 0.96, -1.58);

  const ventFrame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.76, 0.44, 0.08)), stoneMat);
  ventFrame.position.z = -0.02;
  ventGroup.add(ventFrame);

  const ventOpening = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.64, 0.34)),
    trackMat(new THREE.MeshBasicMaterial({ color: 0x3b4e69 }))
  );
  ventOpening.position.z = 0.022;
  ventGroup.add(ventOpening);

  for (let b = -2; b <= 2; b += 1) {
    const bar = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6)), rustedIronMat);
    bar.position.set(b * 0.12, 0, 0.04);
    ventGroup.add(bar);
  }

  // NPC silhouette peeking at vent
  const npcSilhouette = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.105, 8, 8)),
    trackMat(new THREE.MeshBasicMaterial({ color: 0x070607 }))
  );
  npcSilhouette.position.set(0.05, -0.04, 0.032);
  npcSilhouette.visible = false;
  ventGroup.add(npcSilhouette);

  registerHitProxy(ventGroup, 'vent', [0.78, 0.46, 0.3], [0, 0, 0.05]);
  scene.add(ventGroup);

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
  let lastLampBurn = 0;
  let liberationBlend = 0;

  const updateAbacusMeshes = (abacus: AbacusState, dt: number) => {
    const k = 1 - Math.exp(-14 * dt);
    for (let r = 0; r < 3; r += 1) {
      const rod = abacus[r];
      const hTargetY = rod.heaven ? 0.072 : 0.105;
      heavenBeadMeshes[r].position.y += (hTargetY - heavenBeadMeshes[r].position.y) * k;

      for (let e = 0; e < 4; e += 1) {
        const beadIdxFromTop = 3 - e; // e=3 is topmost earth bead
        const isUp = beadIdxFromTop < rod.earth;
        const targetY = isUp ? 0.021 - beadIdxFromTop * 0.025 : -0.102 + e * 0.024;
        earthBeadMeshes[r][e].position.y += (targetY - earthBeadMeshes[r][e].position.y) * k;
      }
    }
  };

  const applyStateToMeshes = (state: CellarGameState) => {
    const script = getDayScript(state.day);
    scaleParcelMesh.visible = state.parcelOnScale;
    scaleParcelMat.color.setHex(
      state.phase === 3 ? 0x5c1919 : state.phase === 2 ? 0x4f4739 : 0x9b825e
    );

    basketParcelMat.color.setHex(
      state.phase === 3 ? 0x621616 : state.phase === 2 ? 0x4c4637 : 0x9b825e
    );
    basketParcel.visible = !state.parcelOnScale && state.stampedDecision === null;

    for (let i = 0; i < weightMeshes.length; i += 1) {
      weightMeshes[i].visible = i < state.scaleWeights.length;
    }

    sealTip.visible = state.sealInked;
    stampMarkMesh.visible = state.stampedDecision !== null;
    stampMarkMat.color.setHex(state.stampedDecision === 'approved' ? 0xa81616 : 0x262626);

    bloodStainMat.opacity = state.phase === 3 ? 0.85 : state.phase === 2 ? 0.25 : 0;

    npcSilhouette.visible = Boolean(script.ventEncounter && !state.ventHandled);
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

  const onContextLost = (e: Event) => {
    e.preventDefault();
  };

  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  window.addEventListener('resize', onResize);

  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(mountEl);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  let disposed = false;
  let rafId = 0;
  let timeoutId: number | null = null;
  let prevTime = performance.now();
  let elapsed = 0;

  const afterDraw = (fn: () => void) => {
    if (disposed) return;
    const gl = renderer.getContext();
    const gl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext ? gl : null;
    if (gl2) {
      const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl2.flush();
      const poll = () => {
        if (disposed) return;
        const status = sync ? gl2.clientWaitSync(sync, 0, 0) : gl2.ALREADY_SIGNALED;
        if (status === gl2.TIMEOUT_EXPIRED) {
          timeoutId = window.setTimeout(poll, 16);
          return;
        }
        if (sync) gl2.deleteSync(sync);
        timeoutId = window.setTimeout(() => {
          if (!disposed) rafId = requestAnimationFrame(fn);
        }, 80);
      };
      poll();
    } else {
      timeoutId = window.setTimeout(() => {
        if (!disposed) rafId = requestAnimationFrame(fn);
      }, 80);
    }
  };

  const tick = () => {
    if (disposed) return;
    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - prevTime) / 1000));
    prevTime = now;
    elapsed += dt;

    // Flickering oil lamp
    const st = activeState;
    const isLit = st ? st.lampLit : true;
    const oilFactor = st ? Math.max(0.25, st.lampOil / 100) : 0.8;
    const isLib = st?.ending === 'historical_liberation';

    if (isLib) {
      liberationBlend = Math.min(1, liberationBlend + dt * 0.75);
      liberationSun.intensity = liberationBlend * 4.2;
      hemiLight.intensity = 0.42 + liberationBlend * 2.1;
      (scene.background as THREE.Color).lerpColors(darkBg, brightBg, liberationBlend);
      fog.color.copy(scene.background as THREE.Color);
      fog.density = 0.135 * (1 - liberationBlend * 0.75);
      doorGroup.rotation.y = Math.PI / 2 - liberationBlend * 1.15;
    } else {
      liberationBlend = 0;
      liberationSun.intensity = 0;
      hemiLight.intensity = isLit ? 0.42 : 0.1;
      (scene.background as THREE.Color).copy(darkBg);
      fog.color.copy(darkBg);
      fog.density = isLit ? 0.135 : 0.24;
      doorGroup.rotation.y = Math.PI / 2;
    }

    if (isLit) {
      const flicker =
        Math.sin(elapsed * 9.5) * 0.22 +
        Math.sin(elapsed * 23.1) * 0.11 +
        Math.cos(elapsed * 4.3) * 0.16;
      const targetIntensity = (3.8 + oilFactor * 1.7 + flicker) * (playingMode ? 1 : 0.78);
      lampLight.intensity += (targetIntensity - lampLight.intensity) * (1 - Math.exp(-12 * dt));
      lampFlame.visible = true;
      flameCore.visible = true;
      const flameScale = 0.75 + oilFactor * 0.45 + flicker * 0.12;
      lampFlame.scale.set(flameScale, flameScale, flameScale);
    } else {
      lampLight.intensity += (0 - lampLight.intensity) * (1 - Math.exp(-10 * dt));
      lampFlame.visible = false;
      flameCore.visible = false;
    }

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
          ? 0.55
          : st.sanity < 45
            ? 0.42
            : 0.22 + Math.max(0, Math.sin(elapsed * 0.9)) * 0.15
        : 0;
    ghostMat.opacity += (ghostTargetOpacity - ghostMat.opacity) * (1 - Math.exp(-3 * dt));
    if (rippleTime > 0) {
      rippleTime = Math.max(0, rippleTime - dt);
      ghostCluster.rotation.y = Math.sin(elapsed * 14) * 0.15 * rippleTime;
    }

    // Camera subtle parallax + trauma shake
    const lookParallaxX = playingMode ? pointerNdc.x * 0.16 : Math.sin(elapsed * 0.25) * 0.14;
    const lookParallaxY = playingMode ? pointerNdc.y * 0.08 : Math.cos(elapsed * 0.2) * 0.05;

    trauma = Math.max(0, trauma - dt * 1.9);
    const shake = trauma * trauma * 0.05;
    const shakeX = shake * Math.sin(elapsed * 54);
    const shakeY = shake * Math.cos(elapsed * 61);

    scratchTargetCamPos.set(
      baseCamPos.x + lookParallaxX * 0.25 + shakeX,
      baseCamPos.y + lookParallaxY * 0.15 + shakeY,
      baseCamPos.z
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

  if (isSoftwareGl) {
    rafId = requestAnimationFrame(tick);
  } else {
    rafId = requestAnimationFrame(tick);
  }

  return {
    syncState(state: CellarGameState, isPlaying: boolean) {
      activeState = state;
      playingMode = isPlaying;
      applyStateToMeshes(state);
      if (state.lampLit && lastLampBurn === 0) {
        lastLampBurn = 1;
      }
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
      disposables.geometries.forEach((g) => g.dispose());
      disposables.materials.forEach((m) => m.dispose());
      disposables.textures.forEach((t) => t.dispose());
      envTex.dispose();
      renderer.dispose();
    },
  };
}
