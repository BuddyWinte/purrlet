/**
 * Purrlet
 * A modern, easy-to-use, lightweight, headless canvas drawing engine for the web.
 *
 * Please read the CONTRIBUTING.md file before you contrbute.
 */
"use strict";

import type { RendererMode, DocFill, DocStroke } from "../types";
import { Document } from "./document";
import { History } from "./history";

/**
 * Represents a point in a stroke.
 *
 * @internal
 */
type Point = { x: number; y: number; size: number };

/**
 * Represents a function used to render temporary preview content.
 *
 * @internal
 */
type PreviewRenderer = (ctx: CanvasRenderingContext2D) => void;

/**
 * The Renderer class is responsible for rendering the canvas based on the current document state.
 *
 * @public
 */
export class Renderer {
  private mode: RendererMode = "draw";
  private previewRenderer: PreviewRenderer | null = null;

  /**
   * Creates a new Renderer instance.
   *
   * @param ctx - The canvas rendering context.
   * @param doc - The document to render.
   * @param history - The history of strokes.
   */
  constructor(
    private ctx: CanvasRenderingContext2D,
    private doc: Document,
    private history: History,
  ) {}

  /**
   * Sets the rendering mode to either `"draw"` or `"erase"`.
   *
   * @param mode - The rendering mode to set.
   *
   * @public
   */
  setMode(mode: RendererMode): void {
    this.mode = mode;
    this.ctx.globalCompositeOperation =
      mode === "erase" ? "destination-out" : "source-over";
  }

  /**
   * Resizes the canvas to match its CSS dimensions while accounting for
   * the device pixel ratio.
   *
   * The canvas is redrawn after resizing.
   *
   * @public
   */
  resize(): void {
    const rect = this.ctx.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.ctx.canvas.width = rect.width * dpr;
    this.ctx.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.redraw();
  }

  /**
   * Begins a new stroke with the given color, size, and initial point.
   *
   * @param color - The color of the stroke.
   * @param size - The size of the stroke.
   * @param x - The initial x-coordinate of the stroke.
   * @param y - The initial y-coordinate of the stroke.
   *
   * @public
   */
  beginStroke(color: string, size: number, x: number, y: number): void {
    const stroke = this.doc.beginStroke(color, x, y, size, this.mode);

    this.history.pushStroke(stroke);

    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;

    this.drawDot(x, y, size);
  }

  /**
   * Adds a point to the current stroke at the given coordinates and size.
   *
   * @param x - The x-coordinate of the point.
   * @param y - The y-coordinate of the point.
   * @param size - The size of the point.
   *
   * @public
   */
  addPoint(x: number, y: number, size: number): void {
    const stroke = this.doc.getCurrent();
    if (!stroke) return;

    const pts = stroke.points;
    const prev = pts[pts.length - 1];

    const p = { x, y, size };
    pts.push(p);

    this.drawSegment(prev, p);
  }

  /**
   * Ends the current stroke.
   *
   * @public
   */
  endStroke(): void {
    this.doc.endStroke();
  }

