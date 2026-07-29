/**
 * Purrlet v2.0.0
 *
 * Please read the CONTRIBUTING.md file for our standards on code style and contribution. (such as JSDoc, TypeScript, etc. everywhere)
 * @author BuddyWinte
 * @since v0.9.0
 * @version v2.0.0
 */
"use strict";

export type ExportFormat =
    | "png"
    | "jpeg"
    | "webp";

export interface ExportOptions {
    format: ExportFormat;
    quality?: number;
    scale?: number;
    background?: string;
}

function formatToMime(format: ExportFormat) {
    switch (format) {
        case "jpeg":
            return "image/jpeg";

        case "webp":
            return "image/webp";

        case "png":
        default:
            return "image/png";
    }
}

export function canvasToBlob(
    canvas: HTMLCanvasElement,
    type = "image/png",
    quality?: number,
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            blob => {
                if (!blob) {
                    reject(new Error("[Purrlet] Failed to create blob"));
                    return;
                }
                resolve(blob);
            },
            type,
            quality
        );
    });
}

export function canvasToDataURL(
    canvas: HTMLCanvasElement,
    type = "image/png",
    quality?: number
) {
    return canvas.toDataURL(type, quality);
}

export async function exportCanvas(
    canvas: HTMLCanvasElement,
    options: ExportOptions
): Promise<Blob> {
    const {
        format,
        quality,
        scale = 1,
        background
    } = options;
    if (scale === 1 && !background) {
        return canvasToBlob(
            canvas,
            formatToMime(format),
            quality
        );
    }
    const temp = document.createElement("canvas");
    temp.width = canvas.width * scale;
    temp.height = canvas.height * scale;
    const ctx = temp.getContext("2d");
    if (!ctx) {
        throw new Error("[Purrlet] Export context unavailable");
    }
    if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(
            0,
            0,
            temp.width,
            temp.height
        );
    }
    ctx.drawImage(
        canvas,
        0,
        0,
        temp.width,
        temp.height
    );
    return canvasToBlob(
        temp,
        formatToMime(format),
        quality
    );
}
