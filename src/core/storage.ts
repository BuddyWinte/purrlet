// Incharge of storing and autosaving primarily
export function createStorage(key: string) {
  return {
    save(canvas: HTMLCanvasElement) {
      try {
        const data = canvas.toDataURL("image/png");
        localStorage.setItem(key, data);
      } catch (err) {
        console.warn("[Purrlet] save failed", err);
      }
    },
    load(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
      const data = localStorage.getItem(key);
      if (!data) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };

      img.src = data;
    },
    clear() {
      localStorage.removeItem(key);
    },
  };
}