import { Renderer } from "./core/renderer";

export type PurrletConfig = {
  canvas: HTMLCanvasElement;
  debug?: boolean;
  defaultTool?: string;
};

export interface ToolInstance {
  onPointerDown?(p: PurrletPointer, renderer: Renderer): void;
  onPointerMove?(p: PurrletPointer, renderer: Renderer): void;
  onPointerUp?(p: PurrletPointer, renderer: Renderer): void;

  onActivate?(): void;
  onDeactivate?(): void;
}

export interface Tool<TConfig = any> {
  name: string;
  create(config: TConfig): ToolInstance;
}

export type ToolMap = Record<string, Tool<any>>;

export type PurrletPointer = {
  x: number;
  y: number;
  pressure: number;
  tiltX: number;
  tiltY: number;
  pointerType: "mouse" | "pen" | "touch";
  pointerId: number;
  isDown: boolean;
};

export type StrokeStyle = {
  color: string;
  size: number;
};

export type StrokePoint = {
  x: number;
  y: number;
  size: number;
};

export type Stroke = {
  color: string;
  points: StrokePoint[];
};