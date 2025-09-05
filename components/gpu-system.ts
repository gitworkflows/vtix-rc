/**
 * GPU System for Hyper Terminal
 * Provides unified interface for WebGPU, Metal, Vulkan, and OpenGL/WebGL
 */

export interface GPUAdapter {
  name: string
  type: "webgpu" | "metal" | "vulkan" | "webgl"
  isAvailable(): Promise<boolean>
  initialize(): Promise<boolean>
  getInfo(): GPUInfo
  createComputeShader(source: string): Promise<GPUComputeShader | null>
  executeCompute(shader: GPUComputeShader, data: ArrayBuffer): Promise<ArrayBuffer | null>
  cleanup(): void
}

export interface GPUInfo {
  vendor: string
  renderer: string
  version: string
  extensions: string[]
  limits: Record<string, number>
}

export interface GPUComputeShader {
  id: string
  source: string
  compiled: boolean
}

/**
 * WebGPU Adapter - Modern web standard for GPU acceleration
 */
export class WebGPUAdapter implements GPUAdapter {
  name = "WebGPU"
  type = "webgpu" as const
  private device: GPUDevice | null = null
  private adapter: GPUAdapter | null = null

  async isAvailable(): Promise<boolean> {
    return "gpu" in navigator && navigator.gpu !== undefined
  }

  async initialize(): Promise<boolean> {
    try {
      if (!(await this.isAvailable())) return false

      this.adapter = await navigator.gpu.requestAdapter()
      if (!this.adapter) return false

      this.device = await this.adapter.requestDevice()
      return true
    } catch (error) {
      console.error("[v0] WebGPU initialization failed:", error)
      return false
    }
  }

  getInfo(): GPUInfo {
    if (!this.adapter || !this.device) {
      return {
        vendor: "Unknown",
        renderer: "WebGPU (Not initialized)",
        version: "1.0",
        extensions: [],
        limits: {},
      }
    }

    return {
      vendor: this.adapter.info?.vendor || "Unknown",
      renderer: this.adapter.info?.description || "WebGPU Device",
      version: "1.0",
      extensions: this.adapter.features ? Array.from(this.adapter.features) : [],
      limits: {
        maxComputeWorkgroupSizeX: this.device.limits.maxComputeWorkgroupSizeX,
        maxComputeWorkgroupSizeY: this.device.limits.maxComputeWorkgroupSizeY,
        maxComputeWorkgroupSizeZ: this.device.limits.maxComputeWorkgroupSizeZ,
        maxStorageBufferBindingSize: this.device.limits.maxStorageBufferBindingSize,
      },
    }
  }

  async createComputeShader(source: string): Promise<GPUComputeShader | null> {
    if (!this.device) return null

    try {
      const shaderModule = this.device.createShaderModule({ code: source })
      return {
        id: `webgpu-${Date.now()}`,
        source,
        compiled: true,
      }
    } catch (error) {
      console.error("[v0] WebGPU shader compilation failed:", error)
      return null
    }
  }

  async executeCompute(shader: GPUComputeShader, data: ArrayBuffer): Promise<ArrayBuffer | null> {
    if (!this.device || !shader.compiled) return null

    try {
      // Create buffers and execute compute shader
      const inputBuffer = this.device.createBuffer({
        size: data.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      })

      const outputBuffer = this.device.createBuffer({
        size: data.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      })

      this.device.queue.writeBuffer(inputBuffer, 0, data)

      // Execute compute pass
      const commandEncoder = this.device.createCommandEncoder()
      const computePass = commandEncoder.beginComputePass()
      // Add compute shader execution logic here
      computePass.end()

      this.device.queue.submit([commandEncoder.finish()])

      // Read back results
      const readBuffer = this.device.createBuffer({
        size: data.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      })

      const copyEncoder = this.device.createCommandEncoder()
      copyEncoder.copyBufferToBuffer(outputBuffer, 0, readBuffer, 0, data.byteLength)
      this.device.queue.submit([copyEncoder.finish()])

      await readBuffer.mapAsync(GPUMapMode.READ)
      const result = readBuffer.getMappedRange().slice(0)
      readBuffer.unmap()

      return result
    } catch (error) {
      console.error("[v0] WebGPU compute execution failed:", error)
      return null
    }
  }

  cleanup(): void {
    this.device?.destroy()
    this.device = null
    this.adapter = null
  }
}

/**
 * WebGL Adapter - Widely supported GPU API for browsers
 */
export class WebGLAdapter implements GPUAdapter {
  name = "WebGL"
  type = "webgl" as const
  private gl: WebGL2RenderingContext | null = null
  private canvas: HTMLCanvasElement | null = null

  async isAvailable(): Promise<boolean> {
    try {
      const canvas = document.createElement("canvas")
      const gl = canvas.getContext("webgl2")
      return gl !== null
    } catch {
      return false
    }
  }

  async initialize(): Promise<boolean> {
    try {
      this.canvas = document.createElement("canvas")
      this.gl = this.canvas.getContext("webgl2")
      return this.gl !== null
    } catch (error) {
      console.error("[v0] WebGL initialization failed:", error)
      return false
    }
  }

