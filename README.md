<p align="center">
  <h1 align="center">🐱 Purrlet</h1>
  <p align="center">
    A lightweight, headless canvas drawing engine for indie sites and creative side projects.<br>
    <em>simple. fast. flexible.</em>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/version-0.2.0-orange?style=flat-square" alt="Version" />
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
    <a href="https://www.npmjs.com/package/purrlet"><img src="https://img.shields.io/npm/v/purrlet?style=flat-square&color=crimson" alt="npm" /></a>
    <img src="https://img.shields.io/badge/dependencies-zero-blue?style=flat-square" alt="Zero Dependencies" />
    <img src="https://img.shields.io/badge/typescript-5.4+-3178c6?style=flat-square" alt="TypeScript" />
  </p>
</p>

> **purrlet is a headless drawing engine.** you handle the UI. purrlet handles the drawing logic.
> meow. 🐾

---

## ✨ Features

### Core Engine
- **Headless architecture** — zero UI opinions, integrate into any framework or vanilla setup
- **High-DPI aware** — automatic `devicePixelRatio` scaling for crisp rendering on Retina displays
- **Pointer Events API** — unified mouse, touch, and pen input with pressure & tilt support
- **Tiny footprint** — zero runtime dependencies, ships as ESM + CJS

### Drawing Tools (10 built-in)
- 🖌️ **Brush** — freehand drawing with color, size, and opacity
- 🧹 **Eraser** — erase with `destination-out` compositing
- 📏 **Line** — straight lines with live preview
- 🪣 **Fill** — flood fill with configurable tolerance (scanline algorithm)
- ⬜ **Rectangle** — drag to draw rectangles, hold Shift for squares
- ⭕ **Ellipse** — drag to draw ellipses, hold Shift for circles
- 🔤 **Text** — click to place an editable text overlay, stamps on Enter/blur
- 💧 **Eyedropper** — sample any pixel's color
- 💨 **Spray** — scatter random dots with configurable density
- ⬚ **Select** — dashed marquee selection with bounds event

### History & State
- **Circular buffer undo/redo** — memory-efficient, capped at `maxHistory` entries (default: 50)
- **History queries** — `canUndo()`, `canRedo()`, `getUndoCount()`, `getRedoCount()`
- **Auto-save/load** — persist canvas state to IndexedDB or localStorage

### Canvas Operations
- **Clear** — wipe to transparent or white (configurable), pushes to history
- **Snapshot** — capture current canvas as a PNG `Blob`
- **Export** — export as PNG, JPEG, or WebP with optional quality parameter
- **Import** — load images from `File`, `Blob`, or URL, auto-scaled to fit
- **Resize** — dynamically change canvas dimensions with DPR recalculation
- **Drag & drop** — enable image drop directly onto the canvas
- **Read-only mode** — disable drawing for display/preview scenarios

### Upload (3 providers + custom)
- **imgbb** — upload via API key
- **imgur** — upload via client ID
- **cloudinary** — unsigned uploads via REST API
- **Custom handler** — plug in any upload endpoint
- **Proxy support** — route uploads server-side to keep API keys off the client
- **Progress tracking** — real-time upload percentage via events
- **Transform hook** — `beforeUpload` to resize/compress before sending

### Layers
- **Multi-layer support** — add, remove, and switch between layers
- **Layer properties** — opacity, visibility, and blend mode per layer
- **Flatten** — merge all visible layers into the base canvas

### Events
- **EventEmitter API** — `on()`, `off()`, `once()` for all engine events
- **Stroke events** — `strokeStart`, `strokeEnd` with full pointer data
- **History events** — `historyChange` with undo/redo counts
- **Upload events** — `uploadProgress`, `uploadSuccess`, `uploadError`
- **Storage events** — `saveError` for graceful error handling

### Custom Tools
- **Plugin system** — define tools with `onDown`, `onMove`, `onUp`, `destroy` lifecycle
- **Type-safe** — full TypeScript interfaces for `Tool` and `ToolInstance`

---

## 📦 Install

```bash
npm install purrlet
```

```bash
yarn add purrlet
```

```bash
bun add purrlet
```

Or via CDN:

