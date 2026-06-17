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
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      isDown: e.buttons > 0,
    };
  };

  canvas.addEventListener("pointerdown", (e) => handlers.down(pos(e)));
  canvas.addEventListener("pointermove", (e) => handlers.move(pos(e)));
  canvas.addEventListener("pointerup", (e) => handlers.up(pos(e)));
}
