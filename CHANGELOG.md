# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added - Phase 1: Basic Structure
- Initial project setup with Vite and TypeScript
- Project structure with modular architecture (Scene, Mountain, types, config)
- TypeScript configuration with strict mode enabled
- Basic development environment with hot reload
- npm scripts for dev, build, and preview

#### Core Implementation
- `src/types.ts`: Shared type definitions (Point, Vector2, Vector3)
- `src/config.ts`: Configuration constants and tunable parameters
  - Canvas dimensions (800x600)
  - Color definitions (beige background, black mountain)
  - Cloud animation parameters (prepared for future phases)
- `src/Mountain.ts`: Mountain class implementation
  - Percentage-based vertex positioning for scalability
  - Trapezoid mountain shape rendering
  - Conversion from relative to absolute coordinates
- `src/Scene.ts`: Scene orchestrator
  - Canvas initialization and management
  - Animation loop using requestAnimationFrame
  - Rendering pipeline setup (prepared for cloud composite operations)
- `src/main.ts`: Application entry point
- `src/style.css`: Basic styling with centered canvas layout
- `index.html`: HTML structure with canvas element

#### Documentation
- README.md with comprehensive project overview
  - Installation and setup instructions
  - Project structure documentation
  - Implementation phases roadmap
  - Tunable parameters reference
  - Technical notes on canvas composite operations and noise generation
- .gitignore for Node.js/TypeScript projects

#### Visual Elements
- Black ink mountain (trapezoid shape) on beige/white background
- Mountain vertices configured at:
  - Summit: 35%-65% width at 25% height
  - Base: 20%-80% width at 90% height

#### Mountain Adjustments
- Mountain base vertices extended below canvas (y: 1.01) to ensure no visible base edge
- Only mountain peaks are visible, creating proper landscape composition

### Notes
- Phase 1 checkpoint complete: Static mountain rendering functional
- Ready for Phase 2: Cloud implementation with simplex-noise

---

### Added - Phase 2: Single Static Cloud
- Installed `simplex-noise` library (v4.0.3) for procedural cloud generation
- Implemented complete cloud rendering system with organic, evolving shapes

#### Core Implementation
- `src/utils.ts`: Utility functions for cloud rendering
  - `noise3D`: 3D Perlin/Simplex noise function for cloud shape generation
  - `drawSoftCircle()`: Renders soft gradient circles with background color
  - Cached RGB color parsing for performance optimization
- `src/Cloud.ts`: Cloud class with advanced noise-based rendering
  - Elliptical cloud shape (horizontal orientation)
  - Four-zone density system for natural appearance:
    - Solid core (0-20%): Dense center with subtle noise variation
    - Noise integration (20-45%): Gradual blend into noise-based shape
    - Transition zone (45-70%): Strong noise influence on shape boundary
    - Washout edge (70-100%): Gradual fade with wispy tendrils
  - Time-based morphing using 3D noise (x, y, time dimensions)
  - Static positioning (no movement in Phase 2)
- `src/Scene.ts`: Updated rendering pipeline
  - Integrated cloud rendering using `source-over` composite mode
  - Clouds painted with background color to "wash away" mountain ink
  - Single static cloud positioned to overlap mountain for aesthetic tuning

#### Visual Technique
- Clouds render as background-colored shapes painted over the mountain
- Creates "diluted ink" wash effect characteristic of Japanese ink painting
- Elliptical shape (5:1 ratio) creates elongated horizontal clouds
- Radial falloff from center ensures organic cloud form
- Noise at periphery creates evolving, irregular edges

#### Configuration Parameters
- `NOISE_SCALE`: 60 (controls cloud feature size)
- `NOISE_TIME_SCALE`: 0.00008 (controls morphing speed)
- `CLOUD_SAMPLE_STEP`: 6px (grid density for noise sampling)
- `SOFT_CIRCLE_RADIUS`: 15px (soft edge detail)
- Cloud dimensions: 960x192px (elongated horizontal ellipse)
- Cloud position: x:50, y:140 (positioned to overlap mountain summit)

#### Technical Approach
- 3D Simplex noise (x, y, time) for organic shape evolution
- Elliptical distance calculation for horizontal cloud shape
- Zone-based alpha calculation with smooth transitions
- Background color caching for performance
- Radial gradient rendering for soft edges

### Notes
- Phase 2 checkpoint complete: Static cloud with organic wash effect functional
- Cloud aesthetic successfully captures "diluted ink" feeling
- Ready for Phase 3: Cloud evolution (morphing in place)

---

### Added - Phase 3 & 4: Cloud Evolution and Movement
- Cloud morphing already implemented in Phase 2 via time-based 3D noise
- Implemented horizontal cloud movement with wind system

#### Core Implementation
- `src/Scene.ts`: Added global wind speed parameter
  - `windSpeed` applied to all moving clouds
  - Eternal static cloud at canvas bottom (immovable)
- `src/Cloud.ts`: Cloud movement and wrapping
  - Horizontal drift based on velocity and global wind speed
  - Wrapping logic: clouds teleport to left when exiting right
  - Cloud property randomization on each wrap cycle (position, size)
  - Creates illusion of new clouds while managing memory efficiently

#### Configuration Parameters
- `DEFAULT_WIND_SPEED`: 0.019 (fraction of canvas width per second)
- `NOISE_TIME_SCALE`: 0.00004 (halved for slower, more meditative evolution)

