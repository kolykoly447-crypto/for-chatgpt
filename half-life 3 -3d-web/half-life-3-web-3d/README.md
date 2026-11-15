# AFTERSIGNAL — A Black Mesa Incident (3D browser build)

An original, fan-made, retro sci-fi first-person shooter prototype. It is inspired by broad genre conventions and the atmosphere of classic science-fiction shooters, but uses original code, map layout, story, UI and procedural geometry. It is not an official Half-Life product and contains no Valve game assets, dialogue, music or maps.

## Run

This build uses Three.js as an ES module from jsDelivr. An internet connection is required to load Three.js (and optional web fonts).

1. Extract the ZIP.
2. Open a terminal in this folder.
3. Run `python -m http.server 8000`.
4. Visit `http://localhost:8000`.
5. Click **ENTER THE FACILITY**, then click the game view if the mouse is not captured.

Do not open `index.html` directly with `file://`; browsers commonly block JavaScript module imports from local files.

## Controls

- W / S — forward / backward
- A / D — strafe
- Mouse — look
- Left mouse — fire pulse tool
- E — interact
- R — reload energy cells
- Shift — sprint
- Esc — pause / release mouse

## Mission

1. Reach the access terminal in the west lab and press E.
2. Find the security bulkhead near the central passage and press E.
3. Enter the eastern lower wing.
4. Reach the emergency relay and press E.
5. Avoid or disable hostile units. A suit patch is placed in the southwest room.

## Included

- Three.js WebGL renderer with perspective camera, fog, shadow maps, lighting and procedural 3D geometry.
- First-person movement, mouse look, sprint and basic wall collision.
- Pulse weapon with raycast hits, ammo and reload.
- Four simple enemy agents with pursuit and close-range damage.
- Interactable terminal, animated bulkhead, emergency relay and health pickup.
- HUD, health, ammo, objective text, minimap, pause and win/lose screens.

## Known limitations

This is an early 3D vertical slice, not a complete campaign. Enemy AI is simple pursuit rather than cover tactics or squad coordination. Geometry and characters are primitive procedural placeholders, not finished art. There is no voice acting, music, save system, checkpoint system, cinematic sequence, multiplayer or mobile touch control. Full browser runtime testing requires loading the external Three.js module in a browser.
