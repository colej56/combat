import * as THREE from 'three';
import { io } from 'socket.io-client';

// Weapon definitions
const WEAPONS = {
  pistol: {
    name: 'Pistol',
    damage: 25,
    fireRate: 400,
    reloadTime: 1500,
    magSize: 12,
    maxAmmo: 48,
    spread: 0.02,
    automatic: false
  },
  rifle: {
    name: 'Rifle',
    damage: 35,
    fireRate: 100,
    reloadTime: 2500,
    magSize: 30,
    maxAmmo: 90,
    spread: 0.04,
    automatic: true
  },
  shotgun: {
    name: 'Shotgun',
    damage: 15,
    fireRate: 800,
    reloadTime: 2000,
    magSize: 8,
    maxAmmo: 32,
    spread: 0.1,
    pellets: 8,
    automatic: false
  }
};

// Enemy type colors
const ENEMY_COLORS = {
  soldier: 0xff0000,
  scout: 0xff6600,
  heavy: 0x990000
};

// Game state
const state = {
  gameState: 'menu', // menu, playing, paused
  isPlaying: false,
  isPaused: false,
  difficulty: 'normal',
  health: 100,
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  canJump: true,
  isSprinting: false,
  velocity: new THREE.Vector3(),
  direction: new THREE.Vector3(),
  players: {},
  enemies: {},
  currentWeapon: 'pistol',
  ammoInMag: WEAPONS.pistol.magSize,
  ammoReserve: WEAPONS.pistol.maxAmmo,
  isReloading: false,
  canShoot: true,
  isShooting: false
};

// Difficulty multipliers
const DIFFICULTY_SETTINGS = {
  easy: { damageMultiplier: 0.5, enemySpeedMultiplier: 0.8, label: 'Easy' },
  normal: { damageMultiplier: 1.0, enemySpeedMultiplier: 1.0, label: 'Normal' },
  hard: { damageMultiplier: 1.5, enemySpeedMultiplier: 1.3, label: 'Hard' }
};

// Constants
const MOVE_SPEED = 100;
const SPRINT_MULTIPLIER = 1.6;
const JUMP_VELOCITY = 15;
const GRAVITY = 30;
const PLAYER_HEIGHT = 2;

// Three.js setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 50, 500);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = PLAYER_HEIGHT;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(500, 500);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x3d8c40, roughness: 0.8 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Store collidable objects for raycasting
const collidableObjects = [ground];

// Create buildings
function createBuilding(x, z, width, height, depth, color) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({ color });
  const building = new THREE.Mesh(geometry, material);
  building.position.set(x, height / 2, z);
  building.castShadow = true;
  building.receiveShadow = true;
  scene.add(building);
  collidableObjects.push(building);
  return building;
}

// Add buildings
createBuilding(20, 20, 10, 15, 10, 0x808080);
createBuilding(-30, 40, 15, 20, 12, 0x606060);
createBuilding(50, -20, 8, 10, 8, 0x707070);
createBuilding(-40, -30, 12, 25, 10, 0x505050);
createBuilding(0, 60, 20, 12, 15, 0x909090);
createBuilding(-60, 0, 10, 18, 10, 0x555555);
createBuilding(70, 50, 14, 22, 12, 0x656565);

// Create portal
const portalGeometry = new THREE.TorusGeometry(5, 0.5, 16, 100);
const portalMaterial = new THREE.MeshStandardMaterial({
  color: 0x9932cc,
  emissive: 0x9932cc,
  emissiveIntensity: 0.5
});
const portal = new THREE.Mesh(portalGeometry, portalMaterial);
portal.position.set(100, 6, 100);
portal.rotation.y = Math.PI / 4;
scene.add(portal);

