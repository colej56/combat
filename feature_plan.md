# Combat - Feature Implementation Plan

Based on `description.md`, this plan identifies missing features and outlines implementation steps.

---

## Current State Analysis

### Already Implemented
- 3D first-person multiplayer game
- Basic AI enemies (Soldier, Scout, Heavy)
- Guns (Pistol, Rifle, Shotgun, Sniper) with ammo and reload
- Team system (Red/Blue teams, team chat)
- Vehicles (Cars, Motorcycles, Aircraft)
- Buildings with loot (searchable crates)
- Minimap
- Portal/goal system
- Health pickups and ammo crates
- Day/night cycle
- Streets with parked cars

### Missing Features (from description.md)
1. **Boss Fights** - Large, challenging enemies with phases
2. **Tasks/Missions** - Objectives for players to complete
3. **Food/Hunger System** - Food items to collect and consume
4. **Enemy Bases** - Hostile AI-controlled locations
5. **Death Animation** - Visual animation when player dies
6. **Aerial Dogfight Zones** - Designated sky combat areas

---

## Feature 1: Boss Fights

### Overview
Large, powerful enemies that spawn in specific locations and require team coordination to defeat.

### Implementation Steps

#### 1.1 Boss Types
Create 3 boss variants:
- **Tank Boss**: Slow, high health (500 HP), heavy damage, ground-based
- **Mech Boss**: Medium speed, shields that regenerate, rocket attacks
- **Sky Boss**: Flying boss for aerial combat, spawns in dogfight zones

#### 1.2 Server Changes (`server/src/index.js`)
```javascript
// Add boss spawning system
const BOSS_SPAWNS = [
  { x: 200, z: 200, type: 'tank', respawnTime: 300000 }, // 5 min respawn
  { x: -200, z: 200, type: 'mech', respawnTime: 300000 },
  { x: 0, z: 300, type: 'sky', respawnTime: 300000 }
];

// Boss state machine: idle -> alert -> combat -> enraged (below 25% HP)
// Boss attack patterns based on phase
```

#### 1.3 Client Changes (`client/src/main.js`)
- `createBossMesh(type)` - Large, detailed boss models
- `updateBoss(boss, delta)` - Boss animations and effects
- Boss health bar UI (large bar at top of screen when in combat)
- Boss loot drops (guaranteed weapon or rare item)

#### 1.4 Files to Modify
| File | Changes |
|------|---------|
| `server/src/index.js` | Boss AI, spawning, combat logic |
| `client/src/main.js` | Boss meshes, animations, health bars |
| `client/index.html` | Boss health bar UI element |

---

## Feature 2: Task/Mission System

### Overview
Players receive objectives that reward XP, weapons, or items upon completion.

### Implementation Steps

#### 2.1 Task Types
- **Kill Tasks**: "Kill 5 enemies", "Defeat the Tank Boss"
- **Collection Tasks**: "Find 3 weapon crates", "Collect 100 ammo"
- **Exploration Tasks**: "Discover enemy base", "Reach the portal"
- **Survival Tasks**: "Survive 2 minutes in the danger zone"

#### 2.2 Task Data Structure
```javascript
const TASKS = [
  { id: 'kill_10', type: 'kill', target: 'enemy', count: 10, reward: { xp: 100, ammo: 50 } },
  { id: 'find_rifle', type: 'collect', target: 'rifle', count: 1, reward: { xp: 50 } },
  { id: 'kill_boss', type: 'kill', target: 'boss', count: 1, reward: { xp: 500, weapon: 'sniper' } },
  { id: 'reach_portal', type: 'explore', target: 'portal', reward: { xp: 1000 } }
];
```

#### 2.3 Client UI
- Task list panel (toggle with `J` key)
- Active task tracker in HUD corner
- Task completion notification
- Reward popup

#### 2.4 Files to Modify
| File | Changes |
|------|---------|
| `client/src/main.js` | Task tracking, progress updates, rewards |
| `client/index.html` | Task list UI, active task HUD |
| `server/src/index.js` | Task state sync for multiplayer |

---

## Feature 3: Food/Hunger System

### Overview
Players have a hunger meter that depletes over time. Food restores hunger and provides buffs.

### Implementation Steps

#### 3.1 Hunger Mechanics
- Hunger meter: 100 max, depletes 1 per 10 seconds
- Below 50 hunger: movement speed reduced 10%
- Below 25 hunger: health regeneration stops
- At 0 hunger: lose 1 HP per 5 seconds

#### 3.2 Food Items
```javascript
const FOOD_ITEMS = {
  apple: { hunger: 15, health: 0, spawnWeight: 0.5 },
  bread: { hunger: 25, health: 5, spawnWeight: 0.3 },
  meat: { hunger: 40, health: 10, spawnWeight: 0.15 },
  feast: { hunger: 100, health: 25, spawnWeight: 0.05 }
};
```

