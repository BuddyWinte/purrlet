/**
 * Purrlet
 * A modern, easy-to-use, lightweight, headless canvas drawing engine for the web.
 *
 * Please read the CONTRIBUTING.md file before you contrbute.
 */

// TODO: add jsdoc
"use strict";

import type { DocFill, DocStroke, DocumentItem, RendererMode } from "../types";

export class Document {
  private items: DocumentItem[] = [];
  private current: DocStroke | null = null;

  beginStroke(
    color: string,
    x: number,
    y: number,
    size: number,
    mode: RendererMode,
  ) {
    const stroke: DocStroke = {
      id: crypto.randomUUID(),
      color,
      opacity: 1,
      compositeOperation: mode === "erase" ? "destination-out" : "source-over",
      points: [{ x, y, size }],
    };

    this.current = stroke;

    this.items.push({
      type: "stroke",
      data: stroke,
    });

    return stroke;
  }

  addPoint(x: number, y: number, size: number) {
    if (!this.current) return;

    this.current.points.push({
      x,
      y,
      size,
    });
  }

  endStroke() {
    this.current = null;
  }

  addFill(x: number, y: number, color: string, tolerance: number): DocFill {
    const fill: DocFill = {
      id: crypto.randomUUID(),
      x,
      y,
      color,
      tolerance,
    };

    this.items.push({
      type: "fill",
      data: fill,
    });

    return fill;
  }

  getItems(): DocumentItem[] {
    return this.items;
  }

  getStrokes(): DocStroke[] {
    return this.items
      .filter(
        (
          item,
        ): item is {
          type: "stroke";
          data: DocStroke;
        } => item.type === "stroke",
      )
      .map((item) => item.data);
  }

  getCurrent() {
    return this.current;
  }

  clear() {
    this.items = [];
    this.current = null;
  }

  removeLastStroke() {
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (this.items[i].type === "stroke") {
        this.items.splice(i, 1);
        break;
      }
    }
  }

  _addStroke(stroke: DocStroke) {
    this.items.push({
      type: "stroke",
      data: stroke,
    });
  }

  _addFill(fill: DocFill) {
    this.items.push({
      type: "fill",
      data: fill,
    });
  }

  _removeItemById(id: string) {
    this.items = this.items.filter((item) => {
      return item.data.id !== id;
    });

    if (this.current?.id === id) {
      this.current = null;
    }
  }

  _removeStrokeById(id: string) {
    this._removeItemById(id);
  }

  _clear() {
    this.items = [];
    this.current = null;
  }
}
