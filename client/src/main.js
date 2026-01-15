import * as THREE from 'three';
import { io } from 'socket.io-client';

// ==================== AUDIO SYSTEM ====================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type, options = {}) {
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  switch (type) {
    case 'pistol': {
      // Sharp, punchy pistol sound
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.1);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
      break;
    }

    case 'rifle': {
      // Rapid, lighter rifle sound
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const noise = audioCtx.createOscillator();
      const noiseGain = audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      noise.type = 'sawtooth';
      noise.frequency.setValueAtTime(800, now);
      noiseGain.gain.setValueAtTime(0.1, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

      osc.connect(gain);
      noise.connect(noiseGain);
      gain.connect(audioCtx.destination);
      noiseGain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
      noise.start(now);
      noise.stop(now + 0.03);
      break;
    }

    case 'shotgun': {
      // Deep, booming shotgun sound
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(200, now);
      osc2.frequency.exponentialRampToValueAtTime(50, now + 0.1);

      gain2.gain.setValueAtTime(0.3, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      osc2.connect(gain2);
      gain.connect(audioCtx.destination);
      gain2.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
      osc2.start(now);
      osc2.stop(now + 0.15);
      break;
    }

    case 'reload': {
      // Mechanical click sounds
      const click1 = audioCtx.createOscillator();
      const click2 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      const gain2 = audioCtx.createGain();

      click1.type = 'square';
      click1.frequency.setValueAtTime(800, now);
      gain1.gain.setValueAtTime(0.1, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      click2.type = 'square';
      click2.frequency.setValueAtTime(600, now + 0.2);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.15, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      click1.connect(gain1);
      click2.connect(gain2);
      gain1.connect(audioCtx.destination);
      gain2.connect(audioCtx.destination);

      click1.start(now);
      click1.stop(now + 0.05);
      click2.start(now + 0.2);
      click2.stop(now + 0.25);
      break;
    }

    case 'hit': {
      // Pain/impact sound
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
      break;
    }

    case 'enemyHit': {
      // Enemy taking damage
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
      break;
    }

    case 'enemyDeath': {
      // Enemy death sound
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
      break;
    }

    case 'death': {
      // Player death sound
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(300, now + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(80, now + 0.6);

      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.2, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.connect(gain);
      osc2.connect(gain2);
      gain.connect(audioCtx.destination);
      gain2.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.6);
      break;
    }

    case 'footstep': {
      // Soft footstep
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100 + Math.random() * 50, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
      break;
    }

    case 'empty': {
      // Empty clip click
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, now);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.02);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.02);
      break;
    }

    case 'engine': {
      // Engine rumble sound
      const osc = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      const speed = options.speed || 0;
      const baseFreq = 40 + speed * 0.5;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, now);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(baseFreq * 0.5, now);

      gain.gain.setValueAtTime(0.03 + speed * 0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
      osc2.start(now);
      osc2.stop(now + 0.1);
      break;
    }

    case 'vehicleEnter': {
      // Vehicle door/start sound
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
      break;
    }

    case 'flashlightOn': {
      // Click on sound
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
      break;
    }

    case 'flashlightOff': {
      // Click off sound (lower pitch)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
      break;
    }

    case 'pickup': {
      // Health pickup sound - cheerful ascending tone
      const osc = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      osc.frequency.setValueAtTime(800, now + 0.2);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(600, now);
      osc2.frequency.setValueAtTime(900, now + 0.1);
      osc2.frequency.setValueAtTime(1200, now + 0.2);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
      osc2.start(now);
      osc2.stop(now + 0.3);
      break;
    }

    case 'pickupAmmo': {
      // Ammo pickup sound - metallic click
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(600, now + 0.05);
      osc.frequency.setValueAtTime(400, now + 0.1);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
      break;
    }
  }
}

// Footstep tracking
let lastFootstepTime = 0;
const FOOTSTEP_INTERVAL = 400; // ms between footsteps
const FOOTSTEP_SPRINT_INTERVAL = 250; // faster when sprinting

// Engine sound tracking
let lastEngineSoundTime = 0;
const ENGINE_SOUND_INTERVAL = 100; // ms between engine sounds

// Screen shake system
let screenShake = { intensity: 0, decay: 0.9 };

function triggerScreenShake(intensity) {
  screenShake.intensity = Math.max(screenShake.intensity, intensity);
}

function updateScreenShake(camera) {
  if (screenShake.intensity > 0.01) {
    camera.rotation.x += (Math.random() - 0.5) * screenShake.intensity * 0.1;
    camera.rotation.y += (Math.random() - 0.5) * screenShake.intensity * 0.1;
    screenShake.intensity *= screenShake.decay;
  } else {
    screenShake.intensity = 0;
  }
}

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
  },
  sniper: {
    name: 'Sniper',
    damage: 100,
    fireRate: 1500,
    reloadTime: 3000,
    magSize: 5,
    maxAmmo: 20,
    spread: 0.005,
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
  isShooting: false,
  isDead: false,
  lastKiller: null,
  playerName: 'Player',
  team: 'none', // none, red, blue
  isChatting: false,
  // Stats
  kills: 0,
  deaths: 0,
  // Vehicle state
  inVehicle: false,
  currentVehicle: null,
  vehicleSpeed: 0,
  vehicleRotation: 0,
  // Aircraft state
  vehiclePitch: 0,
  vehicleRoll: 0,
  vehicleAltitude: 0,
  // Flashlight
  flashlightOn: false,
  // Weapons inventory
  weapons: {
    pistol: true,   // Player starts with pistol
    rifle: false,
    shotgun: false,
    sniper: false
  },
  // Parachute state
  isParachuting: false,
  parachuteVelocity: new THREE.Vector3(0, 0, 0),
  parachuteMesh: null
};

// ==================== VEHICLE SYSTEM ====================
const vehicles = {};
let vehicleIdCounter = 0;

// Vehicle type configurations
const VEHICLE_TYPES = {
  jeep: {
    maxSpeed: 60,
    acceleration: 25,
    brake: 40,
    turnSpeed: 2.5,
    friction: 10,
    cameraHeight: 4,
    cameraDistance: 8,
    isAircraft: false
  },
  motorcycle: {
    maxSpeed: 90,
    acceleration: 35,
    brake: 50,
    turnSpeed: 3.5,
    friction: 15,
    cameraHeight: 3,
    cameraDistance: 6,
    isAircraft: false
  },
  aircraft: {
    maxSpeed: 150,
    acceleration: 40,
    brake: 20,
    turnSpeed: 1.5,
    friction: 5,
    cameraHeight: 8,
    cameraDistance: 20,
    isAircraft: true,
    minSpeed: 40,        // Stall speed
    pitchSpeed: 1.2,     // How fast it pitches up/down
    rollSpeed: 2.0,      // How fast it rolls
    maxPitch: Math.PI / 4,  // Max pitch angle (45 degrees)
    liftFactor: 0.02     // How much speed converts to lift
  }
};

function createJeepMesh() {
  const group = new THREE.Group();

  // Main body
  const bodyGeo = new THREE.BoxGeometry(2.5, 1, 4);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a6741 }); // Army green
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.8;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Hood
  const hoodGeo = new THREE.BoxGeometry(2.3, 0.3, 1.2);
  const hood = new THREE.Mesh(hoodGeo, bodyMat);
  hood.position.set(0, 1.1, 1.2);
  hood.castShadow = true;
  group.add(hood);

  // Cab/roof frame
  const cabGeo = new THREE.BoxGeometry(2.3, 0.8, 1.8);
  const cab = new THREE.Mesh(cabGeo, bodyMat);
  cab.position.set(0, 1.7, -0.3);
  cab.castShadow = true;
  group.add(cab);

  // Windshield
  const windshieldGeo = new THREE.BoxGeometry(2.1, 0.6, 0.1);
  const windshieldMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.5 });
  const windshield = new THREE.Mesh(windshieldGeo, windshieldMat);
  windshield.position.set(0, 1.5, 0.55);
  windshield.rotation.x = -0.2;
  group.add(windshield);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

  const wheelPositions = [
    { x: -1.1, z: 1.3 },  // Front left
    { x: 1.1, z: 1.3 },   // Front right
    { x: -1.1, z: -1.3 }, // Back left
    { x: 1.1, z: -1.3 }   // Back right
  ];

  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos.x, 0.4, pos.z);
    wheel.castShadow = true;
    group.add(wheel);
  });

  // Headlights
  const lightGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1);
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffffcc, emissiveIntensity: 0.3 });
  const leftLight = new THREE.Mesh(lightGeo, lightMat);
  leftLight.position.set(-0.7, 0.9, 2);
  group.add(leftLight);
  const rightLight = new THREE.Mesh(lightGeo, lightMat);
  rightLight.position.set(0.7, 0.9, 2);
  group.add(rightLight);

  // Seat position marker (invisible, for player positioning)
  const seatMarker = new THREE.Object3D();
  seatMarker.position.set(0, 1.5, -0.2);
  seatMarker.name = 'seat';
  group.add(seatMarker);

  group.userData.type = 'jeep';
  group.userData.isVehicle = true;

  return group;
}

function createMotorcycleMesh() {
  const group = new THREE.Group();

  // Frame/body - dark metal
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xcc0000 }); // Red accents

  // Main frame tube
  const frameGeo = new THREE.BoxGeometry(0.3, 0.4, 2);
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, 0.7, 0);
  frame.rotation.x = 0.1;
  frame.castShadow = true;
  group.add(frame);

  // Fuel tank
  const tankGeo = new THREE.BoxGeometry(0.5, 0.4, 0.8);
  const tank = new THREE.Mesh(tankGeo, accentMat);
  tank.position.set(0, 1, 0.2);
  tank.castShadow = true;
  group.add(tank);

  // Seat
  const seatGeo = new THREE.BoxGeometry(0.4, 0.15, 0.7);
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
  const seat = new THREE.Mesh(seatGeo, seatMat);
  seat.position.set(0, 1.0, -0.4);
  seat.castShadow = true;
  group.add(seat);

  // Front fork
  const forkGeo = new THREE.BoxGeometry(0.1, 0.8, 0.15);
  const leftFork = new THREE.Mesh(forkGeo, frameMat);
  leftFork.position.set(-0.2, 0.6, 1);
  leftFork.rotation.x = -0.3;
  group.add(leftFork);
  const rightFork = new THREE.Mesh(forkGeo, frameMat);
  rightFork.position.set(0.2, 0.6, 1);
  rightFork.rotation.x = -0.3;
  group.add(rightFork);

  // Handlebars
  const handleGeo = new THREE.BoxGeometry(1, 0.08, 0.08);
  const handlebar = new THREE.Mesh(handleGeo, frameMat);
  handlebar.position.set(0, 1.2, 0.9);
  group.add(handlebar);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

  // Front wheel
  const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
  frontWheel.rotation.z = Math.PI / 2;
  frontWheel.position.set(0, 0.4, 1.1);
  frontWheel.castShadow = true;
  group.add(frontWheel);

  // Rear wheel
  const rearWheel = new THREE.Mesh(wheelGeo, wheelMat);
  rearWheel.rotation.z = Math.PI / 2;
  rearWheel.position.set(0, 0.4, -0.8);
  rearWheel.castShadow = true;
  group.add(rearWheel);

  // Engine block
  const engineGeo = new THREE.BoxGeometry(0.5, 0.35, 0.5);
  const engine = new THREE.Mesh(engineGeo, frameMat);
  engine.position.set(0, 0.5, -0.1);
  engine.castShadow = true;
  group.add(engine);

  // Exhaust pipes
  const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8);
  const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
  exhaust.rotation.x = Math.PI / 2;
  exhaust.position.set(0.25, 0.4, -0.5);
  group.add(exhaust);

  // Headlight
  const lightGeo = new THREE.SphereGeometry(0.12, 8, 8);
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffffcc, emissiveIntensity: 0.5 });
  const headlight = new THREE.Mesh(lightGeo, lightMat);
  headlight.position.set(0, 1, 1.2);
  group.add(headlight);

  // Seat position marker (invisible, for player positioning)
  const seatMarker = new THREE.Object3D();
  seatMarker.position.set(0, 1.3, -0.3);
  seatMarker.name = 'seat';
  group.add(seatMarker);

  group.userData.type = 'motorcycle';
  group.userData.isVehicle = true;

  return group;
}

