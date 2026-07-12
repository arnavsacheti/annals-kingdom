# Summary of Changes

We migrated the Annals of the Kingdom simulation engine from a 3D Three.js WebGL renderer to a high-performance 2D Canvas parchment-style map, optimizing the system to support a continent-scale map grid (2048x2048).

## Key Modifications

### 1. 2D Canvas Rendering System
- Removed the Three.js CDN imports from [index.html](file:///home/princexizor/Documents/coding/annals-kingdom/index.html).
- Replaced the Three.js container with `<canvas id="mapCanvas"></canvas>`.
- Implemented `drawMap()` to layer and draw the grayscale heightmap, political borders overlay, rivers, roads, bridges, settlements, active agents, armies, and the dragon.
- Added a night visual filter overlay to simulate the daily cycle without shader materials.
- Styled `#mapCanvas` in CSS to fill the viewport and capture all pointer inputs screen-wide.

### 2. Multi-threaded Pathfinding
- Added `genRoadsPatrinor()` which runs heavy A* pathfinding computations on a background Web Worker thread using an inline Blob script.
- Prevents UI/main-thread lockups during world generation on large 2048x2048 grids.

### 3. Aspect Ratio Correction
- Introduced `W_ASPECT` to handle rectangular maps (e.g. `2.0064` for the 4390x2188 Patrinor heightmap, `1.0` for procedural seeds).
- Updated coordinate mapping functions (`worldToScreen` and `screenToWorld`) to stretch/compress horizontally based on `W_ASPECT`.
- Centered settlements and map rendering at the correct proportional layout.

### 4. Interactive Pan and Zoom Controls
- Re-implemented mouse wheel and gesture zoom, dragging to pan, and click/double-click coordinates picking in 2D space.
- Made the manual controls follow-aware, smoothly transitioning automatic tracking frames only when `CAM.follow` or `CAM.intro` is active.

### 5. Server & Assets Config
- Created [patrinor_settlements.json](file:///home/princexizor/Documents/coding/annals-kingdom/patrinor_settlements.json) with custom town placements and names.
- Configured [server.js](file:///home/princexizor/Documents/coding/annals-kingdom/server.js) to serve PNG and JSON files with proper MIME types.
