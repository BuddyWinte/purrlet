export type UploadContext = {
  canvas: HTMLCanvasElement;
};

export type UploadConfig = {
  provider?: "imgbb" | "imgur";
  handler?: (blob: Blob, ctx: UploadContext) => Promise<string>;
  apiKey?: string;
  clientId?: string;
  beforeUpload?: (blob: Blob) => Promise<Blob> | Blob;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (err: any) => void;
};

import { uploadToImgbb } from "../providers/imgbb";
import { uploadToImgur } from "../providers/imgur";

export async function runUpload(
  canvas: HTMLCanvasElement,
  config?: UploadConfig
): Promise<string> {
  if (!config) {
    throw new Error("[Purrlet] Upload not configured");
  }
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) return reject(new Error("[Purrlet] Failed to create blob"));
      resolve(b);
    }, "image/png");
  });
  let finalBlob = blob;
  if (config.beforeUpload) {
    finalBlob = await config.beforeUpload(blob);
  }
  try {
    let url: string;
    if (config.handler) {
      url = await config.handler(finalBlob, { canvas });
    } else {
      url = await runProvider(config, finalBlob);
    }

    config.onUploadSuccess?.(url);
    return url;
  } catch (err) {
    config.onUploadError?.(err);
    throw err;
  }
}

async function runProvider(config: UploadConfig, blob: Blob): Promise<string> {
  switch (config.provider) {
    case "imgbb":
      if (!config.apiKey) {
        throw new Error("[Purrlet] Missing apiKey for imgbb");
      }
      return uploadToImgbb(blob, config.apiKey);

    case "imgur":
      if (!config.clientId && !config.apiKey) {
        throw new Error("[Purrlet] Missing clientId for imgur");
      }
      return uploadToImgur(blob, config.clientId || config.apiKey!);

    default:
      throw new Error(`[Purrlet] Unknown upload provider: ${config.provider}`);
  }
}