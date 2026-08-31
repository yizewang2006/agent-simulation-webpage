# Adaptive Space Entity Generation Method

Interactive demo of the adaptive space entity generation algorithm (Figure 1). Agent **A** uses a **360° FOV** to sense neighbors (**A1–A4**, **O1**, **W1**, **W2**) and generates space entities **s1…sN** on the FOV boundary.

## Run

Open `visualization/index.html` in a browser (double-click — no install or server needed).

## Usage

- **Drag A** (red) or any neighbor to see the FOV circle, occupied wedges, key heading rays, and **s1…sN** arrows update live
- **Click an s label** on the FOV to inspect that space entity’s position in the sidebar
- Adjust **FOV radius** and **heading interval** in the sidebar
- Toggle display layers or click **Reset positions**

---

## Display layers (what you see on the canvas)

These three layers are the main visual outputs of the algorithm. Use the Display checkboxes to show or hide each one.

### Occupied wedges (colored areas)

Angular slices of the FOV where something blocks free space from agent **A** (paper Figure 1b).

Within each category, entities whose **occupied wedges overlap** are clustered together, then one wedge is drawn from the **outermost** left/right tangents of that cluster (not one wedge per entity).

| Color | Category | Objects |
|-------|----------|---------|
| Blue | Agents | A1–A4 |
| Red | Circle obstacles | O1 |
| Green | Walls | W1, W2 |

- Agents, obstacles, and walls are each clustered **independently**.
- The sidebar **Occupied wedges (union)** list merges all category envelopes for a compact position dump (FOV start/end points).

Toggle: **Occupied segments (agent / obstacle / wall)**

### Key heading rays (dashed grey)

Radial dashed lines from A at the **left and right edges** of each **merged** occupied wedge (union across categories).

Data: `combined` / `outerKeyHeadings` from `occupiedUnion`.

Toggle: **Key heading rays (dashed)**

### Space entity arrows (s1…sN)

Orange arrows from A to points on the FOV circle — the discrete space entities the algorithm places for sensing (paper Figure 1e).

| Appearance | `isKey` | Meaning |
|------------|---------|---------|
| Thicker / darker orange | `true` | Boundary of a merged occupied wedge (dashed rays) |
| Thinner orange | `false` | **Gap-fill** samples in **empty** arcs only, every `heading_interval`° (Figure 1d) |

Click an **s** label to see its `(x, y)` and heading in the sidebar.

Toggle: **Space entity arrows (s1…sN)**

### How they relate

```
Cluster + envelope (per category)  →  colored occupied wedges
       ↓
Merge all categories               →  occupiedUnion
       ↓
Left/right of each union wedge     →  dashed key heading rays  =  bold s arrows
       ↓
Gap-fill in empty arcs only        →  thinner s arrows (never inside occupied)
```

---

## Project files

```
Adaptive Space Entity Generation Method/
├── README.md
└── visualization/
    ├── index.html      ← page shell (loads scripts in order)
    ├── scenario.js     ← default entity positions
    ├── geometry.js     ← math primitives (algorithm foundation)
    ├── algorithm.js    ← main algorithm pipeline
    ├── app.js          ← interactive canvas + drawing
    └── styles.css      ← layout and sidebar styling
```

Scripts are loaded in this order in `index.html`:

```html
<script src="scenario.js"></script>   <!-- 1. data -->
<script src="geometry.js"></script>   <!-- 2. math -->
<script src="algorithm.js"></script>  <!-- 3. algorithm -->
<script src="app.js"></script>        <!-- 4. UI + render -->
```

---

## Non-algorithm files

### `visualization/index.html`

The HTML page. Provides the canvas, sidebar (stats, sliders, toggles), and loads all JavaScript files. No algorithm logic here — it is only the UI shell.

### `visualization/scenario.js`

Stores the **default starting layout** as `window.DEFAULT_SCENARIO`:

- Agent **A** position and radius
- Neighbor agents **A1–A4**
- Circle obstacle **O1**
- Rectangle walls **W1**, **W2**
- Parameters: `fov_distance`, `heading_interval`, `merge_gap`

Embedded in JavaScript so the page works without a server. `app.js` reads this on load and when you click **Reset positions**.

### `visualization/styles.css`

Visual styling only: page layout, sidebar, legend swatches, canvas border. Does not affect the algorithm.

### `visualization/app.js`

The **interactive front-end**. Responsibilities:

