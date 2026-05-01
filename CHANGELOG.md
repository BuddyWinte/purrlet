# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepalchangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Pointer Events API** — Unified pointer event handling with pressure, tiltX, tiltY support
- **DPR-aware canvas** — Canvas now properly handles high-DPI displays with automatic scaling
- **EventEmitter API** — `on()`, `off()`, `once()` methods for listening to engine events
- **Circular buffer history** — Undo/redo now supports up to `maxHistory` (default: 50) states using a ring buffer
- **`clear()` method** — Wipe canvas to transparent or white (configurable), pushes to undo history
- **`snapshot()` method** — Returns `Promise<Blob>` of current canvas as PNG
- **`export(format, quality?)`** — Export canvas as PNG, JPEG, or WebP with optional quality
- **`importImage(source)`** — Import File, Blob, or URL, centered and scaled to fit
- **`updateTool(partialConfig)`** — Hot-swap tool config without switching tools
- **`setReadOnly(bool)`** — Disable all drawing for display/preview mode
- **`resize(w, h)`** — Resize canvas with proper DPR recalculation
- **`enableDrop()`** — Enable drag-and-drop image import on canvas
- **`destroy()` method** — Clean up all event listeners and references for framework mount/unmount cycles
- **History info** — `canUndo()`, `canRedo()`, `getUndoCount()`, `getRedoCount()` methods
- **IndexedDB storage backend** — New default storage backend replacing localStorage, configurable via `save.backend`
- **CJS build output** — `dist/purrlet.cjs` for CommonJS compatibility
- **TypeScript declaration exports** — Full type definitions now exported from `dist/purrlet.d.ts`
- **Fill bucket tool** — Flood fill with configurable color and tolerance using scanline algorithm
- **Rectangle shape tool** — Draw rectangles with optional fill, Shift for perfect squares
- **Ellipse shape tool** — Draw ellipses with optional fill, Shift for perfect circles
- **Text tool** — Click to place editable text overlay, stamps to canvas on blur/Enter
- **Eyedropper tool** — Sample pixel color, dispatches `purrlet:colorpick` event with hex value
- **Spray can tool** — Scatter random dots with configurable radius and density
- **Selection tool** — Dashed marquee selection, dispatches `purrlet:select` event with bounds
- **Upload proxy support** — Route uploads through a server-side proxy to keep API keys off the client
- **Cloudinary upload provider** — Unsigned upload support via Cloudinary REST API
- **Upload progress tracking** — All providers now report upload progress via XHR
- **Layer system** — Basic multi-layer support with add, remove, opacity, visibility, and blend modes
- **CHANGELOG.md** — Added project changelog

### Changed
- Downgraded version from 1.0.0 to 0.2.0 to reflect beta status
- TypeScript version pinned to ^5.4.0 for stability
- All storage methods are now async and return Promises
- Upload system uses XMLHttpRequest instead of fetch for progress support
- `upload()` method now returns `Promise<string>`

### Fixed
- **Undo/redo memory leak** — History now capped with circular buffer instead of unlimited array
- **localStorage save crash** — Save operations now wrapped in try/catch with `onSaveError` callback for QuotaExceededError
- **`upload()` return value** — Now properly returns the upload URL promise
- **Event listener cleanup** — `destroy()` removes all internal listeners for proper framework lifecycle support

### Security
- Upload proxy option keeps API keys off the client
