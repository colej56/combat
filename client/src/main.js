import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { io } from 'socket.io-client';

// ==================== LOADING SCREEN ====================
const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const loadingText = document.getElementById('loading-text');
const loadingTip = document.getElementById('loading-tip');

const LOADING_TIPS = [
  'TIP: Press <span>F</span> to toggle your flashlight at night',
  'TIP: Use <span>Shift</span> to sprint faster',
  'TIP: Press <span>Tab</span> to open your inventory',
  'TIP: Vehicles spawn near the origin and in chunks',
  'TIP: The portal is located at coordinates (100, 100)',
  'TIP: Press <span>R</span> to reload your weapon',
  'TIP: Headshots deal extra damage',
  'TIP: Press <span>E</span> to enter vehicles and search crates',
  'TIP: Health pickups restore 50 HP',
  'TIP: Press <span>L</span> to view your perks'
];

function updateLoadingProgress(percent, text) {
  if (loadingBar) loadingBar.style.width = `${percent}%`;
  if (loadingText) loadingText.textContent = text;
}

function showRandomTip() {
  if (loadingTip) {
    const tip = LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];
    loadingTip.innerHTML = tip;
  }
}

function hideLoadingScreen() {
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
    // Remove from DOM after transition
    setTimeout(() => {
      loadingScreen.classList.add('removed');
    }, 500);
  }
}

// Show random tip on load
showRandomTip();
updateLoadingProgress(5, 'Loading assets...');

// ==================== TUTORIAL SYSTEM ====================
const TUTORIAL_STEPS = [
  {
    title: 'Movement',
    description: `
      <span class="key">W</span> Move forward<br>
      <span class="key">A</span> Move left<br>
      <span class="key">S</span> Move backward<br>
      <span class="key">D</span> Move right<br>
      <span class="key">Space</span> Jump<br>
      <span class="key">Shift</span> Sprint (hold)
    `
  },
  {
    title: 'Looking Around',
    description: `
      Move your <span class="key">Mouse</span> to look around.<br><br>
      Your camera will follow your mouse movement.
    `
  },
  {
    title: 'Combat',
    description: `
      <span class="key">Left Click</span> Shoot<br>
      <span class="key">R</span> Reload weapon<br>
      <span class="key">1</span> <span class="key">2</span> <span class="key">3</span> <span class="key">4</span> Switch weapons<br><br>
      Aim at enemies to deal damage!
    `
  },
  {
    title: 'Vehicles',
    description: `
      <span class="key">E</span> Enter/Exit vehicles<br><br>
      Vehicles spawn near the origin and throughout the map.<br>
      Use <span class="key">WASD</span> to drive.
    `
  },
  {
    title: 'Interactions',
    description: `
      <span class="key">E</span> Search loot crates<br>
      <span class="key">E</span> Open doors<br>
      <span class="key">E</span> Talk to NPCs<br>
      <span class="key">F</span> Toggle flashlight (useful at night!)
    `
  },
  {
    title: 'Inventory & Perks',
    description: `
      <span class="key">Tab</span> Open inventory (weapon attachments)<br>
      <span class="key">L</span> Open perks menu<br><br>
      Unlock attachments by getting kills with each weapon!
    `
  },
  {
    title: 'Communication',
    description: `
      <span class="key">T</span> Open all chat<br>
      <span class="key">Y</span> Open team chat<br><br>
      Communicate with other players in multiplayer!
    `
  },
  {
    title: 'Other Controls',
    description: `
      <span class="key">ESC</span> Pause game<br>
      <span class="key">F3</span> Toggle performance stats<br><br>
      The portal at coordinates (100, 100) leads to victory!
    `
  }
];

let tutorialStep = 0;
let pendingGameStart = null;

const tutorialPrompt = document.getElementById('tutorial-prompt');
const tutorialOverlay = document.getElementById('tutorial-overlay');
const tutorialTitle = document.getElementById('tutorial-title');
const tutorialDescription = document.getElementById('tutorial-description');
const tutorialStepNum = document.getElementById('tutorial-step-num');
const tutorialStepTotal = document.getElementById('tutorial-step-total');
const tutorialPrevBtn = document.getElementById('tutorial-prev');
const tutorialNextBtn = document.getElementById('tutorial-next');
const tutorialSkipBtn = document.getElementById('tutorial-skip');
const tutorialResetBtn = document.getElementById('tutorial-reset');
const tutorialYesBtn = document.getElementById('tutorial-yes');
const tutorialNoBtn = document.getElementById('tutorial-no');
const tutorialRememberCheckbox = document.getElementById('tutorial-remember-checkbox');

function showTutorialPrompt(gameStartCallback) {
  // Check if user has saved preference
  const skipTutorial = localStorage.getItem('skipTutorial');
  if (skipTutorial === 'true') {
    gameStartCallback();
    return;
  }

  pendingGameStart = gameStartCallback;
  tutorialPrompt.classList.remove('hidden');
}

function hideTutorialPrompt() {
  tutorialPrompt.classList.add('hidden');
}

function showTutorial() {
  hideTutorialPrompt();
  tutorialStep = 0;
  tutorialStepTotal.textContent = TUTORIAL_STEPS.length;
  updateTutorialStep();
  tutorialOverlay.classList.remove('hidden');
}

function hideTutorial() {
  tutorialOverlay.classList.add('hidden');
  if (pendingGameStart) {
    pendingGameStart();
    pendingGameStart = null;
  }
}

function updateTutorialStep() {
  const step = TUTORIAL_STEPS[tutorialStep];
  tutorialTitle.textContent = step.title;
  tutorialDescription.innerHTML = step.description;
  tutorialStepNum.textContent = tutorialStep + 1;

  // Update button states
  tutorialPrevBtn.disabled = tutorialStep === 0;
  tutorialNextBtn.textContent = tutorialStep === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next';
}

function nextTutorialStep() {
  if (tutorialStep < TUTORIAL_STEPS.length - 1) {
    tutorialStep++;
    updateTutorialStep();
  } else {
    hideTutorial();
  }
}

function prevTutorialStep() {
  if (tutorialStep > 0) {
    tutorialStep--;
    updateTutorialStep();
  }
}

// Tutorial button event listeners (set up after DOM is ready)
if (tutorialYesBtn) {
  tutorialYesBtn.addEventListener('click', () => {
    if (tutorialRememberCheckbox && tutorialRememberCheckbox.checked) {
      localStorage.setItem('skipTutorial', 'false');
    }
    showTutorial();
  });
}

if (tutorialNoBtn) {
  tutorialNoBtn.addEventListener('click', () => {
    if (tutorialRememberCheckbox && tutorialRememberCheckbox.checked) {
      localStorage.setItem('skipTutorial', 'true');
    }
    hideTutorialPrompt();
    if (pendingGameStart) {
      pendingGameStart();
      pendingGameStart = null;
    }
  });
}

if (tutorialNextBtn) {
  tutorialNextBtn.addEventListener('click', nextTutorialStep);
}

if (tutorialPrevBtn) {
  tutorialPrevBtn.addEventListener('click', prevTutorialStep);
}

if (tutorialSkipBtn) {
  tutorialSkipBtn.addEventListener('click', hideTutorial);
}

if (tutorialResetBtn) {
  tutorialResetBtn.addEventListener('click', () => {
    localStorage.removeItem('skipTutorial');
    alert('Tutorial preference reset! You will be asked about the tutorial next time you start a game.');
  });
}

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

// Weapon attachments
const ATTACHMENTS = {
  scope: { name: 'Scope', killsRequired: 10, modifiers: { spreadMult: 0.7, zoomMult: 1.5 } },
  silencer: { name: 'Silencer', killsRequired: 15, modifiers: { muzzleFlashMult: 0.5, soundMult: 0.6, spreadMult: 1.1 } },
  extendedMag: { name: 'Extended Mag', killsRequired: 20, modifiers: { magSizeMult: 1.5 } },
  grip: { name: 'Grip', killsRequired: 25, modifiers: { spreadMult: 0.75, recoilMult: 0.9 } },
  laserSight: { name: 'Laser Sight', killsRequired: 30, modifiers: { spreadMult: 0.8 } }
};

const WEAPON_ATTACHMENT_SLOTS = {
  pistol: ['silencer', 'extendedMag', 'laserSight'],
  rifle: ['scope', 'silencer', 'extendedMag', 'grip', 'laserSight'],
  shotgun: ['extendedMag', 'grip', 'laserSight'],
  sniper: ['scope', 'silencer', 'extendedMag']
};

// Kill streak rewards
const KILLSTREAK_REWARDS = {
  uav: { kills: 3, name: 'UAV', duration: 10000, color: '#00ffff' },
  airstrike: { kills: 5, name: 'Airstrike', color: '#ff4400' },
  supplyDrop: { kills: 7, name: 'Supply Drop', color: '#ffd700' }
};

// Get weapon stats with attachment modifiers applied
function getEffectiveWeaponStats(weaponType) {
  const baseWeapon = WEAPONS[weaponType];
  const equipped = state.equippedAttachments[weaponType] || [];

  // Start with base stats
  const stats = {
    name: baseWeapon.name,
    damage: baseWeapon.damage,
    fireRate: baseWeapon.fireRate,
    reloadTime: baseWeapon.reloadTime,
    magSize: baseWeapon.magSize,
    maxAmmo: baseWeapon.maxAmmo,
    spread: baseWeapon.spread,
    automatic: baseWeapon.automatic,
    pellets: baseWeapon.pellets,
    // Attachment-specific
    muzzleFlashMult: 1,
    soundMult: 1,
    zoomMult: 1,
    recoilMult: 1
  };

  // Apply each equipped attachment's modifiers
  for (const attachmentType of equipped) {
    const attachment = ATTACHMENTS[attachmentType];
    if (!attachment) continue;

    const mods = attachment.modifiers;
    if (mods.spreadMult) stats.spread *= mods.spreadMult;
    if (mods.magSizeMult) stats.magSize = Math.floor(stats.magSize * mods.magSizeMult);
    if (mods.muzzleFlashMult) stats.muzzleFlashMult *= mods.muzzleFlashMult;
    if (mods.soundMult) stats.soundMult *= mods.soundMult;
    if (mods.zoomMult) stats.zoomMult *= mods.zoomMult;
    if (mods.recoilMult) stats.recoilMult *= mods.recoilMult;
  }

  return stats;
}

// Track kills for attachment unlocks
function trackWeaponKill(weaponType) {
  state.weaponKills[weaponType]++;
  checkAttachmentUnlocks(weaponType);
  saveAttachmentData();
}

// Check if any new attachments should be unlocked
function checkAttachmentUnlocks(weaponType) {
  const kills = state.weaponKills[weaponType];
  const availableSlots = WEAPON_ATTACHMENT_SLOTS[weaponType] || [];

  for (const attachmentType of availableSlots) {
    const attachment = ATTACHMENTS[attachmentType];
    if (!attachment) continue;

    // Check if already unlocked
    if (state.unlockedAttachments[weaponType].includes(attachmentType)) continue;

    // Check if kill threshold met
    if (kills >= attachment.killsRequired) {
      state.unlockedAttachments[weaponType].push(attachmentType);
      showAttachmentUnlock(weaponType, attachmentType);
    }
  }
}

// Show unlock notification
function showAttachmentUnlock(weaponType, attachmentType) {
  const attachment = ATTACHMENTS[attachmentType];
  const weapon = WEAPONS[weaponType];

  const unlockEl = document.getElementById('attachment-unlock');
  if (unlockEl) {
    unlockEl.textContent = `${attachment.name} unlocked for ${weapon.name}!`;
    unlockEl.classList.remove('hidden');

    setTimeout(() => {
      unlockEl.classList.add('hidden');
    }, 3000);
  }
}

// Toggle attachment equip/unequip
function toggleAttachment(weaponType, attachmentType) {
  const equipped = state.equippedAttachments[weaponType];
  const index = equipped.indexOf(attachmentType);

  if (index === -1) {
    // Equip
    equipped.push(attachmentType);
  } else {
    // Unequip
    equipped.splice(index, 1);
  }

  saveAttachmentData();
  renderInventoryUI();
}

// Save attachment data to localStorage
function saveAttachmentData() {
  const data = {
    weaponKills: state.weaponKills,
    unlockedAttachments: state.unlockedAttachments,
    equippedAttachments: state.equippedAttachments
  };
  localStorage.setItem('combatAttachments', JSON.stringify(data));
}

// Load attachment data from localStorage
function loadAttachmentData() {
  const saved = localStorage.getItem('combatAttachments');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.weaponKills) state.weaponKills = data.weaponKills;
      if (data.unlockedAttachments) state.unlockedAttachments = data.unlockedAttachments;
      if (data.equippedAttachments) state.equippedAttachments = data.equippedAttachments;
    } catch (e) {
      console.warn('Failed to load attachment data:', e);
    }
  }
}

// Open inventory screen
function openInventory() {
  if (state.gameState !== 'playing') return;

  state.inventoryOpen = true;
  document.getElementById('inventory-screen').classList.remove('hidden');
  document.exitPointerLock();
  renderInventoryUI();
}

// Close inventory screen
function closeInventory() {
  state.inventoryOpen = false;
  document.getElementById('inventory-screen').classList.add('hidden');

  if (state.gameState === 'playing') {
    renderer.domElement.requestPointerLock();
  }
}

// Short names for attachments in UI
const ATTACHMENT_SHORT_NAMES = {
  scope: 'Scope',
  silencer: 'Silencer',
  extendedMag: 'Ext Mag',
  grip: 'Grip',
  laserSight: 'Laser'
};

// Render the inventory UI
function renderInventoryUI() {
  const container = document.getElementById('weapon-slots');
  if (!container) return;

  container.innerHTML = '';

  const weaponTypes = ['pistol', 'rifle', 'shotgun', 'sniper'];

  for (const weaponType of weaponTypes) {
    const weapon = WEAPONS[weaponType];
    const availableSlots = WEAPON_ATTACHMENT_SLOTS[weaponType] || [];
    const unlocked = state.unlockedAttachments[weaponType] || [];
    const equipped = state.equippedAttachments[weaponType] || [];
    const kills = state.weaponKills[weaponType] || 0;

    const slotDiv = document.createElement('div');
    slotDiv.className = 'weapon-slot';

    const header = document.createElement('div');
    header.className = 'weapon-slot-header';
    header.innerHTML = `<strong>${weapon.name}</strong> <span class="kill-count">${kills} kills</span>`;
    slotDiv.appendChild(header);

    const attachmentsDiv = document.createElement('div');
    attachmentsDiv.className = 'attachments-list';

    for (const attachmentType of availableSlots) {
      const attachment = ATTACHMENTS[attachmentType];
      const shortName = ATTACHMENT_SHORT_NAMES[attachmentType] || attachment.name;
      const isUnlocked = unlocked.includes(attachmentType);
      const isEquipped = equipped.includes(attachmentType);

      const itemDiv = document.createElement('div');
      itemDiv.className = 'attachment-item';
      if (!isUnlocked) itemDiv.classList.add('locked');
      if (isEquipped) itemDiv.classList.add('equipped');

      if (isUnlocked) {
        itemDiv.textContent = shortName;
        itemDiv.onclick = () => toggleAttachment(weaponType, attachmentType);
      } else {
        itemDiv.textContent = `${shortName} (${attachment.killsRequired})`;
      }

      attachmentsDiv.appendChild(itemDiv);
    }

    slotDiv.appendChild(attachmentsDiv);
    container.appendChild(slotDiv);
  }
}

// ==================== XP AND LEVELING SYSTEM ====================

const XP_CONFIG = {
  levelThresholds: [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000, 13000, 16500, 20500, 25000]
};

const PERKS = {
  fastReload: { level: 2, name: 'Fast Reload', description: '20% faster reload', effect: 'reloadMult', value: 0.8 },
  thickSkin: { level: 3, name: 'Thick Skin', description: '+25 max health', effect: 'maxHealth', value: 125 },
  marathonRunner: { level: 4, name: 'Marathon Runner', description: '20% faster sprint', effect: 'sprintMult', value: 1.2 },
  steadyAim: { level: 5, name: 'Steady Aim', description: '15% less spread', effect: 'spreadMult', value: 0.85 },
  scavenger: { level: 6, name: 'Scavenger', description: '50% more ammo pickups', effect: 'ammoMult', value: 1.5 },
  quickDraw: { level: 7, name: 'Quick Draw', description: '20% faster weapon swap', effect: 'swapMult', value: 0.8 },
  juggernaut: { level: 8, name: 'Juggernaut', description: '15% less damage taken', effect: 'damageTaken', value: 0.85 },
  doubleTime: { level: 10, name: 'Double Time', description: 'Sprint duration doubled', effect: 'sprintDuration', value: 2.0 }
};

// Update XP bar display
function updateXPBar() {
  const xpFill = document.getElementById('xp-fill');
  const xpText = document.getElementById('xp-text');
  const levelText = document.getElementById('level-text');

  if (!xpFill || !xpText || !levelText) return;

  const currentLevelXp = XP_CONFIG.levelThresholds[state.level - 1] || 0;
  const nextLevelXp = XP_CONFIG.levelThresholds[state.level] || state.xp;
  const xpInLevel = state.xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const percentage = Math.min(100, (xpInLevel / xpNeeded) * 100);

  xpFill.style.width = `${percentage}%`;
  xpText.textContent = `${xpInLevel}/${xpNeeded} XP`;
  levelText.textContent = `LVL ${state.level}`;
}

// Show XP gained popup
function showXPGained(amount, reason) {
  const xpPopup = document.createElement('div');
  xpPopup.className = 'xp-popup';
  xpPopup.innerHTML = `+${amount} XP<br><small>${reason}</small>`;
  document.body.appendChild(xpPopup);

  // Animate and remove
  setTimeout(() => {
    xpPopup.classList.add('fade-out');
    setTimeout(() => xpPopup.remove(), 500);
  }, 1500);
}

// Show level up notification
function showLevelUp(newLevel, newPerks) {
  const levelUpEl = document.getElementById('level-up-notification');
  if (levelUpEl) {
    levelUpEl.innerHTML = `
      <div class="level-up-title">LEVEL UP!</div>
      <div class="level-up-level">Level ${newLevel}</div>
      ${newPerks.length > 0 ? `<div class="level-up-perks">New perk available: ${newPerks.map(p => p.name).join(', ')}</div>` : ''}
    `;
    levelUpEl.classList.remove('hidden');
    playSound('pickup'); // Level up sound

    setTimeout(() => {
      levelUpEl.classList.add('hidden');
    }, 4000);
  }
}

// Get perk value for a specific effect
function getPerkValue(effectName, defaultValue) {
  for (const perkId of state.perks) {
    const perk = PERKS[perkId];
    if (perk && perk.effect === effectName) {
      return perk.value;
    }
  }
  return defaultValue;
}

// Check if player has a specific perk
function hasPerk(perkId) {
  return state.perks.includes(perkId);
}

// Open perk menu
function openPerkMenu() {
  if (state.gameState !== 'playing') return;

  state.perkMenuOpen = true;
  document.getElementById('perk-menu').classList.remove('hidden');
  document.exitPointerLock();
  socket.emit('requestPerks');
}

