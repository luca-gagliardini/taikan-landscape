import { Vector2 } from './types'
import {
  MOUNTAIN_COLOR,
  BIRD_BASE_SPEED,
  BIRD_MIN_SPEED,
  BIRD_MAX_SPEED,
  BIRD_GRAVITY_EFFECT,
  BIRD_TURN_SPEED,
  BIRD_WINGSPAN,
  BIRD_SEPARATION_DISTANCE,
  BIRD_ALIGNMENT_DISTANCE,
  BIRD_COHESION_DISTANCE,
  BIRD_SEPARATION_WEIGHT,
  BIRD_ALIGNMENT_WEIGHT,
  BIRD_COHESION_WEIGHT,
  BIRD_DIRECTION_CHANGE_MIN,
  BIRD_DIRECTION_CHANGE_MAX,
  BIRD_RANDOM_TURN_RANGE,
  BIRD_FLOCKING_BLEND_FACTOR,
  BIRD_EDGE_MARGIN,
  BIRD_TURN_INERTIA_MIN,
  BIRD_TURN_INERTIA_MAX
} from './config'
import type { Mountain } from './Mountain'

export interface BirdConfig {
  position: Vector2 // Position in canvas-relative coordinates (0-1 range)
  velocity?: Vector2 // Velocity in canvas-relative units per second
  scale?: number // Size multiplier (default 1.0)
  baseSpeed?: number // Base flight speed (default 0.05 - 5% of screen per second)
  minSpeed?: number // Minimum speed when flying upward (default 0.04)
  maxSpeed?: number // Maximum speed when diving downward (default 0.08)
  turnSpeed?: number // How fast bird can turn in radians per second (default π/2)
  gravityEffect?: number // How much gravity affects speed (default 0.02)
  // Flocking parameters
  separationDistance?: number // Distance to avoid other birds (default 0.08)
  alignmentDistance?: number // Distance to match velocity with neighbors (default 0.15)
  cohesionDistance?: number // Distance to move toward group center (default 0.2)
  separationWeight?: number // How strongly to avoid crowding (default 1.5)
  alignmentWeight?: number // How strongly to match heading (default 1.0)
  cohesionWeight?: number // How strongly to move toward center (default 1.0)
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
  // Flocking parameters
  separationDistance: number
  alignmentDistance: number
  cohesionDistance: number
  separationWeight: number
  alignmentWeight: number
  cohesionWeight: number

  constructor(config: BirdConfig) {
    this.position = config.position
    this.baseSpeed = config.baseSpeed ?? BIRD_BASE_SPEED
    this.minSpeed = config.minSpeed ?? BIRD_MIN_SPEED
    this.maxSpeed = config.maxSpeed ?? BIRD_MAX_SPEED
    this.gravityEffect = config.gravityEffect ?? BIRD_GRAVITY_EFFECT
    this.currentSpeed = this.baseSpeed
    this.turnSpeed = config.turnSpeed ?? BIRD_TURN_SPEED
    this.scale = config.scale ?? 1.0

    // Flocking parameters
    this.separationDistance = config.separationDistance ?? BIRD_SEPARATION_DISTANCE
    this.alignmentDistance = config.alignmentDistance ?? BIRD_ALIGNMENT_DISTANCE
    this.cohesionDistance = config.cohesionDistance ?? BIRD_COHESION_DISTANCE
    this.separationWeight = config.separationWeight ?? BIRD_SEPARATION_WEIGHT
    this.alignmentWeight = config.alignmentWeight ?? BIRD_ALIGNMENT_WEIGHT
    this.cohesionWeight = config.cohesionWeight ?? BIRD_COHESION_WEIGHT

    // Initialize with random direction
    this.targetDirection = Math.random() * Math.PI * 2
    this.velocity = config.velocity ?? {
      x: Math.cos(this.targetDirection) * this.currentSpeed,
      y: Math.sin(this.targetDirection) * this.currentSpeed
    }

    // Pick a new direction after random interval
    this.directionChangeTimer = BIRD_DIRECTION_CHANGE_MIN + Math.random() * (BIRD_DIRECTION_CHANGE_MAX - BIRD_DIRECTION_CHANGE_MIN)
  }

