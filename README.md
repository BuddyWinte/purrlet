# Purrlet

A lightweight, headless canvas drawing engine for the web.

Purrlet provides the difficult parts of building a drawing application, such as pointer
input, rendering, tools, pressure sensitivity, undo/redo, and exporting. While
leaving the UI completely up to you.

[Installation] · [Documentation] · [Examples] · [Discord]

## Key Features
- Pawesomely lightweight, dependency-free drawing engine
- Typescript-first
- Basically plug-and-play
- Desktop, mobile, web, drawing tablet support
- Framework agnostic
- undo/redo support
- Custom tool support
- headless (no UIs are included, build your own!)

<p align="center">
/\_/\<br>
( o.o )<br>
> ^ <
</p>

## Installation

### npm

#### bun
```bash
bun add purrlet
```

#### npm
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

## Providers
Purrlet supports a ton of third-party providers for uploading your canvas. These providers are not included with the core library, and must be added separately.
> We do not own any of these providers, and are not responsible for any issues that may arise from using them. The provider part of Purrlet is primarily a helper to make your development experience easier.
If you are interested in adding a provider, please open a pull request and we will be happy to review it!

### Catbox
```js
import { Catbox } from "purrlet/providers";
import { purrlet } from "Purrlet";

const purrlet = new Purrlet({
  canvas
});
```

Whenever your "submit" or "finish" button is clicked you can do the following inside the event listener:
```js
const { url } = await Catbox(await purrlet.blob());
```
> The `url` variable will contain a URL to the uploaded resource, it is always provided. *Depending on the provider*, a deleteUrl may also be included for deleting the uploaded resource.

## License
Purrlet is licensed under the PolyForm Noncommercial License 1.0.0 License.
See the [LICENSE](./LICENSE) file for more information.
> Commercial usage requires a separate license granted by BuddyWinte. (please contact me for such)