// Close perk menu
function closePerkMenu() {
  state.perkMenuOpen = false;
  document.getElementById('perk-menu').classList.add('hidden');

  if (state.gameState === 'playing') {
    renderer.domElement.requestPointerLock();
  }
}

// Render perk menu UI
function renderPerkMenu(perksData) {
  const container = document.getElementById('perk-list');
  if (!container) return;

  container.innerHTML = '';

  // Render unlocked perks
  if (perksData.unlockedPerks && perksData.unlockedPerks.length > 0) {
    const unlockedHeader = document.createElement('div');
    unlockedHeader.className = 'perk-section-header';
    unlockedHeader.textContent = 'Available Perks';
    container.appendChild(unlockedHeader);

    for (const perk of perksData.unlockedPerks) {
      const perkDiv = document.createElement('div');
      perkDiv.className = 'perk-item' + (perk.selected ? ' selected' : '');

      perkDiv.innerHTML = `
        <div class="perk-name">${perk.name}</div>
        <div class="perk-desc">${perk.description}</div>
        <div class="perk-level">Unlocked at Level ${perk.level}</div>
      `;

      if (!perk.selected) {
        perkDiv.onclick = () => {
          socket.emit('selectPerk', { perkId: perk.id });
        };
      }

      container.appendChild(perkDiv);
    }
  }

  // Render locked perks
  if (perksData.lockedPerks && Object.keys(perksData.lockedPerks).length > 0) {
    const lockedHeader = document.createElement('div');
    lockedHeader.className = 'perk-section-header';
    lockedHeader.textContent = 'Locked Perks';
    container.appendChild(lockedHeader);

    for (const [perkId, perk] of Object.entries(perksData.lockedPerks)) {
      const perkDiv = document.createElement('div');
      perkDiv.className = 'perk-item locked';

      perkDiv.innerHTML = `
        <div class="perk-name">${perk.name}</div>
        <div class="perk-desc">${perk.description}</div>
        <div class="perk-level">Requires Level ${perk.level}</div>
      `;

      container.appendChild(perkDiv);
    }
  }
}

// Save XP progress to localStorage
function saveXPProgress() {
  const data = {
    xp: state.xp,
    level: state.level,
    perks: state.perks
  };
  localStorage.setItem('combatXPProgress', JSON.stringify(data));
}

// Load XP progress from localStorage
function loadXPProgress() {
  const saved = localStorage.getItem('combatXPProgress');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.xp !== undefined) state.xp = data.xp;
      if (data.level !== undefined) state.level = data.level;
      if (data.perks) state.perks = data.perks;
    } catch (e) {
      console.warn('Failed to load XP progress:', e);
    }
  }
}

// ==================== WEATHER SYSTEM ====================

const WEATHER_TYPES = {
  clear: {
    fogNear: 200,
    fogFar: 400,
    fogColor: 0x87CEEB,
    particleCount: 0,
    ambientIntensity: 0.6
  },
  rain: {
    fogNear: 50,
    fogFar: 150,
    fogColor: 0x4a6080,
    particleCount: 2000,
    particleSpeed: -50,
    particleColor: 0x8899aa,
    particleSize: 0.1,
    ambientIntensity: 0.3
  },
  fog: {
    fogNear: 10,
    fogFar: 60,
    fogColor: 0xaabbcc,
    particleCount: 0,
    ambientIntensity: 0.4
  },
  sandstorm: {
    fogNear: 20,
    fogFar: 80,
    fogColor: 0xc9a868,
    particleCount: 1500,
    particleSpeedX: 30,
    particleSpeedZ: 10,
    particleColor: 0xd4a460,
    particleSize: 0.3,
    ambientIntensity: 0.5
  }
};

let weatherParticles = null;
let weatherParticlePositions = null;
let currentWeatherType = 'clear';
let targetFogNear = 200;
let targetFogFar = 400;
let targetFogColor = new THREE.Color(0x87CEEB);

// Create weather particle system
function createWeatherParticles(type) {
  // Remove existing particles
  if (weatherParticles) {
    scene.remove(weatherParticles);
    weatherParticles.geometry.dispose();
    weatherParticles.material.dispose();
    weatherParticles = null;
  }

  const weatherConfig = WEATHER_TYPES[type];
  if (!weatherConfig || weatherConfig.particleCount === 0) return;

  const particleCount = weatherConfig.particleCount;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  // Spread particles around the player
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 100;
    positions[i * 3 + 1] = Math.random() * 50;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  weatherParticlePositions = positions;

  const material = new THREE.PointsMaterial({
    color: weatherConfig.particleColor || 0xffffff,
    size: weatherConfig.particleSize || 0.1,
    transparent: true,
    opacity: 0.6,
    depthWrite: false
  });

  weatherParticles = new THREE.Points(geometry, material);
  scene.add(weatherParticles);
}

// Update weather particles
function updateWeatherParticles(delta) {
  if (!weatherParticles || !weatherParticlePositions) return;

  const weatherConfig = WEATHER_TYPES[currentWeatherType];
  if (!weatherConfig) return;

  const positions = weatherParticlePositions;
  const count = positions.length / 3;

  for (let i = 0; i < count; i++) {
    // Rain falls down
    if (weatherConfig.particleSpeed) {
      positions[i * 3 + 1] += weatherConfig.particleSpeed * delta;
    }

    // Sandstorm moves horizontally
    if (weatherConfig.particleSpeedX) {
      positions[i * 3] += weatherConfig.particleSpeedX * delta;
    }
    if (weatherConfig.particleSpeedZ) {
      positions[i * 3 + 2] += weatherConfig.particleSpeedZ * delta;
    }

    // Reset particles that go out of bounds
    if (positions[i * 3 + 1] < 0) {
      positions[i * 3 + 1] = 50;
    }
    if (positions[i * 3] > 50) {
      positions[i * 3] = -50;
    }
    if (positions[i * 3 + 2] > 50) {
      positions[i * 3 + 2] = -50;
    }
  }

  // Keep particles centered on player
  if (camera) {
    weatherParticles.position.x = camera.position.x;
    weatherParticles.position.z = camera.position.z;
  }

  weatherParticles.geometry.attributes.position.needsUpdate = true;
}

// Transition weather
function transitionWeather(newType) {
  if (currentWeatherType === newType) return;

  console.log(`Weather changing to: ${newType}`);
  currentWeatherType = newType;

  const weatherConfig = WEATHER_TYPES[newType];
  if (!weatherConfig) return;

  // Set target fog values for smooth transition
  targetFogNear = weatherConfig.fogNear;
  targetFogFar = weatherConfig.fogFar;
  targetFogColor = new THREE.Color(weatherConfig.fogColor);

  // Create particles for this weather
  createWeatherParticles(newType);

  // Update ambient light
  if (typeof ambientLight !== 'undefined' && ambientLight) {
    // Will be smoothly transitioned in updateWeather
  }

  // Show weather notification
  showWeatherNotification(newType);
}

// Update weather effects in animation loop
function updateWeather(delta) {
  // Smooth fog transition
  if (scene.fog) {
    scene.fog.near += (targetFogNear - scene.fog.near) * 0.02;
    scene.fog.far += (targetFogFar - scene.fog.far) * 0.02;
    scene.fog.color.lerp(targetFogColor, 0.02);
    if (scene.background && scene.background.isColor) {
      scene.background.lerp(targetFogColor, 0.02);
    }
  }

  // Update weather particles
  updateWeatherParticles(delta);
}

// Show weather notification
function showWeatherNotification(type) {
  const weatherNames = {
    clear: 'Clear Skies',
    rain: 'Rainstorm',
    fog: 'Dense Fog',
    sandstorm: 'Sandstorm'
  };

  const weatherEl = document.getElementById('weather-indicator');
  if (weatherEl) {
    weatherEl.textContent = weatherNames[type] || type;
    weatherEl.className = `weather-${type}`;
  }
}

// Enemy type colors
const ENEMY_COLORS = {
  soldier: 0xff0000,
  scout: 0xff6600,
  heavy: 0x990000,
  // Boss colors
  tankBoss: 0x4a0000,
  mechBoss: 0x2a4858,
  skyBoss: 0x1a1a3a
};

// Boss configuration
const BOSS_CONFIG = {
  tankBoss: { name: 'Tank Boss', scale: 2.5 },
  mechBoss: { name: 'Mech Boss', scale: 2.0, hasShield: true },
  skyBoss: { name: 'Sky Boss', scale: 1.8, flies: true }
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
  previousWeapon: 'pistol',
  ammoInMag: WEAPONS.pistol.magSize,
  ammoReserve: WEAPONS.pistol.maxAmmo,
  isReloading: false,
  canShoot: true,
  isShooting: false,
  isDead: false,
  isDying: false, // Death animation in progress
  deathAnimationPhase: 0, // 0=none, 1=shake, 2=fall, 3=screen
  originalCameraY: 0, // Store camera Y for death animation
  lastKiller: null,
  playerName: 'Player',
  team: 'none', // none, red, blue, green, yellow
  isChatting: false,
  // Stats
  kills: 0,
  deaths: 0,
  // Kill streaks
  killStreak: 0,
  uavActive: false,
  uavEndTime: 0,
  pendingAirstrike: false,
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
  parachuteMesh: null,
  // Weapon attachments
  weaponKills: { pistol: 0, rifle: 0, shotgun: 0, sniper: 0 },
  unlockedAttachments: { pistol: [], rifle: [], shotgun: [], sniper: [] },
  equippedAttachments: { pistol: [], rifle: [], shotgun: [], sniper: [] },
  inventoryOpen: false,
  // Game mode
  gameMode: 'freeplay',
  gameModeState: {},
  gameModeConfig: {},
  selectedGameMode: 'freeplay',
  // NPC system
  npcs: {},
  nearbyNPC: null,
  inDialogue: false,
  currentDialogue: null,
  activeQuests: [],
  completedQuests: [],
  // XP and leveling system
  xp: 0,
  level: 1,
  nextLevelXp: 100,
  perks: [],
  availablePerks: [],
  perkMenuOpen: false
};

// ==================== GAME MODE 3D OBJECTS ====================
const gameModeObjects = {
  kothZone: null,
  ctfRedFlag: null,
  ctfBlueFlag: null,
  brCircle: null
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
  },
  tank: {
    maxSpeed: 30,
    acceleration: 10,
    brake: 30,
    turnSpeed: 1.2,
    friction: 8,
    cameraHeight: 5,
    cameraDistance: 12,
    isAircraft: false,
    hasTurret: true,
    cannonDamage: 200,
    cannonCooldown: 3000,
    armor: 3.0  // Damage reduction factor
  },
  boat: {
    maxSpeed: 50,
    acceleration: 20,
    brake: 25,
    turnSpeed: 1.8,
    friction: 5,
    cameraHeight: 3,
    cameraDistance: 10,
    isAircraft: false,
    isWatercraft: true,
    bobAmount: 0.3
  }
};

// ==================== WATER SYSTEM ====================

const WATER_ZONES = [
  { x: 200, z: 200, radius: 80 },     // Lake
  { x: -150, z: 300, radiusX: 150, radiusZ: 40 },  // River segment 1
  { x: 0, z: 350, radiusX: 150, radiusZ: 40 },     // River segment 2
  { x: 150, z: 300, radiusX: 100, radiusZ: 40 }    // River segment 3
];

const waterMeshes = [];

// Check if position is in water
function isWaterAt(x, z) {
  for (const zone of WATER_ZONES) {
    if (zone.radiusX && zone.radiusZ) {
      // Elliptical zone (river)
      const dx = (x - zone.x) / zone.radiusX;
      const dz = (z - zone.z) / zone.radiusZ;
      if (dx * dx + dz * dz <= 1) return true;
    } else {
      // Circular zone (lake)
      const dx = x - zone.x;
      const dz = z - zone.z;
      if (dx * dx + dz * dz <= zone.radius * zone.radius) return true;
    }
  }
  return false;
}

// Create water planes for all water zones
function createWaterPlanes() {
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x1a5276,
    transparent: true,
    opacity: 0.7,
    roughness: 0.2,
    metalness: 0.1
  });

  for (const zone of WATER_ZONES) {
    let geometry;
    if (zone.radiusX && zone.radiusZ) {
      geometry = new THREE.PlaneGeometry(zone.radiusX * 2, zone.radiusZ * 2, 16, 16);
    } else {
      geometry = new THREE.CircleGeometry(zone.radius, 32);
    }

    const water = new THREE.Mesh(geometry, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(zone.x, 0.3, zone.z);
    scene.add(water);
    waterMeshes.push(water);
  }
}

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
  hood.castShadow = false;
  group.add(hood);

  // Cab/roof frame
  const cabGeo = new THREE.BoxGeometry(2.3, 0.8, 1.8);
  const cab = new THREE.Mesh(cabGeo, bodyMat);
  cab.position.set(0, 1.7, -0.3);
  cab.castShadow = false;
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
    wheel.castShadow = false;
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
  frame.castShadow = false;
  group.add(frame);

  // Fuel tank
  const tankGeo = new THREE.BoxGeometry(0.5, 0.4, 0.8);
  const tank = new THREE.Mesh(tankGeo, accentMat);
  tank.position.set(0, 1, 0.2);
  tank.castShadow = false;
  group.add(tank);

  // Seat
  const seatGeo = new THREE.BoxGeometry(0.4, 0.15, 0.7);
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
  const seat = new THREE.Mesh(seatGeo, seatMat);
  seat.position.set(0, 1.0, -0.4);
  seat.castShadow = false;
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
  frontWheel.castShadow = false;
  group.add(frontWheel);

  // Rear wheel
  const rearWheel = new THREE.Mesh(wheelGeo, wheelMat);
  rearWheel.rotation.z = Math.PI / 2;
  rearWheel.position.set(0, 0.4, -0.8);
  rearWheel.castShadow = false;
  group.add(rearWheel);

  // Engine block
  const engineGeo = new THREE.BoxGeometry(0.5, 0.35, 0.5);
  const engine = new THREE.Mesh(engineGeo, frameMat);
  engine.position.set(0, 0.5, -0.1);
  engine.castShadow = false;
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
  nose.castShadow = false;
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
  wings.castShadow = false;
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
  tailFin.castShadow = false;
  group.add(tailFin);

  // Horizontal stabilizers
  const hStabGeo = new THREE.BoxGeometry(3, 0.1, 0.8);
  const hStab = new THREE.Mesh(hStabGeo, bodyMat);
  hStab.position.set(0, 0, -2.8);
  hStab.castShadow = false;
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

function createTankMesh() {
  const group = new THREE.Group();

  // Hull
  const hullGeo = new THREE.BoxGeometry(3, 1.2, 5);
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x4a5a3a }); // Olive drab
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.y = 0.8;
  hull.castShadow = true;
  group.add(hull);

  // Sloped front armor
  const frontGeo = new THREE.BoxGeometry(2.8, 0.8, 1.5);
  const front = new THREE.Mesh(frontGeo, hullMat);
  front.position.set(0, 1, 2.8);
  front.rotation.x = -0.3;
  group.add(front);

  // Turret base
  const turretGroup = new THREE.Group();
  turretGroup.name = 'turret';

  const turretBaseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.8, 8);
  const turretMat = new THREE.MeshStandardMaterial({ color: 0x3a4a2a });
  const turretBase = new THREE.Mesh(turretBaseGeo, turretMat);
  turretBase.position.y = 0;
  turretGroup.add(turretBase);

  // Turret top
  const turretTopGeo = new THREE.BoxGeometry(2, 0.8, 2.2);
  const turretTop = new THREE.Mesh(turretTopGeo, turretMat);
  turretTop.position.y = 0.6;
  turretGroup.add(turretTop);

  // Cannon
  const cannonGeo = new THREE.CylinderGeometry(0.15, 0.2, 3, 8);
  const cannonMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
  const cannon = new THREE.Mesh(cannonGeo, cannonMat);
  cannon.rotation.x = Math.PI / 2;
  cannon.position.set(0, 0.5, 2);
  cannon.name = 'cannon';
  turretGroup.add(cannon);

  turretGroup.position.y = 1.6;
  group.add(turretGroup);

  // Tracks
  const trackGeo = new THREE.BoxGeometry(0.5, 0.8, 4.8);
  const trackMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const leftTrack = new THREE.Mesh(trackGeo, trackMat);
  leftTrack.position.set(-1.5, 0.4, 0);
  group.add(leftTrack);
  const rightTrack = new THREE.Mesh(trackGeo, trackMat);
  rightTrack.position.set(1.5, 0.4, 0);
  group.add(rightTrack);

  // Wheels on tracks
  const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 8);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  for (let i = -2; i <= 2; i++) {
    const leftWheel = new THREE.Mesh(wheelGeo, wheelMat);
    leftWheel.rotation.z = Math.PI / 2;
    leftWheel.position.set(-1.5, 0.35, i * 1);
    group.add(leftWheel);
    const rightWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rightWheel.rotation.z = Math.PI / 2;
    rightWheel.position.set(1.5, 0.35, i * 1);
    group.add(rightWheel);
  }

  group.userData.type = 'tank';
  group.userData.isVehicle = true;
  group.userData.hasTurret = true;
  group.userData.turretRotation = 0;
  group.userData.cannonReady = true;
  group.userData.lastCannonFire = 0;

  return group;
}

function createBoatMesh() {
  const group = new THREE.Group();

  // Hull
  const hullShape = new THREE.Shape();
  hullShape.moveTo(0, -2);
  hullShape.lineTo(1.2, -1.5);
  hullShape.lineTo(1.5, 0);
  hullShape.lineTo(1.2, 1.5);
  hullShape.lineTo(0, 2.5);
  hullShape.lineTo(-1.2, 1.5);
  hullShape.lineTo(-1.5, 0);
  hullShape.lineTo(-1.2, -1.5);
  hullShape.closePath();

  const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
    depth: 0.8,
    bevelEnabled: false
  });
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown wood
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.rotation.x = -Math.PI / 2;
  hull.position.y = 0.4;
  hull.castShadow = true;
  group.add(hull);

  // Deck
  const deckGeo = new THREE.BoxGeometry(2.5, 0.1, 4);
  const deckMat = new THREE.MeshStandardMaterial({ color: 0xA0522D });
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.position.y = 1.1;
  group.add(deck);

  // Cabin
  const cabinGeo = new THREE.BoxGeometry(1.5, 1, 1.5);
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0xf5f5dc });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, 1.7, -0.5);
  group.add(cabin);

  // Windshield
  const windshieldGeo = new THREE.BoxGeometry(1.3, 0.6, 0.1);
  const windshieldMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.5 });
  const windshield = new THREE.Mesh(windshieldGeo, windshieldMat);
  windshield.position.set(0, 1.9, 0.2);
  group.add(windshield);

  // Motor
  const motorGeo = new THREE.BoxGeometry(0.6, 0.8, 0.8);
  const motorMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const motor = new THREE.Mesh(motorGeo, motorMat);
  motor.position.set(0, 1.3, -1.8);
  group.add(motor);

  group.userData.type = 'boat';
  group.userData.isVehicle = true;
  group.userData.isWatercraft = true;
  group.userData.bobPhase = Math.random() * Math.PI * 2;

  return group;
}