```html
<script type="module">
  import { Purrlet } from "https://unpkg.com/purrlet/dist/purrlet.mjs";
</script>
```

---

## 🚀 Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    #canvas {
      width: 800px;
      height: 600px;
      border: 1px solid #ccc;
      cursor: crosshair;
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>

  <script type="module">
    import { Purrlet } from "purrlet";

    const canvas = document.getElementById("canvas");

    const p = new Purrlet({
      canvas,
      tool: "brush",
      color: "#222",
      size: 4,
      opacity: 1,
    });

    // Draw something!
    // Switch tools at any time:
    p.setTool("eraser", { size: 20 });
    p.setTool("brush", { color: "crimson", size: 8 });
  </script>
</body>
</html>
```

That's it. Purrlet automatically handles DPR scaling, pointer capture, touch scrolling prevention, and cleanup.

---

## ⚙️ Configuration

### Constructor

```typescript
new Purrlet(config: PurrletConfig)
```

### PurrletConfig

```typescript
type PurrletConfig = {
  /** The canvas element to bind to (required) */
  canvas: HTMLCanvasElement;

  /** Log warnings and debug info to console */
  debug?: boolean;                // default: false

  /** Initial tool name */
  tool?: string;                  // default: "brush"

  /** Initial brush color (hex string) */
  color?: string;                 // default: "#000"

  /** Initial brush size in pixels */
  size?: number;                  // default: 5

  /** Initial brush opacity (0-1) */
  opacity?: number;               // default: 1

  /** Maximum undo history entries (circular buffer) */
  maxHistory?: number;            // default: 50

  /** When true, clear() fills white instead of transparent */
  clearToWhite?: boolean;         // default: false

  /** Storage/persistence configuration */
  save?: SaveConfig;

  /** Upload configuration */
  upload?: UploadConfig;

  /** Callback when eyedropper picks a color */
  onColorPick?: (hex: string) => void;
};
```

### SaveConfig

```typescript
type SaveConfig = {
  /** Enable auto-save on construction and load saved state */
  enabled?: boolean;              // default: false

  /** Storage key for the saved canvas data */
  key?: string;                   // default: "purrlet-canvas"

  /** Storage backend to use */
  backend?: "indexeddb" | "localstorage";  // default: "indexeddb"

  /** Called when a save/load operation fails */
  onSaveError?: (err: Error) => void;
};
```

### UploadConfig

```typescript
type UploadConfig = {
  /** Built-in upload provider */
  provider?: "imgbb" | "imgur" | "cloudinary";

  /** Custom upload handler (takes priority over provider) */
  handler?: (blob: Blob, ctx: { canvas: HTMLCanvasElement }) => Promise<string>;

  /** Proxy server URL for routing uploads server-side */
  proxy?: string;

  // Provider-specific keys
  apiKey?: string;                // imgbb / imgur
  clientId?: string;              // imgur
  cloudName?: string;             // cloudinary
  uploadPreset?: string;          // cloudinary

  /** Transform the blob before uploading (resize, compress, etc.) */
  beforeUpload?: (blob: Blob) => Blob | Promise<Blob>;

  /** Progress callback (0-100) */
  onUploadProgress?: (percent: number) => void;

  /** Called on successful upload with the resulting URL */
  onUploadSuccess?: (url: string) => void;

  /** Called on upload failure */
  onUploadError?: (err: Error) => void;
};
```

---

## 📖 API Reference

### Events

Listen to engine events with the EventEmitter API:

```typescript
// Subscribe
p.on("strokeStart", (pointer: PointerPayload) => {
  console.log("Drawing started at", pointer.x, pointer.y);
});

p.on("historyChange", ({ undo, redo }) => {
  console.log(`Undo: ${undo}, Redo: ${redo}`);
});

// Subscribe once (auto-remove after first call)
p.once("uploadSuccess", (url: string) => {
  console.log("Uploaded to:", url);
});

