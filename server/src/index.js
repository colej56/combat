import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store connected players
const players = {};

// ==================== AI ENEMY SYSTEM ====================

const ENEMY_TYPES = {
  soldier: {
    health: 100,
    damage: 10,
    speed: 5,
    attackRange: 30,
    detectRange: 50,
    attackCooldown: 1000,
    color: 0xff0000
  },
  scout: {
    health: 60,
    damage: 8,
    speed: 8,
    attackRange: 25,
    detectRange: 60,
    attackCooldown: 800,
    color: 0xff6600
  },
  heavy: {
    health: 200,
    damage: 20,
    speed: 3,
    attackRange: 20,
    detectRange: 40,
    attackCooldown: 1500,
    color: 0x990000
  }
};

// Enemy configuration for infinite map
const MAX_ENEMIES = 15;
const SPAWN_DISTANCE_MIN = 40;
const SPAWN_DISTANCE_MAX = 80;
const DESPAWN_DISTANCE = 150;

// Store enemies
const enemies = {};
let enemyIdCounter = 0;

function spawnEnemy(type, x, z) {
  const id = `enemy_${enemyIdCounter++}`;
  const enemyType = ENEMY_TYPES[type];

  enemies[id] = {
    id,
    type,
    x,
    y: 1,
    z,
    health: enemyType.health,
    maxHealth: enemyType.health,
    state: 'patrol', // patrol, chase, attack
    targetPlayer: null,
    patrolTarget: { x: x + (Math.random() - 0.5) * 30, z: z + (Math.random() - 0.5) * 30 },
    spawnPoint: { x, z },
    lastAttack: 0,
    rotation: Math.random() * Math.PI * 2
  };

  return id;
}

function getRandomSpawnNearPlayers() {
  const playerList = Object.values(players);
  if (playerList.length === 0) return { x: 0, z: 0 };

  // Pick a random player to spawn near
  const player = playerList[Math.floor(Math.random() * playerList.length)];

  // Random angle and distance
  const angle = Math.random() * Math.PI * 2;
  const distance = SPAWN_DISTANCE_MIN + Math.random() * (SPAWN_DISTANCE_MAX - SPAWN_DISTANCE_MIN);

  return {
    x: player.x + Math.cos(angle) * distance,
    z: player.z + Math.sin(angle) * distance
  };
}

function spawnEnemiesNearPlayers() {
  const playerList = Object.values(players);
  if (playerList.length === 0) return;

  // Count alive enemies
  const aliveEnemies = Object.values(enemies).filter(e => e.health > 0).length;

  // Spawn more enemies if below max
  while (aliveEnemies + Object.keys(enemies).length < MAX_ENEMIES && Object.keys(enemies).length < MAX_ENEMIES) {
    const types = ['soldier', 'soldier', 'scout', 'heavy'];
    const type = types[Math.floor(Math.random() * types.length)];
    const pos = getRandomSpawnNearPlayers();
    spawnEnemy(type, pos.x, pos.z);
  }
}

function despawnFarEnemies() {
  const playerList = Object.values(players);
  if (playerList.length === 0) return;

  for (const id in enemies) {
    const enemy = enemies[id];

    // Check distance to all players
    let closestDist = Infinity;
    for (const player of playerList) {
      const dist = getDistance(enemy, player);
      if (dist < closestDist) closestDist = dist;
    }

    // Despawn if too far from all players
    if (closestDist > DESPAWN_DISTANCE) {
      delete enemies[id];
    }
  }
}

function initializeEnemies() {
  // Initial spawn around origin
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const distance = 30 + Math.random() * 30;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    const types = ['soldier', 'soldier', 'scout', 'heavy'];
    const type = types[i % types.length];
    spawnEnemy(type, x, z);
  }

  console.log(`Spawned ${Object.keys(enemies).length} enemies`);
}

