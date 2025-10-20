import { Vector2 } from './types'
import { MOUNTAIN_COLOR } from './config'
import type { Mountain } from './Mountain'

export interface BirdConfig {
  position: Vector2 // Position in canvas-relative coordinates (0-1 range)
  velocity?: Vector2 // Velocity in canvas-relative units per second
  scale?: number // Size multiplier (default 1.0)
  baseSpeed?: number // Base flight speed (default 0.05 - 5% of screen per second)
  minSpeed?: number // Minimum speed when flying upward (default 0.03)
  maxSpeed?: number // Maximum speed when diving downward (default 0.08)
  turnSpeed?: number // How fast bird can turn in radians per second (default π/2)
  gravityEffect?: number // How much gravity affects speed (default 0.02)
}

export class Bird {
  position: Vector2 // Canvas-relative coordinates (0-1 range)
  velocity: Vector2 // Current velocity in canvas-relative units per second
  targetDirection: number // Target angle in radians
  baseSpeed: number // Base flight speed magnitude
  currentSpeed: number // Current speed (varies with angle)
  minSpeed: number // Minimum speed
  maxSpeed: number // Maximum speed
  gravityEffect: number // Gravity acceleration factor
  turnSpeed: number // Turn rate in radians per second
  scale: number
  directionChangeTimer: number // Time until next direction change