const portalInnerGeometry = new THREE.CircleGeometry(4.5, 32);
const portalInnerMaterial = new THREE.MeshBasicMaterial({
  color: 0xda70d6,
  transparent: true,
  opacity: 0.7,
  side: THREE.DoubleSide
});
const portalInner = new THREE.Mesh(portalInnerGeometry, portalInnerMaterial);
portalInner.position.copy(portal.position);
portalInner.rotation.y = Math.PI / 4;
scene.add(portalInner);

// Create vehicles
function createVehicle(x, z, type) {
  const group = new THREE.Group();
  if (type === 'car') {
    const bodyGeometry = new THREE.BoxGeometry(4, 1.5, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    group.add(body);
    const topGeometry = new THREE.BoxGeometry(2, 1, 1.8);
    const top = new THREE.Mesh(topGeometry, bodyMaterial);
    top.position.y = 2;
    top.castShadow = true;
    group.add(top);
  } else if (type === 'motorcycle') {
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    body.castShadow = true;
    group.add(body);
  }
  group.position.set(x, 0, z);
  scene.add(group);
  return group;
}

createVehicle(15, -10, 'car');
createVehicle(-25, 15, 'car');
createVehicle(45, 30, 'motorcycle');
createVehicle(-50, -40, 'car');
createVehicle(30, 70, 'motorcycle');

// ==================== ENEMY SYSTEM ====================

function createEnemyMesh(type) {
  const group = new THREE.Group();
  const color = ENEMY_COLORS[type] || 0xff0000;

  // Body
  const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.8);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.75;
  body.castShadow = true;
  group.add(body);

  // Head
  const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffccaa });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 1.8;
  head.castShadow = true;
  group.add(head);

  // Arms
  const armGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
  const armMaterial = new THREE.MeshStandardMaterial({ color });

  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-0.65, 0.75, 0);
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(0.65, 0.75, 0);
  rightArm.castShadow = true;
  group.add(rightArm);

  // Legs
  const legGeometry = new THREE.BoxGeometry(0.35, 0.8, 0.35);
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.25, -0.4, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(0.25, -0.4, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // Gun (simple)
  const gunGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.5);
  const gunMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const gun = new THREE.Mesh(gunGeometry, gunMaterial);
  gun.position.set(0.65, 0.6, -0.3);
  group.add(gun);

  // Health bar background
  const healthBarBg = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.15),
    new THREE.MeshBasicMaterial({ color: 0x333333 })
  );
  healthBarBg.position.y = 2.3;
  healthBarBg.name = 'healthBarBg';
  group.add(healthBarBg);

  // Health bar fill
  const healthBarFill = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.1),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  healthBarFill.position.y = 2.3;
  healthBarFill.position.z = 0.01;
  healthBarFill.name = 'healthBarFill';
  group.add(healthBarFill);

  // Store body mesh for hit detection
  group.userData.bodyMesh = body;

  return group;
}

function updateEnemyHealthBar(enemyGroup, healthPercent) {
  const healthBar = enemyGroup.children.find(c => c.name === 'healthBarFill');
  if (healthBar) {
    healthBar.scale.x = Math.max(0, healthPercent);
    healthBar.position.x = -(1.1 * (1 - healthPercent)) / 2;

    // Color based on health
    if (healthPercent > 0.6) {
      healthBar.material.color.setHex(0x00ff00);
    } else if (healthPercent > 0.3) {
      healthBar.material.color.setHex(0xffff00);
    } else {
      healthBar.material.color.setHex(0xff0000);
    }
  }
}

// ==================== WEAPON SYSTEM ====================

const weaponGroup = new THREE.Group();

