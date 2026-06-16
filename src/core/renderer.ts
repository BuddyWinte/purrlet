export class Renderer {
  private ctx: CanvasRenderingContext2D;

  private currentStroke: any = null;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  beginStroke(color: string, size: number, x: number, y: number) {
    this.currentStroke = {
      color,
      points: [{ x, y, size }],
    };
    this.drawDot(x, y, size);
  }

  addPoint(x: number, y: number, size: number) {
    if (!this.currentStroke) return;
    const points = this.currentStroke.points;
    const prev = points[points.length - 1];
    points.push({ x, y, size });
    this.drawLine(prev.x, prev.y, x, y, size);
  }

  endStroke() {
    if (!this.currentStroke) return;
    this.currentStroke = null;
  }

  private drawLine(x1: number, y1: number, x2: number, y2: number, size: number) {
    this.ctx.lineWidth = size;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  private drawDot(x: number, y: number, size: number) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    this.ctx.fill();
  }
}