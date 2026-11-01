"use strict";

import type { Tool, ToolInstance } from "../types";

export interface EyedropperConfig {
    readonly color?: string;
    // readonly size?: number;
    readonly pickedColor?: (hex: string) => void;
}

function rgbaToHex([r, g, b]: readonly [number, number, number, number]): string {
    const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
    
    return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export const eyedropperTool: Tool<EyedropperConfig> = {
    name: "eyedropper",

    create(config: Readonly<EyedropperConfig> = {}): ToolInstance<EyedropperConfig> {
        let color = config.color ?? "#000000";

        return {
            config,

            onPointerDown(pointer, renderer): void {
                const picked = renderer.getColor(pointer.x, pointer.y);
                if (!picked) return;

                color = rgbaToHex(picked);
                config.pickedColor?.(color);
            },

            // onPointerMove(pointer, renderer): void {
            // },
        }
    }
}