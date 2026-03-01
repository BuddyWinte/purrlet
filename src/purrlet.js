"use strict";

/*!
 * Purrlet v0.0.9
 *
 * A lightweight and modern replacement for drawboxes.
 * Released under the MIT License
 * Created by BuddyWinte & awesome contributors
 * GitHub: https://github.com/BuddyWinte/Purrlet
 */

import ImgbbProvider from "./providers/imgbb.js";
import ImgurProvider from "./providers/imgur.js";
import CloudinaryProvider from "./providers/cloudinary.js";
import LocalhostProvider from "./providers/localhost.js";
import { normalizeUploadInput } from "./utils/upload-input.js";

const ProviderRegistry = new Map();
ProviderRegistry.set("localhost", LocalhostProvider);
ProviderRegistry.set("imgbb", ImgbbProvider);
ProviderRegistry.set("imgur", ImgurProvider);
ProviderRegistry.set("cloudinary", CloudinaryProvider);

const DEFAULT_CONFIG = {
  provider: "localhost",
  apiKey: null,
  debug: false,
  requestTimeoutMs: 15000,
  retries: 1,
  retryDelayMs: 300,
  maxFileSize: null,
  allowedMimeTypes: null,
  onUpload: null,
  onUploadSuccess: null,
  onUploadError: null,
  onInit: null,
  onDestroy: null,
  validateFile: null,
};

const EVENT_NAMES = {
  INIT: "init",
  DESTROY: "destroy",
  UPLOAD_START: "uploadStart",
  UPLOAD_SUCCESS: "uploadSuccess",
  UPLOAD_ERROR: "uploadError",
  UPLOAD_COMPLETE: "uploadComplete",
};

const GLOBAL_LISTENERS = Object.create(null);

function isFunction(value) {
  return typeof value === "function";
}

function normalizeEventName(eventName) {
  if (!eventName) throw new Error("Event name is required");
  return String(eventName);
}

function getEventSet(store, eventName) {
  const name = normalizeEventName(eventName);
  if (!store[name]) store[name] = new Set();
  return store[name];
}

function clearStore(store) {
  Object.values(store).forEach((set) => set.clear());
}

function validationResultFromValue(result) {
  if (result === true || typeof result === "undefined") return { valid: true };
  if (result === false) return { valid: false, reason: "Custom validator returned false" };
  if (typeof result === "string") return { valid: false, reason: result };

  if (result && typeof result === "object") {
    if (result.valid === false) {
      return { valid: false, reason: result.reason || "Validation failed", details: result.details };
    }
    if (result.valid === true) {
      return { valid: true, details: result.details };
    }
  }

  return { valid: Boolean(result), details: result };
}

function mimeTypeAllowed(allowedMimeTypes, mimeType) {
  if (!allowedMimeTypes || !Array.isArray(allowedMimeTypes) || allowedMimeTypes.length === 0) return true;
  if (!mimeType) return false;

  return allowedMimeTypes.some((rule) => {
    if (!rule) return false;
    if (rule instanceof RegExp) return rule.test(mimeType);
    const normalized = String(rule).toLowerCase();
    if (normalized.endsWith("/*")) {
      return mimeType.toLowerCase().startsWith(`${normalized.slice(0, -1)}`);
    }
    return mimeType.toLowerCase() === normalized;
  });
}

class Purrlet {
  /**
   * @param {Object} config
   * @param {string} [config.provider]
   * @param {string} [config.apiKey]
   * @param {string} [config.clientId]
   * @param {string} [config.cloudName]
   * @param {string} [config.uploadPreset]
   * @param {number} [config.requestTimeoutMs]
   * @param {number} [config.retries]
   * @param {number} [config.retryDelayMs]
   * @param {number} [config.maxFileSize]
   * @param {Array<string|RegExp>} [config.allowedMimeTypes]
   * @param {boolean} [config.debug]
   * @param {function} [config.onUpload]
   * @param {function} [config.onUploadSuccess]
   * @param {function} [config.onUploadError]
   * @param {function} [config.onInit]
   * @param {function} [config.onDestroy]
   * @param {function} [config.validateFile]
   */
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this._initPayload = null;
    this._isInitialized = false;
    this._isDestroyed = false;
    this._listeners = Object.create(null);

    if (!this.config.provider) {
      throw new Error("Purrlet: provider is required");
    }

    if (this.config.debug) {
      console.group("Purrlet Config");
      console.log(this.config);
      console.groupEnd();
    }

    const providerName = String(this.config.provider).toLowerCase();
    const ProviderClass = ProviderRegistry.get(providerName);
    if (!ProviderClass) {
      throw new Error(`Unsupported provider: ${this.config.provider}`);
    }

    this.config.provider = providerName;
    this.provider = new ProviderClass(this.config);

