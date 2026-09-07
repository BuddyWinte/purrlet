import { describe, expect, test } from "bun:test";
import { Document } from "../src/core/document";
import {
  History,
  type HistoryCommand,
} from "../src/core/history";
import type { DocumentItem } from "../src/types";

const createStroke = (
  id: string,
): DocumentItem => ({
  type: "stroke",
  data: {
    id,
    color: "#000000",
    opacity: 1,
    compositeOperation: "source-over",
    points: [
      {
        x: 10,
        y: 10,
        size: 5,
      },
    ],
  },
});

const createAddCommand = (
  item: DocumentItem,
): HistoryCommand => ({
  execute: (document) => {
    document.add(item);
  },

  undo: (document) => {
    document.remove(item.data.id);
  },
});

describe("History", () => {
  test("starts empty", () => {
    const history = new History();

    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.undoCount).toBe(0);
    expect(history.redoCount).toBe(0);
  });

  test("executes a command", () => {
    const document = new Document();
    const history = new History();
    const item = createStroke("stroke-1");

    history.execute(
      document,
      createAddCommand(item),
    );

    expect(document.size).toBe(1);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
    expect(history.undoCount).toBe(1);
  });

  test("undo removes the command", () => {
    const document = new Document();
    const history = new History();
    const item = createStroke("stroke-1");

    history.execute(
      document,
      createAddCommand(item),
    );

    expect(history.undo(document)).toBe(true);

    expect(document.size).toBe(0);
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
    expect(history.redoCount).toBe(1);
  });

  test("redo restores an undone command", () => {
    const document = new Document();
    const history = new History();
    const item = createStroke("stroke-1");

    history.execute(
      document,
      createAddCommand(item),
    );

    history.undo(document);

    expect(history.redo(document)).toBe(true);

    expect(document.size).toBe(1);
    expect(document.get("stroke-1")).toEqual(item);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  test("new commands clear redo history", () => {
    const document = new Document();
    const history = new History();

    const first = createStroke("stroke-1");
    const second = createStroke("stroke-2");

    history.execute(
      document,
      createAddCommand(first),
    );

    history.undo(document);

    expect(history.canRedo()).toBe(true);

    history.execute(
      document,
      createAddCommand(second),
    );

    expect(history.canRedo()).toBe(false);
    expect(history.undoCount).toBe(1);
    expect(document.size).toBe(1);
  });

  test("multiple commands undo in reverse order", () => {
    const document = new Document();
    const history = new History();

    const first = createStroke("stroke-1");
    const second = createStroke("stroke-2");
    const third = createStroke("stroke-3");

    history.execute(
      document,
      createAddCommand(first),
    );

    history.execute(
      document,
      createAddCommand(second),
    );

    history.execute(
      document,
      createAddCommand(third),
    );

    expect(document.size).toBe(3);

    history.undo(document);
    expect(document.size).toBe(2);
    expect(document.get("stroke-3")).toBeUndefined();

    history.undo(document);
    expect(document.size).toBe(1);
    expect(document.get("stroke-2")).toBeUndefined();

    history.undo(document);
    expect(document.size).toBe(0);
    expect(document.get("stroke-1")).toBeUndefined();
  });

  test("undo returns false when there is nothing to undo", () => {
    const document = new Document();
    const history = new History();

    expect(history.undo(document)).toBe(false);
  });

  test("redo returns false when there is nothing to redo", () => {
    const document = new Document();
    const history = new History();

    expect(history.redo(document)).toBe(false);
  });

  test("clear removes all history", () => {
    const document = new Document();
    const history = new History();

    history.execute(
      document,
      createAddCommand(
        createStroke("stroke-1"),
      ),
    );

    history.undo(document);

    history.clear();

    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.undoCount).toBe(0);
    expect(history.redoCount).toBe(0);
  });
});