  update(deltaTime: number, _canvasWidth: number, _canvasHeight: number, mountain?: Mountain): void {
    // Check for boundary violations and adjust target direction if needed
    let avoidanceDirection: number | null = null

    // Check window boundaries
    if (this.position.x < BIRD_EDGE_MARGIN) {
      // Too close to left edge - steer right
      avoidanceDirection = 0 // Point right (0 radians)
    } else if (this.position.x > 1 - BIRD_EDGE_MARGIN) {
      // Too close to right edge - steer left
      avoidanceDirection = Math.PI // Point left (180 degrees)
    } else if (this.position.y < BIRD_EDGE_MARGIN) {
      // Too close to top edge - steer down
      avoidanceDirection = Math.PI / 2 // Point down (90 degrees)
    } else if (this.position.y > 1 - BIRD_EDGE_MARGIN) {
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
        // Pick a new random direction (subtle adjustment)
        const currentDir = Math.atan2(this.velocity.y, this.velocity.x)
        const randomOffset = (Math.random() - 0.5) * BIRD_RANDOM_TURN_RANGE
        this.targetDirection = currentDir + randomOffset
        // Reset timer for next direction change
        this.directionChangeTimer = BIRD_DIRECTION_CHANGE_MIN + Math.random() * (BIRD_DIRECTION_CHANGE_MAX - BIRD_DIRECTION_CHANGE_MIN)
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
    const adjustedTurnSpeed = this.turnSpeed * (BIRD_TURN_INERTIA_MIN + turnFactor * (BIRD_TURN_INERTIA_MAX - BIRD_TURN_INERTIA_MIN))

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

    // Absolute size in pixels
    const wingspan = BIRD_WINGSPAN * this.scale
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

  // Boid flocking algorithms

  private getNeighbors(flock: Bird[], maxDistance: number): Bird[] {
    return flock.filter(other => {
      if (other === this) return false
      const dx = other.position.x - this.position.x
      const dy = other.position.y - this.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance < maxDistance
    })
  }

  private separation(flock: Bird[]): Vector2 {
    const neighbors = this.getNeighbors(flock, this.separationDistance)
    if (neighbors.length === 0) return { x: 0, y: 0 }

    let steerX = 0
    let steerY = 0
    let totalWeight = 0

    for (const neighbor of neighbors) {
      const dx = this.position.x - neighbor.position.x
      const dy = this.position.y - neighbor.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0 && distance < this.separationDistance) {
        // Dynamic weight: much stronger when very close, weaker as distance increases
        // At distance 0: weight = infinity (prevent collision)
        // At separationDistance: weight = 0
        const normalizedDist = distance / this.separationDistance // 0 to 1
        const urgency = Math.pow(1 - normalizedDist, 3) // Cubic falloff - very strong when close

        steerX += (dx / distance) * urgency
        steerY += (dy / distance) * urgency
        totalWeight += urgency
      }
    }

    if (totalWeight > 0) {
      steerX /= totalWeight
      steerY /= totalWeight
    }

    return { x: steerX * this.separationWeight, y: steerY * this.separationWeight }
  }

  private alignment(flock: Bird[]): Vector2 {
    const neighbors = this.getNeighbors(flock, this.alignmentDistance)
    if (neighbors.length === 0) return { x: 0, y: 0 }

    let avgVelX = 0
    let avgVelY = 0
    let totalWeight = 0

    for (const neighbor of neighbors) {
      const dx = neighbor.position.x - this.position.x
      const dy = neighbor.position.y - this.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Alignment is strongest in the "sweet spot" - mid-range distance
      // We want a bell curve: weak when too close, strong at mid-range, weak when far
      const normalizedDist = distance / this.alignmentDistance // 0 to 1
      // Peak at 0.5 (middle of range)
      const sweetSpot = 1 - Math.abs(normalizedDist - 0.5) * 2 // 0 at edges, 1 at center
      const weight = Math.pow(sweetSpot, 2) // Square it for stronger peak

      avgVelX += neighbor.velocity.x * weight
      avgVelY += neighbor.velocity.y * weight
      totalWeight += weight
    }

    if (totalWeight > 0) {
      avgVelX /= totalWeight
      avgVelY /= totalWeight
    }

    // Steer toward average heading
    const steerX = (avgVelX - this.velocity.x) * this.alignmentWeight
    const steerY = (avgVelY - this.velocity.y) * this.alignmentWeight

    return { x: steerX, y: steerY }
  }

  private cohesion(flock: Bird[]): Vector2 {
    const neighbors = this.getNeighbors(flock, this.cohesionDistance)
    if (neighbors.length === 0) return { x: 0, y: 0 }

    let avgPosX = 0
    let avgPosY = 0
    let totalWeight = 0

    for (const neighbor of neighbors) {
      const dx = neighbor.position.x - this.position.x
      const dy = neighbor.position.y - this.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Cohesion is strongest when far from the group
      // Linear increase: weak when close, strong when far
      const normalizedDist = distance / this.cohesionDistance // 0 to 1
      const weight = Math.pow(normalizedDist, 2) // Quadratic - stronger pull as distance increases

      avgPosX += neighbor.position.x * weight
      avgPosY += neighbor.position.y * weight
      totalWeight += weight
    }

    if (totalWeight > 0) {
      avgPosX /= totalWeight
      avgPosY /= totalWeight
    }

    // Steer toward average position
    const steerX = (avgPosX - this.position.x) * this.cohesionWeight
    const steerY = (avgPosY - this.position.y) * this.cohesionWeight

    return { x: steerX, y: steerY }
  }

  applyFlocking(flock: Bird[]): void {
    const sep = this.separation(flock)
    const ali = this.alignment(flock)
    const coh = this.cohesion(flock)

    // Combine all forces to influence target direction
    const totalForceX = sep.x + ali.x + coh.x
    const totalForceY = sep.y + ali.y + coh.y

    // If there's a significant flocking force, adjust target direction
    const forceMagnitude = Math.sqrt(totalForceX * totalForceX + totalForceY * totalForceY)
    if (forceMagnitude > 0.01) {
      // Calculate desired direction from flocking forces
      const desiredDirection = Math.atan2(totalForceY, totalForceX)

      // Blend with current target direction
      const blendFactor = BIRD_FLOCKING_BLEND_FACTOR
      const currentDir = this.targetDirection

      // Interpolate angles
      let angleDiff = desiredDirection - currentDir
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

      this.targetDirection = currentDir + angleDiff * blendFactor
    }
  }
}
