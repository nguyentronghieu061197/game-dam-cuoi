/**
 * Game: Đám Cưới Quân & My - Rạp Khủng 80 Triệu
 * Facebook Instant Games HTML5 Simulation
 */

// --- 1. PLAYER & GAME INITIALIZATION ---
let playerName = "Khách Quý";

// Start game immediately on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

// --- 2. GAME STATE & AUDIO ---
const gameState = {
  quests: {
    gift: false,
    eat: false,
    ceremony: false,
    photo: false
  },
  ceremonyStep: 0,
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

// Unlock audio on mobile on first touch
window.addEventListener('pointerdown', () => {
  getAudioContext();
  Object.values(audios).forEach(a => {
    a.load();
  });
}, { once: true });

function playSound(type) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    if (type === 'clink') {
      // Clinking glass sound
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
      // Fanfare arpeggio
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, idx) => {
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
    console.log("Audio not allowed yet or error:", e);
  }
}

// --- 3. GAME ENGINE & RENDER LOOP ---
function initGame() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  
  // Resize canvas to match display
  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // World settings (Long wedding tent hall: 540 x 1400)
  const WORLD = {
    width: 540,
    height: 1400
  };

  // Player Entity
  const player = {
    x: WORLD.width / 2,
    y: WORLD.height - 120, // Start outside near wedding gate
    radius: 18,
    speed: 3.8,
    vx: 0,
    vy: 0,
    facing: 'up',
    stepCount: 0
  };

  // Confetti Particles
  const particles = [];
  function spawnConfetti(count = 70) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: player.x + (Math.random() - 0.5) * 400,
        y: player.y - 150 + Math.random() * 200,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5 - 2,
        gravity: 0.15,
        color: ['#ef4444', '#ffd700', '#3b82f6', '#10b981', '#ec4899', '#ffffff'][Math.floor(Math.random() * 6)],
        size: Math.random() * 6 + 4,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        life: 120
      });
    }
  }

  // MC Animation state
  let mcWaveTime = 0;
  let champagneBubbleTime = 0;

  // Wedding Tables Layout (8 grand banquet tables)
  const tables = [
    { id: 1, x: 120, y: 520, guests: 6 },
    { id: 2, x: 420, y: 520, guests: 6 },
    { id: 3, x: 120, y: 720, guests: 6 },
    { id: 4, x: 420, y: 720, guests: 6 },
    { id: 5, x: 120, y: 920, guests: 6 },
    { id: 6, x: 420, y: 920, guests: 6 },
    { id: 7, x: 120, y: 1120, guests: 6 },
    { id: 8, x: 420, y: 1120, guests: 6 },
  ];

  // Interactive Zones
  const zones = [
    {
      id: 'gate_gift',
      name: 'Hòm Mừng Hỷ',
      x: 380,
      y: 1280,
      radius: 50,
      prompt: 'Bỏ phong bì mừng Quân & My'
    },
    {
      id: 'banquet',
      name: 'Mâm Cỗ Miền Bắc',
      x: 120,
      y: 720,
      radius: 65,
      prompt: 'Nếm cỗ 80 triệu & Cụng Ly'
    },
    {
      id: 'stage_mc',
      name: 'Sân Khấu Lễ Thành Hôn',
      x: WORLD.width / 2,
      y: 260,
      radius: 90,
      prompt: 'Dự Lễ Thành Hôn cùng MC & Quân - My'
    }
  ];

  // Camera
  const camera = { x: 0, y: 0 };

  // --- CONTROLS SETUP ---
  // Keyboard
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  // Touch Virtual Joystick
  const joystickZone = document.getElementById('joystickZone');
  const joystickThumb = document.getElementById('joystickThumb');
  let touchActive = false;
  let touchStartPos = { x: 0, y: 0 };
  const maxDistance = 45;

  // Pointer Events & Touch Virtual Joystick
  function handlePointerStart(clientX, clientY) {
    const rect = joystickZone.getBoundingClientRect();
    touchStartPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    touchActive = true;
    updateJoystick(clientX, clientY);
  }

  joystickZone.addEventListener('pointerdown', e => {
    e.preventDefault();
    handlePointerStart(e.clientX, e.clientY);
  });

  window.addEventListener('pointermove', e => {
    if (!touchActive) return;
    updateJoystick(e.clientX, e.clientY);
  });

  const endTouch = () => {
    touchActive = false;
    player.vx = 0;
    player.vy = 0;
    joystickThumb.style.transform = `translate(0px, 0px)`;
  };
  window.addEventListener('pointerup', endTouch);
  window.addEventListener('pointercancel', endTouch);
  window.addEventListener('touchend', endTouch);
  window.addEventListener('touchcancel', endTouch);

  function updateJoystick(cx, cy) {
    const dx = cx - touchStartPos.x;
    const dy = cy - touchStartPos.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const cappedDist = Math.min(dist, maxDistance);

    const tx = Math.cos(angle) * cappedDist;
    const ty = Math.sin(angle) * cappedDist;
    joystickThumb.style.transform = `translate(${tx}px, ${ty}px)`;

    const intensity = cappedDist / maxDistance;
    player.vx = Math.cos(angle) * player.speed * intensity;
    player.vy = Math.sin(angle) * player.speed * intensity;
  }

  // --- UI INTERACTION HOOKS ---
  const actionBtn = document.getElementById('actionBtn');
  const interactPrompt = document.getElementById('interactPrompt');

  actionBtn.addEventListener('click', () => {
    if (gameState.interactionTarget) {
      triggerInteraction(gameState.interactionTarget);
    }
  });

  // Welcome Modal Enter Button
  const welcomeModal = document.getElementById('welcomeModal');
  const enterWeddingBtn = document.getElementById('enterWeddingBtn');
  const playerNameInput = document.getElementById('playerNameInput');

  if (enterWeddingBtn) {
    enterWeddingBtn.addEventListener('click', () => {
      if (playerNameInput && playerNameInput.value.trim()) {
        playerName = playerNameInput.value.trim();
      }
      if (welcomeModal) welcomeModal.style.display = 'none';
      getAudioContext();
      playSound('cheer');
      spawnConfetti(60);
    });
  }

  // Modal setup
  const giftModal = document.getElementById('giftModal');
  const feastModal = document.getElementById('feastModal');

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      giftModal.style.display = 'none';
      feastModal.style.display = 'none';
    });
  });

  // Gift options
  document.querySelectorAll('.gift-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gift-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      gameState.giftAmount = btn.dataset.amount;
    });
  });

  document.getElementById('submitGiftBtn').addEventListener('click', () => {
    const wishes = document.getElementById('giftWishInput').value || gameState.giftWishes;
    gameState.quests.gift = true;
    updateQuestUI();
    giftModal.style.display = 'none';
    playSound('coin');
    spawnConfetti(50);
    showDialogue("Bác Trưởng Ban Tiếp Đón", `Gia đình xin chân thành cảm ơn ${playerName}! Chúc bạn có một ngày dự tiệc thật vui vẻ cùng Quân & My!`);
  });

  document.getElementById('toastFeastBtn').addEventListener('click', () => {
    gameState.quests.eat = true;
    updateQuestUI();
    feastModal.style.display = 'none';
    playSound('clink');
    setTimeout(() => playSound('cheer'), 300);
    spawnConfetti(60);
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
        spawnConfetti(150);
        playSound('cheer');
        return;
      }

      const item = sequence[step];
      showDialogue(item.speaker, item.text, item.avatar, () => {
        step++;
        playStep();
      });

      // Play audio if present
      if (item.audio) {
        item.audio.currentTime = 0;
        item.audio.play().catch(e => console.log("Audio autoplay prevented", e));
      }

      // Visual effects during steps
      if (step === 1 || step === 3 || step === 4) {
        spawnConfetti(70);
        playSound('cheer');
      }
    }

    playStep();
  }

  // Dialogue system
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
    } else {
      dialogueAvatar.style.backgroundImage = `none`;
    }
    currentOnNext = onNext;
  }

  function closeDialogue() {
    dialogueBox.style.display = 'none';
  }

  dialogueNextBtn.addEventListener('click', () => {
    if (currentOnNext) {
      currentOnNext();
    } else {
      closeDialogue();
    }
  });

  // --- MAIN LOOP ---
  function update() {
    // Keyboard movement
    let kx = 0;
    let ky = 0;
    if (keys['arrowleft'] || keys['a']) kx -= 1;
    if (keys['arrowright'] || keys['d']) kx += 1;
    if (keys['arrowup'] || keys['w']) ky -= 1;
    if (keys['arrowdown'] || keys['s']) ky += 1;

    if (kx !== 0 || ky !== 0) {
      const len = Math.hypot(kx, ky);
      player.vx = (kx / len) * player.speed;
      player.vy = (ky / len) * player.speed;
    } else if (!touchActive) {
      player.vx = 0;
      player.vy = 0;
    }

    // Apply movement
    player.x += player.vx;
    player.y += player.vy;

    if (player.vx !== 0 || player.vy !== 0) {
      player.stepCount += 0.2;
      if (Math.abs(player.vx) > Math.abs(player.vy)) {
        player.facing = player.vx > 0 ? 'right' : 'left';
      } else {
        player.facing = player.vy > 0 ? 'down' : 'up';
      }
    }

    // World clamp
    player.x = Math.max(player.radius + 20, Math.min(WORLD.width - player.radius - 20, player.x));
    player.y = Math.max(220, Math.min(WORLD.height - player.radius - 20, player.y));

    // Camera follow smoothly
    camera.x = canvas.width / 2 - player.x;
    camera.y = canvas.height / 2 - player.y;

    // Check interaction proximity
    gameState.interactionTarget = null;
    for (const zone of zones) {
      const d = Math.hypot(player.x - zone.x, player.y - zone.y);
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

    // Update Confetti
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    mcWaveTime += 0.05;
    champagneBubbleTime += 0.08;
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(camera.x, camera.y);

    // 1. Draw Wedding Tent Floor (Rạp cưới 80 triệu siêu sang)
    // Red luxury carpet in the middle
    ctx.fillStyle = "#35101a";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    // Luxury tile pattern
    ctx.strokeStyle = "rgba(255, 215, 0, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < WORLD.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD.height);
      ctx.stroke();
    }

    // Central Red Carpet leading to stage
    const carpetGrad = ctx.createLinearGradient(WORLD.width / 2 - 45, 0, WORLD.width / 2 + 45, 0);
    carpetGrad.addColorStop(0, '#7f1d1d');
    carpetGrad.addColorStop(0.5, '#b91c1c');
    carpetGrad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = carpetGrad;
    ctx.fillRect(WORLD.width / 2 - 50, 240, 100, WORLD.height - 240);

    // Gold borders along red carpet
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 3;
    ctx.strokeRect(WORLD.width / 2 - 50, 240, 100, WORLD.height - 240);

    // Flower pillars along the carpet
    for (let fy = 350; fy < WORLD.height - 150; fy += 160) {
      drawFlowerPillar(ctx, WORLD.width / 2 - 62, fy);
      drawFlowerPillar(ctx, WORLD.width / 2 + 62, fy);
    }

    // 2. Truss Columns (Khung rạp nhôm không gian 80 triệu)
    for (let ty = 250; ty < WORLD.height; ty += 180) {
      drawTrussPost(ctx, 25, ty);
      drawTrussPost(ctx, WORLD.width - 25, ty);
    }

    // 3. Crystal Chandeliers on ceiling (Đèn chùm pha lê tỏa sáng)
    for (let cy = 400; cy < WORLD.height - 200; cy += 240) {
      drawChandelier(ctx, WORLD.width / 2, cy);
    }

    // 4. Banquet Tables (Bàn tiệc cỗ miền Bắc 6 người)
    tables.forEach(t => drawBanquetTable(ctx, t.x, t.y));

    // 5. Grand Entrance Gate (Cổng Hoa Cưới & Bàn Đón Khách)
    drawEntranceGate(ctx, WORLD.width / 2, WORLD.height - 80);
    drawReceptionDesk(ctx, 380, 1280);

    // 6. Grand Wedding Stage (Sân Khấu Lễ Thành Hôn 80 Triệu)
    drawStage(ctx, WORLD.width / 2, 120);

    // 7. Characters on Stage: MC, Chú Rể Quân & Cô Dâu My
    drawMC(ctx, WORLD.width / 2 - 80, 160, mcWaveTime);
    drawGroom(ctx, WORLD.width / 2 - 15, 160);
    drawBride(ctx, WORLD.width / 2 + 35, 160);

    // 8. Draw Player
    drawPlayer(ctx, player);

    // 9. Draw Confetti & Lighting Glow
    drawParticles(ctx, particles);

    ctx.restore();
  }

  // --- DRAWING HELPERS ---
  function drawFlowerPillar(ctx, x, y) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 5, y - 10, 10, 20);
    // Flowers top
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(x, y - 14, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.arc(x - 3, y - 16, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTrussPost(ctx, x, y) {
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x - 6, y - 40, 12, 80);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 6, y - 40, 12, 80);
    // X lattice pattern
    for (let i = -35; i < 35; i += 20) {
      ctx.beginPath();
      ctx.moveTo(x - 6, y + i);
      ctx.lineTo(x + 6, y + i + 15);
      ctx.stroke();
    }
  }

  function drawChandelier(ctx, x, y) {
    // Warm light halo
    const halo = ctx.createRadialGradient(x, y, 10, x, y, 90);
    halo.addColorStop(0, 'rgba(255, 230, 150, 0.4)');
    halo.addColorStop(1, 'rgba(255, 230, 150, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, 90, 0, Math.PI * 2);
    ctx.fill();

    // Crystal center
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawBanquetTable(ctx, x, y) {
    // 6 Chairs around
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      const cx = x + Math.cos(a) * 44;
      const cy = y + Math.sin(a) * 44;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();
      // Red ribbon on chair
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx - 5, cy - 2, 10, 4);
    }

    // Table cloth
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dishes on Table (Cỗ cưới miền Bắc: Gà lá chanh, Xôi gấc...)
    // Plate 1: Xôi gấc đỏ
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(x - 10, y - 8, 6, 0, Math.PI * 2);
    ctx.fill();
    // Plate 2: Gà luộc lá chanh
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(x + 10, y - 8, 7, 0, Math.PI * 2);
    ctx.fill();
    // Plate 3: Nem rán
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(x, y + 10, 6, 0, Math.PI * 2);
    ctx.fill();
    // Center flowers / wine
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawEntranceGate(ctx, x, y) {
    // Large Flower Arch
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(x, y - 20, 75, Math.PI, 0);
    ctx.stroke();

    // Flower bunches
    for (let a = Math.PI; a <= 0; a += Math.PI / 8) {
      const fx = x + Math.cos(a) * 75;
      const fy = y - 20 + Math.sin(a) * 75;
      ctx.fillStyle = (a % 2 === 0) ? '#f43f5e' : '#ffffff';
      ctx.beginPath();
      ctx.arc(fx, fy, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Welcome Sign
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(x - 90, y - 90, 180, 36);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 90, y - 90, 180, 36);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LỄ THÀNH HÔN', x, y - 76);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('QUÂN & MY', x, y - 60);
  }

  function drawReceptionDesk(ctx, x, y) {
    // Desk
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(x - 30, y - 18, 60, 36);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 30, y - 18, 60, 36);

    // Wedding Gift Box (Hòm Hỷ)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x - 14, y - 10, 28, 20);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x - 8, y - 3, 16, 6);
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HỶ', x, y + 5);

    // Sign label
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('HÒM TIỀN MỪNG', x, y - 22);
  }

  function drawStage(ctx, x, y) {
    // Stage Base Platform
    const stageWidth = 440;
    const stageHeight = 170;
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(x - stageWidth / 2, y, stageWidth, stageHeight);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.strokeRect(x - stageWidth / 2, y, stageWidth, stageHeight);

    // Giant LED Screen Backdrop
    const ledWidth = 360;
    const ledHeight = 100;
    const ledGrad = ctx.createLinearGradient(x - ledWidth / 2, y + 10, x + ledWidth / 2, y + 100);
    ledGrad.addColorStop(0, '#1e1b4b');
    ledGrad.addColorStop(0.5, '#431407');
    ledGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = ledGrad;
    ctx.fillRect(x - ledWidth / 2, y + 10, ledWidth, ledHeight);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - ledWidth / 2, y + 10, ledWidth, ledHeight);

    // LED Text: LỄ THÀNH HÔN - CHÚ RỂ QUÂN - CÔ DÂU MY
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TRĂM NĂM TÌNH VIÊN MÃN', x, y + 36);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('CHÚ RỂ: QUÂN  ❤️  CÔ DÂU: MY', x, y + 64);

    ctx.fillStyle = '#fca5a5';
    ctx.font = 'italic 12px sans-serif';
    ctx.fillText('HẠNH PHÚC TRĂM NĂM • ĐẦU BẠC RĂNG LONG', x, y + 86);

    // Stage Props: Champagne Tower (Left) & 5-tier Cake (Right)
    drawChampagneTower(ctx, x - 130, y + 90);
    drawWeddingCake(ctx, x + 130, y + 80);
  }

  function drawChampagneTower(ctx, x, y) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let layer = 0; layer < 4; layer++) {
      const glasses = 4 - layer;
      for (let g = 0; g < glasses; g++) {
        const gx = x - (glasses * 6) + g * 12 + 6;
        const gy = y - layer * 9;
        ctx.fillRect(gx - 3, gy, 6, 8);
      }
    }
  }

  function drawWeddingCake(ctx, x, y) {
    const layers = [26, 20, 15, 10];
    layers.forEach((w, i) => {
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#fbcfe8';
      ctx.fillRect(x - w / 2, y - i * 9, w, 8);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - w / 2, y - i * 9, w, 8);
    });
  }

  // Stage Characters
  function drawMC(ctx, x, y, waveTime) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 16, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (Suit)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 9, y - 10, 18, 22);

    // White shirt & Red tie
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 4, y - 10, 8, 12);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x - 1, y - 8, 3, 10);

    // Head
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(x, y - 18, 8, 0, Math.PI * 2);
    ctx.fill();

    // Animated Arm holding Mic
    const armWave = Math.sin(waveTime * 3) * 5;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 4);
    ctx.lineTo(x + 14, y - 12 + armWave);
    ctx.stroke();

    // Mic
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x + 13, y - 17 + armWave, 4, 7);

    // Name tag
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MC', x, y - 30);
  }

  function drawGroom(ctx, x, y) {
    // Groom Quân
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 16, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black tuxedo
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 9, y - 10, 18, 24);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 3, y - 10, 6, 10);
    // Red lapel flower
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x - 5, y - 6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(x, y - 18, 8, 0, Math.PI * 2);
    ctx.fill();
    // Hair
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(x, y - 20, 8, Math.PI, 0);
    ctx.fill();

    // Name tag
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QUÂN', x, y - 30);
  }

  function drawBride(ctx, x, y) {
    // Bride My
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 18, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gorgeous white gown
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 10);
    ctx.lineTo(x + 6, y - 10);
    ctx.lineTo(x + 16, y + 18);
    ctx.lineTo(x - 16, y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fbcfe8';
    ctx.stroke();

    // Head
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(x, y - 18, 8, 0, Math.PI * 2);
    ctx.fill();

    // Veil / Tiara
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x - 5, y - 26, 10, 3);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(x, y - 16, 12, Math.PI, 0);
    ctx.fill();

    // Name tag
    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MY', x, y - 30);
  }

  function drawPlayer(ctx, p) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + p.radius, p.radius * 0.9, p.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Footstep wobble
    const wobble = Math.sin(p.stepCount) * 2;

    // Body (Festive suit/attire)
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(p.x, p.y + wobble, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Face / Center
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(p.x, p.y - 2 + wobble, p.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Player name plate
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(p.x - 55, p.y - 36, 110, 18);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x - 55, p.y - 36, 110, 18);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(playerName, p.x, p.y - 23);
  }

  function drawParticles(ctx, list) {
    list.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
  }

  // Animation Loop
  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