// Unsubscribe
const handler = (percent: number) => console.log(`${percent}%`);
p.on("uploadProgress", handler);
p.off("uploadProgress", handler);
```

#### Events Reference

| Event | Payload | Description |
|-------|---------|-------------|
| `strokeStart` | `PointerPayload` | Fired when the pointer goes down on the canvas |
| `strokeEnd` | `PointerPayload` | Fired when the pointer goes up after drawing |
| `historyChange` | `{ undo: number, redo: number }` | Fired when undo/redo stack changes |
| `uploadProgress` | `number` (0–100) | Fired during upload with progress percentage |
| `uploadSuccess` | `string` (url) | Fired when upload completes successfully |
| `uploadError` | `Error` | Fired when upload fails |
| `saveError` | `Error` | Fired when a storage save/load operation fails |

#### PointerPayload

```typescript
type PointerPayload = {
  x: number;          // X coordinate relative to canvas
  y: number;          // Y coordinate relative to canvas
  isDown: boolean;    // Whether pointer button is pressed
  pressure: number;   // Pen pressure (0 for mouse)
  tiltX: number;      // Pen tilt X (degrees)
  tiltY: number;      // Pen tilt Y (degrees)
  raw: PointerEvent;  // The raw browser PointerEvent
};
```

---

### Tools

#### `setTool(name, config?)`

Activate a tool by name, optionally passing configuration:

```typescript
p.setTool("brush", { color: "#ff6600", size: 6, opacity: 0.8 });
p.setTool("eraser", { size: 30 });
p.setTool("line", { color: "#333", size: 2 });
p.setTool("fill", { color: "#00ff88", tolerance: 50 });
p.setTool("rect", { color: "red", size: 3, fill: true });
p.setTool("ellipse", { color: "blue", size: 2 });
p.setTool("text", { color: "#000", font: "Georgia", size: 32 });
p.setTool("eyedropper");
p.setTool("spray", { color: "purple", size: 25, density: 50 });
p.setTool("select");
```

#### `updateTool(partialConfig)`

Hot-swap tool configuration without switching tools:

```typescript
// Currently on brush, change color and size in place
p.updateTool({ color: "red", size: 10 });

// Change just the opacity
p.updateTool({ opacity: 0.5 });
```

#### Tool Reference

| Tool | Name | Config Options | Default | Description |
|------|------|---------------|---------|-------------|
| 🖌️ Brush | `"brush"` | `color`, `size`, `opacity` | `#000`, `5`, `1` | Freehand drawing with round cap/join |
| 🧹 Eraser | `"eraser"` | `size` | `20` | Erase using `destination-out` compositing |
| 📏 Line | `"line"` | `color`, `size` | `#000`, `3` | Straight line with live preview |
| 🪣 Fill | `"fill"` | `color`, `tolerance` | `#000000`, `32` | Flood fill (scanline algorithm) |
| ⬜ Rectangle | `"rect"` | `color`, `size`, `fill` | `#000`, `2`, `false` | Draw rectangles (Shift = square) |
| ⭕ Ellipse | `"ellipse"` | `color`, `size`, `fill` | `#000`, `2`, `false` | Draw ellipses (Shift = circle) |
| 🔤 Text | `"text"` | `color`, `font`, `size` | `#000`, `sans-serif`, `24` | Click to place editable text |
| 💧 Eyedropper | `"eyedropper"` | — | — | Sample pixel color, fires `purrlet:colorpick` event |
| 💨 Spray | `"spray"` | `color`, `size`, `density` | `#000`, `20`, `30` | Random dot spray within radius |
| ⬚ Select | `"select"` | — | — | Dashed marquee selection, fires `purrlet:select` event |

---

### Canvas Actions

#### `clear()`

Wipe the canvas. If `clearToWhite` is `true` in the config, fills with white; otherwise clears to transparent. Pushes the current state to undo history.

```typescript
p.clear();
```

#### `snapshot()` → `Promise<Blob>`

Capture the current canvas as a PNG Blob:

```typescript
const blob = await p.snapshot();
const url = URL.createObjectURL(blob);
// Use the URL for preview, download, etc.
```

#### `export(format, quality?)` → `Promise<Blob>`

Export the canvas in a specific format:

```typescript
// PNG (lossless)
const png = await p.export("png");

// JPEG with quality (0.0 – 1.0)
const jpeg = await p.export("jpeg", 0.85);

// WebP with quality
const webp = await p.export("webp", 0.9);
```

