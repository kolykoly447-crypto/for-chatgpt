# Portal Nova

An original first-person portal-puzzle prototype built with Godot 4.7.2. It uses procedural geometry and original code; it does not include Portal game assets, maps, audio, or other proprietary content.

## Controls

- WASD — move
- Space — jump
- Left mouse button — place blue portal
- Right mouse button — place orange portal
- E — pick up / release the energy cube in Chamber 03
- Esc — release the mouse cursor
- R — reset your position

## Play locally

Open this folder in Godot 4.7.2 and press F6/F5.

## Build on GitHub

Every push that changes files under `PortalNova/` starts the workflow at `.github/workflows/build-portal-nova.yml`. You can also run it manually from the repository's Actions tab.

When the workflow succeeds, open its run, scroll to **Artifacts**, and download **PortalNova-Windows-x86_64**. Extract the downloaded ZIP and run `PortalNova.exe`.

This is an early playable prototype, not a finished commercial-scale game. Portal rendering and physics are simplified and additional puzzles, sound, animations, save slots, and polish remain to be implemented.
