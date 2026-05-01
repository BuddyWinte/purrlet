/**
 * @module purrlet/tools/text
 *
 * Text placement tool that overlays a live `<textarea>` on the canvas.
 *
 * Instead of opening a modal dialog, the tool creates an absolutely-positioned
 * `<textarea>` element directly over the canvas at the click position.  The
 * user types in natural WYSIWYG fashion and commits the text either by:
 * - Pressing **Enter** (without Shift — Shift+Enter produces a newline).
 * - Clicking / tapping outside the textarea (blur event).
 *
 * **Textarea lifecycle:**
 * 1. **Creation (`onDown`)** — A new `<textarea>` is appended to `document.body`,
 *    positioned at the click coordinates (converted to viewport space via
 *    `getBoundingClientRect`), and auto-focused.  Its visual style mirrors the
 *    configured font so the user sees an accurate preview.
 * 2. **Editing** — The user types freely.  `resize: none` and `overflow: hidden`
 *    prevent scrollbars; the textarea expands vertically to fit content.
 * 3. **Commit (`blur` / Enter)** — The `commitText` callback reads `textarea.value`,
 *    removes the DOM element via `cleanup()`, and stamps the text onto the canvas
 *    using `fillText`.  Multi-line text is rendered line-by-line with a `1.3×`
 *    line-height multiplier.
 * 4. **Cleanup (`destroy`)** — If the tool is deactivated while the textarea is
 *    open, `cleanup()` removes it from the DOM without committing.
 *
 * @tool text
 * @added v0.2.0
 * @config { color?: string, font?: string, size?: number }
 */

import type { Tool, ToolInstance, Pointer, ToolContext } from "./types";

/**
 * Configuration options accepted by {@link textTool.create}.
 *
 * @property color - Text color as any valid CSS color string. Default: `"#000"`.
 * @property font  - CSS font-family string. Default: `"sans-serif"`.
 * @property size  - Font size in CSS pixels. Default: `24`.
 */
type TextConfig = {
  color?: string;
  font?: string;
  size?: number;
};

/**
 * Text tool singleton.
 *
 * Creates a {@link ToolInstance} that spawns an overlay `<textarea>` on
 * click and commits the typed text to the canvas on blur or Enter.
 */
export const textTool: Tool = {
  name: "text",

  create(config: TextConfig = {}): ToolInstance {
    const color = config.color ?? "#000";
    const font = config.font ?? "sans-serif";
    const fontSize = config.size ?? 24;
    /** Reference to the currently-active overlay textarea, or `null`. */
    let textarea: HTMLTextAreaElement | null = null;

    /**
     * Renders the committed text onto the canvas at the given position.
     *
     * Multi-line strings are split on `\n` and rendered with a 1.3×
     * line-height.  `textBaseline` is set to `"top"` so `y` corresponds
     * to the top of the first line's bounding box.
     *
     * @param ctx  - The canvas 2D rendering context.
     * @param x    - Horizontal position in CSS pixels.
     * @param y    - Vertical position (top of first line) in CSS pixels.
     * @param text - The string to render; may contain `\n` for newlines.
     */
    function stampText(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      text: string
    ) {
      if (!text.trim()) return;
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = `${fontSize}px ${font}`;
      ctx.textBaseline = "top";
      const lines = text.split("\n");
      const lineHeight = fontSize * 1.3;
      lines.forEach((line, i) => {
        ctx.fillText(line, x, y + i * lineHeight);
      });
      ctx.restore();
    }

    /**
     * Removes the overlay textarea from the DOM and nulls the reference.
     * Safe to call multiple times.
     */
    function cleanup() {
      if (textarea && textarea.parentNode) {
        textarea.remove();
        textarea = null;
      }
    }

    return {
      onDown(p, { canvas, ctx }) {
        // Tear down any previous textarea before opening a new one.
        cleanup();

        // Convert canvas-relative CSS coordinates to viewport coordinates
        // for absolute positioning of the overlay textarea.
        const rect = canvas.getBoundingClientRect();
        const x = p.x;
        const y = p.y;

        // Create the overlay textarea, position it at the click location in
        // viewport space, and style it to visually match the target canvas text.
        textarea = document.createElement("textarea");
        textarea.style.position = "absolute";
        textarea.style.left = (rect.left + x) + "px";
        textarea.style.top = (rect.top + y) + "px";
        textarea.style.color = color;
        textarea.style.fontSize = fontSize + "px";
        textarea.style.fontFamily = font;
        textarea.style.border = "1px dashed #999";
        textarea.style.background = "rgba(255,255,255,0.8)";
        textarea.style.padding = "2px 4px";
        textarea.style.resize = "none";
        textarea.style.minWidth = "100px";
        textarea.style.minHeight = fontSize + 8 + "px";
        textarea.style.overflow = "hidden";
        textarea.style.zIndex = "9999";
        textarea.style.outline = "none";
        textarea.style.lineHeight = "1.3";

        document.body.appendChild(textarea);
        textarea.focus();

        /**
         * Commits the textarea content to the canvas.
         * Reads the value, removes the textarea from the DOM, and stamps
         * the text using the configured font settings.
         */
        const commitText = () => {
          if (!textarea) return;
          const text = textarea.value;
          cleanup();
          stampText(ctx, x, y, text);
        };

        // Commit on blur (user clicks elsewhere) or on Enter (Shift+Enter
        // is allowed through for multi-line input).
        textarea.addEventListener("blur", commitText);
        textarea.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commitText();
          }
        });
      },

      onMove() {},

      onUp() {},

      destroy() {
        cleanup();
      },
    };
  },
};
