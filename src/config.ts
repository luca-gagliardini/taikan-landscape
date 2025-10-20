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

// Bird flight parameters
export const BIRD_BASE_SPEED = 0.045 // Base flight speed (4.5% of screen per second)
export const BIRD_MIN_SPEED = 0.035 // Minimum speed when climbing
export const BIRD_MAX_SPEED = 0.07 // Maximum speed when diving
export const BIRD_GRAVITY_EFFECT = 0.02 // How much gravity affects speed
export const BIRD_TURN_SPEED = Math.PI // Turn rate in radians per second (180°/sec)
export const BIRD_WINGSPAN = 20 // Fixed wingspan in pixels

// Bird flocking parameters
export const BIRD_SEPARATION_DISTANCE = 0.03 // ~3x bird size - collision avoidance
export const BIRD_ALIGNMENT_DISTANCE = 0.06 // ~6x bird size - immediate neighbors only
export const BIRD_COHESION_DISTANCE = 0.15 // ~15x bird size - broader group awareness
export const BIRD_SEPARATION_WEIGHT = 4.0 // Collision avoidance strength
export const BIRD_ALIGNMENT_WEIGHT = 3.5 // Direction matching strength
export const BIRD_COHESION_WEIGHT = 0.5 // Group pull strength

// Bird behavior parameters
export const BIRD_DIRECTION_CHANGE_MIN = 10 // Minimum seconds between random direction changes
export const BIRD_DIRECTION_CHANGE_MAX = 20 // Maximum seconds between random direction changes
export const BIRD_RANDOM_TURN_RANGE = Math.PI / 3 // ±30° random direction adjustments
export const BIRD_FLOCKING_BLEND_FACTOR = 0.4 // How much flocking influences direction (0-1)
export const BIRD_EDGE_MARGIN = 0.05 // Distance from screen edges to trigger avoidance

// Bird turning parameters
export const BIRD_TURN_INERTIA_MIN = 0.2 // Minimum turn rate multiplier (banking into turn)
export const BIRD_TURN_INERTIA_MAX = 0.7 // Maximum turn rate multiplier (aligning)