| Section | Purpose |
|---------|---------|
| `initWorld()` | Converts `DEFAULT_SCENARIO` into a live `world` object |
| `pickEntity()` / drag handlers | Click-and-drag for A and all neighbors |
| `pickSpaceEntity()` | Click an **s** tip/label to inspect position data |
| `recompute()` | Calls `Algorithm.generateSpaceEntities(world)` on every move |
| `render()` | Draws FOV circle, occupied wedges, dashed key rays, **s1…sN** arrows |
| `updateStats()` | Lists union occupied wedges (and selected **s**) in the sidebar |
| `bindControls()` | Wires sliders, checkboxes, reset button |

**Algorithm connection:** `app.js` does not implement the algorithm. It passes `world` into `algorithm.js` and draws the returned `occupiedByCat`, `outerKeyHeadings`, `occupiedWedges`, and `spaceEntities`.

---

## Algorithm files (core)

The algorithm is split across two files:

| File | Role |
|------|------|
| **`geometry.js`** | Low-level math: angles, tangents, segment merge, gap-fill |
| **`algorithm.js`** | High-level pipeline: per-category cluster → envelope → key headings → gap-fill → space entities |

Execution order when you drag an entity:

```
app.js: recompute()
    └── algorithm.js: generateSpaceEntities(world)
            ├── categoryKeyHeadings()             ← Figure 1b
            │       ├── occupiedForAgents()           ← cluster + envelope
            │       ├── occupiedForCircles()          ← cluster + envelope
            │       └── occupiedForWalls()            ← cluster + envelope
            │               └── geometry.js
            │                     ├── clusterByOverlappingWedges()
            │                     ├── circleTangentAngles() / rectangleTangentAngles()
            │                     └── envelopeClusterWedges()
            ├── merge occupied (all cats)         ← occupiedUnion
            ├── key headings from union edges     ← Figure 1c
            ├── fillHeadingGaps() in free space   ← Figure 1d
            └── place space entities              ← Figure 1e
                    └── pointAtAngle()
```

---

## Algorithm walkthrough (in execution order)

This follows the paper’s Figure 1a → 1e and maps directly to the code.

### Step 0 — Entry point (`algorithm.js`)

`generateSpaceEntities(world)` is called whenever the scene changes. It receives agent A (`origin`), neighbors, and parameters (`fovDistance`, `headingInterval`, `mergeGap`).

---

### Step 1 — Cluster each category & form occupied envelopes (Figure 1b)

**File:** `algorithm.js` → `categoryKeyHeadings()` / `occupiedFromClusters()`

Neighbors are split into three categories; **each category is clustered independently**:

1. **Agents** — `occupiedForAgents()`
2. **Circle obstacles** — `occupiedForCircles()`
3. **Rectangle walls** — `occupiedForWalls()`

For each category:

1. Compute each entity’s individual tangent **occupied wedge**
2. **`clusterByOverlappingWedges()`** — put two entities in the same cluster if their wedges overlap (transitive; gaps ≤ `merge_gap`° also count)
3. **`envelopeClusterWedges(wedges)`** — one continuous occupied segment from the **most outward** left/right tangents of the cluster

Result: **one occupied wedge per cluster** (drawn as blue / red / green). No separate wedge for every member inside a cluster.

#### 1a. Agents and circle obstacles — tangent lines

**File:** `geometry.js` → `circleTangentAngles(origin, center, combinedRadius)`

```js
combinedRadius = entity.radius + origin.radius
```

Member wedges are used both to decide clustering (overlap) and to build the cluster envelope. Angle convention: **0° = east**, **90° = north** (up on screen).

#### 1b. Rectangle walls — expanded silhouette

**File:** `geometry.js` → `rectangleTangentAngles(origin, corners, agentRadius)`

1. **`expandRectangleCorners()`** — grow the wall by A’s radius
2. Silhouette angles of the expanded rectangle become that wall’s occupied wedge
3. Walls are clustered the same way as other categories: **overlapping wedges**, not distance

---

### Step 2 — Merge occupied wedges & extract key headings (Figure 1c)

**File:** `algorithm.js` → `unionOccupiedWedges()` · `keyHeadingsFromOccupied()`

All per-category cluster envelopes are merged into **`occupiedUnion`**. Key headings are the **left and right edges** of each merged occupied interval (not every per-category envelope edge inside an overlap).