### Notes
- Phase 3 & 4 checkpoint complete: Clouds drift and morph organically
- Wrapping creates endless cloud flow without memory overhead
- Ready for Phase 5: Multiple clouds

---

### Added - Phase 5: Multiple Clouds
- Implemented 5 moving clouds with varied properties
- Refactored cloud initialization for cleaner code

#### Core Implementation
- `src/Scene.ts`:
  - Added `createMovingClouds(count)` helper method
  - Generates clouds with randomized positions and sizes
  - Incremental noise seeds for visual diversity (100, 200, 300, etc.)
  - All positioning fully relative to canvas dimensions
- `src/Cloud.ts`:
  - Updated wrapping to randomize cloud properties each cycle
  - All dimensions relative to canvas (width, height, positions)

#### Debug Features
- `src/config.ts`: `DEBUG_CLOUD_COLOR` option
  - Set to color hex (e.g., '#FF0000') to visualize clouds
  - Set to null for normal background-color wash effect
- `src/utils.ts`: Dynamic cloud color parsing for debug mode

#### Code Quality
- Removed unused properties: `scale`, `timeOffset` from Cloud class
- Removed unused constant: `CLOUD_THRESHOLD` from config
- Refactored repetitive cloud initialization into helper method

#### Canvas-Relative Architecture
- All cloud dimensions now relative to canvas size:
  - Initial X: -(canvas.width × 0.25) to -(canvas.width × 2.125)
  - Initial Y: random × canvas.height
  - Width: canvas.width × (0.75 + random)
  - Height: canvas.height × (0.133 + random × 0.2)
  - Buffer zones: 25% and 12.5% of canvas.width
- `src/config.ts`: All constants now canvas-relative fractions:
  - `DEFAULT_WIND_SPEED`: 0.019 (fraction of canvas width/sec)
  - `CLOUD_SAMPLE_STEP`: 0.007 (grid spacing fraction)
  - `SOFT_CIRCLE_RADIUS`: 0.019 (circle radius fraction)
- `src/Cloud.ts`: Draw method receives canvas width for scaling
- `src/Scene.ts`: Wind speed multiplied by canvas width

### Notes
- Phase 5 checkpoint complete: Multiple clouds with organic flow
- All positioning and rendering fully scalable to any canvas size
- Clean codebase with no unused properties or hardcoded pixels
- Ready for Phase 6: Mount Fuji & Responsive Canvas

---

### Added - Phase 6: Mount Fuji & Responsive Canvas

#### Phase 6.1: Responsive Canvas Setup
- Removed fixed canvas dimensions (800x600)
- Canvas now fills entire browser window
- Implemented window resize listener with automatic scene updates

**Core Implementation:**
- `src/style.css`: Full viewport styling
  - Body: 100vw × 100vh with hidden overflow
  - Canvas: 100% width and height, display block
  - Removed centered layout and decorative borders
- `src/config.ts`: Removed `CANVAS_WIDTH` and `CANVAS_HEIGHT` constants
- `src/Scene.ts`:
  - Added `resize()` method to handle window dimension changes
  - Canvas dimensions set to `window.innerWidth` and `window.innerHeight`
  - Window resize event listener triggers `resize()`
  - All clouds and wind speed recalculated on resize

#### Phase 6.2: Mount Fuji Geometry Research & Implementation
- Researched authentic Mount Fuji geometric profile
- Implemented realistic two-slope mountain geometry

**Research Findings:**
- Slope angles: 27°-35° (steeper near summit 31°-35°, gentler at base ~27°)
- Distinctive feature: Flat crater summit (not pointed)
- Exceptionally symmetrical cone shape
- Yokoyama Taikan style: Soft ink washes emphasizing gentle, sacred character

**Mountain Geometry:**
- Summit position: 30% from left, 50% from top (centered vertically)
- Flat crater summit: Fixed 80px width (creates zoom effect on resize)
- Two-slope profile with transition at 75% height:
  - Upper section: Steeper 35° slopes (tan(35°) ≈ 0.70)
  - Lower section: Gentler 27° slopes (tan(27°) ≈ 0.51)
- Base extends to y=1.05 (5% below canvas) for seamless edge
- 6 vertices total: 2 crater edges, 2 mid-transition points, 2 base corners

**Aspect Ratio Correction:**
- `updateMountainGeometry()` method calculates geometry on resize
- Aspect ratio correction: `height × (canvas.height / canvas.width)`
- Converts relative height units to width coordinate space
- Preserves authentic slope angles across all window sizes and aspect ratios
- Fixed summit width in pixels creates cinematic zoom effect:
  - Narrow window: Summit appears larger (zoomed in)
  - Wide window: Summit appears smaller (zoomed out)

**Core Implementation:**
- `src/Scene.ts`:
  - Created `updateMountainGeometry()` method for dynamic geometry calculation
  - Called from `resize()` to recalculate on window size changes
  - Removed duplicate mountain initialization from constructor

### Notes
- Phase 6.1 & 6.2 checkpoint complete: Full-window responsive canvas with authentic Mount Fuji
- Slope angles geometrically correct at all aspect ratios
- Fixed-pixel summit creates natural zoom effect
- Ready for Phase 6.3: Performance Optimization
