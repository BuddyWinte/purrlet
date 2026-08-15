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
  onActivate?(renderer: Renderer): void;
  onDeactivate?(renderer: Renderer): void;
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

export type StrokePoint = {
  x: number;
  y: number;
  size: number;
};

export type Stroke = {
  id: string;
  color: string;
  points: StrokePoint[];
  mode: RendererMode;
};

export type RendererMode = "draw" | "erase";

export type DocPoint = {
  x: number;
  y: number;
  size: number;
};

export type DocStroke = {
  id: string;
  color: string;
  points: DocPoint[];
  mode: RendererMode
};

export interface HistoryCommand {
  execute(doc: Document): void;
  undo(doc: Document): void;
}
