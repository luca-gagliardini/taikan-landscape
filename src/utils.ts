import { createNoise3D } from 'simplex-noise'
import { BACKGROUND_COLOR, DEBUG_CLOUD_COLOR } from './config'

// Create noise function once and export for reuse
export const noise3D = createNoise3D()

// Parse cloud color (debug or normal background)
const cloudColor = DEBUG_CLOUD_COLOR ?? BACKGROUND_COLOR
const CLOUD_R = parseInt(cloudColor.slice(1, 3), 16)
const CLOUD_G = parseInt(cloudColor.slice(3, 5), 16)
const CLOUD_B = parseInt(cloudColor.slice(5, 7), 16)

/**
 * Draw a soft, gradient circle for cloud wash effect
 * Paints cloud color over mountain to create "diluted ink" effect
 */
export function drawSoftCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  alpha: number,
  radius: number
): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
  // Paint with cloud color at varying opacity to wash away mountain ink
  gradient.addColorStop(0, `rgba(${CLOUD_R}, ${CLOUD_G}, ${CLOUD_B}, ${alpha})`)
  gradient.addColorStop(1, `rgba(${CLOUD_R}, ${CLOUD_G}, ${CLOUD_B}, 0)`)

  ctx.fillStyle = gradient
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
}
