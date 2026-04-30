# Purrlet

a lightweight, headless drawbox-style canvas engine for indie sites and creative projects.

simple. fast. flexible.

> purrlet is in VERY early beta. expect bugs. expect things to break.

---

## what is purrlet?

purrlet is a **headless drawing engine**.

you handle the ui.
purrlet handles the drawing logic.

---

## install

```bash
npm install purrlet
```

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
```

undo / redo:

```javascript
p.undo();
p.redo();
```

saving (localstorage):

```javascript
const p = new Purrlet({
  canvas,
  save: {
    enabled: true,
    key: "my-drawing"
  }
});

p.save();
```

---

## uploading

purrlet supports **imgbb** and **imgur** out of the box.
you can also plug in your own thing. anything. go wild.

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

### adding tools

tools are modular. small. easy.

each tool exports:

```javascript
export const myTool = {
  name: "myTool",
  create(config) {
    return {
      onDown(p, ctx) {},
      onMove(p, ctx) {},
      onUp(p, ctx) {}
    };
  }
};
```

register it:

```javascript
tools["myTool"] = myTool;
```