  constructor(config: BirdConfig) {
    this.position = config.position
    this.baseSpeed = config.baseSpeed ?? 0.05
    this.minSpeed = config.minSpeed ?? 0.04
    this.maxSpeed = config.maxSpeed ?? 0.08
    this.gravityEffect = config.gravityEffect ?? 0.02
    this.currentSpeed = this.baseSpeed
    this.turnSpeed = config.turnSpeed ?? Math.PI / 2 // Can turn 90 degrees per second
    this.scale = config.scale ?? 1.0

    // Initialize with random direction
    this.targetDirection = Math.random() * Math.PI * 2
    this.velocity = config.velocity ?? {
      x: Math.cos(this.targetDirection) * this.currentSpeed,
      y: Math.sin(this.targetDirection) * this.currentSpeed
    }

    // Pick a new direction after 3-8 seconds
    this.directionChangeTimer = 3 + Math.random() * 5
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number, mountain?: Mountain): void {
    // Check for boundary violations and adjust target direction if needed
    const edgeMargin = 0.05 // 5% margin from edges
    let avoidanceDirection: number | null = null

    // Check window boundaries
    if (this.position.x < edgeMargin) {
      // Too close to left edge - steer right
      avoidanceDirection = 0 // Point right (0 radians)
    } else if (this.position.x > 1 - edgeMargin) {
      // Too close to right edge - steer left
      avoidanceDirection = Math.PI // Point left (180 degrees)
    } else if (this.position.y < edgeMargin) {
      // Too close to top edge - steer down
      avoidanceDirection = Math.PI / 2 // Point down (90 degrees)
    } else if (this.position.y > 1 - edgeMargin) {
      // Too close to bottom edge - steer up
      avoidanceDirection = -Math.PI / 2 // Point up (-90 degrees)
    }

    // Check mountain collision
    if (mountain && mountain.isPointInside(this.position)) {
      // Inside mountain - steer upward (escape the mountain by climbing)
      // This is more natural than steering away from center, especially for Fuji's shape
      avoidanceDirection = -Math.PI / 2 // Point straight up (-90 degrees)

      // Also boost speed slightly to help escape
      if (this.currentSpeed < this.baseSpeed * 1.2) {
        this.currentSpeed = this.baseSpeed * 1.2
      }
    }

    // If we need to avoid an edge/mountain, override target direction
    if (avoidanceDirection !== null) {
      this.targetDirection = avoidanceDirection
    } else {
      // Normal behavior - update direction change timer
      this.directionChangeTimer -= deltaTime
      if (this.directionChangeTimer <= 0) {
        // Pick a new random direction
        this.targetDirection = Math.random() * Math.PI * 2
        // Reset timer for next direction change (3-8 seconds)
        this.directionChangeTimer = 3 + Math.random() * 5
      }
    }

    // Get current direction from velocity
    const currentDirection = Math.atan2(this.velocity.y, this.velocity.x)

    // Calculate shortest angle to target
    let angleDiff = this.targetDirection - currentDirection
    // Normalize to [-π, π]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

    // Natural turning with inertia - turn faster when close to target, slower when far
    // This creates a smoother, more gradual arc rather than constant-rate circle
    const angleDiffNormalized = Math.abs(angleDiff) / Math.PI // 0 to 1

    // Ease-out cubic function: starts slow, ends fast as we approach target
    // Inverted so we turn slower initially (banking into turn), faster as we align
    const turnFactor = 1 - Math.pow(1 - angleDiffNormalized, 3)
    const adjustedTurnSpeed = this.turnSpeed * (0.3 + turnFactor * 0.7) // 30% to 100% of max turn speed

    const maxTurn = adjustedTurnSpeed * deltaTime
    const actualTurn = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), maxTurn)
    const newDirection = currentDirection + actualTurn

    // Apply gravity-like effect based on vertical angle
    // Normalize angle to [0, 2π] for easier calculation
    let normalizedAngle = newDirection
    while (normalizedAngle < 0) normalizedAngle += Math.PI * 2
    while (normalizedAngle >= Math.PI * 2) normalizedAngle -= Math.PI * 2

    // Calculate vertical component: sin gives us -1 (up) to +1 (down)
    // Positive Y is down in canvas coordinates
    const verticalComponent = Math.sin(newDirection)

    // Adjust speed based on vertical angle
    // Flying down (positive verticalComponent): speed increases
    // Flying up (negative verticalComponent): speed decreases
    const speedChange = this.gravityEffect * verticalComponent * deltaTime
    this.currentSpeed += speedChange

    // Clamp speed to min/max bounds
    this.currentSpeed = Math.max(this.minSpeed, Math.min(this.maxSpeed, this.currentSpeed))

    // Update velocity to match new direction with variable speed
    this.velocity.x = Math.cos(newDirection) * this.currentSpeed
    this.velocity.y = Math.sin(newDirection) * this.currentSpeed

    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime
    this.position.y += this.velocity.y * deltaTime
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

    // Translate to bird position and rotate to face velocity direction
    ctx.translate(x, y)
    const angle = Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2 // +90deg because bird head points "up" in local coords
    ctx.rotate(angle)

    ctx.fillStyle = MOUNTAIN_COLOR
    ctx.strokeStyle = MOUNTAIN_COLOR
    ctx.lineWidth = Math.max(0.75, wingspan * 0.015) // Thinner line for body

    // Left wing - thin triangle pointing more horizontally (in local coords)
    ctx.beginPath()
    ctx.moveTo(0, 0) // Center point (now at origin)
    ctx.lineTo(-wingspan / 2, -wingHeight * 0.4) // Wing tip (left-up)
    ctx.lineTo(-wingThickness / 2, 0) // Wing base (thin)
    ctx.closePath()
    ctx.fill()

    // Right wing - thin triangle pointing more horizontally (in local coords)
    ctx.beginPath()
    ctx.moveTo(0, 0) // Center point (now at origin)
    ctx.lineTo(wingspan / 2, -wingHeight * 0.4) // Wing tip (right-up)
    ctx.lineTo(wingThickness / 2, 0) // Wing base (thin)
    ctx.closePath()
    ctx.fill()

    // Vertical body line (head points up, tail points down in local coords)
    ctx.beginPath()
    ctx.moveTo(0, -bodyLength * 0.4) // Head (points toward velocity direction)
    ctx.lineTo(0, bodyLength * 0.6) // Tail (points away from velocity direction)
    ctx.stroke()

    ctx.restore()
  }
}
