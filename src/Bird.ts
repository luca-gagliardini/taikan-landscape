import { Vector2 } from './types'
import { MOUNTAIN_COLOR } from './config'

export interface BirdConfig {
  position: Vector2 // Position in canvas-relative coordinates (0-1 range)
  scale?: number // Size multiplier (default 1.0)
}

export class Bird {
  position: Vector2 // Canvas-relative coordinates (0-1 range)
  scale: number

  constructor(config: BirdConfig) {
    this.position = config.position
    this.scale = config.scale ?? 1.0
  }

  draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    // Convert relative position to absolute canvas coordinates
    const x = this.position.x * canvasWidth
    const y = this.position.y * canvasHeight

    // Absolute size in pixels - very small bird
    const baseWingspanPixels = 20 // Fixed 20px wingspan
    const wingspan = baseWingspanPixels * this.scale
    const wingHeight = wingspan * 0.4 // Wing height - longer triangles
    const wingThickness = wingspan * 0.2 // How thick the wing triangle base is - slightly thicker
    const bodyLength = wingspan * 0.4 // Length of vertical body line (head to tail) - shorter

    ctx.save()
    ctx.fillStyle = MOUNTAIN_COLOR
    ctx.strokeStyle = MOUNTAIN_COLOR
    ctx.lineWidth = Math.max(0.75, wingspan * 0.015) // Thinner line for body

    // Left wing - thin triangle pointing more horizontally
    ctx.beginPath()
    ctx.moveTo(x, y) // Center point
    ctx.lineTo(x - wingspan / 2, y - wingHeight * 0.4) // Wing tip (more horizontal, less upward)
    ctx.lineTo(x - wingThickness / 2, y) // Wing base (thin)
    ctx.closePath()
    ctx.fill()

    // Right wing - thin triangle pointing more horizontally
    ctx.beginPath()
    ctx.moveTo(x, y) // Center point
    ctx.lineTo(x + wingspan / 2, y - wingHeight * 0.4) // Wing tip (more horizontal, less upward)
    ctx.lineTo(x + wingThickness / 2, y) // Wing base (thin)
    ctx.closePath()
    ctx.fill()

    // Vertical body line (head above, tail below - wings slightly above center)
    ctx.beginPath()
    ctx.moveTo(x, y - bodyLength * 0.4) // Head (extends up, shorter)
    ctx.lineTo(x, y + bodyLength * 0.6) // Tail (extends down, longer)
    ctx.stroke()

    ctx.restore()
  }
}