function createWeaponModel(type) {
  while (weaponGroup.children.length > 0) {
    weaponGroup.remove(weaponGroup.children[0]);
  }

  const gunMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

  if (type === 'pistol') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.25), gunMaterial);
    weaponGroup.add(body);
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.2), gunMaterial);
    barrel.position.set(0, 0.03, -0.2);
    weaponGroup.add(barrel);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.08), gunMaterial);
    grip.position.set(0, -0.1, 0.05);
    grip.rotation.x = -0.3;
    weaponGroup.add(grip);
  } else if (type === 'rifle') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.5), gunMaterial);
    body.position.set(0, 0, -0.1);
    weaponGroup.add(body);
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.35), gunMaterial);
    barrel.position.set(0, 0.02, -0.5);
    weaponGroup.add(barrel);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.2), gunMaterial);
    stock.position.set(0, -0.02, 0.2);
    weaponGroup.add(stock);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.08), gunMaterial);
    mag.position.set(0, -0.12, 0);
    weaponGroup.add(mag);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.06), gunMaterial);
    grip.position.set(0, -0.08, 0.1);
    grip.rotation.x = -0.2;
    weaponGroup.add(grip);
  } else if (type === 'shotgun') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.45), gunMaterial);
    body.position.set(0, 0, -0.05);
    weaponGroup.add(body);
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.4), gunMaterial);
    barrel.position.set(0, 0.02, -0.45);
    weaponGroup.add(barrel);
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.15), new THREE.MeshStandardMaterial({ color: 0x654321 }));
    pump.position.set(0, -0.02, -0.25);
    weaponGroup.add(pump);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.25), new THREE.MeshStandardMaterial({ color: 0x654321 }));
    stock.position.set(0, -0.02, 0.25);
    weaponGroup.add(stock);
  }

  weaponGroup.position.set(0.25, -0.2, -0.5);
  weaponGroup.rotation.set(0, 0, 0);
}

camera.add(weaponGroup);
scene.add(camera);
createWeaponModel(state.currentWeapon);

// Muzzle flash
const muzzleFlashGeometry = new THREE.SphereGeometry(0.08, 8, 8);
const muzzleFlashMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  transparent: true,
  opacity: 0
});
const muzzleFlash = new THREE.Mesh(muzzleFlashGeometry, muzzleFlashMaterial);
muzzleFlash.position.set(0.25, -0.15, -0.9);
camera.add(muzzleFlash);

// Hit effect particles
const hitParticles = [];

function createHitEffect(position, color = 0xff6600) {
  const geometry = new THREE.SphereGeometry(0.1, 4, 4);
  const material = new THREE.MeshBasicMaterial({ color });

  for (let i = 0; i < 5; i++) {
    const particle = new THREE.Mesh(geometry, material.clone());
    particle.position.copy(position);
    particle.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 5,
      Math.random() * 5,
      (Math.random() - 0.5) * 5
    );
    particle.life = 0.5;
    scene.add(particle);
    hitParticles.push(particle);
  }
}

function createBulletTrail(start, end) {
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const material = new THREE.LineBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.8
  });
  const line = new THREE.Line(geometry, material);
  line.life = 0.1;
  scene.add(line);
  hitParticles.push(line);
}

// Raycaster for shooting
const raycaster = new THREE.Raycaster();

