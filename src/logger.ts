export type Logger = {
  readonly log: (...args: readonly unknown[]) => void;
  readonly warn: (...args: readonly unknown[]) => void;
  readonly error: (...args: readonly unknown[]) => void;
};

export function createLogger(
  scope: string,
  debug: boolean,
): Logger {
  const prefix = `[Purrlet:${scope}]`;

  return {
    log: (...args: readonly unknown[]): void => {
      if (!debug) return;

      console.log(prefix, ...args);
    },

    warn: (...args: readonly unknown[]): void => {
      if (!debug) return;

      console.warn(prefix, ...args);
    },

    error: (...args: readonly unknown[]): void => {
      console.error(prefix, ...args);
    },
  };
}