function getDistance(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function getClosestPlayer(enemy) {
  let closest = null;
  let closestDist = Infinity;

  for (const id in players) {
    const player = players[id];
    const dist = getDistance(enemy, player);
    if (dist < closestDist) {
      closestDist = dist;
      closest = { id, ...player, distance: dist };
    }
  }

  return closest;
}

function updateEnemyAI(delta) {
  const enemyType = ENEMY_TYPES;

  for (const id in enemies) {
    const enemy = enemies[id];
    const type = enemyType[enemy.type];

    // Find closest player
    const closestPlayer = getClosestPlayer(enemy);

    if (!closestPlayer) {
      // No players, patrol
      enemy.state = 'patrol';
      enemy.targetPlayer = null;
    } else if (closestPlayer.distance <= type.attackRange) {
      // In attack range
      enemy.state = 'attack';
      enemy.targetPlayer = closestPlayer.id;
    } else if (closestPlayer.distance <= type.detectRange) {
      // Detected player, chase
      enemy.state = 'chase';
      enemy.targetPlayer = closestPlayer.id;
    } else {
      // Player too far, patrol
      enemy.state = 'patrol';
      enemy.targetPlayer = null;
    }

    // Execute behavior based on state
    switch (enemy.state) {
      case 'patrol':
        // Move toward patrol target
        const patrolDist = getDistance(enemy, enemy.patrolTarget);
        if (patrolDist < 2) {
          // Pick new patrol target near spawn
          enemy.patrolTarget = {
            x: enemy.spawnPoint.x + (Math.random() - 0.5) * 40,
            z: enemy.spawnPoint.z + (Math.random() - 0.5) * 40
          };
        } else {
          // Move toward patrol target
          const dx = enemy.patrolTarget.x - enemy.x;
          const dz = enemy.patrolTarget.z - enemy.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          enemy.x += (dx / dist) * type.speed * delta * 0.5;
          enemy.z += (dz / dist) * type.speed * delta * 0.5;
          enemy.rotation = Math.atan2(dx, dz);
        }
        break;

      case 'chase':
        // Move toward player
        if (closestPlayer) {
          const dx = closestPlayer.x - enemy.x;
          const dz = closestPlayer.z - enemy.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist > type.attackRange * 0.8) {
            enemy.x += (dx / dist) * type.speed * delta;
            enemy.z += (dz / dist) * type.speed * delta;
          }
          enemy.rotation = Math.atan2(dx, dz);
        }
        break;

      case 'attack':
        // Face player and attack
        if (closestPlayer) {
          const dx = closestPlayer.x - enemy.x;
          const dz = closestPlayer.z - enemy.z;
          enemy.rotation = Math.atan2(dx, dz);

          const now = Date.now();
          if (now - enemy.lastAttack >= type.attackCooldown) {
            enemy.lastAttack = now;

            // Deal damage to player
            const targetPlayer = players[enemy.targetPlayer];
            if (targetPlayer) {
              targetPlayer.health -= type.damage;

              io.emit('enemyAttack', {
                enemyId: id,
                targetId: enemy.targetPlayer,
                damage: type.damage
              });

              // Check if player died
              if (targetPlayer.health <= 0) {
                console.log(`Player ${enemy.targetPlayer} was killed by ${id}`);
                targetPlayer.health = 100;
                targetPlayer.x = Math.random() * 20 - 10;
                targetPlayer.y = 2;
                targetPlayer.z = Math.random() * 20 - 10;

                // Get enemy type for display name
                const enemyType = enemy.type.charAt(0).toUpperCase() + enemy.type.slice(1);

                io.emit('playerDeath', {
                  playerId: enemy.targetPlayer,
                  playerName: targetPlayer.name,
                  playerTeam: targetPlayer.team,
                  killerId: id,
                  killerName: enemyType,
                  killerTeam: 'none',
                  isEnemyKill: true
                });
              }
            }
          }
        }
        break;
    }

    // No bounds - infinite map
  }
}

function respawnEnemy(id) {
  const enemy = enemies[id];
  if (!enemy) return;

  const type = ENEMY_TYPES[enemy.type];

  // Respawn near a random player
  const pos = getRandomSpawnNearPlayers();
  enemy.health = type.health;
  enemy.x = pos.x;
  enemy.z = pos.z;
  enemy.spawnPoint = { x: pos.x, z: pos.z };
  enemy.patrolTarget = { x: pos.x + (Math.random() - 0.5) * 30, z: pos.z + (Math.random() - 0.5) * 30 };
  enemy.state = 'patrol';
  enemy.targetPlayer = null;
}

// Game loop for AI updates
const TICK_RATE = 60;
let lastUpdate = Date.now();

let lastSpawnCheck = 0;
const SPAWN_CHECK_INTERVAL = 2000; // Check every 2 seconds

setInterval(() => {
  const now = Date.now();
  const delta = (now - lastUpdate) / 1000;
  lastUpdate = now;

  updateEnemyAI(delta);

  // Periodically spawn/despawn enemies based on player positions
  if (now - lastSpawnCheck > SPAWN_CHECK_INTERVAL) {
    lastSpawnCheck = now;
    despawnFarEnemies();
    spawnEnemiesNearPlayers();
  }

  // Broadcast enemy state to all players
  io.emit('enemies', enemies);
}, 1000 / TICK_RATE);

// Initialize enemies when server starts
initializeEnemies();

