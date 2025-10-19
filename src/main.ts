import { Scene } from './Scene'
import './style.css'

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement

  if (!canvas) {
    throw new Error('Canvas element not found')
  }

  // Create and initialize the scene
  const scene = new Scene(canvas)
  scene.init()
})