function shoot() {
  const weapon = WEAPONS[state.currentWeapon];

  if (!state.canShoot || state.isReloading || state.ammoInMag <= 0) {
    if (state.ammoInMag <= 0 && !state.isReloading) {
      reload();
    }
    return;
  }

  state.canShoot = false;
  state.ammoInMag--;
  updateAmmoDisplay();

  // Muzzle flash
  muzzleFlashMaterial.opacity = 1;
  setTimeout(() => { muzzleFlashMaterial.opacity = 0; }, 50);

  // Weapon recoil
  weaponGroup.position.z += 0.05;
  weaponGroup.rotation.x -= 0.05;
  setTimeout(() => {
    weaponGroup.position.z = -0.5;
    weaponGroup.rotation.x = 0;
  }, 50);

  const shootDirection = new THREE.Vector3(0, 0, -1);
  shootDirection.applyQuaternion(camera.quaternion);

  const pelletCount = weapon.pellets || 1;

  // Collect all hittable objects (including enemies)
  const allTargets = [...collidableObjects];
  for (const id in state.enemies) {
    const enemyData = state.enemies[id];
    if (enemyData.mesh) {
      allTargets.push(enemyData.mesh);
      // Add all children meshes for hit detection
      enemyData.mesh.traverse((child) => {
        if (child.isMesh) {
          allTargets.push(child);
        }
      });
    }
  }

  for (let i = 0; i < pelletCount; i++) {
    const spread = new THREE.Vector3(
      (Math.random() - 0.5) * weapon.spread,
      (Math.random() - 0.5) * weapon.spread,
      0
    );
    spread.applyQuaternion(camera.quaternion);

    const direction = shootDirection.clone().add(spread).normalize();

    raycaster.set(camera.position, direction);
    const intersects = raycaster.intersectObjects(allTargets, true);

    const trailEnd = intersects.length > 0
      ? intersects[0].point
      : camera.position.clone().add(direction.multiplyScalar(100));
    createBulletTrail(camera.position.clone(), trailEnd);

    if (intersects.length > 0) {
      const hit = intersects[0];
      createHitEffect(hit.point);

      // Check if hit a player
      for (const id in state.players) {
        const playerMesh = state.players[id];
        if (hit.object === playerMesh) {
          socket.emit('hit', { targetId: id, damage: weapon.damage });
        }
      }

      // Check if hit an enemy
      for (const id in state.enemies) {
        const enemyData = state.enemies[id];
        if (enemyData.mesh) {
          let hitEnemy = false;
          enemyData.mesh.traverse((child) => {
            if (child === hit.object) {
              hitEnemy = true;
            }
          });
          if (hitEnemy) {
            socket.emit('hitEnemy', { enemyId: id, damage: weapon.damage });
            createHitEffect(hit.point, 0xff0000);
          }
        }
      }
    }
  }

  socket.emit('shoot', {
    position: camera.position,
    direction: shootDirection,
    weapon: state.currentWeapon
  });

  setTimeout(() => {
    state.canShoot = true;
  }, weapon.fireRate);
}

function reload() {
  const weapon = WEAPONS[state.currentWeapon];

  if (state.isReloading || state.ammoReserve <= 0 || state.ammoInMag >= weapon.magSize) {
    return;
  }

  state.isReloading = true;
  document.getElementById('ammo-text').textContent = 'Reloading...';

  const originalPos = weaponGroup.position.y;
  weaponGroup.position.y -= 0.3;

  setTimeout(() => {
    const ammoNeeded = weapon.magSize - state.ammoInMag;
    const ammoToLoad = Math.min(ammoNeeded, state.ammoReserve);

    state.ammoInMag += ammoToLoad;
    state.ammoReserve -= ammoToLoad;
    state.isReloading = false;

    weaponGroup.position.y = originalPos;
    updateAmmoDisplay();
  }, weapon.reloadTime);
}

function switchWeapon(weaponType) {
  if (state.currentWeapon === weaponType || state.isReloading) return;

  state.currentWeapon = weaponType;
  const weapon = WEAPONS[weaponType];
  state.ammoInMag = weapon.magSize;
  state.ammoReserve = weapon.maxAmmo;

  createWeaponModel(weaponType);
  updateAmmoDisplay();
  updateWeaponDisplay();
}

function updateAmmoDisplay() {
  document.getElementById('ammo-count').textContent = `${state.ammoInMag}`;
  document.getElementById('ammo-reserve').textContent = `${state.ammoReserve}`;
  document.getElementById('ammo-text').textContent = 'Ammo';
}

function updateWeaponDisplay() {
  document.getElementById('weapon-name').textContent = WEAPONS[state.currentWeapon].name;
}

// ==================== CONTROLS ====================

const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const PI_2 = Math.PI / 2;

function onMouseMove(event) {
  if (!state.isPlaying) return;

  const movementX = event.movementX || 0;
  const movementY = event.movementY || 0;

  euler.setFromQuaternion(camera.quaternion);
  euler.y -= movementX * 0.002;
  euler.x -= movementY * 0.002;
  euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));

  camera.quaternion.setFromEuler(euler);
}

