/**
 * Purrlet
 * A modern, easy-to-use, lightweight, headless canvas drawing engine for the web.
 *
 * Please read the CONTRIBUTING.md file before you contrbute.
 */
"use strict";

import type { Tool, ToolInstance, PurrletPointer } from "../types";
import type { Renderer } from "../core/renderer";


type LineConfig = {
  color?: string;
  size?: number;
};

export const lineTool: Tool<LineConfig> = {
  name: "line",

  create(config: LineConfig = {}): ToolInstance {
    let drawing = false;
    let startX = 0;
    let startY = 0;

    const color = config.color ?? "#000";
    const size = config.size ?? 5;

    return {
      onPointerDown(p: PurrletPointer, r: Renderer) {
        drawing = true;
        startX = p.x;
        startY = p.y;

        r.clearPreview();
      },

      onPointerMove(p: PurrletPointer, r: Renderer) {
        if (!drawing || !p.isDown) return;

        r.previewLine(
          color,
          size,
          startX,
          startY,
          p.x,
          p.y,
        );
      },

      onPointerUp(p: PurrletPointer, r: Renderer) {
        if (!drawing) return;

        drawing = false;
        r.clearPreview();

        r.beginStroke(color, size, startX, startY);
        r.addPoint(p.x, p.y, size);
        r.endStroke();
      },

      onDeactivate(r: Renderer) {
        drawing = false;
        r.clearPreview();
      },
    };
  },
};
