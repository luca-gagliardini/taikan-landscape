import { createNoise3D } from 'simplex-noise'
import { BACKGROUND_COLOR } from './config'

// Create noise function once and export for reuse
export const noise3D = createNoise3D()

// Parse background color once and cache RGB values
const bgColor = BACKGROUND_COLOR
const BG_R = parseInt(bgColor.slice(1, 3), 16)
const BG_G = parseInt(bgColor.slice(3, 5), 16)
const BG_B = parseInt(bgColor.slice(5, 7), 16)

/**
 * Draw a soft, gradient circle for cloud wash effect
 * Paints background color over mountain to create "diluted ink" effect
 */
export function drawSoftCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  alpha: number,
  radius: number
): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
  // Paint with background color at varying opacity to wash away mountain ink
  gradient.addColorStop(0, `rgba(${BG_R}, ${BG_G}, ${BG_B}, ${alpha})`)
  gradient.addColorStop(1, `rgba(${BG_R}, ${BG_G}, ${BG_B}, 0)`)

  ctx.fillStyle = gradient
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
}
