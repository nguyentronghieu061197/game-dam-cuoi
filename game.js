/**
 * Ultra-Optimized Grand 3D Wedding Simulation & Multiplayer Metaverse (Rạp Cưới 80 Triệu Miền Bắc)
 * - Multi-user Realtime Networking via WebSockets (Node.js backend)
 * - Emotion Reaction Picker (💖, 🥂, 👏, 🌹, 🎉, 💌, 🥰, 🥳, 👰, 🤵, 🍻, 💯) with 3D Floating Reaction Bursts
 * - Comic Speech Bubbles over Avatar Heads synchronized across all players
 * - Gender Selection: 🤵 Nam (Vest) / 👗 Nữ (Đầm Dạ Hội)
 * - Prominent Bride My (White Wedding Gown & Veil) & Groom Quân (Rose Boutonniere)
 * - Authentic Northern Vietnamese Male MC Voice (Nam Minh Neural)
 * - Seated Banquet Guests on Chiavari Chairs
 * - Silky-Smooth 60 FPS Mobile Performance
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

function poseFormalStanding(model) {
  const mesh = model.getObjectByName('H_DDS_HighRes');
  if (!mesh || !mesh.skeleton) return;
  const la = mesh.skeleton.bones.find(b => b.name === 'LeftArm');
  const ra = mesh.skeleton.bones.find(b => b.name === 'RightArm');
  if (la) la.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2.8);
  if (ra) ra.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2.8);
  mesh.skeleton.update();
}

function freezeMeshGraph(obj) {
  obj.matrixAutoUpdate = false;
  obj.updateMatrix();
  obj.traverse(child => {
    child.matrixAutoUpdate = false;
    child.updateMatrix();
    if (child.isSkinnedMesh && child.skeleton) {
      child.skeleton.bones.forEach(b => {
        b.matrixAutoUpdate = false;
        b.updateMatrix();
      });
    }
  });
}

let playerName = "Khách Quý";
let playerGender = "male";

const gameState = {
  quests: { gift: false, eat: false, ceremony: false },
  isCeremonyPlaying: false,
  giftAmount: "500.000 VNĐ",
  giftWishes: "Chúc Quân & My trăm năm hạnh phúc, đầu bạc răng long!",
  interactionTarget: null
};

// Studio-Grade Northern Vietnamese Male MC Voice & Classic Hà Tây Wedding Organ Live BGM
const audios = {
  mc_welcome: new Audio('assets/audio/mc_welcome.mp3'),
  mc_stage: new Audio('assets/audio/mc_stage.mp3'),
  mc_cake_wine: new Audio('assets/audio/mc_cake_wine.mp3'),
  mc_toast: new Audio('assets/audio/mc_toast.mp3')
};

const bgm = new Audio('assets/audio/wedding_bgm_hatay.mp3');
bgm.loop = true;
bgm.volume = 0.38; // Upbeat background level perfectly balanced under MC voice
let isBgmPlaying = false;

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

function createBallroomFloorTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#141416';
  ctx.fillRect(0, 0, 512, 512);

  const tileSize = 256;
  for (let x = 0; x < 512; x += tileSize) {
    for (let y = 0; y < 512; y += tileSize) {
      ctx.fillStyle = '#1c1c20';
      ctx.fillRect(x + 4, y + 4, tileSize - 8, tileSize - 8);

      ctx.strokeStyle = '#c5a059';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x + 14, y + 14, tileSize - 28, tileSize - 28);

      ctx.fillStyle = '#c5a059';
      ctx.fillRect(x + 14, y + 14, 16, 16);
      ctx.fillRect(x + tileSize - 30, y + 14, 16, 16);
      ctx.fillRect(x + 14, y + tileSize - 30, 16, 16);
      ctx.fillRect(x + tileSize - 30, y + tileSize - 30, 16, 16);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 14);
  tex.needsUpdate = true;
  return tex;
}

function initGame() {
  const canvas = document.getElementById('gameCanvas');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14060e);
  scene.fog = new THREE.FogExp2(0x14060e, 0.009);

  const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 150);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  window.__renderer = renderer;
  renderer.setSize(window.innerWidth, window.innerHeight);

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 1.25));
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Lighting
  const hemiLight = new THREE.HemisphereLight(0xfff7ed, 0x2e080e, 1.35);
  scene.add(hemiLight);

  const ambLight = new THREE.AmbientLight(0xffedd5, 1.1);
  scene.add(ambLight);

  const dirLight = new THREE.DirectionalLight(0xfffaea, 1.35);
  dirLight.position.set(8, 20, 10);
  scene.add(dirLight);

  const camLight = new THREE.DirectionalLight(0xfffaea, 1.05);
  camera.add(camLight);
  scene.add(camera);

  // Dedicated Stage Spotlight shining on Bride & Groom
  const stageSpot = new THREE.SpotLight(0xffdf88, 3.5, 40, Math.PI / 4, 0.5);
  stageSpot.position.set(0, 12, -18);
  stageSpot.target.position.set(0, 1.5, -24);
  scene.add(stageSpot);
  scene.add(stageSpot.target);

  // Rạp Cưới 80 Triệu Architecture
  const HALL = { width: 28, length: 76, height: 5.6 };

  // 1. Floor
  const floorTex = createBallroomFloorTexture();
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.22,
    metalness: 0.18
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALL.width, HALL.length), floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // 2. Velvet Crimson Carpet
  const texLoader = new THREE.TextureLoader();
  const carpetTex = texLoader.load('assets/images/velvet_carpet_hires.png');
  carpetTex.wrapS = THREE.RepeatWrapping;
  carpetTex.wrapT = THREE.RepeatWrapping;
  carpetTex.repeat.set(1, 16);

  const carpetMat = new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.75 });
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 68), carpetMat);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.02, 0);
  scene.add(carpet);

  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.92, roughness: 0.18 });
  const bLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 68), goldMat);
  bLeft.position.set(-2.45, 0.035, 0);
  const bRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 68), goldMat);
  bRight.position.set(2.45, 0.035, 0);
  scene.add(bLeft); scene.add(bRight);

  // 3. Perimeter Curtains
  const curtainMat = new THREE.MeshStandardMaterial({ color: 0xfffcf5, side: THREE.DoubleSide, roughness: 0.85 });
  const valanceMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, side: THREE.DoubleSide, roughness: 0.65 });

  [-HALL.width / 2 + 0.2, HALL.width / 2 - 0.2].forEach((wallX, idx) => {
    const cGeo = new THREE.PlaneGeometry(HALL.length, HALL.height, 48, 1);
    const pos = cGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      pos.setZ(i, Math.sin(u * 8) * 0.14);
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

  // 4. Ceiling Silk Swags
  const pinkSilkMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, side: THREE.DoubleSide, roughness: 0.68 });
  const whiteSilkMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.68 });

  for (let z = -26; z <= 28; z += 3.5) {
    const isPink = (Math.round(Math.abs(z)) % 2 === 0);
    const mat = isPink ? pinkSilkMat : whiteSilkMat;

    const swagGeo = new THREE.PlaneGeometry(HALL.width, 3.2, 24, 1);
    const pos = swagGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const normalizedX = x / (HALL.width / 2);
      const sag = Math.cos(normalizedX * Math.PI / 2) * 0.72;
      pos.setZ(i, sag);
    }
    swagGeo.computeVertexNormals();

    const swag = new THREE.Mesh(swagGeo, mat);
    swag.position.set(0, HALL.height - 0.5, z);
    swag.rotation.x = Math.PI / 2;
    scene.add(swag);
  }

  // 5. Fairy Lights Points
  const fairyPointsGeo = new THREE.BufferGeometry();
  const fairyPositions = [];
  for (let z = -26; z <= 28; z += 1.8) {
    for (let x = -HALL.width / 2 + 1.5; x <= HALL.width / 2 - 1.5; x += 1.2) {
      const normalizedX = x / (HALL.width / 2);
      const sag = Math.cos(normalizedX * Math.PI / 2) * 0.72;
      fairyPositions.push(x, HALL.height - 0.5 - sag, z);
    }
  }
  fairyPointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(fairyPositions, 3));
  const fairyPointsMat = new THREE.PointsMaterial({ color: 0xffecb3, size: 0.12, sizeAttenuation: true });
  const fairyPoints = new THREE.Points(fairyPointsGeo, fairyPointsMat);
  scene.add(fairyPoints);

  // 6. Chandeliers
  const chandelierMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, metalness: 0.95, roughness: 0.1,
    emissive: 0x553300, emissiveIntensity: 0.4
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.9,
    emissive: 0xffe8aa, emissiveIntensity: 0.6
  });

  function makeOptimizedChandelier(scale = 1.0) {
    const chGroup = new THREE.Group();
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * scale, 0.03 * scale, 1.4 * scale), chandelierMat);
    rod.position.y = 0.7 * scale;
    chGroup.add(rod);

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.3 * scale, 0.07 * scale, 6, 18), chandelierMat);
    ring1.rotation.x = Math.PI / 2;
    chGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.75 * scale, 0.06 * scale, 6, 16), chandelierMat);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = -0.5 * scale;
    chGroup.add(ring2);

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
      const cr = new THREE.Mesh(new THREE.ConeGeometry(0.09 * scale, 0.45 * scale, 4), crystalMat);
      cr.position.set(Math.cos(a) * 1.3 * scale, -0.25 * scale, Math.sin(a) * 1.3 * scale);
      cr.rotation.x = Math.PI;
      chGroup.add(cr);
    }
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const cr = new THREE.Mesh(new THREE.ConeGeometry(0.08 * scale, 0.38 * scale, 4), crystalMat);
      cr.position.set(Math.cos(a) * 0.75 * scale, -0.75 * scale, Math.sin(a) * 0.75 * scale);
      cr.rotation.x = Math.PI;
      chGroup.add(cr);
    }
    return chGroup;
  }

  for (let z = -18; z <= 22; z += 10.0) {
    const ch = makeOptimizedChandelier(1.0);
    ch.position.set(0, 3.8, z);
    scene.add(ch);
  }

  [-7.4, 7.4].forEach(cx => {
    for (let z = -13; z <= 18; z += 10.5) {
      const ch = makeOptimizedChandelier(0.72);
      ch.position.set(cx, 4.0, z);
      scene.add(ch);
    }
  });

  // 7. Planters & Floral Hedges
  const floralTex = texLoader.load('assets/images/floral_cluster_hires.png');
  const orchidTex = texLoader.load('assets/images/orchid_spray_hires.png');

  const floralClusterMat = new THREE.MeshStandardMaterial({
    map: floralTex,
    transparent: true,
    alphaTest: 0.25,
    roughness: 0.55,
    side: THREE.DoubleSide
  });

  const orchidMat = new THREE.MeshStandardMaterial({
    map: orchidTex,
    transparent: true,
    alphaTest: 0.25,
    roughness: 0.45,
    side: THREE.DoubleSide
  });

  [-2.85, 2.85].forEach(hx => {
    for (let z = -22; z <= 25; z += 2.8) {
      const hedgeGroup = new THREE.Group();
      hedgeGroup.position.set(hx, 0, z);

      const bush = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 2.7), new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 }));
      bush.position.y = 0.175;
      hedgeGroup.add(bush);

      const q1 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.75), floralClusterMat);
      q1.position.y = 0.4;
      hedgeGroup.add(q1);

      const q2 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.75), floralClusterMat);
      q2.position.y = 0.4;
      q2.rotation.y = Math.PI / 2;
      hedgeGroup.add(q2);

      scene.add(hedgeGroup);
    }
  });

  function makeElevatedFloralPedestal(height = 1.35) {
    const postGroup = new THREE.Group();
    const pw = 0.36;
    const legGeo = new THREE.CylinderGeometry(0.016, 0.016, height, 6);
    [[-pw/2, -pw/2], [pw/2, -pw/2], [-pw/2, pw/2], [pw/2, pw/2]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, goldMat);
      leg.position.set(lx, height / 2, lz);
      postGroup.add(leg);
    });
    [0.02, height].forEach(ry => {
      const rim = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.03, 0.02, pw + 0.03), goldMat);
      rim.position.y = ry;
      postGroup.add(rim);
    });

    const topArr = new THREE.Group();
    topArr.position.y = height + 0.25;

    const tq1 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), floralClusterMat);
    topArr.add(tq1);
    const tq2 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), floralClusterMat);
    tq2.rotation.y = Math.PI / 2;
    topArr.add(tq2);

    const oPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.95), orchidMat);
    oPlane.position.set(0, -0.35, 0.22);
    topArr.add(oPlane);

    postGroup.add(topArr);
    return postGroup;
  }

  for (let z = -20; z <= 24; z += 8.0) {
    [-2.85, 2.85].forEach((x, xidx) => {
      const pedestal = makeElevatedFloralPedestal(1.35);
      pedestal.position.set(x, 0, z);
      pedestal.rotation.y = xidx === 0 ? Math.PI / 4 : -Math.PI / 4;
      scene.add(pedestal);
    });
  }

  // 8. Easel Stand with Wedding Portrait
  const photoTexture = texLoader.load('assets/images/wedding_concept_stage.jpg');
  const easelGroup = new THREE.Group();
  easelGroup.position.set(-3.6, 0, 26);
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

  // 9. Reception Desk & Gift Box
  const deskGroup = new THREE.Group();
  deskGroup.position.set(4.0, 0, 26);

  const tableMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 1.2), new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 }));
  tableMesh.position.y = 0.5;
  deskGroup.add(tableMesh);

  const deskTrim = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.08, 1.24), goldMat);
  deskTrim.position.y = 0.98;
  deskGroup.add(deskTrim);

  const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.5), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.2, metalness: 0.3 }));
  boxMesh.position.set(0, 1.3, 0);
  deskGroup.add(boxMesh);

  const lockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.05), goldMat);
  lockMesh.position.set(0, 1.3, 0.28);
  deskGroup.add(lockMesh);

  const boxLabel = makeBillboardSprite("🧧 HÒM TIỀN MỪNG", "#ffd700");
  boxLabel.position.set(0, 2.1, 0);
  deskGroup.add(boxLabel);
  scene.add(deskGroup);

  // 10. SÂN KHẤU ĐẠI LỄ THÀNH HÔN (AT Z = -24)
  const stageGroup = new THREE.Group();
  stageGroup.position.set(0, 0, -24);

  const stageBase = new THREE.Mesh(new THREE.BoxGeometry(24, 1.0, 9.0), new THREE.MeshStandardMaterial({ color: 0x520005, roughness: 0.6 }));
  stageBase.position.y = 0.5;
  stageGroup.add(stageBase);

  [0.75, 0.50, 0.25].forEach((sy, sidx) => {
    const step = new THREE.Mesh(new THREE.BoxGeometry(9.0 - sidx * 1.5, 0.25, 0.95), new THREE.MeshStandardMaterial({ color: 0x610006 }));
    step.position.set(0, sy - 0.125, 4.5 + (sidx + 1) * 0.9);
    stageGroup.add(step);
  });

  const stageTrim = new THREE.Mesh(new THREE.BoxGeometry(24.2, 0.12, 9.2), goldMat);
  stageTrim.position.y = 1.0;
  stageGroup.add(stageTrim);

  // High-Resolution Widescreen LED Screen
  const stageScreenTex = texLoader.load('assets/images/stage_screen_hires.png');
  const ledScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(21, 8.5),
    new THREE.MeshBasicMaterial({ map: stageScreenTex })
  );
  ledScreen.position.set(0, 5.25, -4.2);
  stageGroup.add(ledScreen);

  // Black Starcloth Wings
  const starClothMat = new THREE.MeshStandardMaterial({ color: 0x08080c, roughness: 0.95 });
  [-11.6, 11.6].forEach(sx => {
    const starWing = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 8.5), starClothMat);
    starWing.position.set(sx, 5.1, -4.3);
    stageGroup.add(starWing);
  });

  // Two Floral Arch Alcoves
  [-9.2, 9.2].forEach(ax => {
    const archGroup = new THREE.Group();
    archGroup.position.set(ax, 1.0, -3.8);

    const alcoveArch = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.12, 6, 16, Math.PI), goldMat);
    alcoveArch.position.set(0, 3.6, 0);
    archGroup.add(alcoveArch);

    [-1.7, 1.7].forEach(px => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.6), goldMat);
      p.position.set(px, 1.8, 0);
      archGroup.add(p);
    });

    for (let f = 0; f < 8; f++) {
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.24, 5, 5), new THREE.MeshStandardMaterial({ color: f % 2 === 0 ? 0xfbcfe8 : 0xffffff }));
      fl.position.set(Math.cos(f) * 1.7, 1.8 + f * 0.35, 0.1);
      archGroup.add(fl);
    }

    const miniCh = makeOptimizedChandelier(0.48);
    miniCh.position.set(0, 3.4, 0);
    archGroup.add(miniCh);

    stageGroup.add(archGroup);
  });

  // Champagne Pyramid Tower
  const champGroup = new THREE.Group();
  champGroup.position.set(-5.8, 1.0, 0);
  for (let l = 0; l < 4; l++) {
    const count = 4 - l;
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        const glass = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.04, 0.32, 6),
          new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, roughness: 0.1 })
        );
        glass.position.set((i - count / 2 + 0.5) * 0.32, l * 0.35 + 0.16, (j - count / 2 + 0.5) * 0.32);
        champGroup.add(glass);
      }
    }
  }
  stageGroup.add(champGroup);

  // 5-Tier Wedding Cake
  const cakeGroup = new THREE.Group();
  cakeGroup.position.set(5.8, 1.0, 0);
  [1.1, 0.88, 0.66, 0.45, 0.28].forEach((radius, idx) => {
    const tier = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, 0.32, 16),
      new THREE.MeshStandardMaterial({ color: idx % 2 === 0 ? 0xffffff : 0xfbcfe8, roughness: 0.3 })
    );
    tier.position.y = idx * 0.33 + 0.16;
    cakeGroup.add(tier);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.035, 4, 16), goldMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = idx * 0.33 + 0.32;
    cakeGroup.add(rim);
  });
  stageGroup.add(cakeGroup);

  scene.add(stageGroup);

  // Banquet Tables & Seated Guests
  const gltfLoader = new THREE.GLTFLoader();
  gltfLoader.setMeshoptDecoder(MeshoptDecoder);

  function loadGltfAsync(url) {
    return new Promise((resolve, reject) => {
      gltfLoader.load(url, resolve, undefined, reject);
    });
  }

  const tablePositions = [];
  const zCoords = [14, 2, -10];
  zCoords.forEach((z, idx) => {
    tablePositions.push({ x: -7.4, z: z, capacity: 8, occupied: (idx === 1 ? 6 : 5) });
    tablePositions.push({ x: 7.4, z: z, capacity: 8, occupied: (idx === 1 ? 6 : 5) });
  });

  const bgTablePositions = [
    { x: -7.4, z: 24 }, { x: 7.4, z: 24 },
    { x: -7.4, z: -18 }, { x: 7.4, z: -18 }
  ];

  const chairMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.88, roughness: 0.22 });
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });

  function makeChiavariChair() {
    const chair = new THREE.Group();
    const baseFrame = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.45, 0.44), chairMat);
    baseFrame.position.y = 0.225;
    chair.add(baseFrame);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.46), cushionMat);
    seat.position.y = 0.46;
    chair.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.035), chairMat);
    back.position.set(0, 0.72, 0.2);
    chair.add(back);
    return chair;
  }

  // Local Player Container on Red Carpet (Spawn at Z = 2)
  const playerGroup = new THREE.Group();
  playerGroup.position.set(0, 0, 2);
  scene.add(playerGroup);

  let playerMeshBones = null;
  let initialLegQuats = null;
  let playerLabel = makeBillboardSprite(playerName, "#ffffff", "#0284c7");
  playerLabel.position.set(0, 2.08, 0);
  playerGroup.add(playerLabel);

  function updatePlayerNameLabel(name) {
    playerGroup.remove(playerLabel);
    playerLabel = makeBillboardSprite(name, "#ffffff", "#0284c7");
    playerLabel.position.set(0, 2.08, 0);
    playerGroup.add(playerLabel);
  }

  // Floating Speech Bubble for Chat (Tin nhắn hiển thị trên đầu nhân vật)
  const activeBubbles = new Map(); // group -> { sprite, timeout }

  function showSpeechBubble(targetGroup, text) {
    if (activeBubbles.has(targetGroup)) {
      const b = activeBubbles.get(targetGroup);
      targetGroup.remove(b.sprite);
      clearTimeout(b.timeout);
    }
    const bubble = makeSpeechBubbleSprite(text);
    bubble.position.set(0, 2.62, 0);
    targetGroup.add(bubble);

    const t = setTimeout(() => {
      targetGroup.remove(bubble);
      activeBubbles.delete(targetGroup);
    }, 6000);

    activeBubbles.set(targetGroup, { sprite: bubble, timeout: t });
  }

  function makeSpeechBubbleSprite(text) {
    const c = document.createElement('canvas');
    c.width = 640; c.height = 160;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    ctx.roundRect ? ctx.roundRect(16, 12, 608, 100, 20) : ctx.fillRect(16, 12, 608, 100);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(300, 112);
    ctx.lineTo(320, 148);
    ctx.lineTo(340, 112);
    ctx.fill();

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 320, 62);

    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.SpriteMaterial({ map: tex });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(3.4, 0.85, 1);
    return sp;
  }

  // 3D Floating Emotion Reactions (Hiệu ứng cảm xúc bay lên từ đầu nhân vật)
  const floatingReactions = [];

  function spawnFloatingReaction(targetGroup, emoji) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.font = '72px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 64, 64);

    const tex = new THREE.CanvasTexture(c);
    const count = 3;
    for (let i = 0; i < count; i++) {
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 1.0 });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(0.8, 0.8, 1);
      
      const offsetX = (Math.random() - 0.5) * 0.8;
      const offsetZ = (Math.random() - 0.5) * 0.8;
      sp.position.set(
        targetGroup.position.x + offsetX,
        targetGroup.position.y + 2.4 + i * 0.35,
        targetGroup.position.z + offsetZ
      );
      scene.add(sp);

      floatingReactions.push({
        sprite: sp,
        vx: (Math.random() - 0.5) * 0.02,
        vy: 0.035 + Math.random() * 0.025,
        vz: (Math.random() - 0.5) * 0.02,
        life: 1.0,
        decay: 0.016
      });
    }

    if (emoji === '🥂' || emoji === '🍻') playSound('clink');
    else if (emoji === '🎉' || emoji === '👏') playSound('cheer');
    else playSound('coin');
  }

  // Groom, Bride & MC containers on Stage
  const groomGroup = new THREE.Group();
  groomGroup.position.set(-0.8, 1.0, -24);
  scene.add(groomGroup);
  const groomLabel = makeBillboardSprite("🤵 CHÚ RỂ QUÂN", "#60a5fa");
  groomLabel.position.set(0, 2.9, 0);
  groomGroup.add(groomLabel);

  const brideGroup = new THREE.Group();
  brideGroup.position.set(1.0, 1.0, -24);
  scene.add(brideGroup);
  const brideLabel = makeBillboardSprite("👰 CÔ DÂU MY", "#f472b6");
  brideLabel.position.set(0, 2.8, 0);
  brideGroup.add(brideLabel);

  const mcGroup = new THREE.Group();
  mcGroup.position.set(-3.2, 1.0, -24);
  scene.add(mcGroup);
  const mcMic = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 }));
  mcMic.position.set(0.35, 1.3, 0.3);
  mcMic.rotation.x = Math.PI / 4;
  mcGroup.add(mcMic);
  const mcLabel = makeBillboardSprite("🎤 MC ĐÁM CƯỚI", "#ffd700");
  mcLabel.position.set(0, 2.9, 0);
  mcGroup.add(mcLabel);

  // Avatar Templates
  let avatarTemplates = { male: null, female: null, elder: null };

  // Multiplayer Remote Players Map: playerId -> { group, model, label, targetX, targetZ, targetRotY, isWalking, bones }
  const remotePlayers = new Map();

  Promise.all([
    loadGltfAsync('assets/models/avatars/Asian_M_1_Busi.glb'),
    loadGltfAsync('assets/models/avatars/Asian_F_1_Busi.glb'),
    loadGltfAsync('assets/models/avatars/Asian_M_2_Busi.glb')
  ]).then(([m1Gltf, f1Gltf, m2Gltf]) => {
    avatarTemplates.male = m1Gltf.scene;
    avatarTemplates.female = f1Gltf.scene;
    avatarTemplates.elder = m2Gltf.scene;

    // 1. Setup Local Player Avatar
    setupPlayerAvatar();

    // 2. Setup Groom Quân on Stage
    const groomModel = cloneSkinnedGltf(avatarTemplates.male);
    groomModel.scale.set(1.35, 1.35, 1.35);

    const boutonniere = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    boutonniere.position.set(0.18, 1.35, 0.22);
    groomModel.add(boutonniere);

    poseFormalStanding(groomModel);
    freezeMeshGraph(groomModel);
    groomGroup.add(groomModel);

    // 3. Setup Bride My on Stage (VÁY CƯỚI TRẮNG BỒNG BỀNH & KHĂN VOAN CÔ DÂU!)
    const brideModel = cloneSkinnedGltf(avatarTemplates.female);
    brideModel.scale.set(1.3, 1.3, 1.3);
    brideModel.traverse(child => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.color = new THREE.Color(0xffffff);
      }
    });

    const skirtGeo = new THREE.CylinderGeometry(0.38, 1.45, 1.25, 24);
    const skirtMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.08
    });
    const skirt = new THREE.Mesh(skirtGeo, skirtMat);
    skirt.position.set(0, 0.62, 0);
    brideModel.add(skirt);

    const veilGeo = new THREE.PlaneGeometry(0.85, 1.6);
    const veilMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      side: THREE.DoubleSide
    });
    const veil = new THREE.Mesh(veilGeo, veilMat);
    veil.position.set(0, 1.45, -0.22);
    veil.rotation.x = -0.15;
    brideModel.add(veil);

    poseFormalStanding(brideModel);
    freezeMeshGraph(brideModel);
    brideGroup.add(brideModel);

    // 4. Setup MC on Stage
    const mcModel = cloneSkinnedGltf(avatarTemplates.elder);
    mcModel.scale.set(1.35, 1.35, 1.35);
    poseFormalStanding(mcModel);
    freezeMeshGraph(mcModel);
    mcGroup.add(mcModel);

    const dressColors = [0xdc2626, 0xec4899, 0x2563eb, 0x059669, 0xd97706, 0x7c3aed, 0xdb2777];

    // 5. Build 6 Tables with Seated Guests
    tablePositions.forEach((pos, tableIdx) => {
      const tGroup = new THREE.Group();
      tGroup.position.set(pos.x, 0, pos.z);

      const tbl = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 0.8, 16),
        new THREE.MeshStandardMaterial({ color: 0xfffcf5, roughness: 0.5 })
      );
      tbl.position.y = 0.4;
      tGroup.add(tbl);

      const susan = new THREE.Mesh(
        new THREE.CylinderGeometry(1.25, 1.25, 0.04, 16),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, roughness: 0.1 })
      );
      susan.position.y = 0.82;
      tGroup.add(susan);

      const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.35, 8), goldMat);
      vase.position.y = 1.0;
      tGroup.add(vase);
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), new THREE.MeshStandardMaterial({ color: 0xfbcfe8 }));
      fl.position.y = 1.28;
      tGroup.add(fl);

      const plateMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 12), plateMat);
      p1.position.set(-0.55, 0.85, 0.28);
      const xoi = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.07, 12), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
      xoi.position.set(-0.55, 0.9, 0.28);
      tGroup.add(p1); tGroup.add(xoi);

      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 12), plateMat);
      p2.position.set(0.55, 0.85, -0.28);
      const ga = new THREE.Mesh(new THREE.SphereGeometry(0.26, 6, 6), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 }));
      ga.scale.set(1.3, 0.7, 1);
      ga.position.set(0.55, 0.93, -0.28);
      tGroup.add(p2); tGroup.add(ga);

      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.45, 6),
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
          let guestTmpl = avatarTemplates.male;
          const isWoman = (i % 3 === 1);
          const isElder = (i % 3 === 2);
          if (isWoman) guestTmpl = avatarTemplates.female;
          else if (isElder) guestTmpl = avatarTemplates.elder;

          const guest = cloneSkinnedGltf(guestTmpl);
          guest.scale.set(1.2, 1.2, 1.2);
          guest.position.set(cx, -0.35, cz);
          guest.rotation.y = -angle - Math.PI / 2;

          guest.traverse(child => {
            if (child.isMesh) {
              if (isWoman && child.material) {
                child.material = child.material.clone();
                const dCol = dressColors[(tableIdx + i) % dressColors.length];
                child.material.color = new THREE.Color(dCol);
              }
            }
          });

          poseFormalStanding(guest);
          freezeMeshGraph(guest);
          tGroup.add(guest);
        }
      }

      scene.add(tGroup);
    });

    // Render background dining tables
    bgTablePositions.forEach(bpos => {
      const btGroup = new THREE.Group();
      btGroup.position.set(bpos.x, 0, bpos.z);

      const btbl = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 0.8, 16),
        new THREE.MeshStandardMaterial({ color: 0xfffcf5, roughness: 0.5 })
      );
      btbl.position.y = 0.4;
      btGroup.add(btbl);

      const bsusan = new THREE.Mesh(
        new THREE.CylinderGeometry(1.25, 1.25, 0.04, 16),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, roughness: 0.1 })
      );
      bsusan.position.y = 0.82;
      btGroup.add(bsusan);

      const bvase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.35, 8), goldMat);
      bvase.position.y = 1.0;
      btGroup.add(bvase);
      const bfl = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), new THREE.MeshStandardMaterial({ color: 0xfbcfe8 }));
      bfl.position.y = 1.28;
      btGroup.add(bfl);

      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const chair = makeChiavariChair();
        chair.position.set(Math.cos(angle) * 2.8, 0, Math.sin(angle) * 2.8);
        chair.rotation.y = -angle - Math.PI / 2;
        btGroup.add(chair);
      }
      scene.add(btGroup);
    });

    // Initialize multiplayer connection once templates are ready
    initMultiplayer();
  });

  let currentPlayerModel = null;

  function setupPlayerAvatar() {
    if (!avatarTemplates.male || !avatarTemplates.female) return;

    if (currentPlayerModel) {
      playerGroup.remove(currentPlayerModel);
      currentPlayerModel = null;
    }

    const tmpl = (playerGender === 'female') ? avatarTemplates.female : avatarTemplates.male;
    const model = cloneSkinnedGltf(tmpl);
    model.scale.set(1.35, 1.35, 1.35);

    poseFormalStanding(model);
    playerGroup.add(model);
    currentPlayerModel = model;

    const pMesh = model.getObjectByName('H_DDS_HighRes');
    if (pMesh && pMesh.skeleton) {
      const lul = pMesh.skeleton.bones.find(b => b.name === 'LeftUpLeg');
      const rul = pMesh.skeleton.bones.find(b => b.name === 'RightUpLeg');
      initialLegQuats = {
        lul: lul ? lul.quaternion.clone() : new THREE.Quaternion(),
        rul: rul ? rul.quaternion.clone() : new THREE.Quaternion()
      };
      playerMeshBones = {
        mesh: pMesh,
        la: pMesh.skeleton.bones.find(b => b.name === 'LeftArm'),
        ra: pMesh.skeleton.bones.find(b => b.name === 'RightArm'),
        lul: lul,
        rul: rul
      };
    }
  }

  // Ground Elevation Function (Hỗ trợ bước lên bậc thang và đi trên bục cưới!)
  function getGroundElevation(x, z) {
    // Sân khấu chính (Z từ -19.5 đến -28.5, chiều rộng |x| <= 11.8)
    if (z <= -19.5 && z >= -28.5 && Math.abs(x) <= 11.8) {
      return 1.0;
    }
    // Bậc tam cấp dẫn lên sân khấu từ thảm đỏ (Z từ -16.3 đến -19.5, |x| <= 4.5)
    if (z < -16.3 && z > -19.5 && Math.abs(x) <= 4.5) {
      const progress = (-16.3 - z) / (19.5 - 16.3);
      return Math.max(0, Math.min(1.0, progress * 1.0));
    }
    return 0.0;
  }

  // Helper to spawn remote player avatars
  function createRemotePlayer(data) {
    if (!data || !data.id || data.id === selfPlayerId) return; // TRIỆT TIÊU LỖI NHÂN BẢN 2 NGƯỜI
    if (remotePlayers.has(data.id)) return;

    const rGroup = new THREE.Group();
    rGroup.position.set(data.x || 0, 0, data.z || 2);
    rGroup.rotation.y = data.rotY || 0;
    scene.add(rGroup);

    const isWoman = data.gender === 'female';
    const tmpl = isWoman ? avatarTemplates.female : avatarTemplates.male;
    const model = cloneSkinnedGltf(tmpl);
    model.scale.set(1.35, 1.35, 1.35);

    poseFormalStanding(model);
    rGroup.add(model);

    const label = makeBillboardSprite(data.name || "Khách Quý", "#ffffff", isWoman ? "#db2777" : "#0284c7");
    label.position.set(0, 2.08, 0);
    rGroup.add(label);

    const pMesh = model.getObjectByName('H_DDS_HighRes');
    let rBones = null;
    let rInitLegs = null;
    if (pMesh && pMesh.skeleton) {
      const lul = pMesh.skeleton.bones.find(b => b.name === 'LeftUpLeg');
      const rul = pMesh.skeleton.bones.find(b => b.name === 'RightUpLeg');
      rInitLegs = {
        lul: lul ? lul.quaternion.clone() : new THREE.Quaternion(),
        rul: rul ? rul.quaternion.clone() : new THREE.Quaternion()
      };
      rBones = {
        mesh: pMesh,
        la: pMesh.skeleton.bones.find(b => b.name === 'LeftArm'),
        ra: pMesh.skeleton.bones.find(b => b.name === 'RightArm'),
        lul: lul,
        rul: rul,
        initialLegs: rInitLegs
      };
    }

    remotePlayers.set(data.id, {
      id: data.id,
      name: data.name,
      group: rGroup,
      model: model,
      bones: rBones,
      targetX: data.x || 0,
      targetZ: data.z || 2,
      targetRotY: data.rotY || 0,
      isWalking: false,
      walkCycle: 0
    });
  }

  function removeRemotePlayer(id) {
    if (!remotePlayers.has(id)) return;
    const rp = remotePlayers.get(id);
    scene.remove(rp.group);
    remotePlayers.delete(id);
  }

  // --- SYSTEM TOAST & ONLINE COUNT ---
  let toastTimeout = null;
  function showSystemToast(text) {
    const t = document.getElementById('toastNotification');
    if (!t) return;
    t.textContent = text;
    t.style.display = 'block';
    t.style.opacity = '1';
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => { t.style.display = 'none'; }, 300);
    }, 4500);
  }

  function updateOnlineCountBadge(count) {
    const badge = document.getElementById('onlineBadge');
    if (!badge) return;
    const c = count || (remotePlayers.size + 1);
    badge.innerHTML = `🟢 <span style="color:#ffd700; font-weight:bold;">${c} Khách</span> Đang Dự Tiệc`;
  }

  // --- MULTIPLAYER WEBSOCKET CONNECTION ---
  let socket = null;
  let selfPlayerId = null;
  let hasEnteredWedding = false;
  let hasSentJoin = false;

  function sendJoinPacket() {
    if (!hasSentJoin && socket && socket.readyState === WebSocket.OPEN) {
      hasSentJoin = true;
      socket.send(JSON.stringify({
        type: 'join',
        name: playerName,
        gender: playerGender,
        x: playerGroup.position.x,
        z: playerGroup.position.z
      }));
      console.log("📤 Sent join packet to wedding server!");
    }
  }

  function initMultiplayer() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      socket = new WebSocket(wsUrl);

      socket.addEventListener('open', () => {
        console.log("🌐 Connected to Wedding Multiplayer Server!");
        if (hasEnteredWedding) {
          sendJoinPacket();
        }
      });

      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'init') {
            selfPlayerId = data.selfId;
            if (data.assignedSpawn) {
              playerGroup.position.set(data.assignedSpawn.x, 0, data.assignedSpawn.z);
            }
            data.players.forEach(p => {
              if (p && p.id !== selfPlayerId) createRemotePlayer(p);
            });
            updateOnlineCountBadge(data.onlineCount);
          } else if (data.type === 'player_joined') {
            if (data.player && data.player.id !== selfPlayerId) {
              createRemotePlayer(data.player);
              showSystemToast(`🎊 "${data.player.name}" vừa bước vào rạp cưới!`);
              playSound('cheer');
            }
            updateOnlineCountBadge(data.onlineCount);
          } else if (data.type === 'player_moved') {
            if (data.id === selfPlayerId) return; // Ignore own movement broadcast
            const rp = remotePlayers.get(data.id);
            if (rp) {
              rp.targetX = data.x;
              rp.targetZ = data.z;
              rp.targetRotY = data.rotY;
              rp.isWalking = data.isWalking;
            }
          } else if (data.type === 'player_chat') {
            if (data.id === selfPlayerId) {
              showSpeechBubble(playerGroup, data.text);
            } else {
              const rp = remotePlayers.get(data.id);
              if (rp) showSpeechBubble(rp.group, data.text);
            }
          } else if (data.type === 'player_reaction') {
            if (data.id === selfPlayerId) {
              spawnFloatingReaction(playerGroup, data.emoji);
            } else {
              const rp = remotePlayers.get(data.id);
              if (rp) spawnFloatingReaction(rp.group, data.emoji);
            }
          } else if (data.type === 'player_left') {
            removeRemotePlayer(data.id);
            updateOnlineCountBadge(data.onlineCount);
          }
        } catch (e) {
          console.error("Multiplayer packet error:", e);
        }
      });

      socket.addEventListener('close', () => {
        console.log("Multiplayer socket disconnected. Retrying in 3s...");
        hasSentJoin = false;
        setTimeout(initMultiplayer, 3000);
      });
    } catch (e) {
      console.log("Multiplayer setup notice:", e);
    }
  }

  const feastLabel = makeBillboardSprite("🍗 MÂM CỖ MIỀN BẮC", "#fef08a");
  feastLabel.position.set(-7.4, 2.2, 2);
  scene.add(feastLabel);

  // 3D Confetti
  const confettiCount = 80;
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

  function blastConfetti(originX = 0, originY = 3, originZ = -24) {
    confettiMeshes.forEach(c => {
      c.mesh.position.set(originX + (Math.random() - 0.5) * 8, originY + Math.random() * 2, originZ + (Math.random() - 0.5) * 8);
      c.vx = (Math.random() - 0.5) * 0.3;
      c.vy = Math.random() * 0.3 + 0.18;
      c.vz = (Math.random() - 0.5) * 0.3;
      c.life = 160;
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

  // Camera & Touch Controls
  let cameraYaw = 0;
  let cameraPitch = 0.05;
  const cameraDistance = 4.2;
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

  // Interaction, Chat & Emotion Reactions Hooks
  const zones = [
    { id: 'gate_gift', name: 'Hòm Mừng Hỷ', x: 4.0, z: 26, radius: 3.5, prompt: 'Bỏ phong bì mừng Quân & My' },
    { id: 'banquet', name: 'Mâm Cỗ Miền Bắc', x: -7.4, z: 2, radius: 4.0, prompt: 'Nếm cỗ 80 triệu & Cụng ly 1-2-3 Dô' },
    { id: 'stage_mc', name: 'Sân Khấu Lễ Thành Hôn', x: 0, z: -22, radius: 6.0, prompt: 'Dự Lễ Thành Hôn cùng MC & Quân - My' }
  ];

  const interactPrompt = document.getElementById('interactPrompt');
  const actionBtn = document.getElementById('actionBtn');

  actionBtn.addEventListener('click', () => {
    if (gameState.interactionTarget) triggerInteraction(gameState.interactionTarget);
  });

  // Chat bar hook
  const chatInput = document.getElementById('chatInput');
  const sendChatBtn = document.getElementById('sendChatBtn');

  function handleSendChat() {
    if (!chatInput) return;
    const msg = chatInput.value.trim();
    if (msg) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'chat', text: msg }));
      } else {
        showSpeechBubble(playerGroup, msg);
      }
      chatInput.value = '';
    }
  }

  if (sendChatBtn) sendChatBtn.addEventListener('click', handleSendChat);
  if (chatInput) {
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleSendChat();
    });
  }

  // Emotion Reaction Palette Picker
  const emojiPickerBtn = document.getElementById('emojiPickerBtn');
  const emojiPalette = document.getElementById('emojiPalette');

  if (emojiPickerBtn && emojiPalette) {
    emojiPickerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = emojiPalette.style.display === 'grid';
      emojiPalette.style.display = isVisible ? 'none' : 'grid';
    });

    document.querySelectorAll('.reaction-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const emoji = btn.dataset.emoji;
        if (emoji) {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'reaction', emoji: emoji }));
          } else {
            spawnFloatingReaction(playerGroup, emoji);
          }
          emojiPalette.style.display = 'none';
        }
      });
    });

    window.addEventListener('click', () => {
      if (emojiPalette.style.display === 'grid') emojiPalette.style.display = 'none';
    });
  }

  // Welcome modal: Gender selection & MC Auto-Welcome Voice!
  const welcomeModal = document.getElementById('welcomeModal');
  const enterWeddingBtn = document.getElementById('enterWeddingBtn');
  const playerNameInput = document.getElementById('playerNameInput');

  // BGM Toggle Controller (Nhạc sống Hà Tây 2006)
  const bgmToggleBtn = document.getElementById('bgmToggleBtn');
  const bgmIcon = document.getElementById('bgmIcon');
  const bgmText = document.getElementById('bgmText');

  function updateBgmBtnState() {
    if (bgmIcon && bgmText && bgmToggleBtn) {
      if (isBgmPlaying) {
        bgmIcon.textContent = '🔊';
        bgmText.textContent = 'Nhạc Sống Hà Tây';
        bgmToggleBtn.style.borderColor = '#ffd700';
        bgmToggleBtn.style.color = '#ffd700';
      } else {
        bgmIcon.textContent = '🔇';
        bgmText.textContent = 'Tắt Nhạc';
        bgmToggleBtn.style.borderColor = '#94a3b8';
        bgmToggleBtn.style.color = '#94a3b8';
      }
    }
  }

  if (bgmToggleBtn) {
    bgmToggleBtn.addEventListener('click', () => {
      if (bgm.paused) {
        bgm.play().then(() => {
          isBgmPlaying = true;
          updateBgmBtnState();
        }).catch(e => console.log("BGM toggle notice:", e));
      } else {
        bgm.pause();
        isBgmPlaying = false;
        updateBgmBtnState();
      }
    });
  }

  if (enterWeddingBtn) {
    enterWeddingBtn.addEventListener('click', () => {
      if (playerNameInput && playerNameInput.value.trim()) {
        playerName = playerNameInput.value.trim();
        updatePlayerNameLabel(playerName);
      }

      const genderRadios = document.getElementsByName('playerGender');
      genderRadios.forEach(r => {
        if (r.checked) playerGender = r.value;
      });
      setupPlayerAvatar();

      // Send join event to server
      hasEnteredWedding = true;
      sendJoinPacket();

      if (welcomeModal) welcomeModal.style.display = 'none';
      getAudioContext();
      playSound('cheer');
      blastConfetti(playerGroup.position.x, 3, playerGroup.position.z);

      // 1. TỰ ĐỘNG PHÁT NHẠC SỐNG HÀ TÂY ĐÁM CƯỚI NGÀY XƯA SÔI ĐỘNG!
      isBgmPlaying = true;
      bgm.currentTime = 0;
      bgm.play().then(() => {
        updateBgmBtnState();
      }).catch(e => {
        console.log("BGM autoplay waiting for touch:", e);
        const unlockAudio = () => {
          if (isBgmPlaying && bgm.paused) {
            bgm.play().then(() => updateBgmBtnState()).catch(() => {});
          }
          window.removeEventListener('pointerdown', unlockAudio);
          window.removeEventListener('keydown', unlockAudio);
        };
        window.addEventListener('pointerdown', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
      });

      // 2. MC TỰ ĐỘNG PHÁT BẰNG GIỌNG ĐỌC NAM MIỀN BẮC (ĐÃ BỎ PHẦN TEXT / HỘP THOẠI CHÀO MỪNG!)
      audios.mc_welcome.currentTime = 0;
      audios.mc_welcome.volume = 1.0;
      audios.mc_welcome.play().catch(e => console.log("Audio notice:", e));
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
    blastConfetti(4.0, 3, 26);
    showDialogue("Bác Trưởng Ban Tiếp Đón", `Gia đình xin chân thành cảm ơn ${playerName}! Chúc bạn có một ngày dự tiệc thật vui vẻ cùng Quân & My!`);
  });

  document.getElementById('toastFeastBtn').addEventListener('click', () => {
    gameState.quests.eat = true;
    updateQuestUI();
    feastModal.style.display = 'none';
    playSound('clink');
    setTimeout(() => playSound('cheer'), 300);
    blastConfetti(-7.4, 3, 2);
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
        blastConfetti(0, 4, -24);
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
        blastConfetti(0, 4, -24);
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

  // Animation Loop & Network Sync
  const clock = new THREE.Clock();
  let lastNetSyncTime = 0;

  function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.1);
    const now = performance.now();

    let moveX = input.stickX;
    let moveZ = input.stickY;
    if (input.keyW) moveZ -= 1;
    if (input.keyS) moveZ += 1;
    if (input.keyA) moveX -= 1;
    if (input.keyD) moveX += 1;

    const inputLen = Math.hypot(moveX, moveZ);
    let isMoving = inputLen > 0.05;

    if (isMoving) {
      const normX = moveX / Math.max(1, inputLen);
      const normZ = moveZ / Math.max(1, inputLen);

      // Chuẩn hóa vector di chuyển tuyệt đối thẳng theo hướng nhìn camera (Không bị chéo lệch!)
      const forwardX = -Math.sin(cameraYaw);
      const forwardZ = -Math.cos(cameraYaw);
      const rightX = Math.cos(cameraYaw);
      const rightZ = -Math.sin(cameraYaw);

      const worldMoveX = normX * rightX - normZ * forwardX;
      const worldMoveZ = normX * rightZ - normZ * forwardZ;

      playerGroup.position.x += worldMoveX * playerSpeed * delta;
      playerGroup.position.z += worldMoveZ * playerSpeed * delta;

      const targetAngle = Math.atan2(worldMoveX, worldMoveZ);
      
      let diff = targetAngle - currentFacingAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      currentFacingAngle += diff * Math.min(1, delta * 14);
      playerGroup.rotation.y = currentFacingAngle;

      walkCycle += delta * 11;

      if (playerMeshBones && playerMeshBones.mesh && initialLegQuats) {
        const swing = Math.sin(walkCycle) * 0.45;
        if (playerMeshBones.la) playerMeshBones.la.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2.8 + swing);
        if (playerMeshBones.ra) playerMeshBones.ra.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2.8 - swing);
        
        if (playerMeshBones.lul) {
          playerMeshBones.lul.quaternion.copy(initialLegQuats.lul).multiply(
            new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), swing)
          );
        }
        if (playerMeshBones.rul) {
          playerMeshBones.rul.quaternion.copy(initialLegQuats.rul).multiply(
            new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -swing)
          );
        }

        playerMeshBones.mesh.skeleton.update();
      }
    } else {
      if (playerMeshBones && playerMeshBones.mesh && initialLegQuats) {
        if (playerMeshBones.la) playerMeshBones.la.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2.8);
        if (playerMeshBones.ra) playerMeshBones.ra.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2.8);
        if (playerMeshBones.lul) playerMeshBones.lul.quaternion.copy(initialLegQuats.lul);
        if (playerMeshBones.rul) playerMeshBones.rul.quaternion.copy(initialLegQuats.rul);
        playerMeshBones.mesh.skeleton.update();
      }
    }

    // Nâng hạ độ cao mượt mà theo mặt sàn & bậc tam cấp dẫn lên sân khấu lễ cưới!
    const groundElevation = getGroundElevation(playerGroup.position.x, playerGroup.position.z);
    const bobbing = isMoving ? Math.abs(Math.sin(walkCycle * 2)) * 0.05 : 0;
    playerGroup.position.y += (groundElevation + bobbing - playerGroup.position.y) * Math.min(1, delta * 15);

    playerGroup.position.x = Math.max(-HALL.width / 2 + 1.8, Math.min(HALL.width / 2 - 1.8, playerGroup.position.x));
    playerGroup.position.z = Math.max(-30, Math.min(30, playerGroup.position.z));

    // Throttled Multiplayer Position Sync (20 FPS / 50ms interval)
    if (socket && socket.readyState === WebSocket.OPEN && (now - lastNetSyncTime > 50)) {
      lastNetSyncTime = now;
      socket.send(JSON.stringify({
        type: 'move',
        x: playerGroup.position.x,
        z: playerGroup.position.z,
        rotY: playerGroup.rotation.y,
        isWalking: isMoving
      }));
    }

    // Update & Interpolate Remote Players
    remotePlayers.forEach(rp => {
      rp.group.position.x += (rp.targetX - rp.group.position.x) * Math.min(1, delta * 12);
      rp.group.position.z += (rp.targetZ - rp.group.position.z) * Math.min(1, delta * 12);

      const rGroundElevation = getGroundElevation(rp.group.position.x, rp.group.position.z);
      rp.group.position.y += (rGroundElevation - rp.group.position.y) * Math.min(1, delta * 15);

      let rDiff = rp.targetRotY - rp.group.rotation.y;
      while (rDiff < -Math.PI) rDiff += Math.PI * 2;
      while (rDiff > Math.PI) rDiff -= Math.PI * 2;
      rp.group.rotation.y += rDiff * Math.min(1, delta * 12);

      if (rp.bones && rp.bones.mesh) {
        if (rp.isWalking) {
          rp.walkCycle += delta * 11;
          const rSwing = Math.sin(rp.walkCycle) * 0.45;
          if (rp.bones.la) rp.bones.la.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2.8 + rSwing);
          if (rp.bones.ra) rp.bones.ra.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2.8 - rSwing);
          if (rp.bones.lul && rp.bones.initialLegs) {
            rp.bones.lul.quaternion.copy(rp.bones.initialLegs.lul).multiply(
              new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rSwing)
            );
          }
          if (rp.bones.rul && rp.bones.initialLegs) {
            rp.bones.rul.quaternion.copy(rp.bones.initialLegs.rul).multiply(
              new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -rSwing)
            );
          }
          rp.bones.mesh.skeleton.update();
        } else {
          if (rp.bones.la) rp.bones.la.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2.8);
          if (rp.bones.ra) rp.bones.ra.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2.8);
          if (rp.bones.lul && rp.bones.initialLegs) rp.bones.lul.quaternion.copy(rp.bones.initialLegs.lul);
          if (rp.bones.rul && rp.bones.initialLegs) rp.bones.rul.quaternion.copy(rp.bones.initialLegs.rul);
          rp.bones.mesh.skeleton.update();
        }
      }
    });

    // Animate 3D Floating Emotion Reactions
    for (let i = floatingReactions.length - 1; i >= 0; i--) {
      const r = floatingReactions[i];
      r.sprite.position.x += r.vx;
      r.sprite.position.y += r.vy;
      r.sprite.position.z += r.vz;
      r.life -= r.decay;
      r.sprite.material.opacity = Math.max(0, r.life);
      r.sprite.scale.addScalar(0.005);
      if (r.life <= 0) {
        scene.remove(r.sprite);
        floatingReactions.splice(i, 1);
      }
    }

    // Camera follow (Căn chuẩn trọng tâm không bị lệch mắt nhìn)
    const targetPos = playerGroup.position.clone().add(cameraTargetOffset);
    const camOffset = new THREE.Vector3(
      Math.sin(cameraYaw) * Math.cos(cameraPitch) * cameraDistance,
      Math.sin(cameraPitch) * cameraDistance + 0.35,
      Math.cos(cameraYaw) * Math.cos(cameraPitch) * cameraDistance
    );

    const desiredCamPos = targetPos.clone().add(camOffset);
    camera.position.lerp(desiredCamPos, 0.25);
    camera.lookAt(targetPos.clone().add(new THREE.Vector3(0, 0.15, 0)));

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

  // Expose debug handle for validation & tests
  window.__game = {
    playerGroup,
    remotePlayers,
    input,
    getSelfPlayerId: () => selfPlayerId,
    getGroundElevation
  };

  animate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
