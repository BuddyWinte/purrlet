import type { DocPoint, DocStroke } from "../types";

export class Document {
  private strokes: DocStroke[] = [];
  private current: DocStroke | null = null;

  beginStroke(color: string, x: number, y: number, size: number) {
    this.current = {
      id: crypto.randomUUID(),
      color,
      points: [{ x, y, size }],
    };

    this.strokes.push(this.current);
    return this.current;
  }

  addPoint(x: number, y: number, size: number) {
    if (!this.current) return;

    this.current.points.push({ x, y, size });
    return this.current;
  }

  endStroke() {
    this.current = null;
  }

  getStrokes() {
    return this.strokes;
  }

  clear() {
    this.strokes = [];
    this.current = null;
  }

  undo() {
    this.strokes.pop();
  }
}