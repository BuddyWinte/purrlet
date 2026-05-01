/**
 * Multi-layer canvas management system.
 *
 * Implements a Photoshop-style layer stack on top of a base canvas.
 * Each layer is backed by its own `<canvas>` element that is visually
 * stacked via CSS `position: absolute` and `z-index` inside the same
 * parent as the base canvas. Layer canvases have `pointerEvents: "none"`
 * so that pointer events always pass through to the base canvas.
 *
 * The layer manager supports:
 * - Adding / removing layers (minimum one layer enforced).
 * - Active layer selection (drawing target).
 * - Per-layer opacity, visibility, and blend mode.
 * - Flattening all visible layers onto the base canvas.
 *
 * @module core/layers
 * @since 0.2.0
 */

/**
 * Metadata and rendering context for a single canvas layer.
 *
 * This is the same type exported from `types.ts` but is defined
 * locally here as well to avoid a circular dependency. The public
 * type from `types.ts` should be used by consumers.
 *
 * @since 0.2.0
 */
export type LayerInfo = {
  /** Unique layer identifier (e.g. `"layer-0"`) */
  id: string;
  /** Human-readable layer name */
  name: string;
  /** Off-screen canvas element for this layer */
  canvas: HTMLCanvasElement;
  /** 2D rendering context for the layer's canvas */
  ctx: CanvasRenderingContext2D;
  /** Layer opacity from 0 (transparent) to 1 (opaque) */
  opacity: number;
  /** Whether the layer is rendered during compositing */
  visible: boolean;
  /** Canvas globalCompositeOperation used when flattening */
  blendMode: GlobalCompositeOperation;
};

/**
 * Create a layer manager for the given base canvas.
 *
 * On creation, a default "Background" layer is automatically added
 * and set as active. All layer canvases are inserted as siblings
 * of the base canvas in the DOM.
 *
 * @param baseCanvas — The primary canvas element (used as the
 *                     compositing target for flatten).
 * @param baseCtx    — The 2D context of the base canvas.
 * @param dpr        — Current device pixel ratio (applied to each
 *                     layer's context for consistent scaling).
 * @returns Layer manager API.
 *
 * @example
 * ```ts
 * const layers = createLayerManager(canvas, ctx, dpr);
 * const sketchId = layers.addLayer('Sketch');
 * layers.setActiveLayer(sketchId);
 * layers.flattenLayers();
 * layers.destroy();
 * ```
 *
 * @since 0.2.0
 */
