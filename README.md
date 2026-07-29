# Purrlet

A modern, easy-to-use, lightweight, headless canvas drawing engine for the web.
> [!IMPORTANT]
> Purrlet v2 is currently in early beta and is not recommended for production use.

> [!IMPORTANT]
> **Upgrading from v1?** The API has been extensively redesigned. Be sure to review the new documentation before migrating, as many concepts and interfaces have changed.

> [!CAUTION]
> Third-party uploaders are no longer bundled with the core package. If you're using the CDN build, see the CDN guide. If you're installing with npm, refer to the installation guide for supported uploader packages.

## Key Features
- Lorem Impsum
- Lorem Impsum

## License
Purrlet is licensed under the *PolyForm Noncommercial License 1.0.0* License. See the [LICENSE](./LICENSE) for full license text.
> Commerical usage requires a seperate license that will be granted by BuddyWinte. Please contact me directly for more information.

## What is **Purrlet**?
Purrlet is a headless canvas drawing engine.

It handles drawing logic, input processing, history management, and tool execution while leaving the interface entirely up to you.
> **You build the UI. Purrlet handles the logic.**

## Save Methods:
> [!IMPORTANT]
> The legacy `data-url` save format has been removed. Attempting to use it will result in an "Unknown save type" error.
- `commands`: stores deterministic drawing actions (tool inputs + state changes); can be serialized to localStorage, IndexedDB, etc. **DEFAULT**
- `blob`: stores a raster snapshot of the current canvas state; does not preserve tool history or editability **NOT RECOMMENDED**