function spawnVehicle(x, z, rotation = 0, type = 'jeep') {
  const id = `vehicle_${vehicleIdCounter++}`;
  let mesh;
  if (type === 'aircraft') {
    mesh = createAircraftMesh();
  } else if (type === 'motorcycle') {
    mesh = createMotorcycleMesh();
  } else if (type === 'tank') {
    mesh = createTankMesh();
  } else if (type === 'boat') {
    mesh = createBoatMesh();
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

// ==================== PARKED CARS ====================
// Non-driveable vehicles that provide cover on streets

const PARKED_CAR_TYPES = {
  sedan: { length: 4, width: 1.8, height: 1.4, colors: [0x1a1a2e, 0x4a0000, 0x003366, 0x2d2d2d, 0xf5f5dc] },
  truck: { length: 5, width: 2, height: 1.8, colors: [0x8b0000, 0x2f4f4f, 0x191970, 0x3c3c3c] },
  sports: { length: 4.2, width: 1.9, height: 1.1, colors: [0xff0000, 0xffd700, 0x00ff00, 0xff6600] }
};

const parkedCars = [];

function createParkedSedan(color) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.5 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

  // Main body
  const bodyGeo = new THREE.BoxGeometry(1.8, 0.8, 4);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.6;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Roof/cabin
  const cabGeo = new THREE.BoxGeometry(1.6, 0.6, 2);
  const cab = new THREE.Mesh(cabGeo, bodyMat);
  cab.position.set(0, 1.2, -0.2);
  cab.castShadow = false;
  group.add(cab);

  // Windshield
  const windshieldGeo = new THREE.BoxGeometry(1.5, 0.5, 0.1);
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, 1.1, 0.7);
  windshield.rotation.x = -0.3;
  group.add(windshield);

  // Rear window
  const rearGeo = new THREE.BoxGeometry(1.4, 0.4, 0.1);
  const rearWindow = new THREE.Mesh(rearGeo, glassMat);
  rearWindow.position.set(0, 1.1, -1.2);
  rearWindow.rotation.x = 0.3;
  group.add(rearWindow);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
  const wheelPositions = [
    { x: -0.8, z: 1.2 }, { x: 0.8, z: 1.2 },
    { x: -0.8, z: -1.2 }, { x: 0.8, z: -1.2 }
  ];
  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos.x, 0.35, pos.z);
    wheel.castShadow = false;
    group.add(wheel);
  });

  // Headlights
  const lightGeo = new THREE.BoxGeometry(0.25, 0.15, 0.1);
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffcc });
  [-0.6, 0.6].forEach(x => {
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(x, 0.5, 2);
    group.add(light);
  });

  // Taillights
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  [-0.6, 0.6].forEach(x => {
    const tail = new THREE.Mesh(lightGeo, tailMat);
    tail.position.set(x, 0.5, -2);
    group.add(tail);
  });

  group.userData.isParkedCar = true;
  group.userData.type = 'sedan';
  return group;
}

function createParkedTruck(color) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.5 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

  // Cab
  const cabGeo = new THREE.BoxGeometry(2, 1.2, 2);
  const cab = new THREE.Mesh(cabGeo, bodyMat);
  cab.position.set(0, 1, 1.2);
  cab.castShadow = false;
  cab.receiveShadow = true;
  group.add(cab);

  // Cab roof
  const roofGeo = new THREE.BoxGeometry(1.8, 0.5, 1.5);
  const roof = new THREE.Mesh(roofGeo, bodyMat);
  roof.position.set(0, 1.8, 1);
  roof.castShadow = false;
  group.add(roof);

  // Truck bed
  const bedGeo = new THREE.BoxGeometry(2, 0.8, 2.5);
  const bed = new THREE.Mesh(bedGeo, bodyMat);
  bed.position.set(0, 0.8, -1);
  bed.castShadow = false;
  group.add(bed);

  // Bed walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const wallGeo = new THREE.BoxGeometry(0.1, 0.6, 2.5);
  [-0.95, 0.95].forEach(x => {
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(x, 1.5, -1);
    group.add(wall);
  });
  const backWallGeo = new THREE.BoxGeometry(2, 0.6, 0.1);
  const backWall = new THREE.Mesh(backWallGeo, wallMat);
  backWall.position.set(0, 1.5, -2.2);
  group.add(backWall);

  // Windshield
  const windshieldGeo = new THREE.BoxGeometry(1.6, 0.6, 0.1);
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, 1.6, 2.1);
  windshield.rotation.x = -0.2;
  group.add(windshield);

  // Wheels (larger)
  const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 12);
  const wheelPositions = [
    { x: -0.9, z: 1.5 }, { x: 0.9, z: 1.5 },
    { x: -0.9, z: -1.5 }, { x: 0.9, z: -1.5 }
  ];
  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos.x, 0.45, pos.z);
    wheel.castShadow = false;
    group.add(wheel);
  });

  // Headlights
  const lightGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1);
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffcc });
  [-0.6, 0.6].forEach(x => {
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(x, 0.8, 2.2);
    group.add(light);
  });

  group.userData.isParkedCar = true;
  group.userData.type = 'truck';
  return group;
}

function createParkedSportsCar(color) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.2 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.7 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

  // Low, sleek body
  const bodyGeo = new THREE.BoxGeometry(1.9, 0.5, 4.2);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.4;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Sloped hood
  const hoodGeo = new THREE.BoxGeometry(1.7, 0.3, 1.5);
  const hood = new THREE.Mesh(hoodGeo, bodyMat);
  hood.position.set(0, 0.5, 1.2);
  hood.rotation.x = -0.1;
  hood.castShadow = false;
  group.add(hood);

  // Low cabin
  const cabGeo = new THREE.BoxGeometry(1.6, 0.45, 1.5);
  const cab = new THREE.Mesh(cabGeo, bodyMat);
  cab.position.set(0, 0.85, -0.3);
  cab.castShadow = false;
  group.add(cab);

  // Windshield (very angled)
  const windshieldGeo = new THREE.BoxGeometry(1.5, 0.4, 0.1);
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, 0.8, 0.45);
  windshield.rotation.x = -0.6;
  group.add(windshield);

  // Rear spoiler
  const spoilerGeo = new THREE.BoxGeometry(1.8, 0.1, 0.3);
  const spoiler = new THREE.Mesh(spoilerGeo, bodyMat);
  spoiler.position.set(0, 0.9, -2);
  group.add(spoiler);
  // Spoiler supports
  const supportGeo = new THREE.BoxGeometry(0.1, 0.3, 0.1);
  [-0.7, 0.7].forEach(x => {
    const support = new THREE.Mesh(supportGeo, bodyMat);
    support.position.set(x, 0.75, -2);
    group.add(support);
  });

  // Wheels (low profile)
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 16);
  const wheelPositions = [
    { x: -0.85, z: 1.3 }, { x: 0.85, z: 1.3 },
    { x: -0.85, z: -1.3 }, { x: 0.85, z: -1.3 }
  ];
  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos.x, 0.3, pos.z);
    wheel.castShadow = false;
    group.add(wheel);
  });

  // Headlights (sharp)
  const lightGeo = new THREE.BoxGeometry(0.4, 0.1, 0.1);
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.2 });
  [-0.5, 0.5].forEach(x => {
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(x, 0.35, 2.1);
    group.add(light);
  });

  group.userData.isParkedCar = true;
  group.userData.type = 'sports';
  return group;
}

function createParkedCar(type, color) {
  switch (type) {
    case 'truck': return createParkedTruck(color);
    case 'sports': return createParkedSportsCar(color);
    default: return createParkedSedan(color);
  }
}

function spawnParkedCar(x, z, rotation, type, seed) {
  const config = PARKED_CAR_TYPES[type];
  const colorIndex = Math.floor(seededRandom(seed) * config.colors.length);
  const color = config.colors[colorIndex];

  const car = createParkedCar(type, color);
  car.position.set(x, 0, z);
  car.rotation.y = rotation;

  // Create collision box for cover
  car.userData.collisionBox = {
    width: config.width,
    height: config.height,
    depth: config.length
  };

  parkedCars.push(car);
  return car;
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

// Supply drops
const supplyDrops = {};
let supplyDropIdCounter = 0;
const SUPPLY_DROP_COLLECT_DISTANCE = 4;

function createSupplyDropMesh() {
  const group = new THREE.Group();

  // Large military crate
  const crateGeo = new THREE.BoxGeometry(2, 1.5, 2);
  const crateMat = new THREE.MeshStandardMaterial({
    color: 0x4a6741, // Military green
    metalness: 0.3
  });
  const crate = new THREE.Mesh(crateGeo, crateMat);
  crate.position.y = 0.75;
  crate.castShadow = true;
  group.add(crate);

  // Yellow warning stripes
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });
  const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.1, 0.3), stripeMat);
  stripe1.position.set(0, 1.2, 0.5);
  group.add(stripe1);
  const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.1, 0.3), stripeMat);
  stripe2.position.set(0, 1.2, -0.5);
  group.add(stripe2);

  // Glowing beacon
  const beaconGeo = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.6
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = 2.5;
  beacon.name = 'beacon';
  group.add(beacon);

  // Glow sphere
  const glowGeo = new THREE.SphereGeometry(1.5, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.15
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.y = 0.75;
  glow.name = 'glow';
  group.add(glow);

  group.userData.type = 'supplyDrop';
  group.userData.isSupplyDrop = true;

  return group;
}

function generateSupplyDropContents() {
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

function spawnSupplyDrop(x, z, contents) {
  const id = `supply_${supplyDropIdCounter++}`;
  const mesh = createSupplyDropMesh();
  mesh.position.set(x, 0, z);
  mesh.userData.supplyDropId = id;

  scene.add(mesh);

  supplyDrops[id] = {
    id,
    mesh,
    x,
    z,
    contents: contents || generateSupplyDropContents(),
    collected: false
  };

  showPickupMessage('Supply Drop Incoming!', '#ffd700');
  return id;
}

function collectSupplyDrop(drop) {
  if (drop.collected) return;

  drop.collected = true;
  scene.remove(drop.mesh);

  for (const item of drop.contents) {
    if (item.type === 'weapon') {
      if (state.weapons[item.weapon]) {
        // Already have weapon - give ammo
        const ammoAmount = Math.floor(WEAPONS[item.weapon].maxAmmo / 2);
        state.ammoReserve += ammoAmount;
        showPickupMessage(`+${ammoAmount} Ammo`, '#f39c12');
      } else {
        state.weapons[item.weapon] = true;
        showPickupMessage(`Acquired ${WEAPONS[item.weapon].name}!`, '#9b59b6');
        updateWeaponSlots();
      }
    } else if (item.type === 'ammo') {
      state.ammoReserve += item.amount;
      updateAmmoDisplay();
      showPickupMessage(`+${item.amount} Ammo`, '#f39c12');
    } else if (item.type === 'health') {
      state.health = Math.min(100, state.health + item.amount);
      updateHealth();
      showPickupMessage(`+${item.amount} HP`, '#27ae60');
    }
  }

  playSound('pickup');
  delete supplyDrops[drop.id];
}

function updateSupplyDrops() {
  const now = Date.now();
  const playerPos = camera.position;

  for (const id in supplyDrops) {
    const drop = supplyDrops[id];
    if (drop.collected) continue;

    // Animate (bob and pulse beacon)
    drop.mesh.position.y = Math.sin(now * 0.002) * 0.1;
    drop.mesh.rotation.y += 0.005;

    const beacon = drop.mesh.getObjectByName('beacon');
    if (beacon) {
      beacon.material.opacity = 0.4 + Math.sin(now * 0.008) * 0.3;
    }

    const glow = drop.mesh.getObjectByName('glow');
    if (glow) {
      glow.material.opacity = 0.1 + Math.sin(now * 0.005) * 0.08;
    }

    // Check collection distance
    const dx = drop.x - playerPos.x;
    const dz = drop.z - playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < SUPPLY_DROP_COLLECT_DISTANCE && state.isPlaying && !state.isDead) {
      collectSupplyDrop(drop);
    }
  }
}

// ==================== KILL STREAK SYSTEM ====================

function showStreakNotification(streakName, color, isReady = true) {
  const notification = document.createElement('div');
  notification.className = 'streak-notification';
  notification.innerHTML = isReady
    ? `<span class="streak-icon">★</span> ${streakName} Ready!`
    : `<span class="streak-icon">★</span> ${streakName}`;
  notification.style.color = color;
  document.getElementById('hud').appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

function checkKillStreakRewards() {
  const streak = state.killStreak;

  if (streak === KILLSTREAK_REWARDS.uav.kills) {
    activateUAV();
    showStreakNotification('UAV', KILLSTREAK_REWARDS.uav.color);
  } else if (streak === KILLSTREAK_REWARDS.airstrike.kills) {
    state.pendingAirstrike = true;
    showStreakNotification('Airstrike - Click to Call In', KILLSTREAK_REWARDS.airstrike.color);
  } else if (streak === KILLSTREAK_REWARDS.supplyDrop.kills) {
    callKillStreakSupplyDrop();
    showStreakNotification('Supply Drop Incoming!', KILLSTREAK_REWARDS.supplyDrop.color);
  }
}

function activateUAV() {
  state.uavActive = true;
  state.uavEndTime = Date.now() + KILLSTREAK_REWARDS.uav.duration;
  console.log('UAV activated - enemies visible on minimap');
}

function callKillStreakSupplyDrop() {
  // Spawn supply drop near player
  const angle = Math.random() * Math.PI * 2;
  const distance = 15 + Math.random() * 10;
  const x = camera.position.x + Math.cos(angle) * distance;
  const z = camera.position.z + Math.sin(angle) * distance;

  // Emit to server for multiplayer sync
  socket.emit('supplyDrop', { x, z });
  spawnSupplyDrop(x, z);
}

function callAirstrike(targetX, targetZ) {
  if (!state.pendingAirstrike) return;

  state.pendingAirstrike = false;
  console.log(`Calling airstrike at (${targetX.toFixed(0)}, ${targetZ.toFixed(0)})`);

  // Emit to server to damage enemies
  socket.emit('airstrike', { x: targetX, z: targetZ });

  // Create visual effect
  createAirstrikeEffect(targetX, targetZ);
  showStreakNotification('Airstrike Deployed!', KILLSTREAK_REWARDS.airstrike.color, false);
}

function createAirstrikeEffect(x, z) {
  // Create multiple explosions
  const AIRSTRIKE_RADIUS = 15;
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      const offsetX = (Math.random() - 0.5) * AIRSTRIKE_RADIUS * 2;
      const offsetZ = (Math.random() - 0.5) * AIRSTRIKE_RADIUS * 2;
      for (let j = 0; j < 5; j++) {
        createHitEffect(new THREE.Vector3(x + offsetX, 1 + Math.random() * 3, z + offsetZ), 0xff4400);
      }
      playSound('explosion');
    }, i * 100);
  }
}

function createHealthPackMesh() {
  const group = new THREE.Group();

  // White box with red cross
  const boxGeo = new THREE.BoxGeometry(1, 0.6, 1);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.y = 0.5;
  box.castShadow = false;
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
  box.castShadow = false;
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
  blue: 0x3498db,
  green: 0x27ae60,
  yellow: 0xf1c40f
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

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);
updateLoadingProgress(15, 'Setting up renderer...');

// ==================== GRAPHICS SETTINGS ====================
const GRAPHICS_PRESETS = {
  low: {
    pixelRatio: 1.0,
    shadowMapSize: 0,  // 0 = shadows disabled
    shadowType: null,
    renderDistance: 1,
    description: 'Best performance, minimal visuals'
  },
  medium: {
    pixelRatio: 1.0,
    shadowMapSize: 512,
    shadowType: THREE.BasicShadowMap,
    renderDistance: 2,
    description: 'Balanced performance and visuals'
  },
  high: {
    pixelRatio: Math.min(window.devicePixelRatio, 1.5),
    shadowMapSize: 1024,
    shadowType: THREE.PCFShadowMap,
    renderDistance: 2,
    description: 'Good visuals, moderate performance'
  },
  ultra: {
    pixelRatio: window.devicePixelRatio,
    shadowMapSize: 2048,
    shadowType: THREE.PCFSoftShadowMap,
    renderDistance: 3,
    description: 'Best visuals, requires powerful GPU'
  }
};

let currentGraphicsQuality = localStorage.getItem('graphicsQuality') || 'high';

function applyGraphicsSettings(quality, isInitialLoad = false) {
  const preset = GRAPHICS_PRESETS[quality];
  if (!preset) return;

  currentGraphicsQuality = quality;
  localStorage.setItem('graphicsQuality', quality);

  // Apply pixel ratio
  renderer.setPixelRatio(preset.pixelRatio);

  // Apply shadow settings
  if (preset.shadowMapSize === 0) {
    renderer.shadowMap.enabled = false;
  } else {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = preset.shadowType;
  }

  // Apply render distance (skip on initial load since RENDER_DISTANCE isn't defined yet)
  if (!isInitialLoad && typeof RENDER_DISTANCE !== 'undefined') {
    RENDER_DISTANCE = preset.renderDistance;
  }

  // Update UI
  document.querySelectorAll('.graphics-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.quality === quality);
  });
  const descEl = document.getElementById('graphics-desc');
  if (descEl) descEl.textContent = preset.description;
}

// Apply saved settings on load (renderer settings only, RENDER_DISTANCE set later)
applyGraphicsSettings(currentGraphicsQuality, true);

// Get shadow map size for current quality
function getCurrentShadowMapSize() {
  return GRAPHICS_PRESETS[currentGraphicsQuality].shadowMapSize || 1024;
}

updateLoadingProgress(25, 'Creating sky and lighting...');

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
const shadowSize = getCurrentShadowMapSize();
directionalLight.shadow.mapSize.width = shadowSize;
directionalLight.shadow.mapSize.height = shadowSize;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 200;  // Reduced from 500
directionalLight.shadow.camera.left = -60;  // Reduced from 100
directionalLight.shadow.camera.right = 60;
directionalLight.shadow.camera.top = 60;
directionalLight.shadow.camera.bottom = -60;
scene.add(directionalLight);

// Hemisphere light for more natural outdoor lighting
const hemiLight = new THREE.HemisphereLight(0x88bbff, 0x446622, 0.5);
scene.add(hemiLight);

// ==================== FLASHLIGHT ====================

// Create flashlight as a SpotLight attached to camera
const flashlight = new THREE.SpotLight(0xffffee, 0, 80, Math.PI / 8, 0.4, 1.5);
flashlight.position.set(0, 0, 0);
flashlight.castShadow = false; // Disabled for performance

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

  // Update streetlights based on time of day
  updateStreetlights(dayNight.time);

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

updateLoadingProgress(40, 'Preparing terrain system...');

// ==================== INFINITE TERRAIN SYSTEM ====================
const CHUNK_SIZE = 64;
let RENDER_DISTANCE = GRAPHICS_PRESETS[currentGraphicsQuality]?.renderDistance || 2; // adjustable via graphics settings
const chunks = {};
const collidableObjects = [];

