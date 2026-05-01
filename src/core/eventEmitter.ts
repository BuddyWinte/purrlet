/**
 * Lightweight pub/sub event emitter for the Purrlet engine.
 *
 * Provides `on`, `off`, `once`, and `emit` methods that mirror the
 * Node.js `EventEmitter` API but without any class hierarchy or
 * external dependency. Internally stores listeners in a `Map<string, Set>`
 * so that duplicate registrations are impossible — adding the same
 * callback twice for the same event is a no-op.
 *
 * @module core/eventEmitter
 * @since 0.1.0
 */

"use strict";

import type { PurrletEvent } from "./types";

/** Generic callback signature accepted by the emitter. */
type Listener = (...args: any[]) => void;

/**
 * Creates a new event emitter instance.
 *
 * The returned object is a plain function closure — no `this` binding
 * or prototype chain is required, which keeps the bundle size minimal
 * and avoids common gotchas with method extraction.
 *
 * @returns An object with `on`, `off`, `emit`, `once`, and `removeAllListeners`.
 *
 * @example
 * ```ts
 * const ee = createEventEmitter();
 * ee.on('strokeStart', (p) => console.log('started', p));
 * ee.emit('strokeStart', { x: 10, y: 20 });
 * ee.removeAllListeners();
 * ```
 *
 * @since 0.1.0
 */
export function createEventEmitter() {
  /** Event name → set of listener callbacks. Using a Set deduplicates. */
  const listeners = new Map<string, Set<Listener>>();

  /**
   * Subscribe to an event. If the same `cb` is already registered for
   * this event the call is silently ignored (Set semantics).
   *
   * @param event — The event name to listen for.
   * @param cb    — Callback invoked when the event fires.
   */
  function on(event: PurrletEvent, cb: Listener): void {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(cb);
  }

  /**
   * Remove a previously registered listener.
   *
   * @param event — The event name.
   * @param cb    — The exact function reference passed to {@link on}.
   */
  function off(event: PurrletEvent, cb: Listener): void {
    listeners.get(event)?.delete(cb);
  }

  /**
   * Fire an event, invoking all registered callbacks synchronously
   * in insertion order. If no listeners are attached the call is
   * a cheap no-op.
   *
   * @param event — The event name to emit.
   * @param args  — Arbitrary payload forwarded to each listener.
   */
  function emit(event: string, ...args: any[]): void {
    const set = listeners.get(event);
    if (!set) return;
    for (const cb of set) {
      cb(...args);
    }
  }

  /**
   * Subscribe to an event for **exactly one** invocation, then
   * automatically unsubscribe.
   *
   * @param event — The event name.
   * @param cb    — Callback invoked at most once.
   */
  function once(event: PurrletEvent, cb: Listener): void {
    // Wrapper self-removes before forwarding to the real callback,
    // guaranteeing `cb` fires exactly once even if re-entrant.
    const wrapper: Listener = (...args: any[]) => {
      off(event, wrapper);
      cb(...args);
    };
    on(event, wrapper);
  }

  /**
   * Remove **all** listeners for **all** events.
   * Typically called during {@link Purrlet.destroy}.
   */
  function removeAllListeners(): void {
    listeners.clear();
  }

  return { on, off, emit, once, removeAllListeners };
}
