"use strict";

import type { PurrletPointer, PointerType } from "../types";

export interface PointerHandlers {
  readonly down: (
    pointer: PurrletPointer,
    event: PointerEvent,
  ) => void;

  readonly move: (
    pointer: PurrletPointer,
    event: PointerEvent,
  ) => void;

  readonly up: (
    pointer: PurrletPointer,
    event: PointerEvent,
  ) => void;

  readonly cancel?: (
    pointer: PurrletPointer,
    event: PointerEvent,
  ) => void;
}

const pointerTypes  : readonly PointerType[] = [
  "mouse",
  "pen",
  "touch",
];

const isPointerType = (
  value: string,
): value is PointerType =>
  pointerTypes.includes(value as PointerType);

const normalizePressure = (
  pressure: number,
): number => {
  if (!Number.isFinite(pressure)) {
    return 0;
  }

  return Math.min(1, Math.max(0, pressure));
};

const normalizeTilt = (
  tilt: number,
): number => {
  if (!Number.isFinite(tilt)) {
    return 0;
  }

  return Math.max(-90, Math.min(90, tilt));
};

export function bindPointer(
  canvas: HTMLCanvasElement,
  handlers: PointerHandlers,
): () => void {
  const getPoint = (
    event: PointerEvent,
  ): PurrletPointer => {
    const rect = canvas.getBoundingClientRect();

    const scaleX =
      rect.width > 0
        ? canvas.clientWidth / rect.width
        : 1;

    const scaleY =
      rect.height > 0
        ? canvas.clientHeight / rect.height
        : 1;

    const pointerType = isPointerType(event.pointerType)
      ? event.pointerType
      : "mouse";

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
      pressure: normalizePressure(event.pressure),
      tiltX: normalizeTilt(event.tiltX),
      tiltY: normalizeTilt(event.tiltY),
      pointerType,
      pointerId: event.pointerId,
      isDown: event.buttons !== 0,
    };
  };

  const handlePointerDown = (
    event: PointerEvent,
  ): void => {
    if (event.isPrimary === false) {
      return;
    }

    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // pointe capture is not guaranteed to be available.
    }

    handlers.down(
      getPoint(event),
      event,
    );
  };

  const handlePointerMove = (
    event: PointerEvent,
  ): void => {
    handlers.move(
      getPoint(event),
      event,
    );
  };

  const handlePointerUp = (
    event: PointerEvent,
  ): void => {
    handlers.up(
      getPoint(event),
      event,
    );

    if (
      canvas.hasPointerCapture(event.pointerId)
    ) {
      canvas.releasePointerCapture(
        event.pointerId,
      );
    }
  };

  const handlePointerCancel = (
    event: PointerEvent,
  ): void => {
    handlers.cancel?.(
      getPoint(event),
      event,
    );

    if (
      canvas.hasPointerCapture(event.pointerId)
    ) {
      canvas.releasePointerCapture(
        event.pointerId,
      );
    }
  };

  const handleLostPointerCapture = (
    event: PointerEvent,
  ): void => {
    handlers.cancel?.(
      getPoint(event),
      event,
    );
  };

  canvas.addEventListener(
    "pointerdown",
    handlePointerDown,
  );

  canvas.addEventListener(
    "pointermove",
    handlePointerMove,
  );

  canvas.addEventListener(
    "pointerup",
    handlePointerUp,
  );

  canvas.addEventListener(
    "pointercancel",
    handlePointerCancel,
  );

  canvas.addEventListener(
    "lostpointercapture",
    handleLostPointerCapture,
  );

  return (): void => {
    canvas.removeEventListener(
      "pointerdown",
      handlePointerDown,
    );

    canvas.removeEventListener(
      "pointermove",
      handlePointerMove,
    );

    canvas.removeEventListener(
      "pointerup",
      handlePointerUp,
    );

    canvas.removeEventListener(
      "pointercancel",
      handlePointerCancel,
    );

    canvas.removeEventListener(
      "lostpointercapture",
      handleLostPointerCapture,
    );
  };
}
