export function bindPointer(
  canvas: HTMLCanvasElement,
  handlers: {
    down: (p: any) => void;
    move: (p: any) => void;
    up: (p: any) => void;
  }
) {
  const pos = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      isDown: e.buttons > 0,
    };
  };

  canvas.addEventListener("pointerdown", (e) => handlers.down(pos(e)));
  canvas.addEventListener("pointermove", (e) => handlers.move(pos(e)));
  canvas.addEventListener("pointerup", (e) => handlers.up(pos(e)));
}