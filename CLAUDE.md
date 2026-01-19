# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Game (requires two terminals)

**Server:**
```bash
cd server && npm start
# Runs on http://localhost:3000
```

**Client:**
```bash
cd client && npm run dev
# Runs on http://localhost:5173 (or next available port)
```

### Building for Production
```bash
cd client && npm run build
```

## Architecture

Combat is a browser-based 3D multiplayer first-person shooter with client-server architecture.

### Client (`client/`)
- **Three.js** for 3D rendering (WebGL)
- **Socket.io-client** for real-time networking
- **Vite** for development/build tooling
- Single entry point: `src/main.js` contains all game logic

### Server (`server/`)
- **Express** + **Socket.io** for WebSocket-based multiplayer
- **Server-authoritative AI**: Enemy behavior runs entirely on server
- Single entry point: `src/index.js`
- 60 tick/second game loop for AI updates

## Game Features

### Controls
- **WASD** - Movement
- **Mouse** - Look around
- **Shift** - Sprint
- **Space** - Jump
- **Left Click** - Shoot
- **R** - Reload
- **G** - Throw grenade (hold to increase distance, release to throw)
- **V** - Melee knife attack (bonus damage from behind)
- **1/2/3/4** - Switch weapons (Pistol/Rifle/Shotgun/Sniper)
- **E** - Enter/exit vehicles, search loot crates
- **F** - Toggle flashlight
- **P** - Deploy parachute (when falling from aircraft)
- **T** - All chat
- **Y** - Team chat
- **Tab** - Inventory (weapon attachments)
- **ESC** - Pause menu

### Day/Night Cycle
- Full cycle in ~2 minutes
- Dynamic sky colors and lighting
- Time periods: midnight, dawn, sunrise, morning, noon, afternoon, sunset, dusk, night
- Flashlight useful during night

### Combat System
- Four weapons: Pistol, Rifle, Shotgun, Sniper
- Three enemy types: Soldier, Scout, Heavy
- Three boss types: Tank Boss, Mech Boss, Sky Boss
- PvP and PvE damage
- Health pickups (+50 HP) and ammo crates (+30 ammo)
- Death animation with camera fall and grayscale effect
- Respawn after 3-second countdown on death

### Weapon Attachments
Unlock attachments by getting kills with each weapon. Press Tab to open the inventory and equip attachments.

| Attachment | Effect | Kills Required |
|------------|--------|----------------|
| Scope | -30% spread, +1.5x zoom | 10 |
| Silencer | -50% muzzle flash, -40% sound, +10% spread | 15 |
| Extended Mag | +50% magazine size | 20 |
| Grip | -25% spread, -10% recoil | 25 |
| Laser Sight | -20% spread | 30 |

**Weapon Compatibility:**
- Pistol: Silencer, Extended Mag, Laser Sight
- Rifle: All attachments
- Shotgun: Extended Mag, Grip, Laser Sight
- Sniper: Scope, Silencer, Extended Mag

Progress is saved to localStorage.

### Boss Fights
- **Tank Boss**: 800 HP, ground-based, slow but devastating ground slam attack, enrages at 25% HP
- **Mech Boss**: 600 HP, bipedal robot with regenerating shields, fires rocket barrages
- **Sky Boss**: 500 HP, aerial boss with dive bomb attacks, found in sky areas
- Boss health bar appears when nearby
- Bosses drop guaranteed loot on defeat (weapons, ammo, health)
- 5-minute respawn timer after defeat

### Multiplayer
- Teams: None, Red, Blue
- Team chat and all chat
- Scoreboard with kills/deaths/K/D ratio
- Kill feed notifications

### World
- Infinite procedural terrain with chunk-based generation
- Seeded random for deterministic world
- Trees, rocks, buildings, and structures
- Streets with streetlights and parked cars (sedans, trucks, sports cars)
- Minimap showing players, enemies, vehicles, pickups, and portal

### Vehicles
- **Jeep**: Max speed 60, balanced handling
- **Motorcycle**: Max speed 90, faster acceleration, sharper turning
- **Aircraft**: Flight controls, spacebar to ascend, shift to descend, parachute on exit (P key)
- Ground vehicles spawn near origin and in chunks
- Aircraft spawn at designated airfields

### Portal/Victory
- Portal located at (100, 6, 100) marked on minimap
- Distance indicator shows how far to portal
- Enter portal to trigger victory screen
- Victory displays stats (kills, deaths, time survived)

### Client-Server Communication
- `move`: Player position updates
- `shoot`/`playerShoot`: Weapon fire events
- `hit`/`hitEnemy`: Damage events (PvP and PvE)
- `enemies`: Server broadcasts all enemy states each tick (includes bosses)
- `enemyAttack`/`playerDeath`: Combat result events
- `bossDeath`/`bossEnrage`/`bossSpecialAttack`/`bossShieldHit`: Boss combat events
- `setPlayerInfo`: Player name, team, difficulty
- `enterVehicle`/`exitVehicle`/`vehicleUpdate`: Vehicle sync
- `chat`: Chat messages

### Game State Flow
1. Main menu -> enter name/team/difficulty -> Start Game -> pointer lock -> playing
2. ESC during play -> pause menu
3. Death -> camera fall animation -> grayscale effect -> death screen -> 3 second respawn countdown -> respawn
4. Victory -> enter portal -> victory screen with stats
5. Quit to menu -> release pointer lock -> back to main menu
