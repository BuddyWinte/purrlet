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

Purrlet can be extended with optional providers for uploading exported
drawings to external services.

Providers are **not part of Purrlet's core functionality**. They are
separate integrations intended to make uploading a canvas easier.

> Providers are maintained separately from the Purrlet core. Purrlet does
> not own or operate these services and is not responsible for their
> availability, policies, limits, or content.

If you would like to contribute a provider, please open a pull request.

### Using a provider

Providers generally accept a `Blob` produced by Purrlet and return information
about the uploaded resource.

For example:

```js
import { Purrlet } from "purrlet";
import { Catbox } from "purrlet/providers";

const canvas = document.querySelector("canvas");

const purrlet = new Purrlet({
  canvas
});

const blob = await purrlet.toBlob();

const result = await Catbox(blob);

console.log(result.url);
````

Providers can be called whenever your application needs to upload the
drawing, such as when a user clicks a **Save**, **Submit**, or **Upload**
button.

```js
uploadButton.addEventListener("click", async () => {
  const blob = await purrlet.toBlob();
  const result = await Catbox(blob);

  console.log(`Uploaded to ${result.url}`);
});
```

### Provider results

Providers return an object describing the uploaded resource.

The exact properties depend on the provider, but a provider may return:

| Property    | Type                  | Description                                                   |
| ----------- | --------------------- | ------------------------------------------------------------- |
| `url`       | `string`              | URL of the uploaded resource                                  |
| `deleteUrl` | `string \| undefined` | Optional URL that can be used to delete the uploaded resource |

The `url` property is provided by supported providers unless otherwise
documented.

### Catbox

[Catbox](https://catbox.moe/) is an external file-hosting service.

```js
import { Purrlet } from "purrlet";
import { Catbox } from "purrlet/providers";

const purrlet = new Purrlet({
  canvas
});

const blob = await purrlet.toBlob();
const { url, deleteUrl } = await Catbox(blob);

console.log(url);
console.log(deleteUrl);
```


## License
Purrlet is licensed under the PolyForm Noncommercial License 1.0.0 License.
See the [LICENSE](./LICENSE) file for more information.
> Commercial usage requires a separate license granted by BuddyWinte. (please contact me for such)

## TODO

List of planned features and improvements:
- [ ] Mu
