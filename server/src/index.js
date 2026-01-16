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
    color: 0xff0000,
    isBoss: false
  },
  scout: {
    health: 60,
    damage: 8,
    speed: 8,
    attackRange: 25,
    detectRange: 60,
    attackCooldown: 800,
    color: 0xff6600,
    isBoss: false
  },
  heavy: {
    health: 200,
    damage: 20,
    speed: 3,
    attackRange: 20,
    detectRange: 40,
    attackCooldown: 1500,
    color: 0x990000,
    isBoss: false
  },
  // BOSS TYPES
  tankBoss: {
    health: 800,
    damage: 35,
    speed: 2.5,
    attackRange: 25,
    detectRange: 80,
    attackCooldown: 2000,
    color: 0x4a0000,
    isBoss: true,
    scale: 2.5,
    specialAttackCooldown: 8000, // Ground slam every 8 seconds
    enrageThreshold: 0.25 // Enrages at 25% health
  },
  mechBoss: {
    health: 600,
    damage: 25,
    speed: 4,
    attackRange: 40,
    detectRange: 100,
    attackCooldown: 1500,
    color: 0x2a4858,
    isBoss: true,
    scale: 2.0,
    shieldRegenRate: 20, // Shield HP per second
    maxShield: 200,
    specialAttackCooldown: 6000 // Rocket barrage every 6 seconds
  },
  skyBoss: {
    health: 500,
    damage: 30,
    speed: 12,
    attackRange: 60,
    detectRange: 150,
    attackCooldown: 1000,
    color: 0x1a1a3a,
    isBoss: true,
    scale: 1.8,
    flightHeight: 40,
    specialAttackCooldown: 5000 // Dive bomb every 5 seconds
  }
};

// Boss spawn locations (fixed positions in the world)
const BOSS_SPAWNS = [
  { x: 200, z: 200, type: 'tankBoss', respawnTime: 180000 }, // 3 min respawn
  { x: -200, z: 150, type: 'mechBoss', respawnTime: 180000 },
  { x: 0, z: -250, type: 'skyBoss', respawnTime: 180000 }
];

// Track active bosses
const activeBosses = {};

// ==================== BUILDING LINE-OF-SIGHT SYSTEM ====================
// Must match client's building generation for accurate collision

const CHUNK_SIZE = 64;
const BUILDING_COLORS = [0x8b7355, 0x696969, 0xa0522d, 0x708090, 0x556b2f, 0xcd853f];