#### `importImage(source)`

Import an image from a `File`, `Blob`, or URL string. The image is centered and scaled to fit within the canvas while maintaining aspect ratio.

```typescript
// From a file input
const file = inputElement.files[0];
await p.importImage(file);

// From a URL
await p.importImage("https://example.com/photo.jpg");

// From a Blob
await p.importImage(someBlob);
```

#### `resize(width, height)`

Resize the canvas dynamically. Existing content is preserved (clipped if smaller). DPR is recalculated.

```typescript
p.resize(1024, 768);
```

#### `enableDrop()`

Enable drag-and-drop image import. Returns a cleanup function to remove the event listeners.

```typescript
const cleanup = p.enableDrop();
// Later...
cleanup(); // Remove drag & drop listeners
```

---

### History

#### `undo()` / `redo()`

Navigate the undo/redo stack:

```typescript
p.undo();
p.redo();
```

#### `canUndo()` / `canRedo()`

Check if undo/redo is available:

```typescript
if (p.canUndo()) p.undo();
if (p.canRedo()) p.redo();
```

#### `getUndoCount()` / `getRedoCount()`

Get the number of available undo/redo steps:

```typescript
console.log(`Can undo ${p.getUndoCount()} times`);
console.log(`Can redo ${p.getRedoCount()} times`);
```

#### History Events

Listen to history changes to keep your UI in sync:

```typescript
p.on("historyChange", ({ undo, redo }) => {
  undoButton.disabled = undo === 0;
  redoButton.disabled = redo === 0;
});
```

---

### Read-Only Mode

Disable all drawing interaction — useful for preview/display scenarios:

```typescript
// Enter read-only mode
p.setReadOnly(true);

// Re-enable drawing
p.setReadOnly(false);
```

---

### Storage

Persist the canvas state between sessions using IndexedDB (default) or localStorage.

#### Setup

```typescript
const p = new Purrlet({
  canvas,
  save: {
    enabled: true,          // auto-load saved state on init
    key: "my-drawing",      // storage key
    backend: "indexeddb",   // "indexeddb" (default) or "localstorage"
    onSaveError: (err) => {
      console.error("Save failed:", err);
    },
  },
});
```

#### `save()` → `Promise<void>`

Manually save the current canvas state:

```typescript
await p.save();
```

#### `load()` → `Promise<void>`

Manually load the saved canvas state:

```typescript
await p.load();
```

#### Storage Backends

| Backend | Description | Best For |
|---------|-------------|----------|
| `"indexeddb"` *(default)* | Stores canvas as a Blob in IndexedDB | Large canvases, production use |
| `"localstorage"` | Stores canvas as a data URL string | Small canvases, simple projects |

> **Note:** localStorage has a ~5MB limit. For larger canvases, use the default IndexedDB backend.

---

### Upload

Upload the canvas directly to an image hosting service. Returns the URL of the uploaded image.

#### `upload()` → `Promise<string>`

```typescript
const url = await p.upload();
console.log("Uploaded:", url);
```

#### Provider Examples

**imgbb:**

```typescript
const p = new Purrlet({
  canvas,
  upload: {
    provider: "imgbb",
    apiKey: "YOUR_IMGBB_API_KEY",
  },
});

const url = await p.upload();
```

**imgur:**

```typescript
const p = new Purrlet({
  canvas,
  upload: {
    provider: "imgur",
    clientId: "YOUR_IMGUR_CLIENT_ID",
  },
});

const url = await p.upload();
```

**cloudinary:**

```typescript
const p = new Purrlet({
  canvas,
  upload: {
    provider: "cloudinary",
    cloudName: "YOUR_CLOUD_NAME",
    uploadPreset: "YOUR_UPLOAD_PRESET",
  },
});

const url = await p.upload();
```

#### Custom Handler

Plug in any upload endpoint:

```typescript
const p = new Purrlet({
  canvas,
  upload: {
    handler: async (blob, { canvas }) => {
      const formData = new FormData();
      formData.append("image", blob, "drawing.png");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const { url } = await res.json();
      return url;
    },
  },
});

const url = await p.upload();
```

#### Proxy

