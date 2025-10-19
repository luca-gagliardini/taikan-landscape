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
