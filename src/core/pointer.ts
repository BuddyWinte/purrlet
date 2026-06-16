import { PurrletPointer } from "../types";

export function bindPointer(
    canvas: HTMLCanvasElement,
    handlers: {
        down: (p: PurrletPointer, e: PointerEvent) => void;
        move: (p: PurrletPointer, e: PointerEvent) => void;
        up: (p: PurrletPointer, e: PointerEvent) => void;
    }
) {
    const getPoint = (e: PointerEvent): PurrletPointer => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left),
            y: (e.clientY - rect.top),
            pressure: e.pressure ?? 0,
            tiltX: e.tiltX ?? 0,
            tiltY: e.tiltY ?? 0,
            pointerType: e.pointerType as any,
            pointerId: e.pointerId,
            isDown: e.buttons > 0,
        };
    };
    
    canvas.addEventListener("pointerdown", (e) => {
        canvas.setPointerCapture(e.pointerId);
        handlers.down(getPoint(e), e);
    });

    canvas.addEventListener("pointermove", (e) => {
        handlers.move(getPoint(e), e);
    });

    canvas.addEventListener("pointerup", (e) => {
        handlers.up(getPoint(e), e);
        canvas.releasePointerCapture(e.pointerId);
    });
}