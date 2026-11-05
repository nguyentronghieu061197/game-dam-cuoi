/**
 * Masterpiece 3D Wedding Simulation (Rạp Cưới 80 Triệu Miền Bắc)
 * Recreating the real-life luxury wedding marquee reference:
 * - Real Asian Human Models with Proper Skeletal Poses (Standing & Seated)
 * - Billowing Silk Ceiling Swags (Blush Pink & Ivory White) at authentic tent height (5.0m)
 * - Cascading Crystal Chandeliers & Fairy Light Webs
 * - Pleated Side Wall Curtains & Pink Scalloped Valances
 * - Banquet Tables with Seated Guests (Full & Partial Seating)
 * - Stage Backdrop with Golden Double Happiness (囍), Arch Alcoves, and LED Screen
 */

function cloneSkinnedGltf(source) {
  const cloneLookup = new Map();
  const clone = source.clone();
  
  function parallelTraverse(a, b) {
    cloneLookup.set(a, b);
    for (let i = 0; i < a.children.length; i++) {
      parallelTraverse(a.children[i], b.children[i]);
    }
  }
  parallelTraverse(source, clone);

  clone.traverse(child => {
    if (child.isSkinnedMesh) {
      const clonedBones = child.skeleton.bones.map(b => cloneLookup.get(b) || b);
      child.skeleton = new THREE.Skeleton(clonedBones, child.skeleton.boneInverses);
      child.bind(child.skeleton, child.bindMatrix);
    }
  });
  return clone;
}

function poseFormalGentleman(model) {
  const mesh = model.getObjectByName('H_DDS_HighRes');
  if (!mesh || !mesh.skeleton) return;
  const la = mesh.skeleton.bones.find(b => b.name === 'LeftArm');
  const ra = mesh.skeleton.bones.find(b => b.name === 'RightArm');
  if (la) la.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2.8);
  if (ra) ra.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2.8);
  mesh.skeleton.update();
}

function poseSeatedGuest(model) {
  poseFormalGentleman(model);
}

let playerName = "Khách Quý";

const gameState = {
  quests: { gift: false, eat: false, ceremony: false },
  isCeremonyPlaying: false,
  giftAmount: "500.000 VNĐ",
  giftWishes: "Chúc Quân & My trăm năm hạnh phúc, đầu bạc răng long!",
  interactionTarget: null
};

// Audio elements
const audios = {
  mc_welcome: new Audio('assets/audio/mc_welcome.mp3'),
  mc_stage: new Audio('assets/audio/mc_stage.mp3'),
  mc_cake_wine: new Audio('assets/audio/mc_cake_wine.mp3'),
  mc_toast: new Audio('assets/audio/mc_toast.mp3')
};

let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playSound(type) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    if (type === 'clink') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'cheer') {
      [440, 554, 659, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.25, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    } else if (type === 'coin') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    console.log("Audio notice:", e);
  }
}

// Procedural Textures
function createBallroomFloorTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#220812';
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 256;
  for (let x = 0; x < 512; x += tileSize) {
    for (let y = 0; y < 512; y += tileSize) {
      ctx.fillStyle = '#2d0c18';
      ctx.fillRect(x + 4, y + 4, tileSize - 8, tileSize - 8);

      ctx.strokeStyle = '#c5a059';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 14, y + 14, tileSize - 28, tileSize - 28);

      ctx.fillStyle = '#c5a059';
      ctx.fillRect(x + 14, y + 14, 18, 18);
      ctx.fillRect(x + tileSize - 32, y + 14, 18, 18);
      ctx.fillRect(x + 14, y + tileSize - 32, 18, 18);
      ctx.fillRect(x + tileSize - 32, y + tileSize - 32, 18, 18);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 14);
  tex.needsUpdate = true;
  return tex;
}

function createRedVelvetCarpetTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#9e091e';
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = '#ffd700';
  ctx.fillRect(18, 0, 20, 512);
  ctx.fillRect(474, 0, 20, 512);

  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 0, 20, 512);
  ctx.strokeRect(474, 0, 20, 512);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 16);
  tex.needsUpdate = true;
  return tex;
}

