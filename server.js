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

  // Security check: stay within PUBLIC_DIR
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

    // Support HTTP Range requests (crucial for smooth mobile audio scrubbing)
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
const players = new Map(); // id -> { id, name, gender, x, z, rotY, isWalking, lastUpdate }

let nextPlayerId = 1;

wss.on('connection', (ws) => {
  const playerId = `guest_${nextPlayerId++}_${Math.random().toString(36).substr(2, 4)}`;

  ws.on('message', (messageRaw) => {
    try {
      const data = JSON.parse(messageRaw);

      if (data.type === 'join') {
        const playerState = {
          id: playerId,
          name: (data.name || 'Khách Quý').slice(0, 24),
          gender: data.gender === 'female' ? 'female' : 'male',
          x: typeof data.x === 'number' ? data.x : 0,
          z: typeof data.z === 'number' ? data.z : 2,
          rotY: typeof data.rotY === 'number' ? data.rotY : 0,
          isWalking: false,
          lastUpdate: Date.now()
        };
        players.set(playerId, playerState);

        // Send confirmation & existing players to the new player
        const existingList = Array.from(players.values()).filter(p => p.id !== playerId);
        ws.send(JSON.stringify({
          type: 'init',
          selfId: playerId,
          players: existingList
        }));

        // Broadcast new player join to all other connected clients
        broadcastExcept(playerId, {
          type: 'player_joined',
          player: playerState
        });

        console.log(`[+] Player joined: ${playerState.name} (${playerId}) [Total: ${players.size}]`);
      } else if (data.type === 'move') {
        const p = players.get(playerId);
        if (p) {
          p.x = data.x;
          p.z = data.z;
          p.rotY = data.rotY;
          p.isWalking = !!data.isWalking;
          p.lastUpdate = Date.now();

          // Broadcast movement to all other players
          broadcastExcept(playerId, {
            type: 'player_moved',
            id: playerId,
            x: p.x,
            z: p.z,
            rotY: p.rotY,
            isWalking: p.isWalking
          });
        }
      } else if (data.type === 'chat') {
        const p = players.get(playerId);
        const text = (data.text || '').trim().slice(0, 100);
        if (text) {
          // Broadcast chat message to EVERYONE (including sender)
          broadcastAll({
            type: 'player_chat',
            id: playerId,
            name: p ? p.name : 'Khách Quý',
            text: text
          });
          console.log(`[💬] Chat from ${p ? p.name : playerId}: ${text}`);
        }
      } else if (data.type === 'reaction') {
        const p = players.get(playerId);
        const emoji = data.emoji;
        if (emoji) {
          // Broadcast reaction to EVERYONE (including sender)
          broadcastAll({
            type: 'player_reaction',
            id: playerId,
            name: p ? p.name : 'Khách Quý',
            emoji: emoji
          });
          console.log(`[🎉] Reaction from ${p ? p.name : playerId}: ${emoji}`);
        }
      }
    } catch (e) {
      console.error('WebSocket message error:', e);
    }
  });

  ws.on('close', () => {
    const p = players.get(playerId);
    players.delete(playerId);
    if (p) {
      console.log(`[-] Player left: ${p.name} (${playerId}) [Remaining: ${players.size}]`);
      broadcastAll({
        type: 'player_left',
        id: playerId
      });
    }
  });
});

function broadcastAll(msgObj) {
  const payload = JSON.stringify(msgObj);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(payload);
  });
}

function broadcastExcept(excludeId, msgObj) {
  const payload = JSON.stringify(msgObj);
  wss.clients.forEach(client => {
    if (client.readyState === 1 && client !== getClientById(excludeId)) {
      client.send(payload);
    }
  });
}

function getClientById(id) {
  // Helpers
  return null;
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Grand Wedding Multiplayer Server running at: http://0.0.0.0:${PORT}`);
  console.log(`✨ Local access: http://localhost:${PORT}`);
});