// Player collision radius
const PLAYER_RADIUS = 0.5;

// Check if a position collides with buildings
function checkBuildingCollision(newX, newZ) {
  for (const obj of collidableObjects) {
    if (!obj.userData || !obj.userData.isBuilding) continue;

    const bx = obj.userData.worldX;
    const bz = obj.userData.worldZ;
    const halfW = obj.userData.width / 2;
    const halfD = obj.userData.depth / 2;
    const wallThickness = 0.5; // Collision thickness of walls

    // Check if player is in the wall zones (not interior)
    const inBuildingX = newX > bx - halfW - PLAYER_RADIUS && newX < bx + halfW + PLAYER_RADIUS;
    const inBuildingZ = newZ > bz - halfD - PLAYER_RADIUS && newZ < bz + halfD + PLAYER_RADIUS;

    if (!inBuildingX || !inBuildingZ) continue; // Not near this building

    // Check if in the interior (not in walls) - allow free movement inside
    const inInteriorX = newX > bx - halfW + wallThickness && newX < bx + halfW - wallThickness;
    const inInteriorZ = newZ > bz - halfD + wallThickness && newZ < bz + halfD - wallThickness;

    if (inInteriorX && inInteriorZ) {
      continue; // Inside the building interior - no collision
    }

    // Player is in the wall zone - check for doorway
    const doorWidth = 2;
    const doorX = bx; // Door is centered
    const doorZ = bz + halfD; // Door is at front

    // Check if at the doorway opening
    const atDoorX = Math.abs(newX - doorX) < doorWidth / 2 + PLAYER_RADIUS;
    const atDoorZ = Math.abs(newZ - doorZ) < 1.5;

    if (atDoorX && atDoorZ) {
      // At doorway - check if any door here is open
      let doorOpen = false;
      for (const id in doors) {
        const door = doors[id];
        const dx = doorX - door.x;
        const dz = doorZ - door.z;
        if (Math.abs(dx) < 2 && Math.abs(dz) < 2 && door.isOpen) {
          doorOpen = true;
          break;
        }
      }
      if (doorOpen) {
        continue; // Door is open, allow passage
      }
    }

    // Collision with wall or closed door
    return true;
  }
  return false; // No collision
}

// Shared geometries for performance (created once, reused across all chunks)
const sharedGroundGeometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE);
const sharedStreetHGeometry = new THREE.PlaneGeometry(CHUNK_SIZE, 8); // streetWidth = 8
const sharedStreetVGeometry = new THREE.PlaneGeometry(8, CHUNK_SIZE);
const sharedLineHGeometry = new THREE.PlaneGeometry(CHUNK_SIZE, 0.2);
const sharedLineVGeometry = new THREE.PlaneGeometry(0.2, CHUNK_SIZE);
const sharedSidewalkHGeometry = new THREE.PlaneGeometry(CHUNK_SIZE, 1.5); // sidewalkWidth = 1.5
const sharedSidewalkVGeometry = new THREE.PlaneGeometry(1.5, CHUNK_SIZE);

// Shared materials for performance (using Lambert for speed)
const sharedStreetMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
const sharedLineMaterial = new THREE.MeshLambertMaterial({ color: 0xcccc00 });
const sharedSidewalkMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });

// Pre-merged chunk geometries for fewer draw calls (9 meshes → 4 meshes per chunk)
// All positions are relative to chunk center (CHUNK_SIZE/2, 0, CHUNK_SIZE/2)
const streetWidth = 8;
const sidewalkWidth = 1.5;

// Helper to clone, rotate, and translate a plane geometry
function prepareChunkGeometry(geo, yOffset, xOffset = 0, zOffset = 0) {
  const clone = geo.clone();
  clone.rotateX(-Math.PI / 2);
  clone.translate(xOffset, yOffset, zOffset);
  return clone;
}

// Merge horizontal + vertical streets into one geometry
const mergedStreetGeometry = mergeGeometries([
  prepareChunkGeometry(sharedStreetHGeometry, 0.05),
  prepareChunkGeometry(sharedStreetVGeometry, 0.05)
]);

// Merge horizontal + vertical center lines into one geometry
const mergedLineGeometry = mergeGeometries([
  prepareChunkGeometry(sharedLineHGeometry, 0.06),
  prepareChunkGeometry(sharedLineVGeometry, 0.06)
]);

// Merge all 4 sidewalks into one geometry
const mergedSidewalkGeometry = mergeGeometries([
  prepareChunkGeometry(sharedSidewalkHGeometry, 0.07, 0, -streetWidth / 2 - sidewalkWidth / 2),
  prepareChunkGeometry(sharedSidewalkHGeometry, 0.07, 0, streetWidth / 2 + sidewalkWidth / 2),
  prepareChunkGeometry(sharedSidewalkVGeometry, 0.07, -streetWidth / 2 - sidewalkWidth / 2, 0),
  prepareChunkGeometry(sharedSidewalkVGeometry, 0.07, streetWidth / 2 + sidewalkWidth / 2, 0)
]);

// Shared geometries and materials for instanced objects
const sharedTreeTrunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2.5, 6); // Simplified, fewer segments
const sharedTreeFoliageGeometry = new THREE.ConeGeometry(2.5, 5, 6); // Simplified
const sharedRockGeometry = new THREE.DodecahedronGeometry(1, 0);
const sharedLightPoleGeometry = new THREE.CylinderGeometry(0.15, 0.2, 6, 6);
const sharedLightBulbGeometry = new THREE.SphereGeometry(0.3, 6, 6);

const sharedTreeTrunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
const sharedTreeFoliageMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
const sharedRockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
const sharedLightPoleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
const sharedLightBulbMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa }); // Basic for emissive look

// Seeded random for consistent terrain generation
function seededRandom(seed) {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function getChunkSeed(cx, cz) {
  return cx * 73856093 ^ cz * 19349663;
}

// Ground material (shared, using Lambert for performance)
const groundMaterial = new THREE.MeshLambertMaterial({
  color: 0x3d7c40
});

// Building colors
const BUILDING_COLORS = [
  // Grays
  0x808080, 0x606060, 0x707070, 0x909090,
  // Brick reds
  0x8B4513, 0xA0522D, 0x6B3A2A, 0x8B0000,
  // Tans/Beiges
  0xD2B48C, 0xC4A46B, 0xBDB76B, 0xDEB887,
  // Creams/Whites
  0xFAF0E6, 0xF5F5DC, 0xFFEFD5, 0xE8E4C9,
  // Blues
  0x4682B4, 0x5F9EA0, 0x6B8E9F, 0x708090,
  // Greens
  0x556B2F, 0x6B8E23, 0x8FBC8F, 0x5D7D5D,
  // Yellows
  0xDAA520, 0xF0E68C, 0xBDB76B, 0xEED9A4,
  // Browns
  0x8B7355, 0x7B6652, 0x6B5344, 0x5C4033
];

// Streetlight system (uses InstancedMesh with shared material for day/night toggle)
const STREETLIGHT_SPACING = 32; // Distance between streetlights (increased for performance)
let streetlightsOn = false; // Track current state to avoid unnecessary material updates

function updateStreetlights(timeOfDay) {
  // Turn on lights during night hours (0.75 = dusk to 0.25 = dawn)
  const shouldBeOn = timeOfDay > 0.7 || timeOfDay < 0.25;

  if (streetlightsOn !== shouldBeOn) {
    streetlightsOn = shouldBeOn;
    // Toggle shared bulb material color for all InstancedMesh streetlights
    if (shouldBeOn) {
      sharedLightBulbMaterial.color.setHex(0xffffaa); // Bright yellow when on
    } else {
      sharedLightBulbMaterial.color.setHex(0x666666); // Dim gray when off
    }
  }
}

// Door system
const doors = {};
let doorIdCounter = 0;
const DOOR_INTERACT_DISTANCE = 3;
const DOOR_OPEN_ANGLE = Math.PI / 2; // 90 degrees
const DOOR_SPEED = 4; // Radians per second

function createDoor(x, z, rotation, buildingGroup) {
  const id = `door_${doorIdCounter++}`;

  // Door pivot (positioned at hinge edge)
  const pivot = new THREE.Group();

  // Door mesh
  const doorGeo = new THREE.BoxGeometry(1.9, 2.9, 0.1);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
  const doorMesh = new THREE.Mesh(doorGeo, doorMat);
  doorMesh.position.x = 0.95; // Offset so it rotates from edge
  doorMesh.position.y = 1.45;
  doorMesh.castShadow = false;
  pivot.add(doorMesh);

  // Door handle
  const handleGeo = new THREE.BoxGeometry(0.1, 0.3, 0.15);
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xccaa00, metalness: 0.8 });
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.set(1.6, 1.3, 0.1);
  pivot.add(handle);

  // Pivot rotation (position is set by caller)
  pivot.rotation.y = rotation;

  doors[id] = {
    id,
    pivot,
    x: x, // World position
    z: z,
    isOpen: false,
    targetAngle: 0,
    currentAngle: 0,
    baseRotation: rotation
  };

  return pivot;
}

function getNearestDoor(position) {
  let nearest = null;
  let nearestDist = DOOR_INTERACT_DISTANCE;

  for (const id in doors) {
    const door = doors[id];
    const dx = position.x - door.x;
    const dz = position.z - door.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = door;
    }
  }

  return nearest;
}

function toggleDoor(door) {
  if (!door) return;

  door.isOpen = !door.isOpen;
  door.targetAngle = door.isOpen ? DOOR_OPEN_ANGLE : 0;

  playSound('footstep'); // Door sound
}