function initGame() {
  const canvas = document.getElementById('gameCanvas');

  // Scene & Atmosphere
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a0610);
  scene.fog = new THREE.FogExp2(0x1a0610, 0.012);

  const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 200);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // --- WARM LUXURY LIGHTING ---
  const hemiLight = new THREE.HemisphereLight(0xfff5ea, 0x5a2d3b, 1.45);
  scene.add(hemiLight);

  const ambLight = new THREE.AmbientLight(0xffeedd, 1.25);
  scene.add(ambLight);

  const dirLight = new THREE.DirectionalLight(0xfffaed, 1.6);
  dirLight.position.set(10, 20, 15);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  const camLight = new THREE.DirectionalLight(0xffeedd, 1.35);
  camera.add(camLight);
  scene.add(camera);

  // Stage Spotlight
  const stageSpot = new THREE.SpotLight(0xffdf88, 4.5, 45, Math.PI / 3.5, 0.5);
  stageSpot.position.set(0, 12, -25);
  stageSpot.target.position.set(0, 2, -33);
  stageSpot.castShadow = true;
  scene.add(stageSpot);
  scene.add(stageSpot.target);

  // --- RẠP CƯỚI 80 TRIỆU LUXURY ARCHITECTURE ---
  const HALL = { width: 26, length: 76, height: 5.2 };

  // 1. Polished Ballroom Floor
  const floorTex = createBallroomFloorTexture();
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.25,
    metalness: 0.15
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALL.width, HALL.length), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // 2. Central Red Carpet Runner
  const carpetTex = createRedVelvetCarpetTexture();
  const carpetMat = new THREE.MeshStandardMaterial({
    map: carpetTex,
    roughness: 0.75
  });
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 68), carpetMat);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.02, 0);
  carpet.receiveShadow = true;
  scene.add(carpet);

  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });
  const bLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 68), goldMat);
  bLeft.position.set(-2.35, 0.035, 0);
  const bRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 68), goldMat);
  bRight.position.set(2.35, 0.035, 0);
  scene.add(bLeft); scene.add(bRight);

  // 3. Perimeter Pleated Curtains with 3D Folds & Pink Scalloped Valances
  const curtainMat = new THREE.MeshStandardMaterial({ color: 0xfffcf5, side: THREE.DoubleSide, roughness: 0.85 });
  const valanceMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, side: THREE.DoubleSide, roughness: 0.65 });

  [-HALL.width / 2 + 0.2, HALL.width / 2 - 0.2].forEach((wallX, idx) => {
    const cGeo = new THREE.PlaneGeometry(HALL.length, HALL.height, 64, 1);
    const pos = cGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      pos.setZ(i, Math.sin(u * 8) * 0.12);
    }
    cGeo.computeVertexNormals();

    const curtain = new THREE.Mesh(cGeo, curtainMat);
    curtain.position.set(wallX, HALL.height / 2, 0);
    curtain.rotation.y = idx === 0 ? Math.PI / 2 : -Math.PI / 2;
    scene.add(curtain);

    const valance = new THREE.Mesh(new THREE.PlaneGeometry(HALL.length, 1.1), valanceMat);
    valance.position.set(wallX, HALL.height - 0.55, 0);
    valance.rotation.y = idx === 0 ? Math.PI / 2 : -Math.PI / 2;
    scene.add(valance);
  });

  const backCurtain = new THREE.Mesh(new THREE.PlaneGeometry(HALL.width, HALL.height), curtainMat);
  backCurtain.position.set(0, HALL.height / 2, HALL.length / 2 - 0.5);
  scene.add(backCurtain);

  // 4. Undulating Ceiling Silk Swags (Trần voan lụa sóng hồng & trắng)
  const pinkSilkMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, side: THREE.DoubleSide, roughness: 0.7 });
  const whiteSilkMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.7 });

  for (let z = -30; z <= 32; z += 5) {
    const isPink = (Math.abs(z) % 10 === 0);
    const mat = isPink ? pinkSilkMat : whiteSilkMat;

    const swagGeo = new THREE.PlaneGeometry(HALL.width, 4.4, 32, 1);
    const pos = swagGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const normalizedX = x / (HALL.width / 2);
      const sag = Math.cos(normalizedX * Math.PI / 2) * 0.75;
      pos.setZ(i, sag);
    }
    swagGeo.computeVertexNormals();

    const swag = new THREE.Mesh(swagGeo, mat);
    swag.position.set(0, HALL.height - 0.6, z);
    swag.rotation.x = Math.PI / 2;
    scene.add(swag);
  }

  // 5. Fairy Lights Strings across Ceiling
  const fairyLightMat = new THREE.MeshBasicMaterial({ color: 0xffecb3 });
  for (let z = -30; z <= 32; z += 5) {
    for (let x = -HALL.width / 2 + 2; x <= HALL.width / 2 - 2; x += 1.6) {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), fairyLightMat);
      bead.position.set(x, HALL.height - 0.6, z);
      scene.add(bead);
    }
  }

  // 6. Grand Crystal Chandeliers
  const chandelierMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1 });
  const crystalMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, roughness: 0.05, transmission: 0.85 });

  for (let z = -22; z <= 24; z += 11) {
    const chGroup = new THREE.Group();
    chGroup.position.set(0, 3.6, z);

    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4), chandelierMat);
    rod.position.y = 0.7;
    chGroup.add(rod);

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.07, 8, 24), chandelierMat);
    ring1.rotation.x = Math.PI / 2;
    chGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.06, 8, 20), chandelierMat);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = -0.5;
    chGroup.add(ring2);

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      const cr = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.45, 5), crystalMat);
      cr.position.set(Math.cos(a) * 1.3, -0.25, Math.sin(a) * 1.3);
      cr.rotation.x = Math.PI;
      chGroup.add(cr);
    }
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
      const cr = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.38, 5), crystalMat);
      cr.position.set(Math.cos(a) * 0.75, -0.75, Math.sin(a) * 0.75);
      cr.rotation.x = Math.PI;
      chGroup.add(cr);
    }

    const pl = new THREE.PointLight(0xffdf88, 2.2, 14, 1.2);
    pl.position.set(0, -0.2, 0);
    chGroup.add(pl);
    scene.add(chGroup);
  }

  // 7. Gold Floral Pedestals along Red Carpet
  for (let z = -24; z <= 26; z += 8) {
    [-2.7, 2.7].forEach(x => {
      const postGroup = new THREE.Group();
      postGroup.position.set(x, 0, z);

      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.2, 8), goldMat);
      stand.position.y = 0.6;
      stand.castShadow = true;
      postGroup.add(stand);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.6 }));
      dome.scale.set(1.1, 0.8, 1.1);
      dome.position.y = 1.35;
      postGroup.add(dome);

      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const trail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        trail.position.set(Math.cos(a) * 0.4, 1.05, Math.sin(a) * 0.4);
        trail.rotation.z = Math.cos(a) * 0.4;
        postGroup.add(trail);
      }

      const uplight = new THREE.PointLight(0xffeedd, 0.7, 3.5);
      uplight.position.set(0, 0.2, 0);
      postGroup.add(uplight);

      scene.add(postGroup);
    });
  }

  // 8. Entrance Wedding Portrait on Easel Stand (Ảnh cưới Quân & My)
  const texLoader = new THREE.TextureLoader();
  const photoTexture = texLoader.load('assets/images/wedding_concept_stage.jpg');
  const easelGroup = new THREE.Group();
  easelGroup.position.set(-3.6, 0, 29);
  easelGroup.rotation.y = Math.PI / 6;

  const legMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });
  [-0.35, 0.35].forEach(lx => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2), legMat);
    leg.position.set(lx, 1.0, 0);
    leg.rotation.z = lx * -0.2;
    easelGroup.add(leg);
  });
  const backLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2), legMat);
  backLeg.position.set(0, 1.0, -0.4);
  backLeg.rotation.x = -0.3;
  easelGroup.add(backLeg);

  const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.9, 0.08), goldMat);
  frameMesh.position.set(0, 1.35, 0);
  frameMesh.castShadow = true;
  easelGroup.add(frameMesh);

  const photoMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.7),
    new THREE.MeshStandardMaterial({ map: photoTexture, roughness: 0.2 })
  );
  photoMesh.position.set(0, 1.35, 0.045);
  easelGroup.add(photoMesh);

  const photoLabel = makeBillboardSprite("📸 ẢNH CƯỚI QUÂN & MY", "#ffd700");
  photoLabel.position.set(0, 2.5, 0);
  easelGroup.add(photoLabel);
  scene.add(easelGroup);

  // 9. Reception Desk & Gift Box (Bàn lễ tân & Hòm tiền mừng)
  const deskGroup = new THREE.Group();
  deskGroup.position.set(4.0, 0, 29);

  const tableMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 1.2), new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 }));
  tableMesh.position.y = 0.5;
  tableMesh.castShadow = true;
  deskGroup.add(tableMesh);

  const deskTrim = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.08, 1.24), goldMat);
  deskTrim.position.y = 0.98;
  deskGroup.add(deskTrim);

  const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.5), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.2, metalness: 0.3 }));
  boxMesh.position.set(0, 1.3, 0);
  boxMesh.castShadow = true;
  deskGroup.add(boxMesh);

  const lockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.05), goldMat);
  lockMesh.position.set(0, 1.3, 0.28);
  deskGroup.add(lockMesh);

  const boxLabel = makeBillboardSprite("🧧 HÒM TIỀN MỪNG", "#ffd700");
  boxLabel.position.set(0, 2.1, 0);
  deskGroup.add(boxLabel);
  scene.add(deskGroup);

  // 10. GRAND WEDDING STAGE (Bục cưới chi tiết chuẩn ảnh mẫu)
  const stageGroup = new THREE.Group();
  stageGroup.position.set(0, 0, -33);

  const stageBase = new THREE.Mesh(new THREE.BoxGeometry(20, 0.9, 9), new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.5 }));
  stageBase.position.y = 0.45;
  stageBase.receiveShadow = true;
  stageBase.castShadow = true;
  stageGroup.add(stageBase);

  [0.7, 0.46, 0.23].forEach((sy, sidx) => {
    const step = new THREE.Mesh(new THREE.BoxGeometry(7.5 - sidx * 1.4, 0.23, 0.9), new THREE.MeshStandardMaterial({ color: 0x991b1b }));
    step.position.set(0, sy - 0.11, 4.5 + (sidx + 1) * 0.85);
    stageGroup.add(step);
  });

  const stageTrim = new THREE.Mesh(new THREE.BoxGeometry(20.2, 0.12, 9.2), goldMat);
  stageTrim.position.y = 0.92;
  stageGroup.add(stageTrim);

  // Stage LED Screen Backdrop
  const ledCanvas = document.createElement('canvas');
  ledCanvas.width = 1024; ledCanvas.height = 400;
  const lctx = ledCanvas.getContext('2d');
  
  const grad = lctx.createLinearGradient(0, 0, 1024, 400);
  grad.addColorStop(0, '#2e0819');
  grad.addColorStop(0.5, '#4a0e27');
  grad.addColorStop(1, '#2e0819');
  lctx.fillStyle = grad;
  lctx.fillRect(0, 0, 1024, 400);

  lctx.strokeStyle = '#ffd700';
  lctx.lineWidth = 12;
  lctx.strokeRect(8, 8, 1008, 384);

  lctx.fillStyle = '#ffd700';
  lctx.font = 'bold 84px serif';
  lctx.textAlign = 'center';
  lctx.fillText('囍', 512, 95);

  lctx.font = 'bold 44px sans-serif';
  lctx.fillText('LỄ THÀNH HÔN', 512, 160);

  lctx.fillStyle = '#ffffff';
  lctx.font = 'bold 64px sans-serif';
  lctx.fillText('QUÂN  ❤️  MY', 512, 250);

  lctx.fillStyle = '#fbcfe8';
  lctx.font = 'italic 32px sans-serif';
  lctx.fillText('TRĂM NĂM HẠNH PHÚC • ĐẦU BẠC RĂNG LONG', 512, 330);

  const ledTex = new THREE.CanvasTexture(ledCanvas);
  const ledScreen = new THREE.Mesh(new THREE.PlaneGeometry(16, 6.4), new THREE.MeshBasicMaterial({ map: ledTex }));
  ledScreen.position.set(0, 4.3, -4.2);
  stageGroup.add(ledScreen);

  // Large Golden Cut-out Double Happiness (囍) Medallion floating above stage
  const hyTex = texLoader.load('assets/images/hy_gold.png');
  const hyBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 2.4),
    new THREE.MeshBasicMaterial({ map: hyTex, transparent: true })
  );
  hyBadge.position.set(0, 5.8, -4.1);
  stageGroup.add(hyBadge);

  [-8.5, 8.5].forEach(ax => {
    const archGroup = new THREE.Group();
    archGroup.position.set(ax, 0.9, -3.8);

    const alcoveArch = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.1, 8, 20, Math.PI), goldMat);
    alcoveArch.position.set(0, 3.4, 0);
    archGroup.add(alcoveArch);

    [-1.6, 1.6].forEach(px => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.4), goldMat);
      p.position.set(px, 1.7, 0);
      archGroup.add(p);
    });

    for (let f = 0; f < 8; f++) {
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), new THREE.MeshStandardMaterial({ color: f % 2 === 0 ? 0xfbcfe8 : 0xffffff }));
      fl.position.set(Math.cos(f) * 1.6, 1.8 + f * 0.35, 0.1);
      archGroup.add(fl);
    }

    stageGroup.add(archGroup);
  });

  const champGroup = new THREE.Group();
  champGroup.position.set(-5.8, 0.9, 0);
  for (let l = 0; l < 4; l++) {
    const count = 4 - l;
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        const glass = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.04, 0.32, 8),
          new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, transmission: 0.9, roughness: 0.1 })
        );
        glass.position.set((i - count / 2 + 0.5) * 0.32, l * 0.35 + 0.16, (j - count / 2 + 0.5) * 0.32);
        champGroup.add(glass);
      }
    }
  }
  stageGroup.add(champGroup);

  const cakeGroup = new THREE.Group();
  cakeGroup.position.set(5.8, 0.9, 0);
  [1.1, 0.88, 0.66, 0.45, 0.28].forEach((radius, idx) => {
    const tier = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, 0.32, 20),
      new THREE.MeshStandardMaterial({ color: idx % 2 === 0 ? 0xffffff : 0xfbcfe8, roughness: 0.3 })
    );
    tier.position.y = idx * 0.33 + 0.16;
    cakeGroup.add(tier);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.035, 6, 20), goldMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = idx * 0.33 + 0.32;
    cakeGroup.add(rim);
  });
  stageGroup.add(cakeGroup);

  scene.add(stageGroup);

  // --- 11. BANQUET TABLES WITH REAL SEATED GUESTS ---
  const gltfLoader = new THREE.GLTFLoader();
  gltfLoader.setMeshoptDecoder(MeshoptDecoder);

  const tablePositions = [
    { x: -6.8, z: 16, capacity: 8, occupied: 8 },  // Full Table
    { x: 6.8, z: 16, capacity: 8, occupied: 7 },   // Almost Full Table
    { x: -6.8, z: 5, capacity: 8, occupied: 8 },   // Full Table
    { x: 6.8, z: 5, capacity: 8, occupied: 4 },    // Partially Seated
    { x: -6.8, z: -6, capacity: 8, occupied: 8 },  // Full Table
    { x: 6.8, z: -6, capacity: 8, occupied: 5 },   // Partially Seated
    { x: -6.8, z: -17, capacity: 8, occupied: 8 }, // Full Table
    { x: 6.8, z: -17, capacity: 8, occupied: 3 }   // Partially Seated
  ];

  const chairMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.25 });
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });

  function makeChiavariChair() {
    const chair = new THREE.Group();
    [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.45), chairMat);
      leg.position.set(lx, 0.225, lz);
      chair.add(leg);
    });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.44), cushionMat);
    seat.position.y = 0.45;
    chair.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.035), chairMat);
    back.position.set(0, 0.72, 0.2);
    chair.add(back);
    return chair;
  }

  // 12. Player Container
  const playerGroup = new THREE.Group();
  playerGroup.position.set(0, 0, 15);
  scene.add(playerGroup);

  let playerMeshBones = null;

  let playerLabel = makeBillboardSprite(playerName, "#ffffff", "#0284c7");
  playerLabel.position.set(0, 2.9, 0);
  playerGroup.add(playerLabel);

  function updatePlayerNameLabel(name) {
    playerGroup.remove(playerLabel);
    playerLabel = makeBillboardSprite(name, "#ffffff", "#0284c7");
    playerLabel.position.set(0, 2.9, 0);
    playerGroup.add(playerLabel);
  }

  // Groom, Bride & MC containers
  const groomGroup = new THREE.Group();
  groomGroup.position.set(-0.8, 0.9, -33);
  scene.add(groomGroup);
  const groomLabel = makeBillboardSprite("🤵 CHÚ RỂ QUÂN", "#60a5fa");
  groomLabel.position.set(0, 2.9, 0);
  groomGroup.add(groomLabel);

  const brideGroup = new THREE.Group();
  brideGroup.position.set(1.0, 0.9, -33);
  scene.add(brideGroup);
  const brideLabel = makeBillboardSprite("👰 CÔ DÂU MY", "#f472b6");
  brideLabel.position.set(0, 2.8, 0);
  brideGroup.add(brideLabel);

  const mcGroup = new THREE.Group();
  mcGroup.position.set(-3.0, 0.9, -33);
  scene.add(mcGroup);
  const mcMic = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 }));
  mcMic.position.set(0.35, 1.3, 0.3);
  mcMic.rotation.x = Math.PI / 4;
  mcGroup.add(mcMic);
  const mcLabel = makeBillboardSprite("🎤 MC ĐÁM CƯỚI", "#ffd700");
  mcLabel.position.set(0, 2.9, 0);
  mcGroup.add(mcLabel);

  // Load Asian model IMMEDIATELY!
  gltfLoader.load('assets/models/avatars/Asian_M_1_Busi.glb', (gltfBusi) => {
    const busiTemplate = gltfBusi.scene;

    // 1. Setup Player (Asian Gentleman in Tailored Suit)
    const playerModel = cloneSkinnedGltf(busiTemplate);
    playerModel.scale.set(1.35, 1.35, 1.35);
    playerModel.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = false;
        if (child.material) {
          child.material.roughness = 0.4;
          child.material.metalness = 0.1;
        }
      }
    });

    poseFormalGentleman(playerModel);
    playerGroup.add(playerModel);

    // Save bones for walking stride animation
    const pMesh = playerModel.getObjectByName('H_DDS_HighRes');
    if (pMesh && pMesh.skeleton) {
      playerMeshBones = {
        mesh: pMesh,
        la: pMesh.skeleton.bones.find(b => b.name === 'LeftArm'),
        ra: pMesh.skeleton.bones.find(b => b.name === 'RightArm')
      };
    }

    // 2. Setup Groom on Stage
    const groomModel = cloneSkinnedGltf(busiTemplate);
    groomModel.scale.set(1.35, 1.35, 1.35);
    groomModel.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = false;
      }
    });
    poseFormalGentleman(groomModel);
    groomGroup.add(groomModel);

    // 3. Setup MC on Stage
    const mcModel = cloneSkinnedGltf(busiTemplate);
    mcModel.scale.set(1.35, 1.35, 1.35);
    mcModel.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = false;
      }
    });
    poseFormalGentleman(mcModel);
    mcGroup.add(mcModel);

    // 4. Setup Bride My on Stage (Asian_F_1_Busi in bridal gown)
    gltfLoader.load('assets/models/avatars/Asian_F_1_Busi.glb', (gltfBride) => {
      const brideModel = gltfBride.scene;
      brideModel.scale.set(1.3, 1.3, 1.3);
      brideModel.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = false;
          if (child.material) {
            child.material.color = new THREE.Color(0xffffff);
          }
        }
      });
      poseFormalGentleman(brideModel);
      brideGroup.add(brideModel);
    });

    // 5. Populate All 8 Banquet Tables with Seated Guests!
    tablePositions.forEach((pos, tableIdx) => {
      const tGroup = new THREE.Group();
      tGroup.position.set(pos.x, 0, pos.z);

      const tbl = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 0.8, 24),
        new THREE.MeshStandardMaterial({ color: 0xfffcf5, roughness: 0.5 })
      );
      tbl.position.y = 0.4;
      tbl.castShadow = true;
      tbl.receiveShadow = true;
      tGroup.add(tbl);

      const susan = new THREE.Mesh(
        new THREE.CylinderGeometry(1.25, 1.25, 0.04, 24),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, roughness: 0.1 })
      );
      susan.position.y = 0.82;
      tGroup.add(susan);

      const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.4, 12), goldMat);
      vase.position.y = 1.05;
      tGroup.add(vase);
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfbcfe8 }));
      fl.position.y = 1.35;
      tGroup.add(fl);

      const plateMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 16), plateMat);
      p1.position.set(-0.55, 0.85, 0.28);
      const xoi = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.07, 16), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
      xoi.position.set(-0.55, 0.9, 0.28);
      tGroup.add(p1); tGroup.add(xoi);

      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 16), plateMat);
      p2.position.set(0.55, 0.85, -0.28);
      const ga = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 }));
      ga.scale.set(1.3, 0.7, 1);
      ga.position.set(0.55, 0.93, -0.28);
      tGroup.add(p2); tGroup.add(ga);

      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.45, 8),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.1, transparent: true, opacity: 0.85 })
      );
      bottle.position.set(0, 1.05, 0);
      tGroup.add(bottle);

      for (let i = 0; i < pos.capacity; i++) {
        const angle = (i / pos.capacity) * Math.PI * 2;
        const cx = Math.cos(angle) * 2.8;
        const cz = Math.sin(angle) * 2.8;

        const chair = makeChiavariChair();
        chair.position.set(cx, 0, cz);
        chair.rotation.y = -angle - Math.PI / 2;
        tGroup.add(chair);

        if (i < pos.occupied) {
          const guest = cloneSkinnedGltf(busiTemplate);
          guest.scale.set(1.2, 1.2, 1.2);
          // Position seated at chair
          guest.position.set(cx, -0.3, cz);
          guest.rotation.y = -angle - Math.PI / 2;

          guest.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = false;
            }
          });

          poseSeatedGuest(guest);
          tGroup.add(guest);
        }
      }

      scene.add(tGroup);
    });
  });

  const feastLabel = makeBillboardSprite("🍗 MÂM CỖ MIỀN BẮC", "#fef08a");
  feastLabel.position.set(-6.8, 2.2, 5);
  scene.add(feastLabel);

  // --- 13. 3D CONFETTI & SPARKLERS ---
  const confettiCount = 140;
  const confettiGeo = new THREE.PlaneGeometry(0.2, 0.2);
  const confettiColors = [0xef4444, 0xffd700, 0x3b82f6, 0x10b981, 0xec4899, 0xffffff];
  const confettiMeshes = [];

  for (let i = 0; i < confettiCount; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: confettiColors[i % confettiColors.length], side: THREE.DoubleSide });
    const c = new THREE.Mesh(confettiGeo, mat);
    c.position.set(0, -10, 0);
    c.visible = false;
    scene.add(c);
    confettiMeshes.push({ mesh: c, vx: 0, vy: 0, vz: 0, rotX: Math.random() * 0.2, rotY: Math.random() * 0.2, life: 0 });
  }

  function blastConfetti(originX = 0, originY = 3, originZ = -33) {
    confettiMeshes.forEach(c => {
      c.mesh.position.set(originX + (Math.random() - 0.5) * 8, originY + Math.random() * 2, originZ + (Math.random() - 0.5) * 8);
      c.vx = (Math.random() - 0.5) * 0.3;
      c.vy = Math.random() * 0.3 + 0.18;
      c.vz = (Math.random() - 0.5) * 0.3;
      c.life = 180;
      c.mesh.visible = true;
    });
  }

  function makeBillboardSprite(text, textColor = "#ffd700", bgColor = "rgba(0,0,0,0.65)") {
    const c = document.createElement('canvas');
    c.width = 384; c.height = 96;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.roundRect ? ctx.roundRect(10, 10, 364, 76, 20) : ctx.fillRect(10, 10, 364, 76);
    ctx.fill();
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = textColor;
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 192, 48);
    const tex = new THREE.CanvasTexture(c);
    const spriteMat = new THREE.SpriteMaterial({ map: tex });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.4, 0.6, 1);
    return sprite;
  }

  // --- 14. THIRD-PERSON CAMERA & SMOOTH CONTROLS ---
  let cameraYaw = 0;
  let cameraPitch = 0.05;  // Low pitch so the full marquee ceiling and chandeliers are prominently visible!
  const cameraDistance = 4.6;
  const cameraTargetOffset = new THREE.Vector3(0, 1.4, 0);

  const input = { stickX: 0, stickY: 0, keyW: false, keyA: false, keyS: false, keyD: false };
  const playerSpeed = 7.0;
  let currentFacingAngle = 0;
  let walkCycle = 0;

  const cameraSwipeZone = document.getElementById('cameraSwipeZone');
  let isSwiping = false;
  let lastTouchX = 0, lastTouchY = 0;

  cameraSwipeZone.addEventListener('pointerdown', e => {
    isSwiping = true;
    lastTouchX = e.clientX;
    lastTouchY = e.clientY;
  });

  window.addEventListener('pointermove', e => {
    if (!isSwiping) return;
    const dx = e.clientX - lastTouchX;
    const dy = e.clientY - lastTouchY;
    lastTouchX = e.clientX;
    lastTouchY = e.clientY;
    cameraYaw -= dx * 0.006;
    cameraPitch += dy * 0.005;
    cameraPitch = Math.max(-0.25, Math.min(0.85, cameraPitch));
  });

  const endSwipe = () => { isSwiping = false; };
  window.addEventListener('pointerup', endSwipe);
  window.addEventListener('pointercancel', endSwipe);

  const joystickZone = document.getElementById('joystickZone');
  const joystickThumb = document.getElementById('joystickThumb');
  let joystickActive = false;
  let joyStart = { x: 0, y: 0 };
  const joyMax = 50;

  joystickZone.addEventListener('pointerdown', e => {
    e.preventDefault();
    const rect = joystickZone.getBoundingClientRect();
    joyStart = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    joystickActive = true;
    updateJoystick(e.clientX, e.clientY);
  });

  window.addEventListener('pointermove', e => {
    if (!joystickActive) return;
    updateJoystick(e.clientX, e.clientY);
  });

  const endJoy = () => {
    joystickActive = false;
    input.stickX = 0;
    input.stickY = 0;
    joystickThumb.style.transform = `translate(0px, 0px)`;
  };
  window.addEventListener('pointerup', endJoy);
  window.addEventListener('pointercancel', endJoy);

  function updateJoystick(cx, cy) {
    const dx = cx - joyStart.x;
    const dy = cy - joyStart.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const capped = Math.min(dist, joyMax);
    joystickThumb.style.transform = `translate(${Math.cos(angle) * capped}px, ${Math.sin(angle) * capped}px)`;
    const intensity = capped / joyMax;
    input.stickX = Math.cos(angle) * intensity;
    input.stickY = Math.sin(angle) * intensity;
  }

  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') input.keyW = true;
    if (k === 's' || k === 'arrowdown') input.keyS = true;
    if (k === 'a' || k === 'arrowleft') input.keyA = true;
    if (k === 'd' || k === 'arrowright') input.keyD = true;
  });

  window.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') input.keyW = false;
    if (k === 's' || k === 'arrowdown') input.keyS = false;
    if (k === 'a' || k === 'arrowleft') input.keyA = false;
    if (k === 'd' || k === 'arrowright') input.keyD = false;
  });

  // --- 15. INTERACTION & UI HOOKS ---
  const zones = [
    { id: 'gate_gift', name: 'Hòm Mừng Hỷ', x: 4.0, z: 29, radius: 3.5, prompt: 'Bỏ phong bì mừng Quân & My' },
    { id: 'banquet', name: 'Mâm Cỗ Miền Bắc', x: -6.8, z: 5, radius: 4.0, prompt: 'Nếm cỗ 80 triệu & Cụng ly 1-2-3 Dô' },
    { id: 'stage_mc', name: 'Sân Khấu Lễ Thành Hôn', x: 0, z: -31, radius: 5.5, prompt: 'Dự Lễ Thành Hôn cùng MC & Quân - My' }
  ];

  const interactPrompt = document.getElementById('interactPrompt');
  const actionBtn = document.getElementById('actionBtn');

  actionBtn.addEventListener('click', () => {
    if (gameState.interactionTarget) triggerInteraction(gameState.interactionTarget);
  });

  const welcomeModal = document.getElementById('welcomeModal');
  const enterWeddingBtn = document.getElementById('enterWeddingBtn');
  const playerNameInput = document.getElementById('playerNameInput');

  if (enterWeddingBtn) {
    enterWeddingBtn.addEventListener('click', () => {
      if (playerNameInput && playerNameInput.value.trim()) {
        playerName = playerNameInput.value.trim();
        updatePlayerNameLabel(playerName);
      }
      if (welcomeModal) welcomeModal.style.display = 'none';
      getAudioContext();
      playSound('cheer');
      blastConfetti(playerGroup.position.x, 3, playerGroup.position.z);
    });
  }

  const giftModal = document.getElementById('giftModal');
  const feastModal = document.getElementById('feastModal');

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      giftModal.style.display = 'none';
      feastModal.style.display = 'none';
    });
  });

  document.querySelectorAll('.gift-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gift-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      gameState.giftAmount = btn.dataset.amount;
    });
  });

  document.getElementById('submitGiftBtn').addEventListener('click', () => {
    gameState.quests.gift = true;
    updateQuestUI();
    giftModal.style.display = 'none';
    playSound('coin');
    blastConfetti(4.0, 3, 29);
    showDialogue("Bác Trưởng Ban Tiếp Đón", `Gia đình xin chân thành cảm ơn ${playerName}! Chúc bạn có một ngày dự tiệc thật vui vẻ cùng Quân & My!`);
  });

  document.getElementById('toastFeastBtn').addEventListener('click', () => {
    gameState.quests.eat = true;
    updateQuestUI();
    feastModal.style.display = 'none';
    playSound('clink');
    setTimeout(() => playSound('cheer'), 300);
    blastConfetti(-6.8, 3, 5);
    showDialogue("Bàn Tiệc Bạn Thân", `1, 2, 3... DÔ! Trăm năm hạnh phúc cho đôi bạn trẻ Quân & My! Cảm ơn ${playerName} đã ghé cụng ly!`);
  });

  function updateQuestUI() {
    const q1 = document.getElementById('q1');
    const q2 = document.getElementById('q2');
    const q3 = document.getElementById('q3');
    if (q1 && gameState.quests.gift) q1.innerHTML = '✅ Bỏ phong bì mừng Quân & My';
    if (q2 && gameState.quests.eat) q2.innerHTML = '✅ Nếm cỗ 80 triệu & Cụng ly 1-2-3 Zô';
    if (q3 && gameState.quests.ceremony) q3.innerHTML = '✅ Dự lễ thành hôn cùng MC & Đôi uyên ương';
  }

  function triggerInteraction(target) {
    if (target.id === 'gate_gift') giftModal.style.display = 'flex';
    else if (target.id === 'banquet') feastModal.style.display = 'flex';
    else if (target.id === 'stage_mc') startCeremonySequence();
  }

  function startCeremonySequence() {
    if (gameState.isCeremonyPlaying) return;
    gameState.isCeremonyPlaying = true;
    gameState.quests.ceremony = true;
    updateQuestUI();

    const sequence = [
      {
        speaker: "MC Đám Cưới Miền Bắc",
        avatar: "assets/images/wedding_concept_stage.jpg",
        text: "Kính thưa toàn thể quan viên hai họ và các bạn bè thân hữu, chào mừng quý vị đến với Lễ Thành Hôn của chú rể Quân và cô dâu My!",
        audio: audios.mc_welcome
      },
      {
        speaker: "MC Đám Cưới Miền Bắc",
        avatar: "assets/images/wedding_concept_stage.jpg",
        text: "Xin mời một tràng pháo tay thật nồng nhiệt để đón chào Chú rể Quân và Cô dâu My tiến lên sân khấu làm lễ thành hôn!",
        audio: audios.mc_stage
      },
      {
        speaker: "Chú Rể Quân & Cô Dâu My",
        avatar: "assets/images/wedding_concept_overview.jpg",
        text: "Quân và My xin cúi đầu cảm ơn tình cảm của tất cả anh em, bạn bè và hai bên gia đình đã có mặt chung vui hôm nay!",
        audio: null
      },
      {
        speaker: "MC Đám Cưới Miền Bắc",
        avatar: "assets/images/wedding_concept_stage.jpg",
        text: "Kính mời đôi bạn trẻ cùng nâng chiếc bánh cưới hạnh phúc và rót những dòng rượu sâm panh tràn đầy tình nghĩa phu thê!",
        audio: audios.mc_cake_wine
      },
      {
        speaker: "MC Đám Cưới Miền Bắc",
        avatar: "assets/images/wedding_concept_stage.jpg",
        text: "Nào! Toàn thể rạp cưới chúng ta cùng nâng cao ly rượu mừng! Một, hai, ba... DÔ! Chúc Quân & My trăm năm hạnh phúc!",
        audio: audios.mc_toast
      }
    ];

    let step = 0;
    function playStep() {
      if (step >= sequence.length) {
        gameState.isCeremonyPlaying = false;
        closeDialogue();
        blastConfetti(0, 4, -33);
        playSound('cheer');
        return;
      }

      const item = sequence[step];
      showDialogue(item.speaker, item.text, item.avatar, () => {
        step++;
        playStep();
      });

      if (item.audio) {
        item.audio.currentTime = 0;
        item.audio.play().catch(e => console.log("Audio notice:", e));
      }

      if (step === 1 || step === 3 || step === 4) {
        blastConfetti(0, 4, -33);
        playSound('cheer');
      }
    }

    playStep();
  }

  const dialogueBox = document.getElementById('dialogueBox');
  const dialogueSpeaker = document.getElementById('dialogueSpeaker');
  const dialogueContent = document.getElementById('dialogueContent');
  const dialogueAvatar = document.getElementById('dialogueAvatar');
  const dialogueNextBtn = document.getElementById('dialogueNextBtn');
  let currentOnNext = null;

  function showDialogue(speaker, text, avatarUrl = null, onNext = null) {
    dialogueBox.style.display = 'block';
    dialogueSpeaker.textContent = speaker;
    dialogueContent.textContent = text;
    if (avatarUrl) dialogueAvatar.style.backgroundImage = `url('${avatarUrl}')`;
    currentOnNext = onNext;
  }

  function closeDialogue() {
    dialogueBox.style.display = 'none';
  }

  dialogueNextBtn.addEventListener('click', () => {
    if (currentOnNext) currentOnNext();
    else closeDialogue();
  });

  // --- 16. ANIMATION & RENDER LOOP ---
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.1);

    let moveX = input.stickX;
    let moveZ = input.stickY;
    if (input.keyW) moveZ -= 1;
    if (input.keyS) moveZ += 1;
    if (input.keyA) moveX -= 1;
    if (input.keyD) moveX += 1;

    const inputLen = Math.hypot(moveX, moveZ);

    if (inputLen > 0.05) {
      const normX = moveX / Math.max(1, inputLen);
      const normZ = moveZ / Math.max(1, inputLen);

      const worldMoveX = normX * Math.cos(cameraYaw) - normZ * Math.sin(cameraYaw);
      const worldMoveZ = normX * Math.sin(cameraYaw) + normZ * Math.cos(cameraYaw);

      playerGroup.position.x += worldMoveX * playerSpeed * delta;
      playerGroup.position.z += worldMoveZ * playerSpeed * delta;

      const targetAngle = Math.atan2(worldMoveX, worldMoveZ);
      
      let diff = targetAngle - currentFacingAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      currentFacingAngle += diff * Math.min(1, delta * 14);
      playerGroup.rotation.y = currentFacingAngle;

      // Walking arm swing & body stride
      walkCycle += delta * 10;
      playerGroup.position.y = Math.abs(Math.sin(walkCycle)) * 0.05;

      if (playerMeshBones && playerMeshBones.la && playerMeshBones.ra) {
        const swing = Math.sin(walkCycle) * 0.35;
        playerMeshBones.la.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2.8 + swing);
        playerMeshBones.ra.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2.8 - swing);
        playerMeshBones.mesh.skeleton.update();
      }
    } else {
      playerGroup.position.y = 0;
      if (playerMeshBones && playerMeshBones.la && playerMeshBones.ra) {
        playerMeshBones.la.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2.8);
        playerMeshBones.ra.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2.8);
        playerMeshBones.mesh.skeleton.update();
      }
    }

    playerGroup.position.x = Math.max(-HALL.width / 2 + 1.8, Math.min(HALL.width / 2 - 1.8, playerGroup.position.x));
    playerGroup.position.z = Math.max(-34, Math.min(34, playerGroup.position.z));

    const targetPos = playerGroup.position.clone().add(cameraTargetOffset);
    const camOffset = new THREE.Vector3(
      Math.sin(cameraYaw) * Math.cos(cameraPitch) * cameraDistance,
      Math.sin(cameraPitch) * cameraDistance,
      Math.cos(cameraYaw) * Math.cos(cameraPitch) * cameraDistance
    );
    const desiredCamPos = targetPos.clone().add(camOffset);
    camera.position.lerp(desiredCamPos, 0.2);
    camera.lookAt(targetPos);

    confettiMeshes.forEach(c => {
      if (c.life > 0) {
        c.mesh.position.x += c.vx;
        c.mesh.position.y += c.vy;
        c.mesh.position.z += c.vz;
        c.vy -= 0.006;
        c.mesh.rotation.x += c.rotX;
        c.mesh.rotation.y += c.rotY;
        c.life--;
        if (c.life <= 0) c.mesh.visible = false;
      }
    });

    gameState.interactionTarget = null;
    const px = playerGroup.position.x;
    const pz = playerGroup.position.z;

    for (const zone of zones) {
      const d = Math.hypot(px - zone.x, pz - zone.z);
      if (d < zone.radius) {
        gameState.interactionTarget = zone;
        break;
      }
    }

    if (gameState.interactionTarget) {
      interactPrompt.style.display = 'block';
      interactPrompt.textContent = `Bấm A: ${gameState.interactionTarget.prompt}`;
    } else {
      interactPrompt.style.display = 'none';
    }

    renderer.render(scene, camera);
  }

  animate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