    this._registerConfigHooks();
    this._initPayload = this._createBasePayload();
    this._emit(EVENT_NAMES.INIT, this._initPayload);
    this._isInitialized = true;
  }

  _registerConfigHooks() {
    if (isFunction(this.config.onInit)) this.onInit(this.config.onInit);
    if (isFunction(this.config.onDestroy)) this.onDestroy(this.config.onDestroy);
    if (isFunction(this.config.onUploadSuccess)) this.onUploadSuccess(this.config.onUploadSuccess);
    if (isFunction(this.config.onUploadError)) this.onUploadError(this.config.onUploadError);
  }

  /**
   * Uploads a file using the selected provider.
   * @param {*} file
   * @param {Object} [options]
   * @param {AbortSignal} [options.signal]
   * @param {number} [options.timeoutMs]
   * @param {number} [options.retries]
   * @param {number} [options.retryDelayMs]
   * @returns {Promise<string>} uploaded file URL
   */
  async upload(file, options = {}) {
    this._assertNotDestroyed();

    const startedAt = Date.now();
    const payload = {
      ...this._createBasePayload(),
      file,
      startedAt,
    };

    this._emit(EVENT_NAMES.UPLOAD_START, payload);

    let uploadInput;
    try {
      uploadInput = await normalizeUploadInput(file);
      payload.filename = uploadInput.filename;
      payload.mimeType = uploadInput.value?.type || null;
      payload.size = typeof uploadInput.value?.size === "number" ? uploadInput.value.size : null;
    } catch (error) {
      payload.error = error;
      payload.durationMs = Date.now() - startedAt;
      this._emit(EVENT_NAMES.UPLOAD_ERROR, payload);
      this._emit(EVENT_NAMES.UPLOAD_COMPLETE, payload);
      throw error;
    }

    const validation = await this._validateWithBuiltIns(uploadInput, file, options.validateFile);
    payload.validation = validation;

    if (!validation.valid) {
      const error = validation.error || new Error(validation.reason || "File validation failed");
      payload.error = error;
      payload.durationMs = Date.now() - startedAt;
      this._emit(EVENT_NAMES.UPLOAD_ERROR, payload);
      this._emit(EVENT_NAMES.UPLOAD_COMPLETE, payload);
      throw error;
    }

    try {
      const url = await this.provider.upload(uploadInput, {
        signal: options.signal,
        timeoutMs: options.timeoutMs,
        retries: options.retries,
        retryDelayMs: options.retryDelayMs,
      });

      payload.url = url;
      payload.durationMs = Date.now() - startedAt;

      if (isFunction(this.config.onUpload)) this.config.onUpload(url, payload);
      this._emit(EVENT_NAMES.UPLOAD_SUCCESS, payload);
      this._emit(EVENT_NAMES.UPLOAD_COMPLETE, payload);
      return url;
    } catch (error) {
      payload.error = error;
      payload.durationMs = Date.now() - startedAt;
      this._emit(EVENT_NAMES.UPLOAD_ERROR, payload);
      this._emit(EVENT_NAMES.UPLOAD_COMPLETE, payload);
      throw error;
    }
  }

  /**
   * Upload many files with optional concurrency.
   * @param {Array<*>|Iterable<*>} files
   * @param {Object} [options]
   * @param {number} [options.concurrency]
   * @param {boolean} [options.stopOnError]
   * @returns {Promise<{results:Array<string|null>, errors:Array<{index:number,error:Error}>, successful:number, failed:number}>}
   */
  async uploadMany(files, options = {}) {
    this._assertNotDestroyed();

    const list = Array.isArray(files) ? files : Array.from(files || []);
    const concurrency = Math.max(1, Number(options.concurrency || 3));
    const stopOnError = Boolean(options.stopOnError);
    const results = new Array(list.length).fill(null);
    const errors = [];

    let index = 0;
    let stopped = false;

    const worker = async () => {
      while (true) {
        if (stopped) return;
        const current = index;
        index += 1;
        if (current >= list.length) return;

        try {
          results[current] = await this.upload(list[current], options);
        } catch (error) {
          errors.push({ index: current, error });
          if (stopOnError) {
            stopped = true;
            return;
          }
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, list.length) }, () => worker());
    await Promise.all(workers);

    return {
      results,
      errors,
      successful: list.length - errors.length,
      failed: errors.length,
    };
  }

  /**
   * Validates upload input before sending to provider.
   * @param {*} file
   * @param {function} [validator]
   * @returns {Promise<{valid: boolean, reason?: string, details?: any, error?: Error}>}
   */
  async validateFile(file, validator = this.config.validateFile) {
    this._assertNotDestroyed();

    const payload = { ...this._createBasePayload(), file };
    const normalized = await normalizeUploadInput(file);
    return this._validateWithBuiltIns(normalized, file, validator, payload);
  }

  ValidateFile(file, validator) {
    return this.validateFile(file, validator);
  }

  onInit(handler) {
    const unsubscribe = this.on(EVENT_NAMES.INIT, handler);
    if (this._isInitialized) {
      try {
        handler(this._initPayload || this._createBasePayload());
      } catch (error) {
        if (this.config.debug) console.error("[Purrlet] init handler error", error);
      }
    }
    return unsubscribe;
  }

  offInit(handler) {
    this.off(EVENT_NAMES.INIT, handler);
  }

  onDestroy(handler) {
    return this.on(EVENT_NAMES.DESTROY, handler);
  }

  offDestroy(handler) {
    this.off(EVENT_NAMES.DESTROY, handler);
  }

  onUploadStart(handler) {
    return this.on(EVENT_NAMES.UPLOAD_START, handler);
  }

  offUploadStart(handler) {
    this.off(EVENT_NAMES.UPLOAD_START, handler);
  }

  onUploadSuccess(handler) {
    return this.on(EVENT_NAMES.UPLOAD_SUCCESS, handler);
  }

  offUploadSuccess(handler) {
    this.off(EVENT_NAMES.UPLOAD_SUCCESS, handler);
  }

  onUploadError(handler) {
    return this.on(EVENT_NAMES.UPLOAD_ERROR, handler);
  }

  offUploadError(handler) {
    this.off(EVENT_NAMES.UPLOAD_ERROR, handler);
  }

  onUploadComplete(handler) {
    return this.on(EVENT_NAMES.UPLOAD_COMPLETE, handler);
  }

  offUploadComplete(handler) {
    this.off(EVENT_NAMES.UPLOAD_COMPLETE, handler);
  }

  on(eventName, handler) {
    this._assertNotDestroyed();
    if (!isFunction(handler)) throw new Error("Event handler must be a function");
    const eventSet = getEventSet(this._listeners, eventName);
    eventSet.add(handler);
    return () => this.off(eventName, handler);
  }

  off(eventName, handler) {
    const eventSet = getEventSet(this._listeners, eventName);
    eventSet.delete(handler);
  }

  once(eventName, handler) {
    if (!isFunction(handler)) throw new Error("Event handler must be a function");

    const wrapped = (payload) => {
      this.off(eventName, wrapped);
      handler(payload);
    };

    return this.on(eventName, wrapped);
  }

  emit(eventName, payload) {
    this._emit(eventName, payload);
  }

  destroy() {
    if (this._isDestroyed) return;
    this._emit(EVENT_NAMES.DESTROY, this._createBasePayload());
    clearStore(this._listeners);
    this._isDestroyed = true;
  }

  OnInit(handler) {
    return this.onInit(handler);
  }

  OnDestroy(handler) {
    return this.onDestroy(handler);
  }

  OnUploadSuccess(handler) {
    return this.onUploadSuccess(handler);
  }

  OnUploadError(handler) {
    return this.onUploadError(handler);
  }

  OnImageUploadSuccess(handler) {
    return this.onUploadSuccess(handler);
  }

  OnImageUploadFailed(handler) {
    return this.onUploadError(handler);
  }

  static registerProvider(name, providerClass) {
    if (!name || !providerClass) throw new Error("Name and class required");
    ProviderRegistry.set(String(name).toLowerCase(), providerClass);
  }

  static unregisterProvider(name) {
    if (!name) return;
    ProviderRegistry.delete(String(name).toLowerCase());
  }

  static hasProvider(name) {
    if (!name) return false;
    return ProviderRegistry.has(String(name).toLowerCase());
  }

  static listProviders() {
    return Array.from(ProviderRegistry.keys());
  }

  static onInit(handler) {
    return this.on(EVENT_NAMES.INIT, handler);
  }

  static offInit(handler) {
    this.off(EVENT_NAMES.INIT, handler);
  }

  static onDestroy(handler) {
    return this.on(EVENT_NAMES.DESTROY, handler);
  }

  static offDestroy(handler) {
    this.off(EVENT_NAMES.DESTROY, handler);
  }

  static onUploadStart(handler) {
    return this.on(EVENT_NAMES.UPLOAD_START, handler);
  }

  static offUploadStart(handler) {
    this.off(EVENT_NAMES.UPLOAD_START, handler);
  }

  static onUploadSuccess(handler) {
    return this.on(EVENT_NAMES.UPLOAD_SUCCESS, handler);
  }

  static offUploadSuccess(handler) {
    this.off(EVENT_NAMES.UPLOAD_SUCCESS, handler);
  }

  static onUploadError(handler) {
    return this.on(EVENT_NAMES.UPLOAD_ERROR, handler);
  }

  static offUploadError(handler) {
    this.off(EVENT_NAMES.UPLOAD_ERROR, handler);
  }

  static onUploadComplete(handler) {
    return this.on(EVENT_NAMES.UPLOAD_COMPLETE, handler);
  }

  static offUploadComplete(handler) {
    this.off(EVENT_NAMES.UPLOAD_COMPLETE, handler);
  }

  static on(eventName, handler) {
    if (!isFunction(handler)) throw new Error("Global event handler must be a function");
    const eventSet = getEventSet(GLOBAL_LISTENERS, eventName);
    eventSet.add(handler);
    return () => this.off(eventName, handler);
  }

  static off(eventName, handler) {
    const eventSet = getEventSet(GLOBAL_LISTENERS, eventName);
    eventSet.delete(handler);
  }

  static once(eventName, handler) {
    if (!isFunction(handler)) throw new Error("Global event handler must be a function");

    const wrapped = (payload) => {
      this.off(eventName, wrapped);
      handler(payload);
    };

    return this.on(eventName, wrapped);
  }

  static emit(eventName, payload) {
    this._emitGlobal(eventName, payload, false);
  }

  static async validateFile(file, validator) {
    return this._runValidation(file, validator, { provider: null, purrlet: null });
  }

  static ValidateFile(file, validator) {
    return this.validateFile(file, validator);
  }

  static OnInit(handler) {
    return this.onInit(handler);
  }

  static OnDestroy(handler) {
    return this.onDestroy(handler);
  }

  static OnUploadSuccess(handler) {
    return this.onUploadSuccess(handler);
  }

  static OnUploadError(handler) {
    return this.onUploadError(handler);
  }

  static OnImageUploadSuccess(handler) {
    return this.onUploadSuccess(handler);
  }

  static OnImageUploadFailed(handler) {
    return this.onUploadError(handler);
  }

  static async _runValidation(file, validator, contextPayload, options = {}) {
    const { skipInputCheck = false } = options;

    if (!skipInputCheck) {
      try {
        await normalizeUploadInput(file);
      } catch (error) {
        return { valid: false, reason: error.message, error };
      }
    }

    if (validator == null) return { valid: true };
    if (!isFunction(validator)) throw new Error("Purrlet: validateFile must be a function");

    try {
      const result = await validator(file, contextPayload);
      return validationResultFromValue(result);
    } catch (error) {
      return { valid: false, reason: error.message || "Validation failed", error };
    }
  }

  static _emitGlobal(eventName, payload, debug) {
    const handlers = getEventSet(GLOBAL_LISTENERS, eventName);
    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (error) {
        if (debug) {
          console.error(`[Purrlet] global ${eventName} handler error`, error);
        }
      }
    }
  }

  _createBasePayload() {
    return {
      provider: this.config.provider,
      purrlet: this,
    };
  }

  _assertNotDestroyed() {
    if (this._isDestroyed) throw new Error("Purrlet instance has been destroyed");
  }

  _emit(eventName, payload) {
    const handlers = getEventSet(this._listeners, eventName);
    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (error) {
        if (this.config.debug) {
          console.error(`[Purrlet] ${eventName} handler error`, error);
        }
      }
    }

    Purrlet._emitGlobal(eventName, payload, this.config.debug);
  }

  _runBuiltInValidation(uploadInput) {
    const maxFileSize = Number(this.config.maxFileSize || 0);
    if (maxFileSize > 0 && typeof uploadInput.value?.size === "number" && uploadInput.value.size > maxFileSize) {
      return {
        valid: false,
        reason: `File is too large. Max allowed is ${maxFileSize} bytes`,
      };
    }

    const mimeType = uploadInput.value?.type || "";
    if (!mimeTypeAllowed(this.config.allowedMimeTypes, mimeType)) {
      return {
        valid: false,
        reason: `MIME type not allowed: ${mimeType || "unknown"}`,
      };
    }

    return { valid: true };
  }

  async _validateWithBuiltIns(uploadInput, originalFile, validator, payload = this._createBasePayload()) {
    const builtIn = this._runBuiltInValidation(uploadInput);
    if (!builtIn.valid) return builtIn;

    const validationPayload = {
      ...payload,
      filename: uploadInput.filename,
      mimeType: uploadInput.value?.type || null,
      size: typeof uploadInput.value?.size === "number" ? uploadInput.value.size : null,
      uploadInput,
    };

    return Purrlet._runValidation(originalFile, validator ?? this.config.validateFile, validationPayload, {
      skipInputCheck: true,
    });
  }
}

const globalObject =
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof self !== "undefined"
        ? self
        : null;

if (globalObject) {
  globalObject.Purrlet = Purrlet;
}

export default Purrlet;
