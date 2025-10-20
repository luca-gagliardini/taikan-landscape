# Yokoyama Taikan Cloud Animation - Implementation Plan

## Project Overview
Render a minimalist Japanese ink painting in the style of Yokoyama Taikan's early works:
- Black ink mountain summit on faded white background
- Evolving white clouds that obscure/reveal the mountain as they drift
- Clouds are the "absence of ink" - they erase the mountain where they pass
- Slow, meditative horizontal movement

## Visual Reference
The clouds are implied through negative space - where cloud exists, mountain ink is diluted/absent. As clouds drift horizontally, the mountain peak fades in and out.

## Technical Architecture

### Project Structure
\`\`\`
src/
├── main.ts           // Entry point, canvas setup, animation loop
├── Scene.ts          // Orchestrates mountain + clouds + birds
├── Mountain.ts       // Mountain geometry and rendering
├── Cloud.ts          // Individual cloud behavior
├── Bird.ts           // Individual bird behavior and flocking (Phase 7+)
├── types.ts          // Shared types (Point, Vector2, etc.)
├── config.ts         // Constants and tunable parameters
└── utils.ts          // Noise wrapper, drawing helpers
\`\`\`

### Core Classes

#### Scene Class
**Responsibilities:**
- Canvas management (responsive full-window from Phase 6)
- Animation loop coordination
- Global parameters (wind speed, time)
- Manages mountain, cloud collection, and bird flock

\`\`\`typescript
class Scene {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  mountain: Mountain
  clouds: Cloud[]
  birds: Bird[] // Phase 7+
  windSpeed: number // Global parameter
  currentTime: number
  lastTime: number

  constructor(canvasElement: HTMLCanvasElement)
  init(): void // Setup mountain, clouds, birds
  update(deltaTime: number): void // Update all objects
  render(): void // Draw everything (mountain -> birds -> clouds for depth)
  animate(timestamp: number): void // RequestAnimationFrame loop
  resize(): void // Handle canvas resize (Phase 6)
}
\`\`\`

#### Mountain Class
**Responsibilities:**
- Store trapezoid geometry (4 points)
- Draw mountain shape in black ink
- Use relative coordinates (percentage of canvas dimensions) for scalability

\`\`\`typescript
class Mountain {
  // Points as percentages of canvas dimensions
  // e.g., summit at (0.5, 0.3) = center horizontally, 30% from top
  vertices: Point[] // [topLeft, topRight, bottomRight, bottomLeft]
  
  constructor(vertices: Point[])
  
  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void
  
  // Helper: convert relative point to absolute canvas coordinates
  private toAbsolute(point: Point, width: number, height: number): Point
}
\`\`\`

**Initial mountain shape (trapezoid):**
\`\`\`typescript
vertices: [
  { x: 0.35, y: 0.25 }, // top-left
  { x: 0.65, y: 0.25 }, // top-right  
  { x: 0.8, y: 0.9 },   // bottom-right
  { x: 0.2, y: 0.9 }    // bottom-left
]
\`\`\`

#### Cloud Class
**Responsibilities:**
- Position and velocity (horizontal drift)
- Shape definition via Perlin/Simplex noise
- Morphing over time (noise evolution)
- Wrapping behavior (teleport to left when exits right)
- Washing away mountain ink where cloud exists

\`\`\`typescript
class Cloud {
  position: Vector2 // Absolute canvas coordinates
  velocity: Vector2 // Base velocity (modified by global windSpeed)
  width: number // Bounding box width
  height: number // Bounding box height
  noiseSeed: Vector3 // Unique offset for this cloud's noise field
  noiseScale: number // How "zoomed in" the noise is

  constructor(config: CloudConfig)

  update(deltaTime: number, windSpeed: number, canvasWidth: number, canvasHeight: number): void
  draw(ctx: CanvasRenderingContext2D, time: number, canvasWidth: number): void

  // Helper: get noise value at specific point
  private getNoiseAt(x: number, y: number, time: number): number
}
\`\`\`

#### Bird Class (Phase 7+)
**Responsibilities:**
- Position and velocity (flight movement)
- Visual representation (ink brush style TBD in Phase 7)
- Flocking behavior (boid algorithm: separation, alignment, cohesion)
- Boundary handling (wrapping or return behavior TBD)
- Rendering in black ink

\`\`\`typescript
class Bird {
  position: Vector2 // Absolute canvas coordinates
  velocity: Vector2 // Current flight direction and speed
  // Visual properties TBD based on chosen aesthetic
  // Possible: wingspan, body size, orientation angle

  constructor(config: BirdConfig)

  update(deltaTime: number, flock: Bird[], canvasWidth: number, canvasHeight: number): void
  draw(ctx: CanvasRenderingContext2D): void

  // Boid algorithm components (Phase 9)
  private separation(neighbors: Bird[]): Vector2
  private alignment(neighbors: Bird[]): Vector2
  private cohesion(neighbors: Bird[]): Vector2
  private getNeighbors(flock: Bird[], radius: number): Bird[]
}
\`\`\`

### Rendering Pipeline

The key insight: clouds **erase** the mountain using canvas composite operations.

\`\`\`typescript
render() {
  const { width, height } = this.canvas
  
  // 1. Clear canvas with faded white background
  this.ctx.fillStyle = BACKGROUND_COLOR
  this.ctx.fillRect(0, 0, width, height)
  
  // 2. Draw mountain in black ink
  this.ctx.globalCompositeOperation = 'source-over'
  this.mountain.draw(this.ctx, width, height)
  
  // 3. Draw clouds - they ERASE the mountain
  this.ctx.globalCompositeOperation = 'destination-out'
  // ^ Anything drawn in this mode removes what's beneath
  
  for (const cloud of this.clouds) {
    cloud.draw(this.ctx, this.currentTime)
  }
  
  // 4. Reset composite mode
  this.ctx.globalCompositeOperation = 'source-over'
}
\`\`\`

### Cloud Rendering Strategy

Clouds are rendered by sampling a 3D noise field (x, y, time) on a grid:

\`\`\`typescript
draw(ctx: CanvasRenderingContext2D, time: number): void {
  // Sample noise on a grid over cloud's bounding region
  for (let x = 0; x < this.width; x += CLOUD_SAMPLE_STEP) {
    for (let y = 0; y < this.height; y += CLOUD_SAMPLE_STEP) {
      const worldX = this.position.x + x
      const worldY = this.position.y + y
      
      // Get alpha based on noise at this point
      const alpha = this.getAlphaAt(worldX, worldY, time)
      
      if (alpha > 0) {
        // Draw soft circle to erase mountain ink
        drawSoftCircle(ctx, worldX, worldY, alpha, SOFT_CIRCLE_RADIUS)
      }
    }
  }
}

private getAlphaAt(x: number, y: number, time: number): number {
  const noiseValue = noise3D(
    (x + this.noiseSeed.x) / this.noiseScale,
    (y + this.noiseSeed.y) / this.noiseScale,
    (time * NOISE_TIME_SCALE + this.noiseSeed.z)
  )
  
  // Map noise from [-1, 1] to [0, 1]
  const normalized = (noiseValue + 1) / 2
  
  // Apply threshold - only show cloud above certain noise value
  if (normalized < CLOUD_THRESHOLD) return 0
  
  // Map remaining range to alpha [0, 1]
  return (normalized - CLOUD_THRESHOLD) / (1 - CLOUD_THRESHOLD)
}
\`\`\`

### Noise Integration

Use \`simplex-noise\` library:

\`\`\`typescript
import { createNoise3D } from 'simplex-noise'

// Create once, reuse
const noise3D = createNoise3D()
\`\`\`

### Constants & Configuration

\`\`\`typescript
// config.ts
export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600
export const BACKGROUND_COLOR = '#F5F5DC' // Beige/faded white
export const MOUNTAIN_COLOR = '#000000'

// Tunable parameters - adjust based on feel
export const DEFAULT_WIND_SPEED = 20 // pixels per second
export const NOISE_SCALE = 100 // Lower = larger cloud features
export const NOISE_TIME_SCALE = 0.0005 // How fast shapes morph
export const CLOUD_THRESHOLD = 0.4 // Noise value above which cloud exists (0-1)
export const CLOUD_SAMPLE_STEP = 8 // Grid spacing for noise sampling (performance vs quality)
export const SOFT_CIRCLE_RADIUS = 20 // Size of soft circles that make up cloud
\`\`\`

### Utility Functions

\`\`\`typescript
// utils.ts

// Draw a soft, gradient circle for cloud wash effect
export function drawSoftCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  alpha: number,
  radius: number
): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, \`rgba(255, 255, 255, \${alpha})\`)
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  
  ctx.fillStyle = gradient
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
}
\`\`\`

### Initial Scene Setup

\`\`\`typescript
// Start with 1-2 clouds
init() {
  this.mountain = new Mountain([
    { x: 0.35, y: 0.25 },
    { x: 0.65, y: 0.25 },
    { x: 0.8, y: 0.9 },
    { x: 0.2, y: 0.9 }
  ])
  
  this.clouds = [
    new Cloud({
      position: { x: 100, y: 150 },
      velocity: { x: 1, y: 0 },
      width: 300,
      height: 200,
      scale: 1.0,
      noiseSeed: { x: 0, y: 0, z: 0 },
      noiseScale: NOISE_SCALE
    }[48;51;114;867;912t),
    new Cloud({
      position: { x: 500, y: 180 },
      velocity: { x: 0.8, y: 0 }, // Slightly slower
      width: 350,
      height: 180,
      scale: 1.2,
      noiseSeed: { x: 100, y: 100, z: 50 },
      noiseScale: NOISE_SCALE
    })
  ]
}
\`\`\`

### Cloud Movement & Wrapping

\`\`\`typescript
update(deltaTime: number, windSpeed: number, canvasWidth: number): void {
  // Move horizontally based on velocity and global wind
  this.position.x += this.velocity.x * windSpeed * deltaTime
  
  // Wrap around when cloud exits right side
  const buffer = 200 // Allow cloud to fully exit before wrapping
  if (this.position.x > canvasWidth + buffer) {
    this.position.x = -this.width - buffer
  }
}
\`\`\`

## Implementation Steps

### Phase 1: Basic Structure ✋ CHECKPOINT
**Goal:** Get mountain rendering and canvas setup working

1. Set up TypeScript project with Canvas
2. Create basic Scene class with animation loop
3. Implement Mountain class with trapezoid rendering
4. Render static black mountain on white background

**Human checkpoint:** Does mountain shape look right? Adjust vertices if needed.

---

### Phase 2: Single Static Cloud ✋ CHECKPOINT
**Goal:** Nail the cloud aesthetic with one non-moving cloud

1. Install \`simplex-noise\` library
2. Implement Cloud class with noise-based alpha calculation
3. Add cloud rendering using \`destination-out\` composite mode
4. Create one cloud overlapping mountain (position it manually)
5. **DO NOT implement movement yet** - cloud is static for tuning

**Human checkpoint - Critical aesthetic decisions:**
- Does the cloud "wash" effect look organic?
- Is the ink erasure convincing (like diluted ink)?
- Tune these parameters:
  - \`NOISE_SCALE\` (cloud feature size)
  - \`CLOUD_THRESHOLD\` (cloud density/coverage)
  - \`CLOUD_SAMPLE_STEP\` (detail vs performance)
  - \`SOFT_CIRCLE_RADIUS\` (edge softness)

---

### Phase 3: Cloud Evolution ✋ CHECKPOINT
**Goal:** Make cloud shape morph over time

1. Add time parameter to noise function
2. Implement morphing in place (no horizontal movement yet)

**Human checkpoint:**
- Does cloud evolution feel organic and meditative?
- Tune \`NOISE_TIME_SCALE\` for evolution speed
- Too fast = jittery, too slow = static feeling

---

### Phase 4: Horizontal Movement ✋ CHECKPOINT
**Goal:** Add wind drift and wrapping

1. Implement Cloud.update() with horizontal movement
2. Add wrapping logic
3. Connect to global \`windSpeed\` parameter

**Human checkpoint:**
- Does movement feel meditative yet perceptible?
- Tune \`DEFAULT_WIND_SPEED\`
- Does wrapping feel seamless?

---

### Phase 5: Multiple Clouds ✅ COMPLETE
**Goal:** Add multiple clouds, tune composition

1. Add 5 moving clouds with randomized properties
2. Refactor cloud initialization into helper method
3. Implement canvas-relative positioning for all dimensions
4. Add debug mode for cloud visualization
5. Clean up unused code

**Status:** Complete - 5 moving clouds with organic flow, fully scalable canvas-relative architecture

---

### Phase 6: Mount Fuji & Responsive Canvas ✅ COMPLETE
**Goal:** Implement authentic Mount Fuji geometry and full-window responsive canvas

#### Subtasks (in order):

**6.1: Responsive Canvas Setup** ✅
1. Remove fixed canvas dimensions (800x600)
2. Make canvas fill entire browser window
3. Implement window resize listener
4. Update Scene.resize() to handle window dimension changes
5. Ensure all relative positioning scales correctly with any aspect ratio

**Status:** Complete - Canvas fills window, resizes dynamically, all elements scale correctly

**6.2: Mount Fuji Geometry Research & Implementation** ✅
1. Research Mount Fuji's actual geometric profile/silhouette
2. Document findings (slope angles, proportions, distinctive shape features)
3. Update Mountain class vertices to match Fuji's profile
4. Position mountain: center X at ~30% from left, summit at 50% from top
5. Extend base below canvas (y > 1.0) to ensure no visible bottom edge

**Implemented Features:**
- Authentic two-slope profile: 35° steep upper slopes, 27° gentle lower slopes
- Flat crater summit (80px fixed width for zoom effect)
- Aspect ratio correction preserves slope angles at all window sizes
- Summit positioned at 30% from left, 50% from top (centered vertically)
- Base extends to y=1.05 for seamless edge

**Status:** Complete - Mount Fuji silhouette accurate, positioning aesthetically pleasing

**6.3: Performance Optimization** ✅
1. Add performance monitoring (FPS counter, memory usage tracking)
2. Profile rendering pipeline (identify bottlenecks)
3. Optimize cloud rendering if needed:
   - Adjusted CLOUD_SAMPLE_STEP for performance/quality balance
   - Optimized sampling density
4. Set performance targets (maintain 60fps, memory constraints)
5. Test performance across different window sizes

**Implemented:**
- PerformanceMonitor class with comprehensive metrics tracking
- Debug mode system (toggles HUD and cloud visualization)
- Identified bottleneck: Cloud rendering sampling density (25,740+ circles per frame)
- Optimized CLOUD_SAMPLE_STEP from 0.007 to 0.012
- Fixed wind speed to absolute (15px/sec) instead of canvas-relative

**Results:**
- 17x performance improvement: 5.6fps → 94.7fps
- Slow frames reduced from 100% to 0.2%
- Exceeds 60fps target across all window sizes
- Acceptable visual quality maintained

**Status:** Complete - Performance targets exceeded, smooth 60+ fps animation

---

### Phase 7: Single Bird - Visual Design ✋ CHECKPOINT
**Goal:** Design and implement a single bird's visual appearance

1. Research Japanese ink painting bird styles (Taikan-era aesthetics)
2. Design bird shape (simple silhouette, brush stroke style, or abstract)
3. Create Bird class with basic structure
4. Implement bird rendering (static first - one bird, fixed position)
5. Tune bird size relative to mountain/canvas

**Human checkpoint - Critical aesthetic decisions:**
- Does bird style match overall aesthetic?
- Is bird size/scale appropriate?
- Does bird integrate well with mountain/clouds visually?

---

### Phase 8: Single Bird Movement ✋ CHECKPOINT
**Goal:** Implement basic movement for one bird

1. Add position and velocity to Bird class
2. Implement simple flight path (straight line, arc, or gentle curve)
3. Add wrapping/looping behavior (what happens when bird exits screen?)
4. Tune flight speed relative to cloud movement

**Human checkpoint:**
- Does flight feel natural and meditative?
- Is speed appropriate relative to clouds?
- Does movement pattern work aesthetically?

---

### Phase 9: Bird Flocking Behavior ✋ CHECKPOINT
**Goal:** Implement boid algorithm for realistic flocking

1. Implement boid algorithms (separation, alignment, cohesion)
2. Add multiple birds (determine count through iteration)
3. Tune boid parameters for organic flock behavior
4. Address edge cases (birds exiting screen, returning to view)

**Open questions to resolve during implementation:**
- How many birds feel right?
- Should birds avoid mountain or fly through/behind?
- Should birds interact with clouds visually (depth layering)?
- Do birds wrap around screen or return naturally?

**Human checkpoint:**
- Does flock behavior look organic?
- Is bird count appropriate?
- Does flock integrate well with scene composition?

---

### Phase 10: Final Polish & Integration ✋ CHECKPOINT
**Goal:** Refine complete scene with all elements

1. Tune relative speeds (wind, birds, morphing)
2. Adjust visual hierarchy (mountain, clouds, birds depth)
3. Final performance check with all elements
4. Code cleanup and documentation
5. Optional: Add subtle variations (bird wing flapping animation?)

**Human checkpoint:**
- Does complete scene feel cohesive?
- Is the meditative quality maintained?
- Performance acceptable with all elements?

---

## Key Tunable Parameters (Summary)

These will need human judgment to dial in:

| Parameter | Effect | Initial Value |
|-----------|--------|---------------|
| \`DEFAULT_WIND_SPEED\` | How fast clouds drift | 20 px/s |
| \`NOISE_SCALE\` | Size of cloud features (lower = bigger) | 100 |
| \`NOISE_TIME_SCALE\` | Speed of shape morphing | 0.0005 |
| \`CLOUD_THRESHOLD\` | Cloud density/coverage | 0.4 |
| \`CLOUD_SAMPLE_STEP\` | Detail level (lower = more detail, slower) | 8 px |
| \`SOFT_CIRCLE_RADIUS\` | Edge softness | 20 px |

## Technical Notes

**Why \`destination-out\` composite mode:**
- This mode removes (erases) pixels from what's already drawn
- Perfect for clouds that "wash away" the ink
- Cloud alpha determines how much to erase

**Why 3D noise (x, y, time):**
- x, y: spatial coherence (nearby points similar)
- time: smooth evolution over time
- Result: organic, flowing shapes

**Performance considerations:**
- \`CLOUD_SAMPLE_STEP\`: Larger = faster but blockier
- Could optimize with offscreen canvas caching if needed
- Start simple, optimize only if slow

**Expandability:**
- Mountain vertices are relative (0-1 range) - easy to scale canvas later
- Cloud class can be extended with more properties (density variation, vertical drift)
- Can add more mountain peaks by creating multiple Mountain instances
