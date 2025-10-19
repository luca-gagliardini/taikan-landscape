// Configuration constants and tunable parameters

export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600
export const BACKGROUND_COLOR = '#F5F5DC' // Beige/faded white
export const MOUNTAIN_COLOR = '#000000'

// Cloud animation parameters (to be used in later phases)
export const DEFAULT_WIND_SPEED = 20 // pixels per second
export const NOISE_SCALE = 60 // Lower = larger cloud features (reduced for denser clouds)
export const NOISE_TIME_SCALE = 0.00008 // How fast shapes morph (reduced for slower evolution)
export const CLOUD_THRESHOLD = 0.3 // Noise value above which cloud exists (0-1) (lowered for more coverage)
export const CLOUD_SAMPLE_STEP = 6 // Grid spacing for noise sampling (reduced for smoother appearance)
export const SOFT_CIRCLE_RADIUS = 15 // Size of soft circles that make up cloud (reduced for denser detail)
