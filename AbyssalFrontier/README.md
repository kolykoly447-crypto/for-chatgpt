# Abyssal Frontier

An original 3D underwater exploration and survival prototype made with Godot 4.7.2. It uses procedural primitive meshes and original scripts; it does not contain Subnautica or Subnautica 2 source code, models, textures, music, story text, or other game files.

## Open and run in Godot

1. Install Godot 4.7.2.
2. Open this project folder in Godot Project Manager.
3. Select the project and press **F5**.

## Build the Windows EXE

The project includes a **Windows Desktop** export preset for 64-bit Windows. Install the matching 4.7.2 export templates, then choose **Project → Export → Windows Desktop** and export AbyssalFrontier.exe.

GitHub Actions also builds the Windows executable automatically when files in this project or its workflow change. Download the AbyssalFrontier-Windows-EXE artifact from the workflow run's **Artifacts** section.

## Current prototype features

- First-person free-swimming movement in a foggy alien ocean.
- A procedurally assembled seabed, glowing coral, and original ambient fauna.
- Three collectible resources: Lumen Shards, Kelp Fiber, and Thermal Ore.
- Oxygen depletion in open water and automatic recharge near the Tideglass Shelter.
- Craftable Oxygen Cells and deployable beacons.
- Simple HUD with oxygen, inventory, and control hints.

## Controls

| Key | Action |
|---|---|
| W A S D | Swim |
| Space | Swim upward |
| X | Swim downward |
| Shift | Boost |
| E | Collect the resource you are looking at |
| C | Craft an Oxygen Cell (3 Lumen Shards + 2 Kelp Fiber) |
| R | Use an Oxygen Cell |
| B | Deploy a beacon (2 Thermal Ore + 1 Lumen Shard) |
| Esc | Release / recapture the mouse |

## Notes

This is a playable starter prototype, not a finished full-scale commercial game. It intentionally uses simple generated geometry so you can replace or expand the art, terrain, creatures, crafting recipes, sound, and progression with original work. No external assets are required.
