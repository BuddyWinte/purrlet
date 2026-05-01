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

export interface Tool<TConfig = any> {
  name: string;
  modifiesCanvas?: boolean;
  create(config: TConfig): ToolInstance;
}

export type ToolMap = Record<string, Tool>;
