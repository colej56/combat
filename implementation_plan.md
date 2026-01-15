# Combat - Implementation Plan (Browser Game)

## Game Overview
Combat is a 3D first-person multiplayer browser game featuring boss fights, aerial dogfights, team-based PvP, AI enemies, and a loot-driven progression system.

---

## Tech Stack (Browser-Based)

### Frontend
- **3D Engine**: Three.js or Babylon.js (WebGL-based)
- **Language**: TypeScript
- **Build Tool**: Vite or Webpack
- **Audio**: Howler.js or Web Audio API

### Backend
- **Server**: Node.js with Express
- **Real-time**: Socket.io or WebSocket API
- **Database**: SQLite (local file-based)
- **Authentication**: JWT tokens

### Local Development
- **Frontend**: Vite dev server (localhost:5173)
- **Backend**: Node.js server (localhost:3000)
- **Database**: SQLite (file-based, no setup required)

---

## Phase 1: Core Foundation

### 1.1 Project Setup
- Initialize Node.js project with TypeScript
- Set up Three.js or Babylon.js
- Configure Vite for fast development
- Set up project structure

```
combat/
├── client/
│   ├── src/
│   │   ├── game/
│   │   ├── player/
│   │   ├── weapons/
│   │   ├── vehicles/
│   │   ├── ai/
│   │   ├── ui/
│   │   └── networking/
│   ├── assets/
│   └── index.html
├── server/
│   ├── src/
│   │   ├── game/
│   │   ├── networking/
│   │   └── database/
│   └── package.json
└── shared/
    └── types/
```

### 1.2 Player System
- First-person camera with pointer lock API
- WASD movement + mouse look
- Player health system (death at 0 health)
- Basic collision detection
- Player model for other players to see

### 1.3 Networking Foundation
- Socket.io server setup
- Player connection/disconnection handling
- Position synchronization
- Client-side prediction
- Server reconciliation

---

## Phase 2: Combat Systems

### 2.1 Weapons System
- Raycasting for shooting
- Weapon classes:
  - Pistol (starter weapon)
  - Rifle
  - Shotgun
  - Sniper
- Ammunition tracking
- Reload mechanics
- Weapon switching (1-4 keys)

### 2.2 Combat Mechanics
- Server-authoritative hit detection
- Damage calculation
- Health synchronization
- Death handling and respawn
- Kill notifications

---

## Phase 3: World & Environment

### 3.1 Map System
- 3D map using glTF/GLB models
- Minimap canvas overlay
- Map given at game start
- Portal location marker

### 3.2 Buildings & Loot
- Searchable building interiors
- Loot spawn points
- Collectibles:
  - Guns
  - Ammunition
  - Food (health restore)
- Pickup interactions (E key)

---

## Phase 4: Vehicles

### 4.1 Ground Vehicles
- Cars and motorcycles
- Basic vehicle physics
- Enter/exit mechanics (F key)
- Vehicle damage system
- Passenger seats for teams

### 4.2 Vehicle Placement
- Scattered spawn points
- Vehicle respawn timer

---

## Phase 5: AI Enemies

### 5.1 Enemy AI
- Patrol state machine
- Player detection
- Combat behavior
- Pathfinding (navmesh or waypoints)

### 5.2 Boss Fights
- Boss encounters with phases
- Unique attack patterns
- Health bars
- Loot drops on defeat

---

## Phase 6: Aerial Combat

### 6.1 Aircraft
- Simple flight controls
- Aerial weapons
- Dogfight zones in sky
- Aircraft spawn points

---

## Phase 7: Team System

### 7.1 Teams
- Create/join team
- Team chat
- Team markers/pings
- Shared spawn points

### 7.2 Team vs Team
- PvP encounters
- Team identification (colors/names)

---

## Phase 8: Tasks & Progression

### 8.1 Task System
- Active tasks list
- Objectives (kill, collect, reach)
- Task completion rewards

### 8.2 Portal Goal
- Journey to portal
- Victory condition

---

## Phase 9: UI (HTML/CSS Overlay)

### 9.1 HUD Elements
- Health bar
- Ammo counter
- Minimap
- Crosshair
- Inventory hotbar
- Team list

### 9.2 Menus
- Main menu
- Pause menu
- Inventory screen
- Death screen
- Settings

---

## Phase 10: Audio & Polish

### 10.1 Audio (Howler.js)
- Gunshots
- Footsteps
- Vehicle sounds
- Ambient sounds
- Background music

### 10.2 Visual Effects
- Muzzle flash (sprites)
- Bullet impacts
- Explosions (particles)
- Damage screen effect

---

## Phase 11: Local Setup & Running

### 11.1 Running Locally
```bash
# Terminal 1 - Start the server
cd server
npm run dev
# Server runs on http://localhost:3000

# Terminal 2 - Start the client
cd client
npm run dev
# Client runs on http://localhost:5173
```

### 11.2 LAN Multiplayer
- Find your local IP (e.g., 192.168.1.x)
- Other players connect to http://YOUR_IP:5173
- Server handles connections on port 3000

### 11.3 Optimization
- Asset compression
- Texture atlases
- Level of detail (LOD)
- Network optimization

---

## Development Order (Recommended)

1. **Week 1**: Project setup, basic 3D scene, player movement
2. **Week 2**: Multiplayer networking, player sync
3. **Week 3**: Weapons and shooting
4. **Week 4**: Map, buildings, loot system
5. **Week 5**: Vehicles
6. **Week 6**: AI enemies
7. **Week 7**: Teams and tasks
8. **Week 8**: Boss fights, aerial combat
9. **Week 9**: UI polish, audio
10. **Week 10**: Testing, optimization, LAN play

---

## Getting Started

```bash
# Create project structure
mkdir -p client/src server/src shared

# Initialize client
cd client
npm init -y
npm install three typescript vite
npm install -D @types/three

# Initialize server
cd ../server
npm init -y
npm install express socket.io
npm install -D typescript @types/node @types/express
```

---

## Browser Limitations to Consider

- **Performance**: Target 30-60 FPS, reduce polygon count
- **Memory**: Keep assets under 100MB total
- **Mobile**: Consider touch controls later
- **Audio**: Requires user interaction to start
- **Networking**: WebSocket latency varies by connection