function createAircraftMesh() {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3a5f8a }); // Blue-gray
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xcc0000 }); // Red accents
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.6 });

  // Fuselage (main body)
  const fuselageGeo = new THREE.CylinderGeometry(0.8, 0.5, 6, 8);
  const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.set(0, 0, 0);
  fuselage.castShadow = true;
  group.add(fuselage);

  // Nose cone
  const noseGeo = new THREE.ConeGeometry(0.5, 1.5, 8);
  const nose = new THREE.Mesh(noseGeo, bodyMat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0, 3.7);
  nose.castShadow = true;
  group.add(nose);

  // Cockpit canopy
  const canopyGeo = new THREE.SphereGeometry(0.6, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const canopy = new THREE.Mesh(canopyGeo, glassMat);
  canopy.position.set(0, 0.5, 1);
  canopy.scale.set(1, 0.6, 1.5);
  group.add(canopy);

  // Main wings
  const wingGeo = new THREE.BoxGeometry(10, 0.15, 1.5);
  const wings = new THREE.Mesh(wingGeo, bodyMat);
  wings.position.set(0, 0, -0.5);
  wings.castShadow = true;
  group.add(wings);

  // Wing tips (red)
  const wingTipGeo = new THREE.BoxGeometry(0.8, 0.15, 1.5);
  const leftWingTip = new THREE.Mesh(wingTipGeo, accentMat);
  leftWingTip.position.set(-5.4, 0, -0.5);
  group.add(leftWingTip);
  const rightWingTip = new THREE.Mesh(wingTipGeo, accentMat);
  rightWingTip.position.set(5.4, 0, -0.5);
  group.add(rightWingTip);

  // Tail fin (vertical stabilizer)
  const tailFinGeo = new THREE.BoxGeometry(0.15, 1.5, 1);
  const tailFin = new THREE.Mesh(tailFinGeo, bodyMat);
  tailFin.position.set(0, 0.75, -2.8);
  tailFin.castShadow = true;
  group.add(tailFin);

  // Horizontal stabilizers
  const hStabGeo = new THREE.BoxGeometry(3, 0.1, 0.8);
  const hStab = new THREE.Mesh(hStabGeo, bodyMat);
  hStab.position.set(0, 0, -2.8);
  hStab.castShadow = true;
  group.add(hStab);

  // Propeller hub
  const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8);
  const hub = new THREE.Mesh(hubGeo, new THREE.MeshStandardMaterial({ color: 0x333333 }));
  hub.rotation.x = Math.PI / 2;
  hub.position.set(0, 0, 4.3);
  hub.name = 'propellerHub';
  group.add(hub);

  // Propeller blades
  const bladeGeo = new THREE.BoxGeometry(0.2, 2, 0.05);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
  const blade1 = new THREE.Mesh(bladeGeo, bladeMat);
  blade1.position.set(0, 0, 4.4);
  blade1.name = 'propeller';
  group.add(blade1);
  const blade2 = new THREE.Mesh(bladeGeo, bladeMat);
  blade2.rotation.z = Math.PI / 2;
  blade2.position.set(0, 0, 4.4);
  blade2.name = 'propeller2';
  group.add(blade2);

  // Landing gear
  const gearMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 8);

  // Front gear
  const frontGearStrut = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), gearMat);
  frontGearStrut.position.set(0, -0.6, 2);
  group.add(frontGearStrut);
  const frontWheel = new THREE.Mesh(wheelGeo, gearMat);
  frontWheel.rotation.z = Math.PI / 2;
  frontWheel.position.set(0, -1, 2);
  group.add(frontWheel);

  // Rear gear (two wheels)
  const rearGearStrut1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), gearMat);
  rearGearStrut1.position.set(-1, -0.5, -1);
  group.add(rearGearStrut1);
  const rearWheel1 = new THREE.Mesh(wheelGeo, gearMat);
  rearWheel1.rotation.z = Math.PI / 2;
  rearWheel1.position.set(-1, -0.8, -1);
  group.add(rearWheel1);

  const rearGearStrut2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), gearMat);
  rearGearStrut2.position.set(1, -0.5, -1);
  group.add(rearGearStrut2);
  const rearWheel2 = new THREE.Mesh(wheelGeo, gearMat);
  rearWheel2.rotation.z = Math.PI / 2;
  rearWheel2.position.set(1, -0.8, -1);
  group.add(rearWheel2);

  group.userData.type = 'aircraft';
  group.userData.isVehicle = true;
  group.userData.isAircraft = true;

  return group;
}

function spawnVehicle(x, z, rotation = 0, type = 'jeep') {
  const id = `vehicle_${vehicleIdCounter++}`;
  let mesh;
  if (type === 'aircraft') {
    mesh = createAircraftMesh();
  } else if (type === 'motorcycle') {
    mesh = createMotorcycleMesh();
  } else {
    mesh = createJeepMesh();
  }
  const startY = type === 'aircraft' ? 1.5 : 0; // Aircraft start slightly above ground
  mesh.position.set(x, startY, z);
  mesh.rotation.y = rotation;
  mesh.userData.vehicleId = id;

  scene.add(mesh);

  vehicles[id] = {
    id,
    type,
    mesh,
    x,
    z,
    y: startY,
    rotation,
    speed: 0,
    occupied: false,
    driver: null,
    // Aircraft-specific properties
    pitch: 0,
    roll: 0
  };

  return id;
}

function getNearestVehicle(position, maxDistance = 5) {
  let nearest = null;
  let nearestDist = maxDistance;

  for (const id in vehicles) {
    const vehicle = vehicles[id];
    const dx = vehicle.mesh.position.x - position.x;
    const dz = vehicle.mesh.position.z - position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < nearestDist && !vehicle.occupied) {
      nearest = vehicle;
      nearestDist = dist;
    }
  }

  return nearest;
}

function enterVehicle(vehicle) {
  if (state.inVehicle || vehicle.occupied) return;

  state.inVehicle = true;
  state.currentVehicle = vehicle;
  state.vehicleSpeed = 0;
  vehicle.occupied = true;
  vehicle.driver = socket.id;

  // Initialize aircraft state if entering aircraft
  const config = VEHICLE_TYPES[vehicle.type];
  if (config && config.isAircraft) {
    state.vehiclePitch = 0;
    state.vehicleRoll = 0;
    state.vehicleAltitude = vehicle.mesh.position.y || 2;
  }

  // Play enter sound
  playSound('vehicleEnter');

  // Hide weapon while in vehicle
  weaponGroup.visible = false;

  // Notify server
  socket.emit('enterVehicle', { vehicleId: vehicle.id });

  // Update UI
  showVehicleHUD(true);
}

function exitVehicle() {
  if (!state.inVehicle || !state.currentVehicle) return;

  const vehicle = state.currentVehicle;

  // Play exit sound
  playSound('vehicleEnter');

  // Position player next to vehicle
  const exitOffset = new THREE.Vector3(-3, 0, 0);
  exitOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), vehicle.mesh.rotation.y);

  camera.position.x = vehicle.mesh.position.x + exitOffset.x;
  camera.position.z = vehicle.mesh.position.z + exitOffset.z;
  camera.position.y = PLAYER_HEIGHT;

  vehicle.occupied = false;
  vehicle.driver = null;

  state.inVehicle = false;
  state.currentVehicle = null;
  state.vehicleSpeed = 0;

  // Show weapon again
  weaponGroup.visible = true;

  // Notify server
  socket.emit('exitVehicle', { vehicleId: vehicle.id });

  // Update UI
  showVehicleHUD(false);
}

function updateAircraft(delta, vehicle, config) {
  // Throttle control - W accelerates, S decelerates
  if (state.moveForward) {
    state.vehicleSpeed += config.acceleration * delta;
  } else if (state.moveBackward) {
    state.vehicleSpeed -= config.brake * delta;
  } else {
    // Gradual slowdown from air resistance
    state.vehicleSpeed -= config.friction * delta * 0.3;
  }

  // Clamp speed
  state.vehicleSpeed = Math.max(0, Math.min(config.maxSpeed, state.vehicleSpeed));

  // Pitch control - W/S when moving pitches up/down
  if (state.vehicleSpeed > config.minSpeed) {
    if (state.moveForward) {
      // Pitch up when accelerating (climb)
      state.vehiclePitch = Math.max(-config.maxPitch, state.vehiclePitch - config.pitchSpeed * delta);
    } else if (state.moveBackward) {
      // Pitch down when decelerating (dive)
      state.vehiclePitch = Math.min(config.maxPitch, state.vehiclePitch + config.pitchSpeed * delta);
    } else {
      // Level out gradually
      state.vehiclePitch *= 0.95;
    }
  } else {
    // Nose down when stalling
    state.vehiclePitch = Math.min(config.maxPitch * 0.8, state.vehiclePitch + config.pitchSpeed * delta * 0.5);
  }

  // Roll and yaw control - A/D
  if (state.vehicleSpeed > config.minSpeed * 0.5) {
    if (state.moveLeft) {
      state.vehicleRoll = Math.max(-Math.PI / 3, state.vehicleRoll - config.rollSpeed * delta);
      vehicle.mesh.rotation.y += config.turnSpeed * delta;
    } else if (state.moveRight) {
      state.vehicleRoll = Math.min(Math.PI / 3, state.vehicleRoll + config.rollSpeed * delta);
      vehicle.mesh.rotation.y -= config.turnSpeed * delta;
    } else {
      // Level out roll
      state.vehicleRoll *= 0.9;
    }
  } else {
    // Reduce roll control at low speed
    state.vehicleRoll *= 0.95;
  }

  // Calculate lift based on speed
  const liftForce = state.vehicleSpeed * config.liftFactor;

  // Calculate altitude change based on pitch and lift
  const altitudeChange = -Math.sin(state.vehiclePitch) * state.vehicleSpeed * delta;

  // Apply gravity when below stall speed
  const gravity = state.vehicleSpeed < config.minSpeed ? -15 * delta : 0;

  // Update altitude
  state.vehicleAltitude += altitudeChange + liftForce * delta + gravity;

  // Ground collision
  const groundLevel = 2; // Minimum flight altitude
  if (state.vehicleAltitude < groundLevel) {
    state.vehicleAltitude = groundLevel;
    // If hitting ground at high speed, crash
    if (state.vehicleSpeed > 20 && state.vehiclePitch > 0.2) {
      // Crash landing - exit vehicle and take damage
      exitVehicle();
      state.health = Math.max(1, state.health - 30);
      updateHealthBar();
      return;
    }
    // Level out on ground
    state.vehiclePitch = Math.min(0, state.vehiclePitch);
  }

  // Update vehicle position
  const direction = new THREE.Vector3(0, 0, 1);
  direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), vehicle.mesh.rotation.y);

  vehicle.mesh.position.x += direction.x * state.vehicleSpeed * delta;
  vehicle.mesh.position.z += direction.z * state.vehicleSpeed * delta;
  vehicle.mesh.position.y = state.vehicleAltitude;

  // Check for collisions with objects
  const aircraftPos = vehicle.mesh.position;
  const aircraftRadius = 4; // Collision radius for aircraft

  for (const obj of collidableObjects) {
    if (!obj.userData || obj === vehicle.mesh) continue;

    // Get object bounding box
    const box = new THREE.Box3().setFromObject(obj);
    const objCenter = new THREE.Vector3();
    box.getCenter(objCenter);
    const objSize = new THREE.Vector3();
    box.getSize(objSize);

    // Check if aircraft is within object bounds (with some padding)
    const dx = Math.abs(aircraftPos.x - objCenter.x);
    const dy = Math.abs(aircraftPos.y - objCenter.y);
    const dz = Math.abs(aircraftPos.z - objCenter.z);

    const hitX = dx < (objSize.x / 2 + aircraftRadius);
    const hitY = dy < (objSize.y / 2 + 2); // Aircraft height
    const hitZ = dz < (objSize.z / 2 + aircraftRadius);

    if (hitX && hitY && hitZ) {
      // Crash! Damage based on speed
      const crashDamage = Math.min(100, Math.floor(state.vehicleSpeed * 0.8));
      exitVehicle();
      state.health = Math.max(0, state.health - crashDamage);
      updateHealthBar();

      // Check if player died from crash
      if (state.health <= 0) {
        socket.emit('playerDeath', { killedBy: 'crash' });
      }

      playSound('explosion');
      return;
    }
  }

  // Apply pitch and roll to mesh
  vehicle.mesh.rotation.x = state.vehiclePitch;
  vehicle.mesh.rotation.z = state.vehicleRoll;

  // Animate propeller
  if (vehicle.mesh.userData.propeller) {
    vehicle.mesh.userData.propeller.rotation.z += state.vehicleSpeed * 0.5 * delta;
  }

  // Third-person camera follow
  const cameraDistance = config.cameraDistance;
  const cameraHeight = config.cameraHeight;

  // Camera behind and above the aircraft
  const cameraOffset = new THREE.Vector3(0, cameraHeight, -cameraDistance);
  cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), vehicle.mesh.rotation.y);

  camera.position.x = vehicle.mesh.position.x + cameraOffset.x;
  camera.position.y = vehicle.mesh.position.y + cameraHeight;
  camera.position.z = vehicle.mesh.position.z + cameraOffset.z;

  // Look at the aircraft
  camera.lookAt(vehicle.mesh.position);

  // Update vehicle data for networking
  vehicle.x = vehicle.mesh.position.x;
  vehicle.y = vehicle.mesh.position.y;
  vehicle.z = vehicle.mesh.position.z;
  vehicle.rotation = vehicle.mesh.rotation.y;
  vehicle.pitch = state.vehiclePitch;
  vehicle.roll = state.vehicleRoll;
  vehicle.speed = state.vehicleSpeed;

  // Update speedometer with altitude display
  updateSpeedometer(state.vehicleSpeed, state.vehicleAltitude);

  // Engine sound
  const now = Date.now();
  if (now - lastEngineSoundTime > ENGINE_SOUND_INTERVAL && state.vehicleSpeed > 10) {
    playSound('engine', { speed: state.vehicleSpeed });
    lastEngineSoundTime = now;
  }

  // Emit vehicle update
  socket.emit('vehicleUpdate', {
    vehicleId: vehicle.id,
    x: vehicle.x,
    y: vehicle.y,
    z: vehicle.z,
    rotation: vehicle.rotation,
    pitch: vehicle.pitch,
    roll: vehicle.roll,
    speed: vehicle.speed
  });
}

