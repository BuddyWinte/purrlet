import { describe, expect, test } from "bun:test";
import { Document } from "../src/core/document";
import type {
  DocStroke,
  DocumentItem,
} from "../src/types";

const createStroke = (
  id: string,
): DocumentItem => {
  const stroke: DocStroke = {
    id,
    color: "#000000",
    opacity: 1,
    compositeOperation: "source-over",
    points: [
      {
        x: 10,
        y: 20,
        size: 5,
      },
    ],
  };

  return {
    type: "stroke",
    data: stroke,
  };
};

describe("Document", () => {
  test("starts empty", () => {
    const document = new Document();

    expect(document.size).toBe(0);
    expect(document.isEmpty).toBe(true);
    expect(document.isDrawing).toBe(false);
  });

  test("adds and retrieves items", () => {
    const document = new Document();
    const item = createStroke("stroke-1");

    document.add(item);

    expect(document.size).toBe(1);
    expect(document.isEmpty).toBe(false);
    expect(document.get("stroke-1")).toEqual(item);
  });

  test("removes items by id", () => {
    const document = new Document();
    const item = createStroke("stroke-1");

    document.add(item);

    expect(document.remove("stroke-1")).toBe(true);
    expect(document.size).toBe(0);
    expect(document.get("stroke-1")).toBeUndefined();
  });

  test("returns false when removing an unknown item", () => {
    const document = new Document();

    expect(document.remove("missing")).toBe(false);
  });

  test("clears all items", () => {
    const document = new Document();

    document.add(createStroke("stroke-1"));
    document.add(createStroke("stroke-2"));

    document.clear();

    expect(document.size).toBe(0);
    expect(document.isEmpty).toBe(true);
    expect(document.isDrawing).toBe(false);
  });

  test("begins a stroke", () => {
    const document = new Document();

    const stroke = document.beginStroke(
      "#ff0000",
      10,
      20,
      5,
      "draw",
    );

    expect(stroke.color).toBe("#ff0000");
    expect(stroke.opacity).toBe(1);
    expect(stroke.compositeOperation).toBe(
      "source-over",
    );
    expect(stroke.points).toHaveLength(1);

    expect(document.isDrawing).toBe(true);
    expect(document.size).toBe(1);
    expect(document.getCurrentStroke()).toEqual(
      stroke,
    );
  });

  test("begins an erasing stroke", () => {
    const document = new Document();

    const stroke = document.beginStroke(
      "#000000",
      10,
      20,
      5,
      "erase",
    );

    expect(stroke.compositeOperation).toBe(
      "destination-out",
    );
    expect(document.isDrawing).toBe(true);
  });

  test("adds points to the current stroke", () => {
    const document = new Document();

    document.beginStroke(
      "#000000",
      10,
      20,
      5,
      "draw",
    );

    expect(
      document.addPoint(
        20,
        30,
        10,
      ),
    ).toBe(true);

    const stroke =
      document.getCurrentStroke();

    expect(stroke).not.toBeUndefined();
    expect(stroke?.points).toHaveLength(2);

    expect(stroke?.points[0]).toEqual({
      x: 10,
      y: 20,
      size: 5,
    });

    expect(stroke?.points[1]).toEqual({
      x: 20,
      y: 30,
      size: 10,
    });

    expect(document.size).toBe(1);
  });

  test("cannot add a point without an active stroke", () => {
    const document = new Document();

    expect(
      document.addPoint(
        20,
        30,
        10,
      ),
    ).toBe(false);

    expect(document.size).toBe(0);
    expect(document.isDrawing).toBe(false);
  });

  test("ends the current stroke", () => {
    const document = new Document();

    const original =
      document.beginStroke(
        "#000000",
        10,
        20,
        5,
        "draw",
      );

    document.addPoint(
      20,
      30,
      10,
    );

    document.endStroke();

    expect(document.isDrawing).toBe(false);
    expect(document.size).toBe(1);
    expect(document.getCurrentStroke()).toBeUndefined();

    expect(
      document.get(original.id),
    ).toEqual({
      type: "stroke",
      data: {
        ...original,
        points: [
          {
            x: 10,
            y: 20,
            size: 5,
          },
          {
            x: 20,
            y: 30,
            size: 10,
          },
        ],
      },
    });
  });

  test("removing the current stroke clears drawing state", () => {
    const document = new Document();

    const stroke =
      document.beginStroke(
        "#000000",
        10,
        20,
        5,
        "draw",
      );

    expect(document.isDrawing).toBe(true);

    expect(
      document.remove(stroke.id),
    ).toBe(true);

    expect(document.isDrawing).toBe(false);
    expect(document.size).toBe(0);
    expect(document.getCurrentStroke()).toBeUndefined();
  });

  test("starts a new stroke by ending the previous stroke", () => {
    const document = new Document();

    const first =
      document.beginStroke(
        "#ff0000",
        10,
        20,
        5,
        "draw",
      );

    const second =
      document.beginStroke(
        "#0000ff",
        30,
        40,
        10,
        "draw",
      );

    expect(document.size).toBe(2);
    expect(document.get(first.id)).toBeDefined();
    expect(document.get(second.id)).toBeDefined();
    expect(document.getCurrentStroke()).toEqual(
      second,
    );
    expect(document.isDrawing).toBe(true);
  });

  test("clear removes the current stroke", () => {
    const document = new Document();

    document.beginStroke(
      "#000000",
      10,
      20,
      5,
      "draw",
    );

    document.clear();

    expect(document.size).toBe(0);
    expect(document.isEmpty).toBe(true);
    expect(document.isDrawing).toBe(false);
    expect(document.getCurrentStroke()).toBeUndefined();
  });

  test("getStrokes returns only stroke items", () => {
    const document = new Document();

    const stroke =
      createStroke("stroke-1");

    document.add(stroke);

    const fill: DocumentItem = {
      type: "fill",
      data: {
        id: "fill-1",
        x: 0,
        y: 0,
        color: "#ff0000",
        tolerance: 32,
      },
    };

    document.add(fill);

    const strokes =
      document.getStrokes();

    expect(strokes).toHaveLength(1);
    expect(strokes[0]).toEqual(
      stroke.data,
    );
  });

  test("getItems returns all document items", () => {
    const document = new Document();

    const stroke =
      createStroke("stroke-1");

    const fill: DocumentItem = {
      type: "fill",
      data: {
        id: "fill-1",
        x: 10,
        y: 10,
        color: "#00ff00",
        tolerance: 32,
      },
    };

    document.add(stroke);
    document.add(fill);

    expect(document.getItems()).toEqual([
      stroke,
      fill,
    ]);
  });
});