```js
const combined = Geo.keyHeadingsFromOccupied(occupiedUnion);
```

These are the dashed grey rays (`outerKeyHeadings === combined`).

---

### Step 3 — Gap-fill only in free space (Figure 1d)

**File:** `geometry.js` → `fillHeadingGaps(combined, occupiedUnion, interval)`

Walk consecutive key headings around the FOV. For each arc, test the midpoint:

| Interval | Action |
|----------|--------|
| **Occupied** | Keep the two boundary keys only — **no** intermediate headings |
| **Empty (free space)** | From the first key, insert a heading every `heading_interval` until the next key |

Space entities are candidate movement directions; directions through occupied wedges are not generated (except the boundary keys themselves).

---

### Step 4 — Place space entities on FOV boundary (Figure 1e)

**File:** `algorithm.js` + `geometry.js` → `pointAtAngle()`

```js
const pos = Geo.pointAtAngle(origin, heading, fovDistance);
// → { label: "s1", heading, x, y, isKey }
```

- **`isKey: true`** — occupied-wedge boundary (thicker orange arrow; same as a dashed ray)
- **`isKey: false`** — free-space gap-fill heading (thinner arrow)

---

## `geometry.js` — function reference

| Function | Used in step | Purpose |
|----------|--------------|---------|
| `positionToAngle()` | 1 | Convert a neighbor position to a heading angle (0°=east, 90°=north) |
| `pointAtAngle()` | 4 | Convert a heading + distance into canvas coordinates |
| `distanceBetween()` | 1 | Euclidean distance between two points |
| `circleTangentAngles()` | 1a | Tangent wedge for agents and circle obstacles |
| `clusterByOverlappingWedges()` | 1 | Group entities whose occupied wedges overlap |
| `envelopeClusterWedges()` | 1 | Outermost left/right tangents for one cluster |
| `expandRectangleCorners()` | 1b | Expand wall by agent radius |
| `rectangleTangentAngles()` | 1b | Tangent wedge for rectangle walls |
| `mergeOccupiedSegments()` | sidebar | Merge wedges for union position list |
| `keyHeadingsFromOccupied()` | 2 | Occupied wedge edges → key headings |
| `fillHeadingGaps()` | 3 | Gap-fill **empty** arcs only (skip occupied intervals) |
| `angleIncrease()` | 1 | CCW angular distance on a circle |

---

## Parameters

| Parameter | Default | Where set | Effect |
|-----------|---------|-----------|--------|
| `fov_distance` | 120 | `scenario.js` / FOV slider | Radius of FOV circle; where **s1…sN** sit |
| `heading_interval` | 15° | `scenario.js` / interval slider | Gap-fill step in **free-space** arcs only (Figure 1d) |
| `merge_gap` | 2° | `scenario.js` | Treat angular gaps ≤ this as overlapping when clustering / unioning |
| `origin.radius` | 5 | `scenario.js` | Agent A size; used in all tangent calculations |

---

## Display toggles (what maps to the algorithm)

| Toggle | Algorithm output drawn |
|--------|------------------------|
| Occupied segments | `occupiedByCat` — Figure 1b cluster envelopes per category |
| Key heading rays | `combined` / `outerKeyHeadings` — Figure 1c merged occupied boundaries |
| Space entity arrows | `spaceEntities` — Figure 1e **s1…sN** on FOV |
| Entity labels | IDs and **s** labels on canvas |

**Sidebar Algorithm output:** `occupiedWedges` — cross-category union with start/end FOV positions. Optionally shows a selected **s** when clicked.

---

## Implementation notes

| Topic | Detail |
|-------|--------|
| **Coordinate system** | Canvas coords used throughout. Smaller `y` = up/north on screen. 0° = east, 90° = north. |
| **Per-category clustering** | Agents, obstacles, and walls each cluster by **overlapping occupied wedges**, then `envelopeClusterWedges`. |
| **One wedge per cluster** | Envelope uses the most outward left/right tangents — not a wedge per member. |
| **Key headings** | Left/right of each **merged** occupied wedge (Figure 1c). |
| **Gap-fill** | Only in empty arcs between consecutive keys — never inside occupied wedges (Figure 1d). |
| **Agent radius on walls** | Walls expanded by A’s radius before tangents (`expandRectangleCorners`). |
| **Green dashed outline** | Drawn in `app.js` only — shows the wall + agent-radius boundary used by the algorithm. |
