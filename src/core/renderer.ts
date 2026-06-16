"use strict";
/*!
 * Purrlet v2.0.0
 *
 * Created by BuddyWinte and pawsome contributors
 * https://github.com/BuddyWinte/Purrlet
 *
 * License: MIT
 */

import type { Stroke } from "../types";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

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

    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;

    this.drawDot(x, y, size);
  }

  addPoint(x: number, y: number, size: number, smoothing = 0) {
    if (!this.currentStroke) return;

    const pts = this.currentStroke.points;
    const prev = pts[pts.length - 1];

    pts.push({ x, y, size });

    this.drawLine(prev.x, prev.y, x, y, prev.size, size, smoothing);
  }

  endStroke() {
    this.currentStroke = null;
  }

  private drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    s1: number,
    s2: number,
    smoothing: number,
  ) {
    const color = this.currentStroke?.color ?? "#000";

    this.ctx.strokeStyle = color;

    const steps = Math.max(1, Math.floor(6 * smoothing));

    let px = x1;
    let py = y1;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;

      const x = lerp(x1, x2, t);
      const y = lerp(y1, y2, t);
      const size = lerp(s1, s2, t);

      this.ctx.lineWidth = size;
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";

      this.ctx.beginPath();
      this.ctx.moveTo(px, py);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();

      px = x;
      py = y;
    }
  }

  private drawDot(x: number, y: number, size: number) {
    const color = this.currentStroke?.color ?? "#000";

    this.ctx.fillStyle = color;

    this.ctx.beginPath();
    this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
