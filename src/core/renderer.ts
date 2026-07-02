import type { RendererMode } from "../types";
import { Document } from "./document";

type Point = { x: number; y: number; size: number };

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private doc: Document;

  private mode: RendererMode = "draw";

  constructor(ctx: CanvasRenderingContext2D, doc: Document) {
    this.ctx = ctx;
    this.doc = doc;
  }

  setMode(mode: RendererMode) {
    this.mode = mode;
    this.ctx.globalCompositeOperation =
      mode === "erase" ? "destination-out" : "source-over";
  }

  beginStroke(color: string, size: number, x: number, y: number) {
    this.doc.beginStroke(color, x, y, size);

    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;

    this.drawDot(x, y, size);
  }

  addPoint(x: number, y: number, size: number, smoothing = 0.3) {
    const strokes = this.doc.getStrokes();
    const stroke = strokes[strokes.length - 1];
    if (!stroke) return;

    const pts = stroke.points;
    const prev = pts[pts.length - 1];

    const cx = prev.x + (x - prev.x) * smoothing;
    const cy = prev.y + (y - prev.y) * smoothing;
    const cs = prev.size + (size - prev.size) * smoothing;

    const p = { x: cx, y: cy, size: cs };

    this.doc.addPoint(cx, cy, cs);
    this.drawSegment(prev, p);
  }

  endStroke() {
    this.doc.endStroke();
  }

  clear() {
    this.doc.clear();
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  undo() {
    this.doc.undo();
    this.redraw();
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