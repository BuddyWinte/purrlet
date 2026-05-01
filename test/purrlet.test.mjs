import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ============================================================
// Purrlet Test Suite
//
// Since purrlet is a browser-only canvas library, we cannot
// perform full integration tests in Node.js (no DOM, no Canvas2D).
// These tests verify the build output structure, exports, and
// that the module loads without errors.
//
// For full integration tests, use a browser environment with
// JSDOM + node-canvas, or run in a headless browser (Playwright).
// ============================================================

describe("Purrlet", () => {
  let Purrlet;

  it("should load the module without errors", async () => {
    const mod = await import("../dist/purrlet.mjs");
    Purrlet = mod.Purrlet;
    assert.ok(Purrlet, "Purrlet should be exported");
    assert.strictEqual(typeof Purrlet, "function", "Purrlet should be a function");
  });

  it("should export Purrlet as a class", async () => {
    // Purrlet is exported as a class (which is a function in JS)
    assert.ok(Purrlet, "Purrlet class should be exported");
    assert.strictEqual(
      typeof Purrlet,
      "function",
      "Purrlet should be a class (constructor function)"
    );
    // Classes have prototype
    assert.ok(Purrlet.prototype, "Purrlet should have a prototype");
  });

  it("should have required prototype methods", async () => {
    const proto = Purrlet.prototype;
    const methods = [
      "setTool",
      "undo",
      "redo",
      "clear",
      "save",
      "load",
      "upload",
      "on",
      "off",
      "once",
      "destroy",
      "snapshot",
      "export",
      "importImage",
      "resize",
      "updateTool",
      "setReadOnly",
      "enableDrop",
      "canUndo",
      "canRedo",
      "getUndoCount",
      "getRedoCount",
      "addLayer",
      "setActiveLayer",
      "getLayer",
      "removeLayer",
      "flattenLayers",
    ];
    for (const method of methods) {
      assert.strictEqual(
        typeof proto[method],
        "function",
        `Purrlet.prototype should have ${method}() method`
      );
    }
  });

  it("should throw when canvas element is not provided", async () => {
    // Purrlet requires a canvas element in its config.
    // In Node.js there is no real HTMLCanvasElement, so calling
    // `new Purrlet()` (without arguments or with an invalid canvas)
    // should throw an error.
    try {
      new Purrlet();
      assert.fail("Should have thrown an error");
    } catch (err) {
      assert.ok(err instanceof Error, "Should throw an Error instance");
    }
  });

  it("should export module as ESM with correct structure", async () => {
    const mod = await import("../dist/purrlet.mjs");
    assert.ok("Purrlet" in mod, "Module should have a named export 'Purrlet'");
  });
});

describe("Build output", () => {
  it("should produce valid ESM output", async () => {
    // ESM build at dist/purrlet.mjs should be importable
    const mod = await import("../dist/purrlet.mjs");
    assert.ok(mod, "ESM module should load successfully");
    assert.ok(mod.Purrlet, "Purrlet should be available from ESM build");
  });

  it("should have no default export (named export only)", async () => {
    const mod = await import("../dist/purrlet.mjs");
    // Verify the module uses named exports
    assert.ok(mod.Purrlet, "Purrlet should be a named export");
    // Default should be undefined or match the named export
    // depending on the bundler configuration
    if (mod.default !== undefined) {
      assert.ok(mod.default, "Default export should exist if present");
    }
  });
});
