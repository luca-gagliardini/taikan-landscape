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
├── Scene.ts          // Orchestrates mountain + clouds
├── Mountain.ts       // Mountain geometry and rendering
├── Cloud.ts          // Individual cloud behavior
├── types.ts          // Shared types (Point, Vector2, etc.)
├── config.ts         // Constants and tunable parameters
└── utils.ts          // Noise wrapper, drawing helpers
\`\`\`

### Core Classes

#### Scene Class
**Responsibilities:**
- Canvas management (800x600 fixed initially)
- Animation loop coordination
- Global parameters (wind speed, time)
- Manages mountain and cloud collection

\`\`\`typescript
class Scene {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  mountain: Mountain
  clouds: Cloud[]
  windSpeed: number // Global parameter
  lastTime: number
  
  constructor(canvasElement: HTMLCanvasElement)
  init(): void // Setup mountain, initial clouds
  update(deltaTime: number): void // Update all objects
  render(): void // Draw everything
  animate(timestamp: number): void // RequestAnimationFrame loop
  resize(): void // Handle canvas resize (future)
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
- Erasing mountain ink where cloud exists

\`\`\`typescript
class Cloud {
  position: Vector2 // Absolute canvas coordinates
  velocity: Vector2 // Base velocity (modified by global windSpeed)
  scale: number // Size multiplier for this cloud
  width: number // Bounding box width
  height: number // Bounding box height
  noiseSeed: Vector3 // Unique offset for this cloud's noise field
  noiseScale: number // How "zoomed in" the noise is
  timeOffset: number // Phase offset for evolution
  
  constructor(config: CloudConfig)
  
  update(deltaTime: number, windSpeed: number, canvasWidth: number): void
  draw(ctx: CanvasRenderingContext2D, time: number): void
  
  // Helper: get alpha value at specific point based on noise
  private getAlphaAt(x: number, y: number, time: number): number
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

### Phase 5: Multiple Clouds ✋ CHECKPOINT
**Goal:** Add second cloud, tune composition

1. Add second cloud with different seed/speed
2. Observe interaction as they pass over mountain

**Human checkpoint:**
- How many clouds feel right? (could be 1, could be 3+)
- Do different speeds create nice rhythm?
- Does mountain fade in/out convincingly?

---

### Phase 6: Polish & Controls (Optional)
**Goal:** Add refinements

Possible additions:
- Wind speed slider UI
- Add/remove cloud buttons
- More organic mountain shape (Bezier curves)
- Subtle variations in cloud density
- Performance optimization if needed

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
