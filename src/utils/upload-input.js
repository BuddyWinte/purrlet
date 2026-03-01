"use strict";

const DEFAULT_FILENAME = "upload.bin";
const DEFAULT_MIME = "application/octet-stream";

function getFilename(pathLike) {
  const parts = String(pathLike).split(/[\\/]/);
  return parts[parts.length - 1] || DEFAULT_FILENAME;
}

function isNodeRuntime() {
  return typeof process !== "undefined" && Boolean(process.versions?.node);
}

function isFile(value) {
  return typeof File !== "undefined" && value instanceof File;
}

function isBlob(value) {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function isBuffer(value) {
  return typeof Buffer !== "undefined" && Buffer.isBuffer(value);
}

function toBlob(value, type) {
  if (typeof Blob === "undefined") {
    throw new Error("Blob is not available in this runtime");
  }
  return new Blob([value], { type: type || DEFAULT_MIME });
}

function isNormalizedInput(value) {
  return (
    value &&
    typeof value === "object" &&
    (isBlob(value.value) || isFile(value.value)) &&
    typeof value.filename === "string"
  );
}

/**
 * Normalizes browser and backend file-like values to a Blob/File for FormData.
 * Supports File, Blob, Buffer, Uint8Array, ArrayBuffer, { buffer, filename, type }, { path, filename, type }, and string file paths (Node only).
 * @param {*} input
 * @returns {Promise<{ value: Blob|File, filename: string }>}
 */
export async function normalizeUploadInput(input) {
  if (isNormalizedInput(input)) {
    return input;
  }

  if (isFile(input)) {
    return { value: input, filename: input.name || DEFAULT_FILENAME };
  }

  if (isBlob(input)) {
    return { value: input, filename: DEFAULT_FILENAME };
  }

  if (isBuffer(input) || input instanceof Uint8Array) {
    return { value: toBlob(input), filename: DEFAULT_FILENAME };
  }

  if (input instanceof ArrayBuffer) {
    return { value: toBlob(new Uint8Array(input)), filename: DEFAULT_FILENAME };
  }

  if (input && typeof input === "object" && (isBuffer(input.buffer) || input.buffer instanceof Uint8Array || input.buffer instanceof ArrayBuffer)) {
    const bytes = input.buffer instanceof ArrayBuffer ? new Uint8Array(input.buffer) : input.buffer;
    return {
      value: toBlob(bytes, input.type),
      filename: input.filename || DEFAULT_FILENAME,
    };
  }

  if (input && typeof input === "object" && typeof input.path === "string") {
    if (!isNodeRuntime()) {
      throw new Error("Path-based uploads are only supported in Node.js");
    }
    const { readFile } = await import("node:fs/promises");
    const bytes = await readFile(input.path);
    return {
      value: toBlob(bytes, input.type),
      filename: input.filename || getFilename(input.path),
    };
  }

  if (typeof input === "string") {
    if (!isNodeRuntime()) {
      throw new Error("String uploads are only supported as file paths in Node.js");
    }
    const { readFile } = await import("node:fs/promises");
    const bytes = await readFile(input);
    return { value: toBlob(bytes), filename: getFilename(input) };
  }

  throw new Error(
    "Unsupported upload input. Use File, Blob, Buffer, Uint8Array, ArrayBuffer, { buffer }, { path }, or a Node.js file path string.",
  );
}