function updateDoors(delta) {
  for (const id in doors) {
    const door = doors[id];

    // Animate door toward target angle
    if (Math.abs(door.currentAngle - door.targetAngle) > 0.01) {
      const direction = door.targetAngle > door.currentAngle ? 1 : -1;
      door.currentAngle += direction * DOOR_SPEED * delta;

      // Clamp to target
      if (direction > 0 && door.currentAngle > door.targetAngle) {
        door.currentAngle = door.targetAngle;
      } else if (direction < 0 && door.currentAngle < door.targetAngle) {
        door.currentAngle = door.targetAngle;
      }

      door.pivot.rotation.y = door.baseRotation + door.currentAngle;
    }
  }
}

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
  crate.castShadow = false;
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

  // Door (at front of building, centered in doorway)
  const doorWorldX = x;
  const doorWorldZ = z + depth / 2;
  const door = createDoor(doorWorldX, doorWorldZ, 0, group);
  // Position door pivot at left edge of doorway (-1), at the front wall
  door.position.set(-doorWidth / 2, 0, depth / 2 - wallThickness / 2);
  group.add(door);

  // Window dimensions
  const windowWidth = 1.5;
  const windowHeight = 1.2;
  const windowBottom = 1.2; // Height from floor
  const windowTop = windowBottom + windowHeight;

  // Glass material (semi-transparent blue tint)
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  });

  // Left wall with window
  const leftWallX = -width / 2 + wallThickness / 2;

  // Left wall - below window
  const leftBelowGeo = new THREE.BoxGeometry(wallThickness, windowBottom, depth);
  const leftBelow = new THREE.Mesh(leftBelowGeo, wallMat);
  leftBelow.position.set(leftWallX, windowBottom / 2, 0);
  leftBelow.castShadow = true;
  group.add(leftBelow);

  // Left wall - above window
  const aboveWindowHeight = height - windowTop;
  const leftAboveGeo = new THREE.BoxGeometry(wallThickness, aboveWindowHeight, depth);
  const leftAbove = new THREE.Mesh(leftAboveGeo, wallMat);
  leftAbove.position.set(leftWallX, windowTop + aboveWindowHeight / 2, 0);
  leftAbove.castShadow = true;
  group.add(leftAbove);

  // Left wall - front of window
  const sideOfWindow = (depth - windowWidth) / 2;
  const leftFrontGeo = new THREE.BoxGeometry(wallThickness, windowHeight, sideOfWindow);
  const leftFront = new THREE.Mesh(leftFrontGeo, wallMat);
  leftFront.position.set(leftWallX, windowBottom + windowHeight / 2, depth / 2 - sideOfWindow / 2);
  leftFront.castShadow = true;
  group.add(leftFront);

  // Left wall - back of window
  const leftBackGeo = new THREE.BoxGeometry(wallThickness, windowHeight, sideOfWindow);
  const leftBack = new THREE.Mesh(leftBackGeo, wallMat);
  leftBack.position.set(leftWallX, windowBottom + windowHeight / 2, -depth / 2 + sideOfWindow / 2);
  leftBack.castShadow = true;
  group.add(leftBack);

  // Left window glass
  const leftGlassGeo = new THREE.BoxGeometry(wallThickness * 0.5, windowHeight, windowWidth);
  const leftGlass = new THREE.Mesh(leftGlassGeo, glassMat);
  leftGlass.position.set(leftWallX, windowBottom + windowHeight / 2, 0);
  group.add(leftGlass);

  // Right wall with window
  const rightWallX = width / 2 - wallThickness / 2;

  // Right wall - below window
  const rightBelowGeo = new THREE.BoxGeometry(wallThickness, windowBottom, depth);
  const rightBelow = new THREE.Mesh(rightBelowGeo, wallMat);
  rightBelow.position.set(rightWallX, windowBottom / 2, 0);
  rightBelow.castShadow = true;
  group.add(rightBelow);

  // Right wall - above window
  const rightAboveGeo = new THREE.BoxGeometry(wallThickness, aboveWindowHeight, depth);
  const rightAbove = new THREE.Mesh(rightAboveGeo, wallMat);
  rightAbove.position.set(rightWallX, windowTop + aboveWindowHeight / 2, 0);
  rightAbove.castShadow = true;
  group.add(rightAbove);

  // Right wall - front of window
  const rightFrontGeo = new THREE.BoxGeometry(wallThickness, windowHeight, sideOfWindow);
  const rightFront = new THREE.Mesh(rightFrontGeo, wallMat);
  rightFront.position.set(rightWallX, windowBottom + windowHeight / 2, depth / 2 - sideOfWindow / 2);
  rightFront.castShadow = true;
  group.add(rightFront);

  // Right wall - back of window
  const rightBackGeo = new THREE.BoxGeometry(wallThickness, windowHeight, sideOfWindow);
  const rightBack = new THREE.Mesh(rightBackGeo, wallMat);
  rightBack.position.set(rightWallX, windowBottom + windowHeight / 2, -depth / 2 + sideOfWindow / 2);
  rightBack.castShadow = true;
  group.add(rightBack);

  // Right window glass
  const rightGlassGeo = new THREE.BoxGeometry(wallThickness * 0.5, windowHeight, windowWidth);
  const rightGlass = new THREE.Mesh(rightGlassGeo, glassMat);
  rightGlass.position.set(rightWallX, windowBottom + windowHeight / 2, 0);
  group.add(rightGlass);

  // Roof
  const roofGeo = new THREE.BoxGeometry(width, wallThickness, depth);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = height;
  roof.castShadow = false;
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

  // Store building bounds for collision detection
  group.userData.isBuilding = true;
  group.userData.width = width;
  group.userData.depth = depth;
  group.userData.height = height;
  group.userData.worldX = x;
  group.userData.worldZ = z;

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

  // Create ground plane for this chunk (using shared geometry)
  const ground = new THREE.Mesh(sharedGroundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(worldX + CHUNK_SIZE / 2, 0, worldZ + CHUNK_SIZE / 2);
  ground.receiveShadow = true;
  chunk.add(ground);
  chunk.userData.objects.push(ground);

  // Skip grid helper for performance (commented out)
  // const gridHelper = new THREE.GridHelper(CHUNK_SIZE, 8, 0x2d6c30, 0x2d6c30);

  // Streets, lines, and sidewalks using pre-merged geometries (8 meshes → 3 meshes)
  const chunkCenter = { x: worldX + CHUNK_SIZE / 2, z: worldZ + CHUNK_SIZE / 2 };

  // Merged streets (horizontal + vertical)
  const streets = new THREE.Mesh(mergedStreetGeometry, sharedStreetMaterial);
  streets.position.set(chunkCenter.x, 0, chunkCenter.z);
  streets.receiveShadow = true;
  chunk.add(streets);

  // Merged center lines (horizontal + vertical)
  const lines = new THREE.Mesh(mergedLineGeometry, sharedLineMaterial);
  lines.position.set(chunkCenter.x, 0, chunkCenter.z);
  chunk.add(lines);

  // Merged sidewalks (all 4)
  const sidewalks = new THREE.Mesh(mergedSidewalkGeometry, sharedSidewalkMaterial);
  sidewalks.position.set(chunkCenter.x, 0, chunkCenter.z);
  chunk.add(sidewalks);

  // Add streetlights using InstancedMesh (simplified for performance)
  const lightOffset = streetWidth / 2 + sidewalkWidth + 0.5;

  // Count streetlights first
  const lightPositions = [];
  for (let lx = STREETLIGHT_SPACING / 2; lx < CHUNK_SIZE; lx += STREETLIGHT_SPACING) {
    if (Math.abs(lx - CHUNK_SIZE / 2) < streetWidth / 2 + 2) continue;
    lightPositions.push({ x: worldX + lx, z: worldZ + CHUNK_SIZE / 2 - lightOffset });
  }
  for (let lz = STREETLIGHT_SPACING / 2; lz < CHUNK_SIZE; lz += STREETLIGHT_SPACING) {
    if (Math.abs(lz - CHUNK_SIZE / 2) < streetWidth / 2 + 2) continue;
    lightPositions.push({ x: worldX + CHUNK_SIZE / 2 - lightOffset, z: worldZ + lz });
  }

  if (lightPositions.length > 0) {
    const poleInstances = new THREE.InstancedMesh(sharedLightPoleGeometry, sharedLightPoleMaterial, lightPositions.length);
    const bulbInstances = new THREE.InstancedMesh(sharedLightBulbGeometry, sharedLightBulbMaterial, lightPositions.length);

    const tempMatrix = new THREE.Matrix4();

    for (let i = 0; i < lightPositions.length; i++) {
      const pos = lightPositions[i];
      // Pole
      tempMatrix.makeTranslation(pos.x, 3, pos.z);
      poleInstances.setMatrixAt(i, tempMatrix);
      // Bulb at top
      tempMatrix.makeTranslation(pos.x, 6, pos.z);
      bulbInstances.setMatrixAt(i, tempMatrix);
    }

    poleInstances.instanceMatrix.needsUpdate = true;
    bulbInstances.instanceMatrix.needsUpdate = true;
    chunk.add(poleInstances);
    chunk.add(bulbInstances);
  }

  // Generate buildings FIRST so we can avoid placing cars that overlap
  // Quadrants: NW (0), NE (1), SW (2), SE (3)
  const quadrantSize = (CHUNK_SIZE - streetWidth - sidewalkWidth * 2) / 2;
  const streetBuffer = streetWidth / 2 + sidewalkWidth + 2; // Keep buildings away from street
  const chunkBuildings = []; // Store building bounds for car collision check

  // Place 1 building per quadrant (4 total potential, some may be skipped)
  for (let q = 0; q < 4; q++) {
    const bSeed = seed + q * 1000;

    // 70% chance to have a building in each quadrant
    if (seededRandom(bSeed) > 0.7) continue;

    // Calculate quadrant offsets
    const qx = (q % 2 === 0) ? 0 : 1; // 0 = west, 1 = east
    const qz = (q < 2) ? 0 : 1; // 0 = north, 1 = south

    // Random position within quadrant
    const quadrantStartX = worldX + (qx === 0 ? 4 : CHUNK_SIZE / 2 + streetBuffer);
    const quadrantStartZ = worldZ + (qz === 0 ? 4 : CHUNK_SIZE / 2 + streetBuffer);
    const quadrantEndX = worldX + (qx === 0 ? CHUNK_SIZE / 2 - streetBuffer : CHUNK_SIZE - 4);
    const quadrantEndZ = worldZ + (qz === 0 ? CHUNK_SIZE / 2 - streetBuffer : CHUNK_SIZE - 4);

    // Random building type for variety
    const buildingType = seededRandom(bSeed + 2);
    let width, height, depth;

    if (buildingType < 0.2) {
      // Small shack (20% chance)
      width = 5 + seededRandom(bSeed + 3) * 3; // 5-8 units wide
      height = 3 + seededRandom(bSeed + 4) * 2; // 3-5 units tall
      depth = 5 + seededRandom(bSeed + 5) * 3; // 5-8 units deep
    } else if (buildingType < 0.5) {
      // Standard house (30% chance)
      width = 8 + seededRandom(bSeed + 3) * 4; // 8-12 units wide
      height = 4 + seededRandom(bSeed + 4) * 3; // 4-7 units tall
      depth = 8 + seededRandom(bSeed + 5) * 4; // 8-12 units deep
    } else if (buildingType < 0.75) {
      // Large house (25% chance)
      width = 10 + seededRandom(bSeed + 3) * 6; // 10-16 units wide
      height = 5 + seededRandom(bSeed + 4) * 4; // 5-9 units tall
      depth = 10 + seededRandom(bSeed + 5) * 6; // 10-16 units deep
    } else if (buildingType < 0.9) {
      // Tall narrow building (15% chance)
      width = 6 + seededRandom(bSeed + 3) * 4; // 6-10 units wide
      height = 8 + seededRandom(bSeed + 4) * 6; // 8-14 units tall (2-3 stories)
      depth = 6 + seededRandom(bSeed + 5) * 4; // 6-10 units deep
    } else {
      // Wide warehouse (10% chance)
      width = 14 + seededRandom(bSeed + 3) * 6; // 14-20 units wide
      height = 5 + seededRandom(bSeed + 4) * 2; // 5-7 units tall
      depth = 12 + seededRandom(bSeed + 5) * 6; // 12-18 units deep
    }

    // Position building in quadrant (centered)
    const bx = quadrantStartX + (quadrantEndX - quadrantStartX - width) * seededRandom(bSeed + 10) + width / 2;
    const bz = quadrantStartZ + (quadrantEndZ - quadrantStartZ - depth) * seededRandom(bSeed + 11) + depth / 2;

    // Store building bounds for car collision check
    chunkBuildings.push({ x: bx, z: bz, width, depth });

    // Random color
    const colorIndex = Math.floor(seededRandom(bSeed + 7) * BUILDING_COLORS.length);
    const color = BUILDING_COLORS[colorIndex];

    // Create building with interior and loot
    const building = createBuildingWithInterior(bx, bz, width, height, depth, color, bSeed, chunk);
    chunk.add(building);
    chunk.userData.objects.push(building);
    collidableObjects.push(building);
  }

  // Helper to check if a car position overlaps with any building
  function carOverlapsBuilding(carX, carZ, carRadius = 3) {
    for (const b of chunkBuildings) {
      const halfW = b.width / 2 + carRadius;
      const halfD = b.depth / 2 + carRadius;
      if (carX > b.x - halfW && carX < b.x + halfW &&
          carZ > b.z - halfD && carZ < b.z + halfD) {
        return true;
      }
    }
    return false;
  }

  // Add parked cars along streets (AFTER buildings so we can check for overlap)
  const parkingOffset = streetWidth / 2 - 1.5; // Park on the edge of street
  const carSpacing = 16; // Space between potential car spots (increased for performance)
  const carTypes = ['sedan', 'sedan', 'sedan', 'truck', 'sports']; // Weighted distribution

  // Parked cars along horizontal street
  for (let px = carSpacing; px < CHUNK_SIZE - carSpacing; px += carSpacing) {
    // Skip intersection area
    if (Math.abs(px - CHUNK_SIZE / 2) < streetWidth / 2 + 3) continue;

    const carSeed = seed + 5000 + Math.floor(px);

    // 20% chance for a car on each side (reduced from 40% for performance)
    if (seededRandom(carSeed) < 0.2) {
      const carType = carTypes[Math.floor(seededRandom(carSeed + 1) * carTypes.length)];
      const carX = worldX + px;
      const carZ = worldZ + CHUNK_SIZE / 2 - parkingOffset;
      if (!carOverlapsBuilding(carX, carZ)) {
        const car = spawnParkedCar(carX, carZ, Math.PI / 2, carType, carSeed + 2);
        chunk.add(car);
        chunk.userData.objects.push(car);
        collidableObjects.push(car);
      }
    }

    if (seededRandom(carSeed + 10) < 0.2) {
      const carType = carTypes[Math.floor(seededRandom(carSeed + 11) * carTypes.length)];
      const carX = worldX + px;
      const carZ = worldZ + CHUNK_SIZE / 2 + parkingOffset;
      if (!carOverlapsBuilding(carX, carZ)) {
        const car = spawnParkedCar(carX, carZ, -Math.PI / 2, carType, carSeed + 12);
        chunk.add(car);
        chunk.userData.objects.push(car);
        collidableObjects.push(car);
      }
    }
  }

  // Parked cars along vertical street
  for (let pz = carSpacing; pz < CHUNK_SIZE - carSpacing; pz += carSpacing) {
    // Skip intersection area
    if (Math.abs(pz - CHUNK_SIZE / 2) < streetWidth / 2 + 3) continue;

    const carSeed = seed + 6000 + Math.floor(pz);

    // 20% chance for a car on each side (reduced from 40% for performance)
    if (seededRandom(carSeed) < 0.2) {
      const carType = carTypes[Math.floor(seededRandom(carSeed + 1) * carTypes.length)];
      const carX = worldX + CHUNK_SIZE / 2 - parkingOffset;
      const carZ = worldZ + pz;
      if (!carOverlapsBuilding(carX, carZ)) {
        const car = spawnParkedCar(carX, carZ, 0, carType, carSeed + 2);
        chunk.add(car);
        chunk.userData.objects.push(car);
        collidableObjects.push(car);
      }
    }

    if (seededRandom(carSeed + 10) < 0.2) {
      const carType = carTypes[Math.floor(seededRandom(carSeed + 11) * carTypes.length)];
      const carX = worldX + CHUNK_SIZE / 2 + parkingOffset;
      const carZ = worldZ + pz;
      if (!carOverlapsBuilding(carX, carZ)) {
        const car = spawnParkedCar(carX, carZ, Math.PI, carType, carSeed + 12);
        chunk.add(car);
        chunk.userData.objects.push(car);
        collidableObjects.push(car);
      }
    }
  }

  // Add trees using InstancedMesh (much faster than individual meshes)
  const numTrees = Math.floor(seededRandom(seed + 500) * 5) + 2;

  if (numTrees > 0) {
    const treeTrunkInstances = new THREE.InstancedMesh(sharedTreeTrunkGeometry, sharedTreeTrunkMaterial, numTrees);
    const treeFoliageInstances = new THREE.InstancedMesh(sharedTreeFoliageGeometry, sharedTreeFoliageMaterial, numTrees);
    treeTrunkInstances.castShadow = true;
    treeFoliageInstances.castShadow = false;

    const tempMatrix = new THREE.Matrix4();

    for (let i = 0; i < numTrees; i++) {
      const tSeed = seed + 2000 + i * 100;
      const tx = worldX + 4 + seededRandom(tSeed) * (CHUNK_SIZE - 8);
      const tz = worldZ + 4 + seededRandom(tSeed + 1) * (CHUNK_SIZE - 8);
      const scale = 0.8 + seededRandom(tSeed + 2) * 0.6; // Vary size slightly

      // Trunk instance
      tempMatrix.makeScale(scale, scale, scale);
      tempMatrix.setPosition(tx, 1.25 * scale, tz);
      treeTrunkInstances.setMatrixAt(i, tempMatrix);

      // Foliage instance
      tempMatrix.makeScale(scale, scale, scale);
      tempMatrix.setPosition(tx, 4 * scale, tz);
      treeFoliageInstances.setMatrixAt(i, tempMatrix);
    }

    treeTrunkInstances.instanceMatrix.needsUpdate = true;
    treeFoliageInstances.instanceMatrix.needsUpdate = true;
    chunk.add(treeTrunkInstances);
    chunk.add(treeFoliageInstances);
  }

  // Add rocks using InstancedMesh
  const numRocks = Math.floor(seededRandom(seed + 800) * 4);

  if (numRocks > 0) {
    const rockInstances = new THREE.InstancedMesh(sharedRockGeometry, sharedRockMaterial, numRocks);
    rockInstances.castShadow = false;

    const tempMatrix = new THREE.Matrix4();
    const tempRotation = new THREE.Euler();
    const tempQuaternion = new THREE.Quaternion();

    for (let i = 0; i < numRocks; i++) {
      const rSeed = seed + 3000 + i * 100;
      const rx = worldX + 2 + seededRandom(rSeed) * (CHUNK_SIZE - 4);
      const rz = worldZ + 2 + seededRandom(rSeed + 1) * (CHUNK_SIZE - 4);
      const rockScale = 0.5 + seededRandom(rSeed + 2) * 1.0;

      tempRotation.set(seededRandom(rSeed + 3) * Math.PI, seededRandom(rSeed + 4) * Math.PI, 0);
      tempQuaternion.setFromEuler(tempRotation);
      tempMatrix.compose(
        new THREE.Vector3(rx, rockScale * 0.5, rz),
        tempQuaternion,
        new THREE.Vector3(rockScale, rockScale, rockScale)
      );
      rockInstances.setMatrixAt(i, tempMatrix);
    }

    rockInstances.instanceMatrix.needsUpdate = true;
    chunk.add(rockInstances);
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

  // Remove streetlights in this chunk from the global array
  chunk.children.forEach(child => {
    const idx = streetlights.indexOf(child);
    if (idx > -1) streetlights.splice(idx, 1);
  });

  // Remove parked cars in this chunk from the global array
  chunk.children.forEach(child => {
    if (child.userData && child.userData.isParkedCar) {
      const idx = parkedCars.indexOf(child);
      if (idx > -1) parkedCars.splice(idx, 1);
    }
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
updateLoadingProgress(60, 'Generating terrain chunks...');
updateChunks(0, 0);

updateLoadingProgress(80, 'Spawning vehicles...');

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
    { x: 80, z: 10, rotation: 0, type: 'aircraft' },
    { x: -60, z: 40, rotation: Math.PI / 4, type: 'tank' },
    { x: 130, z: 200, rotation: 0, type: 'boat' },      // Near lake
    { x: 220, z: 150, rotation: Math.PI / 2, type: 'boat' }  // Near lake
  ];

  vehicleSpawns.forEach(spawn => {
    spawnVehicle(spawn.x, spawn.z, spawn.rotation, spawn.type);
  });

  // Create water planes
  createWaterPlanes();
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

    // Check if spawn point is in water
    const inWater = isWaterAt(vx, vz);

    // Vehicle type distribution
    const typeRoll = seededRandom(seed + 9004);
    let vehicleType;

    if (inWater) {
      // In water: spawn boat
      vehicleType = 'boat';
    } else {
      // On land: 8% aircraft, 8% tank, 30% motorcycle, 54% jeep
      if (typeRoll < 0.08) {
        vehicleType = 'aircraft';
      } else if (typeRoll < 0.16) {
        vehicleType = 'tank';
      } else if (typeRoll < 0.46) {
        vehicleType = 'motorcycle';
      } else {
        vehicleType = 'jeep';
      }
    }
    spawnVehicle(vx, vz, vRotation, vehicleType);
  }
}

// ==================== ENEMY SYSTEM ====================

function createEnemyMesh(type) {
  // Check if it's a boss type
  if (BOSS_CONFIG[type]) {
    return createBossMesh(type);
  }

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
  head.castShadow = false;
  group.add(head);

  // Arms
  const armGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
  const armMaterial = new THREE.MeshStandardMaterial({ color });

  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-0.65, 0.75, 0);
  leftArm.castShadow = false;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(0.65, 0.75, 0);
  rightArm.castShadow = false;
  group.add(rightArm);

  // Legs
  const legGeometry = new THREE.BoxGeometry(0.35, 0.8, 0.35);
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.25, -0.4, 0);
  leftLeg.castShadow = false;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(0.25, -0.4, 0);
  rightLeg.castShadow = false;
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
  group.userData.isBoss = false;

  return group;
}

// Create boss mesh based on type
function createBossMesh(type) {
  switch (type) {
    case 'tankBoss': return createTankBossMesh();
    case 'mechBoss': return createMechBossMesh();
    case 'skyBoss': return createSkyBossMesh();
    default: return createTankBossMesh();
  }
}

// Tank Boss - Large, heavily armored ground unit
function createTankBossMesh() {
  const group = new THREE.Group();
  const color = ENEMY_COLORS.tankBoss;
  const metalMat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.4 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a0000 });

  // Massive body/hull
  const hullGeo = new THREE.BoxGeometry(3, 2, 4);
  const hull = new THREE.Mesh(hullGeo, metalMat);
  hull.position.y = 1.5;
  hull.castShadow = true;
  group.add(hull);

  // Turret on top
  const turretGeo = new THREE.CylinderGeometry(1, 1.2, 1, 8);
  const turret = new THREE.Mesh(turretGeo, metalMat);
  turret.position.y = 3;
  turret.castShadow = false;
  group.add(turret);

  // Main cannon
  const cannonGeo = new THREE.CylinderGeometry(0.2, 0.25, 3, 8);
  const cannon = new THREE.Mesh(cannonGeo, darkMat);
  cannon.rotation.x = Math.PI / 2;
  cannon.position.set(0, 3, -2);
  cannon.castShadow = false;
  group.add(cannon);

  // Armor plates
  const plateGeo = new THREE.BoxGeometry(0.2, 1.5, 3);
  [-1.6, 1.6].forEach(x => {
    const plate = new THREE.Mesh(plateGeo, darkMat);
    plate.position.set(x, 1.5, 0);
    plate.castShadow = false;
    group.add(plate);
  });

  // Treads (simplified)
  const treadGeo = new THREE.BoxGeometry(0.8, 1, 4.5);
  const treadMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  [-1.8, 1.8].forEach(x => {
    const tread = new THREE.Mesh(treadGeo, treadMat);
    tread.position.set(x, 0.5, 0);
    group.add(tread);
  });

  // Spikes on front
  const spikeGeo = new THREE.ConeGeometry(0.15, 0.5, 4);
  for (let i = -1; i <= 1; i++) {
    const spike = new THREE.Mesh(spikeGeo, darkMat);
    spike.rotation.x = Math.PI / 2;
    spike.position.set(i * 0.8, 1.5, -2.3);
    group.add(spike);
  }

  // Glowing eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const eyeGeo = new THREE.SphereGeometry(0.15, 8, 8);
  [-0.4, 0.4].forEach(x => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(x, 3.3, -0.8);
    group.add(eye);
  });

  group.userData.isBoss = true;
  group.userData.bossType = 'tankBoss';
  group.scale.set(1, 1, 1); // Will be scaled by server data

  return group;
}

// Mech Boss - Bipedal robot with shields
function createMechBossMesh() {
  const group = new THREE.Group();
  const color = ENEMY_COLORS.mechBoss;
  const metalMat = new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.2 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x4080a0 });

  // Torso
  const torsoGeo = new THREE.BoxGeometry(2, 2.5, 1.5);
  const torso = new THREE.Mesh(torsoGeo, metalMat);
  torso.position.y = 3;
  torso.castShadow = false;
  group.add(torso);

  // Head/cockpit
  const headGeo = new THREE.BoxGeometry(1.2, 0.8, 1);
  const head = new THREE.Mesh(headGeo, metalMat);
  head.position.y = 4.6;
  head.castShadow = false;
  group.add(head);

  // Visor
  const visorGeo = new THREE.BoxGeometry(1, 0.3, 0.1);
  const visorMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 4.6, -0.55);
  group.add(visor);

  // Arms with weapons
  const armGeo = new THREE.BoxGeometry(0.6, 2, 0.6);
  [-1.5, 1.5].forEach(x => {
    const arm = new THREE.Mesh(armGeo, metalMat);
    arm.position.set(x, 3, 0);
    arm.castShadow = false;
    group.add(arm);

    // Weapon pods
    const weaponGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 6);
    const weapon = new THREE.Mesh(weaponGeo, accentMat);
    weapon.rotation.x = Math.PI / 2;
    weapon.position.set(x, 2.5, -0.8);
    group.add(weapon);
  });

  // Legs
  const legGeo = new THREE.BoxGeometry(0.8, 2.5, 0.8);
  [-0.7, 0.7].forEach(x => {
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(x, 1, 0);
    leg.castShadow = false;
    group.add(leg);
  });

  // Feet
  const footGeo = new THREE.BoxGeometry(1, 0.3, 1.2);
  [-0.7, 0.7].forEach(x => {
    const foot = new THREE.Mesh(footGeo, accentMat);
    foot.position.set(x, -0.1, 0.2);
    group.add(foot);
  });

  // Shield bubble (for mech boss)
  const shieldGeo = new THREE.SphereGeometry(3, 16, 16);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.position.y = 2.5;
  shield.name = 'shield';
  group.add(shield);

  group.userData.isBoss = true;
  group.userData.bossType = 'mechBoss';

  return group;
}

