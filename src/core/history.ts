/**
 * Purrlet v2.0.0
 *
 * Please read the CONTRIBUTING.md file for our standards on code style and contribution. (such as JSDoc, TypeScript, etc. everywhere)
 * @author BuddyWinte
 * @since v0.9.0
 * @version v2.0.0
 */
"use strict";

import { Document } from "./document";
import type { DocStroke } from "../types";

type Command = {
  do: (doc: Document) => void;
  undo: (doc: Document) => void;
};

export class History {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  pushStroke(stroke: DocStroke) {
    const command: Command = {
      do: (doc) => {
        doc._addStroke?.(stroke);
      },
      undo: (doc) => {
        doc._removeStrokeById?.(stroke.id);
      }
    };

    this.undoStack.push(command);
    this.redoStack.length = 0;
  }

  pushClear(previous: DocStroke[]) {
    const snapshot = [...previous];

    const command: Command = {
      do: (doc) => {
        doc._clear?.();
      },
      undo: (doc) => {
        for (const s of snapshot) {
          doc._addStroke?.(s);
        }
      }
    };

    this.undoStack.push(command);
    this.redoStack.length = 0;
  }

  undo(doc: Document) {
    const cmd = this.undoStack.pop();
    if (!cmd) return false;

    cmd.undo(doc);
    this.redoStack.push(cmd);

    return true;
  }

  redo(doc: Document) {
    const cmd = this.redoStack.pop();
    if (!cmd) return false;

    cmd.do(doc);
    this.undoStack.push(cmd);

    return true;
  }

  clear() {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }
}