Route uploads through a server-side proxy to keep API keys off the client:

```typescript
const p = new Purrlet({
  canvas,
  upload: {
    provider: "imgbb",
    proxy: "https://your-server.com/api/upload",
  },
});
```

The proxy should accept a `POST` with multipart form data (`file` field) and respond with `{ "url": "..." }`.

#### Progress Tracking

Track upload progress via events or callbacks:

```typescript
// Via events
p.on("uploadProgress", (percent) => {
  progressBar.value = percent;
});

p.on("uploadSuccess", (url) => {
  console.log("Done:", url);
});

p.on("uploadError", (err) => {
  console.error("Failed:", err.message);
});

// Via config callbacks
const p = new Purrlet({
  canvas,
  upload: {
    provider: "imgbb",
    apiKey: "YOUR_KEY",
    onUploadProgress: (percent) => {
      console.log(`${percent}% uploaded`);
    },
    onUploadSuccess: (url) => {
      console.log("Available at:", url);
    },
    onUploadError: (err) => {
      console.error("Upload failed:", err);
    },
  },
});
```

#### beforeUpload Transform

Resize or compress the image before uploading:

```typescript
const p = new Purrlet({
  canvas,
  upload: {
    provider: "imgbb",
    apiKey: "YOUR_KEY",
    beforeUpload: async (blob) => {
      // Compress to JPEG at 80% quality
      const bitmap = await createImageBitmap(blob);
      const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = offscreen.getContext("2d");
      ctx.drawImage(bitmap, 0, 0);
      const compressed = await offscreen.convertToBlob({ type: "image/jpeg", quality: 0.8 });
      return compressed;
    },
  },
});
```

---

### Layers

Manage multiple drawing layers on the canvas.

#### `addLayer(name?)` → `string`

Add a new layer and make it active. Returns the new layer ID:

```typescript
const layerId = p.addLayer("Sketch");
const bgId = p.addLayer("Background");
```

#### `removeLayer(id)`

Remove a layer by ID. Cannot remove the last layer:

```typescript
p.removeLayer(layerId);
```

#### `setActiveLayer(id)`

Set the active drawing layer:

```typescript
p.setActiveLayer(someId);
```

#### `getLayer(id)` → `LayerInfo | undefined`

Get layer metadata:

```typescript
const layer = p.getLayer(layerId);
if (layer) {
  console.log(layer.name);       // "Sketch"
  console.log(layer.opacity);    // 1
  console.log(layer.visible);    // true
  console.log(layer.blendMode);  // "source-over"
}
```

#### `flattenLayers()`

Merge all visible layers into the base canvas:

```typescript
p.flattenLayers();
```

#### LayerInfo

```typescript
type LayerInfo = {
  id: string;                              // Unique layer ID
  name: string;                            // Layer name
  canvas: HTMLCanvasElement;               // Layer's backing canvas
  ctx: CanvasRenderingContext2D;           // Layer's 2D context
  opacity: number;                         // 0–1
  visible: boolean;                        // Show/hide
  blendMode: GlobalCompositeOperation;     // Canvas blend mode
};
```

#### Example Workflow

```typescript
const p = new Purrlet({ canvas });

// Background layer is created automatically
const bgId = p.addLayer("Background");
p.setTool("fill", { color: "#f5f5f5" });
// Click to fill...

// Add a sketch layer
const sketchId = p.addLayer("Sketch");
p.setActiveLayer(sketchId);
p.setTool("brush", { color: "#333", size: 2 });
// Draw something...

// Add a color layer on top
const colorId = p.addLayer("Colors");
p.setActiveLayer(colorId);
p.setTool("brush", { color: "#ff6600", size: 8 });
// Add color...

// Flatten all layers into one
p.flattenLayers();
```

---

### Lifecycle

#### `destroy()`

Clean up all event listeners, pointer bindings, history state, and layer canvases. **Always call this when unmounting** to prevent memory leaks:

```typescript
p.destroy();
```

---

## 🔧 Custom Tools

Purrlet's tool system is fully extensible. Tools are simple objects with a `create` factory function.

### Tool Interface

