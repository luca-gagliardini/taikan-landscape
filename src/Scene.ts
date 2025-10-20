import { Mountain } from './Mountain'
import { Cloud } from './Cloud'
import { Bird } from './Bird'
import { Sun } from './Sun'
import { PerformanceMonitor } from './PerformanceMonitor'
import {
  BACKGROUND_COLOR,
  NOISE_SCALE,
  DEFAULT_WIND_SPEED,
  DEBUG_MODE,
  MOUNTAIN_SUMMIT_CENTER_X,
  MOUNTAIN_SUMMIT_Y,
  MOUNTAIN_MID_Y,
  MOUNTAIN_BASE_Y,
  MOUNTAIN_SUMMIT_WIDTH_PX,
  MOUNTAIN_UPPER_SLOPE_ANGLE,
  MOUNTAIN_LOWER_SLOPE_ANGLE
} from './config'

export class Scene {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  mountain: Mountain
  sun: Sun
  clouds: Cloud[]
  birds: Bird[]
  windSpeed: number
  currentTime: number
  lastTime: number
  performanceMonitor: PerformanceMonitor

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = canvasElement

    const ctx = this.canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas')
    }
    this.ctx = ctx

    this.currentTime = 0
    this.lastTime = 0

    // Initialize performance monitoring
    this.performanceMonitor = new PerformanceMonitor()

    // Initialize mountain (will be set by resize())
    this.mountain = new Mountain([])
    this.sun = new Sun()
    this.clouds = []
    this.birds = []
    this.windSpeed = 0

    // Set initial canvas dimensions and initialize scene
    this.resize()

    // Add resize listener
    window.addEventListener('resize', () => this.resize())
  }

  private updateMountainGeometry(): void {
    // Mount Fuji geometry - symmetrical trapezoid with two-slope profile
    // Research: Fuji has steeper slopes near summit (35°) transitioning to gentler slopes at base (27°)
    const summitCenterX = MOUNTAIN_SUMMIT_CENTER_X
    const summitY = MOUNTAIN_SUMMIT_Y
    const midY = MOUNTAIN_MID_Y
    const baseY = MOUNTAIN_BASE_Y

    // Aspect ratio correction: convert height units to width units
    // When we calculate slope, we need actual pixel ratios, not relative coords
    const aspectRatio = this.canvas.height / this.canvas.width

    // Flat summit width (fixed pixel size for zoom effect)
    // Keeping this constant creates zoom in/out effect as window resizes
    const summitWidthPixels = MOUNTAIN_SUMMIT_WIDTH_PX
    const summitHalfWidth = (summitWidthPixels / 2) / this.canvas.width  // Convert to relative coords

    // Upper section: steeper slope
    const upperHeight = midY - summitY  // Height in relative Y coords
    const upperHeightCorrected = upperHeight * aspectRatio  // Convert to same units as width
    const midHalfWidth = summitHalfWidth + (upperHeightCorrected / MOUNTAIN_UPPER_SLOPE_ANGLE)

    // Lower section: gentler slope
    const lowerHeight = baseY - midY
    const lowerHeightCorrected = lowerHeight * aspectRatio
    const baseHalfWidth = midHalfWidth + (lowerHeightCorrected / MOUNTAIN_LOWER_SLOPE_ANGLE)

    this.mountain = new Mountain([
      { x: summitCenterX - summitHalfWidth, y: summitY },  // top-left (crater left edge)
      { x: summitCenterX + summitHalfWidth, y: summitY },  // top-right (crater right edge)
      { x: summitCenterX + midHalfWidth, y: midY },        // mid-right (transition point)
      { x: summitCenterX + baseHalfWidth, y: baseY },      // bottom-right
      { x: summitCenterX - baseHalfWidth, y: baseY },      // bottom-left
      { x: summitCenterX - midHalfWidth, y: midY }         // mid-left (transition point)
    ])
  }

  private createMovingClouds(count: number): Cloud[] {
    return Array.from({ length: count }, (_, i) => {
      const seedMultiplier = (i + 1) * 100
      return new Cloud({
        position: {
          x: -(this.canvas.width * 0.25) - Math.random() * (this.canvas.width * 1.875),
          y: Math.random() * this.canvas.height
        },
        velocity: { x: 1, y: 0 },
        width: this.canvas.width * (0.75 + Math.random()),
        height: this.canvas.height * (0.133 + Math.random() * 0.2),
        noiseSeed: {
          x: seedMultiplier,
          y: seedMultiplier,
          z: seedMultiplier / 2
        },
        noiseScale: NOISE_SCALE
      })
    })
  }

  resize(): void {
    // Update canvas dimensions to match window size
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight

    // Set wind speed (now absolute pixels/sec, not canvas-relative)
    this.windSpeed = DEFAULT_WIND_SPEED

    // Recalculate Mount Fuji geometry with correct aspect ratio
    this.updateMountainGeometry()

    // Reinitialize clouds with new dimensions
    // Static eternal cloud at bottom
    const eternalCloudWidth = this.canvas.width * 1.5
    const eternalCloudHeight = this.canvas.width * 0.25
    const eternalCloudX = this.canvas.width * 0.5 - eternalCloudWidth / 2
    const eternalCloudY = this.canvas.height - eternalCloudHeight / 2

    this.clouds = [
      // Static eternal cloud at bottom
      new Cloud({
        position: { x: eternalCloudX, y: eternalCloudY },
        velocity: { x: 0, y: 0 },
        width: eternalCloudWidth,
        height: eternalCloudHeight,
        noiseSeed: { x: 0, y: 0, z: 0 },
        noiseScale: NOISE_SCALE
      }),
      // Moving clouds
      ...this.createMovingClouds(5)
    ]

    // Initialize flock of 15 birds with random starting positions
    this.birds = Array.from({ length: 15 }, () => new Bird({
      position: {
        x: 0.2 + Math.random() * 0.6, // Random X between 20-80%
        y: 0.2 + Math.random() * 0.4  // Random Y between 20-60%
      },
      scale: 1.0
    }))
  }

  init(): void {
    // Start the animation loop
    this.animate(0)
  }

  update(deltaTime: number): void {
    this.performanceMonitor.startUpdate()

    // Update all clouds with wind speed and canvas dimensions for wrapping
    for (const cloud of this.clouds) {
      cloud.update(deltaTime, this.windSpeed, this.canvas.width, this.canvas.height)
    }

    // Apply flocking behavior to all birds
    for (const bird of this.birds) {
      bird.applyFlocking(this.birds)
    }

    // Update all birds (pass mountain for collision detection)
    for (const bird of this.birds) {
      bird.update(deltaTime, this.canvas.width, this.canvas.height, this.mountain)
    }

    this.performanceMonitor.endUpdate()
  }

  render(): void {
    this.performanceMonitor.startRender()

    const { width, height } = this.canvas

    // 1. Clear canvas with faded white background
    this.ctx.fillStyle = BACKGROUND_COLOR
    this.ctx.fillRect(0, 0, width, height)

    // 2. Draw sun (behind everything)
    this.ctx.globalCompositeOperation = 'source-over'
    this.sun.draw(this.ctx, width)

    // 3. Draw mountain in black ink
    this.ctx.globalCompositeOperation = 'source-over'
    this.mountain.draw(this.ctx, width, height)

    // 3. Draw all birds (before clouds, so clouds can obscure them)
    for (const bird of this.birds) {
      bird.draw(this.ctx, width, height)
    }

    // 4. Draw clouds as background-colored shapes ON TOP of mountain
    // This "washes away" the mountain ink by painting over it with background color
    this.ctx.globalCompositeOperation = 'source-over'
    for (const cloud of this.clouds) {
      cloud.draw(this.ctx, this.currentTime, this.canvas.width)
    }

    this.performanceMonitor.endRender()

    // 5. Draw performance HUD if debug mode is enabled
    if (DEBUG_MODE) {
      this.performanceMonitor.drawHUD(this.ctx)
    }
  }

  animate(timestamp: number): void {
    this.performanceMonitor.startFrame()

    // Calculate delta time in seconds
    const deltaTime = this.lastTime ? (timestamp - this.lastTime) / 1000 : 0
    this.lastTime = timestamp

    // Update current time for cloud morphing
    this.currentTime = timestamp

    this.update(deltaTime)
    this.render()

    this.performanceMonitor.endFrame()

    // Continue animation loop
    requestAnimationFrame((t) => this.animate(t))
  }
}
