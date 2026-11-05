/**
 * 3D Third-Person Exploration Game: Đám Cưới Quân & My (Rạp Khủng 80 Triệu)
 * Built with Three.js (Roblox / PUBG Style Third-Person Camera)
 */

// --- 1. GAME STATE & AUDIO ---
let playerName = "Khách Quý";

const gameState = {
  quests: {
    gift: false,
    eat: false,
    ceremony: false
  },
  isCeremonyPlaying: false,
  giftAmount: "500.000 VNĐ",
  giftWishes: "Chúc Quân & My trăm năm hạnh phúc, đầu bạc răng long!",
  interactionTarget: null
};

// Voice audio clips
const audios = {
  mc_welcome: new Audio('assets/audio/mc_welcome.mp3'),
  mc_stage: new Audio('assets/audio/mc_stage.mp3'),
  mc_cake_wine: new Audio('assets/audio/mc_cake_wine.mp3'),
  mc_toast: new Audio('assets/audio/mc_toast.mp3')
};

// Web Audio API for Sound Effects
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
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
        gain.gain.setValueAtTime(0.2, now + idx * 0.1);
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

// --- 2. THREE.JS 3D ENGINE SETUP ---
function initGame() {
  const container = document.getElementById('game-container');
  const canvas = document.getElementById('gameCanvas');

  // Scene & Camera
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x18080f);
  scene.fog = new THREE.FogExp2(0x18080f, 0.015);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // --- LIGHTING (RẠP CƯỚI 80 TRIỆU LUNG LINH) ---
  const ambientLight = new THREE.AmbientLight(0xffeedd, 0.7);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
  dirLight.position.set(10, 25, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 100;
  dirLight.shadow.camera.left = -25;
  dirLight.shadow.camera.right = 25;
  dirLight.shadow.camera.top = 45;
  dirLight.shadow.camera.bottom = -45;
  scene.add(dirLight);

  // Stage Spotlight
  const stageSpot = new THREE.SpotLight(0xffd700, 2.5, 45, Math.PI / 4, 0.5);
  stageSpot.position.set(0, 15, -25);
  stageSpot.target.position.set(0, 2, -35);
  scene.add(stageSpot);
  scene.add(stageSpot.target);

  // --- 3D ENVIRONMENT: RẠP CƯỚI MIỀN BẮC HOÀNH TRÁNG ---
  const HALL = { width: 28, length: 80, height: 9 };

  // 1. Floor
  const floorGeo = new THREE.PlaneGeometry(HALL.width, HALL.length);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x240913,
    roughness: 0.3,
    metalness: 0.2
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // 2. Central Red Carpet (Thảm đỏ nhung dài chạy thẳng lên sân khấu)
  const carpetGeo = new THREE.PlaneGeometry(4.2, 70);
  const carpetMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    roughness: 0.8
  });
  const carpet = new THREE.Mesh(carpetGeo, carpetMat);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.02, 0);
  carpet.receiveShadow = true;
  scene.add(carpet);

  // Gold border strips along carpet
  const borderGeo = new THREE.BoxGeometry(0.15, 0.04, 70);
  const borderMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
  const bLeft = new THREE.Mesh(borderGeo, borderMat);
  bLeft.position.set(-2.15, 0.03, 0);
  const bRight = new THREE.Mesh(borderGeo, borderMat);
  bRight.position.set(2.15, 0.03, 0);
  scene.add(bLeft);
  scene.add(bRight);

  // 3. Flower Stands along red carpet
  const flowerGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8);
  const flowerPostMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const flowerHeadGeo = new THREE.SphereGeometry(0.35, 8, 8);
  const flowerHeadMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e });

  for (let z = -25; z <= 30; z += 9) {
    [-2.6, 2.6].forEach(x => {
      const post = new THREE.Mesh(flowerGeo, flowerPostMat);
      post.position.set(x, 0.6, z);
      post.castShadow = true;
      const head = new THREE.Mesh(flowerHeadGeo, flowerHeadMat);
      head.position.set(x, 1.25, z);
      scene.add(post);
      scene.add(head);
    });
  }

  // 4. Aluminum Truss Arches (Khung giàn truss nhôm 80 triệu)
  const trussMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
  for (let z = -32; z <= 35; z += 11) {
    const pLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, HALL.height, 0.4), trussMat);
    pLeft.position.set(-HALL.width / 2 + 0.5, HALL.height / 2, z);
    const pRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, HALL.height, 0.4), trussMat);
    pRight.position.set(HALL.width / 2 - 0.5, HALL.height / 2, z);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(HALL.width, 0.4, 0.4), trussMat);
    beam.position.set(0, HALL.height, z);
    scene.add(pLeft);
    scene.add(pRight);
    scene.add(beam);
  }

  // 5. Fabric Canopy (Trần lụa voan buông rủ)
  const canopyGeo = new THREE.PlaneGeometry(HALL.width - 1, HALL.length - 2, 8, 8);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0xfff1f2,
    side: THREE.DoubleSide,
    roughness: 0.7
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.rotation.x = Math.PI / 2;
  canopy.position.set(0, HALL.height - 0.2, 0);
  scene.add(canopy);

  // 6. Crystal Chandeliers (Đèn chùm pha lê dọc lối đi)
  const chandelierMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
  const crystalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });

  for (let z = -20; z <= 25; z += 15) {
    const chGroup = new THREE.Group();
    chGroup.position.set(0, HALL.height - 1.6, z);

    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2), chandelierMat);
    chGroup.add(rod);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 8, 16), chandelierMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.6;
    chGroup.add(ring);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      const cr = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 4), crystalMat);
      cr.position.set(Math.cos(a) * 0.9, -0.85, Math.sin(a) * 0.9);
      cr.rotation.x = Math.PI;
      chGroup.add(cr);
    }
    const pl = new THREE.PointLight(0xffdf88, 1.4, 16);
    pl.position.set(0, -0.6, 0);
    chGroup.add(pl);
    scene.add(chGroup);
  }

  // 7. Entrance Gate (Cổng hoa chào mừng ở Z = 34)
  const gateGroup = new THREE.Group();
  gateGroup.position.set(0, 0, 34);

  const arch = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.35, 8, 20, Math.PI), new THREE.MeshStandardMaterial({ color: 0xf43f5e }));
  arch.position.set(0, 2.5, 0);
  gateGroup.add(arch);

  const roseGeo = new THREE.DodecahedronGeometry(0.25);
  for (let a = 0; a <= Math.PI; a += Math.PI / 10) {
    const rose = new THREE.Mesh(roseGeo, new THREE.MeshStandardMaterial({ color: (a % 2 === 0) ? 0xfb7185 : 0xffffff }));
    rose.position.set(Math.cos(a) * 3.2, 2.5 + Math.sin(a) * 3.2, 0.1);
    gateGroup.add(rose);
  }

  // Gate Signboard
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 160;
  const sctx = signCanvas.getContext('2d');
  sctx.fillStyle = '#b91c1c';
  sctx.fillRect(0, 0, 512, 160);
  sctx.strokeStyle = '#ffd700';
  sctx.lineWidth = 8;
  sctx.strokeRect(4, 4, 504, 152);
  sctx.fillStyle = '#ffd700';
  sctx.font = 'bold 36px sans-serif';
  sctx.textAlign = 'center';
  sctx.fillText('LỄ THÀNH HÔN', 256, 55);
  sctx.fillStyle = '#ffffff';
  sctx.font = 'bold 44px sans-serif';
  sctx.fillText('QUÂN ❤️ MY', 256, 115);

  const signTex = new THREE.CanvasTexture(signCanvas);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 1.2),
    new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
  );
  signMesh.position.set(0, 4.4, 0);
  gateGroup.add(signMesh);
  scene.add(gateGroup);

  // 8. Reception Desk & Gift Box (Bàn lễ tân & Hòm tiền mừng ở Z = 31, X = 4)
  const deskGroup = new THREE.Group();
  deskGroup.position.set(4.2, 0, 31);

  const tableMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 1.0, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 })
  );
  tableMesh.position.y = 0.5;
  tableMesh.castShadow = true;
  deskGroup.add(tableMesh);

  const boxMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.6, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.2, metalness: 0.3 })
  );
  boxMesh.position.set(0, 1.3, 0);
  boxMesh.castShadow = true;
  deskGroup.add(boxMesh);

  const lockMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.15, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
  );
  lockMesh.position.set(0, 1.3, 0.28);
  deskGroup.add(lockMesh);

  const boxLabel = makeBillboardSprite("🧧 HÒM TIỀN MỪNG", "#ffd700");
  boxLabel.position.set(0, 2.1, 0);
  deskGroup.add(boxLabel);
  scene.add(deskGroup);

  // 9. Banquet Tables (8 bàn cỗ miền Bắc 6 người)
  const tablePositions = [
    { x: -6.5, z: 20 }, { x: 6.5, z: 20 },
    { x: -6.5, z: 7 },  { x: 6.5, z: 7 },
    { x: -6.5, z: -6 }, { x: 6.5, z: -6 },
    { x: -6.5, z: -19 }, { x: 6.5, z: -19 }
  ];

  tablePositions.forEach(pos => {
    const tGroup = new THREE.Group();
    tGroup.position.set(pos.x, 0, pos.z);

    const tbl = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.1, 0.85, 20),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
    );
    tbl.position.y = 0.42;
    tbl.castShadow = true;
    tbl.receiveShadow = true;
    tGroup.add(tbl);

    const runner = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.87, 20),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 })
    );
    runner.position.y = 0.43;
    tGroup.add(runner);

    const plateMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 12), plateMat);
    p1.position.set(-0.6, 0.88, 0.3);
    const xoi = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    xoi.position.set(-0.6, 0.95, 0.3);
    tGroup.add(p1); tGroup.add(xoi);

    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.08, 12), plateMat);
    p2.position.set(0.6, 0.88, -0.3);
    const ga = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfde047 }));
    ga.position.set(0.6, 0.98, -0.3);
    ga.scale.set(1.3, 0.7, 1);
    tGroup.add(p2); tGroup.add(ga);

    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.1, transparent: true, opacity: 0.85 })
    );
    bottle.position.set(0, 1.1, 0);
    tGroup.add(bottle);

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      const chair = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.38, 0.5, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      chair.position.set(Math.cos(a) * 2.8, 0.25, Math.sin(a) * 2.8);
      chair.castShadow = true;
      tGroup.add(chair);
      const bow = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.06), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      bow.position.set(Math.cos(a) * 3.1, 0.3, Math.sin(a) * 3.1);
      bow.rotation.y = a + Math.PI / 2;
      tGroup.add(bow);
    }

    scene.add(tGroup);
  });

  const tableLabel = makeBillboardSprite("🍗 MÂM CỖ MIỀN BẮC", "#fef08a");
  tableLabel.position.set(-6.5, 2.2, 7);
  scene.add(tableLabel);

  // 10. Grand Wedding Stage (Sân khấu đại lễ ở Z = -35)
  const stageGroup = new THREE.Group();
  stageGroup.position.set(0, 0, -35);

  const stageBase = new THREE.Mesh(
    new THREE.BoxGeometry(22, 1.0, 10),
    new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.5 })
  );
  stageBase.position.y = 0.5;
  stageBase.receiveShadow = true;
  stageBase.castShadow = true;
  stageGroup.add(stageBase);

  const stageTrim = new THREE.Mesh(
    new THREE.BoxGeometry(22.2, 0.15, 10.2),
    new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 })
  );
  stageTrim.position.y = 1.02;
  stageGroup.add(stageTrim);

  // Giant LED Screen
  const ledCanvas = document.createElement('canvas');
  ledCanvas.width = 1024;
  ledCanvas.height = 400;
  const lctx = ledCanvas.getContext('2d');
  
  function updateLedScreen(pulse = 0) {
    const grad = lctx.createLinearGradient(0, 0, 1024, 400);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#4c0519');
    grad.addColorStop(1, '#1e1b4b');
    lctx.fillStyle = grad;
    lctx.fillRect(0, 0, 1024, 400);

    lctx.strokeStyle = `hsl(${(pulse * 40) % 360}, 90%, 65%)`;
    lctx.lineWidth = 14;
    lctx.strokeRect(10, 10, 1004, 380);

    lctx.fillStyle = '#ffd700';
    lctx.font = 'bold 44px sans-serif';
    lctx.textAlign = 'center';
    lctx.fillText('TRĂM NĂM TÌNH VIÊN MÃN • HẠNH PHÚC TRỌN VẸN', 512, 90);

    lctx.fillStyle = '#ffffff';
    lctx.font = 'bold 72px sans-serif';
    lctx.fillText('CHÚ RỂ: QUÂN  ❤️  CÔ DÂU: MY', 512, 210);

    lctx.fillStyle = '#fbcfe8';
    lctx.font = 'italic 36px sans-serif';
    lctx.fillText('LỄ THÀNH HÔN — RẠP CƯỚI 80 TRIỆU HOÀNH TRÁNG', 512, 310);
  }
  updateLedScreen();

  const ledTex = new THREE.CanvasTexture(ledCanvas);
  const ledScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 7),
    new THREE.MeshBasicMaterial({ map: ledTex })
  );
  ledScreen.position.set(0, 5.0, -4.6);
  stageGroup.add(ledScreen);

  // Champagne Tower
  const champGroup = new THREE.Group();
  champGroup.position.set(-6.5, 1.0, 0);
  for (let l = 0; l < 4; l++) {
    const count = 4 - l;
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        const glass = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.04, 0.35, 6),
          new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, roughness: 0.1 })
        );
        glass.position.set((i - count / 2 + 0.5) * 0.35, l * 0.38 + 0.18, (j - count / 2 + 0.5) * 0.35);
        champGroup.add(glass);
      }
    }
  }
  stageGroup.add(champGroup);

  // 5-Tier Cake
  const cakeGroup = new THREE.Group();
  cakeGroup.position.set(6.5, 1.0, 0);
  [1.2, 0.95, 0.72, 0.5, 0.32].forEach((radius, idx) => {
    const tier = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, 0.35, 16),
      new THREE.MeshStandardMaterial({ color: (idx % 2 === 0) ? 0xffffff : 0xfbcfe8, roughness: 0.3 })
    );
    tier.position.y = idx * 0.36 + 0.18;
    cakeGroup.add(tier);
  });
  stageGroup.add(cakeGroup);
  scene.add(stageGroup);

  // --- 4. 3D CHARACTERS: MC, QUÂN, MY, PLAYER ---
  function buildHumanoid({ skinColor = 0xfde047, suitColor = 0x0f172a, hairColor = 0x1e293b, isDress = false }) {
    const group = new THREE.Group();

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.5 }));
    head.position.y = 1.6;
    head.castShadow = true;
    group.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: hairColor }));
    hair.position.y = 1.65;
    group.add(hair);

    let body;
    if (isDress) {
      body = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.25, 16), new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.3 }));
      body.position.y = 0.85;
      body.castShadow = true;
      group.add(body);
    } else {
      body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.4), new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.5 }));
      body.position.y = 1.05;
      body.castShadow = true;
      group.add(body);

      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.05), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
      tie.position.set(0, 1.15, 0.22);
      group.add(tie);
    }

    const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const armMat = new THREE.MeshStandardMaterial({ color: suitColor });
    
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.48, 1.0, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.48, 1.0, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    let leftLeg = null;
    let rightLeg = null;
    if (!isDress) {
      const legGeo = new THREE.BoxGeometry(0.24, 0.75, 0.24);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      leftLeg = new THREE.Mesh(legGeo, legMat);
      leftLeg.position.set(-0.2, 0.38, 0);
      leftLeg.castShadow = true;
      group.add(leftLeg);

      rightLeg = new THREE.Mesh(legGeo, legMat);
      rightLeg.position.set(0.2, 0.38, 0);
      rightLeg.castShadow = true;
      group.add(rightLeg);
    }

    return { group, head, body, leftArm, rightArm, leftLeg, rightLeg };
  }

  // MC on Stage
  const mcObj = buildHumanoid({ skinColor: 0xfcd34d, suitColor: 0x1e293b, hairColor: 0x0f172a });
  mcObj.group.position.set(-3.2, 1.0, -35);
  const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 }));
  mic.position.set(0, -0.2, 0.15);
  mic.rotation.x = Math.PI / 4;
  mcObj.rightArm.add(mic);

  const mcLabel = makeBillboardSprite("🎤 MC ĐÁM CƯỚI", "#ffd700");
  mcLabel.position.set(0, 2.4, 0);
  mcObj.group.add(mcLabel);
  scene.add(mcObj.group);

  // Groom Quân on Stage
  const groomObj = buildHumanoid({ skinColor: 0xfde047, suitColor: 0x020617, hairColor: 0x0f172a });
  groomObj.group.position.set(-0.8, 1.0, -35);
  const corsage = new THREE.Mesh(new THREE.SphereGeometry(0.08), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
  corsage.position.set(-0.2, 1.25, 0.22);
  groomObj.group.add(corsage);

  const groomLabel = makeBillboardSprite("🤵 CHÚ RỂ QUÂN", "#60a5fa");
  groomLabel.position.set(0, 2.4, 0);
  groomObj.group.add(groomLabel);
  scene.add(groomObj.group);

  // Bride My on Stage
  const brideObj = buildHumanoid({ skinColor: 0xfef08a, suitColor: 0xffffff, hairColor: 0x78350f, isDress: true });
  brideObj.group.position.set(1.2, 1.0, -35);
  const tiara = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 6, 12, Math.PI), new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 }));
  tiara.rotation.x = -Math.PI / 2;
  tiara.position.set(0, 2.05, 0);
  brideObj.group.add(tiara);

  const brideLabel = makeBillboardSprite("👰 CÔ DÂU MY", "#f472b6");
  brideLabel.position.set(0, 2.4, 0);
  brideObj.group.add(brideLabel);
  scene.add(brideObj.group);

  // Player Character
  const playerObj = buildHumanoid({ skinColor: 0xfde047, suitColor: 0x0284c7, hairColor: 0x1e293b });
  playerObj.group.position.set(0, 0, 31);
  scene.add(playerObj.group);

  let playerLabel = makeBillboardSprite(playerName, "#ffffff", "#0284c7");
  playerLabel.position.set(0, 2.4, 0);
  playerObj.group.add(playerLabel);

  function updatePlayerNameLabel(name) {
    playerObj.group.remove(playerLabel);
    playerLabel = makeBillboardSprite(name, "#ffffff", "#0284c7");
    playerLabel.position.set(0, 2.4, 0);
    playerObj.group.add(playerLabel);
  }

  // --- 5. 3D CONFETTI PARTICLES ---
  const confettiCount = 120;
  const confettiGeo = new THREE.PlaneGeometry(0.18, 0.18);
  const confettiColors = [0xef4444, 0xffd700, 0x3b82f6, 0x10b981, 0xec4899, 0xffffff];
  const confettiMeshes = [];

  for (let i = 0; i < confettiCount; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: confettiColors[i % confettiColors.length],
      side: THREE.DoubleSide
    });
    const c = new THREE.Mesh(confettiGeo, mat);
    c.position.set(0, -10, 0);
    c.visible = false;
    scene.add(c);
    confettiMeshes.push({
      mesh: c,
      vx: 0, vy: 0, vz: 0,
      rotX: Math.random() * 0.2,
      rotY: Math.random() * 0.2,
      life: 0
    });
  }

  function blastConfetti(originX = 0, originY = 3, originZ = -35) {
    confettiMeshes.forEach(c => {
      c.mesh.position.set(
        originX + (Math.random() - 0.5) * 6,
        originY + Math.random() * 2,
        originZ + (Math.random() - 0.5) * 6
      );
      c.vx = (Math.random() - 0.5) * 0.25;
      c.vy = Math.random() * 0.25 + 0.15;
      c.vz = (Math.random() - 0.5) * 0.25;
      c.life = 180;
      c.mesh.visible = true;
    });
  }

  function makeBillboardSprite(text, textColor = "#ffd700", bgColor = "rgba(0,0,0,0.6)") {
    const c = document.createElement('canvas');
    c.width = 384;
    c.height = 96;
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

  // --- 6. THIRD-PERSON CAMERA & CONTROLS (ROBLOX / PUBG TPP) ---
  let cameraYaw = 0;
  let cameraPitch = 0.25;
  const cameraDistance = 4.8;
  const cameraTargetOffset = new THREE.Vector3(0, 1.5, 0);

  const input = {
    stickX: 0,
    stickY: 0,
    keyW: false, keyA: false, keyS: false, keyD: false
  };

  const playerSpeed = 7.5;
  let walkCycle = 0;

  // Touch Swipe for Camera Rotation (Right 55% of screen)
  const cameraSwipeZone = document.getElementById('cameraSwipeZone');
  let isSwiping = false;
  let lastTouchX = 0;
  let lastTouchY = 0;

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
    cameraPitch = Math.max(-0.25, Math.min(1.0, cameraPitch));
  });

  const endSwipe = () => { isSwiping = false; };
  window.addEventListener('pointerup', endSwipe);
  window.addEventListener('pointercancel', endSwipe);

  // Virtual Joystick (Left zone)
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

  // Keyboard controls
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

  // --- 7. INTERACTION ZONES & UI HOOKS ---
  const zones = [
    { id: 'gate_gift', name: 'Hòm Mừng Hỷ', x: 4.2, z: 31, radius: 3.5, prompt: 'Bỏ phong bì mừng Quân & My' },
    { id: 'banquet', name: 'Mâm Cỗ Miền Bắc', x: -6.5, z: 7, radius: 4.0, prompt: 'Nếm cỗ 80 triệu & Cụng ly 1-2-3 Dô' },
    { id: 'stage_mc', name: 'Sân Khấu Lễ Thành Hôn', x: 0, z: -33, radius: 5.5, prompt: 'Dự Lễ Thành Hôn cùng MC & Quân - My' }
  ];

  const interactPrompt = document.getElementById('interactPrompt');
  const actionBtn = document.getElementById('actionBtn');

  actionBtn.addEventListener('click', () => {
    if (gameState.interactionTarget) {
      triggerInteraction(gameState.interactionTarget);
    }
  });

  // Welcome Modal
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
      blastConfetti(playerObj.group.position.x, 3, playerObj.group.position.z);
    });
  }

  // Modals
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
    blastConfetti(4.2, 3, 31);
    showDialogue("Bác Trưởng Ban Tiếp Đón", `Gia đình xin chân thành cảm ơn ${playerName}! Chúc bạn có một ngày dự tiệc thật vui vẻ cùng Quân & My!`);
  });

  document.getElementById('toastFeastBtn').addEventListener('click', () => {
    gameState.quests.eat = true;
    updateQuestUI();
    feastModal.style.display = 'none';
    playSound('clink');
    setTimeout(() => playSound('cheer'), 300);
    blastConfetti(-6.5, 3, 7);
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
    if (target.id === 'gate_gift') {
      giftModal.style.display = 'flex';
    } else if (target.id === 'banquet') {
      feastModal.style.display = 'flex';
    } else if (target.id === 'stage_mc') {
      startCeremonySequence();
    }
  }

  // MC Ceremony Sequence
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
        blastConfetti(0, 4, -35);
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
        blastConfetti(0, 4, -35);
        playSound('cheer');
      }
    }

    playStep();
  }

  // Dialogue Box
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
    if (avatarUrl) {
      dialogueAvatar.style.backgroundImage = `url('${avatarUrl}')`;
    }
    currentOnNext = onNext;
  }

  function closeDialogue() {
    dialogueBox.style.display = 'none';
  }

  dialogueNextBtn.addEventListener('click', () => {
    if (currentOnNext) currentOnNext();
    else closeDialogue();
  });

  // --- 8. MAIN ANIMATION LOOP ---
  const clock = new THREE.Clock();
  let timeTotal = 0;

  function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.1);
    timeTotal += delta;

    // Movement Vector
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

      playerObj.group.position.x += worldMoveX * playerSpeed * delta;
      playerObj.group.position.z += worldMoveZ * playerSpeed * delta;

      const targetAngle = Math.atan2(worldMoveX, worldMoveZ);
      playerObj.group.rotation.y = targetAngle;

      walkCycle += delta * 12;
      const legAngle = Math.sin(walkCycle) * 0.6;
      if (playerObj.leftLeg) {
        playerObj.leftLeg.rotation.x = legAngle;
        playerObj.rightLeg.rotation.x = -legAngle;
      }
      playerObj.leftArm.rotation.x = -legAngle * 0.8;
      playerObj.rightArm.rotation.x = legAngle * 0.8;
    } else {
      if (playerObj.leftLeg) {
        playerObj.leftLeg.rotation.x = 0;
        playerObj.rightLeg.rotation.x = 0;
      }
      playerObj.leftArm.rotation.x = 0;
      playerObj.rightArm.rotation.x = 0;
    }

    playerObj.group.position.x = Math.max(-HALL.width / 2 + 1.5, Math.min(HALL.width / 2 - 1.5, playerObj.group.position.x));
    playerObj.group.position.z = Math.max(-36, Math.min(36, playerObj.group.position.z));

    // Third-person camera tracking
    const targetPos = playerObj.group.position.clone().add(cameraTargetOffset);

    const camOffset = new THREE.Vector3(
      Math.sin(cameraYaw) * Math.cos(cameraPitch) * cameraDistance,
      Math.sin(cameraPitch) * cameraDistance,
      Math.cos(cameraYaw) * Math.cos(cameraPitch) * cameraDistance
    );

    const desiredCamPos = targetPos.clone().add(camOffset);
    camera.position.lerp(desiredCamPos, 0.2);
    camera.lookAt(targetPos);

    // MC arm wave
    const mcWave = Math.sin(timeTotal * 4) * 0.35;
    mcObj.rightArm.rotation.x = -0.6 + mcWave;

    // LED Screen pulse
    updateLedScreen(timeTotal);
    ledTex.needsUpdate = true;

    // Confetti particles
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

    // Proximity check
    gameState.interactionTarget = null;
    const px = playerObj.group.position.x;
    const pz = playerObj.group.position.z;

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

// Start game
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
