import * as THREE from 'three';

// ── Config ────────────────────────────────────────────────────────────────────

const VOXEL_SIZE = 0.45;
const GAP = 0.08;
const CELL = VOXEL_SIZE + GAP;

const GRID_X = 40;
const GRID_Y = 18;
const GRID_Z = 40;

const FILL_RATIO = 0.55;

const HAY_COLORS = [
  0xc8b890, 0xd4c49c, 0xbfad82, 0xd0c090, 0xc0b488,
  0xb8a878, 0xcabc94, 0xd8c8a0, 0xb0a070, 0xc4b68a,
];

const NEEDLE_COLOR = 0xe8a030;
const NEEDLE_RADIUS = 0.07;
const NEEDLE_LENGTH = 4.0;

// ── PRNG ─────────────────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Haystack dome shape ──────────────────────────────────────────────────────

function isInHaystack(x: number, y: number, z: number, rng: () => number): boolean {
  const nx = (x / GRID_X - 0.5) * 2;
  const ny = y / GRID_Y;
  const nz = (z / GRID_Z - 0.5) * 2;

  const dist = Math.sqrt(nx * nx + nz * nz);
  const maxRadius = Math.cos(ny * Math.PI * 0.5);
  if (dist > maxRadius) return false;

  if (ny > 0.8) {
    const fade = (ny - 0.8) / 0.2;
    if (rng() < fade * 0.7) return false;
  }

  const fillAtHeight = FILL_RATIO + (1 - ny) * 0.08;
  return rng() < fillAtHeight;
}

// ── Needle geometry ──────────────────────────────────────────────────────────

function createNeedleGeometry(): THREE.BufferGeometry {
  const shaftLen = NEEDLE_LENGTH * 0.75;
  const tipLen = NEEDLE_LENGTH * 0.25;

  const shaft = new THREE.CylinderGeometry(NEEDLE_RADIUS, NEEDLE_RADIUS, shaftLen, 16, 1);
  shaft.translate(0, shaftLen / 2, 0);

  const tip = new THREE.ConeGeometry(NEEDLE_RADIUS * 1.1, tipLen, 16);
  tip.translate(0, shaftLen + tipLen / 2, 0);

  const eye = new THREE.TorusGeometry(NEEDLE_RADIUS * 2.2, NEEDLE_RADIUS * 0.5, 12, 24);
  eye.rotateX(Math.PI / 2);
  eye.translate(0, -0.02, 0);

  const geos = [shaft, tip, eye];
  let totalVerts = 0;
  for (const g of geos) totalVerts += g.attributes.position.count;

  const pos = new Float32Array(totalVerts * 3);
  const norm = new Float32Array(totalVerts * 3);
  const idx: number[] = [];
  let vOff = 0;

  for (const g of geos) {
    const gPos = g.attributes.position as THREE.BufferAttribute;
    const gNorm = g.attributes.normal as THREE.BufferAttribute;
    pos.set(gPos.array as Float32Array, vOff * 3);
    norm.set(gNorm.array as Float32Array, vOff * 3);
    if (g.index) {
      for (let i = 0; i < g.index.count; i++) {
        idx.push(g.index.array[i] + vOff);
      }
    }
    vOff += gPos.count;
    g.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
  merged.setIndex(idx);
  merged.computeBoundingSphere();
  return merged;
}

// ── Init ─────────────────────────────────────────────────────────────────────

const container = document.getElementById('scene')!;
const statsEl = document.getElementById('stats')!;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1c1815);
scene.fog = new THREE.FogExp2(0x1c1815, 0.011);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);

// ── Lighting ────────────────────────────────────────────────────────────────

const keyLight = new THREE.DirectionalLight(0xfff4e8, 1.4);
keyLight.position.set(12, 20, 10);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -20;
keyLight.shadow.camera.right = 20;
keyLight.shadow.camera.top = 20;
keyLight.shadow.camera.bottom = -20;
keyLight.shadow.bias = -0.0003;
scene.add(keyLight);

const fill = new THREE.DirectionalLight(0xe8ddd0, 0.35);
fill.position.set(-10, 12, -5);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffecd0, 0.25);
rim.position.set(-5, 10, -12);
scene.add(rim);

scene.add(new THREE.HemisphereLight(0x2e2820, 0x0c0a08, 0.45));
scene.add(new THREE.AmbientLight(0x1c1815, 0.25));