```typescript
import type { Tool, ToolInstance, Pointer, ToolContext } from "purrlet";

interface Tool {
  name: string;
  create(config: any): ToolInstance;
}

interface ToolInstance {
  onDown(p: Pointer, ctx: ToolContext): void;
  onMove(p: Pointer, ctx: ToolContext): void;
  onUp(p: Pointer, ctx: ToolContext): void;
  destroy?(): void;
}

interface Pointer {
  x: number;
  y: number;
  isDown: boolean;
  pressure: number;
  tiltX: number;
  tiltY: number;
  raw: PointerEvent;
}

interface ToolContext {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
}
```

### Step-by-Step: Creating a "Stamp" Tool

Let's build a tool that stamps a circle at each click position:

```typescript
import type { Tool, ToolInstance } from "purrlet";

type StampConfig = {
  color?: string;
  radius?: number;
};

const stampTool: Tool = {
  name: "stamp",

  create(config: StampConfig = {}): ToolInstance {
    const color = config.color ?? "#ff0066";
    const radius = config.radius ?? 20;

    return {
      onDown(p, { ctx }) {
        // Draw a filled circle at the click position
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      },

      onMove(_p, _ctx) {
        // Nothing on move — stamps only on click
      },

      onUp(_p, _ctx) {
        // Cleanup if needed
      },
    };
  },
};
```

### Registering a Custom Tool

Add the tool to Purrlet's internal tool registry, then use it like any built-in tool:

```typescript
import { Purrlet } from "purrlet";

const p = new Purrlet({ canvas });

// Register the custom tool
// Access the internal tools registry:
(p as any).renderer.setTool("stamp", stampTool, { color: "green", radius: 15 });

// Or use it via setTool after registering in the tools map
import { tools } from "purrlet/internal";
// Note: for custom registration, you can import the tools object
// and add your tool before creating Purrlet
```

> **Tip:** For cleaner custom tool registration, you can extend the tools map before instantiation:

```typescript
// If you have access to the tools registry
// tools["stamp"] = stampTool;
// Then: p.setTool("stamp", { color: "green", radius: 15 });
```

### Tool with State and Cleanup

A more complex tool that tracks drawing state and cleans up:

```typescript
import type { Tool, ToolInstance } from "purrlet";

type CalligraphyConfig = {
  color?: string;
  minWidth?: number;
  maxWidth?: number;
};

const calligraphyTool: Tool = {
  name: "calligraphy",

  create(config: CalligraphyConfig = {}): ToolInstance {
    const color = config.color ?? "#222";
    const minWidth = config.minWidth ?? 1;
    const maxWidth = config.maxWidth ?? 8;
    let lastX = 0;
    let lastY = 0;

    return {
      onDown(p, { ctx }) {
        lastX = p.x;
        lastY = p.y;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      },

      onMove(p, { ctx }) {
        if (!p.isDown) return;

        // Use speed to vary width
        const dx = p.x - lastX;
        const dy = p.y - lastY;
        const speed = Math.sqrt(dx * dx + dy * dy);
        const width = Math.max(minWidth, maxWidth - speed * 0.3);

        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        lastX = p.x;
        lastY = p.y;
      },

      onUp(_p, { ctx }) {
        ctx.restore();
      },

      destroy() {
        // Clean up any DOM elements or timers
      },
    };
  },
};
```

---

## 🌐 Framework Integration

### React

```tsx
import { useEffect, useRef } from "react";
import { Purrlet } from "purrlet";

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const purrletRef = useRef<Purrlet | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const p = new Purrlet({
      canvas: canvasRef.current,
      tool: "brush",
      color: "#333",
      size: 4,
      maxHistory: 30,
    });

    purrletRef.current = p;

    // Cleanup on unmount
    return () => {
      p.destroy();
      purrletRef.current = null;
    };
  }, []);

  const handleToolChange = (tool: string) => {
    purrletRef.current?.setTool(tool);
  };

  const handleUndo = () => {
    purrletRef.current?.undo();
  };

  return (
    <div>
      <canvas ref={canvasRef} width={800} height={600} />
      <button onClick={() => handleToolChange("brush")}>Brush</button>
      <button onClick={() => handleToolChange("eraser")}>Eraser</button>
      <button onClick={handleUndo}>Undo</button>
    </div>
  );
}
```

