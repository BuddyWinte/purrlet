export type ToolContext = {
  ctx: CanvasRenderingContext2D;
};

export type Pointer = {
  x: number;
  y: number;
  isDown: boolean;
};

export interface ToolInstance {
  onDown(p: Pointer, ctx: ToolContext): void;
  onMove(p: Pointer, ctx: ToolContext): void;
  onUp(p: Pointer, ctx: ToolContext): void;
}

export interface Tool {
  name: string;
  create(config: any): ToolInstance;
}