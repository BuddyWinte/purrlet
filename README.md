# Purrlet

## You are looking at the v2 release, it is in beta and will not work great

a lightweight, headless drawbox-style canvas engine for indie sites and creative projects.

simple. fast. flexible.

> [!IMPORTANT]  
> purrlet is in VERY early beta. expect bugs. expect things to break.
<p align="center">

![GitHub Release](https://img.shields.io/github/v/release/buddywinte/purrlet)
[![Discord](https://img.shields.io/discord/1375986160995930132?style=plastic&logo=discord&label=Discord)](https://discord.gg/Ruk58PhJvm) <- click to join the discord!
![NPM Version](https://img.shields.io/npm/v/purrlet)
![Downloads](https://img.shields.io/npm/dm/purrlet)
![Total Downloads](https://img.shields.io/npm/dt/purrlet)
![License](https://img.shields.io/github/license/buddywinte/purrlet)
![Install](https://img.shields.io/badge/npm-install%20purrlet-blue)

</p>

## what is purrlet?

purrlet is a **headless drawing engine**.

you handle the ui.
purrlet handles the drawing logic.

---

## install

```bash
npm install purrlet
```

framework-specific subpath imports are also supported, so you can keep examples aligned with your stack:

```javascript
import { Purrlet } from "purrlet/vue";
import { Purrlet } from "purrlet/sveltekit";
import { Purrlet } from "purrlet/astro";
```

available aliases:

- `purrlet/react`
- `purrlet/next`
- `purrlet/vue`
- `purrlet/nuxt`
- `purrlet/svelte`
- `purrlet/sveltekit`
- `purrlet/astro`
- `purrlet/solid`
- `purrlet/solidstart`
- `purrlet/qwik`
- `purrlet/remix`

or via cdn:

```html
<script type="module">
  import { Purrlet } from "https://unpkg.com/purrlet/dist/purrlet.min.js";
</script>
```

---

## basic usage

```javascript
import { Purrlet } from "purrlet";

const canvas = document.getElementById("c");

const p = new Purrlet({
  canvas,
  debug: true
});

p.setTool("brush", {
  color: "#000",
  size: 5
});
```

switch tools whenever:

```javascript
p.setTool("brush", { color: "#000", size: 5 });
p.setTool("line", { color: "blue", size: 3 });
p.setTool("eraser", { size: 20 });
p.setTool("fill", { color: "gold", tolerance: 8 });
p.setTool("eyedropper", {
  onPickColor: (color) => console.log(color)
});
```

>[!NOTE]  
> the following tools exist:
> **brush**, **line**, **eraser**, **fill**, **eyedropper**

undo / redo:

```javascript
p.undo();
p.redo();
```

saving:

```javascript
const p = new Purrlet({
  canvas,
  save: {
    enabled: true,
    key: "my-drawing",
    strategy: "commands"
  }
});

await p.save();
```

save strategies:

```javascript
save: {
  enabled: true,
  key: "my-drawing",
  strategy: "commands" // default
}
```

- `commands`: stores replayable tool interactions in `localStorage`. best when the drawing is made through purrlet tools.
- `blob`: stores a PNG `Blob` in `IndexedDB`. use this when you also draw directly with `ctx`, seed scenes manually, or need a full raster snapshot.
- `data-url`: legacy mode. stores base64 PNG data in `localStorage`. (NOT RECOMMENDED, obselete and will be removed in future versions)

```javascript
await p.clearSave();
```

---

## uploading

purrlet supports **imgbb** and **imgur** out of the box.
you can also plug in your own thing. anything.

```javascript
// imgbb
const p = new Purrlet({
  canvas,
  upload: {
    provider: "imgbb",
    apiKey: "YOUR_API_KEY"
  }
});

// imgur
const p = new Purrlet({
  canvas,
  upload: {
    provider: "imgur",
    apiKey: "YOUR_API_KEY"
  }
});

const url = await p.upload();
```

**custom handler:**

```javascript
const p = new Purrlet({
  canvas,
  upload: {
    handler: async (blob) => {
      const res = await fetch("/upload", {
        method: "POST",
        body: blob
      });

      const { url } = await res.json();
      return url;
    }
  }
});
```

---

## config

```javascript
type PurrletConfig = {
  canvas: HTMLCanvasElement;

  debug?: boolean;
  tool?: string;

  save?: {
    enabled?: boolean;
    key?: string;
    strategy?: "commands" | "blob" | "data-url";
    maxCommands?: number;
  };

  upload?: {
    provider?: "imgbb" | "imgur";
    apiKey?: string;
    clientId?: string;

    handler?: (blob: Blob) => Promise<string>;

    beforeUpload?: (blob: Blob) => Blob | Promise<Blob>;
    onUploadSuccess?: (url: string) => void;
    onUploadError?: (err: any) => void;
  };
};
```

---

## contributing

### adding built-in tools

if you are contributing through the github repo and wish to make a new tool / drawing tool:

start with:

```bash
npm run tool:new -- rectangle
```

that command will:

1. create `src/tools/rectangle.ts`
2. add a typed config block
3. set the exported tool name
4. register the tool in `src/tools/index.ts`

then you only need to implement the tool logic.

the generated file looks like this:

```javascript
import { defineTool } from "./defineTool";
import type { ToolInstance } from "./types";

type RectangleToolConfig = {
  color?: string;
  size?: number;
};

export const rectangleTool = defineTool({
  name: "rectangle",

  create(config: RectangleToolConfig = {}): ToolInstance {
    return {
      onDown(p, { ctx }) {
        ctx.strokeStyle = config.color ?? "#000";
        ctx.lineWidth = config.size ?? 4;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
      },

      onMove(p, { ctx }) {
        if (!p.isDown) return;

        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      },

      onUp() {},
    };
  },
});
```

after that:

1. replace the starter logic with the actual tool behavior
2. run `npm run build`
3. add docs or tests if the tool needs them
