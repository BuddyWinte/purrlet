export function createRenderer(ctx: CanvasRenderingContext2D, history: any) {
  let toolInstance: any;

  return {
    setTool(instance: any) {
      toolInstance = instance;
    },

    pointerHandlers() {
      return {
        down(p: any) {
          toolInstance?.onDown(p, { ctx });
        },

        move(p: any) {
          toolInstance?.onMove(p, { ctx });
        },

        up(p: any) {
          toolInstance?.onUp(p, { ctx });
          history.saveState();
        },
      };
    },
  };
}