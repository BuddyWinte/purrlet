"use strict";

import type {
  PurrletPointer,
  Tool,
  ToolInstance,
} from "../types";
import type { Renderer } from "../core/renderer";

export interface EraserConfig {
  readonly size?: number;
  readonly smoothing?: number;
  readonly pressureEnabled?: boolean;
  readonly pressureMinSizeFactor?: number;
}

export const eraserTool: Tool<EraserConfig> = {
  name: "eraser",

  create(
    config: Readonly<EraserConfig> = {},
  ): ToolInstance<EraserConfig> {
    let drawing = false;

    const baseSize = config.size ?? 20;
    const pressureEnabled =
      config.pressureEnabled ?? true;
    const minFactor =
      config.pressureMinSizeFactor ?? 0.3;

    const sizeFor = (
      pointer: PurrletPointer,
    ): number => {
      if (
        !pressureEnabled ||
        pointer.pointerType !== "pen"
      ) {
        return baseSize;
      }

      const pressure = Math.max(
        0.05,
        pointer.pressure,
      );

      return (
        baseSize *
        (
          minFactor +
          pressure * (1 - minFactor)
        )
      );
    };

    return {
      config,

      onActivate(renderer: Renderer): void {
        renderer.setMode("erase");
      },

      onDeactivate(renderer: Renderer): void {
        drawing = false;
        renderer.cancelStroke();
        renderer.setMode("draw");
      },

      onPointerDown(
        pointer: PurrletPointer,
        renderer: Renderer,
      ): void {
        drawing = true;

        renderer.setMode("erase");
        renderer.beginStroke(
          "#000",
          sizeFor(pointer),
          pointer.x,
          pointer.y,
        );
      },

      onPointerMove(
        pointer: PurrletPointer,
        renderer: Renderer,
      ): void {
        if (!drawing || !pointer.isDown) {
          return;
        }

        renderer.setMode("erase");
        renderer.addPoint(
          pointer.x,
          pointer.y,
          sizeFor(pointer),
        );
      },

      onPointerUp(
        _pointer: PurrletPointer,
        renderer: Renderer,
      ): void {
        if (!drawing) {
          return;
        }

        drawing = false;
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
        renderer.cancelStroke();
      },
    };
  },
};
