"use strict";

import type {
  PurrletPointer,
  Tool,
  ToolInstance,
} from "../types";
import type { Renderer } from "../core/renderer";

export interface LineConfig {
  readonly color?: string;
  readonly size?: number;
}

export const lineTool: Tool<LineConfig> = {
  name: "line",

  create(
    config: Readonly<LineConfig> = {},
  ): ToolInstance<LineConfig> {
    let drawing = false;
    let startX = 0;
    let startY = 0;

    const color = config.color ?? "#000";
    const size = config.size ?? 5;

    return {
      config,

      onPointerDown(
        pointer: PurrletPointer,
        renderer: Renderer,
      ): void {
        drawing = true;
        startX = pointer.x;
        startY = pointer.y;

        renderer.clearPreview();
      },

      onPointerMove(
        pointer: PurrletPointer,
        renderer: Renderer,
      ): void {
        if (!drawing || !pointer.isDown) {
          return;
        }

        renderer.previewLine(
          color,
          size,
          startX,
          startY,
          pointer.x,
          pointer.y,
        );
      },

      onPointerUp(
        pointer: PurrletPointer,
        renderer: Renderer,
      ): void {
        if (!drawing) {
          return;
        }

        drawing = false;
        renderer.clearPreview();

        renderer.beginStroke(
          color,
          size,
          startX,
          startY,
        );

        renderer.addPoint(
          pointer.x,
          pointer.y,
          size,
        );

        renderer.endStroke();
      },

      onPointerCancel(
        _pointer: PurrletPointer,
        renderer: Renderer,
      ): void {
        if (!drawing) {
          return;
        }

        drawing = false;
        renderer.clearPreview();
        renderer.cancelStroke();
      },

      onDeactivate(
        renderer: Renderer,
      ): void {
        drawing = false;
        renderer.clearPreview();
        renderer.cancelStroke();
      },
    };
  },
};
