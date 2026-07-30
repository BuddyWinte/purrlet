/**
 * Purrlet v2.0.0
 *
 * Please read the CONTRIBUTING.md file for our standards on code style and contribution. (such as JSDoc, TypeScript, etc. everywhere)
 * @author BuddyWinte
 * @since v0.9.0
 * @version v2.0.0
 */
"use strict";

import type { DocStroke } from "../types";

export class Document {
  private strokes: DocStroke[] = [];
  private current: DocStroke | null = null;

  beginStroke(color: string, x: number, y: number, size: number) {
    const stroke: DocStroke = {
      id: crypto.randomUUID(),
      color,
      points: [{ x, y, size }],
    };

    this.current = stroke;
    this.strokes.push(stroke);

    return stroke;
  }

  addPoint(x: number, y: number, size: number) {
    if (!this.current) return;
    this.current.points.push({ x, y, size });
  }

  endStroke() {
    this.current = null;
  }

  getStrokes() {
    return this.strokes;
  }

  getCurrent() {
    return this.current;
  }

  clear() {
    this.strokes = [];
    this.current = null;
  }

  removeLastStroke() {
    this.strokes.pop();
  }

  _addStroke(stroke: DocStroke) {
    this.strokes.push(stroke);
  }

  _removeStrokeById(id: string) {
    this.strokes = this.strokes.filter((s) => s.id !== id);

    if (this.current?.id === id) {
      this.current = null;
    }
  }

  _clear() {
    this.strokes = [];
    this.current = null;
  }
}