function updateVehicle(delta) {
  if (!state.inVehicle || !state.currentVehicle) return;

  const vehicle = state.currentVehicle;
  const config = VEHICLE_TYPES[vehicle.type] || VEHICLE_TYPES.jeep;

  // Handle aircraft separately
  if (config.isAircraft) {
    updateAircraft(delta, vehicle, config);
    return;
  }

  // Ground vehicle logic
  // Acceleration/braking
  if (state.moveForward) {
    state.vehicleSpeed += config.acceleration * delta;
  } else if (state.moveBackward) {
    state.vehicleSpeed -= config.brake * delta;
  } else {
    // Apply friction when no input
    if (state.vehicleSpeed > 0) {
      state.vehicleSpeed = Math.max(0, state.vehicleSpeed - config.friction * delta);
    } else if (state.vehicleSpeed < 0) {
      state.vehicleSpeed = Math.min(0, state.vehicleSpeed + config.friction * delta);
    }
  }

  // Clamp speed
  state.vehicleSpeed = Math.max(-config.maxSpeed * 0.3, Math.min(config.maxSpeed, state.vehicleSpeed));

  // Steering (only effective when moving)
  if (Math.abs(state.vehicleSpeed) > 1) {
    const turnAmount = config.turnSpeed * delta * (state.vehicleSpeed > 0 ? 1 : -1);
    if (state.moveLeft) {
      vehicle.mesh.rotation.y += turnAmount;
    }
    if (state.moveRight) {
      vehicle.mesh.rotation.y -= turnAmount;
    }
  }

  // Move vehicle
  const direction = new THREE.Vector3(0, 0, 1);
  direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), vehicle.mesh.rotation.y);

  vehicle.mesh.position.x += direction.x * state.vehicleSpeed * delta;
  vehicle.mesh.position.z += direction.z * state.vehicleSpeed * delta;

  // Update camera to follow vehicle (driver view) - adjusted based on vehicle type
  const cameraOffset = new THREE.Vector3(0, config.cameraHeight, -0.5);
  cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), vehicle.mesh.rotation.y);

  camera.position.x = vehicle.mesh.position.x + cameraOffset.x;
  camera.position.y = vehicle.mesh.position.y + config.cameraHeight;
  camera.position.z = vehicle.mesh.position.z + cameraOffset.z;

  // Update vehicle data
  vehicle.x = vehicle.mesh.position.x;
  vehicle.z = vehicle.mesh.position.z;
  vehicle.rotation = vehicle.mesh.rotation.y;
  vehicle.speed = state.vehicleSpeed;

  // Update speedometer
  updateSpeedometer(Math.abs(state.vehicleSpeed));

  // Engine sound
  const now = Date.now();
  if (now - lastEngineSoundTime > ENGINE_SOUND_INTERVAL && Math.abs(state.vehicleSpeed) > 1) {
    playSound('engine', { speed: Math.abs(state.vehicleSpeed) });
    lastEngineSoundTime = now;
  }

  // Emit vehicle update
  socket.emit('vehicleUpdate', {
    vehicleId: vehicle.id,
    x: vehicle.x,
    z: vehicle.z,
    rotation: vehicle.rotation,
    speed: vehicle.speed
  });
}

function showVehicleHUD(show) {
  const vehicleHud = document.getElementById('vehicle-hud');
  if (vehicleHud) {
    vehicleHud.classList.toggle('hidden', !show);
    // Update vehicle name and style based on type
    if (show && state.currentVehicle) {
      const vehicleName = vehicleHud.querySelector('.vehicle-name');
      const vehicleType = state.currentVehicle.type;
      const vehicleControls = vehicleHud.querySelector('.vehicle-controls');
      if (vehicleName) {
        if (vehicleType === 'aircraft') {
          vehicleName.textContent = 'Aircraft';
        } else if (vehicleType === 'motorcycle') {
          vehicleName.textContent = 'Motorcycle';
        } else {
          vehicleName.textContent = 'Jeep';
        }
      }
      if (vehicleControls) {
        if (vehicleType === 'aircraft') {
          vehicleControls.innerHTML = '<span>W/S</span> throttle | <span>A/D</span> turn | <span>Space</span> bail out | <span>E</span> land';
        } else {
          vehicleControls.innerHTML = '<span>WASD</span> to drive | <span>E</span> to exit';
        }
      }
      vehicleHud.classList.toggle('motorcycle', vehicleType === 'motorcycle');
      vehicleHud.classList.toggle('aircraft', vehicleType === 'aircraft');
    } else {
      vehicleHud.classList.remove('motorcycle');
      vehicleHud.classList.remove('aircraft');
    }
  }
}

function updateSpeedometer(speed, altitude) {
  const speedText = document.getElementById('speed-value');
  if (speedText) {
    speedText.textContent = Math.round(speed);
  }
  // Show altitude for aircraft
  const altText = document.getElementById('altitude-value');
  if (altText) {
    if (altitude !== undefined) {
      altText.textContent = Math.round(altitude);
      altText.parentElement.style.display = 'block';
    } else {
      altText.parentElement.style.display = 'none';
    }
  }
}

// ==================== PARACHUTE SYSTEM ====================

const PARACHUTE_FALL_SPEED = 5; // Slow descent
const PARACHUTE_MOVE_SPEED = 15; // Horizontal movement
const PARACHUTE_MIN_DEPLOY_HEIGHT = 10; // Minimum height to deploy

function createParachuteMesh() {
  const group = new THREE.Group();

  // Canopy (half sphere / dome shape)
  const canopyGeo = new THREE.SphereGeometry(3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0xe74c3c,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.rotation.x = Math.PI; // Flip so dome faces up
  canopy.position.y = 4;
  group.add(canopy);

  // Stripes on canopy
  const stripeGeo = new THREE.SphereGeometry(3.02, 16, 8, 0, Math.PI / 4, 0, Math.PI / 2);
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });
  for (let i = 0; i < 4; i++) {
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.rotation.x = Math.PI;
    stripe.rotation.y = i * Math.PI / 2;
    stripe.position.y = 4;
    group.add(stripe);
  }

  // Suspension lines
  const lineMat = new THREE.LineBasicMaterial({ color: 0x333333 });
  const linePositions = [
    [-2, 0], [2, 0], [0, -2], [0, 2],
    [-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]
  ];
  linePositions.forEach(([x, z]) => {
    const points = [
      new THREE.Vector3(x * 0.3, 0, z * 0.3),
      new THREE.Vector3(x, 4, z)
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeo, lineMat);
    group.add(line);
  });

  return group;
}

function deployParachute() {
  if (state.isParachuting || state.parachuteMesh) return;

  state.isParachuting = true;

  // Create and attach parachute mesh
  state.parachuteMesh = createParachuteMesh();
  scene.add(state.parachuteMesh);

  // Initialize velocity (inherit some horizontal momentum)
  state.parachuteVelocity.set(0, -PARACHUTE_FALL_SPEED, 0);

  // Show weapon again
  weaponGroup.visible = true;

  playSound('pickup'); // Parachute deploy sound
}

function updateParachute(delta) {
  if (!state.isParachuting || !state.parachuteMesh) return;

  // Horizontal movement with WASD
  const moveDir = new THREE.Vector3();

  if (state.moveForward) moveDir.z -= 1;
  if (state.moveBackward) moveDir.z += 1;
  if (state.moveLeft) moveDir.x -= 1;
  if (state.moveRight) moveDir.x += 1;

  if (moveDir.length() > 0) {
    moveDir.normalize();
    // Apply camera rotation to movement
    moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
    moveDir.multiplyScalar(PARACHUTE_MOVE_SPEED);
  }

  // Update velocities
  state.parachuteVelocity.x = moveDir.x;
  state.parachuteVelocity.z = moveDir.z;
  state.parachuteVelocity.y = -PARACHUTE_FALL_SPEED;

  // Move camera/player
  camera.position.x += state.parachuteVelocity.x * delta;
  camera.position.y += state.parachuteVelocity.y * delta;
  camera.position.z += state.parachuteVelocity.z * delta;

  // Update parachute position (above player)
  state.parachuteMesh.position.copy(camera.position);
  state.parachuteMesh.position.y -= 1; // Slightly below camera

  // Slight swaying animation
  state.parachuteMesh.rotation.z = Math.sin(Date.now() * 0.002) * 0.1;
  state.parachuteMesh.rotation.x = Math.sin(Date.now() * 0.0015) * 0.05;

  // Check for landing
  if (camera.position.y <= PLAYER_HEIGHT) {
    landParachute();
  }

  // Update chunks based on position
  updateChunks(camera.position.x, camera.position.z);

  // Emit position
  socket.emit('move', {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    parachuting: true
  });
}

function landParachute() {
  if (!state.isParachuting) return;

  state.isParachuting = false;
  camera.position.y = PLAYER_HEIGHT;

  // Remove parachute mesh
  if (state.parachuteMesh) {
    scene.remove(state.parachuteMesh);
    state.parachuteMesh = null;
  }

  // Reset velocity
  state.parachuteVelocity.set(0, 0, 0);
  state.velocity.set(0, 0, 0);

  playSound('footstep'); // Landing sound
}

function bailOutOfAircraft() {
  if (!state.inVehicle || !state.currentVehicle) return;

  const vehicle = state.currentVehicle;
  const config = VEHICLE_TYPES[vehicle.type];

  // Only bail from aircraft at sufficient height
  if (!config || !config.isAircraft) return;
  if (state.vehicleAltitude < PARACHUTE_MIN_DEPLOY_HEIGHT) return;

  // Store position before exiting
  const exitX = vehicle.mesh.position.x;
  const exitY = state.vehicleAltitude;
  const exitZ = vehicle.mesh.position.z;

  // Exit the vehicle
  exitVehicle();

  // Set camera to aircraft's position
  camera.position.set(exitX, exitY, exitZ);

  // Deploy parachute
  deployParachute();
}

// ==================== PICKUP SYSTEM ====================

const pickups = {};
let pickupIdCounter = 0;
const PICKUP_COLLECT_DISTANCE = 3;

const PICKUP_TYPES = {
  health: {
    color: 0x27ae60,
    glowColor: 0x2ecc71,
    value: 50,
    label: '+50 HP'
  },
  ammo: {
    color: 0xf39c12,
    glowColor: 0xf1c40f,
    value: 30,
    label: '+30 Ammo'
  }
};

// Weapon pickups
const WEAPON_PICKUPS = {
  pistol: { name: 'Pistol', color: 0x888888, glowColor: 0xaaaaaa },
  rifle: { name: 'Rifle', color: 0x2c3e50, glowColor: 0x34495e },
  shotgun: { name: 'Shotgun', color: 0x8b4513, glowColor: 0xa0522d },
  sniper: { name: 'Sniper', color: 0x1a1a2e, glowColor: 0x16213e }
};

const weaponPickups = {};
let weaponPickupIdCounter = 0;

