/**
 * Performance monitoring system for tracking FPS, frame timing, and memory usage
 *
 * Key Metrics Explained:
 * - FPS (Frames Per Second): How many frames rendered per second. Target: 60fps
 * - Frame Time: Time taken to complete one frame. Target: <16.67ms (1000ms / 60fps)
 * - Update Time: Time spent in update() logic (physics, animations)
 * - Render Time: Time spent drawing to canvas
 * - Memory: Heap usage (only available in some browsers with performance.memory)
 */

interface PerformanceMetrics {
  fps: number
  frameTime: number
  updateTime: number
  renderTime: number
  memoryUsed?: number
  memoryTotal?: number
}

interface FrameRecord {
  timestamp: number
  frameTime: number
  updateTime: number
  renderTime: number
  fps: number
}

export class PerformanceMonitor {
  // Current metrics
  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    updateTime: 0,
    renderTime: 0
  }

  // Frame timing tracking
  private frameTimes: number[] = []
  private readonly maxFrameSamples = 60 // Track last 60 frames for FPS calculation

  // Detailed frame history (first 10 seconds for startup analysis)
  private frameHistory: FrameRecord[] = []
  private startupDuration = 10000 // Track first 10 seconds in detail
  private startTime: number = 0
  private isInStartupPhase = true

  // Performance timing markers
  private frameStartTime = 0
  private updateStartTime = 0
  private renderStartTime = 0

  // Memory tracking
  private readonly hasMemoryAPI: boolean

  constructor() {
    // Check if performance.memory API is available (Chrome/Edge)
    this.hasMemoryAPI = 'memory' in performance
    this.startTime = performance.now()
  }

  /**
   * Call at the start of each frame
   */
  startFrame(): void {
    this.frameStartTime = performance.now()
  }

  /**
   * Call before update() logic
   */
  startUpdate(): void {
    this.updateStartTime = performance.now()
  }

  /**
   * Call after update() logic completes
   */
  endUpdate(): void {
    this.metrics.updateTime = performance.now() - this.updateStartTime
  }

  /**
   * Call before render() logic
   */
  startRender(): void {
    this.renderStartTime = performance.now()
  }

  /**
   * Call after render() logic completes
   */
  endRender(): void {
    this.metrics.renderTime = performance.now() - this.renderStartTime
  }

  /**
   * Call at the end of each frame to finalize metrics
   */
  endFrame(): void {
    const now = performance.now()
    const frameTime = now - this.frameStartTime

    // Track frame times for FPS calculation
    this.frameTimes.push(frameTime)
    if (this.frameTimes.length > this.maxFrameSamples) {
      this.frameTimes.shift()
    }

    // Calculate FPS from average frame time
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
    this.metrics.fps = 1000 / avgFrameTime
    this.metrics.frameTime = frameTime

    // Track memory if available
    if (this.hasMemoryAPI) {
      const memory = (performance as any).memory
      this.metrics.memoryUsed = memory.usedJSHeapSize
      this.metrics.memoryTotal = memory.totalJSHeapSize
    }

    // Record detailed history during startup phase
    if (this.isInStartupPhase) {
      const elapsed = now - this.startTime

      this.frameHistory.push({
        timestamp: elapsed,
        frameTime,
        updateTime: this.metrics.updateTime,
        renderTime: this.metrics.renderTime,
        fps: this.metrics.fps
      })

      if (elapsed > this.startupDuration) {
        this.isInStartupPhase = false
        this.logStartupAnalysis()
      }
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Check if we have memory tracking available
   */
  hasMemory(): boolean {
    return this.hasMemoryAPI
  }

  /**
   * Log startup performance analysis to console
   */
  private logStartupAnalysis(): void {
    console.group('🚀 Startup Performance Analysis (first 10 seconds)')

    // Calculate statistics
    const frameTimes = this.frameHistory.map(f => f.frameTime)
    const fps = this.frameHistory.map(f => f.fps)

    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    const maxFrameTime = Math.max(...frameTimes)
    const minFrameTime = Math.min(...frameTimes)

    const avgFPS = fps.reduce((a, b) => a + b, 0) / fps.length
    const minFPS = Math.min(...fps)

    // Count slow frames (>16.67ms = below 60fps)
    const slowFrames = frameTimes.filter(t => t > 16.67).length
    const slowFramePercent = (slowFrames / frameTimes.length * 100).toFixed(1)

    console.log(`📊 Frame Statistics:`)
    console.log(`  Average FPS: ${avgFPS.toFixed(1)} fps`)
    console.log(`  Minimum FPS: ${minFPS.toFixed(1)} fps`)
    console.log(`  Average Frame Time: ${avgFrameTime.toFixed(2)}ms`)
    console.log(`  Min/Max Frame Time: ${minFrameTime.toFixed(2)}ms / ${maxFrameTime.toFixed(2)}ms`)
    console.log(`  Slow Frames (>16.67ms): ${slowFrames} (${slowFramePercent}%)`)

    // Find the slowest frames
    const slowestFrames = this.frameHistory
      .map((f, i) => ({ ...f, index: i }))
      .sort((a, b) => b.frameTime - a.frameTime)
      .slice(0, 5)

    console.log(`\n⚠️  Top 5 Slowest Frames:`)
    slowestFrames.forEach((frame, i) => {
      console.log(`  ${i + 1}. Frame ${frame.index}: ${frame.frameTime.toFixed(2)}ms at ${(frame.timestamp / 1000).toFixed(2)}s`)
      console.log(`     Update: ${frame.updateTime.toFixed(2)}ms, Render: ${frame.renderTime.toFixed(2)}ms`)
    })

    // Check for patterns in first second vs rest
    const firstSecondFrames = this.frameHistory.filter(f => f.timestamp < 1000)
    const laterFrames = this.frameHistory.filter(f => f.timestamp >= 1000)

    if (firstSecondFrames.length > 0 && laterFrames.length > 0) {
      const firstSecAvg = firstSecondFrames.reduce((a, b) => a + b.frameTime, 0) / firstSecondFrames.length
      const laterAvg = laterFrames.reduce((a, b) => a + b.frameTime, 0) / laterFrames.length
      const improvement = ((firstSecAvg - laterAvg) / firstSecAvg * 100).toFixed(1)

      console.log(`\n🔥 Warmup Analysis:`)
      console.log(`  First second avg: ${firstSecAvg.toFixed(2)}ms`)
      console.log(`  After warmup avg: ${laterAvg.toFixed(2)}ms`)
      console.log(`  Improvement: ${improvement}% faster after warmup`)
    }

    console.groupEnd()
  }

  /**
   * Draw performance HUD on canvas
   */
  drawHUD(ctx: CanvasRenderingContext2D): void {
    const padding = 10
    const lineHeight = 16
    const fontSize = 12

    ctx.save()

    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    const hudWidth = 250
    const hudHeight = this.hasMemoryAPI ? 120 : 90
    ctx.fillRect(padding, padding, hudWidth, hudHeight)

    // Text styling
    ctx.fillStyle = '#00ff00'
    ctx.font = `${fontSize}px monospace`
    ctx.textBaseline = 'top'

    let y = padding + 8

    // FPS (color coded: green >50, yellow 30-50, red <30)
    const fpsColor = this.metrics.fps > 50 ? '#00ff00' : this.metrics.fps > 30 ? '#ffff00' : '#ff0000'
    ctx.fillStyle = fpsColor
    ctx.fillText(`FPS: ${this.metrics.fps.toFixed(1)}`, padding + 8, y)
    y += lineHeight

    // Frame time
    ctx.fillStyle = '#00ff00'
    ctx.fillText(`Frame: ${this.metrics.frameTime.toFixed(2)}ms`, padding + 8, y)
    y += lineHeight

    // Update time
    ctx.fillText(`Update: ${this.metrics.updateTime.toFixed(2)}ms`, padding + 8, y)
    y += lineHeight

    // Render time
    ctx.fillText(`Render: ${this.metrics.renderTime.toFixed(2)}ms`, padding + 8, y)
    y += lineHeight

    // Memory (if available)
    if (this.hasMemoryAPI && this.metrics.memoryUsed !== undefined && this.metrics.memoryTotal !== undefined) {
      const memMB = (this.metrics.memoryUsed / 1024 / 1024).toFixed(1)
      const totalMB = (this.metrics.memoryTotal / 1024 / 1024).toFixed(1)
      ctx.fillText(`Memory: ${memMB}MB / ${totalMB}MB`, padding + 8, y)
      y += lineHeight
    }

    // Startup phase indicator
    if (this.isInStartupPhase) {
      const elapsed = (performance.now() - this.startTime) / 1000
      ctx.fillStyle = '#ffff00'
      ctx.fillText(`Startup: ${elapsed.toFixed(1)}s / 10s`, padding + 8, y)
    }

    ctx.restore()
  }
}
