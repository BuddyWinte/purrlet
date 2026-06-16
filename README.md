# Purrlet

A modern, easy-to-use, lightweight headless canvas drawing engine for websites.
> [!IMPORTANT]
> Purrlet v2 is currently in early beta and is not usable or recommended for production use.

> [!IMPORTANT]
> If you're upgrading from v1, it is highly recommended that you review the new documentation. The API has been significantly redesigned and many concepts have changed.

> [!CAUTION]
> Third-party uploaders are no longer included in the core package. If you're using the CDN build, please refer to the CDN guide. If you're installing through npm, see the installation guide for supported uploader packages.

## Key Features
- Lorem Impsum
- Lorem Impsum

## License
Purrlet is licensed under the MIT License. See the [LICENSE](./LICENSE) for full details.
> A short and simple permissive license with conditions only requiring preservation of copyright and license notices. Licensed works, modifications, and larger works may be distributed under different terms and without source code.

## What is **Purrlet**?
Purrlet is a headless canvas drawing engine. "You handle the UI, we handle the logic"

## Planned API:
- purrlet.attach(canvas) - reattaches purrlet to a different canvas without recreating the instance
- purrlet.detach() - stops listening to inputs and disconnects from the canvas
- purrlet.render() - forces a redraw of the entire scene from internal state
- purrlet.resize(width,height) - changes canvas buffer size, but does not scale content
- purrlet.clear(boolean) - clears the canvas (trash basically), boolean is for weather or not to omit it into history
- purrlet.setTool(tool) - takes in a tool id (must be registered through the registerTool)
- purrlet.getTool() - returns the current tool object
- purrlet.getToolById() - returns a tool object from its ID
- purrlet.registerTool(toolObject) - adds a tool to the registery
- purrlet.unregisterTool(id) - unregisters a tool
- purrlet.listTools() - returns a list of all the tools registered
- purrlet.undo() - undo an action
- purrlet.redo() - redo a recently undone action
- purrlet.clearHistory() - clear history without clearing canvas
- purrlet.export() - custom uploader function, **gets a blob of the canvas**
- purrlet.upload() - **DEPRECATED**, alias of export(), simply to try and prevent breaking code

**events**:
- purrlet.on(event,data)
- purrlet.emit() - **INTERNAL USE**, emit events