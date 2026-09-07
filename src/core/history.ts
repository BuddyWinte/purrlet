"use strict";

import type { Document } from "./document";

export interface HistoryCommand {
  readonly execute: (document: Document) => void;
  readonly undo: (document: Document) => void;
}

export class History {
  private readonly undoStack: HistoryCommand[] = [];
  private readonly redoStack: HistoryCommand[] = [];

  execute(
    document: Document,
    command: HistoryCommand,
  ): void {
    command.execute(document);

    this.undoStack.push(command);
    this.redoStack.length = 0;
  }

  undo(document: Document): boolean {
    const command = this.undoStack.pop();

    if (command === undefined) {
      return false;
    }

    command.undo(document);
    this.redoStack.push(command);

    return true;
  }

  redo(document: Document): boolean {
    const command = this.redoStack.pop();

    if (command === undefined) {
      return false;
    }

    command.execute(document);
    this.undoStack.push(command);

    return true;
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get undoCount(): number {
    return this.undoStack.length;
  }

  get redoCount(): number {
    return this.redoStack.length;
  }
}