// ── Ground ──────────────────────────────────────────────────────────────────

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshStandardMaterial({ color: 0x211e18, roughness: 0.92 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
ground.receiveShadow = true;
scene.add(ground);

// ── Haystack ────────────────────────────────────────────────────────────────

const rng = mulberry32(42);
const hayPositions: { x: number; y: number; z: number; color: number }[] = [];
const offsetX = (GRID_X * CELL) / 2;
const offsetZ = (GRID_Z * CELL) / 2;

for (let iy = 0; iy < GRID_Y; iy++) {
  for (let iz = 0; iz < GRID_Z; iz++) {
    for (let ix = 0; ix < GRID_X; ix++) {
      if (!isInHaystack(ix, iy, iz, rng)) continue;
      hayPositions.push({
        x: ix * CELL - offsetX,
        y: iy * CELL,
        z: iz * CELL - offsetZ,
        color: HAY_COLORS[Math.floor(rng() * HAY_COLORS.length)],
      });
    }
  }
}

const singleNeedle = { x: 1.2, y: GRID_Y * CELL * 0.38, z: -0.8, tilt: 0.15, spin: Math.PI * 0.7 };

const boxGeo = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
const hayMat = new THREE.MeshStandardMaterial({
  roughness: 0.8,
  flatShading: true,
  transparent: true,
  opacity: 0.12,
  depthWrite: false,
});

const hayMesh = new THREE.InstancedMesh(boxGeo, hayMat, hayPositions.length);
const dummy = new THREE.Object3D();
const color = new THREE.Color();

for (let i = 0; i < hayPositions.length; i++) {
  const p = hayPositions[i];
  dummy.position.set(p.x, p.y, p.z);
  dummy.scale.setScalar(1);
  dummy.rotation.set(0, 0, 0);
  dummy.updateMatrix();
  hayMesh.setMatrixAt(i, dummy.matrix);
  color.setHex(p.color);
  hayMesh.setColorAt(i, color);
}
hayMesh.instanceMatrix.needsUpdate = true;
if (hayMesh.instanceColor) hayMesh.instanceColor.needsUpdate = true;

// ── Needle ──────────────────────────────────────────────────────────────────

const needleGeo = createNeedleGeometry();
const needleMat = new THREE.MeshPhysicalMaterial({
  color: NEEDLE_COLOR,
  emissive: NEEDLE_COLOR,
  emissiveIntensity: 0.5,
  roughness: 0.35,
  metalness: 0.4,
  clearcoat: 0.3,
  clearcoatRoughness: 0.4,
});

const needleMesh = new THREE.InstancedMesh(needleGeo, needleMat, 1);
needleMesh.castShadow = true;
needleMesh.receiveShadow = true;

dummy.position.set(singleNeedle.x, singleNeedle.y, singleNeedle.z);
dummy.rotation.set(singleNeedle.tilt, singleNeedle.spin, 0);
dummy.scale.setScalar(1);
dummy.updateMatrix();
needleMesh.setMatrixAt(0, dummy.matrix);
color.setHex(NEEDLE_COLOR);
needleMesh.setColorAt(0, color);
needleMesh.instanceMatrix.needsUpdate = true;
if (needleMesh.instanceColor) needleMesh.instanceColor.needsUpdate = true;

hayMesh.renderOrder = 0;
needleMesh.renderOrder = 1;
scene.add(hayMesh);
scene.add(needleMesh);

const pointLight = new THREE.PointLight(0xe8a030, 1.8, 25, 2);
pointLight.position.set(singleNeedle.x, singleNeedle.y + 2, singleNeedle.z);
scene.add(pointLight);

// ── Animation ───────────────────────────────────────────────────────────────

const clock = new THREE.Clock();
let phase: 'intro' | 'reveal' | 'orbit' = 'intro';
let phaseTime = 0;

const orbitRadius = 22;
const orbitHeight = 10;
const lookAt = new THREE.Vector3(0, GRID_Y * CELL * 0.35, 0);

camera.position.set(0, 30, 40);
camera.lookAt(lookAt);

needleMesh.visible = false;
needleMat.emissiveIntensity = 0;
hayMat.opacity = 0.0;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  phaseTime += dt;

  if (phase === 'intro' && phaseTime > 3.0) {
    phase = 'reveal';
    phaseTime = 0;
    needleMesh.visible = true;
  } else if (phase === 'reveal' && phaseTime > 2.5) {
    phase = 'orbit';
    phaseTime = 0;
    statsEl.classList.add('visible');
  }

  if (phase === 'intro') {
    const t = Math.min(phaseTime / 3.0, 1);
    const ease = t * t * (3 - 2 * t);
    hayMat.opacity = ease * 0.12;
    const angle = -Math.PI / 6;
    camera.position.x = THREE.MathUtils.lerp(0, Math.sin(angle) * orbitRadius, ease);
    camera.position.y = THREE.MathUtils.lerp(30, orbitHeight, ease);
    camera.position.z = THREE.MathUtils.lerp(40, Math.cos(angle) * orbitRadius, ease);
  } else {
    const angle = -Math.PI / 6 + elapsed * 0.06;
    camera.position.x = Math.sin(angle) * orbitRadius;
    camera.position.y = orbitHeight + Math.sin(elapsed * 0.12) * 1.2;
    camera.position.z = Math.cos(angle) * orbitRadius;
  }
  camera.lookAt(lookAt);

  if (phase === 'reveal') {
    const t = Math.min(phaseTime / 2.0, 1);
    const ease = t * t * (3 - 2 * t);
    needleMat.emissiveIntensity = ease * 0.6;
    hayMat.opacity = 0.12 + ease * 0.04;
    pointLight.intensity = ease * 1.8;
  }

  if (phase === 'orbit') {
    needleMat.emissiveIntensity = 0.45 + Math.sin(elapsed * 1.2) * 0.15;
    hayMat.opacity = 0.14 + Math.sin(elapsed * 0.4) * 0.015;
    pointLight.intensity = 1.5 + Math.sin(elapsed * 1.2) * 0.3;
  }

  renderer.render(scene, camera);
}

animate();

// ── Resize ──────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