  /**
   * Clears the canvas and document.
   *
   * @public
   */
  clear(): void {
    this.history.clear();
    this.doc.clear();

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  /**
   * Undoes the last stroke.
   *
   * @public
   */
  undo(): void {
    this.history.undo(this.doc);
    this.redraw();
  }

  /**
   * Redoes the last stroke.
   *
   * @public
   */
  redo(): void {
    this.history.redo(this.doc);
    this.redraw();
  }

  /**
   * Clears the history of strokes.
   *
   * @public
   */
  clearHistory(): void {
    this.history.clear();
  }

  /**
   * Redraws the canvas based on the current document state and active preview.
   *
   * @public
   */
  redraw(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    for (const item of this.doc.getItems()) {
      switch (item.type) {
        case "stroke":
          this.renderStroke(item.data);
          break;

        case "fill":
          this.renderFill(item.data);
          break;
      }
    }

    if (this.previewRenderer) {
      this.ctx.save();
      this.ctx.globalCompositeOperation = "source-over";
      this.previewRenderer(this.ctx);
      this.ctx.restore();
    }

    this.ctx.globalCompositeOperation =
      this.mode === "erase" ? "destination-out" : "source-over";
  }

  /**
   * Renders temporary preview content on top of the document.
   *
   * Preview content is not added to the document or history and remains
   * active until it is replaced by another preview or cleared with
   * {@link clearPreview}.
   *
   * @param renderer - Function used to render the preview.
   *
   * @public
   */
  preview(renderer: PreviewRenderer): void {
    this.previewRenderer = renderer;
    this.redraw();
  }

  /**
   * Clears the current preview.
   *
   * @public
   */
  clearPreview(): void {
    if (!this.previewRenderer) return;

    this.previewRenderer = null;
    this.redraw();
  }

  fill(x: number, y: number, color: string, tolerance: number): void {
    this.doc.addFill(x, y, color, tolerance);
    this.redraw();
  }

  /**
   * Draws a segment between two points.
   *
   * @param a - The starting point of the segment.
   * @param b - The ending point of the segment.
   * @private
   */
  private drawSegment(a: Point, b: Point): void {
    this.ctx.lineWidth = b.size;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    this.ctx.beginPath();
    this.ctx.moveTo(a.x, a.y);
    this.ctx.lineTo(b.x, b.y);
    this.ctx.stroke();
  }

  private renderStroke(stroke: DocStroke): void {
    this.ctx.save();

    this.ctx.globalCompositeOperation = stroke.compositeOperation;

    this.ctx.globalAlpha = stroke.opacity;
    this.ctx.strokeStyle = stroke.color;
    this.ctx.fillStyle = stroke.color;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    if (stroke.points.length === 1) {
      const point = stroke.points[0];

      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, point.size / 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
      return;
    }

    for (let i = 1; i < stroke.points.length; i++) {
      const a = stroke.points[i - 1];
      const b = stroke.points[i];

      this.ctx.lineWidth = b.size;

      this.ctx.beginPath();
      this.ctx.moveTo(a.x, a.y);
      this.ctx.lineTo(b.x, b.y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private renderFill(fill: DocFill): void {
    const image = this.ctx.getImageData(
      0,
      0,
      this.ctx.canvas.width,
      this.ctx.canvas.height,
    );

    const color = this.parseColor(fill.color);

    if (!color) return;

    this.floodFill(
      image,
      Math.floor(fill.x),
      Math.floor(fill.y),
      color,
      fill.tolerance,
    );

    this.ctx.putImageData(image, 0, 0);
  }

  private floodFill(
    image: ImageData,
    startX: number,
    startY: number,
    fill: [number, number, number, number],
    tolerance: number,
  ): void {
    const { width, height, data } = image;

    if (startX < 0 || startY < 0 || startX >= width || startY >= height) {
      return;
    }

    const startIndex = (startY * width + startX) * 4;

    const target: [number, number, number, number] = [
      data[startIndex],
      data[startIndex + 1],
      data[startIndex + 2],
      data[startIndex + 3],
    ];

    if (this.colorsMatch(target, fill, tolerance)) {
      return;
    }

    const matches = (x: number, y: number): boolean => {
      const index = (y * width + x) * 4;

      const dr = data[index] - target[0];
      const dg = data[index + 1] - target[1];
      const db = data[index + 2] - target[2];
      const da = data[index + 3] - target[3];

      return (
        dr * dr +
        dg * dg +
        db * db +
        da * da <=
        tolerance * tolerance
      );
    };

    const queue: Array<[number, number]> = [[startX, startY]];

    while (queue.length > 0) {
      const [x, y] = queue.pop()!;

      if (!matches(x, y)) {
        continue;
      }

      let left = x;

      while (left >= 0 && matches(left, y)) {
        left--;
      }

      left++;

      let spanAbove = false;
      let spanBelow = false;

      for (
        let currentX = left;
        currentX < width && matches(currentX, y);
        currentX++
      ) {
        const index = (y * width + currentX) * 4;

        data[index] = fill[0];
        data[index + 1] = fill[1];
        data[index + 2] = fill[2];
        data[index + 3] = fill[3];

        if (y > 0) {
          const aboveMatches = matches(currentX, y - 1);

          if (aboveMatches && !spanAbove) {
            queue.push([currentX, y - 1]);

            spanAbove = true;
          } else if (!aboveMatches) {
            spanAbove = false;
          }
        }

        if (y < height - 1) {
          const belowMatches = matches(currentX, y + 1);

          if (belowMatches && !spanBelow) {
            queue.push([currentX, y + 1]);

            spanBelow = true;
          } else if (!belowMatches) {
            spanBelow = false;
          }
        }
      }
    }
  }

  private colorsMatch(
    a: [number, number, number, number],
    b: [number, number, number, number],
    tolerance: number,
  ): boolean {
    const distance = Math.sqrt(
      Math.pow(a[0] - b[0], 2) +
        Math.pow(a[1] - b[1], 2) +
        Math.pow(a[2] - b[2], 2) +
        Math.pow(a[3] - b[3], 2),
    );

    return distance <= tolerance;
  }

  private parseColor(color: string): [number, number, number, number] | null {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;

    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);

    const data = ctx.getImageData(0, 0, 1, 1).data;

    return [data[0], data[1], data[2], data[3]];
  }

  /**
   * Draws a dot at the given coordinates and size.
   *
   * @param x - The x-coordinate of the dot.
   * @param y - The y-coordinate of the dot.
   * @param size - The size of the dot.
   * @private
   */
  private drawDot(x: number, y: number, size: number): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * Previews a line between two points.
   *
   * @param color - The color of the line.
   * @param size - The width of the line.
   * @param startX - The starting x-coordinate.
   * @param startY - The starting y-coordinate.
   * @param endX - The ending x-coordinate.
   * @param endY - The ending y-coordinate.
   * @public
   */
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
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    });
  }
}
