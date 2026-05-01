import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const toolsDir = path.join(rootDir, "src", "tools");
const toolsIndexPath = path.join(toolsDir, "index.ts");

const rawName = process.argv[2];

if (!rawName) {
  console.error('Usage: npm run tool:new -- <tool-name>');
  process.exit(1);
}

const toolName = toToolName(rawName);

if (!toolName) {
  console.error(`Invalid tool name: "${rawName}"`);
  process.exit(1);
}

const fileBaseName = toolName;
const filePath = path.join(toolsDir, `${fileBaseName}.ts`);
const exportName = `${toCamelCase(toolName)}Tool`;
const configName = `${toPascalCase(toolName)}ToolConfig`;

if (fs.existsSync(filePath)) {
  console.error(`Tool file already exists: src/tools/${fileBaseName}.ts`);
  process.exit(1);
}

const toolSource = createToolTemplate({
  toolName,
  exportName,
  configName,
});

fs.writeFileSync(filePath, toolSource);

const indexSource = fs.readFileSync(toolsIndexPath, "utf8");
const nextIndexSource = updateToolsIndex(indexSource, {
  toolName,
  exportName,
  fileBaseName,
});

fs.writeFileSync(toolsIndexPath, nextIndexSource);

console.log(`Created src/tools/${fileBaseName}.ts`);
console.log(`Registered "${toolName}" in src/tools/index.ts`);
console.log("Next steps:");
console.log(`1. Implement ${exportName}.create()`);
console.log(`2. Run npm run build`);
console.log(`3. Add docs or tests if needed`);

function toToolName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toCamelCase(value) {
  return value.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
}

function toPascalCase(value) {
  const camel = toCamelCase(value);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function createToolTemplate({ toolName, exportName, configName }) {
  return `import { defineTool } from "./defineTool";
import type { ToolInstance } from "./types";

type ${configName} = {
  color?: string;
  size?: number;
};

export const ${exportName} = defineTool({
  name: "${toolName}",

  create(config: ${configName} = {}): ToolInstance {
    return {
      onDown(p, { ctx }) {
        ctx.strokeStyle = config.color ?? "#000";
        ctx.lineWidth = config.size ?? 4;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
      },

      onMove(p, { ctx }) {
        if (!p.isDown) return;

        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      },

      onUp() {},
    };
  },
});
`;
}

function updateToolsIndex(source, { toolName, exportName, fileBaseName }) {
  const importLine = `import { ${exportName} } from "./${fileBaseName}";`;
  const registryLine = `  ${quoteIfNeeded(toolName)}: ${exportName},`;
  const exportLine = `  ${exportName},`;

  const nextImports = updateBlock(
    source,
    "// TOOL_IMPORTS_START",
    "// TOOL_IMPORTS_END",
    importLine,
    sortLines
  );

  const nextRegistry = updateBlock(
    nextImports,
    "  // TOOL_REGISTRY_START",
    "  // TOOL_REGISTRY_END",
    registryLine,
    sortRegistryLines
  );

  return updateBlock(
    nextRegistry,
    "  // TOOL_EXPORTS_START",
    "  // TOOL_EXPORTS_END",
    exportLine,
    sortLines
  );
}

function updateBlock(source, startMarker, endMarker, lineToAdd, sorter) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Could not find markers ${startMarker} / ${endMarker}`);
  }

  const blockStart = start + startMarker.length;
  const currentBlock = source.slice(blockStart, end);
  const lines = currentBlock
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (!lines.includes(lineToAdd)) {
    lines.push(lineToAdd);
  }

  const nextBlock = `\n${sorter(lines).join("\n")}\n`;

  return `${source.slice(0, blockStart)}${nextBlock}${source.slice(end)}`;
}

function sortLines(lines) {
  return [...lines].sort((a, b) => a.localeCompare(b));
}

function sortRegistryLines(lines) {
  return [...lines].sort((a, b) => {
    const aKey = a.trim().split(":")[0];
    const bKey = b.trim().split(":")[0];
    return aKey.localeCompare(bKey);
  });
}

function quoteIfNeeded(value) {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value) ? value : JSON.stringify(value);
}