// Sky Boss - Flying enemy
function createSkyBossMesh() {
  const group = new THREE.Group();
  const color = ENEMY_COLORS.skyBoss;
  const metalMat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.3 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x8800ff });

  // Main body - sleek aircraft shape
  const bodyGeo = new THREE.ConeGeometry(1, 4, 6);
  const body = new THREE.Mesh(bodyGeo, metalMat);
  body.rotation.x = Math.PI / 2;
  body.position.z = 1;
  body.castShadow = true;
  group.add(body);

  // Cockpit
  const cockpitGeo = new THREE.SphereGeometry(0.8, 8, 8);
  const cockpitMat = new THREE.MeshBasicMaterial({ color: 0x4400aa });
  const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
  cockpit.position.set(0, 0.3, -0.5);
  group.add(cockpit);

  // Wings
  const wingGeo = new THREE.BoxGeometry(5, 0.1, 1.5);
  const wing = new THREE.Mesh(wingGeo, metalMat);
  wing.position.set(0, 0, 0.5);
  wing.castShadow = false;
  group.add(wing);

  // Tail fins
  const finGeo = new THREE.BoxGeometry(0.1, 1.5, 1);
  [-0.8, 0.8].forEach(x => {
    const fin = new THREE.Mesh(finGeo, metalMat);
    fin.position.set(x, 0.5, 2.5);
    fin.rotation.z = x > 0 ? 0.3 : -0.3;
    group.add(fin);
  });

  // Engine glow
  const engineGeo = new THREE.CylinderGeometry(0.4, 0.6, 0.5, 8);
  [-1.5, 1.5].forEach(x => {
    const engine = new THREE.Mesh(engineGeo, glowMat);
    engine.rotation.x = Math.PI / 2;
    engine.position.set(x, -0.2, 2);
    group.add(engine);
  });

  // Weapons under wings
  const weaponGeo = new THREE.CylinderGeometry(0.15, 0.15, 1, 6);
  [-2, 2].forEach(x => {
    const weapon = new THREE.Mesh(weaponGeo, metalMat);
    weapon.rotation.x = Math.PI / 2;
    weapon.position.set(x, -0.3, 0);
    group.add(weapon);
  });

  group.userData.isBoss = true;
  group.userData.bossType = 'skyBoss';

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
  const weapon = getEffectiveWeaponStats(state.currentWeapon);

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

  // Auto-reload when magazine empties
  if (state.ammoInMag <= 0 && state.ammoReserve > 0 && !state.isReloading) {
    setTimeout(() => {
      if (state.ammoInMag <= 0 && !state.isReloading) {
        reload();
      }
    }, 200);
  }

  // Play weapon sound
  playSound(state.currentWeapon);

  // Muzzle flash (reduced by silencer)
  muzzleFlashMaterial.opacity = weapon.muzzleFlashMult;
  setTimeout(() => { muzzleFlashMaterial.opacity = 0; }, 50);

  // Weapon recoil (reduced by grip)
  const recoilAmount = 0.05 * weapon.recoilMult;
  weaponGroup.position.z += recoilAmount;
  weaponGroup.rotation.x -= recoilAmount;
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
  const weapon = getEffectiveWeaponStats(state.currentWeapon);

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

  // Store previous weapon for quick swap
  state.previousWeapon = state.currentWeapon;
  state.currentWeapon = weaponType;
  const weapon = getEffectiveWeaponStats(weaponType);
  state.ammoInMag = weapon.magSize;
  state.ammoReserve = weapon.maxAmmo;

  createWeaponModel(weaponType);
  updateAmmoDisplay();
  updateWeaponDisplay();
}

function quickSwapWeapon() {
  if (state.isReloading) return;

  // Swap to previous weapon if we have it
  if (state.weapons[state.previousWeapon] && state.previousWeapon !== state.currentWeapon) {
    switchWeapon(state.previousWeapon);
  } else {
    // Find another available weapon to swap to
    const weaponOrder = ['pistol', 'rifle', 'shotgun', 'sniper'];
    for (const weapon of weaponOrder) {
      if (state.weapons[weapon] && weapon !== state.currentWeapon) {
        switchWeapon(weapon);
        return;
      }
    }
  }
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
async function startGame(difficulty) {
  initAudio(); // Initialize audio on first user interaction

  // Load saved XP progress
  loadXPProgress();
  loadAttachmentData();

  // Get server address from input
  const serverInput = document.getElementById('server-address');
  const connectionStatus = document.getElementById('connection-status');
  const serverAddress = serverInput.value.trim() || 'localhost:3000';

  // Save to localStorage
  localStorage.setItem('combatServerAddress', serverAddress);

  // Show connecting status
  connectionStatus.textContent = 'Connecting...';
  connectionStatus.className = 'connecting';

  // Disable difficulty buttons while connecting
  document.querySelectorAll('.difficulty-btn').forEach(btn => btn.disabled = true);

  try {
    // Connect to server (only if not already connected)
    if (!socket || !socket.connected) {
      await connectToServer(serverAddress);
    }

    connectionStatus.textContent = 'Connected!';
    connectionStatus.className = 'connected';

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
      difficulty: difficulty,
      gameMode: state.selectedGameMode
    });

    // Set game mode and show appropriate HUD
    state.gameMode = state.selectedGameMode;
    updateGameModeHUD();

    // Update XP bar
    updateXPBar();

    // Lock pointer
    renderer.domElement.requestPointerLock();

  } catch (error) {
    console.error('Failed to connect:', error);
    connectionStatus.textContent = 'Connection failed! Check address.';
    connectionStatus.className = 'error';
    document.querySelectorAll('.difficulty-btn').forEach(btn => btn.disabled = false);
  }
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

  // Re-enable difficulty buttons
  document.querySelectorAll('.difficulty-btn').forEach(btn => btn.disabled = false);

  // Clear connection status
  const connectionStatus = document.getElementById('connection-status');
  if (connectionStatus && socket && socket.connected) {
    connectionStatus.textContent = 'Connected';
    connectionStatus.className = 'connected';
  }

  document.exitPointerLock();
}

// Death screen elements
const deathScreen = document.getElementById('death-screen');
const deathMessage = document.getElementById('death-message');
const respawnTimer = document.getElementById('respawn-timer');
const deathAnimationOverlay = document.getElementById('death-animation-overlay');
const gameCanvas = document.getElementById('game-canvas');

// Death animation state
let deathCameraStartY = 0;
let deathCameraStartRotation = 0;
let deathAnimationStartTime = 0;

// Handle player death with cinematic animation
function handleDeath(killerName) {
  if (state.isDead || state.isDying) return;

  state.isDying = true;
  state.isDead = true;
  state.lastKiller = killerName;
  state.deathAnimationPhase = 1;
  deathAnimationStartTime = Date.now();

  // Reset kill streak on death
  state.killStreak = 0;
  state.pendingAirstrike = false;

  // Store original camera position for animation
  deathCameraStartY = camera.position.y;
  deathCameraStartRotation = camera.rotation.z;

  playSound('death');
  crosshair.classList.add('hidden');

  // Set up death message
  deathMessage.textContent = `Killed by ${killerName}`;

  // Phase 1: Intense red flash and shake (0-500ms)
  document.getElementById('damage-overlay').style.opacity = 0.8;
  if (gameCanvas) gameCanvas.classList.add('shake');

  // Phase 2: Camera falls, grayscale starts (500-2000ms)
  setTimeout(() => {
    state.deathAnimationPhase = 2;
    if (gameCanvas) gameCanvas.classList.remove('shake');

    // Start grayscale and vignette
    deathAnimationOverlay.classList.add('active', 'grayscale', 'vignette');

    // Fade red overlay
    document.getElementById('damage-overlay').style.transition = 'opacity 1s';
    document.getElementById('damage-overlay').style.opacity = 0.3;
  }, 500);

  // Phase 3: Show death screen (2000ms)
  setTimeout(() => {
    state.deathAnimationPhase = 3;

    // Show death screen with animation
    deathScreen.classList.remove('hidden');
    deathScreen.classList.add('visible');

    // Start countdown
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
  }, 2000);
}

// Update death animation (called from game loop)
function updateDeathAnimation(delta) {
  if (!state.isDying || state.deathAnimationPhase !== 2) return;

  const elapsed = Date.now() - deathAnimationStartTime - 500; // Offset for phase 2 start
  const fallDuration = 1500; // 1.5 seconds to fall
  const progress = Math.min(elapsed / fallDuration, 1);

  // Ease-in curve for natural falling
  const easeIn = progress * progress;

  // Camera falls to ground level
  const fallDistance = deathCameraStartY - 0.5; // Fall to near ground
  camera.position.y = deathCameraStartY - (fallDistance * easeIn);

  // Camera tilts to the side as player falls
  camera.rotation.z = deathCameraStartRotation + (Math.PI / 6 * easeIn); // Tilt 30 degrees

  // Slight forward pitch
  camera.rotation.x = Math.min(camera.rotation.x + delta * 0.3, 0.3);
}

// Respawn player
function respawn() {
  // Reset death animation state
  state.isDying = false;
  state.isDead = false;
  state.deathAnimationPhase = 0;

  // Reset health
  state.health = 100;

  // Reset camera rotation
  camera.rotation.z = 0;
  camera.rotation.x = 0;

  // Random respawn position
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

  // Hide death screen and reset classes
  deathScreen.classList.add('hidden');
  deathScreen.classList.remove('visible');

  // Reset overlays
  deathAnimationOverlay.classList.remove('active', 'grayscale', 'vignette');
  document.getElementById('damage-overlay').style.transition = 'opacity 0.1s';
  document.getElementById('damage-overlay').style.opacity = 0;

  // Reset canvas classes
  if (gameCanvas) {
    gameCanvas.classList.remove('shake', 'death-tilt');
  }

  // Show crosshair
  crosshair.classList.remove('hidden');

  // Re-request pointer lock for mouse control
  renderer.domElement.requestPointerLock();
}

// Difficulty button handlers
document.querySelectorAll('.difficulty-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const difficulty = btn.dataset.difficulty;
    // Show tutorial prompt before starting game
    showTutorialPrompt(() => startGame(difficulty));
  });
});

// Game mode button handlers
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.selectedGameMode = btn.dataset.mode;

    // Show/hide team selection based on mode
    const teamSection = document.querySelector('.team-section');
    if (btn.dataset.mode === 'battleroyale' || btn.dataset.mode === 'deathmatch') {
      teamSection.style.opacity = '0.5';
    } else {
      teamSection.style.opacity = '1';
    }
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

// Graphics quality button handlers
document.querySelectorAll('.graphics-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    applyGraphicsSettings(btn.dataset.quality);
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

  // Check for pending airstrike
  if (state.pendingAirstrike) {
    // Raycast to find target location
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    const raycaster = new THREE.Raycaster(camera.position.clone(), direction);
    const intersects = raycaster.intersectObjects(collidableObjects);

    if (intersects.length > 0) {
      callAirstrike(intersects[0].point.x, intersects[0].point.z);
    } else {
      // Airstrike at distance if no intersection
      const targetDist = 50;
      callAirstrike(
        camera.position.x + direction.x * targetDist,
        camera.position.z + direction.z * targetDist
      );
    }
    return;
  }

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
    // Close dialogue first if open
    if (state.inDialogue) {
      closeDialogue();
      return;
    }
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

  // Tab key for inventory/scoreboard
  if (event.code === 'Tab') {
    event.preventDefault();
    if (state.inventoryOpen) {
      closeInventory();
    } else if (state.isPlaying && !state.isPaused) {
      openInventory();
    }
    return;
  }

  // L key for perk menu
  if (event.code === 'KeyL') {
    event.preventDefault();
    if (state.perkMenuOpen) {
      closePerkMenu();
    } else if (state.isPlaying && !state.isPaused) {
      openPerkMenu();
    }
    return;
  }

  // F3 key to toggle performance stats
  if (event.code === 'F3') {
    event.preventDefault();
    togglePerformanceStats();
    return;
  }

  if (!state.isPlaying || state.isPaused) return;

  // Vehicle enter/exit with E key, search loot containers, open doors, or interact with NPCs
  if (event.code === 'KeyE') {
    // Close dialogue if open
    if (state.inDialogue) {
      closeDialogue();
      return;
    }
    if (state.inVehicle) {
      exitVehicle();
    } else {
      // Check for nearby NPC first
      if (state.nearbyNPC) {
        interactWithNPC();
        return;
      }
      // Check for door
      const nearDoor = getNearestDoor(camera.position);
      if (nearDoor) {
        toggleDoor(nearDoor);
        return;
      }
      // Check for loot container
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
    case 'Digit4': switchWeapon('sniper'); break;
    case 'KeyQ': quickSwapWeapon(); break;
  }
});

document.addEventListener('keyup', (event) => {
  // Tab is now used for inventory toggle (no keyup action needed)
  if (event.code === 'Tab') {
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

let socket = null;

function connectToServer(address) {
  return new Promise((resolve, reject) => {
    // Ensure address has protocol
    if (!address.startsWith('http://') && !address.startsWith('https://')) {
      address = 'http://' + address;
    }

    console.log(`Connecting to server: ${address}`);

    socket = io(address, {
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    const connectTimeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Connection timeout'));
    }, 5000);

    socket.on('connect', () => {
      clearTimeout(connectTimeout);
      console.log('Connected to server');
      resolve();
    });

    socket.on('connect_error', (error) => {
      clearTimeout(connectTimeout);
      console.error('Connection error:', error);
      reject(error);
    });

    setupSocketHandlers();
  });
}

function setupSocketHandlers() {
  if (!socket) return;

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
      mesh.castShadow = false;

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
    state.killStreak++;
    checkKillStreakRewards();
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

      // Apply boss scale if applicable
      if (enemyData.scale && enemyData.scale !== 1) {
        mesh.scale.set(enemyData.scale, enemyData.scale, enemyData.scale);
      }

      state.enemies[id] = {
        mesh,
        data: enemyData,
        // Store boss-specific properties at top level for easy access
        id: enemyData.id,
        type: enemyData.type,
        isBoss: enemyData.isBoss || false,
        health: enemyData.health,
        maxHealth: enemyData.maxHealth,
        shield: enemyData.shield || 0,
        maxShield: enemyData.maxShield || 0,
        x: enemyData.x,
        z: enemyData.z
      };
    }

    // Update enemy position and rotation
    const enemy = state.enemies[id];
    enemy.mesh.position.set(enemyData.x, enemyData.y, enemyData.z);
    enemy.mesh.rotation.y = enemyData.rotation;
    enemy.data = enemyData;

    // Update top-level properties
    enemy.health = enemyData.health;
    enemy.maxHealth = enemyData.maxHealth;
    enemy.shield = enemyData.shield || 0;
    enemy.maxShield = enemyData.maxShield || 0;
    enemy.x = enemyData.x;
    enemy.z = enemyData.z;

    // Update health bar (don't show on bosses - they have HUD bar)
    if (!enemyData.isBoss) {
      const healthPercent = enemyData.health / enemyData.maxHealth;
      updateEnemyHealthBar(enemy.mesh, healthPercent);
    }

    // Update mech boss shield visual
    if (enemyData.type === 'mechBoss') {
      const shieldMesh = enemy.mesh.children.find(c => c.name === 'shield');
      if (shieldMesh) {
        shieldMesh.material.opacity = enemyData.shield > 0 ? 0.2 + (enemyData.shield / enemyData.maxShield) * 0.3 : 0;
      }
    }

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

  // Update enemy count in UI (exclude bosses from regular count)
  const aliveEnemies = Object.values(enemies).filter(e => e.health > 0 && !e.isBoss).length;
  const aliveBosses = Object.values(enemies).filter(e => e.health > 0 && e.isBoss).length;
  document.getElementById('enemy-count').textContent = aliveBosses > 0
    ? `Enemies: ${aliveEnemies} | Bosses: ${aliveBosses}`
    : `Enemies: ${aliveEnemies}`;

  // Update boss health bar
  updateNearbyBoss();
});

// ==================== NPC HANDLERS ====================

// Receive NPCs from server
socket.on('npcs', (npcsData) => {
  if (!npcsData) return;
  for (const id in npcsData) {
    const npcData = npcsData[id];
    if (!npcData) continue;

    if (!state.npcs[id]) {
      // Create NPC mesh
      try {
        const mesh = createNPCMesh(npcData);
        scene.add(mesh);

        state.npcs[id] = {
          mesh,
          data: npcData
        };
      } catch (e) {
        console.error('Error creating NPC mesh:', e);
        continue;
      }
    }

    // Update NPC position
    const npc = state.npcs[id];
    if (npc && npc.mesh) {
      npc.mesh.position.set(npcData.x, npcData.y, npcData.z);
      npc.data = npcData;
    }
  }
});

// NPC dialogue received
socket.on('npcDialogue', (data) => {
  state.inDialogue = true;
  state.currentDialogue = {
    npcId: data.npcId,
    npcName: data.npcName,
    greeting: data.greeting,
    options: data.options
  };
  showDialogueBox(data);
});

// NPC response to dialogue choice
socket.on('npcResponse', (data) => {
  updateDialogueResponse(data.response);
});

// Quest started
socket.on('questStarted', (data) => {
  state.activeQuests.push(data.quest);
  showQuestNotification(`Quest Started: ${data.quest.name}`);
  updateQuestTracker();
});

// Quest progress
socket.on('questProgress', (data) => {
  const quest = state.activeQuests.find(q => q.id === data.questId);
  if (quest) {
    quest.objectives = data.objectives;
    updateQuestTracker();
  }
});

// Quest complete
socket.on('questComplete', (data) => {
  state.activeQuests = state.activeQuests.filter(q => q.id !== data.questId);
  state.completedQuests.push(data.questId);
  showQuestNotification(`Quest Complete: ${data.questName}!`);
  updateQuestTracker();

  // Show rewards
  if (data.rewards) {
    let rewardText = 'Rewards: ';
    if (data.rewards.ammo) rewardText += `+${data.rewards.ammo} ammo `;
    if (data.rewards.health) rewardText += `+${data.rewards.health} health`;
    showPickupMessage(rewardText, '#f1c40f');

    // Apply rewards
    if (data.rewards.ammo) state.ammoReserve += data.rewards.ammo;
    if (data.rewards.health) {
      state.health = Math.min(state.health + data.rewards.health, 100);
      updateHealth();
    }
  }
});

// ==================== XP SOCKET HANDLERS ====================

// XP gained from kills/quests
socket.on('xpGained', (data) => {
  state.xp = data.totalXp;
  state.level = data.level;
  state.nextLevelXp = data.nextLevelXp;

  showXPGained(data.amount, data.reason);
  updateXPBar();
  saveXPProgress();
});

// Player leveled up
socket.on('playerLevelUp', (data) => {
  state.level = data.newLevel;
  state.xp = data.totalXp;
  state.nextLevelXp = data.nextLevelXp;

  showLevelUp(data.newLevel, data.newPerksAvailable || []);
  updateXPBar();
  saveXPProgress();
});

// Perk data received
socket.on('perksData', (data) => {
  state.level = data.level;
  state.xp = data.xp;
  state.nextLevelXp = data.nextLevelXp;
  state.perks = data.selectedPerks || [];

  renderPerkMenu(data);
  updateXPBar();
});

// Perk selected successfully
socket.on('perkSelected', (data) => {
  state.perks = data.allPerks;
  showPickupMessage(`Perk Activated: ${data.perk.name}`, '#00ff00');
  saveXPProgress();

  // Refresh perk menu if open
  if (state.perkMenuOpen) {
    socket.emit('requestPerks');
  }
});

// Perk selection error
socket.on('perkError', (data) => {
  showPickupMessage(data.message, '#ff4444');
});

// ==================== WEATHER SOCKET HANDLERS ====================

socket.on('weatherChange', (data) => {
  transitionWeather(data.weather);
});

// Create NPC mesh (friendly NPCs look different from enemies)
function createNPCMesh(npcData) {
  const npcGroup = new THREE.Group();

  // Body
  const bodyGeom = new THREE.CylinderGeometry(0.4, 0.5, 1.6, 8);
  const bodyMat = new THREE.MeshStandardMaterial({ color: npcData.color });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.y = 0.8;
  npcGroup.add(body);

  // Head
  const headGeom = new THREE.SphereGeometry(0.35, 8, 8);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac }); // Skin color
  const head = new THREE.Mesh(headGeom, headMat);
  head.position.y = 1.9;
  npcGroup.add(head);

  // Friendly indicator (green diamond above head)
  if (!npcData.hostile) {
    const diamondGeom = new THREE.OctahedronGeometry(0.15);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5
    });
    const diamond = new THREE.Mesh(diamondGeom, diamondMat);
    diamond.position.y = 2.5;
    diamond.name = 'friendlyIndicator';
    npcGroup.add(diamond);
  }

  // Name label
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = npcData.hostile ? '#ff4444' : '#44ff44';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(npcData.name, 128, 40);

  const labelTexture = new THREE.CanvasTexture(canvas);
  const labelMat = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
  const label = new THREE.Sprite(labelMat);
  label.position.y = 2.8;
  label.scale.set(2, 0.5, 1);
  npcGroup.add(label);

  return npcGroup;
}

