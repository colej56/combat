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
- **1/2/3** - Switch weapons (Pistol/Rifle/Shotgun)
- **E** - Enter/exit vehicles
- **F** - Toggle flashlight
- **T** - All chat
- **Y** - Team chat
- **Tab** - Scoreboard
- **ESC** - Pause menu

### Vehicles
- **Jeep**: Max speed 60, balanced handling
- **Motorcycle**: Max speed 90, faster acceleration, sharper turning
- Vehicles spawn near origin and randomly in chunks (40% motorcycle, 60% jeep)
- WASD to drive when in vehicle

### Day/Night Cycle
- Full cycle in ~2 minutes
- Dynamic sky colors and lighting
- Time periods: midnight, dawn, sunrise, morning, noon, afternoon, sunset, dusk, night
- Flashlight useful during night

### Combat System
- Three weapons: Pistol, Rifle, Shotgun
- Three enemy types: Soldier, Scout, Heavy
- PvP and PvE damage
- Health pickups (+50 HP) and ammo crates (+30 ammo)
- Respawn after 3-second countdown on death

### Multiplayer
- Teams: None, Red, Blue
- Team chat and all chat
- Scoreboard with kills/deaths/K/D ratio
- Kill feed notifications

### World
- Infinite procedural terrain with chunk-based generation
- Seeded random for deterministic world
- Trees, rocks, buildings, and structures
- Minimap showing players, enemies, vehicles, pickups

### Client-Server Communication
- `move`: Player position updates
- `shoot`/`playerShoot`: Weapon fire events
- `hit`/`hitEnemy`: Damage events (PvP and PvE)
- `enemies`: Server broadcasts all enemy states each tick
- `enemyAttack`/`playerDeath`: Combat result events
- `setPlayerInfo`: Player name, team, difficulty
- `enterVehicle`/`exitVehicle`/`vehicleUpdate`: Vehicle sync
- `chat`: Chat messages

### Game State Flow
1. Main menu -> enter name/team/difficulty -> Start Game -> pointer lock -> playing
2. ESC during play -> pause menu
3. Death -> 3 second respawn countdown -> respawn with reset position
4. Quit to menu -> release pointer lock -> back to main menu