// UI Elements
const mainMenu = document.getElementById('main-menu');
const pauseMenu = document.getElementById('pause-menu');
const pauseOverlay = document.getElementById('pause-overlay');
const crosshair = document.getElementById('crosshair');
const difficultyDisplay = document.getElementById('difficulty-display');
const resumeBtn = document.getElementById('resume-btn');
const quitBtn = document.getElementById('quit-btn');

// Start game with selected difficulty
function startGame(difficulty) {
  state.difficulty = difficulty;
  state.gameState = 'playing';
  state.isPlaying = true;
  state.isPaused = false;
  state.health = 100;

  // Reset position
  camera.position.set(0, PLAYER_HEIGHT, 0);

  // Update UI
  mainMenu.classList.add('hidden');
  crosshair.classList.remove('hidden');
  difficultyDisplay.textContent = `Difficulty: ${DIFFICULTY_SETTINGS[difficulty].label}`;
  updateHealth();

  // Send difficulty to server
  socket.emit('setDifficulty', { difficulty });

  // Lock pointer
  renderer.domElement.requestPointerLock();
}

// Pause game
function pauseGame() {
  if (state.gameState !== 'playing') return;

  state.gameState = 'paused';
  state.isPlaying = false;
  state.isPaused = true;

  pauseMenu.classList.remove('hidden');
  pauseOverlay.classList.add('active');
  crosshair.classList.add('hidden');

  document.exitPointerLock();
}

// Resume game
function resumeGame() {
  if (state.gameState !== 'paused') return;

  state.gameState = 'playing';
  state.isPlaying = true;
  state.isPaused = false;

  pauseMenu.classList.add('hidden');
  pauseOverlay.classList.remove('active');
  crosshair.classList.remove('hidden');

  renderer.domElement.requestPointerLock();
}

// Quit to menu
function quitToMenu() {
  state.gameState = 'menu';
  state.isPlaying = false;
  state.isPaused = false;

  pauseMenu.classList.add('hidden');
  pauseOverlay.classList.remove('active');
  mainMenu.classList.remove('hidden');
  crosshair.classList.add('hidden');

  document.exitPointerLock();
}

// Difficulty button handlers
document.querySelectorAll('.difficulty-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const difficulty = btn.dataset.difficulty;
    startGame(difficulty);
  });
});

// Pause menu button handlers
resumeBtn.addEventListener('click', resumeGame);
quitBtn.addEventListener('click', quitToMenu);

// Pointer lock change handler
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === renderer.domElement) {
    if (state.gameState === 'paused') {
      state.gameState = 'playing';
      state.isPaused = false;
      pauseMenu.classList.add('hidden');
      pauseOverlay.classList.remove('active');
    }
    state.isPlaying = true;
    crosshair.classList.remove('hidden');
  } else {
    // Pointer lock released
    if (state.gameState === 'playing') {
      // Auto-pause when pointer lock is lost during gameplay
      pauseGame();
    }
  }
});

document.addEventListener('mousemove', onMouseMove);

document.addEventListener('mousedown', (event) => {
  if (!state.isPlaying || state.isPaused || event.button !== 0) return;
  state.isShooting = true;
  shoot();
});

document.addEventListener('mouseup', (event) => {
  if (event.button === 0) {
    state.isShooting = false;
  }
});