// Check for nearby NPCs and show interaction prompt
function checkNearbyNPCs() {
  if (!state.isPlaying || state.isPaused || state.isDead || state.inDialogue) return;

  let nearestNPC = null;
  let nearestDist = Infinity;

  for (const id in state.npcs) {
    const npc = state.npcs[id];
    if (!npc || !npc.data || !npc.mesh) continue;
    if (npc.data.hostile) continue; // Can't interact with hostile NPCs

    const dist = camera.position.distanceTo(npc.mesh.position);
    const interactRange = npc.data.interactRange || 5;
    if (dist < interactRange && dist < nearestDist) {
      nearestDist = dist;
      nearestNPC = npc;
    }
  }

  state.nearbyNPC = nearestNPC;

  // Show/hide interaction prompt
  const prompt = document.getElementById('npc-prompt');
  if (prompt) {
    if (nearestNPC) {
      prompt.classList.remove('hidden');
    } else {
      prompt.classList.add('hidden');
    }
  }
}

// Interact with nearby NPC
function interactWithNPC() {
  if (!state.nearbyNPC || state.inDialogue) return;

  socket.emit('interactNPC', { npcId: state.nearbyNPC.data.id });
}

// Show dialogue box
function showDialogueBox(data) {
  const box = document.getElementById('dialogue-box');
  const nameEl = document.getElementById('npc-name');
  const textEl = document.getElementById('dialogue-text');
  const optionsEl = document.getElementById('dialogue-options');

  if (!box) return;

  nameEl.textContent = data.npcName;
  textEl.textContent = data.greeting;

  // Clear previous options
  optionsEl.innerHTML = '';

  // Add options
  data.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'dialogue-option';
    btn.textContent = opt.text;
    btn.onclick = () => {
      socket.emit('dialogueChoice', {
        npcId: data.npcId,
        optionIndex: opt.index
      });
    };
    optionsEl.appendChild(btn);
  });

  box.classList.remove('hidden');

  // Release pointer lock for dialogue
  document.exitPointerLock();
}

// Update dialogue with NPC response
function updateDialogueResponse(response) {
  const textEl = document.getElementById('dialogue-text');
  if (textEl) {
    textEl.textContent = response;
  }
}

// Close dialogue
function closeDialogue() {
  const box = document.getElementById('dialogue-box');
  if (box) {
    box.classList.add('hidden');
  }
  state.inDialogue = false;
  state.currentDialogue = null;

  // Re-lock pointer
  if (state.isPlaying && !state.isPaused) {
    document.body.requestPointerLock();
  }
}

// Add close button event listener
document.getElementById('dialogue-close')?.addEventListener('click', closeDialogue);

// Show quest notification
function showQuestNotification(text) {
  const notification = document.createElement('div');
  notification.className = 'quest-notification';
  notification.textContent = text;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// Update quest tracker UI
function updateQuestTracker() {
  const tracker = document.getElementById('quest-tracker');
  if (!tracker) return;

  if (state.activeQuests.length === 0) {
    tracker.classList.add('hidden');
    return;
  }

  tracker.classList.remove('hidden');
  const quest = state.activeQuests[0]; // Show first active quest
  const nameEl = document.getElementById('quest-name');
  const progressEl = document.getElementById('quest-progress');

  if (nameEl) nameEl.textContent = quest.name;
  if (progressEl) {
    const obj = quest.objectives[0];
    progressEl.textContent = `${obj.current}/${obj.count} ${obj.target}s`;
  }
}

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
    state.killStreak++;
    checkKillStreakRewards();
    // Track weapon kill for attachments
    trackWeaponKill(state.currentWeapon);
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

// ==================== BOSS EVENT HANDLERS ====================

// Track current boss being fought
let currentBossId = null;
let currentBossData = null;

// Boss health bar elements
const bossHealthContainer = document.getElementById('boss-health-container');
const bossNameElement = document.getElementById('boss-name');
const bossHealthFill = document.getElementById('boss-health-fill');
const bossShieldBar = document.getElementById('boss-shield-bar');
const bossShieldFill = document.getElementById('boss-shield-fill');
const bossHealthText = document.getElementById('boss-health-text');
const bossHealthBar = document.getElementById('boss-health-bar');
const bossDefeatElement = document.getElementById('boss-defeat');

function updateBossHealthBar(health, maxHealth, shield = 0, maxShield = 0) {
  if (!currentBossId) return;

  const healthPercent = Math.max(0, health / maxHealth) * 100;
  bossHealthFill.style.width = `${healthPercent}%`;
  bossHealthText.textContent = `${Math.max(0, Math.floor(health))} / ${maxHealth}`;

  // Update shield if boss has one
  if (maxShield > 0) {
    bossShieldBar.classList.add('visible');
    const shieldPercent = Math.max(0, shield / maxShield) * 100;
    bossShieldFill.style.width = `${shieldPercent}%`;
  } else {
    bossShieldBar.classList.remove('visible');
  }
}

function showBossHealthBar(bossId, bossType) {
  currentBossId = bossId;
  const bossConfig = BOSS_CONFIG[bossType];
  const bossName = bossConfig ? bossConfig.name : bossType.replace('Boss', ' Boss');

  bossNameElement.textContent = bossName.toUpperCase();
  bossHealthContainer.classList.add('visible');
  bossHealthBar.classList.remove('enraged');

  // Show shield bar for mech boss
  if (bossType === 'mechBoss') {
    bossShieldBar.classList.add('visible');
  } else {
    bossShieldBar.classList.remove('visible');
  }
}

function hideBossHealthBar() {
  currentBossId = null;
  currentBossData = null;
  bossHealthContainer.classList.remove('visible');
}

// Handle boss death
socket.on('bossDeath', (data) => {
  console.log(`BOSS DEFEATED: ${data.bossType} by ${data.killerName}!`);
  playSound('explosion');

  // Hide boss health bar
  if (currentBossId === data.bossId) {
    hideBossHealthBar();
  }

  // Show boss defeat notification
  bossDefeatElement.textContent = `${BOSS_CONFIG[data.bossType]?.name || 'BOSS'} DEFEATED!`;
  bossDefeatElement.classList.add('visible');
  setTimeout(() => bossDefeatElement.classList.remove('visible'), 3000);

  // Track kill
  if (data.killerId === socket.id) {
    state.kills++;

    // Award loot to the player who killed the boss
    if (data.loot) {
      data.loot.forEach(item => {
        if (item.type === 'weapon') {
          state.weapons[item.weapon] = true;
          console.log(`Looted weapon: ${item.weapon}`);
        } else if (item.type === 'ammo') {
          state.ammoReserve = Math.min(state.ammoReserve + item.amount, WEAPONS[state.currentWeapon].maxAmmo);
          updateAmmoCounter();
          console.log(`Looted ammo: ${item.amount}`);
        } else if (item.type === 'health') {
          state.health = Math.min(state.health + item.amount, 100);
          updateHealth();
          console.log(`Looted health: ${item.amount}`);
        }
      });
    }
  }

  // Create explosion effect at boss position
  for (let i = 0; i < 20; i++) {
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 5,
      Math.random() * 3,
      (Math.random() - 0.5) * 5
    );
    createHitEffect(new THREE.Vector3(data.x, 2, data.z).add(offset), 0xff8800);
  }

  // Remove boss from enemies
  if (state.enemies[data.bossId]) {
    if (state.enemies[data.bossId].mesh) {
      scene.remove(state.enemies[data.bossId].mesh);
    }
    delete state.enemies[data.bossId];
  }
});

// Handle boss enrage
socket.on('bossEnrage', (data) => {
  console.log(`Boss ${data.type} is ENRAGED!`);
  if (currentBossId === data.bossId) {
    bossHealthBar.classList.add('enraged');
    bossNameElement.textContent = `${BOSS_CONFIG[data.type]?.name || 'BOSS'} - ENRAGED!`;
  }
  playSound('explosion');
});

// Handle boss special attacks
socket.on('bossSpecialAttack', (data) => {
  console.log(`Boss special attack: ${data.type}`);
  playSound('explosion');

  switch (data.type) {
    case 'groundSlam':
      // Create shockwave effect
      createGroundSlamEffect(data.x, data.z, data.radius);
      break;

    case 'rocketBarrage':
      // Create rocket trail effects
      createRocketBarrageEffect(data.x, data.z, data.targetX, data.targetZ);
      break;

    case 'diveBomb':
      // Create dive bomb impact effect
      createDiveBombEffect(data.targetX, data.targetZ);
      break;
  }
});

// Handle boss shield hit
socket.on('bossShieldHit', (data) => {
  if (currentBossId === data.bossId && currentBossData) {
    currentBossData.shield = data.remainingShield;
    updateBossHealthBar(
      currentBossData.health,
      currentBossData.maxHealth,
      data.remainingShield,
      currentBossData.maxShield
    );
  }
  // Play shield hit sound (different from regular hit)
  playSound('hit');
});

// Handle server-spawned supply drops
socket.on('serverSupplyDrop', (data) => {
  console.log(`Supply drop incoming at (${data.x.toFixed(0)}, ${data.z.toFixed(0)})`);
  spawnSupplyDrop(data.x, data.z, data.contents);
});

// Handle player-called supply drops (from kill streaks)
socket.on('playerSupplyDrop', (data) => {
  console.log(`Player supply drop at (${data.x.toFixed(0)}, ${data.z.toFixed(0)})`);
  spawnSupplyDrop(data.x, data.z);
});

// Handle airstrike effect from other players
socket.on('airstrikeEffect', (data) => {
  if (data.playerId !== socket.id) {
    // Show airstrike effect for other players' airstrikes
    createAirstrikeEffect(data.x, data.z);
  }
});

// ==================== GAME MODE SOCKET HANDLERS ====================

socket.on('gameModeState', (data) => {
  state.gameMode = data.mode;
  state.gameModeState = data.state;
  state.gameModeConfig = data.config;
  updateGameModeHUD();
});

socket.on('gameModeChanged', (data) => {
  state.gameMode = data.mode;
  state.gameModeState = data.state;
  state.gameModeConfig = data.config;
  updateGameModeHUD();
  showPickupMessage(`Game Mode: ${data.config.name}`, '#9b59b6');
});

socket.on('gameModeEnd', (data) => {
  let message = '';
  switch (data.mode) {
    case 'deathmatch':
      message = data.winner ? `${data.winner.name} wins!` : 'Game Over!';
      break;
    case 'koth':
    case 'ctf':
      message = `${data.winner.toUpperCase()} Team Wins!`;
      break;
    case 'wave':
      message = `Game Over! Wave ${data.waveReached} reached`;
      break;
    case 'battleroyale':
      message = data.winner ? `${data.winner.name} is the winner!` : 'Game Over!';
      break;
  }
  showStreakNotification(message, '#ffd700', false);
  state.gameMode = 'freeplay';
  updateGameModeHUD();
});

