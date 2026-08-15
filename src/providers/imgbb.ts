 /**
  * Purrlet
  * A modern, easy-to-use, lightweight, headless canvas drawing engine for the web.
  *
  * Please read the CONTRIBUTING.md file before you contrbute.
  * @see https://api.imgbb.com/
  */

 import { UploadResult } from "./types";

export interface ImgbbOptions {
  /** Your ImgBB API key */
  apiKey: string;

  /** Auto-delete after this many seconds (60-15552000) */
  expiration?: number;

  /** Optional filename sent to ImgBB */
  name?: string;
}

interface ImgbbResponse {
  success: boolean;
  status: number;
  data: {
    url: string;
    delete_url: string;
  };
  error?: {
    message: string;
  };
}

export async function Imgbb(
  blob: Blob,
  options: ImgbbOptions,
): Promise<UploadResult> {
  const url = new URL("https://api.imgbb.com/1/upload");

  url.searchParams.set("key", options.apiKey);

  if (options.expiration !== undefined) {
    url.searchParams.set(
      "expiration",
      options.expiration.toString(),
    );
  }

  const form = new FormData();
  form.append(
    "image",
    blob,
    options.name ?? "purrlet.png",
  );

  const response = await fetch(url, {
    method: "POST",
    body: form,
  });

  const json = (await response.json()) as ImgbbResponse;

  if (!response.ok || !json.success) {
    throw new Error(
      json.error?.message ??
        `ImgBB upload failed (${response.status})`,
    );
  }

  return {
    url: json.data.url,
    deleteUrl: json.data.delete_url,
  };
}
