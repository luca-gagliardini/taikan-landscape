import { Vector2, Vector3 } from './types'
import { noise3D, drawSoftCircle } from './utils'
import {
  NOISE_SCALE,
  NOISE_TIME_SCALE,
  CLOUD_SAMPLE_STEP,
  SOFT_CIRCLE_RADIUS
} from './config'

export interface CloudConfig {
  position: Vector2
  velocity: Vector2
  width: number
  height: number
  scale: number
  noiseSeed: Vector3
  noiseScale?: number
  timeOffset?: number
}

export class Cloud {
  position: Vector2
  velocity: Vector2
  scale: number
  width: number
  height: number
  noiseSeed: Vector3
  noiseScale: number
  timeOffset: number

  constructor(config: CloudConfig) {
    this.position = config.position
    this.velocity = config.velocity
    this.width = config.width
    this.height = config.height
    this.scale = config.scale
    this.noiseSeed = config.noiseSeed
    this.noiseScale = config.noiseScale ?? NOISE_SCALE
    this.timeOffset = config.timeOffset ?? 0
  }

  update(deltaTime: number, windSpeed: number, canvasWidth: number): void {
    // Move horizontally based on velocity and global wind speed
    this.position.x += this.velocity.x * windSpeed * deltaTime

    // Wrap cloud when it exits right side of canvas
    const buffer = 200
    if (this.position.x > canvasWidth + buffer) {
      this.position.x = -this.width - buffer
    }
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    // Cloud center is at the middle of the bounding box
    const centerX = this.position.x + this.width / 2
    const centerY = this.position.y + this.height / 2

    // Use ellipse for horizontal cloud shape
    const radiusX = this.width / 2   // Horizontal radius
    const radiusY = this.height / 2  // Vertical radius (smaller)

    // Define cloud structure with smaller core and larger noise zone:
    // - Inner core (0-20%): Fully opaque center
    // - Noise integration (20-45%): Core blends with noise
    // - Transition zone (45-70%): Noise-modulated falloff
    // - Washout edge (70-100%): Gradual fade to transparent
    const coreSize = 0.20       // Reduced from 0.25
    const noiseBlendEnd = 0.45  // Reduced from 0.50
    const transitionEnd = 0.70  // Reduced from 0.75

    // Sample noise on a grid over cloud's bounding region
    for (let x = 0; x < this.width; x += CLOUD_SAMPLE_STEP) {
      for (let y = 0; y < this.height; y += CLOUD_SAMPLE_STEP) {
        const worldX = this.position.x + x
        const worldY = this.position.y + y

        // Calculate normalized elliptical distance from center
        const dx = (worldX - centerX) / radiusX
        const dy = (worldY - centerY) / radiusY
        const normalizedDist = Math.sqrt(dx * dx + dy * dy) // 0 at center, 1 at ellipse edge

        if (normalizedDist > 1) continue // Outside cloud bounds

        const noiseValue = this.getNoiseAt(worldX, worldY, time)
        let alpha = 0

        if (normalizedDist < coreSize) {
          // Solid core with very subtle noise integration
          const coreProgress = normalizedDist / coreSize
          // Even in core, add tiny noise variation to break up the digital look
          alpha = 1.0 - coreProgress * 0.1 * (1 - noiseValue)

        } else if (normalizedDist < noiseBlendEnd) {
          // Blend core into noise-based shape
          const blendProgress = (normalizedDist - coreSize) / (noiseBlendEnd - coreSize)
          const baseDensity = 1.0 - blendProgress * 0.3

          // Gradually increase noise influence
          const noiseInfluence = blendProgress * 0.5
          alpha = baseDensity * (1 - noiseInfluence + noiseInfluence * noiseValue)

        } else if (normalizedDist < transitionEnd) {
          // Noise-modulated transition zone
          const transitionProgress = (normalizedDist - noiseBlendEnd) / (transitionEnd - noiseBlendEnd)
          const baseFalloff = 1.0 - transitionProgress

          // Strong noise influence on shape
          alpha = baseFalloff * noiseValue

        } else {
          // Washout edge: very gradual fade
          const washoutProgress = (normalizedDist - transitionEnd) / (1 - transitionEnd)
          const washoutFalloff = 1.0 - washoutProgress

          // Noise creates wispy tendrils, but with strong fadeout
          const edgeNoise = noiseValue * noiseValue // Square to make it more selective
          alpha = washoutFalloff * washoutFalloff * edgeNoise * 0.6
        }

        // Boost overall cloud opacity to increase "covering power" over mountain ink
        // This helps the cloud wash away mountain edges more effectively
        const boostedAlpha = Math.min(1.0, alpha * 2.5)

        if (boostedAlpha > 0.02) {
          drawSoftCircle(ctx, worldX, worldY, boostedAlpha, SOFT_CIRCLE_RADIUS)
        }
      }
    }
  }

  // Simple noise value normalized to [0, 1]
  private getNoiseAt(x: number, y: number, time: number): number {
    const noiseValue = noise3D(
      (x + this.noiseSeed.x) / this.noiseScale,
      (y + this.noiseSeed.y) / this.noiseScale,
      (time * NOISE_TIME_SCALE + this.noiseSeed.z)
    )

    // Map noise from [-1, 1] to [0, 1]
    return (noiseValue + 1) / 2
  }
}
