/**
 * ImgBB upload provider.
 *
 * This provider is maintained for convenience and automatically uploads
 * files to ImgBB. It is not affiliated with or maintained by Purrlet.
 * For service-related issues, please contact ImgBB.
 *
 * Please review ImgBB's terms of service and privacy policy before use:
 * https://imgbb.com/tos | https://imgbb.com/privacy
 *
 * @see https://api.imgbb.com/
 */
import type { ProviderConfig, UploadProvider, UploadResult } from "./types";
import { createLogger } from "../logger";

export interface ImgBBOptions extends ProviderConfig {
    readonly apiKey: string;
    readonly name?: string;
}

export const ImgBB: UploadProvider<ImgBBOptions> = async (
    blob,
    options,
): Promise<UploadResult> => {
    const logger = createLogger("ImgBB", options?.debug === true);
    const filename = options?.name ?? "purrlet.png";

    if (!options?.apiKey) {
        logger.error("An API key is required");
        throw new Error("ImgBB API key is required");
    }

    logger.log("Starting upload", {
        filename,
        size: blob.size,
        type: blob.type,
    });

    const form = new FormData();

    form.append("image", blob, filename);

    logger.log("Request prepared", {
        endpoint: "https://api.imgbb.com/1/upload",
        method: "POST",
    });

    let response: Response;

    try {
        response = await fetch(
            `https://api.imgbb.com/1/upload?key=${encodeURIComponent(options.apiKey)}`,
            {
                method: "POST",
                body: form,
            },
        );
    } catch (error) {
        logger.error("Network request failed", error);

        const message = error instanceof Error ? error.message : String(error);

        const uploadError = new Error(
            `ImgBB upload request failed: ${message}`,
        );

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

        throw new Error(`ImgBB upload failed (${response.status})`);
    }

    if (
        typeof data !== "object" ||
        data === null ||
        !("success" in data) ||
        data.success !== true ||
        !("data" in data) ||
        typeof data.data !== "object" ||
        data.data === null ||
        !("url" in data.data) ||
        typeof data.data.url !== "string"
    ) {
        logger.error("Invalid upload response", data);

        throw new Error("ImgBB returned an invalid upload response");
    }

    const result: UploadResult = {
        url: data.data.url,
        ...("delete_url" in data.data &&
        typeof data.data.delete_url === "string"
            ? { deleteUrl: data.data.delete_url }
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
