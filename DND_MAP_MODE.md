# The Annals — D&D Custom Map Mode Documentation

This document outlines the architectural changes, code hooks, and user interfaces added to **The Annals** to support custom map loading and settlement placement (e.g. for D&D campaigns) while keeping the dynastic, economic, and historical simulation engines procedural.

These changes are committed on the branch: **`dnd-custom-map`**.

---

## 1. Feature Architecture Overview

The core simulation builds on a global world object `W` containing a heightfield grid `W.H` (size $512 \times 512 = 262,144$ elements) and a settlements list `W.settlements`. 

Under default behavior, these are generated randomly based on a numeric seed. The **D&D Custom Map Mode** overrides the terrain generation (`genTerrain`) and settlement choosing (`genSettlements`) steps using a global window object **`window.CUSTOM_MAP_DATA`**. 

If `window.CUSTOM_MAP_DATA` is populated:
1. `genTerrain` copies the custom heightfield to `W.H`.
2. `genHydrology` selects river source points by identifying the highest elevations on the custom map instead of using a randomized central mountain spine.
3. `genSettlements` places cities exactly at the coordinates specified by the user.
4. Subsequent procedural steps (biomes, road pathfinding, city layouts, 3D mesh building, economy, dynasties, and the chronicle) run natively on top of the custom data.

---

## 2. Code Hooks & Modified Functions

All changes reside inside [index.html](file:///home/princexizor/Documents/coding/annals-kingdom/index.html).

### A. Terrain Override ([genTerrain](file:///home/princexizor/Documents/coding/annals-kingdom/index.html#L739))
```javascript
function genTerrain(){
  if(window.CUSTOM_MAP_DATA && window.CUSTOM_MAP_DATA.H){
    W.H = new Float32Array(window.CUSTOM_MAP_DATA.H);
    W.hasCoast = window.CUSTOM_MAP_DATA.hasCoast !== undefined ? window.CUSTOM_MAP_DATA.hasCoast : true;
    W.coastEdge = window.CUSTOM_MAP_DATA.coastEdge !== undefined ? window.CUSTOM_MAP_DATA.coastEdge : 0;
    W.spine = { ax: -2000, az: -2000, bx: 2000, bz: 2000 };
    W.climate = 0;
    return;
  }
  // ... standard procedural terrain logic ...
}
```

### B. Hydrology Adaption ([genHydrology](file:///home/princexizor/Documents/coding/annals-kingdom/index.html#L921))
To make rivers flow naturally down custom maps, the river headwaters picker scans `W.H` for local peaks rather than relying on the default central ridge line:
```javascript
  let walks = [];
  if (window.CUSTOM_MAP_DATA && window.CUSTOM_MAP_DATA.H) {
    const candidates = [];
    for(let iz=20; iz<N-20; iz+=8) {
      for(let ix=20; ix<N-20; ix+=8) {
        const i = idx(ix, iz);
        candidates.push({ix, iz, h: H[i]});
      }
    }
    candidates.sort((a,b)=>b.h-a.h);
    const sources = [];
    for(const c of candidates) {
      if(sources.length >= 6) break;
      if(c.h < 35) break; // Minimum elevation threshold
      let ok = true;
      for(const s of sources) {
        if(Math.hypot(c.ix-s.ix, c.iz-s.iz) < 90) { ok = false; break; }
      }
      if(ok) sources.push(c);
    }
    // ... run riverWalk on these sources ...
  } else {
    // ... standard randomized spine river walk ...
  }
```

### C. Settlement Placement Override ([genSettlements](file:///home/princexizor/Documents/coding/annals-kingdom/index.html#L1047))
Reads coordinates from `window.CUSTOM_MAP_DATA.settlements`, converts grid pixel coordinates to 3D world meters, flattens town pads, and finds the highest local spot within a capital city's bounds to place its keep:
```javascript
function genSettlements(){
  if(window.CUSTOM_MAP_DATA && window.CUSTOM_MAP_DATA.settlements){
    const sets = [];
    const R2 = W.rng.gen;
    window.CUSTOM_MAP_DATA.settlements.forEach(s => {
      const x = s.gridX !== undefined ? gridToWorld(s.gridX) : (s.x !== undefined ? s.x : 0);
      const z = s.gridZ !== undefined ? gridToWorld(s.gridZ) : (s.z !== undefined ? s.z : 0);
      const pop = s.pop || (s.kind==='capital' ? ri(R2,2100,2900) : s.kind==='town' ? ri(R2,420,1150) : ri(R2,60,290));
      const rad = s.kind==='capital' ? 265 : s.kind==='town' ? 120 + pop*0.055 : 42 + pop*0.09;
      sets.push({
        name: s.name || NAME.place(W.rng.gen, s.kind==='capital'),
        kind: s.kind || 'village',
        x, z, pop, R: rad, harbor: !!s.harbor,
        fieldAng: rr(R2, 0, Math.PI),
        entries: [], streets: [], buildings: [], y: 0
      });
    });
    W.settlements = sets;
    W.realmName = sets[0] ? sets[0].name : "Custom Realm";
    // ... flatten pads and locate keeps ...
    return;
  }
  // ... standard procedural candidate scoring ...
}
```

---

## 3. Coordinate Systems

* **Grid Dimensions ($N$):** $512 \times 512$ cells.
  * Grid bounds: $0 \le \text{gridX}, \text{gridZ} < 512$.
* **World Dimensions ($W\_SIZE$):** $6000 \times 6000$ meters.
  * World bounds: $-3000 \le x, z \le 3000$.
* **Coordinate Conversion Formulas:**
  * Grid-to-World: `x = (gridX / 511 - 0.5) * 6000`
  * World-to-Grid: `gridX = clamp((x / 6000 + 0.5) * 511, 0, 511)`

---

## 4. UI Elements

* **ledger world tab (lines 345–352):**
  * Added file uploader (`#dndHeightmapFile`) for grayscale heightmap images.
  * Added text area (`#dndSettlementsText`) for copy-pasting city JSON strings.
  * Added **Forge D&D Realm** (`#btnLoadDnd`) and **Clear** (`#btnClearDnd`) buttons.
* **UI Handlers in `initUI` (lines 5795–5800):**
  * `#btnLoadDnd` uses `FileReader` and an offscreen canvas to scale and sample the uploaded image to a 2D $512 \times 512$ array.
  * Average grayscale value `pv = (r+g+b)/3` is calculated.
  * Altitude mapping: `H[i] = (pv - 40) * 4.0`. Values below `40` produce negative heights (ocean beds), while `40` represents exactly sea level.
  * `#btnClearDnd` sets `window.CUSTOM_MAP_DATA = null` to revert back to fully random procedural generation.

---

## 5. Settlement JSON Schema

The text area parses a standard JSON array of objects with the following properties:

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Name of the settlement. |
| `kind` | `string` | Yes | Type of settlement. Options: `"capital"`, `"town"`, or `"village"`. |
| `gridX` | `number` | Yes | Grid pixel coordinate on the X-axis ($0$ to $511$). |
| `gridZ` | `number` | Yes | Grid pixel coordinate on the Z-axis ($0$ to $511$). |
| `pop` | `number` | No | Initial population size. If omitted, defaults to a seed-randomized range matching the settlement's type. |
| `harbor` | `boolean` | No | If `true`, plans harbor piers if close to water. Defaults to `false`. |

Example:
```json
[
  {"name": "Alenais City", "kind": "capital", "gridX": 51, "gridZ": 174},
  {"name": "Mishimbril", "kind": "town", "gridX": 196, "gridZ": 171}
]
```
