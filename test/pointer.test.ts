import { describe, expect, test } from "bun:test";
import { bindPointer } from "../src/core/pointer";

describe("bindPointer", () => {
  test("converts client coordinates to canvas coordinates", () => {
    const events = new Map<string, EventListener>();

    const canvas = {
      getBoundingClientRect() {
        return {
          left: 100,
          top: 200,
          width: 500,
          height: 300,
        };
      },

      addEventListener(
        type: string,
        listener: EventListener,
      ) {
        events.set(type, listener);
      },

      setPointerCapture() {},
      releasePointerCapture() {},
    } as unknown as HTMLCanvasElement;

    const points: Array<{
      x: number;
      y: number;
      pressure: number;
      pointerType: string;
      pointerId: number;
      isDown: boolean;
    }> = [];

    bindPointer(canvas, {
      down(point) {
        points.push(point);
      },

      move() {},

      up() {},
    });

    const event = {
      type: "pointerdown",
      clientX: 350,
      clientY: 425,
      pressure: 0.75,
      tiltX: 10,
      tiltY: 20,
      pointerType: "pen",
      pointerId: 42,
      buttons: 1,
    } as unknown as PointerEvent;

    events.get("pointerdown")!(event);

    expect(points).toHaveLength(1);
    expect(points[0]).toEqual({
      x: 250,
      y: 225,
      pressure: 0.75,
      pointerType: "pen",
      pointerId: 42,
      tiltX: 10,
      tiltY: 20,
      isDown: true,
    });
  });

  test("uses pointer buttons to determine isDown", () => {
    const events = new Map<string, EventListener>();
    const points: boolean[] = [];

    const canvas = {
      getBoundingClientRect() {
        return {
          left: 0,
          top: 0,
          width: 100,
          height: 100,
        };
      },

      addEventListener(
        type: string,
        listener: EventListener,
      ) {
        events.set(type, listener);
      },

      setPointerCapture() {},
      releasePointerCapture() {},
    } as unknown as HTMLCanvasElement;

    bindPointer(canvas, {
      down(point) {
        points.push(point.isDown);
      },

      move() {},
      up() {},
    });

    events.get("pointerdown")!(
      {
        type: "pointerdown",
        clientX: 10,
        clientY: 10,
        buttons: 1,
        pointerId: 1,
        pointerType: "mouse",
        pressure: 0.5,
      } as unknown as PointerEvent,
    );

    events.get("pointerdown")!(
      {
        type: "pointerdown",
        clientX: 10,
        clientY: 10,
        buttons: 0,
        pointerId: 2,
        pointerType: "mouse",
        pressure: 0,
      } as unknown as PointerEvent,
    );

    expect(points).toEqual([true, false]);
  });
});
