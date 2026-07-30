/**
 * Purrlet v2.0.0
 *
 * Please read the CONTRIBUTING.md file for our standards on code style and contribution. (such as JSDoc, TypeScript, etc. everywhere)
 * @author BuddyWinte
 * @since v0.9.0
 * @version v2.0.0
 */
"use strict";

import type { RendererMode } from "../types";
import { Document } from "./document";
import { History } from "./history";

/**
 * Represents a point in a stroke
 * @internal
 */
type Point = { x: number; y: number; size: number };

/**
 * The Renderer class is responsible for rendering the canvas based on the current document state.
 *
 * @public
 */
export class Renderer {
  private mode: RendererMode = "draw";

  /**
   * Creates a new Renderer instance
   *
   * @param ctx - The canvas rendering context.
   * @param doc - The document to render.
   * @param history - The history of strokes.
   */
  constructor(
    private ctx: CanvasRenderingContext2D,
    private doc: Document,
    private history: History
  ) {}

  /**
   * Sets the rendering mode to either "draw" or "erase".
   *
   * @param mode - The rendering mode to set.
   */
  setMode(mode: RendererMode): void {
    this.mode = mode;
    this.ctx.globalCompositeOperation =
      mode === "erase" ? "destination-out" : "source-over";
  }

  /**
   * Resizes the canvas to match the css size
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
   * Begins a new stroke with the given color, size, and starting point.
   *
   * @param color - The color of the stroke.
   * @param size - The size of the stroke.
   * @param x - The starting x-coordinate of the stroke.
   * @param y - The starting y-coordinate of the stroke.
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
   */
  endStroke(): void {
    this.doc.endStroke();
  }

  /**
   * Clears the canvas and document.
   */
  clear(): void {
    this.history.clear();
    this.doc.clear();

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  /**
   * Undoes the last stroke.
   */
  undo(): void {
    this.history.undo(this.doc);
    this.redraw();
  }

  /**
   * Redoes the last stroke.
   */
  redo(): void {
    this.history.redo(this.doc);
    this.redraw();
  }

  /**
   * Clears the history of strokes.
   */
  clearHistory(): void {
    this.history.clear();
  }

  /**
   * Redraws the canvas based on the current document state.
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

    this.ctx.globalCompositeOperation =
      this.mode === "erase" ? "destination-out" : "source-over";
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
}
