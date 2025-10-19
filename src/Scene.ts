import { Mountain } from './Mountain'
import { Cloud } from './Cloud'
import { BACKGROUND_COLOR, CANVAS_WIDTH, CANVAS_HEIGHT, NOISE_SCALE } from './config'

export class Scene {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  mountain: Mountain
  clouds: Cloud[]
  currentTime: number
  lastTime: number

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = canvasElement
    this.canvas.width = CANVAS_WIDTH
    this.canvas.height = CANVAS_HEIGHT

    const ctx = this.canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas')
    }
    this.ctx = ctx

    this.currentTime = 0
    this.lastTime = 0

    // Initialize with trapezoid mountain shape
    // Base extends slightly below canvas (1.01 = 1% below) to ensure no gap at bottom
    this.mountain = new Mountain([
      { x: 0.35, y: 0.25 }, // top-left
      { x: 0.65, y: 0.25 }, // top-right
      { x: 0.8, y: 1.01 },  // bottom-right (extends below canvas)
      { x: 0.2, y: 1.01 }   // bottom-left (extends below canvas)
    ])

    // Initialize with one static cloud overlapping the mountain
    // Phase 2: Cloud is static (no movement) for aesthetic tuning
    this.clouds = [
      new Cloud({
        position: { x: 50, y: 140 }, // Adjusted x for wider cloud
        velocity: { x: 0, y: 0 }, // No movement in Phase 2
        width: 960,  // 20% longer (800 * 1.2)
        height: 192, // 20% thinner (240 * 0.8)
        scale: 1.0,
        noiseSeed: { x: 0, y: 0, z: 0 },
        noiseScale: NOISE_SCALE
      })
    ]
  }

  init(): void {
    // Start the animation loop
    this.animate(0)
  }

  update(deltaTime: number): void {
    // For Phase 1, we don't have any animations yet
    // This will be used in later phases for cloud movement
  }

  render(): void {
    const { width, height } = this.canvas

    // 1. Clear canvas with faded white background
    this.ctx.fillStyle = BACKGROUND_COLOR
    this.ctx.fillRect(0, 0, width, height)

    // 2. Draw mountain in black ink
    this.ctx.globalCompositeOperation = 'source-over'
    this.mountain.draw(this.ctx, width, height)

    // 3. Draw clouds as background-colored shapes ON TOP of mountain
    // This "washes away" the mountain ink by painting over it with background color
    this.ctx.globalCompositeOperation = 'source-over'
    for (const cloud of this.clouds) {
      cloud.draw(this.ctx, this.currentTime)
    }
  }

  animate(timestamp: number): void {
    // Calculate delta time in seconds
    const deltaTime = this.lastTime ? (timestamp - this.lastTime) / 1000 : 0
    this.lastTime = timestamp

    // Update current time for cloud morphing
    this.currentTime = timestamp

    this.update(deltaTime)
    this.render()

    // Continue animation loop
    requestAnimationFrame((t) => this.animate(t))
  }
}
