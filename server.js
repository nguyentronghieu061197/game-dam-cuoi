const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = 8088;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream'
};

// 1. High-Performance Static HTTP Server
const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const filePath = path.join(PUBLIC_DIR, reqPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const totalSize = stats.size;

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        res.writeHead(416, { 'Content-Range': `bytes */${totalSize}` });
        res.end();
        return;
      }

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': contentType
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, must-revalidate'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

// 2. Real-Time Multiplayer WebSocket Server
const wss = new WebSocketServer({ server });
const players = new Map(); // ws -> playerState

let guestCounter = 1;
const serverStartTime = Date.now();
const BGM_DURATION_SECONDS = 1116; // 18m36s of /home/zorinpc/dam-cuoi.mp3

// Staggered distinct spawn points right at the Grand Wedding Entrance Gate (Cổng Cưới)
const SPAWN_OFFSETS = [
  { x: -0.9, z: 28.5 },
  { x: 0.9, z: 28.5 },
  { x: -1.3, z: 27.2 },
  { x: 1.3, z: 27.2 },
  { x: 0.0, z: 29.2 },
  { x: -0.9, z: 26.0 },
  { x: 0.9, z: 26.0 }
];

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.playerId = `guest_${guestCounter++}_${Math.random().toString(36).substr(2, 4)}`;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (messageRaw) => {
    try {
      const data = JSON.parse(messageRaw);

      if (data.type === 'join') {
        const offsetIdx = (players.size) % SPAWN_OFFSETS.length;
        const defaultSpawn = SPAWN_OFFSETS[offsetIdx];

        // Đảm bảo tên khách mời không bao giờ bị trùng nhau!
        let rawName = (data.name || 'Khách Quý').trim().slice(0, 20);
        if (!rawName) rawName = 'Khách Quý';

        const existingNames = new Set();
        players.forEach(p => existingNames.add(p.name.toLowerCase()));

        let uniqueName = rawName;
        let suffix = 2;
        while (existingNames.has(uniqueName.toLowerCase())) {
          uniqueName = `${rawName} #${suffix}`;
          suffix++;
        }

        const playerState = {
          id: ws.playerId,
          name: uniqueName,
          gender: data.gender === 'female' ? 'female' : 'male',
          outfitColor: data.outfitColor || '#111827',
          hasGlasses: data.hasGlasses !== undefined ? !!data.hasGlasses : true,
          hasSlippers: !!data.hasSlippers,
          x: defaultSpawn.x,
          z: defaultSpawn.z,
          rotY: 0, // Facing forward towards stage (Z âm)!
          isWalking: false,
          isSeated: false,
          currentAnim: 'idle',
          lastUpdate: Date.now()
        };
        players.set(ws, playerState);

        // 1. Send all OTHER existing active players to this newly joined player
        const existingList = [];
        players.forEach((pState, otherWs) => {
          if (otherWs !== ws) existingList.push(pState);
        });

        // Tính toán vị trí đồng bộ chính xác của bài nhạc đám cưới theo thời gian thực toàn cầu
        const elapsedSec = ((Date.now() - serverStartTime) / 1000) % BGM_DURATION_SECONDS;

        ws.send(JSON.stringify({
          type: 'init',
          selfId: ws.playerId,
          assignedName: uniqueName,
          assignedSpawn: { x: playerState.x, z: playerState.z },
          players: existingList,
          onlineCount: players.size,
          bgmCurrentTime: elapsedSec
        }));

        // 2. Broadcast new player join to all OTHER connected clients!
        broadcastExcept(ws, {
          type: 'player_joined',
          player: playerState,
          onlineCount: players.size
        });

        console.log(`[+] Player joined: "${playerState.name}" (${ws.playerId}) at (${playerState.x.toFixed(1)}, ${playerState.z.toFixed(1)}) | Total Online: ${players.size}`);
      } else if (data.type === 'move') {
        const p = players.get(ws);
        if (p) {
          p.x = data.x;
          p.z = data.z;
          p.rotY = data.rotY;
          p.isWalking = !!data.isWalking;
          p.lastUpdate = Date.now();

          broadcastExcept(ws, {
            type: 'player_moved',
            id: ws.playerId,
            x: p.x,
            z: p.z,
            rotY: p.rotY,
            isWalking: p.isWalking
          });
        }
      } else if (data.type === 'chat') {
        const p = players.get(ws);
        const text = (data.text || '').trim().slice(0, 100);
        if (text) {
          broadcastAll({
            type: 'player_chat',
            id: ws.playerId,
            name: p ? p.name : 'Khách Quý',
            text: text
          });
          console.log(`[💬] Chat from ${p ? p.name : ws.playerId}: ${text}`);
        }
      } else if (data.type === 'reaction') {
        const p = players.get(ws);
        const emoji = data.emoji;
        if (emoji) {
          broadcastAll({
            type: 'player_reaction',
            id: ws.playerId,
            name: p ? p.name : 'Khách Quý',
            emoji: emoji
          });
          console.log(`[🎉] Reaction from ${p ? p.name : ws.playerId}: ${emoji}`);
        }
      } else if (data.type === 'anim') {
        const p = players.get(ws);
        const action = data.action;
        if (p && action) {
          p.currentAnim = action;
          broadcastExcept(ws, {
            type: 'player_anim',
            id: ws.playerId,
            action: action,
            text: data.text,
            emoji: data.emoji
          });
          console.log(`[💃] Animation gesture from ${p.name}: ${action} (text: ${data.text}, emoji: ${data.emoji})`);
        }
      } else if (data.type === 'sit') {
        const p = players.get(ws);
        if (p) {
          p.isSeated = !!data.seated;
          p.seatId = data.seatId || null;
          p.seatX = data.seatX;
          p.seatZ = data.seatZ;
          p.seatAngle = data.seatAngle;
          broadcastExcept(ws, {
            type: 'player_sit',
            id: ws.playerId,
            seated: p.isSeated,
            seatId: p.seatId,
            seatX: p.seatX,
            seatZ: p.seatZ,
            seatAngle: p.seatAngle
          });
          console.log(`[🪑] Seating change for ${p.name}: ${p.isSeated ? 'Sitting' : 'Standing'}`);
        }
      }
    } catch (e) {
      console.error('WebSocket message error:', e);
    }
  });

  ws.on('close', () => {
    const p = players.get(ws);
    players.delete(ws);
    if (p) {
      console.log(`[-] Player left: "${p.name}" (${ws.playerId}) | Remaining: ${players.size}`);
      broadcastAll({
        type: 'player_left',
        id: ws.playerId,
        onlineCount: players.size
      });
    }
  });

  ws.on('error', (err) => {
    console.error('Socket error:', ws.playerId, err.message);
  });
});

// Periodic Heartbeat to clean up dead sockets & sync global wedding music timeline
const heartbeatInterval = setInterval(() => {
  const currentBgmSec = ((Date.now() - serverStartTime) / 1000) % BGM_DURATION_SECONDS;
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      const p = players.get(ws);
      players.delete(ws);
      if (p) {
        broadcastAll({ type: 'player_left', id: ws.playerId, onlineCount: players.size });
      }
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'music_sync', currentTime: currentBgmSec }));
    }
  });
}, 5000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

function broadcastAll(msgObj) {
  const payload = JSON.stringify(msgObj);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(payload);
  });
}

function broadcastExcept(senderWs, msgObj) {
  const payload = JSON.stringify(msgObj);
  wss.clients.forEach(client => {
    if (client.readyState === 1 && client !== senderWs) {
      client.send(payload);
    }
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Grand Wedding Multiplayer Server running at: http://0.0.0.0:${PORT}`);
  console.log(`✨ Local access: http://localhost:${PORT}`);
});