#### 3.3 Food Spawning
- Spawn in building loot containers
- Spawn on tables inside buildings
- Rare spawns in the open world

#### 3.4 Files to Modify
| File | Changes |
|------|---------|
| `client/src/main.js` | Hunger state, food meshes, consumption |
| `client/index.html` | Hunger bar UI next to health bar |

---

## Feature 4: Enemy Bases

### Overview
Fortified locations with multiple AI enemies, loot, and optional boss spawns.

### Implementation Steps

#### 4.1 Base Structure
- Walled compound (20x20 to 40x40 units)
- Guard towers at corners
- Central building with loot room
- 5-10 AI guards that respawn
- Optional boss spawn point

#### 4.2 Base Locations
```javascript
const ENEMY_BASES = [
  { x: 150, z: 150, size: 'small', guards: 5 },
  { x: -180, z: 100, size: 'medium', guards: 8, hasBoss: true },
  { x: 100, z: -200, size: 'large', guards: 12, hasBoss: true }
];
```

#### 4.3 Base Features
- Alarm system: Alerts all guards when player detected
- Searchable loot crates with better drop rates
- Mounted turrets (stationary weapons)
- Base capture mechanic (optional): Clear all enemies to "capture"

#### 4.4 Files to Modify
| File | Changes |
|------|---------|
| `client/src/main.js` | Base meshes, walls, towers, turrets |
| `server/src/index.js` | Base guard AI, alarm system, respawning |

---

## Feature 5: Death Animation

### Overview
Visual feedback when player dies instead of instant respawn screen.

### Implementation Steps

#### 5.1 Animation Sequence
1. Camera shakes on fatal hit
2. Screen goes red, then fades to grayscale
3. Camera slowly falls/tilts to ground (1.5 seconds)
4. "YOU DIED" text fades in
5. Respawn countdown (3 seconds)
6. Screen fades to black, then respawns

#### 5.2 Implementation
```javascript
function playDeathAnimation() {
  state.isDying = true;

  // Phase 1: Camera shake and red flash
  shakeCamera(0.5);
  showDamageOverlay(1.0);

  // Phase 2: Camera fall
  animateCameraFall(1.5, () => {
    // Phase 3: Show death screen
    showDeathScreen();

    // Phase 4: Respawn after delay
    setTimeout(respawnPlayer, 3000);
  });
}
```

#### 5.3 Files to Modify
| File | Changes |
|------|---------|
| `client/src/main.js` | Death animation function, camera effects |
| `client/index.html` | Death overlay CSS animations |

---

## Feature 6: Aerial Dogfight Zones

### Overview
Designated sky areas where aircraft combat is encouraged with bonus rewards.

### Implementation Steps

#### 6.1 Zone Definition
```javascript
const DOGFIGHT_ZONES = [
  { x: 0, z: 0, radius: 100, altitude: { min: 50, max: 150 }, name: 'Central Airspace' },
  { x: 200, z: 200, radius: 80, altitude: { min: 60, max: 120 }, name: 'Eastern Theatre' }
];
```

#### 6.2 Zone Features
- Visual boundary (translucent cylinder or ring)
- Minimap indicator
- Bonus XP for kills in zone
- Sky Boss spawns in zones
- Aircraft ammo pickups floating in zone

#### 6.3 Zone Mechanics
- Enter zone notification
- Kill multiplier (1.5x XP)
- Periodic supply drops (ammo crates parachute down)

#### 6.4 Files to Modify
| File | Changes |
|------|---------|
| `client/src/main.js` | Zone meshes, detection, floating pickups |
| `server/src/index.js` | Zone kill bonuses, supply drop spawning |

---

## Implementation Priority

### High Priority (Core Gameplay)
1. **Death Animation** - Quick win, improves feel
2. **Boss Fights** - Major content addition
3. **Tasks System** - Gives players goals

### Medium Priority (Content)
4. **Enemy Bases** - Adds strategic locations
5. **Dogfight Zones** - Enhances aerial gameplay

### Lower Priority (Polish)
6. **Food/Hunger System** - Adds survival element

---

## Estimated Complexity

| Feature | Complexity | New Code Lines | Files Changed |
|---------|------------|----------------|---------------|
| Death Animation | Low | ~100 | 2 |
| Boss Fights | High | ~400 | 3 |
| Task System | Medium | ~250 | 3 |
| Enemy Bases | High | ~350 | 2 |
| Dogfight Zones | Medium | ~200 | 2 |
| Food System | Medium | ~200 | 2 |

---

## Next Steps

1. Choose a feature to implement first
2. Create detailed technical spec if needed
3. Implement in small, testable increments
4. Test multiplayer synchronization
5. Polish visuals and feedback
