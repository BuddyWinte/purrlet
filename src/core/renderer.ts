/**
 * Purrlet
 *
 * @author BuddyWinte
 * @since v0.9.0
 * @version v2.0.0
 */
"use strict";

import type { RendererMode } from "../types";
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
    const stroke = this.doc.beginStroke(color, x, y, size);

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
    this.ctx.globalCompositeOperation = "source-over";
    for (const stroke of this.doc.getStrokes()) {
      this.ctx.strokeStyle = stroke.color;
      for (let i = 1; i < stroke.points.length; i++) {
        const a = stroke.points[i - 1];
        const b = stroke.points[i];
        this.ctx.lineWidth = b.size;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.beginPath();
        this.ctx.moveTo(a.x, a.y);
        this.ctx.lineTo(b.x, b.y);
        this.ctx.stroke();
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