// Deathmatch updates
socket.on('dmUpdate', (data) => {
  state.gameModeState = data;

  // Update timer display
  const totalSeconds = Math.ceil(data.timeRemaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  document.getElementById('dm-timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Update player's score
  const myScore = data.scores[socket.id];
  if (myScore) {
    document.getElementById('dm-score').textContent = `Kills: ${myScore.kills} | Deaths: ${myScore.deaths}`;
  }
});

// KOTH updates
socket.on('kothUpdate', (data) => {
  state.gameModeState = data;
  document.getElementById('koth-red-score').textContent = data.scores.red;
  document.getElementById('koth-blue-score').textContent = data.scores.blue;
  document.getElementById('koth-green-score').textContent = data.scores.green;
  document.getElementById('koth-yellow-score').textContent = data.scores.yellow;
  const status = document.getElementById('koth-status');
  if (data.contested) {
    status.textContent = 'CONTESTED';
    status.className = 'contested';
  } else if (data.controlling) {
    status.textContent = `${data.controlling.toUpperCase()} Control`;
    status.className = data.controlling;
  } else {
    status.textContent = 'Neutral';
    status.className = '';
  }
  // Update 3D zone color
  if (gameModeObjects.kothZone) {
    updateKOTHZone();
  }
});

// CTF updates (alliance system: Red+Green vs Blue+Yellow)
socket.on('ctfUpdate', (data) => {
  state.gameModeState = data;
  document.getElementById('ctf-redgreen-score').textContent = data.scores.redgreen;
  document.getElementById('ctf-blueyellow-score').textContent = data.scores.blueyellow;
  // Update 3D flag positions
  if (gameModeObjects.ctfRedgreenFlag || gameModeObjects.ctfBlueyellowFlag) {
    updateCTFFlags();
  }
});

socket.on('flagPickup', (data) => {
  const isRedGreen = data.team === 'redgreen';
  const teamLabel = isRedGreen ? 'RED+GREEN' : 'BLUE+YELLOW';
  const color = isRedGreen ? '#e74c3c' : '#3498db';
  showPickupMessage(`${data.carrierName} has the ${teamLabel} flag!`, color);
});

socket.on('flagCapture', (data) => {
  const isRedGreen = data.team === 'redgreen';
  const teamLabel = isRedGreen ? 'RED+GREEN' : 'BLUE+YELLOW';
  const color = isRedGreen ? '#e74c3c' : '#3498db';
  showStreakNotification(`${teamLabel} SCORES!`, color, false);
});

socket.on('flagDrop', (data) => {
  const isRedGreen = data.team === 'redgreen';
  const teamLabel = isRedGreen ? 'RED+GREEN' : 'BLUE+YELLOW';
  const color = isRedGreen ? '#e74c3c' : '#3498db';
  showPickupMessage(`${teamLabel} flag dropped!`, color);
});

// Wave updates
socket.on('waveUpdate', (data) => {
  state.gameModeState = data;
  document.getElementById('wave-number').textContent = `WAVE ${data.waveNumber}`;
  document.getElementById('wave-enemies').textContent = `Enemies: ${data.enemiesRemaining}`;
  const timer = document.getElementById('wave-timer');
  if (data.breakTimeRemaining > 0) {
    timer.classList.remove('hidden');
    timer.textContent = `Next wave: ${Math.ceil(data.breakTimeRemaining / 1000)}s`;
  } else {
    timer.classList.add('hidden');
  }
});

socket.on('waveStart', (data) => {
  showStreakNotification(`WAVE ${data.waveNumber}`, '#e74c3c', false);
});

socket.on('waveComplete', (data) => {
  showPickupMessage(`Wave ${data.waveNumber} Complete!`, '#27ae60');
});

// Battle Royale updates
socket.on('brUpdate', (data) => {
  state.gameModeState = data;
  document.getElementById('br-alive').textContent = `Alive: ${data.playersAlive}`;
  document.getElementById('br-phase').textContent = `Phase ${data.phase}`;

  // Check if player is outside zone
  const dist = Math.sqrt(
    Math.pow(camera.position.x - data.center.x, 2) +
    Math.pow(camera.position.z - data.center.z, 2)
  );
  const warning = document.getElementById('br-warning');
  if (dist > data.currentRadius) {
    warning.classList.remove('hidden');
  } else {
    warning.classList.add('hidden');
  }

  // Update 3D circle
  updateBRCircle();
});

socket.on('brShrink', (data) => {
  showPickupMessage(`Circle shrinking! Phase ${data.phase}`, '#3498db');
});

// ==================== GAME MODE HUD FUNCTIONS ====================

function updateGameModeHUD() {
  const gamemodeHud = document.getElementById('gamemode-hud');
  const dmHud = document.getElementById('dm-hud');
  const kothHud = document.getElementById('koth-hud');
  const ctfHud = document.getElementById('ctf-hud');
  const waveHud = document.getElementById('wave-hud');
  const brHud = document.getElementById('br-hud');

  // Hide all mode HUDs
  dmHud.classList.add('hidden');
  kothHud.classList.add('hidden');
  ctfHud.classList.add('hidden');
  waveHud.classList.add('hidden');
  brHud.classList.add('hidden');

  if (state.gameMode === 'freeplay') {
    gamemodeHud.classList.add('hidden');
    return;
  }

  gamemodeHud.classList.remove('hidden');

  switch (state.gameMode) {
    case 'deathmatch':
      dmHud.classList.remove('hidden');
      break;
    case 'koth':
      kothHud.classList.remove('hidden');
      break;
    case 'ctf':
      ctfHud.classList.remove('hidden');
      break;
    case 'wave':
      waveHud.classList.remove('hidden');
      break;
    case 'battleroyale':
      brHud.classList.remove('hidden');
      break;
  }

  // Update 3D game mode objects
  updateGameMode3D();
}

// ==================== GAME MODE 3D RENDERING ====================

function updateGameMode3D() {
  // Clean up old objects if mode changed
  if (state.gameMode !== 'koth' && gameModeObjects.kothZone) {
    scene.remove(gameModeObjects.kothZone);
    gameModeObjects.kothZone = null;
  }
  if (state.gameMode !== 'ctf') {
    if (gameModeObjects.ctfRedFlag) {
      scene.remove(gameModeObjects.ctfRedFlag);
      gameModeObjects.ctfRedFlag = null;
    }
    if (gameModeObjects.ctfBlueFlag) {
      scene.remove(gameModeObjects.ctfBlueFlag);
      gameModeObjects.ctfBlueFlag = null;
    }
  }
  if (state.gameMode !== 'battleroyale' && gameModeObjects.brCircle) {
    scene.remove(gameModeObjects.brCircle);
    gameModeObjects.brCircle = null;
  }

  // Create/update objects for current mode
  switch (state.gameMode) {
    case 'koth':
      updateKOTHZone();
      break;
    case 'ctf':
      updateCTFFlags();
      break;
    case 'battleroyale':
      updateBRCircle();
      break;
  }
}

function updateKOTHZone() {
  if (!state.gameModeConfig || !state.gameModeConfig.zonePosition) return;

  const zoneX = state.gameModeConfig.zonePosition.x;
  const zoneZ = state.gameModeConfig.zonePosition.z;
  const zoneRadius = state.gameModeConfig.zoneRadius;

  // Create zone if it doesn't exist
  if (!gameModeObjects.kothZone) {
    const ringGeo = new THREE.RingGeometry(zoneRadius - 0.5, zoneRadius, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    gameModeObjects.kothZone = new THREE.Mesh(ringGeo, ringMat);
    gameModeObjects.kothZone.rotation.x = -Math.PI / 2;
    gameModeObjects.kothZone.position.set(zoneX, 0.1, zoneZ);
    scene.add(gameModeObjects.kothZone);
  }

  // Update zone color based on control
  let color = 0xffffff; // Neutral white
  if (state.gameModeState.controllingTeam === 'red') {
    color = 0xe74c3c;
  } else if (state.gameModeState.controllingTeam === 'blue') {
    color = 0x3498db;
  } else if (state.gameModeState.contested) {
    color = 0xf39c12; // Contested yellow
  }
  gameModeObjects.kothZone.material.color.setHex(color);
}

function createFlagMesh(color) {
  const flagGroup = new THREE.Group();

  // Pole
  const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 2;
  flagGroup.add(pole);

  // Flag cloth
  const flagGeo = new THREE.PlaneGeometry(2, 1.2);
  const flagMat = new THREE.MeshStandardMaterial({
    color: color,
    side: THREE.DoubleSide,
    emissive: color,
    emissiveIntensity: 0.3
  });
  const flag = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(1, 3.4, 0);
  flagGroup.add(flag);

  return flagGroup;
}

function updateCTFFlags() {
  if (!state.gameModeConfig || !state.gameModeState) return;

  const redBase = state.gameModeConfig.redBase;
  const blueBase = state.gameModeConfig.blueBase;

  // Create flags if they don't exist (Red+Green alliance flag at red base, Blue+Yellow at blue base)
  if (!gameModeObjects.ctfRedgreenFlag) {
    gameModeObjects.ctfRedgreenFlag = createFlagMesh(0xe74c3c);
    scene.add(gameModeObjects.ctfRedgreenFlag);
  }
  if (!gameModeObjects.ctfBlueyellowFlag) {
    gameModeObjects.ctfBlueyellowFlag = createFlagMesh(0x3498db);
    scene.add(gameModeObjects.ctfBlueyellowFlag);
  }

  // Update flag positions
  if (state.gameModeState.redgreenFlag) {
    const rf = state.gameModeState.redgreenFlag;
    if (rf.atBase) {
      gameModeObjects.ctfRedgreenFlag.position.set(redBase.x, 0, redBase.z);
    } else {
      gameModeObjects.ctfRedgreenFlag.position.set(rf.position.x, 0, rf.position.z);
    }
    gameModeObjects.ctfRedgreenFlag.visible = true;
  }

  if (state.gameModeState.blueyellowFlag) {
    const bf = state.gameModeState.blueyellowFlag;
    if (bf.atBase) {
      gameModeObjects.ctfBlueyellowFlag.position.set(blueBase.x, 0, blueBase.z);
    } else {
      gameModeObjects.ctfBlueyellowFlag.position.set(bf.position.x, 0, bf.position.z);
    }
    gameModeObjects.ctfBlueyellowFlag.visible = true;
  }
}

function updateBRCircle() {
  if (!state.gameModeState || !state.gameModeState.center) return;

  const center = state.gameModeState.center;
  const currentRadius = state.gameModeState.currentRadius;

  // Create or update circle
  if (!gameModeObjects.brCircle) {
    const circleGeo = new THREE.RingGeometry(currentRadius - 1, currentRadius, 128);
    const circleMat = new THREE.MeshBasicMaterial({
      color: 0x3498db,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    gameModeObjects.brCircle = new THREE.Mesh(circleGeo, circleMat);
    gameModeObjects.brCircle.rotation.x = -Math.PI / 2;
    gameModeObjects.brCircle.position.set(center.x, 0.2, center.z);
    scene.add(gameModeObjects.brCircle);
  } else {
    // Update radius by creating new geometry
    const oldGeo = gameModeObjects.brCircle.geometry;
    gameModeObjects.brCircle.geometry = new THREE.RingGeometry(
      Math.max(0, currentRadius - 1),
      currentRadius,
      128
    );
    oldGeo.dispose();
    gameModeObjects.brCircle.position.set(center.x, 0.2, center.z);
  }
}

// Visual effects for boss special attacks
function createGroundSlamEffect(x, z, radius) {
  // Create expanding ring
  const ringGeo = new THREE.RingGeometry(0.5, radius, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xff4400,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.1, z);
  scene.add(ring);

  // Animate ring expansion
  let scale = 0;
  const animateRing = () => {
    scale += 0.1;
    ring.scale.set(scale, scale, 1);
    ring.material.opacity = 0.7 * (1 - scale);

    if (scale < 1) {
      requestAnimationFrame(animateRing);
    } else {
      scene.remove(ring);
    }
  };
  animateRing();
}

function createRocketBarrageEffect(fromX, fromZ, toX, toZ) {
  // Create multiple rocket trails
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const offsetX = (Math.random() - 0.5) * 10;
      const offsetZ = (Math.random() - 0.5) * 10;
      createHitEffect(new THREE.Vector3(toX + offsetX, 1, toZ + offsetZ), 0xff6600);
    }, i * 100);
  }
}

function createDiveBombEffect(x, z) {
  // Create impact crater effect
  for (let i = 0; i < 15; i++) {
    const angle = (i / 15) * Math.PI * 2;
    const dist = 2 + Math.random() * 4;
    createHitEffect(
      new THREE.Vector3(x + Math.cos(angle) * dist, 0.5, z + Math.sin(angle) * dist),
      0x8800ff
    );
  }
}

// Update boss health bar based on nearby bosses
function updateNearbyBoss() {
  if (!state.isPlaying || state.isDead) {
    hideBossHealthBar();
    return;
  }

  const playerPos = camera.position;
  let nearestBoss = null;
  let nearestDist = 100; // Boss health bar shows within 100 units

  for (const id in state.enemies) {
    const enemy = state.enemies[id];
    if (enemy.isBoss && enemy.health > 0) {
      const dist = Math.sqrt(
        Math.pow(enemy.x - playerPos.x, 2) + Math.pow(enemy.z - playerPos.z, 2)
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestBoss = enemy;
      }
    }
  }

  if (nearestBoss) {
    if (currentBossId !== nearestBoss.id) {
      showBossHealthBar(nearestBoss.id, nearestBoss.type);
    }
    currentBossData = nearestBoss;
    updateBossHealthBar(
      nearestBoss.health,
      nearestBoss.maxHealth,
      nearestBoss.shield || 0,
      nearestBoss.maxShield || 0
    );
  } else if (currentBossId) {
    hideBossHealthBar();
  }
}

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
} // End setupSocketHandlers

// ==================== SCOREBOARD SYSTEM ====================

const playerStats = {}; // { odId: { name, team, kills, deaths } }
let scoreboardVisible = false;

function updateScoreboard() {
  const tbody = document.getElementById('scoreboard-body');
  if (!tbody) return;

  // Build list of all players including self
  const allPlayers = [];

  // Add self
  const myId = socket ? socket.id : 'local';
  allPlayers.push({
    id: myId,
    name: state.playerName,
    team: state.team,
    kills: state.kills,
    deaths: state.deaths,
    isYou: true
  });

  // Add other players from playerStats
  for (const id in playerStats) {
    if (id !== myId) {
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

  // Draw game mode zones
  if (state.gameMode === 'koth' && state.gameModeConfig) {
    // King of the Hill zone
    const zonePos = worldToMinimap(
      state.gameModeConfig.zonePosition.x,
      state.gameModeConfig.zonePosition.z
    );
    const zoneRadius = (state.gameModeConfig.zoneRadius / MINIMAP_RANGE) * MINIMAP_SIZE;

    // Zone color based on control
    let zoneColor = 'rgba(255, 255, 255, 0.3)'; // Neutral
    if (state.gameModeState.controllingTeam === 'red') {
      zoneColor = 'rgba(231, 76, 60, 0.4)';
    } else if (state.gameModeState.controllingTeam === 'blue') {
      zoneColor = 'rgba(52, 152, 219, 0.4)';
    } else if (state.gameModeState.contested) {
      zoneColor = 'rgba(243, 156, 18, 0.4)';
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(zonePos.x, zonePos.y, zoneRadius, 0, Math.PI * 2);
    ctx.fillStyle = zoneColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  if (state.gameMode === 'ctf' && state.gameModeState) {
    // Draw flag bases and current flag positions
    const redBase = worldToMinimap(
      state.gameModeConfig.redBase.x,
      state.gameModeConfig.redBase.z
    );
    const blueBase = worldToMinimap(
      state.gameModeConfig.blueBase.x,
      state.gameModeConfig.blueBase.z
    );

    // Draw base markers
    ctx.save();
    // Red base
    ctx.beginPath();
    ctx.arc(redBase.x, redBase.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
    ctx.fill();
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Blue base
    ctx.beginPath();
    ctx.arc(blueBase.x, blueBase.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
    ctx.fill();
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw flags if they're not at base
    if (state.gameModeState.redFlag && !state.gameModeState.redFlag.atBase) {
      const flagPos = worldToMinimap(
        state.gameModeState.redFlag.position.x,
        state.gameModeState.redFlag.position.z
      );
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(flagPos.x, flagPos.y - 6);
      ctx.lineTo(flagPos.x + 5, flagPos.y - 3);
      ctx.lineTo(flagPos.x, flagPos.y);
      ctx.closePath();
      ctx.fill();
    }

    if (state.gameModeState.blueFlag && !state.gameModeState.blueFlag.atBase) {
      const flagPos = worldToMinimap(
        state.gameModeState.blueFlag.position.x,
        state.gameModeState.blueFlag.position.z
      );
      ctx.fillStyle = '#3498db';
      ctx.beginPath();
      ctx.moveTo(flagPos.x, flagPos.y - 6);
      ctx.lineTo(flagPos.x + 5, flagPos.y - 3);
      ctx.lineTo(flagPos.x, flagPos.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  if (state.gameMode === 'battleroyale' && state.gameModeState) {
    // Battle Royale circle
    const centerPos = worldToMinimap(
      state.gameModeState.center.x,
      state.gameModeState.center.z
    );
    const currentRadius = (state.gameModeState.currentRadius / MINIMAP_RANGE) * MINIMAP_SIZE;
    const targetRadius = (state.gameModeState.targetRadius / MINIMAP_RANGE) * MINIMAP_SIZE;

    ctx.save();
    // Draw target radius (thinner, dashed)
    if (targetRadius < currentRadius) {
      ctx.beginPath();
      ctx.arc(centerPos.x, centerPos.y, targetRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw current radius
    ctx.beginPath();
    ctx.arc(centerPos.x, centerPos.y, currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
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

  // Draw UAV indicator when active
  if (state.uavActive) {
    ctx.save();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(MINIMAP_CENTER, MINIMAP_CENTER, MINIMAP_CENTER - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Draw enemies (red dots) - show all when UAV is active
  for (const id in state.enemies) {
    const enemy = state.enemies[id];
    if (enemy.data.health <= 0) continue;

    const pos = worldToMinimap(enemy.data.x, enemy.data.z);
    const dist = Math.sqrt(Math.pow(pos.x - MINIMAP_CENTER, 2) + Math.pow(pos.y - MINIMAP_CENTER, 2));

    // Show enemies on minimap if close enough OR if UAV is active
    if (dist < MINIMAP_CENTER - 5 || state.uavActive) {
      // Clamp position to minimap bounds when UAV is active
      let drawX = pos.x;
      let drawY = pos.y;
      if (dist >= MINIMAP_CENTER - 5) {
        const angle = Math.atan2(pos.y - MINIMAP_CENTER, pos.x - MINIMAP_CENTER);
        const clampDist = MINIMAP_CENTER - 8;
        drawX = MINIMAP_CENTER + Math.cos(angle) * clampDist;
        drawY = MINIMAP_CENTER + Math.sin(angle) * clampDist;
      }

      // Color based on enemy type (cyan tint when UAV active)
      if (state.uavActive) {
        ctx.fillStyle = '#00ffff';
      } else {
        switch (enemy.data.type) {
          case 'heavy': ctx.fillStyle = '#990000'; break;
          case 'scout': ctx.fillStyle = '#ff6600'; break;
          default: ctx.fillStyle = '#ff0000';
        }
      }
      ctx.beginPath();
      ctx.arc(drawX, drawY, 3, 0, Math.PI * 2);
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

  // Draw supply drops (gold star)
  for (const id in supplyDrops) {
    const drop = supplyDrops[id];
    if (drop.collected) continue;

    const pos = worldToMinimap(drop.x, drop.z);
    const dist = Math.sqrt(Math.pow(pos.x - MINIMAP_CENTER, 2) + Math.pow(pos.y - MINIMAP_CENTER, 2));

    if (dist < MINIMAP_CENTER - 5) {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
        const x = Math.cos(angle) * 5;
        const y = Math.sin(angle) * 5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
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

// Cached DOM elements for game loop performance
const cachedVehiclePrompt = document.getElementById('vehicle-prompt');
const cachedLootPrompt = document.getElementById('loot-prompt');
const cachedDoorPrompt = document.getElementById('door-prompt');
const cachedFpsCounter = document.getElementById('fps-counter');
const cachedRenderStats = document.getElementById('render-stats');

// Performance stats visibility (toggle with F3)
let performanceStatsVisible = true;

function togglePerformanceStats() {
  performanceStatsVisible = !performanceStatsVisible;
  if (cachedFpsCounter) cachedFpsCounter.style.display = performanceStatsVisible ? 'block' : 'none';
  if (cachedRenderStats) cachedRenderStats.style.display = performanceStatsVisible ? 'block' : 'none';
}

// FPS tracking
let fpsFrames = 0;
let fpsLastTime = performance.now();
let fpsDisplay = 0;

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function updateFpsCounter() {
  fpsFrames++;
  const now = performance.now();
  const elapsed = now - fpsLastTime;

  // Update every 500ms for smoother display
  if (elapsed >= 500) {
    fpsDisplay = Math.round((fpsFrames * 1000) / elapsed);
    fpsFrames = 0;
    fpsLastTime = now;

    cachedFpsCounter.textContent = `FPS: ${fpsDisplay}`;

    // Color code based on performance
    cachedFpsCounter.classList.remove('low', 'medium');
    if (fpsDisplay < 30) {
      cachedFpsCounter.classList.add('low');
    } else if (fpsDisplay < 50) {
      cachedFpsCounter.classList.add('medium');
    }

    // Update render stats
    const calls = renderer.info.render.calls;
    const triangles = renderer.info.render.triangles;
    cachedRenderStats.textContent = `Draw: ${calls} | Tri: ${formatNumber(triangles)}`;
  }
}

// Throttling and cached proximity results
let proximityCheckFrame = 0;
let minimapFrame = 0;
let portalFrame = 0;
let cachedNearVehicle = null;
let cachedNearLoot = null;
let cachedNearDoor = null;

function animate() {
  requestAnimationFrame(animate);
  updateFpsCounter();

  const delta = clock.getDelta();

  // Update death animation if dying
  if (state.isDying) {
    updateDeathAnimation(delta);
  }

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

  if (state.isPlaying && !state.isPaused && !state.isDead) {
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

      // Calculate new position
      const moveForward = forward.clone().multiplyScalar(-state.velocity.z * delta);
      const moveRight = right.clone().multiplyScalar(state.velocity.x * delta);

      const newX = camera.position.x + moveForward.x + moveRight.x;
      const newZ = camera.position.z + moveForward.z + moveRight.z;

      // Check collision and apply movement
      if (!checkBuildingCollision(newX, newZ)) {
        camera.position.x = newX;
        camera.position.z = newZ;
      } else {
        // Try sliding along walls - check X and Z separately
        if (!checkBuildingCollision(newX, camera.position.z)) {
          camera.position.x = newX;
        }
        if (!checkBuildingCollision(camera.position.x, newZ)) {
          camera.position.z = newZ;
        }
      }

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

  // Update weather effects
  updateWeather(delta);

  // Throttle proximity checks - only run every 5 frames
  proximityCheckFrame = (proximityCheckFrame + 1) % 5;
  if (proximityCheckFrame === 0) {
    // Show/hide vehicle prompt when near a vehicle
    if (cachedVehiclePrompt && state.isPlaying && !state.isPaused && !state.inVehicle) {
      cachedNearVehicle = getNearestVehicle(camera.position);
      if (cachedNearVehicle) {
        const vehicleTypeName = cachedNearVehicle.type === 'aircraft' ? 'aircraft' :
                                cachedNearVehicle.type === 'motorcycle' ? 'motorcycle' : 'vehicle';
        cachedVehiclePrompt.innerHTML = `Press <span>E</span> to enter ${vehicleTypeName}`;
      }
      cachedVehiclePrompt.classList.toggle('visible', cachedNearVehicle !== null);
    } else if (cachedVehiclePrompt) {
      cachedVehiclePrompt.classList.remove('visible');
    }

    // Show/hide loot prompt when near a crate
    if (cachedLootPrompt && state.isPlaying && !state.isPaused && !state.inVehicle) {
      cachedNearLoot = getNearestLootContainer(camera.position);
      cachedLootPrompt.classList.toggle('visible', cachedNearLoot !== null);
    } else if (cachedLootPrompt) {
      cachedLootPrompt.classList.remove('visible');
    }

    // Show/hide door prompt when near a door
    if (cachedDoorPrompt && state.isPlaying && !state.isPaused && !state.inVehicle) {
      cachedNearDoor = getNearestDoor(camera.position);
      if (cachedNearDoor) {
        cachedDoorPrompt.innerHTML = cachedNearDoor.isOpen ?
          'Press <span>E</span> to close door' :
          'Press <span>E</span> to open door';
      }
      cachedDoorPrompt.classList.toggle('visible', cachedNearDoor !== null);
    } else if (cachedDoorPrompt) {
      cachedDoorPrompt.classList.remove('visible');
    }
  }

  // Apply screen shake
  updateScreenShake(camera);

  // Throttle minimap update - every 2 frames
  minimapFrame = (minimapFrame + 1) % 2;
  if (minimapFrame === 0) {
    updateMinimap();
  }

  // Update pickups (animation and collection)
  updatePickups();

  // Update supply drops
  updateSupplyDrops();

  // Update UAV timer
  if (state.uavActive && Date.now() > state.uavEndTime) {
    state.uavActive = false;
    showPickupMessage('UAV Expired', '#00ffff');
  }

  // Update weapon pickups
  updateWeaponPickups();

  // Update doors (animation)
  updateDoors(delta);

  // Check for nearby NPCs
  if (typeof checkNearbyNPCs === 'function') checkNearbyNPCs();

  // Throttle portal update - every 3 frames
  portalFrame = (portalFrame + 1) % 3;
  if (portalFrame === 0) {
    updatePortal();
  }

  renderer.render(scene, camera);
}

// Initialize displays
updateHealth();
updateAmmoDisplay();
updateWeaponDisplay();

// Load saved attachment data from localStorage
loadAttachmentData();

// Load saved server address from localStorage
const savedServerAddress = localStorage.getItem('combatServerAddress');
if (savedServerAddress) {
  document.getElementById('server-address').value = savedServerAddress;
}

// Finish loading and show main menu
updateLoadingProgress(100, 'Ready!');
setTimeout(() => {
  hideLoadingScreen();
}, 300);

animate();