function createHealthPackMesh() {
  const group = new THREE.Group();

  // White box with red cross
  const boxGeo = new THREE.BoxGeometry(1, 0.6, 1);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.y = 0.5;
  box.castShadow = true;
  group.add(box);

  // Red cross - horizontal bar
  const crossH = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.15, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xe74c3c })
  );
  crossH.position.set(0, 0.68, 0);
  group.add(crossH);

  // Red cross - vertical bar
  const crossV = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.15, 0.6),
    new THREE.MeshStandardMaterial({ color: 0xe74c3c })
  );
  crossV.position.set(0, 0.68, 0);
  group.add(crossV);

  // Glow effect
  const glowGeo = new THREE.SphereGeometry(0.8, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x27ae60,
    transparent: true,
    opacity: 0.2
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.y = 0.5;
  glow.name = 'glow';
  group.add(glow);

  group.userData.type = 'health';
  group.userData.isPickup = true;

  return group;
}

function createAmmoBoxMesh() {
  const group = new THREE.Group();

  // Ammo crate
  const boxGeo = new THREE.BoxGeometry(0.8, 0.5, 0.5);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.y = 0.4;
  box.castShadow = true;
  group.add(box);

  // Metal bands
  const bandMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
  const band1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.55), bandMat);
  band1.position.set(0, 0.55, 0);
  group.add(band1);

  const band2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.55), bandMat);
  band2.position.set(0, 0.25, 0);
  group.add(band2);

  // Bullet icons on side
  const bulletMat = new THREE.MeshStandardMaterial({ color: 0xf39c12 });
  for (let i = -1; i <= 1; i++) {
    const bullet = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8), bulletMat);
    bullet.position.set(0.41, 0.4, i * 0.12);
    bullet.rotation.z = Math.PI / 2;
    group.add(bullet);
  }

  // Glow effect
  const glowGeo = new THREE.SphereGeometry(0.6, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xf39c12,
    transparent: true,
    opacity: 0.2
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.y = 0.4;
  glow.name = 'glow';
  group.add(glow);

  group.userData.type = 'ammo';
  group.userData.isPickup = true;

  return group;
}

function spawnPickup(type, x, z) {
  const id = `pickup_${pickupIdCounter++}`;
  const mesh = type === 'health' ? createHealthPackMesh() : createAmmoBoxMesh();
  mesh.position.set(x, 0, z);
  mesh.userData.pickupId = id;

  scene.add(mesh);

  pickups[id] = {
    id,
    type,
    mesh,
    x,
    z,
    collected: false,
    respawnTime: 0
  };

  return id;
}

function spawnChunkPickups(cx, cz, seed) {
  const worldX = cx * CHUNK_SIZE;
  const worldZ = cz * CHUNK_SIZE;

  // 2-4 pickups per chunk
  const numPickups = 2 + Math.floor(seededRandom(seed + 5000) * 3);

  for (let i = 0; i < numPickups; i++) {
    const pSeed = seed + 5100 + i * 100;
    const px = worldX + 5 + seededRandom(pSeed) * (CHUNK_SIZE - 10);
    const pz = worldZ + 5 + seededRandom(pSeed + 1) * (CHUNK_SIZE - 10);

    // 60% health, 40% ammo
    const type = seededRandom(pSeed + 2) < 0.6 ? 'health' : 'ammo';
    spawnPickup(type, px, pz);
  }

  // Spawn weapon pickup (10% chance per chunk)
  if (seededRandom(seed + 5500) < 0.1) {
    const wSeed = seed + 5600;
    const wx = worldX + 5 + seededRandom(wSeed) * (CHUNK_SIZE - 10);
    const wz = worldZ + 5 + seededRandom(wSeed + 1) * (CHUNK_SIZE - 10);

    // Weighted random weapon type (rarer weapons less common)
    const roll = seededRandom(wSeed + 2);
    let weaponType;
    if (roll < 0.35) weaponType = 'pistol';
    else if (roll < 0.65) weaponType = 'rifle';
    else if (roll < 0.90) weaponType = 'shotgun';
    else weaponType = 'sniper';

    spawnWeaponPickup(weaponType, wx, wz);
  }
}

function collectPickup(pickup) {
  if (pickup.collected) return;

  pickup.collected = true;
  pickup.mesh.visible = false;

  const type = PICKUP_TYPES[pickup.type];

  if (pickup.type === 'health') {
    state.health = Math.min(100, state.health + type.value);
    updateHealth();
    playSound('pickup');
    showPickupMessage(type.label, '#27ae60');
  } else if (pickup.type === 'ammo') {
    state.ammoReserve += type.value;
    updateAmmoDisplay();
    playSound('pickupAmmo');
    showPickupMessage(type.label, '#f39c12');
  }

  // Respawn after 30 seconds
  pickup.respawnTime = Date.now() + 30000;
}

function updatePickups() {
  const now = Date.now();
  const playerPos = camera.position;

  for (const id in pickups) {
    const pickup = pickups[id];

    // Check for respawn
    if (pickup.collected && pickup.respawnTime > 0 && now >= pickup.respawnTime) {
      pickup.collected = false;
      pickup.mesh.visible = true;
      pickup.respawnTime = 0;
    }

    // Skip if collected
    if (pickup.collected) continue;

    // Animate pickup (bob and rotate)
    pickup.mesh.position.y = 0.2 + Math.sin(now * 0.003 + pickup.x) * 0.1;
    pickup.mesh.rotation.y += 0.02;

    // Pulse glow
    const glow = pickup.mesh.getObjectByName('glow');
    if (glow) {
      glow.material.opacity = 0.15 + Math.sin(now * 0.005) * 0.1;
    }

    // Check collection distance
    const dx = pickup.x - playerPos.x;
    const dz = pickup.z - playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < PICKUP_COLLECT_DISTANCE && state.isPlaying && !state.isDead) {
      collectPickup(pickup);
    }
  }
}

function showPickupMessage(text, color) {
  const msg = document.createElement('div');
  msg.className = 'pickup-message';
  msg.textContent = text;
  msg.style.color = color;
  document.getElementById('hud').appendChild(msg);

  setTimeout(() => {
    msg.style.opacity = '0';
    msg.style.transform = 'translateX(-50%) translateY(-30px)';
    setTimeout(() => msg.remove(), 500);
  }, 1500);
}

// ==================== WEAPON PICKUP FUNCTIONS ====================

function createWeaponPickupMesh(weaponType) {
  const group = new THREE.Group();
  const config = WEAPON_PICKUPS[weaponType];

  if (weaponType === 'pistol') {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.25, 0.4),
      new THREE.MeshStandardMaterial({ color: config.color, metalness: 0.6 })
    );
    body.position.y = 0.5;
    group.add(body);
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.2, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x2c2c2c })
    );
    grip.position.set(0, 0.35, 0.05);
    group.add(grip);
  } else if (weaponType === 'rifle') {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.12, 1.0),
      new THREE.MeshStandardMaterial({ color: config.color, metalness: 0.5 })
    );
    body.position.y = 0.5;
    group.add(body);
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.15, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x4a3728 })
    );
    stock.position.set(0, 0.48, 0.5);
    group.add(stock);
  } else if (weaponType === 'shotgun') {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8),
      new THREE.MeshStandardMaterial({ color: config.color, metalness: 0.4 })
    );
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.5;
    group.add(body);
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.12, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x4a3728 })
    );
    stock.position.set(0, 0.5, 0.45);
    group.add(stock);
  } else if (weaponType === 'sniper') {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.1, 1.3),
      new THREE.MeshStandardMaterial({ color: config.color, metalness: 0.7 })
    );
    body.position.y = 0.5;
    group.add(body);
    const scope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    scope.position.set(0, 0.6, -0.2);
    group.add(scope);
  }

  // Glow effect
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 16, 16),
    new THREE.MeshBasicMaterial({ color: config.glowColor, transparent: true, opacity: 0.2 })
  );
  glow.position.y = 0.5;
  glow.name = 'glow';
  group.add(glow);

  group.userData.type = weaponType;
  group.userData.isWeaponPickup = true;

  return group;
}

function spawnWeaponPickup(type, x, z) {
  const id = `weapon_${weaponPickupIdCounter++}`;
  const mesh = createWeaponPickupMesh(type);
  mesh.position.set(x, 0, z);
  mesh.userData.pickupId = id;

  scene.add(mesh);

  weaponPickups[id] = {
    id,
    type,
    mesh,
    x,
    z,
    collected: false,
    respawnTime: 0
  };

  return id;
}

function pickupWeapon(weaponType) {
  if (state.weapons[weaponType]) {
    // Already have this weapon - give ammo instead
    const ammoAmount = Math.floor(WEAPONS[weaponType].maxAmmo / 2);
    state.ammoReserve += ammoAmount;
    updateAmmoDisplay();
    showPickupMessage(`+${ammoAmount} ${WEAPONS[weaponType].name} Ammo`, '#f39c12');
  } else {
    // Unlock new weapon
    state.weapons[weaponType] = true;
    showPickupMessage(`Acquired ${WEAPONS[weaponType].name}!`, '#9b59b6');
    updateWeaponSlots();
  }
  playSound('pickup');
}

function updateWeaponPickups() {
  const now = Date.now();
  const playerPos = camera.position;

  for (const id in weaponPickups) {
    const pickup = weaponPickups[id];

    // Respawn check
    if (pickup.collected && pickup.respawnTime > 0 && now >= pickup.respawnTime) {
      pickup.collected = false;
      pickup.mesh.visible = true;
      pickup.respawnTime = 0;
    }

    if (pickup.collected) continue;

    // Animate (bob and rotate)
    pickup.mesh.position.y = 0.3 + Math.sin(now * 0.003 + pickup.x) * 0.15;
    pickup.mesh.rotation.y += 0.015;

    // Glow pulse
    const glow = pickup.mesh.getObjectByName('glow');
    if (glow) {
      glow.material.opacity = 0.15 + Math.sin(now * 0.004) * 0.1;
    }

    // Collection check
    const dx = pickup.x - playerPos.x;
    const dz = pickup.z - playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < PICKUP_COLLECT_DISTANCE && state.isPlaying && !state.isDead) {
      collectWeaponPickup(pickup);
    }
  }
}

function collectWeaponPickup(pickup) {
  if (pickup.collected) return;

  pickup.collected = true;
  pickup.mesh.visible = false;
  pickup.respawnTime = Date.now() + 60000; // 60 second respawn

  pickupWeapon(pickup.type);
}

// Team colors
const TEAM_COLORS = {
  none: 0xf39c12,
  red: 0xe74c3c,
  blue: 0x3498db
};

// Difficulty multipliers
const DIFFICULTY_SETTINGS = {
  easy: { damageMultiplier: 0.5, enemySpeedMultiplier: 0.8, label: 'Easy' },
  normal: { damageMultiplier: 1.0, enemySpeedMultiplier: 1.0, label: 'Normal' },
  hard: { damageMultiplier: 1.5, enemySpeedMultiplier: 1.3, label: 'Hard' }
};

// Constants
const MOVE_SPEED = 40;
const SPRINT_MULTIPLIER = 1.6;
const JUMP_VELOCITY = 15;
const GRAVITY = 30;
const PLAYER_HEIGHT = 2;