// ==================== SOCKET HANDLERS ====================

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Initialize player
  players[socket.id] = {
    x: Math.random() * 20 - 10,
    y: 2,
    z: Math.random() * 20 - 10,
    health: 100,
    difficulty: 'normal',
    name: 'Player',
    team: 'none'
  };

  // Send current state to new player
  io.emit('players', players);
  socket.emit('enemies', enemies);

  // Handle player info (name, team, difficulty)
  socket.on('setPlayerInfo', (data) => {
    if (players[socket.id]) {
      players[socket.id].name = (data.name || 'Player').substring(0, 16);
      players[socket.id].team = ['none', 'red', 'blue'].includes(data.team) ? data.team : 'none';
      players[socket.id].difficulty = ['easy', 'normal', 'hard'].includes(data.difficulty) ? data.difficulty : 'normal';
      console.log(`Player ${socket.id} joined as "${players[socket.id].name}" on team ${players[socket.id].team}`);
      io.emit('players', players);
    }
  });

  // Handle player movement
  socket.on('move', (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].z = data.z;

      io.emit('players', players);
    }
  });

  // Handle chat messages
  socket.on('chat', (data) => {
    const player = players[socket.id];
    if (!player) return;

    const message = (data.message || '').substring(0, 100);
    if (!message) return;

    if (data.teamOnly && player.team !== 'none') {
      // Team chat - only send to same team
      for (const id in players) {
        if (players[id].team === player.team) {
          io.to(id).emit('chat', {
            playerId: socket.id,
            name: player.name,
            team: player.team,
            message,
            teamOnly: true
          });
        }
      }
    } else {
      // All chat
      io.emit('chat', {
        playerId: socket.id,
        name: player.name,
        team: player.team,
        message,
        teamOnly: false
      });
    }
  });

  // Handle difficulty setting (legacy support)
  socket.on('setDifficulty', (data) => {
    if (players[socket.id] && ['easy', 'normal', 'hard'].includes(data.difficulty)) {
      players[socket.id].difficulty = data.difficulty;
    }
  });

  // Handle shooting
  socket.on('shoot', (data) => {
    socket.broadcast.emit('playerShoot', {
      playerId: socket.id,
      position: data.position,
      direction: data.direction,
      weapon: data.weapon
    });
  });

  // Handle player hit (PvP)
  socket.on('hit', (data) => {
    const targetPlayer = players[data.targetId];
    if (targetPlayer) {
      targetPlayer.health -= data.damage;

      io.emit('playerHit', {
        targetId: data.targetId,
        attackerId: socket.id,
        damage: data.damage,
        health: targetPlayer.health
      });

      if (targetPlayer.health <= 0) {
        const killer = players[socket.id];
        console.log(`Player ${data.targetId} was killed by ${socket.id}`);
        targetPlayer.health = 100;
        targetPlayer.x = Math.random() * 20 - 10;
        targetPlayer.y = 2;
        targetPlayer.z = Math.random() * 20 - 10;

        io.emit('playerDeath', {
          playerId: data.targetId,
          playerName: targetPlayer.name,
          playerTeam: targetPlayer.team,
          killerId: socket.id,
          killerName: killer ? killer.name : 'Player',
          killerTeam: killer ? killer.team : 'none',
          isEnemyKill: false
        });
      }
    }
  });

  // Handle enemy hit
  socket.on('hitEnemy', (data) => {
    const enemy = enemies[data.enemyId];
    if (enemy) {
      enemy.health -= data.damage;

      io.emit('enemyHit', {
        enemyId: data.enemyId,
        damage: data.damage,
        health: enemy.health
      });

      if (enemy.health <= 0) {
        console.log(`Enemy ${data.enemyId} was killed by ${socket.id}`);

        io.emit('enemyDeath', {
          enemyId: data.enemyId,
          killerId: socket.id
        });

        // Respawn after delay
        setTimeout(() => {
          respawnEnemy(data.enemyId);
          io.emit('enemyRespawn', { enemyId: data.enemyId, enemy: enemies[data.enemyId] });
        }, 5000);
      }
    }
  });

  // Handle vehicle enter
  socket.on('enterVehicle', (data) => {
    socket.broadcast.emit('playerEnteredVehicle', {
      playerId: socket.id,
      vehicleId: data.vehicleId
    });
  });

  // Handle vehicle exit
  socket.on('exitVehicle', (data) => {
    socket.broadcast.emit('playerExitedVehicle', {
      playerId: socket.id,
      vehicleId: data.vehicleId
    });
  });

  // Handle vehicle position updates
  socket.on('vehicleUpdate', (data) => {
    socket.broadcast.emit('vehicleMoved', {
      playerId: socket.id,
      vehicleId: data.vehicleId,
      x: data.x,
      z: data.z,
      rotation: data.rotation,
      speed: data.speed
    });
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit('players', players);
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    game: 'Combat',
    status: 'running',
    players: Object.keys(players).length,
    enemies: Object.keys(enemies).length
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║           COMBAT SERVER               ║
╠═══════════════════════════════════════╣
║  Server running on port ${PORT}          ║
║  http://localhost:${PORT}                ║
║  Enemies: ${Object.keys(enemies).length} spawned              ║
╚═══════════════════════════════════════╝
  `);
});
