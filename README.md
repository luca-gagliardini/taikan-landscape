# Yokoyama Taikan Cloud Animation

A minimalist Japanese ink painting animation inspired by the early works of Yokoyama Taikan. The project features a black ink mountain summit on a faded white background with evolving clouds that obscure and reveal the mountain as they drift horizontally.

## Concept

This animation captures the essence of traditional Japanese ink painting where clouds are represented through **negative space** - the absence of ink. As clouds drift across the canvas, they wash away the mountain ink, creating a meditative and organic visual experience.

## Features

- Minimalist aesthetic with black ink mountain on beige/white background
- Organic cloud shapes generated using Perlin/Simplex noise
- Clouds that erase mountain ink as they pass (using canvas composite operations)
- Slow, meditative horizontal cloud movement
- Responsive animation with smooth morphing cloud shapes

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
├── main.ts           # Entry point, canvas setup, animation loop
├── Scene.ts          # Orchestrates mountain + clouds
├── Mountain.ts       # Mountain geometry and rendering
├── Cloud.ts          # Individual cloud behavior (Phase 2+)
├── types.ts          # Shared types (Point, Vector2, etc.)
├── config.ts         # Constants and tunable parameters
├── utils.ts          # Noise wrapper, drawing helpers (Phase 2+)
└── style.css         # Basic styling
```

## Implementation Phases

### Phase 1: Basic Structure ✅
- [x] Set up TypeScript project with Vite
- [x] Create basic Scene class with animation loop
- [x] Implement Mountain class with trapezoid rendering
- [x] Render static black mountain on beige background

### Phase 2: Single Static Cloud (Next)
- [ ] Install simplex-noise library
- [ ] Implement Cloud class with noise-based alpha calculation
- [ ] Add cloud rendering using destination-out composite mode
- [ ] Create one cloud overlapping mountain for tuning

### Phase 3: Cloud Evolution
- [ ] Add time parameter to noise function
- [ ] Implement morphing in place (no movement)

### Phase 4: Horizontal Movement
- [ ] Implement Cloud.update() with horizontal movement
- [ ] Add wrapping logic
- [ ] Connect to global windSpeed parameter

### Phase 5: Multiple Clouds
- [ ] Add additional clouds with different seeds/speeds
- [ ] Tune composition and interaction

### Phase 6: Polish & Controls (Optional)
- [ ] Wind speed slider UI
- [ ] Add/remove cloud buttons
- [ ] More organic mountain shape (Bezier curves)
- [ ] Performance optimization

## Tunable Parameters

Key parameters that can be adjusted in `src/config.ts`:

| Parameter | Description | Default Value |
|-----------|-------------|---------------|
| `DEFAULT_WIND_SPEED` | Cloud drift speed (px/s) | 20 |
| `NOISE_SCALE` | Size of cloud features (lower = bigger) | 100 |
| `NOISE_TIME_SCALE` | Speed of shape morphing | 0.0005 |
| `CLOUD_THRESHOLD` | Cloud density/coverage (0-1) | 0.4 |
| `CLOUD_SAMPLE_STEP` | Detail level (lower = more detail) | 8 |
| `SOFT_CIRCLE_RADIUS` | Edge softness | 20 |

## Technical Notes

### Canvas Composite Operations

The key technique is using `destination-out` composite mode for cloud rendering:
- This mode removes (erases) pixels from what's already drawn
- Perfect for clouds that "wash away" the ink
- Cloud alpha determines how much to erase

### 3D Noise for Organic Shapes

Using 3D Perlin/Simplex noise (x, y, time):
- x, y: spatial coherence (nearby points similar)
- time: smooth evolution over time
- Result: organic, flowing cloud shapes

## License

ISC

## Inspiration

This project is inspired by the atmospheric ink paintings of Yokoyama Taikan (横山大観), particularly his early works that explored the relationship between mountain landscapes and atmospheric effects through minimalist brushwork.
