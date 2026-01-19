# Combat

A browser-based 3D multiplayer first-person shooter built with Three.js and Socket.io.

![Combat Game](https://img.shields.io/badge/Game-FPS-red) ![Three.js](https://img.shields.io/badge/Three.js-WebGL-blue) ![Multiplayer](https://img.shields.io/badge/Multiplayer-Socket.io-green)

## Features

### Combat
- **4 Weapons**: Pistol, Rifle, Shotgun, Sniper - each with unique stats
- **Weapon Attachments**: Unlock scopes, silencers, extended mags, grips, and laser sights through kills
- **Grenades**: Hold G to aim with trajectory preview, release to throw
- **Melee**: Quick knife attack with V key, bonus damage for backstabs
- **Kill Streaks**: UAV and Airstrike rewards

### Enemies & Bosses
- **Enemy Types**: Soldiers, Scouts, and Heavies with squad-based AI
- **3 Bosses**: Tank Boss, Mech Boss (with shields), and Sky Boss
- Boss health bars, special attacks, and guaranteed loot drops

### World
- Infinite procedural terrain with chunk-based generation
- Buildings, trees, rocks, and streets with parked cars
- Dynamic day/night cycle (~2 minute full cycle)
- Weather system: Clear, Rain, Fog, Sandstorm

### Vehicles
- **Jeep**: Balanced ground vehicle
- **Motorcycle**: Fast with sharp handling
- **Aircraft**: Full flight controls with parachute bailout

### Multiplayer
- Real-time multiplayer with teams (Red, Blue, Green, Yellow)
- Team and all chat
- Kill feed and scoreboard
- PvP and PvE combat

### Progression
- XP and leveling system with unlockable perks
- Shop system with kill points currency
- Weapon skins, character skins, and permanent upgrades
- Progress saved to localStorage

### NPCs & Quests
- Interactive NPCs with dialogue system
- Quest system with objectives and rewards

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/combat.git
cd combat
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

### Running the Game

You need two terminals:

**Terminal 1 - Server:**
```bash
cd server
npm start
# Server runs on http://localhost:3000
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

Open your browser to `http://localhost:5173` to play.

### LAN Multiplayer

To play with others on your network:
1. Find your local IP address
2. Start the server
3. Other players enter your IP:3000 in the server address field

## Controls

| Key | Action |
|-----|--------|
| WASD | Movement |
| Mouse | Look around |
| Shift | Sprint |
| Space | Jump |
| Left Click | Shoot |
| R | Reload |
| G | Throw grenade (hold to aim) |
| V | Melee knife attack |
| Q | Quick swap weapon |
| 1/2/3/4 | Switch weapons |
| E | Enter/exit vehicles, interact |
| F | Toggle flashlight |
| P | Deploy parachute |
| T | All chat |
| Y | Team chat |
| Tab | Inventory |
| L | Perks menu |
| ESC | Pause menu |

## Architecture

```
combat/
├── client/                 # Frontend (Three.js + Vite)
│   ├── src/
│   │   └── main.js        # All game logic
│   ├── index.html         # UI and styles
│   └── package.json
├── server/                 # Backend (Express + Socket.io)
│   ├── src/
│   │   └── index.js       # Server logic, AI, game state
│   └── package.json
└── CLAUDE.md              # Development guide
```

### Client
- **Three.js** for 3D rendering (WebGL)
- **Socket.io-client** for real-time networking
- **Vite** for development and building

### Server
- **Express** + **Socket.io** for WebSocket multiplayer
- Server-authoritative AI (enemies run on server)
- 60 tick/second game loop

## Building for Production

```bash
cd client
npm run build
```

Output will be in `client/dist/`.

## License

MIT
