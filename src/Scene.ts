import { Mountain } from './Mountain'
import { Cloud } from './Cloud'
import { BACKGROUND_COLOR, CANVAS_WIDTH, CANVAS_HEIGHT, NOISE_SCALE, DEFAULT_WIND_SPEED } from './config'

export class Scene {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  mountain: Mountain
  clouds: Cloud[]
  windSpeed: number
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

    this.windSpeed = DEFAULT_WIND_SPEED * this.canvas.width
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

    // Initialize clouds
    // Phase 4: Clouds move horizontally with wind

    // Static eternal cloud at bottom
    // Positioned so cloud center Y = canvas bottom (100% height)
    // Cloud center X = canvas center (50% width)
    const eternalCloudWidth = this.canvas.width * 1.5 // 1.5x canvas width for good coverage
    const eternalCloudHeight = this.canvas.width * 0.25 // Height relative to canvas width (increased for thicker cloud)

    // Position is top-left corner of cloud bounding box
    // To center cloud horizontally: x = canvasCenter - cloudWidth/2
    // To position cloud center at bottom: y = canvasHeight - cloudHeight/2
    const eternalCloudX = this.canvas.width * 0.5 - eternalCloudWidth / 2
    const eternalCloudY = this.canvas.height - eternalCloudHeight / 2

    this.clouds = [
      // Static eternal cloud at bottom
      new Cloud({
        position: { x: eternalCloudX, y: eternalCloudY },
        velocity: { x: 0, y: 0 }, // No movement - static cloud
        width: eternalCloudWidth,
        height: eternalCloudHeight,
        noiseSeed: { x: 0, y: 0, z: 0 },
        noiseScale: NOISE_SCALE
      }),
      // Moving clouds
      ...this.createMovingClouds(5)
    ]
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

  init(): void {
    // Start the animation loop
    this.animate(0)
  }

  update(deltaTime: number): void {
    // Update all clouds with wind speed and canvas dimensions for wrapping
    for (const cloud of this.clouds) {
      cloud.update(deltaTime, this.windSpeed, this.canvas.width, this.canvas.height)
    }
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
      cloud.draw(this.ctx, this.currentTime, this.canvas.width)
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
