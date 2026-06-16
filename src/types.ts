export type PurrletConfig = {
    canvas: HTMLCanvasElement;
    debug?: boolean;
    defaultTool?: string;
}

export interface ToolInstance {
    onPointerDown?(p: PurrletPointer, ctx: CanvasRenderingContext2D): void;
    onPointerMove?(p: PurrletPointer, ctx: CanvasRenderingContext2D): void;
    onPointerUp?(p: PurrletPointer, ctx: CanvasRenderingContext2D): void;
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
}