"use strict";

import type { Tool, ToolInstance } from "../types";

export interface EyedropperConfig {
    readonly pickedColor?: (color: string) => void;
}

function rgbToHex([r, g, b]: readonly [number, number, number]): string {
    const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0');

    return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export const eyedropperTool: Tool<EyedropperConfig> = {
    name: "eyedropper",

    create(config: Readonly<EyedropperConfig> = {}): ToolInstance<EyedropperConfig> {
        return {
            config,

            onPointerDown(pointer, renderer): void {
                const picked = renderer.getRGBColor(pointer.x, pointer.y);
                
                if (!picked) {
                    return;
                }

                const color = rgbToHex(picked);
                config.pickedColor?.(color);
            }
        }
    }
}