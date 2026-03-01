"use strict";

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 300;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mergeSignals(primary, secondary) {
  if (!primary && !secondary) return null;
  if (!primary) return secondary;
  if (!secondary) return primary;

  const controller = new AbortController();
  const abort = () => controller.abort();

  if (primary.aborted || secondary.aborted) {
    abort();
    return controller.signal;
  }

  primary.addEventListener("abort", abort, { once: true });
  secondary.addEventListener("abort", abort, { once: true });
  return controller.signal;
}

function createTimeoutSignal(timeoutMs) {
  if (!timeoutMs || timeoutMs <= 0) return { signal: null, cancel: () => {} };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timeoutId),
  };
}

function isRetriableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

function toMessageFromBody(body) {
  if (!body) return "Unknown error";
  if (typeof body === "string") return body;
  if (body.error?.message) return body.error.message;
  if (body.error) return String(body.error);
  if (body.message) return String(body.message);
  return "Unknown error";
}

export async function fetchJson(url, options = {}) {
  const {
    method = "GET",
    headers,
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    signal,
    debug = false,
    operation = "request",
  } = options;

  let lastError = null;
  const maxAttempts = Math.max(1, Number(retries || 0) + 1);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const timeout = createTimeoutSignal(timeoutMs);
    const requestSignal = mergeSignals(signal, timeout.signal);

    try {
      const res = await fetch(url, {
        method,
        headers,
        body,
        signal: requestSignal || undefined,
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (_) {
        data = text;
      }

      if (res.ok) {
        timeout.cancel();
        return { res, data };
      }

      const message = toMessageFromBody(data);
      const error = new Error(`${operation} failed (${res.status}): ${message}`);
      error.status = res.status;
      error.response = data;
      throw error;
    } catch (error) {
      lastError = error;
      timeout.cancel();

      const aborted = error?.name === "AbortError";
      const shouldRetry =
        attempt < maxAttempts - 1 &&
        !aborted &&
        (typeof error?.status === "number" ? isRetriableStatus(error.status) : true);

      if (!shouldRetry) break;

      if (debug) {
        console.warn(`[Purrlet] ${operation} retry ${attempt + 1}/${maxAttempts - 1}`, error);
      }

      if (retryDelayMs > 0) {
        await sleep(retryDelayMs * (attempt + 1));
      }
    }
  }

  throw lastError || new Error(`${operation} failed`);
}
