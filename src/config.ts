// Configuration constants and tunable parameters

export const BACKGROUND_COLOR = '#F5F5DC' // Beige/faded white
export const MOUNTAIN_COLOR = '#000000'

// Debug mode - enables performance HUD and cloud visualization
export const DEBUG_MODE = false // Set to true to enable debug features
export const DEBUG_CLOUD_COLOR = '#FF0000' // Color for cloud visualization when DEBUG_MODE is true

// Cloud animation parameters
export const DEFAULT_WIND_SPEED = 15 // Absolute pixels per second (meditative drift speed)
export const NOISE_SCALE = 60 // Lower = larger cloud features
export const NOISE_TIME_SCALE = 0.00004 // How fast shapes morph
export const CLOUD_SAMPLE_STEP = 0.012 // Grid spacing as fraction of canvas width (balanced for quality/performance)
export const SOFT_CIRCLE_RADIUS = 0.022 // Soft circle radius as fraction of canvas width (matched to sample step)
