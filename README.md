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
Purrlet is licensed under the MIT License. See the [LICENSE](./LICENSE) for full license text.
> A short and simple permissive license with conditions only requiring preservation of copyright and license notices. Licensed works, modifications, and larger works may be distributed under different terms and without source code.

## What is **Purrlet**?
Purrlet is a headless canvas drawing engine.

It handles drawing logic, input processing, history management, and tool execution while leaving the interface entirely up to you.
> **You build the UI. Purrlet handles the logic.**

## Planned API:
- [ ] purrlet.attach(canvas) - reattaches purrlet to a different canvas without recreating the instance
- [ ] purrlet.detach() - stops listening to inputs and disconnects from the canvas
- [ ] purrlet.render() - forces a redraw of the entire scene from internal state
- [ ] purrlet.resize(width,height) - changes canvas buffer size, but does not scale content
- [x] purrlet.clear(boolean) - clears the canvas (trash basically), boolean is for weather or not to omit it into history
- [x] purrlet.setTool(tool) - takes in a tool id (must be registered through the registerTool)
- [x] purrlet.updateToolConfig(tool, config) - updates a tool config without having to reset the instance
- [x] purrlet.getTool() - returns the current tool object
- [x] purrlet.getToolById() - returns a tool object from its ID
- [x] purrlet.registerTool(toolObject) - adds a tool to the registery
- [x] purrlet.unregisterTool(id) - unregisters a tool
- [x] purrlet.listTools() - returns a list of all the tools registered
- [ ] purrlet.undo() - undo an action
- [ ] purrlet.redo() - redo a recently undone action
- [ ] purrlet.clearHistory() - clear history without clearing canvas
- [ ] purrlet.export() - custom uploader function, **gets a blob of the canvas**
- [ ] purrlet.upload() - **DEPRECATED**, alias of export(), simply to try and prevent breaking code

**events**:
- [ ] purrlet.on(event,data)
- [ ] purrlet.emit() - **INTERNAL ONLY**, emit events

## Save Methods:
> [!IMPORTANT]
> The legacy `data-url` save format has been removed. Attempting to use it will result in an "Unknown save type" error.
`commands`: stores deterministic drawing actions (tool inputs + state changes); can be serialized to localStorage, IndexedDB, etc. **DEFAULT**
`blob`: stores a raster snapshot of the current canvas state; does not preserve tool history or editability **NOT RECOMMENDED**