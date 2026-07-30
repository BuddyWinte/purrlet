# Purrlet
![GitHub Release](https://img.shields.io/github/v/release/buddywinte/purrlet)
[![Discord](https://img.shields.io/discord/1375986160995930132?style=plastic&logo=discord&label=Discord)](https://discord.gg/Ruk58PhJvm)
![NPM Version](https://img.shields.io/npm/v/purrlet)
![Downloads](https://img.shields.io/npm/dm/purrlet)
![Total Downloads](https://img.shields.io/npm/dt/purrlet)

A modern, easy-to-use, lightweight, headless canvas drawing engine for the web.

## Key Features
- Pawesomely lightweight, dependency-free drawing engine
- typescript-first
- basically plug-and-play
- Desktop, mobile, web, drawing tablet support
- Framework agnostic
- undo/redo support
- custom tool support
- headless (no UIs are included, build your own!)

/\_/\
( o.o )
\> ^ <

## Installation

### npm
```bash
npm install purrlet
```

### CDN
```html
<script type="module">
  import { Purrlet } from 'https://cdn.jsdelivr.net/npm/purrlet/dist/purrlet.mjs';

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
