"use strict";

import type {
  PurrletPointer,
  Tool,
  ToolInstance,
} from "../types";
import type { Renderer } from "../core/renderer";

export interface BrushConfig {
  readonly color?: string;
  readonly size?: number;
  readonly smoothing?: number;
  readonly pressureEnabled?: boolean;
  readonly pressureMinSizeFactor?: number;
}

const DEFAULT_COLOR = "#000";
const DEFAULT_SIZE = 5;
const DEFAULT_SMOOTHING = 0;
const DEFAULT_PRESSURE_MIN_FACTOR = 0.2;

const clamp = (
  value: number,
  min: number,
  max: number,
): number =>
  Math.min(
    max,
    Math.max(min, value),
  );

const normalizePositiveNumber = (
  value: number | undefined,
  fallback: number,
): number => {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.max(0, value);
};

const normalizeSmoothing = (
  value: number | undefined,
): number =>
  clamp(
    normalizePositiveNumber(
      value,
      DEFAULT_SMOOTHING,
    ),
    0,
    1,
  );

const normalizePressureFactor = (
  value: number | undefined,
): number =>
  clamp(
    normalizePositiveNumber(
      value,
      DEFAULT_PRESSURE_MIN_FACTOR,
    ),
    0,
    1,
  );

export const brushTool: Tool<BrushConfig> = {
  name: "brush",

  create(
    config: Readonly<BrushConfig> = {},
  ): ToolInstance<BrushConfig> {
    let drawing = false;
    let previousPoint: PurrletPointer | null = null;

    const color =
      typeof config.color === "string" &&
      config.color.length > 0
        ? config.color
        : DEFAULT_COLOR;

    const baseSize =
      normalizePositiveNumber(
        config.size,
        DEFAULT_SIZE,
      );

    const smoothing =
      normalizeSmoothing(
        config.smoothing,
      );

    const pressureEnabled =
      config.pressureEnabled ?? true;

    const minFactor =
      normalizePressureFactor(
        config.pressureMinSizeFactor,
      );

    const sizeFor = (
      pointer: PurrletPointer,
    ): number => {
      if (
        !pressureEnabled ||
        pointer.pointerType !== "pen"
      ) {
        return baseSize;
      }

      const pressure = clamp(
        Number.isFinite(pointer.pressure)
          ? pointer.pressure
          : 0,
        0,
        1,
      );

      return (
        baseSize *
        (
          minFactor +
          pressure *
            (1 - minFactor)
        )
      );
    };

    const pointFor = (
      pointer: PurrletPointer,
    ): {
      readonly x: number;
      readonly y: number;
    } => {
      if (
        previousPoint === null ||
        smoothing === 0
      ) {
        return {
          x: pointer.x,
          y: pointer.y,
        };
      }

      return {
        x:
          previousPoint.x +
          (
            pointer.x -
            previousPoint.x
          ) *
            (1 - smoothing),

        y:
          previousPoint.y +
          (
            pointer.y -
            previousPoint.y
          ) *
            (1 - smoothing),
      };
    };

    const finish = (
      renderer: Renderer,
    ): void => {
      if (!drawing) {
        return;
      }

      drawing = false;
      previousPoint = null;
      renderer.endStroke();
    };

    return {
      config,

      onPointerDown(
        pointer,
        renderer,
      ): void {
        if (drawing) {
          finish(renderer);
        }

        drawing = true;
        previousPoint = pointer;

        renderer.beginStroke(
          color,
          sizeFor(pointer),
          pointer.x,
          pointer.y,
        );
      },

      onPointerMove(
        pointer,
        renderer,
      ): void {
        if (
          !drawing ||
          !pointer.isDown
        ) {
          return;
        }

        const point =
          pointFor(pointer);

        renderer.addPoint(
          point.x,
          point.y,
          sizeFor(pointer),
        );

        previousPoint = pointer;
      },

      onPointerUp(
        _pointer,
        renderer,
      ): void {
        finish(renderer);
      },

      onPointerCancel(
        _pointer,
        renderer,
      ): void {
        finish(renderer);
      },

      onDeactivate(
        renderer,
      ): void {
        finish(renderer);
      },
    };
  },
};
