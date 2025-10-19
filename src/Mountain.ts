import { Point } from './types'
import { MOUNTAIN_COLOR } from './config'

export class Mountain {
  // Points stored as percentages of canvas dimensions (0-1 range)
  // This allows the mountain to scale with canvas size
  vertices: Point[]

  constructor(vertices: Point[]) {
    this.vertices = vertices
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.vertices.length < 3) return

    // Convert relative coordinates to absolute canvas coordinates
    const absolutePoints = this.vertices.map(v => this.toAbsolute(v, width, height))

    // Draw the mountain shape as a filled polygon
    ctx.fillStyle = MOUNTAIN_COLOR
    ctx.beginPath()
    ctx.moveTo(absolutePoints[0].x, absolutePoints[0].y)

    for (let i = 1; i < absolutePoints.length; i++) {
      ctx.lineTo(absolutePoints[i].x, absolutePoints[i].y)
    }

    ctx.closePath()
    ctx.fill()
  }

  // Convert relative point (0-1) to absolute canvas coordinates
  private toAbsolute(point: Point, width: number, height: number): Point {
    return {
      x: point.x * width,
      y: point.y * height
    }
  }
}