// Three.js setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x88aabb, 50, 400);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = PLAYER_HEIGHT;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// Create gradient sky using a large sphere
const skyGeometry = new THREE.SphereGeometry(400, 32, 32);
const skyMaterial = new THREE.ShaderMaterial({
  uniforms: {
    topColor: { value: new THREE.Color(0x0077be) },
    bottomColor: { value: new THREE.Color(0x89cff0) },
    offset: { value: 20 },
    exponent: { value: 0.6 }
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize(vWorldPosition + offset).y;
      gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
    }
  `,
  side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);

// Lighting - warmer sun
const ambientLight = new THREE.AmbientLight(0x6688cc, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffee, 1.0);
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

// Hemisphere light for more natural outdoor lighting
const hemiLight = new THREE.HemisphereLight(0x88bbff, 0x446622, 0.5);
scene.add(hemiLight);

// ==================== FLASHLIGHT ====================

// Create flashlight as a SpotLight attached to camera
const flashlight = new THREE.SpotLight(0xffffee, 0, 80, Math.PI / 8, 0.4, 1.5);
flashlight.position.set(0, 0, 0);
flashlight.castShadow = true;
flashlight.shadow.mapSize.width = 512;
flashlight.shadow.mapSize.height = 512;

// Create a target object for the flashlight to point at
const flashlightTarget = new THREE.Object3D();
flashlightTarget.position.set(0, 0, -10);
flashlight.target = flashlightTarget;

// Add both to camera so they move with view
camera.add(flashlight);
camera.add(flashlightTarget);

// Add camera to scene (required for child lights to work)
scene.add(camera);

function toggleFlashlight() {
  state.flashlightOn = !state.flashlightOn;
  flashlight.intensity = state.flashlightOn ? 5 : 0;
  playSound(state.flashlightOn ? 'flashlightOn' : 'flashlightOff');
  showFlashlightIndicator(state.flashlightOn);
}

function showFlashlightIndicator(on) {
  const indicator = document.getElementById('flashlight-indicator');
  if (indicator) {
    indicator.textContent = on ? 'FLASHLIGHT ON [F]' : '';
    indicator.classList.toggle('hidden', !on);
  }
}

// ==================== DAY/NIGHT CYCLE ====================

const dayNight = {
  time: 0.25, // 0-1 (0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset)
  speed: 0.008, // Full day/night cycle in ~2 minutes
  sunDistance: 100
};

// Sky color presets for different times
const SKY_COLORS = {
  midnight: { top: new THREE.Color(0x0a0a20), bottom: new THREE.Color(0x1a1a30) },
  dawn: { top: new THREE.Color(0x2a4a6a), bottom: new THREE.Color(0xff7744) },
  sunrise: { top: new THREE.Color(0x4488cc), bottom: new THREE.Color(0xffaa66) },
  morning: { top: new THREE.Color(0x3399dd), bottom: new THREE.Color(0x99ccee) },
  noon: { top: new THREE.Color(0x0077be), bottom: new THREE.Color(0x89cff0) },
  afternoon: { top: new THREE.Color(0x3388cc), bottom: new THREE.Color(0x88bbdd) },
  sunset: { top: new THREE.Color(0x4466aa), bottom: new THREE.Color(0xff6633) },
  dusk: { top: new THREE.Color(0x2a3a5a), bottom: new THREE.Color(0xcc5533) },
  night: { top: new THREE.Color(0x0a0a1a), bottom: new THREE.Color(0x1a1a2a) }
};

// Light intensity presets
const LIGHT_PRESETS = {
  midnight: { sun: 0.05, ambient: 0.1, sunColor: 0x334466 },
  dawn: { sun: 0.4, ambient: 0.3, sunColor: 0xff8855 },
  sunrise: { sun: 0.7, ambient: 0.4, sunColor: 0xffaa77 },
  morning: { sun: 0.9, ambient: 0.5, sunColor: 0xffffcc },
  noon: { sun: 1.0, ambient: 0.5, sunColor: 0xffffee },
  afternoon: { sun: 0.9, ambient: 0.5, sunColor: 0xffffdd },
  sunset: { sun: 0.6, ambient: 0.35, sunColor: 0xff7744 },
  dusk: { sun: 0.3, ambient: 0.25, sunColor: 0xff5533 },
  night: { sun: 0.08, ambient: 0.15, sunColor: 0x445566 }
};

function getTimeOfDay(time) {
  // Returns the current period and blend factor
  if (time < 0.2) return { period: 'night', next: 'dawn', blend: time / 0.2 };
  if (time < 0.25) return { period: 'dawn', next: 'sunrise', blend: (time - 0.2) / 0.05 };
  if (time < 0.3) return { period: 'sunrise', next: 'morning', blend: (time - 0.25) / 0.05 };
  if (time < 0.45) return { period: 'morning', next: 'noon', blend: (time - 0.3) / 0.15 };
  if (time < 0.55) return { period: 'noon', next: 'afternoon', blend: (time - 0.45) / 0.1 };
  if (time < 0.7) return { period: 'afternoon', next: 'sunset', blend: (time - 0.55) / 0.15 };
  if (time < 0.75) return { period: 'sunset', next: 'dusk', blend: (time - 0.7) / 0.05 };
  if (time < 0.8) return { period: 'dusk', next: 'night', blend: (time - 0.75) / 0.05 };
  return { period: 'night', next: 'midnight', blend: (time - 0.8) / 0.2 };
}

function lerpColor(color1, color2, t) {
  return new THREE.Color().lerpColors(color1, color2, t);
}

function updateDayNightCycle(delta) {
  // Advance time
  dayNight.time += dayNight.speed * delta;
  if (dayNight.time >= 1) dayNight.time -= 1;

  const { period, next, blend } = getTimeOfDay(dayNight.time);

  // Get color presets
  const currentSky = SKY_COLORS[period] || SKY_COLORS.noon;
  const nextSky = SKY_COLORS[next] || SKY_COLORS.noon;
  const currentLight = LIGHT_PRESETS[period] || LIGHT_PRESETS.noon;
  const nextLight = LIGHT_PRESETS[next] || LIGHT_PRESETS.noon;

  // Blend sky colors
  const topColor = lerpColor(currentSky.top, nextSky.top, blend);
  const bottomColor = lerpColor(currentSky.bottom, nextSky.bottom, blend);

  skyMaterial.uniforms.topColor.value = topColor;
  skyMaterial.uniforms.bottomColor.value = bottomColor;

  // Update fog color to match horizon
  scene.fog.color = bottomColor;

  // Blend light intensities
  const sunIntensity = currentLight.sun + (nextLight.sun - currentLight.sun) * blend;
  const ambientIntensity = currentLight.ambient + (nextLight.ambient - currentLight.ambient) * blend;

  directionalLight.intensity = sunIntensity;
  ambientLight.intensity = ambientIntensity;

  // Blend sun color
  const sunColor = lerpColor(
    new THREE.Color(currentLight.sunColor),
    new THREE.Color(nextLight.sunColor),
    blend
  );
  directionalLight.color = sunColor;

  // Move sun position based on time (arc across sky)
  const sunAngle = dayNight.time * Math.PI * 2 - Math.PI / 2;
  directionalLight.position.set(
    Math.cos(sunAngle) * dayNight.sunDistance,
    Math.sin(sunAngle) * dayNight.sunDistance + 20,
    50
  );

  // Update hemisphere light
  hemiLight.intensity = ambientIntensity * 0.8;

  // Update time display
  updateTimeDisplay();
}

function updateTimeDisplay() {
  const timeDisplay = document.getElementById('time-display');
  if (!timeDisplay) return;

  // Convert 0-1 time to hours (0 = midnight = 00:00)
  const hours = Math.floor(dayNight.time * 24);
  const minutes = Math.floor((dayNight.time * 24 - hours) * 60);
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // Get period name
  const { period } = getTimeOfDay(dayNight.time);
  const periodName = period.charAt(0).toUpperCase() + period.slice(1);

  timeDisplay.textContent = `${timeString} - ${periodName}`;
}

// ==================== INFINITE TERRAIN SYSTEM ====================
const CHUNK_SIZE = 64;
const RENDER_DISTANCE = 3; // chunks in each direction
const chunks = {};
const collidableObjects = [];

// Seeded random for consistent terrain generation
function seededRandom(seed) {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function getChunkSeed(cx, cz) {
  return cx * 73856093 ^ cz * 19349663;
}

// Ground material (shared)
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x3d7c40,
  roughness: 0.9,
  metalness: 0.0
});

// Building colors
const BUILDING_COLORS = [0x808080, 0x606060, 0x707070, 0x505050, 0x909090, 0x555555, 0x656565, 0x757575];

// Loot container system
const lootContainers = {};
let lootContainerIdCounter = 0;
const LOOT_SEARCH_DISTANCE = 2.5;

const LOOT_TYPES = [
  { type: 'health', chance: 0.3, amount: 25 },
  { type: 'ammo', chance: 0.4, amount: 20 },
  { type: 'bigHealth', chance: 0.15, amount: 50 },
  { type: 'bigAmmo', chance: 0.15, amount: 40 }
];

function createLootCrate(x, y, z, seed) {
  const id = `loot_${lootContainerIdCounter++}`;
  const group = new THREE.Group();

  // Crate body
  const crateGeo = new THREE.BoxGeometry(1, 0.8, 0.8);
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const crate = new THREE.Mesh(crateGeo, crateMat);
  crate.castShadow = true;
  group.add(crate);

  // Crate lid lines
  const lineGeo = new THREE.BoxGeometry(1.02, 0.05, 0.1);
  const lineMat = new THREE.MeshStandardMaterial({ color: 0x5c3317 });
  const line1 = new THREE.Mesh(lineGeo, lineMat);
  line1.position.y = 0.3;
  group.add(line1);
  const line2 = new THREE.Mesh(lineGeo, lineMat);
  line2.position.y = -0.1;
  group.add(line2);

  group.position.set(x, y + 0.4, z);

  // Determine loot
  const roll = seededRandom(seed);
  let cumulative = 0;
  let lootType = LOOT_TYPES[0];
  for (const lt of LOOT_TYPES) {
    cumulative += lt.chance;
    if (roll < cumulative) {
      lootType = lt;
      break;
    }
  }

  lootContainers[id] = {
    id,
    mesh: group,
    x, y, z,
    searched: false,
    lootType: lootType.type,
    lootAmount: lootType.amount
  };

  return group;
}

function getNearestLootContainer(position) {
  let nearest = null;
  let nearestDist = LOOT_SEARCH_DISTANCE;

  for (const id in lootContainers) {
    const container = lootContainers[id];
    if (container.searched) continue;

    const dx = position.x - container.x;
    const dz = position.z - container.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = container;
    }
  }

  return nearest;
}

function searchLootContainer(container) {
  if (!container || container.searched) return;

  container.searched = true;

  // Dim the crate to show it's been searched
  container.mesh.children.forEach(child => {
    if (child.material) {
      child.material.color.setHex(0x3d2510);
    }
  });

  // Give loot to player
  if (container.lootType === 'health' || container.lootType === 'bigHealth') {
    state.health = Math.min(100, state.health + container.lootAmount);
    updateHealthBar();
    showNotification(`+${container.lootAmount} Health`);
  } else if (container.lootType === 'ammo' || container.lootType === 'bigAmmo') {
    state.ammo += container.lootAmount;
    updateAmmoDisplay();
    showNotification(`+${container.lootAmount} Ammo`);
  }

  playSound('pickup');
}

function createBuildingWithInterior(x, z, width, height, depth, color, seed, chunk) {
  const group = new THREE.Group();
  const wallThickness = 0.3;

  // Floor
  const floorGeo = new THREE.BoxGeometry(width, 0.2, depth);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = 0.1;
  floor.receiveShadow = true;
  group.add(floor);

  // Walls material
  const wallMat = new THREE.MeshStandardMaterial({ color });

  // Back wall (full)
  const backWallGeo = new THREE.BoxGeometry(width, height, wallThickness);
  const backWall = new THREE.Mesh(backWallGeo, wallMat);
  backWall.position.set(0, height / 2, -depth / 2 + wallThickness / 2);
  backWall.castShadow = true;
  group.add(backWall);

  // Front wall (with door opening)
  const doorWidth = 2;
  const doorHeight = 3;

  // Front left section
  const frontLeftWidth = (width - doorWidth) / 2;
  const frontLeftGeo = new THREE.BoxGeometry(frontLeftWidth, height, wallThickness);
  const frontLeft = new THREE.Mesh(frontLeftGeo, wallMat);
  frontLeft.position.set(-width / 2 + frontLeftWidth / 2, height / 2, depth / 2 - wallThickness / 2);
  frontLeft.castShadow = true;
  group.add(frontLeft);

  // Front right section
  const frontRightGeo = new THREE.BoxGeometry(frontLeftWidth, height, wallThickness);
  const frontRight = new THREE.Mesh(frontRightGeo, wallMat);
  frontRight.position.set(width / 2 - frontLeftWidth / 2, height / 2, depth / 2 - wallThickness / 2);
  frontRight.castShadow = true;
  group.add(frontRight);

  // Above door section
  const aboveDoorGeo = new THREE.BoxGeometry(doorWidth, height - doorHeight, wallThickness);
  const aboveDoor = new THREE.Mesh(aboveDoorGeo, wallMat);
  aboveDoor.position.set(0, doorHeight + (height - doorHeight) / 2, depth / 2 - wallThickness / 2);
  aboveDoor.castShadow = true;
  group.add(aboveDoor);

  // Left wall
  const leftWallGeo = new THREE.BoxGeometry(wallThickness, height, depth);
  const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
  leftWall.position.set(-width / 2 + wallThickness / 2, height / 2, 0);
  leftWall.castShadow = true;
  group.add(leftWall);

  // Right wall
  const rightWallGeo = new THREE.BoxGeometry(wallThickness, height, depth);
  const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
  rightWall.position.set(width / 2 - wallThickness / 2, height / 2, 0);
  rightWall.castShadow = true;
  group.add(rightWall);

  // Roof
  const roofGeo = new THREE.BoxGeometry(width, wallThickness, depth);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = height;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  group.position.set(x, 0, z);

  // Add interior furniture
  const interiorWidth = width - 2;
  const interiorDepth = depth - 2;

  // Add 1-3 loot crates inside
  const numCrates = 1 + Math.floor(seededRandom(seed + 100) * 3);
  for (let i = 0; i < numCrates; i++) {
    const cx = x + (seededRandom(seed + 200 + i) - 0.5) * interiorWidth * 0.7;
    const cz = z + (seededRandom(seed + 300 + i) - 0.5) * interiorDepth * 0.7;
    const crate = createLootCrate(cx, 0, cz, seed + 400 + i);
    chunk.add(crate);
  }

  // Add a table (50% chance)
  if (seededRandom(seed + 500) < 0.5) {
    const tableGeo = new THREE.BoxGeometry(1.5, 0.1, 1);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    const tx = (seededRandom(seed + 600) - 0.5) * interiorWidth * 0.5;
    const tz = (seededRandom(seed + 601) - 0.5) * interiorDepth * 0.5;
    table.position.set(tx, 0.8, tz);
    group.add(table);

    // Table legs
    const legGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
    const positions = [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]];
    positions.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, tableMat);
      leg.position.set(tx + lx, 0.4, tz + lz);
      group.add(leg);
    });
  }

  // Add shelves on back wall (40% chance)
  if (seededRandom(seed + 700) < 0.4) {
    const shelfGeo = new THREE.BoxGeometry(2, 0.1, 0.4);
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(0, 1.5, -interiorDepth / 2 + 0.3);
    group.add(shelf);
  }

  return group;
}

function createChunk(cx, cz) {
  const chunkKey = `${cx},${cz}`;
  if (chunks[chunkKey]) return;

  const chunk = new THREE.Group();
  chunk.userData = { cx, cz, objects: [] };

  const seed = getChunkSeed(cx, cz);
  const worldX = cx * CHUNK_SIZE;
  const worldZ = cz * CHUNK_SIZE;

  // Create ground plane for this chunk
  const groundGeometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE);
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(worldX + CHUNK_SIZE / 2, 0, worldZ + CHUNK_SIZE / 2);
  ground.receiveShadow = true;
  chunk.add(ground);
  chunk.userData.objects.push(ground);

  // Add grid lines for this chunk
  const gridHelper = new THREE.GridHelper(CHUNK_SIZE, 8, 0x2d6c30, 0x2d6c30);
  gridHelper.position.set(worldX + CHUNK_SIZE / 2, 0.01, worldZ + CHUNK_SIZE / 2);
  gridHelper.material.opacity = 0.1;
  gridHelper.material.transparent = true;
  chunk.add(gridHelper);

  // Generate buildings procedurally
  const numBuildings = Math.floor(seededRandom(seed) * 3) + 1; // 1-3 buildings per chunk

  for (let i = 0; i < numBuildings; i++) {
    const bSeed = seed + i * 1000;

    // Random position within chunk (with some padding)
    const bx = worldX + 8 + seededRandom(bSeed) * (CHUNK_SIZE - 16);
    const bz = worldZ + 8 + seededRandom(bSeed + 1) * (CHUNK_SIZE - 16);

    // Random size - keep buildings reasonable for interiors
    const width = 8 + seededRandom(bSeed + 2) * 6; // 8-14 units wide
    const height = 4 + seededRandom(bSeed + 3) * 4; // 4-8 units tall (single story)
    const depth = 8 + seededRandom(bSeed + 4) * 6; // 8-14 units deep

    // Random color
    const colorIndex = Math.floor(seededRandom(bSeed + 5) * BUILDING_COLORS.length);
    const color = BUILDING_COLORS[colorIndex];

    // Create building with interior and loot
    const building = createBuildingWithInterior(bx, bz, width, height, depth, color, bSeed, chunk);
    chunk.add(building);
    chunk.userData.objects.push(building);
    collidableObjects.push(building);
  }

  // Add some trees
  const numTrees = Math.floor(seededRandom(seed + 500) * 5) + 2;
  for (let i = 0; i < numTrees; i++) {
    const tSeed = seed + 2000 + i * 100;
    const tx = worldX + 4 + seededRandom(tSeed) * (CHUNK_SIZE - 8);
    const tz = worldZ + 4 + seededRandom(tSeed + 1) * (CHUNK_SIZE - 8);
    const treeHeight = 4 + seededRandom(tSeed + 2) * 4;

    // Tree trunk
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, treeHeight * 0.4, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(tx, treeHeight * 0.2, tz);
    trunk.castShadow = true;
    chunk.add(trunk);

    // Tree foliage
    const foliageGeo = new THREE.ConeGeometry(2 + seededRandom(tSeed + 3), treeHeight * 0.7, 8);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.set(tx, treeHeight * 0.6, tz);
    foliage.castShadow = true;
    chunk.add(foliage);
  }

  // Add some rocks
  const numRocks = Math.floor(seededRandom(seed + 800) * 4);
  for (let i = 0; i < numRocks; i++) {
    const rSeed = seed + 3000 + i * 100;
    const rx = worldX + 2 + seededRandom(rSeed) * (CHUNK_SIZE - 4);
    const rz = worldZ + 2 + seededRandom(rSeed + 1) * (CHUNK_SIZE - 4);
    const rockSize = 0.5 + seededRandom(rSeed + 2) * 1.5;

    const rockGeo = new THREE.DodecahedronGeometry(rockSize, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 1 });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.set(rx, rockSize * 0.5, rz);
    rock.rotation.set(seededRandom(rSeed + 3) * Math.PI, seededRandom(rSeed + 4) * Math.PI, 0);
    rock.castShadow = true;
    chunk.add(rock);
  }

  scene.add(chunk);
  chunks[chunkKey] = chunk;

  // Spawn vehicles in this chunk
  spawnChunkVehicles(cx, cz, seed);

  // Spawn pickups in this chunk
  spawnChunkPickups(cx, cz, seed);
}

function removeChunk(cx, cz) {
  const chunkKey = `${cx},${cz}`;
  const chunk = chunks[chunkKey];
  if (!chunk) return;

  // Remove collidable objects
  chunk.userData.objects.forEach(obj => {
    const idx = collidableObjects.indexOf(obj);
    if (idx > -1) collidableObjects.splice(idx, 1);
  });

  scene.remove(chunk);
  delete chunks[chunkKey];
}

function updateChunks(playerX, playerZ) {
  const playerChunkX = Math.floor(playerX / CHUNK_SIZE);
  const playerChunkZ = Math.floor(playerZ / CHUNK_SIZE);

  // Create chunks within render distance
  for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
    for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
      createChunk(playerChunkX + dx, playerChunkZ + dz);
    }
  }

  // Remove chunks outside render distance
  for (const key in chunks) {
    const [cx, cz] = key.split(',').map(Number);
    if (Math.abs(cx - playerChunkX) > RENDER_DISTANCE + 1 ||
        Math.abs(cz - playerChunkZ) > RENDER_DISTANCE + 1) {
      removeChunk(cx, cz);
    }
  }
}

// Initialize chunks around spawn
updateChunks(0, 0);

// Spawn initial vehicles near origin
spawnInitialVehicles();

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

// Portal constants for victory condition
const PORTAL_POSITION = { x: 100, y: 6, z: 100 };
const PORTAL_ENTER_DISTANCE = 8;
let gameStartTime = Date.now();

function updatePortal() {
  if (!state.isPlaying || state.isDead) return;

  const playerPos = camera.position;
  const dx = PORTAL_POSITION.x - playerPos.x;
  const dz = PORTAL_POSITION.z - playerPos.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  // Update distance indicator
  const distIndicator = document.getElementById('portal-distance');
  if (distIndicator) {
    distIndicator.textContent = `${Math.round(dist)}m`;
  }

  // Check for portal entry
  if (dist < PORTAL_ENTER_DISTANCE) {
    enterPortal();
  }
}

function enterPortal() {
  // Victory condition
  state.isPlaying = false;
  playSound('pickup');
  showVictoryScreen();
}

function getPlayTime() {
  const elapsed = Date.now() - gameStartTime;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function showVictoryScreen() {
  // Create victory overlay
  const victory = document.createElement('div');
  victory.id = 'victory-screen';
  victory.innerHTML = `
    <h1>VICTORY!</h1>
    <p>You reached the portal!</p>
    <p>Time: ${getPlayTime()}</p>
    <p>Kills: ${state.kills}</p>
    <p>Deaths: ${state.deaths}</p>
    <button onclick="returnToMenuFromVictory()">Return to Menu</button>
  `;
  document.getElementById('hud').appendChild(victory);
  document.exitPointerLock();
}

window.returnToMenuFromVictory = function() {
  const victory = document.getElementById('victory-screen');
  if (victory) victory.remove();

  state.gameState = 'menu';
  state.isPlaying = false;
  state.kills = 0;
  state.deaths = 0;

  const mainMenu = document.getElementById('main-menu');
  mainMenu.classList.remove('hidden');
  document.getElementById('crosshair').classList.add('hidden');
};

// Initial vehicle spawns (around origin)
function spawnInitialVehicles() {
  const vehicleSpawns = [
    { x: 15, z: -15, rotation: Math.PI / 4, type: 'jeep' },
    { x: -25, z: 20, rotation: -Math.PI / 3, type: 'motorcycle' },
    { x: 40, z: 35, rotation: Math.PI, type: 'jeep' },
    { x: -45, z: -30, rotation: Math.PI / 2, type: 'motorcycle' },
    { x: 60, z: -50, rotation: 0, type: 'jeep' },
    { x: 10, z: 30, rotation: Math.PI / 6, type: 'motorcycle' },
    { x: 80, z: 10, rotation: 0, type: 'aircraft' }
  ];

  vehicleSpawns.forEach(spawn => {
    spawnVehicle(spawn.x, spawn.z, spawn.rotation, spawn.type);
  });
}

// Spawn vehicles in chunks (called during chunk creation)
function spawnChunkVehicles(cx, cz, seed) {
  const worldX = cx * CHUNK_SIZE;
  const worldZ = cz * CHUNK_SIZE;

  // Skip origin chunks (already have initial vehicles)
  if (Math.abs(cx) <= 1 && Math.abs(cz) <= 1) return;

  // 20% chance of a vehicle in each chunk
  if (seededRandom(seed + 9000) < 0.2) {
    const vx = worldX + 10 + seededRandom(seed + 9001) * (CHUNK_SIZE - 20);
    const vz = worldZ + 10 + seededRandom(seed + 9002) * (CHUNK_SIZE - 20);
    const vRotation = seededRandom(seed + 9003) * Math.PI * 2;
    // 10% aircraft, 35% motorcycle, 55% jeep
    const typeRoll = seededRandom(seed + 9004);
    let vehicleType;
    if (typeRoll < 0.1) {
      vehicleType = 'aircraft';
    } else if (typeRoll < 0.45) {
      vehicleType = 'motorcycle';
    } else {
      vehicleType = 'jeep';
    }
    spawnVehicle(vx, vz, vRotation, vehicleType);
  }
}

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
      playSound('empty');
      reload();
    }
    return;
  }

  state.canShoot = false;
  state.ammoInMag--;
  updateAmmoDisplay();

  // Play weapon sound
  playSound(state.currentWeapon);

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
  playSound('reload');
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
  // Check if player has this weapon
  if (!state.weapons[weaponType]) {
    showPickupMessage(`No ${WEAPONS[weaponType].name}`, '#e74c3c');
    return;
  }
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

function updateWeaponSlots() {
  const slots = document.querySelectorAll('.weapon-slot');
  const weaponNames = ['pistol', 'rifle', 'shotgun'];

  slots.forEach((slot, index) => {
    const weaponType = weaponNames[index];
    if (state.weapons[weaponType]) {
      slot.style.opacity = '1';
      slot.style.filter = 'none';
    } else {
      slot.style.opacity = '0.4';
      slot.style.filter = 'grayscale(100%)';
    }
  });
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
  initAudio(); // Initialize audio on first user interaction

  // Get player name and team from menu
  const nameInput = document.getElementById('player-name');
  state.playerName = nameInput.value.trim() || 'Player';
  state.difficulty = difficulty;
  state.gameState = 'playing';
  state.isPlaying = true;
  state.isPaused = false;
  state.health = 100;

  // Reset weapons inventory
  state.weapons = { pistol: true, rifle: false, shotgun: false, sniper: false };
  state.currentWeapon = 'pistol';
  updateWeaponSlots();

  // Reset game timer
  gameStartTime = Date.now();

  // Reset position
  camera.position.set(0, PLAYER_HEIGHT, 0);

  // Update UI
  mainMenu.classList.add('hidden');
  crosshair.classList.remove('hidden');
  difficultyDisplay.textContent = `Difficulty: ${DIFFICULTY_SETTINGS[difficulty].label}`;
  updateHealth();

  // Send player info to server
  socket.emit('setPlayerInfo', {
    name: state.playerName,
    team: state.team,
    difficulty: difficulty
  });

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

// Death screen elements
const deathScreen = document.getElementById('death-screen');
const deathMessage = document.getElementById('death-message');
const respawnTimer = document.getElementById('respawn-timer');

// Handle player death with death screen and countdown
function handleDeath(killerName) {
  if (state.isDead) return;

  state.isDead = true;
  state.lastKiller = killerName;
  playSound('death');

  // Show death screen
  deathMessage.textContent = `Killed by ${killerName}`;
  deathScreen.classList.remove('hidden');
  crosshair.classList.add('hidden');

  // Full screen red flash
  document.getElementById('damage-overlay').style.opacity = 0.6;

  // Countdown respawn
  let countdown = 3;
  respawnTimer.textContent = countdown;

  const countdownInterval = setInterval(() => {
    countdown--;
    respawnTimer.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(countdownInterval);
      respawn();
    }
  }, 1000);
}

// Respawn player
function respawn() {
  state.isDead = false;
  state.health = 100;
  camera.position.set(
    Math.random() * 20 - 10,
    PLAYER_HEIGHT,
    Math.random() * 20 - 10
  );

  // Reset movement states
  state.moveForward = false;
  state.moveBackward = false;
  state.moveLeft = false;
  state.moveRight = false;
  state.isSprinting = false;
  state.velocity.set(0, 0, 0);

  updateHealth();

  deathScreen.classList.add('hidden');
  crosshair.classList.remove('hidden');
  document.getElementById('damage-overlay').style.opacity = 0;

  // Re-request pointer lock for mouse control
  renderer.domElement.requestPointerLock();
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

// Team button handlers
document.querySelectorAll('.team-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.team-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.team = btn.dataset.team;
  });
});

// Chat system
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const killFeed = document.getElementById('kill-feed');

function openChat(teamOnly = false) {
  if (state.gameState !== 'playing' || state.isDead) return;
  state.isChatting = true;
  chatInput.classList.add('active');
  chatInput.dataset.teamOnly = teamOnly;
  chatInput.placeholder = teamOnly ? 'Team chat...' : 'All chat...';
  chatInput.focus();
  document.exitPointerLock();
}

function closeChat() {
  state.isChatting = false;
  chatInput.classList.remove('active');
  chatInput.value = '';
  if (state.gameState === 'playing') {
    renderer.domElement.requestPointerLock();
  }
}

function sendChatMessage() {
  const message = chatInput.value.trim();
  if (message) {
    const teamOnly = chatInput.dataset.teamOnly === 'true';
    socket.emit('chat', {
      message,
      teamOnly
    });
  }
  closeChat();
}

chatInput.addEventListener('keydown', (e) => {
  e.stopPropagation(); // Prevent game controls while typing
  if (e.key === 'Enter') {
    sendChatMessage();
  } else if (e.key === 'Escape') {
    closeChat();
  }
});

function addChatMessage(name, message, team, teamOnly = false) {
  const div = document.createElement('div');
  div.className = 'chat-message' + (teamOnly ? ' team-only' : '');

  const teamClass = team === 'red' ? 'red-team' : team === 'blue' ? 'blue-team' : 'solo';
  div.innerHTML = `<span class="name ${teamClass}">${name}:</span> ${message}`;

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Auto-remove after 15 seconds
  setTimeout(() => {
    div.style.opacity = '0';
    setTimeout(() => div.remove(), 500);
  }, 15000);
}

function addKillFeedEntry(killerName, killerTeam, victimName, victimTeam) {
  const div = document.createElement('div');
  div.className = 'kill-entry';

  const killerClass = killerTeam === 'red' ? 'red-team' : killerTeam === 'blue' ? 'blue-team' : '';
  const victimClass = victimTeam === 'red' ? 'red-team' : victimTeam === 'blue' ? 'blue-team' : '';

  div.innerHTML = `<span class="killer ${killerClass}">${killerName}</span> killed <span class="victim ${victimClass}">${victimName}</span>`;

  killFeed.appendChild(div);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    div.style.opacity = '0';
    setTimeout(() => div.remove(), 500);
  }, 5000);

  // Keep only last 5 entries
  while (killFeed.children.length > 5) {
    killFeed.removeChild(killFeed.firstChild);
  }
}

// Create player name label
function createPlayerLabel(name, team) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // Draw name
  ctx.fillStyle = team === 'red' ? '#e74c3c' : team === 'blue' ? '#3498db' : '#f39c12';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(name, 128, 40);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4, 1, 1);
  sprite.name = 'nameLabel';

  return sprite;
}

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
  // Ignore if chatting
  if (state.isChatting) return;

  // ESC key handling
  if (event.code === 'Escape') {
    if (state.gameState === 'playing') {
      pauseGame();
    } else if (state.gameState === 'paused') {
      resumeGame();
    }
    return;
  }

  // Chat keys
  if (event.code === 'KeyT' && state.isPlaying && !state.isPaused) {
    event.preventDefault();
    openChat(false); // All chat
    return;
  }
  if (event.code === 'KeyY' && state.isPlaying && !state.isPaused) {
    event.preventDefault();
    openChat(true); // Team chat
    return;
  }

  // Tab key for scoreboard (works anytime during gameplay)
  if (event.code === 'Tab') {
    event.preventDefault();
    showScoreboard(true);
    return;
  }

  if (!state.isPlaying || state.isPaused) return;

  // Vehicle enter/exit with E key, or search loot containers
  if (event.code === 'KeyE') {
    if (state.inVehicle) {
      exitVehicle();
    } else {
      // Check for loot container first
      const nearLoot = getNearestLootContainer(camera.position);
      if (nearLoot) {
        searchLootContainer(nearLoot);
        return;
      }
      // Then check for vehicle
      const nearVehicle = getNearestVehicle(camera.position);
      if (nearVehicle) {
        enterVehicle(nearVehicle);
      }
    }
    return;
  }

  // Flashlight toggle with F key
  if (event.code === 'KeyF') {
    toggleFlashlight();
    return;
  }

  // Disable jumping and weapon switching when in vehicle
  if (state.inVehicle) {
    switch (event.code) {
      case 'KeyW': state.moveForward = true; break;
      case 'KeyS': state.moveBackward = true; break;
      case 'KeyA': state.moveLeft = true; break;
      case 'KeyD': state.moveRight = true; break;
      case 'Space':
        // Bail out of aircraft with parachute
        bailOutOfAircraft();
        break;
    }
    return;
  }

  // Parachute controls (WASD already handled by normal movement)
  if (state.isParachuting) {
    return; // Block other actions while parachuting
  }

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
  // Hide scoreboard when Tab released
  if (event.code === 'Tab') {
    showScoreboard(false);
    return;
  }

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

    const playerData = players[id];

    // Initialize or update player stats
    if (!playerStats[id]) {
      playerStats[id] = { name: playerData.name, team: playerData.team, kills: 0, deaths: 0 };
    } else {
      playerStats[id].name = playerData.name;
      playerStats[id].team = playerData.team;
    }

    if (!state.players[id]) {
      // Create player mesh with team color
      const teamColor = TEAM_COLORS[playerData.team] || TEAM_COLORS.none;
      const geometry = new THREE.BoxGeometry(1, 2, 1);
      const material = new THREE.MeshStandardMaterial({ color: teamColor });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;

      // Add name label
      const nameLabel = createPlayerLabel(playerData.name, playerData.team);
      nameLabel.position.y = 1.8;
      mesh.add(nameLabel);

      scene.add(mesh);
      state.players[id] = { mesh, data: playerData };
      collidableObjects.push(mesh);
    } else {
      // Update existing player
      const player = state.players[id];

      // Update color if team changed
      if (player.data.team !== playerData.team) {
        player.mesh.material.color.setHex(TEAM_COLORS[playerData.team] || TEAM_COLORS.none);
      }

      // Update name label if name or team changed
      if (player.data.name !== playerData.name || player.data.team !== playerData.team) {
        const oldLabel = player.mesh.getObjectByName('nameLabel');
        if (oldLabel) player.mesh.remove(oldLabel);
        const nameLabel = createPlayerLabel(playerData.name, playerData.team);
        nameLabel.position.y = 1.8;
        player.mesh.add(nameLabel);
      }

      player.data = playerData;
    }

    state.players[id].mesh.position.set(playerData.x, playerData.y, playerData.z);
  }

  for (const id in state.players) {
    if (!players[id]) {
      scene.remove(state.players[id].mesh);
      const idx = collidableObjects.indexOf(state.players[id].mesh);
      if (idx > -1) collidableObjects.splice(idx, 1);
      delete state.players[id];
      delete playerStats[id];
    }
  }
});

// Chat message handler
socket.on('chat', (data) => {
  addChatMessage(data.name, data.message, data.team, data.teamOnly);
});

// Player death handler - show kill feed
socket.on('playerDeath', (data) => {
  addKillFeedEntry(data.killerName, data.killerTeam, data.playerName, data.playerTeam);

  // Track our death
  if (data.playerId === socket.id) {
    state.deaths++;
  }

  // Track our kill (PvP only, not enemy kills)
  if (data.killerId === socket.id && !data.isEnemyKill) {
    state.kills++;
  }

  // Update stats for other players
  if (data.playerId && data.playerId !== socket.id) {
    if (!playerStats[data.playerId]) {
      playerStats[data.playerId] = { name: data.playerName, team: data.playerTeam, kills: 0, deaths: 0 };
    }
    playerStats[data.playerId].deaths++;
  }

  if (data.killerId && data.killerId !== socket.id && !data.isEnemyKill) {
    if (!playerStats[data.killerId]) {
      playerStats[data.killerId] = { name: data.killerName, team: data.killerTeam, kills: 0, deaths: 0 };
    }
    playerStats[data.killerId].kills++;
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
  if (!state.isPlaying || state.isPaused || state.isDead) return; // Ignore damage while on menu, paused, or dead
  if (data.targetId === socket.id) {
    state.health -= data.damage;
    if (state.health < 0) state.health = 0;
    updateHealth();
    playSound('hit');
    triggerScreenShake(0.5);

    document.getElementById('damage-overlay').style.opacity = 0.3;
    setTimeout(() => {
      if (!state.isDead) document.getElementById('damage-overlay').style.opacity = 0;
    }, 100);

    if (state.health <= 0) {
      handleDeath('Player');
    }
  }
});

// Enemy attack - player takes damage from enemy (applies difficulty multiplier)
socket.on('enemyAttack', (data) => {
  if (!state.isPlaying || state.isPaused || state.isDead) return; // Ignore damage while on menu, paused, or dead
  if (data.targetId === socket.id) {
    // Apply difficulty damage multiplier
    const diffSettings = DIFFICULTY_SETTINGS[state.difficulty];
    const actualDamage = Math.round(data.damage * diffSettings.damageMultiplier);

    state.health -= actualDamage;
    if (state.health < 0) state.health = 0;
    updateHealth();
    playSound('hit');
    triggerScreenShake(0.6);

    document.getElementById('damage-overlay').style.opacity = 0.4;
    setTimeout(() => {
      if (!state.isDead) document.getElementById('damage-overlay').style.opacity = 0;
    }, 150);

    if (state.health <= 0) {
      // Get enemy type for killer name
      const enemyType = data.enemyId.includes('soldier') ? 'Soldier' :
                        data.enemyId.includes('scout') ? 'Scout' :
                        data.enemyId.includes('heavy') ? 'Heavy' : 'Enemy';
      handleDeath(enemyType);
    }
  }
});

socket.on('enemyHit', (data) => {
  playSound('enemyHit');
});

socket.on('enemyDeath', (data) => {
  playSound('enemyDeath');
  console.log(`Enemy ${data.enemyId} was killed!`);

  // Track kill if we killed this enemy
  if (data.killerId === socket.id) {
    state.kills++;
  }

  // Create death effect
  const enemy = state.enemies[data.enemyId];
  if (enemy) {
    createHitEffect(enemy.mesh.position.clone(), 0xff0000);
  }
});

socket.on('enemyRespawn', (data) => {
  console.log(`Enemy ${data.enemyId} respawned`);
});

// Handle other player entering a vehicle
socket.on('playerEnteredVehicle', (data) => {
  const vehicle = vehicles[data.vehicleId];
  if (vehicle) {
    vehicle.occupied = true;
    vehicle.driver = data.playerId;
  }
});

// Handle other player exiting a vehicle
socket.on('playerExitedVehicle', (data) => {
  const vehicle = vehicles[data.vehicleId];
  if (vehicle) {
    vehicle.occupied = false;
    vehicle.driver = null;
  }
});

// Handle vehicle position updates from other players
socket.on('vehicleMoved', (data) => {
  const vehicle = vehicles[data.vehicleId];
  if (vehicle && vehicle.driver === data.playerId) {
    vehicle.mesh.position.x = data.x;
    vehicle.mesh.position.z = data.z;
    vehicle.mesh.rotation.y = data.rotation;
    vehicle.x = data.x;
    vehicle.z = data.z;
    vehicle.rotation = data.rotation;
    vehicle.speed = data.speed;
  }
});

// ==================== SCOREBOARD SYSTEM ====================

const playerStats = {}; // { odId: { name, team, kills, deaths } }
let scoreboardVisible = false;

function updateScoreboard() {
  const tbody = document.getElementById('scoreboard-body');
  if (!tbody) return;

  // Build list of all players including self
  const allPlayers = [];

  // Add self
  allPlayers.push({
    id: socket.id,
    name: state.playerName,
    team: state.team,
    kills: state.kills,
    deaths: state.deaths,
    isYou: true
  });

  // Add other players from playerStats
  for (const id in playerStats) {
    if (id !== socket.id) {
      allPlayers.push({
        id,
        ...playerStats[id],
        isYou: false
      });
    }
  }

  // Sort by kills (descending), then by deaths (ascending)
  allPlayers.sort((a, b) => {
    if (b.kills !== a.kills) return b.kills - a.kills;
    return a.deaths - b.deaths;
  });

  // Render rows
  tbody.innerHTML = allPlayers.map(player => {
    const teamClass = player.team === 'red' ? 'red-team' : player.team === 'blue' ? 'blue-team' : 'solo';
    const kd = player.deaths === 0 ? player.kills.toFixed(1) : (player.kills / player.deaths).toFixed(2);
    const youClass = player.isYou ? 'you' : '';

    return `
      <tr class="${youClass}">
        <td><span class="player-name ${teamClass}">${player.name}${player.isYou ? ' (You)' : ''}</span></td>
        <td class="kills">${player.kills}</td>
        <td class="deaths">${player.deaths}</td>
        <td class="kd">${kd}</td>
      </tr>
    `;
  }).join('');
}

function showScoreboard(show) {
  scoreboardVisible = show;
  const scoreboard = document.getElementById('scoreboard');
  if (scoreboard) {
    scoreboard.classList.toggle('visible', show);
    if (show) {
      updateScoreboard();
    }
  }
}

// ==================== MINIMAP SYSTEM ====================

const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;
const minimapCoords = document.getElementById('minimap-coords');
const MINIMAP_RANGE = 100; // World units visible on minimap
const MINIMAP_SIZE = 180;
const MINIMAP_CENTER = MINIMAP_SIZE / 2;

function updateMinimap() {
  if (!minimapCtx || !state.isPlaying) return;

  const ctx = minimapCtx;
  const playerX = camera.position.x;
  const playerZ = camera.position.z;

  // Clear canvas
  ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

  // Create circular clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(MINIMAP_CENTER, MINIMAP_CENTER, MINIMAP_CENTER - 2, 0, Math.PI * 2);
  ctx.clip();

  // Draw background with grid
  ctx.fillStyle = 'rgba(20, 40, 20, 0.8)';
  ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

  // Get player rotation for rotating the minimap
  const playerRotation = euler.y;

  // Draw grid lines (rotated)
  ctx.save();
  ctx.translate(MINIMAP_CENTER, MINIMAP_CENTER);
  ctx.rotate(-playerRotation);

  ctx.strokeStyle = 'rgba(50, 80, 50, 0.5)';
  ctx.lineWidth = 1;

  // Calculate grid offset based on player position
  const gridSize = 20; // World units
  const gridPixels = (gridSize / MINIMAP_RANGE) * MINIMAP_SIZE;

  const offsetX = (playerX % gridSize) / MINIMAP_RANGE * MINIMAP_SIZE;
  const offsetZ = (playerZ % gridSize) / MINIMAP_RANGE * MINIMAP_SIZE;

  for (let i = -10; i <= 10; i++) {
    const pos = i * gridPixels;
    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(pos - offsetX, -MINIMAP_SIZE);
    ctx.lineTo(pos - offsetX, MINIMAP_SIZE);
    ctx.stroke();
    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(-MINIMAP_SIZE, pos - offsetZ);
    ctx.lineTo(MINIMAP_SIZE, pos - offsetZ);
    ctx.stroke();
  }

  ctx.restore();

  // Helper function to convert world coords to minimap coords
  function worldToMinimap(worldX, worldZ) {
    const relX = worldX - playerX;
    const relZ = worldZ - playerZ;

    // Rotate relative to player facing direction
    const rotatedX = relX * Math.cos(-playerRotation) - relZ * Math.sin(-playerRotation);
    const rotatedZ = relX * Math.sin(-playerRotation) + relZ * Math.cos(-playerRotation);

    const mapX = MINIMAP_CENTER + (rotatedX / MINIMAP_RANGE) * MINIMAP_SIZE;
    const mapY = MINIMAP_CENTER - (rotatedZ / MINIMAP_RANGE) * MINIMAP_SIZE;

    return { x: mapX, y: mapY };
  }

  // Draw vehicles (jeeps gray, motorcycles orange)
  for (const id in vehicles) {
    const vehicle = vehicles[id];
    const pos = worldToMinimap(vehicle.mesh.position.x, vehicle.mesh.position.z);
    const dist = Math.sqrt(Math.pow(pos.x - MINIMAP_CENTER, 2) + Math.pow(pos.y - MINIMAP_CENTER, 2));
    if (dist < MINIMAP_CENTER - 5) {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(-playerRotation + vehicle.mesh.rotation.y);
      if (vehicle.type === 'motorcycle') {
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(-2, -3, 4, 6); // Thinner, longer shape for motorcycle
      } else {
        ctx.fillStyle = '#666666';
        ctx.fillRect(-4, -2, 8, 4); // Wider shape for jeep
      }
      ctx.restore();
    }
  }

  // Draw enemies (red dots)
  for (const id in state.enemies) {
    const enemy = state.enemies[id];
    if (enemy.data.health <= 0) continue;

    const pos = worldToMinimap(enemy.data.x, enemy.data.z);
    const dist = Math.sqrt(Math.pow(pos.x - MINIMAP_CENTER, 2) + Math.pow(pos.y - MINIMAP_CENTER, 2));

    if (dist < MINIMAP_CENTER - 5) {
      // Color based on enemy type
      switch (enemy.data.type) {
        case 'heavy': ctx.fillStyle = '#990000'; break;
        case 'scout': ctx.fillStyle = '#ff6600'; break;
        default: ctx.fillStyle = '#ff0000';
      }
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw pickups (small colored squares)
  for (const id in pickups) {
    const pickup = pickups[id];
    if (pickup.collected) continue;

    const pos = worldToMinimap(pickup.x, pickup.z);
    const dist = Math.sqrt(Math.pow(pos.x - MINIMAP_CENTER, 2) + Math.pow(pos.y - MINIMAP_CENTER, 2));

    if (dist < MINIMAP_CENTER - 5) {
      ctx.fillStyle = pickup.type === 'health' ? '#27ae60' : '#f39c12';
      ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4);
    }
  }

  // Draw portal (purple star)
  const portalPos = worldToMinimap(PORTAL_POSITION.x, PORTAL_POSITION.z);
  const portalDist = Math.sqrt(Math.pow(portalPos.x - MINIMAP_CENTER, 2) + Math.pow(portalPos.y - MINIMAP_CENTER, 2));

  if (portalDist < MINIMAP_CENTER - 5) {
    // Draw star shape for portal
    ctx.save();
    ctx.translate(portalPos.x, portalPos.y);
    ctx.fillStyle = '#9932cc';
    ctx.strokeStyle = '#da70d6';
    ctx.lineWidth = 1;

    // 5-pointed star
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
      const x = Math.cos(angle) * 6;
      const y = Math.sin(angle) * 6;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else {
    // Draw edge indicator pointing to portal when off-screen
    const angle = Math.atan2(portalPos.y - MINIMAP_CENTER, portalPos.x - MINIMAP_CENTER);
    const edgeRadius = MINIMAP_CENTER - 12;
    const edgeX = MINIMAP_CENTER + Math.cos(angle) * edgeRadius;
    const edgeY = MINIMAP_CENTER + Math.sin(angle) * edgeRadius;

    ctx.save();
    ctx.translate(edgeX, edgeY);
    ctx.rotate(angle);
    ctx.fillStyle = '#9932cc';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-4, -5);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Draw other players (colored by team)
  for (const id in state.players) {
    const player = state.players[id];
    const pos = worldToMinimap(player.mesh.position.x, player.mesh.position.z);
    const dist = Math.sqrt(Math.pow(pos.x - MINIMAP_CENTER, 2) + Math.pow(pos.y - MINIMAP_CENTER, 2));

    if (dist < MINIMAP_CENTER - 5) {
      // Color based on team
      switch (player.data.team) {
        case 'red': ctx.fillStyle = '#e74c3c'; break;
        case 'blue': ctx.fillStyle = '#3498db'; break;
        default: ctx.fillStyle = '#f39c12';
      }
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // White border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.restore();

  // Draw cardinal directions
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';

  // Calculate rotated positions for N, S, E, W
  const dirDist = MINIMAP_CENTER - 12;
  const dirs = [
    { label: 'N', angle: 0 },
    { label: 'E', angle: Math.PI / 2 },
    { label: 'S', angle: Math.PI },
    { label: 'W', angle: -Math.PI / 2 }
  ];

  dirs.forEach(dir => {
    const angle = dir.angle - playerRotation;
    const x = MINIMAP_CENTER + Math.sin(angle) * dirDist;
    const y = MINIMAP_CENTER - Math.cos(angle) * dirDist;
    ctx.fillText(dir.label, x, y + 3);
  });

  // Update coordinates display
  if (minimapCoords) {
    minimapCoords.textContent = `${Math.round(playerX)}, ${Math.round(playerZ)}`;
  }
}

// ==================== UI UPDATES ====================

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'loot-notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => notification.classList.add('visible'), 10);

  // Remove after animation
  setTimeout(() => {
    notification.classList.remove('visible');
    setTimeout(() => notification.remove(), 300);
  }, 1500);
}

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
    // Vehicle movement, parachute, or on-foot movement
    if (state.inVehicle) {
      updateVehicle(delta);

      // Update terrain chunks based on vehicle position
      updateChunks(camera.position.x, camera.position.z);

      // Emit position for other players
      socket.emit('move', {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      });
    } else if (state.isParachuting) {
      // Parachute movement
      updateParachute(delta);
    } else {
      // Normal on-foot movement
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

      // Footstep sounds when moving on ground
      const isMoving = state.moveForward || state.moveBackward || state.moveLeft || state.moveRight;
      if (isMoving && state.canJump) {
        const now = Date.now();
        const interval = state.isSprinting ? FOOTSTEP_SPRINT_INTERVAL : FOOTSTEP_INTERVAL;
        if (now - lastFootstepTime > interval) {
          playSound('footstep');
          lastFootstepTime = now;
        }
      }

      socket.emit('move', {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      });

      // Update terrain chunks based on player position
      updateChunks(camera.position.x, camera.position.z);
    }
  }

  portal.rotation.z += delta * 0.5;
  portalInner.rotation.z -= delta * 0.3;

  // Update day/night cycle
  updateDayNightCycle(delta);

  // Show/hide vehicle prompt when near a vehicle
  const vehiclePrompt = document.getElementById('vehicle-prompt');
  if (vehiclePrompt && state.isPlaying && !state.isPaused && !state.inVehicle) {
    const nearVehicle = getNearestVehicle(camera.position);
    if (nearVehicle) {
      const vehicleTypeName = nearVehicle.type === 'aircraft' ? 'aircraft' :
                              nearVehicle.type === 'motorcycle' ? 'motorcycle' : 'vehicle';
      vehiclePrompt.innerHTML = `Press <span>E</span> to enter ${vehicleTypeName}`;
    }
    vehiclePrompt.classList.toggle('visible', nearVehicle !== null);
  } else if (vehiclePrompt) {
    vehiclePrompt.classList.remove('visible');
  }

  // Show/hide loot prompt when near a crate
  const lootPrompt = document.getElementById('loot-prompt');
  if (lootPrompt && state.isPlaying && !state.isPaused && !state.inVehicle) {
    const nearLoot = getNearestLootContainer(camera.position);
    lootPrompt.classList.toggle('visible', nearLoot !== null);
  } else if (lootPrompt) {
    lootPrompt.classList.remove('visible');
  }

  // Apply screen shake
  updateScreenShake(camera);

  // Update minimap
  updateMinimap();

  // Update pickups (animation and collection)
  updatePickups();

  // Update weapon pickups
  updateWeaponPickups();

  // Update portal (distance indicator and victory check)
  updatePortal();

  renderer.render(scene, camera);
}

// Initialize displays
updateHealth();
updateAmmoDisplay();
updateWeaponDisplay();
animate();
