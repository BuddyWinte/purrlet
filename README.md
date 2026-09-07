# Purrlet

[![](https://data.jsdelivr.com/v1/package/npm/purrlet/badge)](https://www.jsdelivr.com/package/npm/purrlet)

A lightweight, dependency-free, headless canvas drawing engine for the web.

Purrlet provides the difficult parts of building a drawing application, such as pointer input, rendering, tools, pressure sensitivity, undo/redo, and exporting, while leaving the UI completely up to you.

## Key Features

- Pawesomely lightweight and dependency-free
- TypeScript-first
- Basically plug-and-play
- Desktop, mobile, and drawing tablet support
- Framework agnostic
- Headless (you do all the UI!)
- Pointer and touch input
- Pressure sensitivity
- Tool-based architecture
- Undo/redo support
- Canvas exporting
- Custom tool support
- High-DPI display support
- Automatic canvas resizing
- Optional upload providers

<p align="center">
/\_/\\<br>
( o.o )<br>
> ^ <
</p>

Did purrlet help you in any way? Buy me a coffee to help me keep this project alive!
> https://ko-fi.com/BuddyWinte

---

## Installation

### npm

#### Bun

```bash
bun add purrlet
```

#### npm

```bash
npm install purrlet
```

### CDN

Purrlet can also be loaded directly from a CDN:

```html
<script type="module">
  import { Purrlet } from "https://cdn.jsdelivr.net/npm/purrlet/dist/purrlet.mjs";

  const purrlet = new Purrlet({
    canvas: document.getElementById("canvas")
  });
</script>
```

---

# Basic Usage

Create a canvas:

```html
<canvas id="canvas"></canvas>
```

Then create a Purrlet instance:

```js
import { Purrlet } from "purrlet";

const canvas = document.querySelector("#canvas");

const purrlet = new Purrlet({
  canvas
});
```

Purrlet handles input, drawing, tools, history, and rendering automatically.

You can now start drawing on the canvas.

### Using a selector

The `canvas` option can also accept a CSS selector:

```js
const purrlet = new Purrlet({
  canvas: "#canvas"
});
```

This is useful when you do not already have a reference to the canvas element.

---

# Configuration

```js
const purrlet = new Purrlet({
  canvas,
  defaultTool: "brush"
});
```

## Configuration Options

| Option        | Type                          | Required | Default   | Description                        |
| ------------- | ----------------------------- | -------: | --------- | ---------------------------------- |
| `canvas`      | `HTMLCanvasElement \| string` |      Yes | —         | Canvas element or CSS selector     |
| `defaultTool` | `string`                      |       No | `"brush"` | Tool activated when Purrlet starts |
| `debug`       | `boolean`                     |       No | `false`   | Enables additional debug logging   |

### Canvas

The canvas that Purrlet should control.

You can provide either an element:

```js
const purrlet = new Purrlet({
  canvas: document.querySelector("#canvas")
});
```

or a selector:

```js
const purrlet = new Purrlet({
  canvas: "#canvas"
});
```

### Default Tool

The tool that should be activated when the Purrlet instance is created.

```js
const purrlet = new Purrlet({
  canvas,
  defaultTool: "brush"
});
```

If no default tool is specified, Purrlet uses its default built-in tool.

### Debug

Enable debug logging:

```js
const purrlet = new Purrlet({
  canvas,
  debug: true
});
```

Debug mode can be useful when developing integrations or custom tools.

---

# Tools

Purrlet uses a tool-based architecture.

Tools are responsible for converting pointer input into drawing operations.

This makes it possible to add new tools without changing the core Purrlet API.

## Built-in Tools

Purrlet includes several built-in tools.

> Each tool has its own configuration defined by the tool author. Tool configuration is intentionally not shared between every tool.

### Brush

The standard drawing tool.

```js
purrlet.setTool("brush", {
  color: "#000000",
  size: 5
});
```

Example with a larger brush:

```js
purrlet.setTool("brush", {
  color: "#ff69b4",
  size: 20
});
```

The brush supports pointer pressure where available.

### Eraser

Removes existing drawing data.

```js
purrlet.setTool("eraser", {
  size: 20
});
```

---

## Changing Tools

Use `setTool()` to change the active tool:

```js
purrlet.setTool("brush", {
  color: "#000000",
  size: 5
});
```

You can change tools at any time:

```js
brushButton.addEventListener("click", () => {
  purrlet.setTool("brush", {
    color: "#000000",
    size: 5
  });
});

eraserButton.addEventListener("click", () => {
  purrlet.setTool("eraser", {
    size: 20
  });
});
```

Purrlet does not create these buttons for you.

This is intentional.

You can build your toolbar using plain HTML, React, Vue, Svelte, Solid, or any other UI framework.

---

# History

Undo and redo are built into the engine.

### Undo

```js
purrlet.undo();
```

### Redo

```js
purrlet.redo();
```

### Clear History

```js
purrlet.clearHistory();
```

Clearing history does not clear the current drawing.

For example:

```js
purrlet.clearHistory();
```

After this, previous operations can no longer be undone.

### Clearing the Canvas

To clear both the drawing and its history:

```js
purrlet.clear();
```

---

# Exporting

Purrlet can export the current canvas without requiring an external provider.

There are several ways to export a drawing depending on what your application needs.

## `toBlob()`

Converts the canvas into a `Blob`.

```js
const blob = await purrlet.toBlob();

if (!blob) {
  console.error("Unable to export canvas.");
  return;
}

console.log(blob);
```

`Blob` exports are useful for:

- Uploading drawings
- Saving files
- Sending drawings to APIs
- Using Purrlet providers
- Creating downloads

### Downloading a Blob

```js
const blob = await purrlet.toBlob();

if (!blob) return;

const url = URL.createObjectURL(blob);

const link = document.createElement("a");

link.href = url;
link.download = "drawing.png";
link.click();

URL.revokeObjectURL(url);
```

---

## `toDataURL()`

Converts the canvas into a data URL.

```js
const dataUrl = purrlet.toDataURL();

if (!dataUrl) {
  console.error("Unable to export canvas.");
  return;
}

console.log(dataUrl);
```

This can be useful for displaying the drawing elsewhere:

```js
const image = document.querySelector("#preview");

if (image) {
  image.src = purrlet.toDataURL() ?? "";
}
```

---

## `export()`

Downloads the current drawing.

```js
await purrlet.export();
```

Use `toBlob()` or `toDataURL()` when you need more control over how the exported image is handled.

---

# Canvas Sizing

Purrlet uses the canvas's displayed size when configuring its internal drawing surface.

For example:

```css
canvas {
  width: 800px;
  height: 600px;
}
```

Purrlet also accounts for the device pixel ratio of the display so that drawings remain sharp on high-DPI screens.

## Responsive Canvases

Purrlet works with responsive canvas elements:

```css
canvas {
  width: 100%;
  height: 100%;
}
```

When the displayed size changes, Purrlet can automatically update its internal canvas dimensions.

You can also manually request a resize:

```js
purrlet.resize();
```

## Hidden Canvases

A canvas inside an element using:

```css
display: none;
```

does not have a measurable size.

If Purrlet is initialized while the canvas is hidden, its initial dimensions may therefore be `0 × 0`.

When the canvas becomes visible, the resize observer can detect the new size.

Applications that change the canvas layout manually can also call:

```js
purrlet.resize();
```

after making the canvas visible.

---

# Pointer Input

Purrlet uses pointer events to support multiple input devices through a common interface.

Supported pointer types include:

- Mouse
- Touch
- Pen
- Drawing tablets

Tools receive normalized pointer information including:

- X/Y coordinates
- Pressure
- Tilt X
- Tilt Y
- Pointer type
- Pointer ID
- Whether the pointer is currently pressed

This allows tools to behave differently depending on the input device.

For example, a drawing tool can use pressure to dynamically change brush size.

---

# Custom Tools

Purrlet is designed to be extended.

Custom tools can be registered and used alongside built-in tools.

A tool provides a name and a factory that creates a tool instance.

```ts
const myTool = {
  name: "my-tool",

  create(config) {
    return {
      onPointerDown(pointer, renderer) {
        // Start drawing
      },

      onPointerMove(pointer, renderer) {
        // Continue drawing
      },

      onPointerUp(pointer, renderer) {
        // Finish drawing
      }
    };
  }
};

purrlet.registerTool(myTool);
```

After registration, the tool can be activated normally:

```js
purrlet.setTool("my-tool", {
  // Your configuration
});
```

## Tool Lifecycle

Tools can respond to several lifecycle events:

```ts
interface ToolInstance<TConfig> {
  onPointerDown?(
    pointer: PurrletPointer,
    renderer: Renderer
  ): void;

  onPointerMove?(
    pointer: PurrletPointer,
    renderer: Renderer
  ): void;

  onPointerUp?(
    pointer: PurrletPointer,
    renderer: Renderer
  ): void;

  onActivate?(
    renderer: Renderer
  ): void;

  onDeactivate?(
    renderer: Renderer
  ): void;
}
```

Not every callback is required.

A simple tool can implement only the callbacks it needs.

---

# Providers

Purrlet can be extended with optional providers for uploading exported drawings to external services.

Providers are --not part of Purrlet's core functionality--.

They are separate integrations intended to make uploading a canvas easier.

> Providers are maintained separately from the Purrlet core. Purrlet does not own or operate these services and is not responsible for their availability, policies, limits, or content.

If you would like to contribute a provider, please open a pull request.

## Using a Provider

Providers generally accept a `Blob` produced by Purrlet and return information about the uploaded resource.

For example:

```js
import { Purrlet } from "purrlet";
import { Catbox } from "purrlet/providers";

const canvas = document.querySelector("canvas");

const purrlet = new Purrlet({
  canvas
});

const blob = await purrlet.toBlob();

if (!blob) {
  throw new Error("Unable to export canvas.");
}

const result = await Catbox(blob);

console.log(result.url);
```

Providers can be called whenever your application needs to upload the drawing.

For example, when the user clicks an upload button:

```js
uploadButton.addEventListener("click", async () => {
  const blob = await purrlet.toBlob();

  if (!blob) {
    console.error("Unable to export canvas.");
    return;
  }

  const result = await Catbox(blob);

  console.log(`Uploaded to ${result.url}`);
});
```

## Provider Results

Providers return an object describing the uploaded resource.

The exact properties depend on the provider.

A provider may return:

| Property    | Type                  | Description                              |
| ----------- | --------------------- | ---------------------------------------- |
| `url`       | `string`              | URL of the uploaded resource             |
| `deleteUrl` | `string \| undefined` | Optional URL used to delete the resource |

The `url` property is provided by supported providers unless otherwise documented.

## Catbox

[Catbox](https://catbox.moe/) is an external file-hosting service.

```js
import { Catbox } from "purrlet/providers";

const blob = await purrlet.toBlob();

if (!blob) return;

const { url, deleteUrl } = await Catbox(blob);

console.log(url);
console.log(deleteUrl);
```

---

# Lifecycle

Purrlet instances should be destroyed when they are no longer needed.

## `destroy()`

Destroys the Purrlet instance and releases resources associated with it.

```js
purrlet.destroy();
```

For example, a framework component can create an instance when mounted and destroy it when unmounted.

```js
const purrlet = new Purrlet({
  canvas
});

// Later:
purrlet.destroy();
```

This is particularly important for applications that frequently create and remove canvases.

---

# API Reference

## `Purrlet`

### Constructor

```ts
new Purrlet(config: PurrletConfig)
```

Creates a new Purrlet instance.

---

### `setTool()`

```ts
setTool(
  name: string,
  config?: unknown
): void
```

Activates a registered tool.

```js
purrlet.setTool("brush", {
  color: "#000000",
  size: 5
});
```

---

### `registerTool()`

```ts
registerTool<TConfig>(
  tool: Tool<TConfig>
): void
```

Registers a custom tool.

---

### `undo()`

```ts
undo(): void
```

Undoes the most recent operation.

---

### `redo()`

```ts
redo(): void
```

Redoes the most recently undone operation.

---

### `clear()`

```ts
clear(): void
```

Clears the current drawing and history.

---

### `clearHistory()`

```ts
clearHistory(): void
```

Clears undo/redo history while keeping the current drawing.

---

### `resize()`

```ts
resize(): void
```

Updates the internal canvas dimensions.

Purrlet automatically observes canvas size changes where supported.

---

### `toBlob()`

```ts
toBlob(): Promise<Blob | null>
```

Exports the current drawing as a `Blob`.

Returns `null` when the canvas cannot be exported.

---

### `toDataURL()`

```ts
toDataURL(): string | null
```

Exports the current drawing as a data URL.

Returns `null` when the canvas cannot be exported.

---

### `export()`

```ts
export(): Promise<void>
```

Downloads the current drawing.

---

### `getCanvas()`

```ts
getCanvas(): HTMLCanvasElement | null
```

Returns the canvas associated with the instance.

Returns `null` if the instance could not be initialized.

---

### `isActive()`

```ts
isActive(): boolean
```

Returns whether the Purrlet instance successfully initialized.

```js
if (purrlet.isActive()) {
  console.log("Purrlet is ready.");
}
```

---

### `destroy()`

```ts
destroy(): void
```

Destroys the instance and releases resources.

---

# TypeScript

Purrlet is written in TypeScript and ships with its type definitions.

You can import Purrlet types directly:

```ts
import type {
  PurrletConfig,
  PurrletPointer,
  Tool,
  ToolInstance
} from "purrlet";
```

## `PurrletConfig`

```ts
interface PurrletConfig {
  canvas: HTMLCanvasElement | string;
  defaultTool?: string;
  debug?: boolean;
}
```

## `PurrletPointer`

```ts
interface PurrletPointer {
  x: number;
  y: number;

  pressure: number;

  tiltX: number;
  tiltY: number;

  pointerType: "mouse" | "pen" | "touch";

  pointerId: number;

  isDown: boolean;
}
```

## `Tool`

```ts
interface Tool<TConfig = unknown> {
  readonly name: string;

  create(
    config: TConfig
  ): ToolInstance<TConfig>;
}
```

## `ToolInstance`

```ts
interface ToolInstance<TConfig = unknown> {
  onPointerDown?(
    pointer: PurrletPointer,
    renderer: Renderer
  ): void;

  onPointerMove?(
    pointer: PurrletPointer,
    renderer: Renderer
  ): void;

  onPointerUp?(
    pointer: PurrletPointer,
    renderer: Renderer
  ): void;

  onActivate?(
    renderer: Renderer
  ): void;

  onDeactivate?(
    renderer: Renderer
  ): void;
}
```

---

# Framework Support

Purrlet does not depend on a UI framework.

It can be used with:

- Plain JavaScript
- TypeScript
- React
- Vue
- Svelte
- Solid
- Angular
- Other browser frameworks

Purrlet only manages the drawing engine.

Your application is responsible for the UI surrounding it.

This means you can build your own:

- Toolbars
- Color pickers
- Brush controls
- Undo/redo buttons
- Layer panels
- Export menus
- Mobile controls
- Settings panels

without Purrlet imposing a particular design.

---

# Headless Design

Purrlet intentionally does not provide a drawing interface.

There is no built-in:

- Toolbar
- Color picker
- Menu
- Modal
- Settings panel
- Layer UI
- Export dialog

Instead, Purrlet provides the underlying drawing functionality.

This makes it possible to integrate Purrlet into applications with completely different designs without fighting against an included UI.

---

# Browser Considerations

Purrlet is intended to run in browser environments with Canvas and Pointer Events support.

Because Purrlet is headless, applications are responsible for managing the surrounding DOM and UI.

For applications using server-side rendering, initialize Purrlet only when the browser environment is available.

For example:

```js
if (typeof window !== "undefined") {
  const purrlet = new Purrlet({
    canvas
  });
}
```

---

# TODO

Planned features and improvements:
- [ ] Layers

---

# Contributing

Contributions are welcome.

If you would like to contribute a new tool, provider, optimization, bug fix, or other improvement, open a pull request.

When contributing a tool, please keep Purrlet's headless architecture in mind.

--Tools should provide drawing functionality without requiring a particular UI.--

---

# License

Copyright 2026 BuddyWinte

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

> http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