document.addEventListener('keydown', (event) => {
  // ESC key handling
  if (event.code === 'Escape') {
    if (state.gameState === 'playing') {
      pauseGame();
    } else if (state.gameState === 'paused') {
      resumeGame();
    }
    return;
  }

  if (!state.isPlaying || state.isPaused) return;

  switch (event.code) {
    case 'KeyW': state.moveForward = true; break;
    case 'KeyS': state.moveBackward = true; break;
    case 'KeyA': state.moveLeft = true; break;
    case 'KeyD': state.moveRight = true; break;
    case 'Space':
      if (state.canJump) {
        state.velocity.y = JUMP_VELOCITY;
        state.canJump = false;
      }
      break;
    case 'ShiftLeft': state.isSprinting = true; break;
    case 'KeyR': reload(); break;
    case 'Digit1': switchWeapon('pistol'); break;
    case 'Digit2': switchWeapon('rifle'); break;
    case 'Digit3': switchWeapon('shotgun'); break;
  }
});

document.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyW': state.moveForward = false; break;
    case 'KeyS': state.moveBackward = false; break;
    case 'KeyA': state.moveLeft = false; break;
    case 'KeyD': state.moveRight = false; break;
    case 'ShiftLeft': state.isSprinting = false; break;
  }
});

// ==================== NETWORKING ====================

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('players', (players) => {
  document.getElementById('player-count').textContent = `Players: ${Object.keys(players).length}`;

  for (const id in players) {
    if (id === socket.id) continue;

    if (!state.players[id]) {
      const geometry = new THREE.BoxGeometry(1, 2, 1);
      const material = new THREE.MeshStandardMaterial({ color: 0x0066ff });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      scene.add(mesh);
      state.players[id] = mesh;
      collidableObjects.push(mesh);
    }

    state.players[id].position.set(players[id].x, players[id].y, players[id].z);
  }

  for (const id in state.players) {
    if (!players[id]) {
      scene.remove(state.players[id]);
      const idx = collidableObjects.indexOf(state.players[id]);
      if (idx > -1) collidableObjects.splice(idx, 1);
      delete state.players[id];
    }
  }
});

// Enemy updates from server
socket.on('enemies', (enemies) => {
  for (const id in enemies) {
    const enemyData = enemies[id];

    if (!state.enemies[id]) {
      // Create new enemy mesh
      const mesh = createEnemyMesh(enemyData.type);
      scene.add(mesh);
      state.enemies[id] = { mesh, data: enemyData };
    }

    // Update enemy position and rotation
    const enemy = state.enemies[id];
    enemy.mesh.position.set(enemyData.x, enemyData.y, enemyData.z);
    enemy.mesh.rotation.y = enemyData.rotation;
    enemy.data = enemyData;

    // Update health bar
    const healthPercent = enemyData.health / enemyData.maxHealth;
    updateEnemyHealthBar(enemy.mesh, healthPercent);

    // Make health bar face camera
    enemy.mesh.children.forEach(child => {
      if (child.name === 'healthBarBg' || child.name === 'healthBarFill') {
        child.lookAt(camera.position);
      }
    });

    // Hide dead enemies
    enemy.mesh.visible = enemyData.health > 0;
  }

  // Remove enemies that no longer exist
  for (const id in state.enemies) {
    if (!enemies[id]) {
      scene.remove(state.enemies[id].mesh);
      delete state.enemies[id];
    }
  }

  // Update enemy count in UI
  const aliveEnemies = Object.values(enemies).filter(e => e.health > 0).length;
  document.getElementById('enemy-count').textContent = `Enemies: ${aliveEnemies}`;
});

socket.on('playerShoot', (data) => {
  if (data.playerId === socket.id) return;

  const start = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
  const dir = new THREE.Vector3(data.direction.x, data.direction.y, data.direction.z);
  const end = start.clone().add(dir.multiplyScalar(100));
  createBulletTrail(start, end);
});

socket.on('playerHit', (data) => {
  if (data.targetId === socket.id) {
    state.health -= data.damage;
    if (state.health < 0) state.health = 0;
    updateHealth();

    document.getElementById('damage-overlay').style.opacity = 0.3;
    setTimeout(() => {
      document.getElementById('damage-overlay').style.opacity = 0;
    }, 100);

    if (state.health <= 0) {
      console.log('You died!');
      state.health = 100;
      camera.position.set(0, PLAYER_HEIGHT, 0);
      updateHealth();
    }
  }
});

