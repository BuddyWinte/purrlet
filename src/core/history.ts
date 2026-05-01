/**
 * Undo/redo history manager using a circular buffer.
 *
 * Stores `ImageData` snapshots in a pre-allocated ring buffer of
 * size `maxHistory`. This design avoids repeated array resizing and
 * garbage-collection pressure that a push/shift approach would cause.
 *
 * **Key invariant:** `entries` tracks the total number of states ever
 * saved (monotonically increasing until the buffer wraps). `cursor`
 * is the current logical position. The physical buffer index is always
 * `cursor % maxHistory`.
 *
 * When `cursor` is rewound and a new state is saved, all "redo"
 * states ahead of the cursor are discarded (`entries = cursor + 1`).
 *
 * Optionally emits `"historyChange"` events via the supplied emitter
 * so the UI can update undo/redo button states.
 *
 * @module core/history
 * @since 0.1.0
 */

"use strict";

/**
 * Creates a new history manager for the given canvas context.
 *
 * @param canvas    — The canvas element to snapshot.
 * @param ctx       — The 2D rendering context associated with the canvas.
 * @param maxHistory — Maximum number of undo states to retain (default `50`).
 * @param emitter   — Optional event emitter; fires `"historyChange"` with
 *                    `{ undo: number, redo: number }` on every state change.
 * @returns An object with undo/redo controls and state queries.
 *
 * @since 0.1.0
 */
export function createHistory(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  maxHistory: number = 50,
  emitter?: { emit: (event: string, ...args: any[]) => void }
) {
  // Circular buffer: pre-allocate maxHistory ImageData slots.
  // Logical positions map to buffer via: index = pos % maxHistory
  const buffer: (ImageData | null)[] = new Array(maxHistory).fill(null);

  /** Total number of states ever saved (monotonically grows). */
  let entries = 0;  // Total number of states ever saved
  /**
   * Current logical position in the history timeline.
   * `-1` means no history has been recorded yet.
   */
  let cursor = -1;  // Current logical position (-1 = no history yet)

  /**
   * Compute the earliest still-accessible logical position.
   * Older entries have been overwritten by the circular buffer.
   */
  function firstAccessible(): number {
    return Math.max(0, entries - maxHistory);
  }

  /**
   * Capture the current canvas state and push it onto the history stack.
   *
   * Any states ahead of the cursor (redo stack) are discarded, so
   * calling `saveState` after `undo` always starts a new branch.
   */
  function saveState(): void {
    cursor++;
    entries = cursor + 1; // Discard any redo states ahead of cursor

    buffer[cursor % maxHistory] = ctx.getImageData(0, 0, canvas.width, canvas.height);

    emitter?.emit("historyChange", {
      undo: getUndoCount(),
      redo: getRedoCount(),
    });
  }

  /**
   * Move the cursor back one step and restore that canvas state.
   * No-op if {@link canUndo} returns `false`.
   */
  function undo(): void {
    if (!canUndo()) return;
    cursor--;
    const state = buffer[cursor % maxHistory];
    if (state) {
      ctx.putImageData(state, 0, 0);
    }
    emitter?.emit("historyChange", {
      undo: getUndoCount(),
      redo: getRedoCount(),
    });
  }

  /**
   * Move the cursor forward one step and restore that canvas state.
   * No-op if {@link canRedo} returns `false`.
   */
  function redo(): void {
    if (!canRedo()) return;
    cursor++;
    const state = buffer[cursor % maxHistory];
    if (state) {
      ctx.putImageData(state, 0, 0);
    }
    emitter?.emit("historyChange", {
      undo: getUndoCount(),
      redo: getRedoCount(),
    });
  }

  /**
   * @returns `true` if there is at least one state to undo to.
   */
  function canUndo(): boolean {
    return cursor > firstAccessible();
  }

  /**
   * @returns `true` if there is at least one state to redo to.
   */
  function canRedo(): boolean {
    return cursor < entries - 1;
  }

  /**
   * @returns The number of available undo steps.
   */
  function getUndoCount(): number {
    return cursor - firstAccessible();
  }

  /**
   * @returns The number of available redo steps.
   */
  function getRedoCount(): number {
    return entries - 1 - cursor;
  }

  /**
   * Reset the history buffer, discarding all saved states.
   * Called during {@link Purrlet.destroy}.
   */
  function clear(): void {
    for (let i = 0; i < maxHistory; i++) {
      buffer[i] = null;
    }
    entries = 0;
    cursor = -1;
  }

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    getUndoCount,
    getRedoCount,
    clear,
  };
}
