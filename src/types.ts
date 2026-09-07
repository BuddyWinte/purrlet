"use strict";

import type { Renderer } from "./core/renderer";
export type PurrletCanvas = HTMLCanvasElement | string;
export type PointerType = "mouse" | "pen" | "touch";
export type RendererMode = "draw" | "erase";
export type DocumentItemType =
  | "stroke"
  | "fill"
  | "rectangle";
export type PurrletToolConfig = object;

export interface PurrletConfig {
  readonly canvas: PurrletCanvas;
  readonly debug?: boolean;
  readonly defaultTool?: string;
}

export interface PurrletPointer {
  readonly x: number;
  readonly y: number;
  readonly pressure: number;
  readonly tiltX: number;
  readonly tiltY: number;
  readonly pointerType: PointerType;
  readonly pointerId: number;
  readonly isDown: boolean;
}

export interface DocPoint {
  readonly x: number;
  readonly y: number;
  readonly size: number;
}

export interface DocStroke {
  readonly id: string;
  readonly color: string;
  readonly opacity: number;
  readonly compositeOperation: GlobalCompositeOperation;
  readonly points: readonly DocPoint[];
}

export interface DocFill {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly color: string;
  readonly tolerance: number;
}

export interface DocRectangle {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly color: string;
  readonly size: number;
  readonly opacity: number;
  readonly compositeOperation: GlobalCompositeOperation;
}

export interface DocumentStrokeItem {
  readonly type: "stroke";
  readonly data: DocStroke;
}

export interface DocumentFillItem {
  readonly type: "fill";
  readonly data: DocFill;
}

export interface DocumentRectangleItem {
  readonly type: "rectangle";
  readonly data: DocRectangle;
}

export type DocumentItem =
  | DocumentStrokeItem
  | DocumentFillItem
  | DocumentRectangleItem;

export interface ToolInstance<
  TConfig extends PurrletToolConfig = PurrletToolConfig,
> {
  readonly config: Readonly<TConfig>;

  readonly onPointerDown?: (
    pointer: PurrletPointer,
    renderer: Renderer,
  ) => void;

  readonly onPointerMove?: (
    pointer: PurrletPointer,
    renderer: Renderer,
  ) => void;

  readonly onPointerUp?: (
    pointer: PurrletPointer,
    renderer: Renderer,
  ) => void;

  readonly onPointerCancel?: (
    pointer: PurrletPointer,
    renderer: Renderer,
  ) => void;

  readonly onActivate?: (
    renderer: Renderer,
  ) => void;

  readonly onDeactivate?: (
    renderer: Renderer,
  ) => void;
}

export interface Tool<
  TConfig extends PurrletToolConfig = PurrletToolConfig,
> {
  readonly name: string;
  readonly create: (
    config: Readonly<TConfig>,
  ) => ToolInstance<TConfig>;
}

export interface RegisteredTool {
  readonly name: string;
  readonly create: (
    config: Readonly<PurrletToolConfig>,
  ) => ToolInstance;
}

export type ToolMap = Record<string, RegisteredTool>;