// Same seeded random as client
function seededRandom(seed) {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function getChunkSeed(cx, cz) {
  return cx * 73856093 ^ cz * 19349663;
}

// Get buildings in a chunk (matching client generation with streets)
function getBuildingsInChunk(cx, cz) {
  const buildings = [];
  const seed = getChunkSeed(cx, cz);
  const worldX = cx * CHUNK_SIZE;
  const worldZ = cz * CHUNK_SIZE;

  // Street configuration (must match client)
  const streetWidth = 8;
  const sidewalkWidth = 1.5;
  const streetBuffer = streetWidth / 2 + sidewalkWidth + 2;

  // Buildings are placed in four quadrants, avoiding streets
  for (let q = 0; q < 4; q++) {
    const bSeed = seed + q * 1000;

    // 70% chance to have a building in each quadrant (matching client)
    if (seededRandom(bSeed) > 0.7) continue;

    // Calculate quadrant offsets
    const qx = (q % 2 === 0) ? 0 : 1; // 0 = west, 1 = east
    const qz = (q < 2) ? 0 : 1; // 0 = north, 1 = south

    // Random position within quadrant
    const quadrantStartX = worldX + (qx === 0 ? 4 : CHUNK_SIZE / 2 + streetBuffer);
    const quadrantStartZ = worldZ + (qz === 0 ? 4 : CHUNK_SIZE / 2 + streetBuffer);
    const quadrantEndX = worldX + (qx === 0 ? CHUNK_SIZE / 2 - streetBuffer : CHUNK_SIZE - 4);
    const quadrantEndZ = worldZ + (qz === 0 ? CHUNK_SIZE / 2 - streetBuffer : CHUNK_SIZE - 4);

    // Random size (matching client)
    const width = 8 + seededRandom(bSeed + 2) * 4; // 8-12 units wide
    const height = 4 + seededRandom(bSeed + 3) * 4; // 4-8 units tall
    const depth = 8 + seededRandom(bSeed + 4) * 4; // 8-12 units deep

    // Position building in quadrant (matching client calculation)
    const bx = quadrantStartX + (quadrantEndX - quadrantStartX - width) * seededRandom(bSeed + 5) + width / 2;
    const bz = quadrantStartZ + (quadrantEndZ - quadrantStartZ - depth) * seededRandom(bSeed + 6) + depth / 2;

    buildings.push({
      x: bx,
      z: bz,
      width,
      height,
      depth,
      minX: bx - width / 2,
      maxX: bx + width / 2,
      minZ: bz - depth / 2,
      maxZ: bz + depth / 2
    });
  }

  return buildings;
}

// Get all buildings near a position
function getBuildingsNear(x, z, radius) {
  const buildings = [];
  const minCx = Math.floor((x - radius) / CHUNK_SIZE);
  const maxCx = Math.floor((x + radius) / CHUNK_SIZE);
  const minCz = Math.floor((z - radius) / CHUNK_SIZE);
  const maxCz = Math.floor((z + radius) / CHUNK_SIZE);

  for (let cx = minCx; cx <= maxCx; cx++) {
    for (let cz = minCz; cz <= maxCz; cz++) {
      buildings.push(...getBuildingsInChunk(cx, cz));
    }
  }

  return buildings;
}

// Check if a line segment intersects a rectangle (2D)
function lineIntersectsRect(x1, z1, x2, z2, rect) {
  // Check if either endpoint is inside the rect
  if (x1 >= rect.minX && x1 <= rect.maxX && z1 >= rect.minZ && z1 <= rect.maxZ) return true;
  if (x2 >= rect.minX && x2 <= rect.maxX && z2 >= rect.minZ && z2 <= rect.maxZ) return true;

  // Check line intersection with each edge
  const edges = [
    { x1: rect.minX, z1: rect.minZ, x2: rect.maxX, z2: rect.minZ }, // bottom
    { x1: rect.maxX, z1: rect.minZ, x2: rect.maxX, z2: rect.maxZ }, // right
    { x1: rect.maxX, z1: rect.maxZ, x2: rect.minX, z2: rect.maxZ }, // top
    { x1: rect.minX, z1: rect.maxZ, x2: rect.minX, z2: rect.minZ }  // left
  ];

  for (const edge of edges) {
    if (linesIntersect(x1, z1, x2, z2, edge.x1, edge.z1, edge.x2, edge.z2)) {
      return true;
    }
  }

  return false;
}

// Check if two line segments intersect
function linesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (Math.abs(denom) < 0.0001) return false;

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

// Check line of sight between two points
function hasLineOfSight(x1, z1, x2, z2) {
  const dist = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;

  // Get buildings in the area between the two points
  const buildings = getBuildingsNear(midX, midZ, dist / 2 + 20);

  // Check if line intersects any building
  for (const building of buildings) {
    if (lineIntersectsRect(x1, z1, x2, z2, building)) {
      return false;
    }
  }

  return true;
}

// Enemy configuration for infinite map
const MAX_ENEMIES = 15;
const SPAWN_DISTANCE_MIN = 40;
const SPAWN_DISTANCE_MAX = 80;
const DESPAWN_DISTANCE = 150;

// Store enemies
const enemies = {};
let enemyIdCounter = 0;

function spawnEnemy(type, x, z, isBossSpawn = false) {
  const id = isBossSpawn ? `boss_${type}` : `enemy_${enemyIdCounter++}`;
  const enemyType = ENEMY_TYPES[type];

  if (!enemyType) {
    console.error(`Unknown enemy type: ${type}`);
    return null;
  }

  const enemy = {
    id,
    type,
    x,
    y: enemyType.flightHeight || 1, // Sky boss flies high
    z,
    health: enemyType.health,
    maxHealth: enemyType.health,
    state: 'patrol', // patrol, chase, attack, special
    targetPlayer: null,
    patrolTarget: { x: x + (Math.random() - 0.5) * 30, z: z + (Math.random() - 0.5) * 30 },
    spawnPoint: { x, z },
    lastAttack: 0,
    lastSpecialAttack: 0,
    rotation: Math.random() * Math.PI * 2,
    isBoss: enemyType.isBoss || false,
    scale: enemyType.scale || 1,
    phase: 1, // Boss phase (1 = normal, 2 = enraged)
    shield: enemyType.maxShield || 0,
    maxShield: enemyType.maxShield || 0
  };

  enemies[id] = enemy;

  // Track boss separately
  if (enemyType.isBoss) {
    activeBosses[type] = id;
    console.log(`Boss spawned: ${type} at (${x}, ${z})`);
  }

  return id;
}

// Spawn all bosses at their fixed locations
function spawnBosses() {
  for (const spawn of BOSS_SPAWNS) {
    if (!activeBosses[spawn.type]) {
      spawnEnemy(spawn.type, spawn.x, spawn.z, true);
    }
  }
}

// Check for boss respawns
const bossDeathTimes = {};

function checkBossRespawns() {
  const now = Date.now();
  for (const spawn of BOSS_SPAWNS) {
    // If boss is dead and respawn time has passed
    if (bossDeathTimes[spawn.type] && now - bossDeathTimes[spawn.type] >= spawn.respawnTime) {
      delete bossDeathTimes[spawn.type];
      delete activeBosses[spawn.type];
      spawnEnemy(spawn.type, spawn.x, spawn.z, true);
      io.emit('bossSpawn', { type: spawn.type, x: spawn.x, z: spawn.z });
    }
  }
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

  // Spawn bosses at their fixed locations
  spawnBosses();

  console.log(`Spawned ${Object.keys(enemies).length} enemies (including ${Object.keys(activeBosses).length} bosses)`);
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
    // Skip players who haven't started the game yet
    if (!player.active) continue;
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

    // Check line of sight to closest player
    const hasLOS = closestPlayer ?
      hasLineOfSight(enemy.x, enemy.z, closestPlayer.x, closestPlayer.z) : false;

    if (!closestPlayer) {
      // No players, patrol
      enemy.state = 'patrol';
      enemy.targetPlayer = null;
    } else if (closestPlayer.distance <= type.attackRange && hasLOS) {
      // In attack range AND has line of sight
      enemy.state = 'attack';
      enemy.targetPlayer = closestPlayer.id;
    } else if (closestPlayer.distance <= type.detectRange && hasLOS) {
      // Detected player and can see them, chase
      enemy.state = 'chase';
      enemy.targetPlayer = closestPlayer.id;
    } else if (closestPlayer.distance <= type.detectRange && !hasLOS && enemy.state === 'chase') {
      // Was chasing but lost LOS - keep chasing toward last known position briefly
      enemy.state = 'chase';
    } else {
      // Player too far or no line of sight, patrol
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

          // Double-check line of sight before attacking
          if (!hasLOS) {
            // Lost line of sight, chase instead
            enemy.state = 'chase';
            break;
          }

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

    // Boss-specific updates
    if (enemy.isBoss && closestPlayer) {
      updateBossAI(enemy, type, closestPlayer, delta);
    }

    // No bounds - infinite map
  }
}

// Boss-specific AI behavior
function updateBossAI(enemy, type, closestPlayer, delta) {
  const now = Date.now();

  // Check for enrage phase (below 25% health)
  if (type.enrageThreshold && enemy.health / enemy.maxHealth <= type.enrageThreshold && enemy.phase === 1) {
    enemy.phase = 2;
    io.emit('bossEnrage', { bossId: enemy.id, type: enemy.type });
    console.log(`Boss ${enemy.type} is now ENRAGED!`);
  }

  // Mech boss shield regeneration
  if (enemy.type === 'mechBoss' && enemy.shield < enemy.maxShield) {
    enemy.shield = Math.min(enemy.maxShield, enemy.shield + type.shieldRegenRate * delta);
  }

  // Special attack cooldowns
  if (type.specialAttackCooldown && now - enemy.lastSpecialAttack >= type.specialAttackCooldown) {
    if (closestPlayer.distance <= type.detectRange) {
      performBossSpecialAttack(enemy, type, closestPlayer);
      enemy.lastSpecialAttack = now;
    }
  }

  // Sky boss maintains flight height
  if (enemy.type === 'skyBoss') {
    enemy.y = type.flightHeight;
  }
}

// Boss special attacks
function performBossSpecialAttack(enemy, type, target) {
  const attackDamage = type.damage * 1.5; // Special attacks do 50% more damage

  switch (enemy.type) {
    case 'tankBoss':
      // Ground Slam - AOE damage to all nearby players
      console.log('Tank Boss: GROUND SLAM!');
      for (const playerId in players) {
        const player = players[playerId];
        if (!player.active) continue;
        const dist = getDistance(enemy, player);
        if (dist <= 15) { // 15 unit radius
          const falloff = 1 - (dist / 15);
          const damage = Math.floor(attackDamage * falloff);
          player.health -= damage;
          io.emit('bossSpecialAttack', {
            bossId: enemy.id,
            type: 'groundSlam',
            targetId: playerId,
            damage: damage,
            x: enemy.x,
            z: enemy.z,
            radius: 15
          });
          if (player.health <= 0) {
            handlePlayerDeathByBoss(playerId, enemy);
          }
        }
      }
      break;

    case 'mechBoss':
      // Rocket Barrage - Multiple projectiles
      console.log('Mech Boss: ROCKET BARRAGE!');
      io.emit('bossSpecialAttack', {
        bossId: enemy.id,
        type: 'rocketBarrage',
        targetX: target.x,
        targetZ: target.z,
        x: enemy.x,
        z: enemy.z
      });
      // Direct hit damage
      const targetPlayer = players[target.id];
      if (targetPlayer) {
        targetPlayer.health -= attackDamage;
        if (targetPlayer.health <= 0) {
          handlePlayerDeathByBoss(target.id, enemy);
        }
      }
      break;

    case 'skyBoss':
      // Dive Bomb - Fast dive attack
      console.log('Sky Boss: DIVE BOMB!');
      io.emit('bossSpecialAttack', {
        bossId: enemy.id,
        type: 'diveBomb',
        targetX: target.x,
        targetZ: target.z,
        x: enemy.x,
        z: enemy.z
      });
      // AOE damage at impact point
      for (const playerId in players) {
        const player = players[playerId];
        if (!player.active) continue;
        const dist = Math.sqrt(
          Math.pow(target.x - player.x, 2) + Math.pow(target.z - player.z, 2)
        );
        if (dist <= 8) { // 8 unit radius
          const damage = Math.floor(attackDamage * (1 - dist / 8));
          player.health -= damage;
          if (player.health <= 0) {
            handlePlayerDeathByBoss(playerId, enemy);
          }
        }
      }
      break;
  }
}

function handlePlayerDeathByBoss(playerId, enemy) {
  const player = players[playerId];
  if (!player) return;

  player.health = 100;
  player.x = Math.random() * 20 - 10;
  player.y = 2;
  player.z = Math.random() * 20 - 10;

  const bossName = enemy.type.replace('Boss', ' Boss').replace(/([A-Z])/g, ' $1').trim();

  io.emit('playerDeath', {
    playerId: playerId,
    playerName: player.name,
    playerTeam: player.team,
    killerId: enemy.id,
    killerName: bossName,
    killerTeam: 'none',
    isEnemyKill: true
  });
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
    checkBossRespawns(); // Check if any bosses should respawn
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
    team: 'none',
    active: false  // Not active until they start game
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
      players[socket.id].active = true;  // Player is now in game
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

  // Handle player going back to menu
  socket.on('setInactive', () => {
    if (players[socket.id]) {
      players[socket.id].active = false;
      io.emit('players', players);
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
      let actualDamage = data.damage;

      // Mech boss has shields
      if (enemy.type === 'mechBoss' && enemy.shield > 0) {
        const shieldDamage = Math.min(enemy.shield, actualDamage);
        enemy.shield -= shieldDamage;
        actualDamage -= shieldDamage;

        if (shieldDamage > 0) {
          io.emit('bossShieldHit', {
            bossId: data.enemyId,
            shieldDamage: shieldDamage,
            remainingShield: enemy.shield
          });
        }
      }

      // Apply remaining damage to health
      if (actualDamage > 0) {
        enemy.health -= actualDamage;
      }

      io.emit('enemyHit', {
        enemyId: data.enemyId,
        damage: data.damage,
        health: enemy.health,
        shield: enemy.shield || 0,
        isBoss: enemy.isBoss
      });

      if (enemy.health <= 0) {
        console.log(`Enemy ${data.enemyId} was killed by ${socket.id}`);

        // Boss death handling
        if (enemy.isBoss) {
          // Track death time for respawn
          bossDeathTimes[enemy.type] = Date.now();
          delete activeBosses[enemy.type];

          // Generate loot drop
          const lootTable = getBossLoot(enemy.type);

          io.emit('bossDeath', {
            bossId: data.enemyId,
            bossType: enemy.type,
            killerId: socket.id,
            killerName: players[socket.id]?.name || 'Unknown',
            x: enemy.x,
            z: enemy.z,
            loot: lootTable
          });

          console.log(`BOSS DEFEATED: ${enemy.type} by ${players[socket.id]?.name}`);

          // Remove boss from enemies
          delete enemies[data.enemyId];
        } else {
          // Regular enemy death
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
    }
  });

  // Boss loot table
  function getBossLoot(bossType) {
    const loot = [];

    switch (bossType) {
      case 'tankBoss':
        loot.push({ type: 'weapon', weapon: 'shotgun' });
        loot.push({ type: 'ammo', amount: 100 });
        loot.push({ type: 'health', amount: 100 });
        break;
      case 'mechBoss':
        loot.push({ type: 'weapon', weapon: 'rifle' });
        loot.push({ type: 'weapon', weapon: 'sniper' });
        loot.push({ type: 'ammo', amount: 150 });
        break;
      case 'skyBoss':
        loot.push({ type: 'weapon', weapon: 'sniper' });
        loot.push({ type: 'ammo', amount: 200 });
        loot.push({ type: 'health', amount: 50 });
        break;
    }

    return loot;
  }

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