// Enemy attack - player takes damage from enemy (applies difficulty multiplier)
socket.on('enemyAttack', (data) => {
  if (data.targetId === socket.id) {
    // Apply difficulty damage multiplier
    const diffSettings = DIFFICULTY_SETTINGS[state.difficulty];
    const actualDamage = Math.round(data.damage * diffSettings.damageMultiplier);

    state.health -= actualDamage;
    if (state.health < 0) state.health = 0;
    updateHealth();

    document.getElementById('damage-overlay').style.opacity = 0.4;
    setTimeout(() => {
      document.getElementById('damage-overlay').style.opacity = 0;
    }, 150);

    if (state.health <= 0) {
      console.log('You were killed by an enemy!');
      state.health = 100;
      camera.position.set(0, PLAYER_HEIGHT, 0);
      updateHealth();
    }
  }
});

socket.on('enemyHit', (data) => {
  // Visual feedback handled by server updating enemy health
});

socket.on('enemyDeath', (data) => {
  console.log(`Enemy ${data.enemyId} was killed!`);
  // Create death effect
  const enemy = state.enemies[data.enemyId];
  if (enemy) {
    createHitEffect(enemy.mesh.position.clone(), 0xff0000);
  }
});

socket.on('enemyRespawn', (data) => {
  console.log(`Enemy ${data.enemyId} respawned`);
});

// ==================== UI UPDATES ====================

function updateHealth() {
  document.getElementById('health-fill').style.width = `${state.health}%`;

  const healthFill = document.getElementById('health-fill');
  if (state.health > 60) {
    healthFill.style.background = '#27ae60';
  } else if (state.health > 30) {
    healthFill.style.background = '#f39c12';
  } else {
    healthFill.style.background = '#e74c3c';
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==================== GAME LOOP ====================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (state.isPlaying && !state.isPaused && state.isShooting && WEAPONS[state.currentWeapon].automatic) {
    shoot();
  }

  // Update hit particles
  for (let i = hitParticles.length - 1; i >= 0; i--) {
    const particle = hitParticles[i];
    particle.life -= delta;

    if (particle.life <= 0) {
      scene.remove(particle);
      hitParticles.splice(i, 1);
    } else if (particle.velocity) {
      particle.position.add(particle.velocity.clone().multiplyScalar(delta));
      particle.velocity.y -= 10 * delta;
      particle.material.opacity = particle.life * 2;
    } else if (particle.material) {
      particle.material.opacity = particle.life * 8;
    }
  }

  if (state.isPlaying && !state.isPaused) {
    state.velocity.y -= GRAVITY * delta;

    state.direction.z = Number(state.moveForward) - Number(state.moveBackward);
    state.direction.x = Number(state.moveRight) - Number(state.moveLeft);
    state.direction.normalize();

    const speed = state.isSprinting ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED;

    if (state.moveForward || state.moveBackward) {
      state.velocity.z = -state.direction.z * speed;
    } else {
      state.velocity.z = 0;
    }

    if (state.moveLeft || state.moveRight) {
      state.velocity.x = -state.direction.x * speed;
    } else {
      state.velocity.x = 0;
    }

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    camera.position.addScaledVector(forward, -state.velocity.z * delta);
    camera.position.addScaledVector(right, state.velocity.x * delta);
    camera.position.y += state.velocity.y * delta;

    if (camera.position.y < PLAYER_HEIGHT) {
      camera.position.y = PLAYER_HEIGHT;
      state.velocity.y = 0;
      state.canJump = true;
    }

    socket.emit('move', {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    });
  }

  portal.rotation.z += delta * 0.5;
  portalInner.rotation.z -= delta * 0.3;

  renderer.render(scene, camera);
}

// Initialize displays
updateHealth();
updateAmmoDisplay();
updateWeaponDisplay();
animate();
