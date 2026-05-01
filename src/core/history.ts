// This function is incharge of the history keeper, .redo, .undo

export function createHistory(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let undoSnapshots: ImageData[] = [];
  let redoSnapshots: ImageData[] = [];

  function saveState() {
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoSnapshots.push(image);
    redoSnapshots = [];
  }
  function undo() {
    if (undoSnapshots.length === 0) return;
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    redoSnapshots.push(current);
    const prev = undoSnapshots.pop()!;
    ctx.putImageData(prev, 0, 0);
  }

  function redo() {
    if (redoSnapshots.length === 0) return;
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoSnapshots.push(current);
    const next = redoSnapshots.pop()!;
    ctx.putImageData(next, 0, 0);
  }

  return {
    saveState,
    undo,
    redo,
  };
}