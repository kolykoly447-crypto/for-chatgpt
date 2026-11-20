# AFTERSIGNAL — A Black Mesa Incident

An original fan-made retro sci-fi first-person shooter built with HTML, CSS, JavaScript and Three.js. It uses an original story, level layout, interface and procedural geometry. It is not an official Half-Life product and does not contain Valve game code or assets.

## Run in a browser

1. Install Node.js 20 or newer.
2. Open a terminal in this folder and run `npm install`.
3. Start a local web server with `python -m http.server 8000`.
4. Open `http://localhost:8000` in a modern browser.
5. Click **ENTER THE FACILITY** and allow mouse capture.

Three.js is installed as a local dependency. The browser build does not fetch its rendering engine from a CDN.

## Run as a Windows desktop app

1. Run `npm install`.
2. Run `npm start`.

The Electron shell serves the project from a stable local loopback address, so ES modules work correctly, campaign saves remain available between launches, and the game can run without an internet connection.

## Build Windows executables

Run `npm run dist:win` to create an x64 installer and portable executable in `dist/`. The GitHub Actions workflow performs the same build and uploads both executables as an artifact.

## Controls

- W / S — move forward / backward
- A / D — strafe
- Mouse — look
- Left mouse — fire the pulse tool
- E — interact
- R — reload energy cells
- Shift — sprint
- Esc — pause and release the mouse

## Campaign chapters

### Chapter 01 — The Quiet Wing
1. Reach the access terminal in the west lab.
2. Restore power and open the security bulkhead.
3. Reach the emergency relay and activate it to complete the chapter.
4. Avoid or disable hostile units. A suit patch is placed in the southwest room.

Completing Chapter 01 unlocks Chapter 02 and reveals a **NEXT CHAPTER** button.

### Chapter 02 — The Lower Complex
1. Reach the lower access terminal and restore pump-hall power.
2. Open the reinforced pressure bulkhead.
3. Defeat or avoid hostile units, including a heavy Warden.
4. Restore coolant pressure at the valve assembly. This stores a persistent checkpoint.
5. Reach the freight elevator to complete the chapter.

The unlocked chapter and current checkpoint are saved in browser local storage. Restarting Chapter 02 after activating the coolant valve restores the player beyond the bulkhead with the coolant system already stabilized.

## Included in this build

- Two campaign chapters with separate layouts, objectives and chapter progression.
- Three.js WebGL renderer, first-person camera, fog, shadows and procedural industrial geometry.
- WASD movement, mouse look, sprint and wall/crate collision.
- Pulse weapon with ammunition, reload and obstruction-aware raycasts.
- Basic pursuit enemies plus a heavy Warden enemy in Chapter 02.
- Interactable terminals, pressure bulkheads, relay, coolant valve and freight lift.
- HUD, chapter-specific objectives, local map, pause menu and chapter-end screens.
- Saved campaign unlocks and a persistent Chapter 02 checkpoint.

## Current scope

This is an early two-chapter campaign build, not yet the complete campaign. Enemy movement is simple pursuit. Character and environment art are procedural placeholders; additional chapters, advanced enemy tactics, cinematics, voice acting and original music remain future work.
