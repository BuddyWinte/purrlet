import type { RendererMode } from "../types";
import { Document } from "./document";
import { History } from "./history";

type Point = { x: number; y: number; size: number };

export class Renderer {
  private mode: RendererMode = "draw";

  constructor(
    private ctx: CanvasRenderingContext2D,
    private doc: Document,
    private history: History
  ) {}

  setMode(mode: RendererMode) {
    this.mode = mode;
    this.ctx.globalCompositeOperation =
      mode === "erase" ? "destination-out" : "source-over";
  }

  beginStroke(color: string, size: number, x: number, y: number) {
    const stroke = this.doc.beginStroke(color, x, y, size);

    this.history.pushStroke(stroke);

    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;

    this.drawDot(x, y, size);
  }

  addPoint(x: number, y: number, size: number) {
    const stroke = this.doc.getCurrent();
    if (!stroke) return;

    const pts = stroke.points;
    const prev = pts[pts.length - 1];

    const p = { x, y, size };
    pts.push(p);

    this.drawSegment(prev, p);
  }

  endStroke() {
    this.doc.endStroke();
  }

  clear() {
    this.history.clear();
    this.doc.clear();

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  undo() {
    this.history.undo(this.doc);
    this.redraw();
  }

  redo() {
    this.history.redo(this.doc);
    this.redraw();
  }

  clearHistory() {
    this.history.clear();
  }

  redraw() {
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

  private drawSegment(a: Point, b: Point) {
    this.ctx.lineWidth = b.size;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    this.ctx.beginPath();
    this.ctx.moveTo(a.x, a.y);
    this.ctx.lineTo(b.x, b.y);
    this.ctx.stroke();
  }

  private drawDot(x: number, y: number, size: number) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    this.ctx.fill();
  }
}