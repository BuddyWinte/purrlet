# Purrlet
A lightweight, customizable, feature-rich drawbox and upload library built for React, Vue, Astro, SvelteKit, and modern JavaScript apps.

## Version scope (v0.9)

`v0.9` is focused on image uploading only.

- Included: upload providers, validation, events, framework helpers
- Not included yet: drawbox features
- Not included yet: save/export workflows

If you expected drawbox or save features, those are planned for later versions and are intentionally out of scope for `v0.9`.

## We need your feedback

Please report bugs and share suggestions so we can harden the `v1.0` release.

- Bug reports: https://github.com/BuddyWinte/Purrlet/issues
- Suggestions / feature ideas: https://github.com/BuddyWinte/Purrlet/issues

When reporting a bug, include:

- Runtime (`Browser`, `Node.js`, framework)
- Provider (`imgbb`, `imgur`, `cloudinary`, `localhost`)
- Example config used (without secrets)
- Exact error message and reproduction steps

## Install

```bash
npm i purrlet
```

## Core usage

```js
import Purrlet from "purrlet";

const uploader = new Purrlet({
  provider: "imgbb",
  apiKey: process.env.IMGBB_KEY,
  maxFileSize: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/*"],
});

const url = await uploader.upload(file);
console.log(url);
```

## Supported providers

- `localhost` (returns a `data:` URL; useful for local/dev workflows)
- `imgbb`
- `imgur`
- `cloudinary`

## Constructor config (all supported options)

```js
const uploader = new Purrlet({
  provider: "imgbb", // "localhost" | "imgbb" | "imgur" | "cloudinary"

  // Provider credentials
  apiKey: "...", // used by imgbb, and as alias for imgur clientId
  clientId: "...", // imgur preferred credential
  cloudName: "...", // cloudinary required
  uploadPreset: "...", // cloudinary required
  folder: "optional-folder", // cloudinary optional

  // Network behavior
  requestTimeoutMs: 15000,
  retries: 1,
  retryDelayMs: 300,

  // Validation
  maxFileSize: 5 * 1024 * 1024, // bytes
  allowedMimeTypes: ["image/jpeg", "image/png", "image/*"],
  validateFile: async (file, context) => {
    // return true, false, string, or { valid, reason, details }
    return true;
  },

  // Hooks
  onUpload: (url, payload) => {},
  onUploadSuccess: (payload) => {},
  onUploadError: (payload) => {},
  onInit: (payload) => {},
  onDestroy: (payload) => {},

  // Logging
  debug: false,
});
```

## Provider-specific minimum config

### Imgbb

```js
new Purrlet({
  provider: "imgbb",
  apiKey: process.env.IMGBB_KEY,
});
```

### Imgur

```js
new Purrlet({
  provider: "imgur",
  clientId: process.env.IMGUR_CLIENT_ID,
  // apiKey also works as a clientId alias
});
```

### Cloudinary

```js
new Purrlet({
  provider: "cloudinary",
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
  folder: "optional-folder",
});
```

### Localhost

```js
new Purrlet({ provider: "localhost" });
```

## What file inputs are supported

`upload()` and `uploadMany()` accept:

- `File`
- `Blob`
- `Buffer`
- `Uint8Array`
- `ArrayBuffer`
- `{ buffer, filename?, type? }`
- `{ path, filename?, type? }` (Node.js)
- file path string (Node.js)

## Upload APIs

### `upload(file, options?)`

```js
const url = await uploader.upload(file, {
  signal, // AbortSignal
  timeoutMs: 10000,
  retries: 2,
  retryDelayMs: 250,
  validateFile: (file, context) => true,
});
```

### `uploadMany(files, options?)`

```js
const result = await uploader.uploadMany(files, {
  concurrency: 3,
  stopOnError: false,
  timeoutMs: 10000,
  retries: 2,
  retryDelayMs: 250,
});

console.log(result.successful, result.failed);
console.log(result.results); // array of URLs or null
console.log(result.errors); // [{ index, error }]
```

## Events

### Instance events

```js
uploader.onInit((payload) => {});
uploader.onUploadStart((payload) => {});
uploader.onUploadSuccess((payload) => {});
uploader.onUploadError((payload) => {});
uploader.onUploadComplete((payload) => {});
uploader.onDestroy((payload) => {});
```

### Global events

```js
import Purrlet from "purrlet";

Purrlet.onUploadSuccess((payload) => {
  console.log(payload.provider, payload.url);
});
```

### Payload fields you can expect

- `provider`
- `purrlet` (instance)
- `file`
- `filename`
- `mimeType`
- `size`
- `startedAt`
- `durationMs`
- `url` (success)
- `error` (failure)
- `validation`

## Framework helpers

### React

```js
import { usePurrlet } from "purrlet/react";

const { client, upload, uploadMany, isUploading, error } = usePurrlet(config);
```

### Vue

```js
import { usePurrlet } from "purrlet/vue";

const { client, upload, uploadMany, isUploading, error } = usePurrlet(config);
```

### Astro

```js
import { createPurrlet, createAstroUploader } from "purrlet/astro";

const client = createPurrlet(config);
const helper = createAstroUploader(config); // { client, upload, uploadMany, destroy }
```

### SvelteKit

```js
import { createPurrlet, createSvelteKitUploader } from "purrlet/sveltekit";

const client = createPurrlet(config);
const helper = createSvelteKitUploader(config); // { client, upload, uploadMany, isUploading, error, destroy }
```

## Runtime requirements

- Node.js `>=18`

## Development

```bash
npm run build
npm test
npm run lint
```
