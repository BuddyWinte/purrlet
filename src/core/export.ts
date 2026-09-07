"use strict";

export type ExportFormat = "png" | "jpeg" | "webp";

export interface ExportOptions {
  readonly format: ExportFormat;
  readonly quality?: number;
  readonly scale?: number;
  readonly background?: string;
}

const mimeTypes: Readonly<Record<ExportFormat, string>> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const normalizeQuality = (
  quality: number | undefined,
): number | undefined => {
  if (quality === undefined) {
    return undefined;
  }

  if (!Number.isFinite(quality)) {
    throw new RangeError(
      "[Purrlet] Export quality must be a finite number.",
    );
  }

  return Math.min(1, Math.max(0, quality));
};

const normalizeScale = (
  scale: number | undefined,
): number => {
  const value = scale ?? 1;

  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(
      "[Purrlet] Export scale must be a finite number greater than 0.",
    );
  }

  return value;
};

const canvasToBlobInternal = (
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> =>
  new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob: Blob | null) => {
          if (blob === null) {
            reject(
              new Error(
                "[Purrlet] Failed to create export blob.",
              ),
            );
            return;
          }

          resolve(blob);
        },
        type,
        quality,
      );
    } catch (error: unknown) {
      reject(
        error instanceof Error
          ? error
          : new Error("[Purrlet] Failed to create export blob."),
      );
    }
  });

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string = "image/png",
  quality?: number,
): Promise<Blob> {
  return canvasToBlobInternal(
    canvas,
    type,
    normalizeQuality(quality),
  );
}

export function canvasToDataURL(
  canvas: HTMLCanvasElement,
  type: string = "image/png",
  quality?: number,
): string {
  return canvas.toDataURL(
    type,
    normalizeQuality(quality),
  );
}

export async function exportCanvas(
  canvas: HTMLCanvasElement,
  options: Readonly<ExportOptions>,
): Promise<Blob> {
  const mimeType = mimeTypes[options.format];
  const scale = normalizeScale(options.scale);
  const quality = normalizeQuality(options.quality);

  if (
    scale === 1 &&
    options.background === undefined
  ) {
    return canvasToBlobInternal(
      canvas,
      mimeType,
      quality,
    );
  }

  const width = Math.max(
    1,
    Math.round(canvas.width * scale),
  );

  const height = Math.max(
    1,
    Math.round(canvas.height * scale),
  );

  const temporaryCanvas =
    document.createElement("canvas");

  temporaryCanvas.width = width;
  temporaryCanvas.height = height;

  const context = temporaryCanvas.getContext("2d", {
    alpha: options.background === undefined,
  });

  if (context === null) {
    throw new Error(
      "[Purrlet] Export rendering context unavailable.",
    );
  }

  if (options.background !== undefined) {
    context.fillStyle = options.background;
    context.fillRect(
      0,
      0,
      width,
      height,
    );
  }

  context.imageSmoothingEnabled = true;

  context.drawImage(
    canvas,
    0,
    0,
    width,
    height,
  );

  try {
    return await canvasToBlobInternal(
      temporaryCanvas,
      mimeType,
      quality,
    );
  } finally {
    temporaryCanvas.width = 1;
    temporaryCanvas.height = 1;
  }
}
