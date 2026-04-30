"use strict";

/*!
 * Purrlet v1.0.0
 *
 * A lightweight headless canvas drawing engine for indie sites and creative side projects. simple, fast, flexible.
 * meow
 *
 * Created by BuddyWinte and contributors
 * https://github.com/BuddyWinte/Purrlet
 *
 * SPDX-License-Identifier: MIT
 */

export type PurrletConfig = {
  debug?: boolean;
  plugins?: any[];
};

export class Purrlet {
  private config: PurrletConfig;
  constructor(config?: PurrletConfig) {
    this.config = config ?? {};
    if (this.config.debug) {
      console.log("[Purrlet] init", this.config);
    }
    this.initPlugins();
  }
  private initPlugins() {
    const plugins = this.config.plugins ?? [];
    for (const plugin of plugins) {
      if (typeof plugin?.init === "function") {
        const result = plugin.init(this);
        console.log("[Purrlet plugin init]:", result);
      }
    }
  }
}