### Vue 3

```vue
<template>
  <div>
    <canvas ref="canvasRef" width="800" height="600" />
    <button @click="p?.setTool('brush')">Brush</button>
    <button @click="p?.setTool('eraser')">Eraser</button>
    <button @click="p?.undo()">Undo</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Purrlet } from "purrlet";

const canvasRef = ref<HTMLCanvasElement | null>(null);
let p: Purrlet | null = null;

onMounted(() => {
  if (canvasRef.value) {
    p = new Purrlet({
      canvas: canvasRef.value,
      tool: "brush",
      color: "#333",
      size: 4,
    });
  }
});

onUnmounted(() => {
  p?.destroy();
  p = null;
});
</script>
```

### Svelte

```svelte
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Purrlet } from "purrlet";

  let canvas: HTMLCanvasElement;
  let p: Purrlet;

  onMount(() => {
    p = new Purrlet({
      canvas,
      tool: "brush",
      color: "#333",
      size: 4,
    });
  });

  onDestroy(() => {
    p.destroy();
  });
</script>

<canvas bind:this={canvas} width="800" height="600" />

<button on:click={() => p.setTool("brush")}>Brush</button>
<button on:click={() => p.setTool("eraser")}>Eraser</button>
<button on:click={() => p.undo()}>Undo</button>
```

---

## 🏗️ Architecture

Purrlet is built as a set of small, composable modules:

```
src/
├── index.ts              # Public exports
├── core/
│   ├── Purrlet.ts        # Main class
│   ├── canvas.ts         # DPR-aware canvas setup
│   ├── pointer.ts        # Pointer event handling
│   ├── renderer.ts       # Tool rendering loop
│   ├── history.ts        # Circular buffer undo/redo
│   ├── eventEmitter.ts   # Event system
│   ├── storage.ts        # IndexedDB + localStorage backends
│   ├── upload.ts         # Upload orchestration
│   ├── layers.ts         # Multi-layer management
│   └── types.ts          # TypeScript type definitions
├── tools/
│   ├── index.ts          # Tool registry
│   ├── types.ts          # Tool interfaces
│   ├── brush.ts
│   ├── eraser.ts
│   ├── line.ts
│   ├── fill.ts
│   ├── rect.ts
│   ├── ellipse.ts
│   ├── text.ts
│   ├── eyedropper.ts
│   ├── spray.ts
│   └── select.ts
└── providers/
    ├── imgbb.ts
    ├── imgur.ts
    └── cloudinary.ts
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Clone** your fork locally
3. **Install** dependencies: `npm install`
4. **Build** in watch mode: `npm run dev`
5. **Make** your changes
6. **Test**: `npm test`
7. **Lint**: `npm run lint`
8. **Push** and open a Pull Request

### Adding a Tool

Tools are modular and simple. Create a new file in `src/tools/`:

```typescript
// src/tools/myTool.ts
import type { Tool } from "./types";

export const myTool: Tool = {
  name: "myTool",

  create(config) {
    return {
      onDown(p, { ctx }) { /* ... */ },
      onMove(p, { ctx }) { /* ... */ },
      onUp(p, { ctx }) { /* ... */ },
      destroy() { /* cleanup */ },
    };
  },
};
```

Then register it in `src/tools/index.ts`:

```typescript
import { myTool } from "./myTool";

export const tools = {
  // ...existing tools
  myTool,
};
```

### Guidelines

- Keep tools small and focused
- Clean up DOM elements and timers in `destroy()`
- Use `ctx.save()` / `ctx.restore()` to avoid state leaks
- Document config options in the tool's type definition

---

## 📄 License

[MIT](LICENSE) © [BuddyWinte](https://github.com/BuddyWinte)

---

<p align="center">
  Made with 🐾 by <a href="https://github.com/BuddyWinte">BuddyWinte</a> and contributors<br>
  <a href="https://github.com/BuddyWinte/Purrlet">GitHub</a> ·
  <a href="https://www.npmjs.com/package/purrlet">npm</a> ·
  <a href="https://github.com/BuddyWinte/Purrlet/issues">Issues</a>
</p>
