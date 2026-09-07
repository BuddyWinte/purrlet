/**
 * Catbox upload provider.
 *
 * This provider is maintained for convenience and automatically uploads
 * files to Catbox. It is not affiliated with or maintained by Purrlet.
 * For service-related issues, please contact Catbox.
 *
 * Please review Catbox's terms of service and privacy policy before use:
 * https://catbox.moe/legal.php
 *
 * @see https://catbox.moe/tools.php
 */
"use strict";
import type { ProviderConfig, UploadProvider, UploadResult } from "./types";
import { createLogger } from "../logger";

export interface CatboxOptions extends ProviderConfig {
    readonly userHash?: string;
    readonly name?: string;
}

export const Catbox: UploadProvider<CatboxOptions> = async (
    blob,
    options = {},
): Promise<UploadResult> => {
    const logger = createLogger("Catbox", options.debug === true);
    const filename = options.name ?? "purrlet.png";

    logger.log("Starting upload", {
        filename,
        size: blob.size,
        type: blob.type,
        authenticated: Boolean(options.userHash),
    });

    const form = new FormData();

    form.append("reqtype", "fileupload");
    form.append("fileToUpload", blob, filename);

    if (options.userHash) {
        logger.log("Using authenticated upload");
        form.append("userhash", options.userHash);
    }

    logger.log("Sending upload request");

    let response: Response;

    try {
        response = await fetch("https://catbox.moe/user/api.php", {
            method: "POST",
            body: form,
        });
    } catch (error) {
        logger.error("Network request failed", error);

        const message = error instanceof Error ? error.message : String(error);

        const uploadError = new Error(
            `Catbox upload request failed: ${message}`,
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

    const text = await response.text();

    logger.log("Response body received", {
        length: text.length,
        body: text,
    });

    if (!response.ok) {
        logger.error("Upload failed", {
            status: response.status,
            response: text,
        });

        throw new Error(`Catbox upload failed (${response.status}): ${text}`);
    }

    const url = text.trim();

    if (!url.startsWith("https://")) {
        logger.error("Invalid upload response", {
            response: text,
            parsedUrl: url,
        });

        throw new Error(`Catbox returned an invalid URL: ${url}`);
    }

    logger.log("Upload successful", {
        url,
        filename,
        size: blob.size,
    });

    return { url };
};
