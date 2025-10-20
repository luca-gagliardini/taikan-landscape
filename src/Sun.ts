import { SUN_COLOR, SUN_RADIUS, SUN_OFFSET_FROM_TOP, SUN_OFFSET_FROM_RIGHT } from './config'

export class Sun {
  radius: number
  offsetFromTop: number
  offsetFromRight: number

  constructor() {
    this.radius = SUN_RADIUS
    this.offsetFromTop = SUN_OFFSET_FROM_TOP
    this.offsetFromRight = SUN_OFFSET_FROM_RIGHT
  }

  draw(ctx: CanvasRenderingContext2D, canvasWidth: number): void {
    // Calculate absolute position (top-right corner with offsets)
    const x = canvasWidth - this.offsetFromRight
    const y = this.offsetFromTop

    ctx.save()
    ctx.fillStyle = SUN_COLOR

    // Draw solid circle
    ctx.beginPath()
    ctx.arc(x, y, this.radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}
