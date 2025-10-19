// Configuration constants and tunable parameters

export const BACKGROUND_COLOR = '#F5F5DC' // Beige/faded white
export const MOUNTAIN_COLOR = '#000000'

// Debug: Set to a bright color (e.g., '#FF0000' for red) to visualize clouds, or null for normal
export const DEBUG_CLOUD_COLOR: string | null = null // Normal mode

// Cloud animation parameters (relative to canvas dimensions)
export const DEFAULT_WIND_SPEED = 0.019 // Fraction of canvas width per second
export const NOISE_SCALE = 60 // Lower = larger cloud features
export const NOISE_TIME_SCALE = 0.00004 // How fast shapes morph
export const CLOUD_SAMPLE_STEP = 0.007 // Grid spacing as fraction of canvas width
export const SOFT_CIRCLE_RADIUS = 0.019 // Soft circle radius as fraction of canvas width
