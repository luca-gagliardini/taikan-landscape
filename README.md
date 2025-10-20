# Yokoyama Taikan Cloud Animation

A minimalist Japanese ink painting animation inspired by the early works of Yokoyama Taikan. The project features a black ink mountain summit on a faded white background with evolving clouds that obscure and reveal the mountain as they drift horizontally.

## Concept

This animation captures the essence of traditional Japanese ink painting where clouds are represented through **negative space** - the absence of ink. As clouds drift across the canvas, they wash away the mountain ink, creating a meditative and organic visual experience.

## Features

- Minimalist aesthetic with authentic Mount Fuji silhouette on beige/white background
- Full-window responsive canvas that adapts to any screen size
- Organic cloud shapes generated using Perlin/Simplex noise
- Clouds that wash away mountain ink as they pass
- Slow, meditative horizontal cloud movement with absolute speed
- Smooth morphing cloud shapes with optimized performance (60+ fps)
- Debug mode with performance monitoring and visualization tools

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository or download the source code

2. Install dependencies:
```bash
npm install
```

### Development

Run the development server with hot reload:
```bash
npm run dev
```

This will start a local server (typically at `http://localhost:5173`). The page will automatically reload when you make changes to the source files.

### Build

Create a production build:
```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

## Project Structure

```
src/
├── main.ts              # Entry point, canvas setup, animation loop
├── Scene.ts             # Orchestrates mountain + clouds + performance monitoring
├── Mountain.ts          # Mountain geometry and rendering (Mount Fuji profile)
├── Cloud.ts             # Individual cloud behavior with noise-based shapes
├── PerformanceMonitor.ts # FPS tracking, profiling, and debug HUD
├── types.ts             # Shared types (Point, Vector2, etc.)
├── config.ts            # Constants and tunable parameters
├── utils.ts             # Noise wrapper, drawing helpers
└── style.css            # Full-window canvas styling
```

## Implementation Phases

### Phase 1: Basic Structure ✅
- [x] Set up TypeScript project with Vite
- [x] Create basic Scene class with animation loop
- [x] Implement Mountain class with trapezoid rendering
- [x] Render static black mountain on beige background

### Phase 2: Single Static Cloud ✅
- [x] Install simplex-noise library
- [x] Implement Cloud class with noise-based alpha calculation
- [x] Add cloud rendering using source-over composite mode
- [x] Create one cloud overlapping mountain for tuning

### Phase 3 & 4: Cloud Evolution and Movement ✅
- [x] Add time parameter to noise function (3D noise)
- [x] Implement cloud morphing with smooth evolution
- [x] Implement Cloud.update() with horizontal movement
- [x] Add wrapping logic with property randomization
- [x] Connect to global windSpeed parameter

### Phase 5: Multiple Clouds ✅
- [x] Add 5 moving clouds with randomized properties
- [x] Refactor cloud initialization into helper method
- [x] Implement canvas-relative positioning for all dimensions
- [x] Add debug mode for cloud visualization
- [x] Clean up unused code

### Phase 6: Mount Fuji & Responsive Canvas ✅
- [x] Implement full-window responsive canvas
- [x] Research and implement authentic Mount Fuji geometry
- [x] Two-slope profile (35° steep upper, 27° gentle lower)
- [x] Flat crater summit with fixed pixel width (zoom effect)
- [x] Aspect ratio correction for consistent slopes
- [x] Performance monitoring system with FPS tracking
- [x] Optimize cloud rendering (17x performance improvement)
- [x] Debug mode system (HUD + cloud visualization)
- [x] Fix wind speed to absolute value

## Debug Mode

Enable debug features by setting `DEBUG_MODE = true` in `src/config.ts`:

```typescript
export const DEBUG_MODE = true
```

When enabled, you'll see:
- **Performance HUD** (top-left corner) showing:
  - FPS (color-coded: green >50fps, yellow 30-50fps, red <30fps)
  - Frame time in milliseconds
  - Update/Render time breakdown
  - Memory usage (Chrome/Edge only)
  - Startup phase indicator (first 10 seconds)
- **Cloud visualization** (clouds rendered in red instead of background color)
- **Console analysis** after 10 seconds:
  - Detailed startup performance statistics
  - Top 5 slowest frames with timestamps
  - Warmup analysis comparing first second vs rest

## Tunable Parameters

Key parameters that can be adjusted in `src/config.ts`:

| Parameter | Description | Default Value |
|-----------|-------------|---------------|
| `DEBUG_MODE` | Enable performance HUD and cloud visualization | false |
| `DEFAULT_WIND_SPEED` | Cloud drift speed (absolute pixels/sec) | 15 |
| `NOISE_SCALE` | Size of cloud features (lower = bigger) | 60 |
| `NOISE_TIME_SCALE` | Speed of shape morphing | 0.00004 |
| `CLOUD_SAMPLE_STEP` | Grid sampling density (fraction of canvas width) | 0.012 |
| `SOFT_CIRCLE_RADIUS` | Soft circle radius (fraction of canvas width) | 0.022 |
| `DEBUG_CLOUD_COLOR` | Cloud visualization color when debug enabled | '#FF0000' |

## Technical Notes

### Canvas Composite Operations

The key technique is using `source-over` composite mode with background-colored clouds:
- Clouds are rendered as background-colored shapes painted over the mountain
- Creates a "diluted ink" wash effect characteristic of Japanese ink painting
- Cloud alpha determines the strength of the wash effect
- Four-zone density system creates organic cloud shapes (core, noise blend, transition, washout edge)

### 3D Noise for Organic Shapes

Using 3D Perlin/Simplex noise (x, y, time):
- x, y: spatial coherence (nearby points similar)
- time: smooth evolution over time
- Result: organic, flowing cloud shapes

## License

ISC

## Inspiration

This project is inspired by the atmospheric ink paintings of Yokoyama Taikan (横山大観), particularly his early works that explored the relationship between mountain landscapes and atmospheric effects through minimalist brushwork.
