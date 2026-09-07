/**
 * Catbox Provider
 *
 * @see https://catbox.moe/tools.php
 */
import { UploadResult } from "./types";

export interface CatboxOptions {
  /** Catbox user hash for logged in uploads*/
  userHash?: string;

  /** Optional filename sent to Catbox */
  name?: string;
}

export async function Catbox(
  blob: Blob,
  options: CatboxOptions = {},
): Promise<UploadResult> {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", blob, options.name ?? "purrlet.png");
  if (options.userHash) {
    form.append("userhash", options.userHash);
  }
  const response = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: form,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Catbox upload failed (${response.status})`);
  }
  if (!text.startsWith("https://")) {
    throw new Error(text);
  }
  return {
    url: text.trim(),
  };
}
