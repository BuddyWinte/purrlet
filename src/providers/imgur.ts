/**
 * Imgur upload provider.
 *
 * This provider is maintained for convenience and automatically uploads
 * files to Imgur. It is not affiliated with or maintained by Purrlet.
 * For service-related issues, please contact Imgur.
 *
 * Please review Imgur's terms of service and privacy policy before use:
 * https://imgur.com/tos | https://imgur.com/privacy
 *
 * @see https://apidocs.imgur.com/
 */
import type { ProviderConfig, UploadProvider, UploadResult } from "./types";
import { createLogger } from "../logger";

export interface ImgurOptions extends ProviderConfig {
  readonly clientId: string;
  readonly name?: string;
}

export const Imgur: UploadProvider<ImgurOptions> = async (
  blob,
  options,
): Promise<UploadResult> => {
  const logger = createLogger("Imgur", options?.debug === true);
  const filename = options?.name ?? "purrlet.png";

  if (!options?.clientId) {
    logger.error("A Client-ID is required");

    throw new Error("Imgur Client-ID is required");
  }

  logger.log("Starting upload", {
    filename,
    size: blob.size,
    type: blob.type,
  });

  const form = new FormData();

  form.append("image", blob, filename);

  logger.log("Request prepared", {
    endpoint: "https://api.imgur.com/3/image",
    method: "POST",
    authentication: "Client-ID",
  });

  let response: Response;

  try {
    response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${options.clientId}`,
      },
      body: form,
    });
  } catch (error) {
    logger.error("Network request failed", error);

    const message = error instanceof Error ? error.message : String(error);

    const uploadError = new Error(`Imgur upload request failed: ${message}`);

    Object.defineProperty(uploadError, "cause", {
      value: error,
      enumerable: false,
      configurable: true,
    });

    throw uploadError;
  }

  logger.log("Response received", {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    redirected: response.redirected,
    url: response.url,
  });

  const data: unknown = await response.json();

  logger.log("Response body received", data);

  if (!response.ok) {
    logger.error("Upload failed", {
      status: response.status,
      response: data,
    });

    throw new Error(`Imgur upload failed (${response.status})`);
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("success" in data) ||
    data.success !== true ||
    !("data" in data) ||
    typeof data.data !== "object" ||
    data.data === null ||
    !("link" in data.data) ||
    typeof data.data.link !== "string"
  ) {
    logger.error("Invalid upload response", data);

    throw new Error("Imgur returned an invalid upload response");
  }

  const result: UploadResult = {
    url: data.data.link,
    ...("deletehash" in data.data && typeof data.data.deletehash === "string"
      ? {
          deleteUrl: `https://api.imgur.com/3/image/${data.data.deletehash}`,
        }
      : {}),
  };

  logger.log("Upload successful", {
    url: result.url,
    filename,
    size: blob.size,
    hasDeleteUrl: Boolean(result.deleteUrl),
  });

  return result;
};
