type RgbaColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

let colorParserContext: CanvasRenderingContext2D | null = null;

export function parseCssColor(color: string): RgbaColor {
  const ctx = getColorParserContext();
  const previousFill = ctx.fillStyle;

  ctx.fillStyle = "#000";
  ctx.fillStyle = color;

  const normalized = ctx.fillStyle;
  ctx.fillStyle = previousFill;

  if (typeof normalized !== "string") {
    throw new Error(`[Purrlet] Unable to parse color: ${color}`);
  }

  if (normalized.startsWith("#")) {
    return parseHexColor(normalized);
  }

  const rgbaMatch = normalized.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/
  );

  if (!rgbaMatch) {
    throw new Error(`[Purrlet] Unsupported color format: ${normalized}`);
  }

  return {
    r: Number(rgbaMatch[1]),
    g: Number(rgbaMatch[2]),
    b: Number(rgbaMatch[3]),
    a: rgbaMatch[4] ? Math.round(Number(rgbaMatch[4]) * 255) : 255,
  };
}

export function toHexColor({ r, g, b }: RgbaColor): string {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function toRgbaString({ r, g, b, a }: RgbaColor): string {
  return `rgba(${r}, ${g}, ${b}, ${roundAlpha(a)})`;
}

function getColorParserContext() {
  if (colorParserContext) return colorParserContext;

  if (typeof document === "undefined") {
    throw new Error("[Purrlet] Document is not available. Cannot parse color in SSR environment.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("[Purrlet] 2D context not available");
  }

  colorParserContext = ctx;
  return colorParserContext;
}

function parseHexColor(hex: string): RgbaColor {
  const value = hex.slice(1);

  if (value.length === 3) {
    return {
      r: parseInt(value[0] + value[0], 16),
      g: parseInt(value[1] + value[1], 16),
      b: parseInt(value[2] + value[2], 16),
      a: 255,
    };
  }

  if (value.length === 4) {
    return {
      r: parseInt(value[0] + value[0], 16),
      g: parseInt(value[1] + value[1], 16),
      b: parseInt(value[2] + value[2], 16),
      a: parseInt(value[3] + value[3], 16),
    };
  }

  if (value.length === 6) {
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
      a: 255,
    };
  }

  if (value.length === 8) {
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
      a: parseInt(value.slice(6, 8), 16),
    };
  }

  throw new Error(`[Purrlet] Unsupported hex color: ${hex}`);
}

function toHex(value: number) {
  return Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
}

function roundAlpha(alpha: number) {
  return Math.round((alpha / 255) * 1000) / 1000;
}
