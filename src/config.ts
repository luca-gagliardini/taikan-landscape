// Configuration constants and tunable parameters

export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600
export const BACKGROUND_COLOR = '#F5F5DC' // Beige/faded white
export const MOUNTAIN_COLOR = '#000000'

// Cloud animation parameters (to be used in later phases)
export const DEFAULT_WIND_SPEED = 20 // pixels per second
export const NOISE_SCALE = 100 // Lower = larger cloud features
export const NOISE_TIME_SCALE = 0.0005 // How fast shapes morph
export const CLOUD_THRESHOLD = 0.4 // Noise value above which cloud exists (0-1)
export const CLOUD_SAMPLE_STEP = 8 // Grid spacing for noise sampling (performance vs quality)
export const SOFT_CIRCLE_RADIUS = 20 // Size of soft circles that make up cloud
