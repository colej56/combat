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

// ==================== GAME MODE SYSTEM ====================

const gameMode = {
  current: 'freeplay', // freeplay, ctf, wave, koth, deathmatch, battleroyale
  state: {},
  startTime: null,
  endTime: null
};

const GAME_MODE_CONFIG = {
  freeplay: {
    name: 'Free Play',
    description: 'No objectives, just explore and fight'
  },
  ctf: {
    name: 'Capture the Flag',
    scoreToWin: 3,
    flagReturnTime: 30000,
    redBase: { x: -100, z: 0 },
    blueBase: { x: 100, z: 0 }
  },
  wave: {
    name: 'Wave Survival',
    waveBreakTime: 10000,
    baseEnemyCount: 5,
    enemyMultiplier: 1.5
  },
  koth: {
    name: 'King of the Hill',
    pointsToWin: 100,
    zoneRadius: 15,
    zonePosition: { x: 0, z: 0 },
    pointsPerSecond: 1
  },
  deathmatch: {
    name: 'Deathmatch',
    duration: 300000 // 5 minutes
  },
  battleroyale: {
    name: 'Battle Royale',
    shrinkInterval: 60000,
    shrinkAmount: 30,
    damagePerSecond: 5,
    initialRadius: 200,
    minRadius: 10,
    center: { x: 0, z: 0 }
  }
};

// Initialize a game mode
function initializeGameMode(mode) {
  if (!GAME_MODE_CONFIG[mode]) return;

  gameMode.current = mode;
  gameMode.startTime = Date.now();
  gameMode.endTime = null;

  switch (mode) {
    case 'freeplay':
      gameMode.state = {};
      break;

    case 'deathmatch':
      gameMode.state = {
        endTime: Date.now() + GAME_MODE_CONFIG.deathmatch.duration,
        scores: {}
      };
      // Initialize scores for active players
      for (const id in players) {
        if (players[id].active) {
          gameMode.state.scores[id] = { kills: 0, deaths: 0, name: players[id].name };
        }
      }
      break;

    case 'koth':
      gameMode.state = {
        scores: { red: 0, blue: 0, green: 0, yellow: 0 },
        controllingTeam: null,
        contested: false,
        lastTick: Date.now()
      };
      break;

    case 'ctf':
      // 2v2 alliance system: Red+Green vs Blue+Yellow
      gameMode.state = {
        redgreenFlag: { position: { ...GAME_MODE_CONFIG.ctf.redBase }, carrier: null, atBase: true },
        blueyellowFlag: { position: { ...GAME_MODE_CONFIG.ctf.blueBase }, carrier: null, atBase: true },
        scores: { redgreen: 0, blueyellow: 0 }
      };
      break;

    case 'wave':
      gameMode.state = {
        waveNumber: 0,
        enemiesRemaining: 0,
        inWave: false,
        waveBreakEndTime: Date.now() + 5000
      };
      // Clear existing enemies for wave mode
      for (const id in enemies) {
        delete enemies[id];
      }
      break;

    case 'battleroyale':
      gameMode.state = {
        currentRadius: GAME_MODE_CONFIG.battleroyale.initialRadius,
        targetRadius: GAME_MODE_CONFIG.battleroyale.initialRadius,
        center: { ...GAME_MODE_CONFIG.battleroyale.center },
        lastShrink: Date.now(),
        phase: 0,
        playersAlive: 0
      };
      break;
  }

  console.log(`Game mode initialized: ${GAME_MODE_CONFIG[mode].name}`);
}

