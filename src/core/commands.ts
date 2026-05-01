import type { Pointer, ToolMap } from "../tools";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

export type DrawCommand = {
  tool: string;
  config: JsonValue;
  points: Pointer[];
};

export type DrawCommandSnapshot = {
  version: 1;
  commands: DrawCommand[];
};

export function createCommandRecorder(maxCommands = 500) {
  let commands: DrawCommand[] = [];

  return {
    record(command: DrawCommand) {
      commands.push(command);

      if (commands.length > maxCommands) {
        commands = commands.slice(commands.length - maxCommands);
      }
    },

    snapshot(): DrawCommandSnapshot {
      return {
        version: 1,
        commands: cloneCommands(commands),
      };
    },

    replace(snapshot?: DrawCommandSnapshot | null) {
      commands = cloneCommands(snapshot?.commands ?? []);
    },

    clear() {
      commands = [];
    },
  };
}

export function replayCommands(
  ctx: CanvasRenderingContext2D,
  tools: ToolMap,
  snapshot?: DrawCommandSnapshot | null
) {
  if (!snapshot) return;

  for (const command of snapshot.commands) {
    const tool = tools[command.tool];

    if (!tool || tool.modifiesCanvas === false) {
      continue;
    }

    const points = command.points;

    if (points.length === 0) {
      continue;
    }

    const instance = tool.create(cloneJsonValue(command.config));
    const [firstPoint, ...restPoints] = points;
    const endPoint = restPoints[restPoints.length - 1] ?? firstPoint;

    instance.onDown(firstPoint, { ctx });

    for (const point of restPoints.slice(0, -1)) {
      instance.onMove(point, { ctx });
    }

    if (restPoints.length > 0) {
      instance.onMove(endPoint, { ctx });
    }

    instance.onUp(endPoint, { ctx });
  }
}

export function sanitizeConfig(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeConfig(item));
  }

  if (typeof value === "object") {
    const result: Record<string, JsonValue> = {};

    for (const [key, item] of Object.entries(value)) {
      if (item === undefined || typeof item === "function") {
        continue;
      }

      result[key] = sanitizeConfig(item);
    }

    return result;
  }

  return null;
}

export function clonePointer(point: Pointer): Pointer {
  return {
    x: point.x,
    y: point.y,
    isDown: point.isDown,
  };
}

function cloneCommands(commands: DrawCommand[]) {
  return commands.map((command) => ({
    tool: command.tool,
    config: cloneJsonValue(command.config),
    points: command.points.map((point) => clonePointer(point)),
  }));
}

function cloneJsonValue(value: JsonValue): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => cloneJsonValue(item));
  }

  const result: Record<string, JsonValue> = {};

  for (const [key, item] of Object.entries(value)) {
    result[key] = cloneJsonValue(item);
  }

  return result;
}