export function createLayerManager(
  baseCanvas: HTMLCanvasElement,
  baseCtx: CanvasRenderingContext2D,
  dpr: number
) {
  /** Map of layer ID → layer metadata. */
  const layers: Map<string, LayerInfo> = new Map();
  /** The currently active (drawing target) layer ID. */
  let activeLayerId: string | null = null;
  /** Auto-incrementing counter for generating unique layer IDs. */
  let nextId = 0;

  /**
   * Create the default "Background" layer and mark it active.
   * Called automatically during initialization.
   */
  function init() {
    const id = generateId();
    const layer = createLayerCanvas(id, "Background");
    layers.set(id, layer);
    activeLayerId = id;
    return id;
  }

  /**
   * Generate a unique layer ID string.
   * @returns A string like `"layer-0"`, `"layer-1"`, etc.
   */
  function generateId(): string {
    return "layer-" + (nextId++);
  }

  /**
   * Create a new layer canvas element, insert it into the DOM, and
   * return its metadata.
   *
   * The canvas is sized to match the base canvas and positioned
   * absolutely on top. Its `z-index` is set to `layers.size` so that
   * layers stack in insertion order.
   *
   * @param id   — Unique layer ID.
   * @param name — Display name.
   * @returns A fully initialized {@link LayerInfo} object.
   */
  function createLayerCanvas(id: string, name: string): LayerInfo {
    const canvas = document.createElement("canvas");
    canvas.width = baseCanvas.width;
    canvas.height = baseCanvas.height;
    // Position the layer canvas directly on top of the base canvas
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.width = baseCanvas.style.width || baseCanvas.clientWidth + "px";
    canvas.style.height = baseCanvas.style.height || baseCanvas.clientHeight + "px";
    canvas.style.zIndex = String(layers.size);
    // Let pointer events pass through to the base canvas
    canvas.style.pointerEvents = "none";

    // Insert as a sibling before the base canvas
    baseCanvas.parentNode?.insertBefore(canvas, baseCanvas);

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    return {
      id,
      name,
      canvas,
      ctx,
      opacity: 1,
      visible: true,
      blendMode: "source-over",
    };
  }

  /**
   * Add a new layer and make it the active layer.
   *
   * @param name — Optional display name. Defaults to `"Layer N"`.
   * @returns The ID of the newly created layer.
   */
  function addLayer(name?: string): string {
    const id = generateId();
    const layer = createLayerCanvas(id, name || `Layer ${nextId - 1}`);
    layers.set(id, layer);
    activeLayerId = id;
    return id;
  }

  /**
   * Set the active (drawing target) layer.
   *
   * @param layerId — ID of the layer to activate.
   * @throws `[Purrlet] Layer not found: <id>` if the layer does not exist.
   */
  function setActiveLayer(layerId: string): void {
    if (!layers.has(layerId)) {
      throw new Error(`[Purrlet] Layer not found: ${layerId}`);
    }
    activeLayerId = layerId;
  }

  /**
   * Look up a layer by its ID.
   *
   * @param layerId — The layer ID.
   * @returns The layer info, or `undefined` if not found.
   */
  function getLayer(layerId: string): LayerInfo | undefined {
    return layers.get(layerId);
  }

  /**
   * @returns The currently active layer's info, or `undefined` if
   *          no layers exist (should not happen in practice).
   */
  function getActiveLayer(): LayerInfo | undefined {
    return activeLayerId ? layers.get(activeLayerId) : undefined;
  }

  /**
   * Remove a layer from the stack and detach its DOM element.
   *
   * The last remaining layer cannot be removed (at least one must
   * always exist). If the removed layer was active, the first
   * remaining layer becomes active.
   *
   * @param layerId — The layer to remove.
   * @throws `[Purrlet] Cannot remove the last layer`.
   */
  function removeLayer(layerId: string): void {
    if (layers.size <= 1) {
      throw new Error("[Purrlet] Cannot remove the last layer");
    }
    const layer = layers.get(layerId);
    if (!layer) return;

    // Detach the layer's canvas from the DOM
    layer.canvas.remove();
    layers.delete(layerId);

    // If the active layer was removed, fall back to the first layer
    if (activeLayerId === layerId) {
      activeLayerId = Array.from(layers.keys())[0] || null;
    }
  }

  /**
   * Composite all visible layers onto the base canvas.
   *
   * The base canvas is cleared first, then each visible layer is
   * drawn in insertion order with its opacity and blend mode applied.
   * Hidden layers are skipped entirely.
   */
  function flattenLayers(): void {
    // Clear the base canvas
    baseCtx.save();
    baseCtx.setTransform(1, 0, 0, 1, 0, 0);
    baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
    baseCtx.restore();

    // Composite each visible layer
    for (const layer of layers.values()) {
      if (!layer.visible) continue;
      baseCtx.save();
      baseCtx.globalAlpha = layer.opacity;
      baseCtx.globalCompositeOperation = layer.blendMode;
      baseCtx.setTransform(1, 0, 0, 1, 0, 0);
      baseCtx.drawImage(layer.canvas, 0, 0);
      baseCtx.restore();
    }
  }

  /**
   * Set the opacity of a layer, clamped to [0, 1].
   * Also updates the CSS `opacity` property for live preview.
   *
   * @param layerId — The target layer ID.
   * @param opacity — Desired opacity (0 = transparent, 1 = opaque).
   */
  function setLayerOpacity(layerId: string, opacity: number): void {
    const layer = layers.get(layerId);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(1, opacity));
      layer.canvas.style.opacity = String(layer.opacity);
    }
  }

  /**
   * Toggle a layer's visibility.
   *
   * @param layerId — The target layer ID.
   * @param visible — Whether the layer should be rendered.
   */
  function setLayerVisible(layerId: string, visible: boolean): void {
    const layer = layers.get(layerId);
    if (layer) {
      layer.visible = visible;
      layer.canvas.style.display = visible ? "block" : "none";
    }
  }

  /**
   * Set the blend mode used when compositing this layer.
   *
   * @param layerId   — The target layer ID.
   * @param blendMode — A valid `GlobalCompositeOperation` value
   *                    (e.g. `"multiply"`, `"screen"`).
   */
  function setLayerBlendMode(layerId: string, blendMode: GlobalCompositeOperation): void {
    const layer = layers.get(layerId);
    if (layer) {
      layer.blendMode = blendMode;
    }
  }

  /**
   * Tear down the layer manager: remove all layer canvases from the
   * DOM and clear internal state. Called during {@link Purrlet.destroy}.
   */
  function destroy(): void {
    for (const layer of layers.values()) {
      layer.canvas.remove();
    }
    layers.clear();
    activeLayerId = null;
  }

  // Create the default "Background" layer
  init();

  return {
    addLayer,
    setActiveLayer,
    getLayer,
    getActiveLayer,
    removeLayer,
    flattenLayers,
    setLayerOpacity,
    setLayerVisible,
    setLayerBlendMode,
    destroy,
  };
}
