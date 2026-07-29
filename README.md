# Purrlet
<p align="center">
  <img src="https://img.shields.io/github/v/release/buddywinte/purrlet" />
  <a href="https://discord.gg/Ruk58PhJvm">
    <img src="https://img.shields.io/discord/1375986160995930132?style=plastic&logo=discord&label=Discord" />
  </a>
  <img src="https://img.shields.io/npm/v/purrlet" />
  <img src="https://img.shields.io/npm/dm/purrlet" />
  <img src="https://img.shields.io/npm/dt/purrlet" />
</p>

A modern, easy-to-use, lightweight, headless canvas drawing engine for the web.

> [!IMPORTANT]
> **Upgrading from v1?** The API has been extensively redesigned. Be sure to review the new documentation before migrating, as many concepts and interfaces have changed.

> [!CAUTION]
> Third-party uploaders are currently not supported. v2.1 will introduce support for third-party uploaders. In the meantime, you can use the `export`, `dataURL`, or `blob` to upload your canvas to your own server. (or a public website, your choice) *If you want to help with the introduce of third-party uploaders, please consider contributing to the project.*

## Key Features
- Pawesomely lightweight, dependency-free drawing engine
- typescript-first
- basically plug-and-play
- Desktop, mobile, web, drawing tablet support
- Framework agnostic
- undo/redo support
- custom tool support
- headless (build your own UI)!

## Installation

### npm
```bash
npm install purrlet
```

### CDN
```html
<script type="module">
  import { Purrlet } from 'https://unpkg.com/purrlet/dist/purrlet.mjs';

  const purrlet = new Purrlet({
    canvas: document.getElementById('canvas')
  });
</script>
```

## Basic Usage
```html
<canvas id="canvas"></canvas>
```

```js
import { Purrlet } from "purrlet";

const canvas = document.querySelector("canvas");

const purrlet = new Purrlet({
  canvas
});
```
Purrlet handles input, drawing, tools, and history automatically (aka all the hard stuff!)

## Configuration
```js
const purrlet = new Purrlet({
  canvas,
  defaultTool: "brush"
});
```

### Configuration Options
| Option      | Type | Description | Default |
| ----------- | ----------- | ----------- | ----------- |
| `canvas`      | `HTMLCanvasElement`      | The canvas element to draw on | `undefined` |
| `defaultTool` | `string`      | The default tool to use | `'brush'` |

## Tools
Purrlet uses a tool-based architecture.

### Built-in tools
Please keep in mind that each tool has it's own configuration that is decided by the author. We highly recommend having the documentation below open when trying to make your configuration menus.

#### Brush
```js
purrlet.setTool("brush", {
  color: "#000000",
  size: 5
});
```

#### Eraser
```js
purrlet.setTool("eraser", {
  size: 20
});
```

## History
Undo/redo is built-in to the engine.
```js
purrlet.undo();
purrlet.redo();
purrlet.clearHistory();
```
> [!NOTE]
> At this current stage, `purrlet.clear()` and `purrlet.redraw()` are counted as history entries. This can cause weird artifacts. If you know how to fix this, please make a pull request.

## License
Purrlet is licensed under the PolyForm Noncommercial License 1.0.0 License.
See the [LICENSE](./LICENSE) file for more information.
> Commercial usage requires a separate license granted by BuddyWinte. (please contact me for such)
