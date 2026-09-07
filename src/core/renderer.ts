"use strict";

import type {
  DocFill,
  DocPoint,
  DocRectangle,
  DocStroke,
  DocumentItem,
  RendererMode,
} from "../types";
import { Document } from "./document";
import { History } from "./history";

type PreviewRenderer = (context: CanvasRenderingContext2D) => void;

const modeToCompositeOperation = (
  mode: RendererMode,
): GlobalCompositeOperation =>
  mode === "erase" ? "destination-out" : "source-over";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizeNumber = (value: number, fallback: number): number =>
  Number.isFinite(value) ? value : fallback;

const normalizeSize = (size: number): number =>
  Math.max(0, normalizeNumber(size, 0));

const normalizeTolerance = (tolerance: number): number =>
  clamp(normalizeNumber(tolerance, 0), 0, 510);

const createPoint = (x: number, y: number, size: number): DocPoint => ({
  x,
  y,
  size: normalizeSize(size),
});

const createId = (): string => crypto.randomUUID();

export class Renderer {
  private mode: RendererMode = "draw";
  private previewRenderer: PreviewRenderer | null = null;
  private activeStroke: DocStroke | null = null;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly doc: Document,
    private readonly history: History,
  ) {}

  setMode(mode: RendererMode): void {
    this.mode = mode;
    this.ctx.globalCompositeOperation = modeToCompositeOperation(mode);
  }

  resize(): void {
    const canvas = this.ctx.canvas;
    const rect = canvas.getBoundingClientRect();

    const width = Math.max(1, Math.round(rect.width));

    const height = Math.max(1, Math.round(rect.height));

    const dpr =
      typeof window === "undefined"
        ? 1
        : Math.max(1, normalizeNumber(window.devicePixelRatio, 1));

    const pixelWidth = Math.max(1, Math.round(width * dpr));

    const pixelHeight = Math.max(1, Math.round(height * dpr));

    if (canvas.width === pixelWidth && canvas.height === pixelHeight) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      return;
    }

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.redraw();
  }

  beginStroke(color: string, size: number, x: number, y: number): void {
    this.endStroke();

    const point = createPoint(x, y, size);

    this.activeStroke = {
      id: createId(),
      color,
      opacity: 1,
      compositeOperation: modeToCompositeOperation(this.mode),
      points: [point],
    };

    this.ctx.save();

    this.ctx.globalCompositeOperation = this.activeStroke.compositeOperation;

    this.ctx.globalAlpha = this.activeStroke.opacity;

    this.ctx.strokeStyle = this.activeStroke.color;

    this.ctx.fillStyle = this.activeStroke.color;

    this.drawDot(x, y, point.size);

    this.ctx.restore();

    this.restoreMode();
  }

  addPoint(x: number, y: number, size: number): boolean {
    const stroke = this.activeStroke;

    if (stroke === null) {
      return false;
    }

    const previous = stroke.points[stroke.points.length - 1];

    if (previous === undefined) {
      return false;
    }

    const point = createPoint(x, y, size);

    this.activeStroke = {
      ...stroke,
      points: [...stroke.points, point],
    };

    this.ctx.save();

    this.ctx.globalCompositeOperation = stroke.compositeOperation;

    this.ctx.globalAlpha = stroke.opacity;

    this.ctx.strokeStyle = stroke.color;

    this.ctx.fillStyle = stroke.color;

    this.drawSegment(previous, point);

    this.ctx.restore();

    this.restoreMode();

    return true;
  }

  endStroke(): boolean {
    const stroke = this.activeStroke;

    if (stroke === null) {
      return false;
    }

    this.activeStroke = null;

    const item: DocumentItem = {
      type: "stroke",
      data: stroke,
    };

    this.history.execute(this.doc, {
      execute: (document) => {
        document.add(item);
      },

      undo: (document) => {
        document.remove(stroke.id);
      },
    });

    this.redraw();

    return true;
  }

  clear(): void {
    this.activeStroke = null;
    this.previewRenderer = null;

    const previous = this.doc.getItems();

    if (previous.length === 0) {
      this.history.clear();
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
      return;
    }

    const snapshot = [...previous];

    this.history.execute(this.doc, {
      execute: (document) => {
        document.clear();
      },
      undo: (document) => {
        for (const item of snapshot) {
          document.add(item);
        }
      },
    });

    this.redraw();
  }

  undo(): boolean {
    this.activeStroke = null;

    const changed = this.history.undo(this.doc);

    if (!changed) {
      return false;
    }

    this.redraw();

    return true;
  }

  redo(): boolean {
    this.activeStroke = null;

    const changed = this.history.redo(this.doc);

    if (!changed) {
      return false;
    }

    this.redraw();

    return true;
  }

  clearHistory(): void {
    this.history.clear();
  }

  redraw(): void {
    const canvas = this.ctx.canvas;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const item of this.doc.getItems()) {
      this.renderItem(item);
    }

    if (this.activeStroke !== null) {
      this.renderStroke(this.activeStroke);
    }

    const preview = this.previewRenderer;

    if (preview !== null) {
      this.ctx.save();
      this.ctx.globalCompositeOperation = "source-over";
      this.ctx.globalAlpha = 1;
      preview(this.ctx);
      this.ctx.restore();
    }

    this.restoreMode();
  }

  preview(renderer: PreviewRenderer): void {
    this.previewRenderer = renderer;
    this.redraw();
  }

  clearPreview(): void {
    if (this.previewRenderer === null) {
      return;
    }

    this.previewRenderer = null;
    this.redraw();
  }

  fill(x: number, y: number, color: string, tolerance: number): boolean {
    const fill: DocFill = {
      id: createId(),
      x,
      y,
      color,
      tolerance: normalizeTolerance(tolerance),
    };

    this.history.execute(this.doc, {
      execute: (document) => {
        document.add({
          type: "fill",
          data: fill,
        });
      },
      undo: (document) => {
        document.remove(fill.id);
      },
    });

    this.redraw();

    return true;
  }

  previewLine(
    color: string,
    size: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): void {
    this.preview((ctx) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = normalizeSize(size);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    });
  }

  private renderFill(fill: DocFill): void {
    const canvas = this.ctx.canvas;

    const dpr =
      typeof window === "undefined"
        ? 1
        : Math.max(
            1,
            normalizeNumber(
              window.devicePixelRatio,
              1,
            ),
          );

    const x = Math.floor(fill.x * dpr);
    const y = Math.floor(fill.y * dpr);

    if (
      x < 0 ||
      y < 0 ||
      x >= canvas.width ||
      y >= canvas.height
    ) {
      return;
    }

    const color = this.parseColor(fill.color);

    if (color === null) {
      return;
    }

    const image = this.ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    this.floodFill(
      image,
      x,
      y,
      color,
      normalizeTolerance(fill.tolerance),
    );

    this.ctx.putImageData(
      image,
      0,
      0,
    );
  }

  private floodFill(
    image: ImageData,
    startX: number,
    startY: number,
    fill: [number, number, number, number],
    tolerance: number,
  ): void {
    const { width, height, data } = image;

    const startIndex =
      (startY * width + startX) * 4;

    const target: [
      number,
      number,
      number,
      number,
    ] = [
      data[startIndex] ?? 0,
      data[startIndex + 1] ?? 0,
      data[startIndex + 2] ?? 0,
      data[startIndex + 3] ?? 0,
    ];

    if (
      this.colorsMatch(
        target,
        fill,
        tolerance,
      )
    ) {
      return;
    }

    const threshold =
      tolerance * tolerance;

    const matches = (
      x: number,
      y: number,
    ): boolean => {
      const index =
        (y * width + x) * 4;

      const dr =
        (data[index] ?? 0) - target[0];

      const dg =
        (data[index + 1] ?? 0) - target[1];

      const db =
        (data[index + 2] ?? 0) - target[2];

      const da =
        (data[index + 3] ?? 0) - target[3];

      return (
        dr * dr +
        dg * dg +
        db * db +
        da * da <=
        threshold
      );
    };

    const queue: Array<
      readonly [number, number]
    > = [[startX, startY]];

    const visited = new Uint8Array(
      width * height,
    );

    while (queue.length > 0) {
      const point = queue.pop();

      if (point === undefined) {
        continue;
      }

      const [x, y] = point;

      if (
        x < 0 ||
        y < 0 ||
        x >= width ||
        y >= height
      ) {
        continue;
      }

      const pixelIndex =
        y * width + x;

      if (
        visited[pixelIndex] !== 0
      ) {
        continue;
      }

      if (!matches(x, y)) {
        continue;
      }

      visited[pixelIndex] = 1;

      let left = x;

      while (
        left > 0 &&
        matches(left - 1, y)
      ) {
        left--;
      }

      let right = x;

      while (
        right < width - 1 &&
        matches(right + 1, y)
      ) {
        right++;
      }

      for (
        let currentX = left;
        currentX <= right;
        currentX++
      ) {
        const index =
          (y * width + currentX) * 4;

        data[index] = fill[0];
        data[index + 1] = fill[1];
        data[index + 2] = fill[2];
        data[index + 3] = fill[3];

        visited[
          y * width + currentX
        ] = 1;

        if (y > 0) {
          const aboveIndex =
            (y - 1) * width +
            currentX;

          if (
            visited[aboveIndex] === 0 &&
            matches(
              currentX,
              y - 1,
            )
          ) {
            queue.push([
              currentX,
              y - 1,
            ]);
          }
        }

        if (y < height - 1) {
          const belowIndex =
            (y + 1) * width +
            currentX;

          if (
            visited[belowIndex] === 0 &&
            matches(
              currentX,
              y + 1,
            )
          ) {
            queue.push([
              currentX,
              y + 1,
            ]);
          }
        }
      }
    }
  }

  private colorsMatch(
    a: readonly [number, number, number, number],
    b: readonly [number, number, number, number],
    tolerance: number,
  ): boolean {
    const dr = a[0] - b[0];

    const dg = a[1] - b[1];

    const db = a[2] - b[2];

    const da = a[3] - b[3];

    return dr * dr + dg * dg + db * db + da * da <= tolerance * tolerance;
  }

  private parseColor(color: string): [number, number, number, number] | null {
    if (typeof document === "undefined") {
      return null;
    }

    const canvas = document.createElement("canvas");

    canvas.width = 1;
    canvas.height = 1;

    const context = canvas.getContext("2d");

    if (context === null) {
      return null;
    }

    this.expandFillEdges(
      image,
      fill,
      target,
    );
  }

  private expandFillEdges(
    image: ImageData,
    fill: readonly [
      number,
      number,
      number,
      number,
    ],
    target: readonly [
      number,
      number,
      number,
      number,
    ],
  ): void {
    const { width, height, data } = image;

    const original = new Uint8ClampedArray(
      data,
    );

    const isFill = (
      x: number,
      y: number,
    ): boolean => {
      const index =
        (y * width + x) * 4;

      return (
        data[index] === fill[0] &&
        data[index + 1] === fill[1] &&
        data[index + 2] === fill[2] &&
        data[index + 3] === fill[3]
      );
    };

    const blendEdge = (
      x: number,
      y: number,
    ): void => {
      const index =
        (y * width + x) * 4;

      const currentR =
        original[index] ?? 0;

      const currentG =
        original[index + 1] ?? 0;

      const currentB =
        original[index + 2] ?? 0;

      const currentA =
        original[index + 3] ?? 0;

      const targetDistance =
        Math.sqrt(
          (currentR - target[0]) ** 2 +
          (currentG - target[1]) ** 2 +
          (currentB - target[2]) ** 2 +
          (currentA - target[3]) ** 2,
        );

      const maxDistance = 128;

      if (
        targetDistance <= 0 ||
        targetDistance >= maxDistance
      ) {
        return;
      }

      const amount =
        1 -
        targetDistance /
          maxDistance;

      data[index] = Math.round(
        currentR * (1 - amount) +
        fill[0] * amount,
      );

      data[index + 1] = Math.round(
        currentG * (1 - amount) +
        fill[1] * amount,
      );

      data[index + 2] = Math.round(
        currentB * (1 - amount) +
        fill[2] * amount,
      );

      data[index + 3] = Math.round(
        currentA * (1 - amount) +
        fill[3] * amount,
      );
    };

    for (
      let y = 1;
      y < height - 1;
      y++
    ) {
      for (
        let x = 1;
        x < width - 1;
        x++
      ) {
        if (!isFill(x, y)) {
          continue;
        }

        const neighbors = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ] as const;

        for (const [nx, ny] of neighbors) {
          if (
            isFill(nx, ny)
          ) {
            continue;
          }

          blendEdge(nx, ny);
        }
      }
    }
  }

  private colorsMatch(
    a: readonly [
      number,
      number,
      number,
      number,
    ],
    b: readonly [
      number,
      number,
      number,
      number,
    ],
    tolerance: number,
  ): boolean {
    const dr = a[0] - b[0];
    const dg = a[1] - b[1];
    const db = a[2] - b[2];
    const da = a[3] - b[3];

    const distance =
      dr * dr +
      dg * dg +
      db * db +
      da * da;

    return distance <= tolerance * tolerance;
  }

  private renderItem(item: DocumentItem): void {
    switch (item.type) {
      case "stroke":
        this.renderStroke(item.data);
        return;

      case "fill":
        this.renderFill(item.data);
        return;

      case "rectangle":
        this.renderRectangle(item.data);
        return;
    }
  }

  private renderStroke(stroke: DocStroke): void {
    if (stroke.points.length === 0) {
      return;
    }

    this.ctx.save();

    this.ctx.globalCompositeOperation = stroke.compositeOperation;

    this.ctx.globalAlpha = clamp(normalizeNumber(stroke.opacity, 1), 0, 1);

    this.ctx.strokeStyle = stroke.color;

    this.ctx.fillStyle = stroke.color;

    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    if (stroke.points.length === 1) {
      const point = stroke.points[0];

      if (point !== undefined) {
        this.drawDot(point.x, point.y, point.size);
      }

      this.ctx.restore();
      return;
    }

    for (let index = 1; index < stroke.points.length; index++) {
      const previous = stroke.points[index - 1];

      const current = stroke.points[index];

      if (previous === undefined || current === undefined) {
        continue;
      }

      this.drawSegment(previous, current);
    }

    this.ctx.restore();
  }

  private renderRectangle(rectangle: DocRectangle): void {
    this.ctx.save();

    this.ctx.globalCompositeOperation = rectangle.compositeOperation;

    this.ctx.globalAlpha = clamp(normalizeNumber(rectangle.opacity, 1), 0, 1);

    this.ctx.fillStyle = rectangle.color;

    this.ctx.fillRect(
      rectangle.x,
      rectangle.y,
      rectangle.width,
      rectangle.height,
    );

    this.ctx.restore();
  }

  cancelStroke(): void {
    if (this.activeStroke === null) {
      return;
    }

    this.activeStroke = null;
    this.redraw();
  }

  private parseColor(color: string): [number, number, number, number] | null {
    if (typeof document === "undefined") {
      return null;
    }

    const canvas = document.createElement("canvas");

    canvas.width = 1;
    canvas.height = 1;

    const context = canvas.getContext("2d");

    if (context === null) {
      return null;
    }

    context.fillStyle = color;

    if (context.fillStyle === "") {
      return null;
    }

    context.fillRect(0, 0, 1, 1);

    const data = context.getImageData(0, 0, 1, 1).data;

    return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0, data[3] ?? 0];
  }

  private drawSegment(a: DocPoint, b: DocPoint): void {
    this.ctx.lineWidth = b.size;

    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    this.ctx.beginPath();
    this.ctx.moveTo(a.x, a.y);
    this.ctx.lineTo(b.x, b.y);
    this.ctx.stroke();
  }

  private drawDot(x: number, y: number, size: number): void {
    const radius = size / 2;

    if (radius <= 0) {
      return;
    }

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private restoreMode(): void {
    this.ctx.globalCompositeOperation = modeToCompositeOperation(this.mode);

    this.ctx.globalAlpha = 1;
  }
}
