import { replayCommands } from "./commands";
import type { DrawCommandSnapshot } from "./commands";
import type { ToolMap } from "../tools";

type SaveStrategy = "commands" | "blob" | "data-url";

type StorageConfig = {
  key: string;
  strategy?: SaveStrategy;
};

type LoadOptions = {
  tools: ToolMap;
  onCommandsLoaded?: (snapshot: DrawCommandSnapshot | null) => void;
};

type SaveOptions = {
  commands?: DrawCommandSnapshot;
};

const DB_NAME = "purrlet-storage";
const STORE_NAME = "canvas-saves";

// Incharge of storing and autosaving primarily
export function createStorage({ key, strategy = "commands" }: StorageConfig) {
  return {
    async save(canvas: HTMLCanvasElement, options: SaveOptions = {}) {
      try {
        if (strategy === "commands") {
          saveCommands(key, options.commands ?? { version: 1, commands: [] });
          return;
        }

        if (strategy === "blob") {
          const blob = await canvasToBlob(canvas);
          await saveBlob(key, blob);
          return;
        }

        const data = canvas.toDataURL("image/png");
        localStorage.setItem(getLegacyKey(key), data);
      } catch (err) {
        console.warn("[Purrlet] save failed", err);
      }
    },

    async load(
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      options: LoadOptions
    ) {
      try {
        if (strategy === "commands") {
          const snapshot = loadCommands(key);
          options.onCommandsLoaded?.(snapshot);

          if (!snapshot) return;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          replayCommands(ctx, options.tools, snapshot);
          return;
        }

        if (strategy === "blob") {
          const blob = await loadBlob(key);
          if (!blob) return;

          await drawBlobToCanvas(ctx, canvas, blob);
          return;
        }

        const data = localStorage.getItem(getLegacyKey(key));
        if (!data) return;

        await drawDataUrlToCanvas(ctx, canvas, data);
      } catch (err) {
        console.warn("[Purrlet] load failed", err);
      }
    },

    async clear() {
      localStorage.removeItem(getCommandsKey(key));
      localStorage.removeItem(getLegacyKey(key));
      await deleteBlob(key);
    },
  };
}

function getCommandsKey(key: string) {
  return `${key}:commands`;
}

function getLegacyKey(key: string) {
  return `${key}:data-url`;
}

function saveCommands(key: string, snapshot: DrawCommandSnapshot) {
  localStorage.setItem(getCommandsKey(key), JSON.stringify(snapshot));
}

function loadCommands(key: string): DrawCommandSnapshot | null {
  const raw = localStorage.getItem(getCommandsKey(key));

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as DrawCommandSnapshot;

    if (parsed?.version !== 1 || !Array.isArray(parsed.commands)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("[Purrlet] Failed to create blob"));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

async function drawBlobToCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  blob: Blob
) {
  const url = URL.createObjectURL(blob);

  try {
    await drawImageSourceToCanvas(ctx, canvas, url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function drawDataUrlToCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  dataUrl: string
) {
  return drawImageSourceToCanvas(ctx, canvas, dataUrl);
}

function drawImageSourceToCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  src: string
) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      resolve();
    };

    img.onerror = () => {
      reject(new Error("[Purrlet] Failed to load saved image"));
    };

    img.src = src;
  });
}

async function saveBlob(key: string, blob: Blob) {
  const db = await openStorageDb();
  await runRequest(db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(blob, key));
}

async function loadBlob(key: string) {
  const db = await openStorageDb();
  return (await runRequest(
    db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key)
  )) as Blob | undefined;
}

async function deleteBlob(key: string) {
  const db = await openStorageDb();
  await runRequest(
    db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(key)
  );
}

function openStorageDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("[Purrlet] Failed to open storage database"));
    };
  });
}

function runRequest(request: IDBRequest) {
  return new Promise<unknown>((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("[Purrlet] IndexedDB request failed"));
    };
  });
}
