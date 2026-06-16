import type { Stroke } from "../types";

export class Renderer {
  private ctx: CanvasRenderingContext2D;

  private currentStroke: Stroke | null = null;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  beginStroke(color: string, size: number, x: number, y: number) {
    this.currentStroke = {
      color,
      points: [{ x, y, size }],
    };
  }

  addPoint(x: number, y: number, size: number) {
    if (!this.currentStroke) return;

    this.currentStroke.points.push({ x, y, size });
  }

  endStroke() {
    if (!this.currentStroke) return;

    this.flushStroke(this.currentStroke);
    this.currentStroke = null;
  }

  private flushStroke(stroke: Stroke) {
    const ctx = this.ctx;

    ctx.strokeStyle = stroke.color;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    for (let i = 1; i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1];
      const curr = stroke.points[i];

      ctx.lineWidth = curr.size;

      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }
  }

  clear(width: number, height: number) {
    this.ctx.clearRect(0, 0, width, height);
  }
}