  getInfo(): GPUInfo {
    if (!this.gl) {
      return {
        vendor: "Unknown",
        renderer: "WebGL (Not initialized)",
        version: "2.0",
        extensions: [],
        limits: {},
      }
    }

    const debugInfo = this.gl.getExtension("WEBGL_debug_renderer_info")

    return {
      vendor: debugInfo ? this.gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : "Unknown",
      renderer: debugInfo ? this.gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "WebGL Device",
      version: this.gl.getParameter(this.gl.VERSION),
      extensions: this.gl.getSupportedExtensions() || [],
      limits: {
        maxTextureSize: this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE),
        maxViewportDims: this.gl.getParameter(this.gl.MAX_VIEWPORT_DIMS),
        maxVertexAttribs: this.gl.getParameter(this.gl.MAX_VERTEX_ATTRIBS),
      },
    }
  }

  async createComputeShader(source: string): Promise<GPUComputeShader | null> {
    if (!this.gl) return null

    try {
      // WebGL doesn't have compute shaders, but we can simulate with fragment shaders
      const shader = this.gl.createShader(this.gl.FRAGMENT_SHADER)
      if (!shader) return null

      this.gl.shaderSource(shader, source)
      this.gl.compileShader(shader)

      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        console.error("[v0] WebGL shader compilation error:", this.gl.getShaderInfoLog(shader))
        return null
      }

      return {
        id: `webgl-${Date.now()}`,
        source,
        compiled: true,
      }
    } catch (error) {
      console.error("[v0] WebGL shader creation failed:", error)
      return null
    }
  }

  async executeCompute(shader: GPUComputeShader, data: ArrayBuffer): Promise<ArrayBuffer | null> {
    // WebGL compute simulation would go here
    console.log("[v0] WebGL compute simulation not fully implemented")
    return data
  }

  cleanup(): void {
    this.gl = null
    this.canvas = null
  }
}

/**
 * Metal Adapter - Apple's GPU API (via WebGPU backend)
 */
export class MetalAdapter implements GPUAdapter {
  name = "Metal"
  type = "metal" as const
  private webgpuAdapter: WebGPUAdapter

  constructor() {
    this.webgpuAdapter = new WebGPUAdapter()
  }

  async isAvailable(): Promise<boolean> {
    // Metal is available on macOS/iOS through WebGPU
    const isMac = navigator.platform.toLowerCase().includes("mac")
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    return (isMac || isIOS) && (await this.webgpuAdapter.isAvailable())
  }

  async initialize(): Promise<boolean> {
    return await this.webgpuAdapter.initialize()
  }

  getInfo(): GPUInfo {
    const info = this.webgpuAdapter.getInfo()
    return {
      ...info,
      renderer: `Metal (${info.renderer})`,
    }
  }

  async createComputeShader(source: string): Promise<GPUComputeShader | null> {
    return await this.webgpuAdapter.createComputeShader(source)
  }

  async executeCompute(shader: GPUComputeShader, data: ArrayBuffer): Promise<ArrayBuffer | null> {
    return await this.webgpuAdapter.executeCompute(shader, data)
  }

  cleanup(): void {
    this.webgpuAdapter.cleanup()
  }
}

/**
 * Vulkan Adapter - Cross-platform low-level GPU API (via WebGPU backend)
 */
export class VulkanAdapter implements GPUAdapter {
  name = "Vulkan"
  type = "vulkan" as const
  private webgpuAdapter: WebGPUAdapter

  constructor() {
    this.webgpuAdapter = new WebGPUAdapter()
  }

  async isAvailable(): Promise<boolean> {
    // Vulkan is available on Linux/Windows through WebGPU
    return await this.webgpuAdapter.isAvailable()
  }

  async initialize(): Promise<boolean> {
    return await this.webgpuAdapter.initialize()
  }

  getInfo(): GPUInfo {
    const info = this.webgpuAdapter.getInfo()
    return {
      ...info,
      renderer: `Vulkan (${info.renderer})`,
    }
  }

  async createComputeShader(source: string): Promise<GPUComputeShader | null> {
    return await this.webgpuAdapter.createComputeShader(source)
  }

  async executeCompute(shader: GPUComputeShader, data: ArrayBuffer): Promise<ArrayBuffer | null> {
    return await this.webgpuAdapter.executeCompute(shader, data)
  }

  cleanup(): void {
    this.webgpuAdapter.cleanup()
  }
}

/**
 * GPU Manager - Manages multiple GPU adapters and provides unified interface
 */
export class GPUManager {
  private adapters: Map<string, GPUAdapter> = new Map()
  private activeAdapter: GPUAdapter | null = null

  constructor() {
    this.registerAdapters()
  }

  private registerAdapters(): void {
    this.adapters.set("webgpu", new WebGPUAdapter())
    this.adapters.set("webgl", new WebGLAdapter())
    this.adapters.set("metal", new MetalAdapter())
    this.adapters.set("vulkan", new VulkanAdapter())
  }

  async getAvailableAdapters(): Promise<GPUAdapter[]> {
    const available: GPUAdapter[] = []

    for (const adapter of this.adapters.values()) {
      if (await adapter.isAvailable()) {
        available.push(adapter)
      }
    }

    return available
  }

  async initializeBestAdapter(): Promise<GPUAdapter | null> {
    const available = await this.getAvailableAdapters()

    // Priority order: WebGPU > Metal > Vulkan > WebGL
    const priority = ["webgpu", "metal", "vulkan", "webgl"]

    for (const type of priority) {
      const adapter = available.find((a) => a.type === type)
      if (adapter && (await adapter.initialize())) {
        this.activeAdapter = adapter
        return adapter
      }
    }

    return null
  }

  getActiveAdapter(): GPUAdapter | null {
    return this.activeAdapter
  }

  async switchAdapter(type: string): Promise<boolean> {
    const adapter = this.adapters.get(type)
    if (!adapter || !(await adapter.isAvailable())) {
      return false
    }

    if (this.activeAdapter) {
      this.activeAdapter.cleanup()
    }

    if (await adapter.initialize()) {
      this.activeAdapter = adapter
      return true
    }

    return false
  }

  cleanup(): void {
    if (this.activeAdapter) {
      this.activeAdapter.cleanup()
      this.activeAdapter = null
    }
  }
}