// Get distance between two points
function getDistance(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

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
  // HOSTILE NPC TYPES (for quests)
  bandit: {
    health: 80,
    damage: 12,
    speed: 6,
    attackRange: 25,
    detectRange: 45,
    attackCooldown: 1200,
    color: 0x884400,
    isBoss: false
  },
  wildlife: {
    health: 50,
    damage: 15,
    speed: 10,
    attackRange: 8,
    detectRange: 35,
    attackCooldown: 800,
    color: 0x555555,
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

// ==================== NPC SYSTEM ====================

const NPC_TYPES = {
  merchant: {
    name: 'Merchant',
    color: 0x00aa00,
    hostile: false,
    questGiver: true,
    interactRange: 5
  },
  survivor: {
    name: 'Survivor',
    color: 0x0088ff,
    hostile: false,
    questGiver: false,
    interactRange: 5
  },
  bandit: {
    name: 'Bandit',
    color: 0x884400,
    hostile: true,
    health: 80,
    damage: 12,
    speed: 6,
    attackRange: 25,
    detectRange: 45,
    attackCooldown: 1200
  },
  wildlife: {
    name: 'Wolf',
    color: 0x555555,
    hostile: true,
    health: 50,
    damage: 15,
    speed: 10,
    attackRange: 8,
    detectRange: 35,
    attackCooldown: 800
  }
};

const NPC_DIALOGUES = {
  merchant: {
    greeting: ["Welcome, traveler!", "Looking for supplies?", "I've got what you need."],
    options: [
      { text: "What do you sell?", response: "Ammo, weapons, medical supplies. All at fair prices." },
      { text: "Any work available?", response: "There's a bandit camp nearby causing trouble. Clear them out and I'll make it worth your while.", triggersQuest: 'clear_bandits' },
      { text: "What's the situation here?", response: "Dangerous times. Bandits everywhere, and wildlife gone feral. Stay alert out there." },
      { text: "Goodbye", response: "Stay safe, friend!" }
    ]
  },
  survivor: {
    greeting: ["Thank goodness, another survivor!", "You're not one of them, are you?", "Finally, a friendly face!"],
    options: [
      { text: "Are you okay?", response: "Hurt but alive. It's been rough out here." },
      { text: "Have you seen others?", response: "A few passed through. Headed north, I think." },
      { text: "Need any help?", response: "If you could take out some of those wolves nearby, I'd feel a lot safer.", triggersQuest: 'clear_wolves' },
      { text: "Stay safe", response: "You too, friend. Watch your back." }
    ]
  }
};

const QUESTS = {
  clear_bandits: {
    name: "Clear the Bandit Camp",
    description: "Eliminate 5 bandits threatening the area",
    objectives: [{ type: 'kill', target: 'bandit', count: 5, current: 0 }],
    rewards: { ammo: 100, health: 50 }
  },
  clear_wolves: {
    name: "Wolf Problem",
    description: "Take out 3 wolves threatening survivors",
    objectives: [{ type: 'kill', target: 'wildlife', count: 3, current: 0 }],
    rewards: { ammo: 50 }
  }
};

// Fixed NPC spawn locations
const NPC_SPAWNS = [
  { x: 50, z: 50, type: 'merchant' },
  { x: -50, z: 30, type: 'survivor' },
  { x: 80, z: -40, type: 'survivor' },
  { x: -30, z: -60, type: 'merchant' }
];

// Store NPCs and player quests
const npcs = {};
const playerQuests = {}; // { odId: { active: [], completed: [] } }

// Initialize NPCs
function initializeNPCs() {
  NPC_SPAWNS.forEach((spawn, index) => {
    const npcType = NPC_TYPES[spawn.type];
    const npcId = `npc_${spawn.type}_${index}`;
    npcs[npcId] = {
      id: npcId,
      type: spawn.type,
      name: npcType.name,
      x: spawn.x,
      y: 0,
      z: spawn.z,
      color: npcType.color,
      hostile: npcType.hostile,
      questGiver: npcType.questGiver || false,
      interactRange: npcType.interactRange || 5
    };
  });
  console.log(`Initialized ${Object.keys(npcs).length} NPCs`);
}

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
    const types = ['soldier', 'soldier', 'scout', 'heavy', 'bandit', 'bandit', 'wildlife'];
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

    const types = ['soldier', 'soldier', 'scout', 'heavy', 'bandit', 'bandit', 'wildlife'];
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

// Supply drop system
let lastSupplyDropTime = 0;
const SUPPLY_DROP_INTERVAL = 60000; // Every 60 seconds

function generateServerSupplyContents() {
  const contents = [];

  // Always give ammo
  contents.push({ type: 'ammo', amount: 50 });

  // Random weapon (30% chance)
  if (Math.random() < 0.3) {
    const weapons = ['rifle', 'shotgun', 'sniper'];
    contents.push({ type: 'weapon', weapon: weapons[Math.floor(Math.random() * weapons.length)] });
  }

  // Health (50% chance)
  if (Math.random() < 0.5) {
    contents.push({ type: 'health', amount: 50 });
  }

  return contents;
}

// ==================== GAME MODE UPDATE FUNCTIONS ====================

function updateDeathmatch() {
  if (gameMode.current !== 'deathmatch') return;

  const now = Date.now();
  const dm = gameMode.state;

  // Check if time is up
  if (now >= dm.endTime) {
    // Calculate winner
    let winner = null;
    let highestScore = -Infinity;

    for (const id in dm.scores) {
      const score = dm.scores[id].kills - dm.scores[id].deaths;
      if (score > highestScore) {
        highestScore = score;
        winner = { id, ...dm.scores[id], score };
      }
    }

    io.emit('gameModeEnd', { mode: 'deathmatch', winner, scores: dm.scores });
    initializeGameMode('freeplay');
    return;
  }

  // Broadcast timer and scores
  io.emit('dmUpdate', {
    timeRemaining: dm.endTime - now,
    scores: dm.scores
  });
}

function updateKOTH() {
  if (gameMode.current !== 'koth') return;

  const now = Date.now();
  const koth = gameMode.state;
  const config = GAME_MODE_CONFIG.koth;
  const deltaSeconds = (now - koth.lastTick) / 1000;
  koth.lastTick = now;

  // Count players in zone by team (4 teams)
  const teamsInZone = { red: 0, blue: 0, green: 0, yellow: 0 };

  for (const id in players) {
    const player = players[id];
    if (!player.active || player.team === 'none') continue;

    const dist = getDistance(player, config.zonePosition);
    if (dist <= config.zoneRadius) {
      teamsInZone[player.team]++;
    }
  }

  // Determine zone control - contested if 2+ teams present
  const teamsPresent = Object.entries(teamsInZone).filter(([team, count]) => count > 0);

  if (teamsPresent.length > 1) {
    koth.contested = true;
    koth.controllingTeam = null;
  } else if (teamsPresent.length === 1) {
    koth.contested = false;
    koth.controllingTeam = teamsPresent[0][0];
  } else {
    koth.contested = false;
    koth.controllingTeam = null;
  }

  // Award points to controlling team
  if (koth.controllingTeam && !koth.contested) {
    koth.scores[koth.controllingTeam] += config.pointsPerSecond * deltaSeconds;

    // Check win condition
    if (koth.scores[koth.controllingTeam] >= config.pointsToWin) {
      io.emit('gameModeEnd', { mode: 'koth', winner: koth.controllingTeam, scores: koth.scores });
      initializeGameMode('freeplay');
      return;
    }
  }

  // Broadcast state update
  io.emit('kothUpdate', {
    scores: {
      red: Math.floor(koth.scores.red),
      blue: Math.floor(koth.scores.blue),
      green: Math.floor(koth.scores.green),
      yellow: Math.floor(koth.scores.yellow)
    },
    controlling: koth.controllingTeam,
    contested: koth.contested
  });
}

// Helper to get player's alliance
function getAlliance(team) {
  if (team === 'red' || team === 'green') return 'redgreen';
  if (team === 'blue' || team === 'yellow') return 'blueyellow';
  return null;
}

function updateCTF() {
  if (gameMode.current !== 'ctf') return;

  const ctf = gameMode.state;
  const config = GAME_MODE_CONFIG.ctf;

  for (const id in players) {
    const player = players[id];
    if (!player.active || player.team === 'none') continue;

    const alliance = getAlliance(player.team);
    if (!alliance) continue;

    // Determine which flag is enemy and which is own based on alliance
    const enemyFlag = alliance === 'redgreen' ? ctf.blueyellowFlag : ctf.redgreenFlag;
    const ownFlag = alliance === 'redgreen' ? ctf.redgreenFlag : ctf.blueyellowFlag;
    const ownBase = alliance === 'redgreen' ? config.redBase : config.blueBase;
    const enemyBase = alliance === 'redgreen' ? config.blueBase : config.redBase;
    const enemyAlliance = alliance === 'redgreen' ? 'blueyellow' : 'redgreen';

    // Pick up enemy flag
    if (!enemyFlag.carrier && enemyFlag.atBase) {
      const dist = getDistance(player, enemyFlag.position);
      if (dist < 5) {
        enemyFlag.carrier = id;
        enemyFlag.atBase = false;
        io.emit('flagPickup', {
          alliance: enemyAlliance,
          carrierId: id,
          carrierName: player.name,
          carrierTeam: player.team
        });
      }
    }

    // Update flag position if carrying
    if (enemyFlag.carrier === id) {
      enemyFlag.position = { x: player.x, z: player.z };
    }

    // Capture flag at own base (must have own flag at base)
    if (enemyFlag.carrier === id && ownFlag.atBase) {
      const distToBase = getDistance(player, ownBase);
      if (distToBase < 5) {
        ctf.scores[alliance]++;
        enemyFlag.carrier = null;
        enemyFlag.atBase = true;
        enemyFlag.position = { ...enemyBase };

        io.emit('flagCapture', {
          alliance: alliance,
          playerName: player.name,
          playerTeam: player.team,
          scores: ctf.scores
        });

        // Check win condition
        if (ctf.scores[alliance] >= config.scoreToWin) {
          io.emit('gameModeEnd', { mode: 'ctf', winner: alliance, scores: ctf.scores });
          initializeGameMode('freeplay');
          return;
        }
      }
    }
  }

  // Broadcast flag positions
  io.emit('ctfUpdate', {
    redgreenFlag: { ...ctf.redgreenFlag },
    blueyellowFlag: { ...ctf.blueyellowFlag },
    scores: ctf.scores
  });
}

function updateWaveSurvival() {
  if (gameMode.current !== 'wave') return;

  const now = Date.now();
  const ws = gameMode.state;
  const config = GAME_MODE_CONFIG.wave;

  // Count alive players
  let playersAlive = 0;
  for (const id in players) {
    if (players[id].active && players[id].health > 0) {
      playersAlive++;
    }
  }

  // Check for game over
  if (ws.inWave && playersAlive === 0) {
    io.emit('gameModeEnd', { mode: 'wave', waveReached: ws.waveNumber });
    initializeGameMode('freeplay');
    return;
  }

  // Start next wave when break is over
  if (!ws.inWave && now >= ws.waveBreakEndTime && playersAlive > 0) {
    ws.waveNumber++;
    ws.inWave = true;
    ws.enemiesRemaining = Math.floor(config.baseEnemyCount * Math.pow(config.enemyMultiplier, ws.waveNumber - 1));

    // Spawn wave enemies
    for (let i = 0; i < ws.enemiesRemaining; i++) {
      const pos = getRandomSpawnNearPlayers();
      const enemyId = `wave_${ws.waveNumber}_${i}`;
      const types = ['soldier', 'scout', 'heavy'];
      const typeIndex = Math.min(Math.floor(ws.waveNumber / 3), 2);
      const type = types[Math.floor(Math.random() * (typeIndex + 1))];

      enemies[enemyId] = {
        ...ENEMY_TYPES[type],
        type,
        x: pos.x,
        z: pos.z,
        health: ENEMY_TYPES[type].health * (1 + ws.waveNumber * 0.1),
        state: 'patrol',
        targetPlayer: null
      };
    }

    io.emit('waveStart', { waveNumber: ws.waveNumber, enemyCount: ws.enemiesRemaining });
  }

  // Check if wave is complete
  if (ws.inWave) {
    ws.enemiesRemaining = Object.keys(enemies).filter(id => id.startsWith('wave_')).length;
    if (ws.enemiesRemaining <= 0) {
      ws.inWave = false;
      ws.waveBreakEndTime = now + config.waveBreakTime;
      io.emit('waveComplete', { waveNumber: ws.waveNumber, nextWaveIn: config.waveBreakTime });
    }
  }

  // Broadcast wave state
  io.emit('waveUpdate', {
    waveNumber: ws.waveNumber,
    enemiesRemaining: ws.enemiesRemaining,
    inWave: ws.inWave,
    breakTimeRemaining: ws.inWave ? 0 : Math.max(0, ws.waveBreakEndTime - now)
  });
}

function updateBattleRoyale() {
  if (gameMode.current !== 'battleroyale') return;

  const now = Date.now();
  const br = gameMode.state;
  const config = GAME_MODE_CONFIG.battleroyale;

  // Count alive players
  let playersAlive = 0;
  const alivePlayers = [];
  for (const id in players) {
    if (players[id].active && players[id].health > 0) {
      playersAlive++;
      alivePlayers.push({ id, name: players[id].name });
    }
  }
  br.playersAlive = playersAlive;

  // Check win condition
  if (playersAlive === 1) {
    io.emit('gameModeEnd', {
      mode: 'battleroyale',
      winner: alivePlayers[0]
    });
    initializeGameMode('freeplay');
    return;
  }

  if (playersAlive === 0) {
    io.emit('gameModeEnd', { mode: 'battleroyale', winner: null });
    initializeGameMode('freeplay');
    return;
  }

  // Shrink circle periodically
  if (now - br.lastShrink >= config.shrinkInterval && br.targetRadius > config.minRadius) {
    br.lastShrink = now;
    br.targetRadius = Math.max(config.minRadius, br.targetRadius - config.shrinkAmount);
    br.phase++;
    io.emit('brShrink', { phase: br.phase, targetRadius: br.targetRadius });
  }

  // Gradually shrink to target
  if (br.currentRadius > br.targetRadius) {
    br.currentRadius = Math.max(br.targetRadius, br.currentRadius - 0.5);
  }

  // Damage players outside circle
  for (const id in players) {
    const player = players[id];
    if (!player.active || player.health <= 0) continue;

    const dist = getDistance(player, br.center);
    if (dist > br.currentRadius) {
      const damage = config.damagePerSecond / TICK_RATE;
      player.health -= damage;

      if (player.health <= 0) {
        player.health = 0;
        io.emit('playerDeath', {
          playerId: id,
          playerName: player.name,
          playerTeam: player.team,
          killerName: 'The Storm',
          killerId: null,
          killerTeam: null,
          isEnemyKill: true
        });
      }
    }
  }

  // Broadcast BR state
  io.emit('brUpdate', {
    center: br.center,
    currentRadius: br.currentRadius,
    targetRadius: br.targetRadius,
    phase: br.phase,
    playersAlive: playersAlive
  });
}

setInterval(() => {
  const now = Date.now();
  const delta = (now - lastUpdate) / 1000;
  lastUpdate = now;

  // Update game mode logic
  updateDeathmatch();
  updateKOTH();
  updateCTF();
  updateWaveSurvival();
  updateBattleRoyale();

  // Only run AI for modes that use enemies
  if (gameMode.current !== 'battleroyale') {
    updateEnemyAI(delta);
  }

  // Periodically spawn/despawn enemies (not in wave or BR modes)
  if (gameMode.current !== 'wave' && gameMode.current !== 'battleroyale') {
    if (now - lastSpawnCheck > SPAWN_CHECK_INTERVAL) {
      lastSpawnCheck = now;
      despawnFarEnemies();
      spawnEnemiesNearPlayers();
      checkBossRespawns();
    }
  }

  // Periodically spawn supply drops
  const activePlayers = Object.values(players).filter(p => p.active);
  if (now - lastSupplyDropTime > SUPPLY_DROP_INTERVAL && activePlayers.length > 0) {
    lastSupplyDropTime = now;

    // Spawn near a random active player
    const target = activePlayers[Math.floor(Math.random() * activePlayers.length)];
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 20; // 30-50 units away

    const dropX = target.x + Math.cos(angle) * distance;
    const dropZ = target.z + Math.sin(angle) * distance;

    console.log(`Spawning supply drop at (${dropX.toFixed(0)}, ${dropZ.toFixed(0)})`);
    io.emit('serverSupplyDrop', {
      x: dropX,
      z: dropZ,
      contents: generateServerSupplyContents()
    });
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
  socket.emit('npcs', npcs);

  // Initialize player quests
  playerQuests[socket.id] = { active: [], completed: [] };

  // Handle player info (name, team, difficulty, gameMode)
  socket.on('setPlayerInfo', (data) => {
    if (players[socket.id]) {
      players[socket.id].name = (data.name || 'Player').substring(0, 16);
      players[socket.id].team = ['none', 'red', 'blue', 'green', 'yellow'].includes(data.team) ? data.team : 'none';
      players[socket.id].difficulty = ['easy', 'normal', 'hard'].includes(data.difficulty) ? data.difficulty : 'normal';
      players[socket.id].active = true;

      // Initialize game mode if specified
      if (data.gameMode && GAME_MODE_CONFIG[data.gameMode]) {
        if (gameMode.current === 'freeplay' || gameMode.current !== data.gameMode) {
          initializeGameMode(data.gameMode);
        }
      }

      console.log(`Player ${socket.id} joined as "${players[socket.id].name}" on team ${players[socket.id].team} (mode: ${gameMode.current})`);
      io.emit('players', players);

      // Send current game mode state to the new player
      socket.emit('gameModeState', {
        mode: gameMode.current,
        state: gameMode.state,
        config: GAME_MODE_CONFIG[gameMode.current]
      });
    }
  });

  // Handle game mode change request
  socket.on('setGameMode', (data) => {
    if (data.mode && GAME_MODE_CONFIG[data.mode]) {
      initializeGameMode(data.mode);
      io.emit('gameModeChanged', {
        mode: gameMode.current,
        state: gameMode.state,
        config: GAME_MODE_CONFIG[gameMode.current]
      });
    }
  });

  // Handle request for current game state
  socket.on('requestGameState', () => {
    socket.emit('gameModeState', {
      mode: gameMode.current,
      state: gameMode.state,
      config: GAME_MODE_CONFIG[gameMode.current]
    });
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

  // Handle player-called supply drop (from kill streaks)
  socket.on('supplyDrop', (data) => {
    io.emit('playerSupplyDrop', {
      x: data.x,
      z: data.z,
      playerId: socket.id
    });
  });

  // Handle airstrike (from kill streaks)
  socket.on('airstrike', (data) => {
    const AIRSTRIKE_RADIUS = 15;
    const AIRSTRIKE_DAMAGE = 100;

    console.log(`Airstrike called at (${data.x.toFixed(0)}, ${data.z.toFixed(0)}) by ${socket.id}`);

    // Damage all enemies in radius
    for (const id in enemies) {
      const enemy = enemies[id];
      const dist = Math.sqrt(Math.pow(enemy.x - data.x, 2) + Math.pow(enemy.z - data.z, 2));
      if (dist <= AIRSTRIKE_RADIUS) {
        enemy.health -= AIRSTRIKE_DAMAGE;
        if (enemy.health <= 0) {
          io.emit('enemyDeath', { enemyId: id, killerId: socket.id });
          // Respawn enemy after delay
          setTimeout(() => respawnEnemy(id), 5000);
        } else {
          io.emit('enemyHit', { enemyId: id, health: enemy.health });
        }
      }
    }

    // Broadcast airstrike effect to all clients
    io.emit('airstrikeEffect', { x: data.x, z: data.z, playerId: socket.id });
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

        // Update deathmatch scores
        if (gameMode.current === 'deathmatch') {
          if (gameMode.state.scores[socket.id]) {
            gameMode.state.scores[socket.id].kills++;
          }
          if (gameMode.state.scores[data.targetId]) {
            gameMode.state.scores[data.targetId].deaths++;
          }
        }

        // CTF: Drop flag on death (alliance system)
        if (gameMode.current === 'ctf') {
          const ctf = gameMode.state;
          if (ctf.redgreenFlag.carrier === data.targetId) {
            ctf.redgreenFlag.carrier = null;
            io.emit('flagDrop', { team: 'redgreen', position: ctf.redgreenFlag.position });
          }
          if (ctf.blueyellowFlag.carrier === data.targetId) {
            ctf.blueyellowFlag.carrier = null;
            io.emit('flagDrop', { team: 'blueyellow', position: ctf.blueyellowFlag.position });
          }
        }
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

          // Update quest progress for bandit/wildlife kills
          const pq = playerQuests[socket.id];
          if (pq && pq.active.length > 0) {
            const enemyType = enemy.type;
            pq.active.forEach(quest => {
              quest.objectives.forEach(obj => {
                if (obj.type === 'kill' && obj.target === enemyType && obj.current < obj.count) {
                  obj.current++;
                  socket.emit('questProgress', {
                    questId: quest.id,
                    objectives: quest.objectives
                  });

                  // Check if quest is complete
                  const allComplete = quest.objectives.every(o => o.current >= o.count);
                  if (allComplete) {
                    // Remove from active and add to completed
                    pq.active = pq.active.filter(q => q.id !== quest.id);
                    pq.completed.push(quest.id);

                    socket.emit('questComplete', {
                      questId: quest.id,
                      questName: quest.name,
                      rewards: quest.rewards
                    });
                  }
                }
              });
            });
          }

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

  // ==================== NPC INTERACTION HANDLERS ====================

  // Player initiates dialogue with NPC
  socket.on('interactNPC', (data) => {
    const npc = npcs[data.npcId];
    if (!npc || npc.hostile) return;

    const player = players[socket.id];
    if (!player) return;

    // Check if player is in range
    const distance = getDistance(player.x, player.z, npc.x, npc.z);
    if (distance > npc.interactRange) return;

    // Get dialogue for this NPC type
    const dialogue = NPC_DIALOGUES[npc.type];
    if (!dialogue) return;

    // Pick a random greeting
    const greeting = dialogue.greeting[Math.floor(Math.random() * dialogue.greeting.length)];

    // Filter out quest options if player already has/completed that quest
    const pq = playerQuests[socket.id] || { active: [], completed: [] };
    const filteredOptions = dialogue.options.filter(opt => {
      if (opt.triggersQuest) {
        const hasQuest = pq.active.some(q => q.id === opt.triggersQuest);
        const completedQuest = pq.completed.includes(opt.triggersQuest);
        return !hasQuest && !completedQuest;
      }
      return true;
    });

    socket.emit('npcDialogue', {
      npcId: npc.id,
      npcName: npc.name,
      greeting: greeting,
      options: filteredOptions.map((opt, index) => ({ index, text: opt.text }))
    });
  });

  // Player selects a dialogue option
  socket.on('dialogueChoice', (data) => {
    const npc = npcs[data.npcId];
    if (!npc || npc.hostile) return;

    const dialogue = NPC_DIALOGUES[npc.type];
    if (!dialogue) return;

    const option = dialogue.options[data.optionIndex];
    if (!option) return;

    // Send response
    socket.emit('npcResponse', {
      npcId: npc.id,
      npcName: npc.name,
      response: option.response
    });

    // Trigger quest if applicable
    if (option.triggersQuest) {
      const questDef = QUESTS[option.triggersQuest];
      if (!questDef) return;

      const pq = playerQuests[socket.id];
      if (!pq) return;

      // Check if player doesn't already have this quest
      const hasQuest = pq.active.some(q => q.id === option.triggersQuest);
      const completedQuest = pq.completed.includes(option.triggersQuest);

      if (!hasQuest && !completedQuest) {
        // Create a copy of the quest for this player
        const playerQuest = {
          id: option.triggersQuest,
          name: questDef.name,
          description: questDef.description,
          objectives: questDef.objectives.map(obj => ({ ...obj, current: 0 })),
          rewards: { ...questDef.rewards }
        };
        pq.active.push(playerQuest);

        socket.emit('questStarted', {
          quest: playerQuest
        });
      }
    }
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    delete playerQuests[socket.id];
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

// Initialize NPCs before server starts
initializeNPCs();

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║           COMBAT SERVER               ║
╠═══════════════════════════════════════╣
║  Server running on port ${PORT}          ║
║  http://localhost:${PORT}                ║
║  Enemies: ${Object.keys(enemies).length} spawned              ║
║  NPCs: ${Object.keys(npcs).length} spawned                 ║
╚═══════════════════════════════════════╝
  `);
});
