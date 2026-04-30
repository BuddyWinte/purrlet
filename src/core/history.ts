// This function is incharge of the history keeper, .redo, .undo

export function createHistory(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let undoSnapshot: ImageData | null = null;
  let redoSnapshot: ImageData | null = null;

  function saveState() {
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoSnapshot = image;
    redoSnapshot = null;
  }
  function undo() {
    if (!undoSnapshot) return;
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    redoSnapshot = current;
    ctx.putImageData(undoSnapshot, 0, 0);
    undoSnapshot = null;
  }

  function redo() {
    if (!redoSnapshot) return;
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoSnapshot = current;
    ctx.putImageData(redoSnapshot, 0, 0);
    redoSnapshot = null;
  }

  return {
    saveState,
    undo,
    redo,
  };
}